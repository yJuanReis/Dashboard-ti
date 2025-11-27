-- ============================================
-- SCRIPT DE CONFIGURAÇÃO ADMIN - SUPABASE
-- ============================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- Este script cria funções seguras para permitir que admins
-- alterem senhas e excluam usuários do sistema
--
-- 📋 PASSO A PASSO COMPLETO:
--
-- 1. Execute TODO este script no SQL Editor do Supabase
--    (Copie e cole tudo, depois clique em "Run")
--
-- 2. IMPORTANTE: Na seção "PASSO 1" abaixo, substitua 
--    'seu-email@exemplo.com' pelo email REAL do seu usuário
--    e execute APENAS essa query novamente
--
-- 3. (Opcional) Execute as queries de verificação na seção "PASSO 2"
--    para confirmar que tudo está funcionando
--
-- 4. Pronto! As funções executam operações com permissões elevadas
--    de forma segura no servidor, sem necessidade de credenciais no frontend
--
-- 5. Faça logout e login novamente na aplicação
--    Você deve ver o painel administrativo aparecer!
-- ============================================

-- ============================================
-- CRIAR TABELA DE AUDITORIA (se não existir)
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_user_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at);

-- RLS para tabela de auditoria
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Remover policy antiga se existir
DROP POLICY IF EXISTS "Admins podem ver logs de auditoria" ON public.admin_audit_log;

-- Apenas admins podem ver os logs de auditoria
CREATE POLICY "Admins podem ver logs de auditoria" ON public.admin_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- REMOVER FUNÇÕES ANTIGAS (se existirem)
-- ============================================
-- Necessário para atualizar funções que mudaram de assinatura
DROP FUNCTION IF EXISTS public.update_user_password_by_admin(UUID, TEXT);
DROP FUNCTION IF EXISTS public.delete_user_by_admin(UUID);
DROP FUNCTION IF EXISTS public.validate_admin_password_change(UUID, TEXT);
DROP FUNCTION IF EXISTS public.is_admin();

-- ============================================
-- FUNÇÃO: Verificar se usuário é admin
-- ============================================
-- Função auxiliar para verificar se o usuário atual é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNÇÃO: Atualizar senha de usuário (Admin)
-- ============================================
-- Valida permissões e executa alteração de senha de forma segura
-- Usa SECURITY DEFINER para ter privilégios necessários
CREATE OR REPLACE FUNCTION public.update_user_password_by_admin(
  target_user_id UUID,
  new_password TEXT
)
RETURNS JSON AS $$
DECLARE
  target_user_record RECORD;
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar senhas';
  END IF;

  -- Verificar se o usuário alvo existe e obter informações
  SELECT id, email INTO target_user_record
  FROM auth.users
  WHERE id = target_user_id;

  IF target_user_record IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Validar comprimento da senha
  IF length(new_password) < 6 THEN
    RAISE EXCEPTION 'A senha deve ter no mínimo 6 caracteres';
  END IF;

  -- Atualizar a senha no auth.users usando SECURITY DEFINER
  -- Esta função executa com privilégios elevados de forma segura
  UPDATE auth.users
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = target_user_id;

  -- Registrar auditoria
  INSERT INTO public.admin_audit_log (
    admin_id,
    action,
    target_user_id,
    details
  ) VALUES (
    auth.uid(),
    'update_password',
    target_user_id,
    json_build_object('target_email', target_user_record.email)
  );

  RETURN json_build_object(
    'success', true,
    'message', 'Senha alterada com sucesso.',
    'user_id', target_user_id,
    'email', target_user_record.email
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNÇÃO: Deletar usuário (Admin)
-- ============================================
-- Permite que admins excluam usuários do sistema completamente
-- Remove do user_profiles E do auth.users de forma segura
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(
  target_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  target_email TEXT;
  current_user_id UUID;
BEGIN
  -- Obter o ID do usuário atual
  current_user_id := auth.uid();
  
  -- Verificar se o usuário atual é admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem excluir usuários';
  END IF;

  -- Verificar se está tentando excluir a si mesmo
  IF target_user_id = current_user_id THEN
    RAISE EXCEPTION 'Você não pode excluir a si mesmo';
  END IF;

  -- Verificar se o usuário alvo existe e obter email
  SELECT email INTO target_email
  FROM auth.users
  WHERE id = target_user_id;

  IF target_email IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Registrar auditoria ANTES de excluir
  INSERT INTO public.admin_audit_log (
    admin_id,
    action,
    target_user_id,
    details
  ) VALUES (
    current_user_id,
    'delete_user',
    target_user_id,
    json_build_object('target_email', target_email)
  );

  -- Deletar o perfil do usuário da tabela user_profiles primeiro
  DELETE FROM public.user_profiles
  WHERE user_id = target_user_id;

  -- Deletar o usuário do auth.users usando SECURITY DEFINER
  -- Esta função executa com privilégios elevados de forma segura
  DELETE FROM auth.users
  WHERE id = target_user_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Usuário excluído com sucesso do sistema.',
    'user_id', target_user_id,
    'email', target_email
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNÇÃO ALTERNATIVA: Atualizar senha via Admin API
-- ============================================
-- Esta função é um wrapper que valida permissões
-- A alteração real deve ser feita via Edge Function ou Admin API
CREATE OR REPLACE FUNCTION public.validate_admin_password_change(
  target_user_id UUID,
  new_password TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Apenas valida se o usuário atual é admin
  -- A alteração real deve ser feita no frontend usando Admin API
  RETURN public.is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
-- Garantir que as funções sejam executáveis por usuários autenticados
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_password_by_admin(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_by_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_admin_password_change(UUID, TEXT) TO authenticated;

-- ============================================
-- PASSO 1: PROMOVER USUÁRIO A ADMIN
-- ============================================
-- ⚠️ IMPORTANTE: Substitua 'seu-email@exemplo.com' pelo email REAL do seu usuário
-- Execute esta query APENAS UMA VEZ após criar o usuário no Supabase Auth
-- 
-- COMO ENCONTRAR SEU EMAIL:
-- 1. Vá em Authentication > Users no Supabase Dashboard
-- 2. Copie o email do usuário que você quer promover
-- 3. Cole no lugar de 'seu-email@exemplo.com' abaixo
-- 4. Execute esta query

UPDATE public.user_profiles 
SET role = 'admin' 
WHERE email = 'seu-email@exemplo.com';  -- ⚠️ SUBSTITUA PELO SEU EMAIL REAL!

-- ============================================
-- PASSO 2: VERIFICAÇÕES (OPCIONAL - Execute para confirmar)
-- ============================================
-- Execute estas queries uma por uma para verificar se tudo está funcionando:

-- Verificar se as funções foram criadas corretamente:
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%admin%';
-- Resultado esperado: Deve mostrar 4 funções (is_admin, update_user_password_by_admin, delete_user_by_admin, validate_admin_password_change)

-- Verificar todos os usuários e suas roles:
SELECT up.email, up.role, up.created_at
FROM public.user_profiles up
ORDER BY up.created_at DESC;
-- Resultado esperado: Deve mostrar todos os usuários, incluindo o que você promoveu a admin

-- Verificar se você é admin (execute enquanto estiver logado):
SELECT public.is_admin();
-- Resultado esperado: Deve retornar 'true' se você for admin, 'false' caso contrário

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. SEGURANÇA: As funções executam com SECURITY DEFINER
--    Todas as operações (incluindo alteração de senha e exclusão de usuários)
--    são feitas de forma segura no servidor, sem necessidade de credenciais
--    no frontend.
--
-- 2. VALIDAÇÃO: As funções validam permissões de admin antes de executar
--    qualquer operação sensível. Apenas usuários com role='admin' podem
--    alterar senhas e excluir usuários.
--
-- 3. AUDITORIA: Todas as operações administrativas são registradas na
--    tabela admin_audit_log para rastreabilidade completa.
--
-- 4. NENHUMA CONFIGURAÇÃO ADICIONAL NECESSÁRIA:
--    ✅ Não é necessário configurar service_role key no frontend
--    ✅ Não é necessário usar Admin API do Supabase no cliente
--    ✅ Tudo é executado de forma segura via RPC no servidor
--
-- 5. COMO FUNCIONA:
--    - Frontend chama RPC function (ex: update_user_password_by_admin)
--    - Função valida se usuário atual é admin
--    - Se autorizado, executa operação com privilégios elevados
--    - Operação é auditada automaticamente
--
-- 6. IDEAL PARA PRODUÇÃO:
--    Esta arquitetura é segura e recomendada para ambientes de produção,
--    pois não expõe nenhuma credencial sensível no frontend.

