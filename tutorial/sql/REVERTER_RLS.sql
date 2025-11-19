-- ═══════════════════════════════════════════════════════════════
-- REVERTER RLS - RESTAURAR ACESSO
-- ═══════════════════════════════════════════════════════════════
-- Execute AGORA para restaurar acesso
-- ═══════════════════════════════════════════════════════════════

-- Remover todas as políticas restritivas
DROP POLICY IF EXISTS "rls_select_profiles" ON user_profiles;
DROP POLICY IF EXISTS "rls_update_profiles" ON user_profiles;
DROP POLICY IF EXISTS "rls_insert_profiles" ON user_profiles;
DROP POLICY IF EXISTS "rls_delete_profiles" ON user_profiles;

-- Criar políticas PERMISSIVAS
CREATE POLICY "allow_all_select" 
ON user_profiles 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "allow_all_update" 
ON user_profiles 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "allow_all_insert" 
ON user_profiles 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "allow_all_delete" 
ON user_profiles 
FOR DELETE 
TO authenticated
USING (true);

-- RLS continua ativo, mas permite tudo para authenticated
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Verificar
SELECT 'RLS REVERTIDO - ACESSO RESTAURADO' as status;

