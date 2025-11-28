-- ═══════════════════════════════════════════════════════════════
-- CORREÇÃO CRÍTICA: RLS - ACESSO NÃO AUTORIZADO
-- ═══════════════════════════════════════════════════════════════
-- PROBLEMA: Usuários comuns conseguem acessar dados de outros usuários
-- SOLUÇÃO: Admin vê tudo, usuário comum vê só seus dados
-- ═══════════════════════════════════════════════════════════════

-- Limpar políticas antigas
DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "admins_insert_profiles" ON user_profiles;
DROP POLICY IF EXISTS "admins_delete_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;

-- ===== USER_PROFILES: SELECT =====
-- Usuário comum: só vê o próprio perfil
-- Admin: vê todos os perfis
CREATE POLICY "rls_select_profiles" 
ON user_profiles 
FOR SELECT 
USING (
  -- Vê o próprio perfil OU
  auth.uid() = user_id
  OR
  -- É admin (vê todos)
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.role = 'admin'
  )
);

-- ===== USER_PROFILES: UPDATE =====
-- Usuário comum: só atualiza o próprio perfil
-- Admin: atualiza qualquer perfil
CREATE POLICY "rls_update_profiles" 
ON user_profiles 
FOR UPDATE 
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.role = 'admin'
  )
);

-- ===== USER_PROFILES: INSERT =====
-- Apenas admins podem criar perfis
CREATE POLICY "rls_insert_profiles" 
ON user_profiles 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.role = 'admin'
  )
);

-- ===== USER_PROFILES: DELETE =====
-- Apenas admins podem deletar perfis
CREATE POLICY "rls_delete_profiles" 
ON user_profiles 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.role = 'admin'
  )
);

-- ===== GARANTIR RLS ATIVO =====
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ===== VERIFICAÇÃO =====
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS ATIVO'
    ELSE '❌ RLS DESATIVADO'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'user_profiles'
ORDER BY tablename;

-- Listar políticas ativas
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN roles = '{public}' THEN 'PUBLIC'
    ELSE array_to_string(roles, ', ')
  END as roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'user_profiles'
ORDER BY tablename, cmd, policyname;

