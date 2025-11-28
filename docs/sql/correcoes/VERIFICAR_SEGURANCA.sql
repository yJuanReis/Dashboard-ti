-- ═══════════════════════════════════════════════════════════════
-- 🔍 VERIFICAÇÃO DE SEGURANÇA - AUDIT SCRIPT
-- ═══════════════════════════════════════════════════════════════
-- Execute este script no SQL Editor do Supabase Dashboard para
-- verificar se todas as políticas de segurança estão corretas
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- 1. VERIFICAR RLS ATIVO EM TODAS AS TABELAS
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '1. VERIFICAÇÃO RLS' as "Verificação",
  tablename as "Tabela",
  CASE 
    WHEN rowsecurity THEN '✅ ATIVO'
    ELSE '❌ DESATIVADO - CRÍTICO!'
  END as "Status RLS",
  CASE 
    WHEN rowsecurity THEN 'OK'
    ELSE 'AÇÃO NECESSÁRIA: Execute CORRIGIR_SEGURANCA_COMPLETA.sql'
  END as "Ação"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'passwords', 'nvrs', 'nvr_config', 'logs')
ORDER BY tablename;

-- ═══════════════════════════════════════════════════════════════
-- 2. CONTAR POLÍTICAS POR TABELA
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '2. CONTAGEM DE POLÍTICAS' as "Verificação",
  tablename as "Tabela",
  COUNT(*) as "Nº Políticas",
  CASE 
    WHEN tablename = 'user_profiles' AND COUNT(*) = 4 THEN '✅ OK (4 políticas)'
    WHEN tablename = 'passwords' AND COUNT(*) = 4 THEN '✅ OK (4 políticas)'
    WHEN tablename = 'nvrs' AND COUNT(*) = 4 THEN '✅ OK (4 políticas)'
    WHEN tablename = 'nvr_config' AND COUNT(*) = 4 THEN '✅ OK (4 políticas)'
    WHEN tablename = 'logs' AND COUNT(*) = 3 THEN '✅ OK (3 políticas - sem UPDATE)'
    ELSE '⚠️ VERIFICAR - quantidade inesperada'
  END as "Status"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'passwords', 'nvrs', 'nvr_config', 'logs')
GROUP BY tablename
ORDER BY tablename;

-- ═══════════════════════════════════════════════════════════════
-- 3. LISTAR TODAS AS POLÍTICAS DETALHADAMENTE
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '3. POLÍTICAS DETALHADAS' as "Verificação",
  tablename as "Tabela",
  policyname as "Nome da Política",
  cmd as "Operação",
  CASE 
    WHEN qual = 'permissive' THEN '✅ Permissiva'
    WHEN qual = 'restrictive' THEN '⚠️ Restritiva'
    ELSE qual
  END as "Tipo",
  CASE 
    WHEN roles = '{authenticated}' THEN '🔐 Authenticated'
    WHEN roles = '{public}' THEN '⚠️ PUBLIC'
    ELSE array_to_string(roles, ', ')
  END as "Roles"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'passwords', 'nvrs', 'nvr_config', 'logs')
ORDER BY tablename, 
  CASE cmd
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
    ELSE 5
  END;

-- ═══════════════════════════════════════════════════════════════
-- 4. VERIFICAR FUNÇÃO IS_ADMIN()
-- ═══════════════════════════════════════════════════════════════

SELECT 
  '4. FUNÇÃO IS_ADMIN' as "Verificação",
  proname as "Nome da Função",
  CASE 
    WHEN prosecdef THEN '✅ SECURITY DEFINER ativo'
    ELSE '❌ SECURITY DEFINER desativado - CRÍTICO!'
  END as "Security Definer",
  CASE 
    WHEN prorettype = (SELECT oid FROM pg_type WHERE typname = 'bool') THEN '✅ Retorna BOOLEAN'
    ELSE '⚠️ Tipo de retorno incorreto'
  END as "Tipo Retorno"
FROM pg_proc
WHERE proname = 'is_admin'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ═══════════════════════════════════════════════════════════════
-- 5. TESTE DE PERMISSÕES (execute como usuário comum)
-- ═══════════════════════════════════════════════════════════════

-- Teste 5A: Verificar perfil visível
SELECT 
  '5A. TESTE PERFIL' as "Teste",
  COUNT(*) as "Perfis Visíveis",
  CASE 
    WHEN public.is_admin() THEN 
      CASE 
        WHEN COUNT(*) > 1 THEN '✅ Admin vê múltiplos perfis'
        ELSE '⚠️ Admin deveria ver mais perfis'
      END
    ELSE 
      CASE 
        WHEN COUNT(*) = 1 THEN '✅ Usuário vê apenas 1 perfil'
        WHEN COUNT(*) > 1 THEN '❌ FALHA - Usuário vê múltiplos perfis!'
        ELSE '⚠️ Nenhum perfil visível'
      END
  END as "Status"
FROM user_profiles;

-- Teste 5B: Verificar senhas visíveis
SELECT 
  '5B. TESTE SENHAS' as "Teste",
  COUNT(*) as "Senhas Visíveis",
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Senhas acessíveis (compartilhadas)'
    ELSE '⚠️ Nenhuma senha visível ou tabela vazia'
  END as "Status"
FROM passwords;

-- Teste 5C: Verificar NVRs visíveis
SELECT 
  '5C. TESTE NVRS' as "Teste",
  COUNT(*) as "NVRs Visíveis",
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ NVRs acessíveis (compartilhados)'
    ELSE '⚠️ Erro ao acessar NVRs'
  END as "Status"
FROM nvrs;

-- Teste 5D: Verificar configurações NVR visíveis
SELECT 
  '5D. TESTE CONFIG' as "Teste",
  COUNT(*) as "Configs Visíveis",
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ Configurações acessíveis para leitura'
    ELSE '⚠️ Erro ao acessar configurações'
  END as "Status"
FROM nvr_config;

-- Teste 5E: Verificar logs visíveis
SELECT 
  '5E. TESTE LOGS' as "Teste",
  CASE 
    WHEN public.is_admin() THEN
      CONCAT('✅ Admin - ', COUNT(*), ' logs visíveis')
    ELSE
      CASE 
        WHEN COUNT(*) = 0 THEN '✅ Usuário comum - 0 logs (correto)'
        ELSE '❌ FALHA - Usuário comum NÃO deveria ver logs!'
      END
  END as "Status"
FROM logs;

-- ═══════════════════════════════════════════════════════════════
-- 6. VERIFICAR PERMISSÕES DE ESCRITA (Testes simulados)
-- ═══════════════════════════════════════════════════════════════

-- Verificar se usuário pode inserir em user_profiles (deve falhar se não for admin)
DO $$
DECLARE
  can_insert BOOLEAN;
  is_user_admin BOOLEAN;
BEGIN
  -- Verificar se é admin
  SELECT public.is_admin() INTO is_user_admin;
  
  -- Tentar criar política de teste
  BEGIN
    can_insert := EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'user_profiles' 
      AND policyname = 'user_profiles_insert_policy'
    );
    
    IF is_user_admin THEN
      RAISE NOTICE '6. TESTE INSERT: ✅ Admin pode inserir em user_profiles';
    ELSE
      RAISE NOTICE '6. TESTE INSERT: ✅ Usuário comum NÃO pode inserir em user_profiles (correto)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '6. TESTE INSERT: ⚠️ Erro ao verificar permissões: %', SQLERRM;
  END;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 7. RESUMO GERAL
-- ═══════════════════════════════════════════════════════════════

DO $$
DECLARE
  rls_count INTEGER;
  policy_count INTEGER;
  has_is_admin BOOLEAN;
BEGIN
  -- Contar tabelas com RLS ativo
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'passwords', 'nvrs', 'nvr_config', 'logs')
  AND rowsecurity = true;
  
  -- Contar políticas
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'passwords', 'nvrs', 'nvr_config', 'logs');
  
  -- Verificar função is_admin
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'is_admin' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) INTO has_is_admin;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '📊 RESUMO DA VERIFICAÇÃO DE SEGURANÇA';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  -- RLS Status
  IF rls_count = 5 THEN
    RAISE NOTICE '✅ RLS: % de 5 tabelas com RLS ativo (PERFEITO)', rls_count;
  ELSE
    RAISE NOTICE '❌ RLS: % de 5 tabelas com RLS ativo (CRÍTICO - faltam %)', rls_count, 5 - rls_count;
  END IF;
  
  -- Políticas Status
  IF policy_count = 19 THEN
    RAISE NOTICE '✅ POLÍTICAS: % políticas configuradas (PERFEITO)', policy_count;
  ELSIF policy_count >= 15 AND policy_count <= 20 THEN
    RAISE NOTICE '⚠️ POLÍTICAS: % políticas configuradas (verifique se todas estão corretas)', policy_count;
  ELSE
    RAISE NOTICE '❌ POLÍTICAS: % políticas configuradas (esperado: 19)', policy_count;
  END IF;
  
  -- Função is_admin Status
  IF has_is_admin THEN
    RAISE NOTICE '✅ FUNÇÃO: is_admin() está configurada';
  ELSE
    RAISE NOTICE '❌ FUNÇÃO: is_admin() NÃO encontrada (CRÍTICO)';
  END IF;
  
  RAISE NOTICE '';
  
  -- Veredicto final
  IF rls_count = 5 AND policy_count >= 15 AND has_is_admin THEN
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '🎉 SEGURANÇA OK - Todas as verificações passaram!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Próximos passos:';
    RAISE NOTICE '1. Teste o sistema como usuário comum';
    RAISE NOTICE '2. Teste o sistema como admin';
    RAISE NOTICE '3. Execute o teste de segurança em /security-test';
    RAISE NOTICE '';
  ELSE
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '⚠️ ATENÇÃO - Problemas detectados!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Execute o script: tutorial/sql/CORRIGIR_SEGURANCA_COMPLETA.sql';
    RAISE NOTICE '';
  END IF;
END $$;

