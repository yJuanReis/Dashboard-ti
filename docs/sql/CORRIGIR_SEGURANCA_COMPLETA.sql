-- ═══════════════════════════════════════════════════════════════
-- 🔒 CORREÇÃO COMPLETA DE SEGURANÇA - POLÍTICAS RLS
-- ═══════════════════════════════════════════════════════════════
-- Execute este script no SQL Editor do Supabase Dashboard
-- 
-- OBJETIVO: Corrigir todas as vulnerabilidades de segurança detectadas
-- mantendo as funcionalidades idênticas do sistema.
--
-- DATA: 19/11/2025
-- TESTE PENTEST: 2 falhas críticas, 16 avisos
-- 
-- POLÍTICA DE SEGURANÇA:
-- - Admin: Acesso total a todos os dados e operações
-- - Usuário Comum: Acesso restrito baseado em propriedade e contexto
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- PARTE 1: FUNÇÃO AUXILIAR PARA VERIFICAR SE É ADMIN
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário explicativo
COMMENT ON FUNCTION public.is_admin() IS 
'Função auxiliar que verifica se o usuário autenticado atual é um administrador.
Retorna TRUE se o usuário tem role = admin, FALSE caso contrário.
SECURITY DEFINER garante que a função execute com privilégios do dono da função.';

-- ═══════════════════════════════════════════════════════════════
-- PARTE 2: USER_PROFILES - PERFIS DE USUÁRIOS
-- ═══════════════════════════════════════════════════════════════

-- Limpar políticas antigas
DROP POLICY IF EXISTS "allow_all_select" ON user_profiles;
DROP POLICY IF EXISTS "allow_all_update" ON user_profiles;
DROP POLICY IF EXISTS "allow_all_insert" ON user_profiles;
DROP POLICY IF EXISTS "allow_all_delete" ON user_profiles;
DROP POLICY IF EXISTS "rls_select_profiles" ON user_profiles;
DROP POLICY IF EXISTS "rls_update_profiles" ON user_profiles;
DROP POLICY IF EXISTS "rls_insert_profiles" ON user_profiles;
DROP POLICY IF EXISTS "rls_delete_profiles" ON user_profiles;
DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "admins_insert_profiles" ON user_profiles;
DROP POLICY IF EXISTS "admins_delete_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Usuários autenticados podem ler perfis" ON user_profiles;
DROP POLICY IF EXISTS "Apenas admins podem criar perfis" ON user_profiles;
DROP POLICY IF EXISTS "Apenas admins podem atualizar perfis" ON user_profiles;
DROP POLICY IF EXISTS "Apenas admins podem deletar perfis" ON user_profiles;

-- Garantir que RLS está ativo
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: Usuário vê o próprio perfil OU Admin vê todos
CREATE POLICY "user_profiles_select_policy"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  -- Vê o próprio perfil
  auth.uid() = user_id
  OR
  -- É admin (vê todos os perfis)
  public.is_admin()
);

-- UPDATE: Usuário atualiza o próprio perfil OU Admin atualiza qualquer um
CREATE POLICY "user_profiles_update_policy"
ON user_profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR
  public.is_admin()
)
WITH CHECK (
  auth.uid() = user_id
  OR
  public.is_admin()
);

-- INSERT: Apenas admins podem criar novos perfis
CREATE POLICY "user_profiles_insert_policy"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin()
);

-- DELETE: Apenas admins podem deletar perfis
CREATE POLICY "user_profiles_delete_policy"
ON user_profiles
FOR DELETE
TO authenticated
USING (
  public.is_admin()
);

-- Comentários explicativos
COMMENT ON POLICY "user_profiles_select_policy" ON user_profiles IS 
'Permite que usuários vejam apenas seu próprio perfil. Admins veem todos os perfis.';

COMMENT ON POLICY "user_profiles_update_policy" ON user_profiles IS 
'Permite que usuários atualizem apenas seu próprio perfil. Admins atualizam qualquer perfil.';

COMMENT ON POLICY "user_profiles_insert_policy" ON user_profiles IS 
'Apenas administradores podem criar novos perfis de usuários.';

COMMENT ON POLICY "user_profiles_delete_policy" ON user_profiles IS 
'Apenas administradores podem deletar perfis de usuários.';

-- ═══════════════════════════════════════════════════════════════
-- PARTE 3: PASSWORDS - SENHAS COMPARTILHADAS
-- ═══════════════════════════════════════════════════════════════
-- NOTA: Tabela de senhas é compartilhada entre toda a equipe de TI
-- Todos os usuários autenticados podem ver e gerenciar senhas
-- Admins têm controle total
-- ═══════════════════════════════════════════════════════════════

-- Limpar políticas antigas (se existirem)
DROP POLICY IF EXISTS "passwords_select_policy" ON passwords;
DROP POLICY IF EXISTS "passwords_insert_policy" ON passwords;
DROP POLICY IF EXISTS "passwords_update_policy" ON passwords;
DROP POLICY IF EXISTS "passwords_delete_policy" ON passwords;

-- Garantir que RLS está ativo
ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;

-- SELECT: Todos os usuários autenticados podem ver todas as senhas
CREATE POLICY "passwords_select_policy"
ON passwords
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Todos os usuários autenticados podem adicionar senhas
CREATE POLICY "passwords_insert_policy"
ON passwords
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Todos os usuários autenticados podem atualizar senhas
CREATE POLICY "passwords_update_policy"
ON passwords
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- DELETE: Apenas admins podem deletar senhas (segurança extra)
CREATE POLICY "passwords_delete_policy"
ON passwords
FOR DELETE
TO authenticated
USING (
  public.is_admin()
);

-- Comentários explicativos
COMMENT ON POLICY "passwords_select_policy" ON passwords IS 
'Permite que todos os usuários autenticados vejam todas as senhas (senhas compartilhadas da equipe de TI).';

COMMENT ON POLICY "passwords_insert_policy" ON passwords IS 
'Permite que todos os usuários autenticados adicionem novas senhas.';

COMMENT ON POLICY "passwords_update_policy" ON passwords IS 
'Permite que todos os usuários autenticados atualizem senhas existentes.';

COMMENT ON POLICY "passwords_delete_policy" ON passwords IS 
'Apenas administradores podem deletar senhas (proteção contra exclusão acidental).';

-- ═══════════════════════════════════════════════════════════════
-- PARTE 4: NVRS - GRAVADORES DE VÍDEO
-- ═══════════════════════════════════════════════════════════════
-- NOTA: NVRs são recursos compartilhados da infraestrutura
-- Todos da equipe podem visualizar e gerenciar
-- ═══════════════════════════════════════════════════════════════

-- Limpar políticas antigas (se existirem)
DROP POLICY IF EXISTS "nvrs_select_policy" ON nvrs;
DROP POLICY IF EXISTS "nvrs_insert_policy" ON nvrs;
DROP POLICY IF EXISTS "nvrs_update_policy" ON nvrs;
DROP POLICY IF EXISTS "nvrs_delete_policy" ON nvrs;

-- Garantir que RLS está ativo
ALTER TABLE nvrs ENABLE ROW LEVEL SECURITY;

-- SELECT: Todos os usuários autenticados podem ver NVRs
CREATE POLICY "nvrs_select_policy"
ON nvrs
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Todos os usuários autenticados podem adicionar NVRs
CREATE POLICY "nvrs_insert_policy"
ON nvrs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Todos os usuários autenticados podem atualizar NVRs
CREATE POLICY "nvrs_update_policy"
ON nvrs
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- DELETE: Apenas admins podem deletar NVRs
CREATE POLICY "nvrs_delete_policy"
ON nvrs
FOR DELETE
TO authenticated
USING (
  public.is_admin()
);

-- Comentários explicativos
COMMENT ON POLICY "nvrs_select_policy" ON nvrs IS 
'Permite que todos os usuários autenticados vejam informações dos NVRs.';

COMMENT ON POLICY "nvrs_insert_policy" ON nvrs IS 
'Permite que todos os usuários autenticados adicionem novos NVRs.';

COMMENT ON POLICY "nvrs_update_policy" ON nvrs IS 
'Permite que todos os usuários autenticados atualizem informações dos NVRs.';

COMMENT ON POLICY "nvrs_delete_policy" ON nvrs IS 
'Apenas administradores podem deletar NVRs do sistema.';

-- ═══════════════════════════════════════════════════════════════
-- PARTE 5: NVR_CONFIG - CONFIGURAÇÕES DO SISTEMA NVR
-- ═══════════════════════════════════════════════════════════════
-- NOTA: Configurações sensíveis do sistema
-- Todos podem LER, apenas admin pode MODIFICAR
-- ═══════════════════════════════════════════════════════════════

-- Limpar políticas antigas (se existirem)
DROP POLICY IF EXISTS "nvr_config_select_policy" ON nvr_config;
DROP POLICY IF EXISTS "nvr_config_insert_policy" ON nvr_config;
DROP POLICY IF EXISTS "nvr_config_update_policy" ON nvr_config;
DROP POLICY IF EXISTS "nvr_config_delete_policy" ON nvr_config;

-- Garantir que RLS está ativo
ALTER TABLE nvr_config ENABLE ROW LEVEL SECURITY;

-- SELECT: Todos os usuários autenticados podem ler configurações
CREATE POLICY "nvr_config_select_policy"
ON nvr_config
FOR SELECT
TO authenticated
USING (true);

-- INSERT: Apenas admins podem criar configurações
CREATE POLICY "nvr_config_insert_policy"
ON nvr_config
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin()
);

-- UPDATE: Apenas admins podem atualizar configurações
CREATE POLICY "nvr_config_update_policy"
ON nvr_config
FOR UPDATE
TO authenticated
USING (
  public.is_admin()
)
WITH CHECK (
  public.is_admin()
);

-- DELETE: Apenas admins podem deletar configurações
CREATE POLICY "nvr_config_delete_policy"
ON nvr_config
FOR DELETE
TO authenticated
USING (
  public.is_admin()
);

-- Comentários explicativos
COMMENT ON POLICY "nvr_config_select_policy" ON nvr_config IS 
'Permite que todos os usuários autenticados leiam as configurações do sistema.';

COMMENT ON POLICY "nvr_config_insert_policy" ON nvr_config IS 
'Apenas administradores podem criar novas configurações.';

COMMENT ON POLICY "nvr_config_update_policy" ON nvr_config IS 
'Apenas administradores podem modificar configurações existentes.';

COMMENT ON POLICY "nvr_config_delete_policy" ON nvr_config IS 
'Apenas administradores podem deletar configurações.';

-- ═══════════════════════════════════════════════════════════════
-- PARTE 6: LOGS - REGISTRO DE ATIVIDADES
-- ═══════════════════════════════════════════════════════════════
-- NOTA: Logs são críticos para auditoria
-- Todos podem INSERIR logs, apenas admin pode VER e DELETAR
-- ═══════════════════════════════════════════════════════════════

-- Limpar políticas antigas
DROP POLICY IF EXISTS "logs_select_policy" ON logs;
DROP POLICY IF EXISTS "logs_insert_policy" ON logs;
DROP POLICY IF EXISTS "logs_update_policy" ON logs;
DROP POLICY IF EXISTS "logs_delete_policy" ON logs;
DROP POLICY IF EXISTS "Permitir inserção de logs" ON logs;
DROP POLICY IF EXISTS "Permitir leitura de logs" ON logs;

-- Garantir que RLS está ativo
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- SELECT: Apenas admins podem ver logs (auditoria sensível)
CREATE POLICY "logs_select_policy"
ON logs
FOR SELECT
TO authenticated
USING (
  public.is_admin()
);

-- INSERT: Todos os usuários autenticados podem inserir logs
CREATE POLICY "logs_insert_policy"
ON logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Logs são imutáveis - ninguém pode atualizar
-- (não criar política de UPDATE = negar a todos)

-- DELETE: Apenas admins podem deletar logs (limpeza de auditoria)
CREATE POLICY "logs_delete_policy"
ON logs
FOR DELETE
TO authenticated
USING (
  public.is_admin()
);

-- Comentários explicativos
COMMENT ON POLICY "logs_select_policy" ON logs IS 
'Apenas administradores podem visualizar logs (dados de auditoria sensíveis).';

COMMENT ON POLICY "logs_insert_policy" ON logs IS 
'Todos os usuários autenticados podem inserir logs de suas atividades.';

COMMENT ON POLICY "logs_delete_policy" ON logs IS 
'Apenas administradores podem deletar logs antigos (manutenção de auditoria).';

-- ═══════════════════════════════════════════════════════════════
-- PARTE 7: VERIFICAÇÃO DE SEGURANÇA
-- ═══════════════════════════════════════════════════════════════

-- Verificar status do RLS em todas as tabelas
SELECT 
  schemaname as "Schema",
  tablename as "Tabela",
  CASE 
    WHEN rowsecurity THEN '✅ ATIVO'
    ELSE '❌ DESATIVADO'
  END as "RLS Status"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'passwords', 'nvrs', 'nvr_config', 'logs')
ORDER BY tablename;

-- Listar todas as políticas criadas
SELECT 
  schemaname as "Schema",
  tablename as "Tabela",
  policyname as "Política",
  cmd as "Comando",
  CASE 
    WHEN roles = '{authenticated}' THEN '🔐 Authenticated'
    WHEN roles = '{public}' THEN '🌍 Public'
    ELSE array_to_string(roles, ', ')
  END as "Roles"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'passwords', 'nvrs', 'nvr_config', 'logs')
ORDER BY tablename, cmd, policyname;

-- Verificar função is_admin()
SELECT 
  proname as "Função",
  prosecdef as "Security Definer",
  CASE 
    WHEN prosecdef THEN '✅ SECURITY DEFINER ativo'
    ELSE '⚠️ Security Definer NÃO ativo'
  END as "Status"
FROM pg_proc
WHERE proname = 'is_admin';

-- ═══════════════════════════════════════════════════════════════
-- RESUMO DA CONFIGURAÇÃO
-- ═══════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ POLÍTICAS DE SEGURANÇA APLICADAS COM SUCESSO';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 RESUMO DAS POLÍTICAS:';
  RAISE NOTICE '';
  RAISE NOTICE '1️⃣ USER_PROFILES:';
  RAISE NOTICE '   ✅ Admin: vê e gerencia TODOS os perfis';
  RAISE NOTICE '   ✅ Usuário: vê e edita APENAS o próprio perfil';
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣ PASSWORDS (senhas compartilhadas):';
  RAISE NOTICE '   ✅ Todos: visualizam, adicionam e editam senhas';
  RAISE NOTICE '   ⚠️ Apenas Admin: pode deletar senhas';
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣ NVRS (gravadores):';
  RAISE NOTICE '   ✅ Todos: visualizam, adicionam e editam NVRs';
  RAISE NOTICE '   ⚠️ Apenas Admin: pode deletar NVRs';
  RAISE NOTICE '';
  RAISE NOTICE '4️⃣ NVR_CONFIG (configurações):';
  RAISE NOTICE '   ✅ Todos: visualizam configurações';
  RAISE NOTICE '   ⚠️ Apenas Admin: modifica configurações';
  RAISE NOTICE '';
  RAISE NOTICE '5️⃣ LOGS (auditoria):';
  RAISE NOTICE '   ✅ Todos: podem inserir logs';
  RAISE NOTICE '   ⚠️ Apenas Admin: visualiza e deleta logs';
  RAISE NOTICE '   🔒 Logs são IMUTÁVEIS (não podem ser editados)';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '🔐 FUNCIONALIDADES MANTIDAS:';
  RAISE NOTICE '   ✅ Usuários comuns acessam senhas compartilhadas';
  RAISE NOTICE '   ✅ Usuários comuns gerenciam NVRs';
  RAISE NOTICE '   ✅ Admin tem controle total do sistema';
  RAISE NOTICE '   ✅ Logs protegidos contra manipulação';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 SEGURANÇA IMPLEMENTADA:';
  RAISE NOTICE '   ✅ RLS ativo em TODAS as tabelas';
  RAISE NOTICE '   ✅ Usuários NÃO veem dados de outros usuários';
  RAISE NOTICE '   ✅ Proteção contra exclusão acidental';
  RAISE NOTICE '   ✅ Logs de auditoria protegidos';
  RAISE NOTICE '';
  RAISE NOTICE '📝 PRÓXIMOS PASSOS:';
  RAISE NOTICE '   1. Teste o sistema como usuário comum';
  RAISE NOTICE '   2. Teste o sistema como admin';
  RAISE NOTICE '   3. Execute o teste de segurança em /security-test';
  RAISE NOTICE '   4. Verifique que os 2 erros críticos foram corrigidos';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

