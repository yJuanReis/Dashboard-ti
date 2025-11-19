-- ============================================
-- 🚀 SETUP COMPLETO PARA ADMIN - SUPABASE
-- ============================================
-- Execute ESTE SCRIPT COMPLETO no SQL Editor do Supabase Dashboard
-- Ele vai criar todas as tabelas, funções e promover você a admin
--
-- 📋 PASSO A PASSO:
-- 1. Copie TODO este script
-- 2. Cole no SQL Editor do Supabase (Menu: SQL Editor)
-- 3. IMPORTANTE: Na linha 265, substitua 'seu-email@exemplo.com' pelo seu email REAL
-- 4. Clique em "Run" ou pressione Ctrl+Enter
-- 5. Faça logout e login novamente na aplicação
-- 6. A página Configurações deve aparecer agora!
-- ============================================

-- ============================================
-- PARTE 1: CRIAR TABELA USER_PROFILES
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  page_permissions TEXT[] DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentário na coluna page_permissions
COMMENT ON COLUMN public.user_profiles.page_permissions IS 
'Array de rotas permitidas para o usuário. NULL ou [] = acesso total. 
Ex: ["/home", "/senhas"]. Administradores têm acesso a todas as páginas automaticamente.';

-- ============================================
-- PARTE 2: ÍNDICES PARA MELHOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_page_permissions ON public.user_profiles USING GIN (page_permissions);

-- ============================================
-- PARTE 3: HABILITAR RLS (Row Level Security)
-- ============================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PARTE 4: REMOVER POLÍTICAS ANTIGAS (SE EXISTIREM)
-- ============================================

DROP POLICY IF EXISTS "Usuários autenticados podem ler perfis" ON public.user_profiles;
DROP POLICY IF EXISTS "Apenas admins podem criar perfis" ON public.user_profiles;
DROP POLICY IF EXISTS "Apenas admins podem atualizar perfis" ON public.user_profiles;
DROP POLICY IF EXISTS "Apenas admins podem deletar perfis" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins podem atualizar permissões de páginas" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins podem atualizar qualquer campo" ON public.user_profiles;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios perfis" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON public.user_profiles;

-- ============================================
-- PARTE 5: CRIAR POLÍTICAS RLS CORRETAS
-- ============================================

-- Política: Usuários podem ver seu próprio perfil
CREATE POLICY "Usuários podem ver seus próprios perfis"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Política: Admins podem ver todos os perfis
CREATE POLICY "Admins podem ver todos os perfis"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Política: Admins podem criar perfis
CREATE POLICY "Admins podem criar perfis"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Política: Admins podem atualizar qualquer perfil
CREATE POLICY "Admins podem atualizar perfis"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Política: Admins podem deletar perfis
CREATE POLICY "Admins podem deletar perfis"
  ON public.user_profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Política: Usuários podem atualizar seu próprio nome
CREATE POLICY "Usuários podem atualizar seu próprio nome"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- PARTE 6: TRIGGER PARA ATUALIZAR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PARTE 7: TRIGGER PARA CRIAR PERFIL AUTOMATICAMENTE
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, nome, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PARTE 8: CRIAR TABELA DE AUDITORIA
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_user_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins podem ver logs de auditoria" ON public.admin_audit_log;

CREATE POLICY "Admins podem ver logs de auditoria" ON public.admin_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- PARTE 9: FUNÇÕES ADMIN (Alteração de Senha e Exclusão)
-- ============================================

-- Remover funções antigas
DROP FUNCTION IF EXISTS public.update_user_password_by_admin(UUID, TEXT);
DROP FUNCTION IF EXISTS public.delete_user_by_admin(UUID);
DROP FUNCTION IF EXISTS public.validate_admin_password_change(UUID, TEXT);
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.has_page_permission(TEXT);
DROP FUNCTION IF EXISTS public.update_user_page_permissions(UUID, TEXT[]);

-- Função: Verificar se usuário é admin
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

-- Função: Verificar permissão de página
CREATE OR REPLACE FUNCTION public.has_page_permission(page_path TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  user_permissions TEXT[];
BEGIN
  SELECT role, COALESCE(page_permissions, NULL) 
  INTO user_role, user_permissions
  FROM public.user_profiles
  WHERE user_id = auth.uid();
  
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  IF user_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  IF user_permissions IS NULL OR array_length(user_permissions, 1) IS NULL OR array_length(user_permissions, 1) = 0 THEN
    RETURN TRUE;
  END IF;
  
  RETURN page_path = ANY(user_permissions);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: Atualizar permissões de página (RPC)
CREATE OR REPLACE FUNCTION public.update_user_page_permissions(
  target_user_id UUID,
  new_permissions TEXT[]
)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem atualizar permissões';
  END IF;
  
  UPDATE public.user_profiles
  SET page_permissions = new_permissions
  WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: Atualizar senha de usuário (Admin)
CREATE OR REPLACE FUNCTION public.update_user_password_by_admin(
  target_user_id UUID,
  new_password TEXT
)
RETURNS JSON AS $$
DECLARE
  target_user_record RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar senhas';
  END IF;

  SELECT id, email INTO target_user_record
  FROM auth.users
  WHERE id = target_user_id;

  IF target_user_record IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  IF length(new_password) < 6 THEN
    RAISE EXCEPTION 'A senha deve ter no mínimo 6 caracteres';
  END IF;

  UPDATE auth.users
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = target_user_id;

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

-- Função: Deletar usuário (Admin)
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(
  target_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  target_email TEXT;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem excluir usuários';
  END IF;

  IF target_user_id = current_user_id THEN
    RAISE EXCEPTION 'Você não pode excluir a si mesmo';
  END IF;

  SELECT email INTO target_email
  FROM auth.users
  WHERE id = target_user_id;

  IF target_email IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

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

  DELETE FROM public.user_profiles
  WHERE user_id = target_user_id;

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
-- PARTE 10: GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_page_permission(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_page_permissions(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_password_by_admin(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_by_admin(UUID) TO authenticated;

-- ============================================
-- 🔥 PARTE 11: PROMOVER SEU USUÁRIO A ADMIN
-- ============================================
-- ⚠️ IMPORTANTE: SUBSTITUA 'seu-email@exemplo.com' pelo seu email REAL!
-- ⚠️ Este é o passo MAIS IMPORTANTE do script!

-- OPÇÃO 1: Se você já tem um usuário criado no Supabase Auth
-- Primeiro, inserir ou atualizar o perfil na tabela user_profiles
INSERT INTO public.user_profiles (user_id, email, nome, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'nome', raw_user_meta_data->>'name', email),
  'admin'
FROM auth.users
WHERE email = 'seu-email@exemplo.com'  -- ⚠️ SUBSTITUA PELO SEU EMAIL REAL!
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin';

-- OPÇÃO 2: Se você não tem certeza qual é o email, liste todos os usuários
-- Descomente a linha abaixo para ver todos os usuários:
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- ============================================
-- PARTE 12: VERIFICAÇÕES FINAIS
-- ============================================

-- Verificar se a tabela foi criada
SELECT 'user_profiles' as tabela, COUNT(*) as total_usuarios
FROM public.user_profiles;

-- Verificar seu usuário admin
SELECT 
  up.email, 
  up.nome,
  up.role, 
  up.page_permissions,
  up.created_at
FROM public.user_profiles up
WHERE up.role = 'admin';

-- Verificar se as funções foram criadas
SELECT 
  routine_name as funcao, 
  routine_type as tipo
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_admin', 'has_page_permission', 'update_user_password_by_admin', 'delete_user_by_admin')
ORDER BY routine_name;

-- ============================================
-- 🎉 PRONTO!
-- ============================================
-- Se tudo correu bem, você deve ver:
-- 1. A tabela user_profiles com pelo menos 1 usuário
-- 2. Seu email com role = 'admin'
-- 3. 4 funções criadas (is_admin, has_page_permission, etc.)
--
-- PRÓXIMOS PASSOS:
-- 1. Faça logout da aplicação
-- 2. Faça login novamente
-- 3. A página "Configurações" deve aparecer no menu lateral
-- 4. Você deve conseguir acessar /configuracoes
--
-- Se ainda não funcionar, verifique:
-- - Se substituiu 'seu-email@exemplo.com' pelo email correto
-- - Se o email está exatamente como aparece no Supabase Auth
-- - Se fez logout/login após executar o script
-- ============================================

