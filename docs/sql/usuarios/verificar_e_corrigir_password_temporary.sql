-- Script SQL para verificar e corrigir password_temporary
-- Execute este script no SQL Editor do Supabase Dashboard

-- ============================================
-- VERIFICAR USUÁRIOS COM SENHA TEMPORÁRIA
-- ============================================

-- Ver todos os usuários e seu status de senha temporária
SELECT 
  up.user_id,
  up.email,
  up.nome,
  up.password_temporary,
  au.email_confirmed_at,
  au.created_at
FROM public.user_profiles up
JOIN auth.users au ON au.id = up.user_id
ORDER BY au.created_at DESC;

-- ============================================
-- CORRIGIR USUÁRIOS ESPECÍFICOS
-- ============================================

-- Se você criou um usuário e ele não tem password_temporary = true,
-- execute este comando substituindo o email:

-- UPDATE public.user_profiles
-- SET password_temporary = TRUE
-- WHERE email = 'usuario@exemplo.com';

-- ============================================
-- VERIFICAR SE O CAMPO EXISTE
-- ============================================

-- Verificar se a coluna password_temporary existe
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name = 'password_temporary';

-- Se a coluna não existir, execute primeiro:
-- tutorial/sql/add_password_temporary_field.sql

-- ============================================
-- CORRIGIR TODOS OS USUÁRIOS RECÉM-CRIADOS
-- ============================================

-- Se você quer marcar todos os usuários criados nas últimas 24h como tendo senha temporária:
-- (Ajuste o intervalo conforme necessário)

-- UPDATE public.user_profiles
-- SET password_temporary = TRUE
-- WHERE user_id IN (
--   SELECT id FROM auth.users
--   WHERE created_at > NOW() - INTERVAL '24 hours'
-- )
-- AND (password_temporary IS NULL OR password_temporary = FALSE);

