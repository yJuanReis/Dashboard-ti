-- ============================================
-- CORREÇÃO DE RLS PARA LOGIN FUNCIONAR
-- ============================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- Este script corrige o erro 400 ao verificar user_profiles durante o login
-- ============================================

-- ============================================
-- 1. REMOVER POLÍTICAS ANTIGAS (se existirem)
-- ============================================
DROP POLICY IF EXISTS "Usuários autenticados podem ler perfis" ON public.user_profiles;
DROP POLICY IF EXISTS "rls_select_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.user_profiles;

-- ============================================
-- 2. CRIAR POLÍTICA CORRIGIDA PARA SELECT
-- ============================================
-- IMPORTANTE: Usuários autenticados devem poder ver SEU PRÓPRIO perfil
-- e também ver outros perfis (para funcionalidades do sistema)
CREATE POLICY "Usuários autenticados podem ler perfis"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (true); -- Permite que qualquer usuário autenticado veja qualquer perfil

-- ============================================
-- 3. VERIFICAR SE A POLÍTICA FOI CRIADA
-- ============================================
SELECT 
  policyname,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'user_profiles'
AND cmd = 'SELECT';

-- ============================================
-- 4. TESTE MANUAL (execute enquanto estiver logado)
-- ============================================
-- Este teste deve funcionar sem erro 400:
-- SELECT id FROM public.user_profiles WHERE user_id = auth.uid();

-- ============================================
-- NOTAS
-- ============================================
-- O erro 400 pode ser causado por:
-- 1. Política RLS muito restritiva
-- 2. Sessão não totalmente estabelecida quando a query é executada
-- 3. Problema com a query em si
--
-- Esta correção garante que usuários autenticados possam ver perfis,
-- o que é necessário para a verificação durante o login funcionar.

