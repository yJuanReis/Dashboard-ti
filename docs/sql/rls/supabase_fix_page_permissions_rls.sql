-- ============================================
-- CORREÇÃO DE RLS PARA PERMISSÕES DE PÁGINAS
-- ============================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- Este script verifica e corrige políticas RLS que podem estar bloqueando updates
-- ============================================

-- ============================================
-- VERIFICAR POLÍTICAS RLS EXISTENTES
-- ============================================
-- Execute esta query para ver as políticas atuais:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'user_profiles';

-- ============================================
-- POLÍTICA PARA PERMITIR ADMINS ATUALIZAREM PERMISSÕES
-- ============================================
-- Esta política permite que admins atualizem page_permissions de qualquer usuário
-- Primeiro, remove a política se já existir
DROP POLICY IF EXISTS "Admins podem atualizar permissões de páginas" ON public.user_profiles;

-- Depois, cria a política
CREATE POLICY "Admins podem atualizar permissões de páginas"
ON public.user_profiles
FOR UPDATE
USING (
  -- Verificar se o usuário atual é admin
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  -- Verificar se o usuário atual é admin
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- ============================================
-- POLÍTICA PARA PERMITIR ADMINS ATUALIZAREM QUALQUER CAMPO
-- ============================================
-- Se a política acima não funcionar, esta é mais permissiva (apenas para admins)
-- Primeiro, remove a política se já existir
DROP POLICY IF EXISTS "Admins podem atualizar qualquer campo" ON public.user_profiles;

-- Depois, cria a política
CREATE POLICY "Admins podem atualizar qualquer campo"
ON public.user_profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- ============================================
-- VERIFICAR SE RLS ESTÁ HABILITADO
-- ============================================
-- Execute esta query para verificar:
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename = 'user_profiles';

-- Se rowsecurity for 'true', RLS está habilitado
-- Se você quiser desabilitar RLS temporariamente para testar (NÃO RECOMENDADO EM PRODUÇÃO):
-- ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- ============================================
-- TESTE MANUAL
-- ============================================
-- Teste se consegue atualizar manualmente (substitua o email):
-- UPDATE public.user_profiles 
-- SET page_permissions = ARRAY['/home', '/senhas']::TEXT[]
-- WHERE email = 'seu-email@exemplo.com';

-- Verifique se foi salvo:
-- SELECT email, page_permissions 
-- FROM public.user_profiles 
-- WHERE email = 'seu-email@exemplo.com';

