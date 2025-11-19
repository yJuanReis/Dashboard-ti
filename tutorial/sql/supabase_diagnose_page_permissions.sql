-- ============================================
-- DIAGNÓSTICO DE PERMISSÕES DE PÁGINAS
-- ============================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- Este script ajuda a identificar problemas com page_permissions
-- ============================================

-- ============================================
-- 1. VERIFICAR ESTRUTURA DA COLUNA
-- ============================================
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles' 
AND column_name = 'page_permissions';

-- ============================================
-- 2. VERIFICAR TRIGGERS QUE PODEM INTERFERIR
-- ============================================
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'user_profiles';

-- ============================================
-- 3. VERIFICAR CONSTRAINTS
-- ============================================
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
AND table_name = 'user_profiles';

-- ============================================
-- 4. TESTE DE UPDATE MANUAL
-- ============================================
-- Substitua 'seu-email@exemplo.com' pelo email do usuário de teste
-- UPDATE public.user_profiles 
-- SET page_permissions = ARRAY['/home', '/senhas', '/crachas']::TEXT[]
-- WHERE email = 'seu-email@exemplo.com'
-- RETURNING email, page_permissions;

-- ============================================
-- 5. VERIFICAR O QUE ESTÁ SALVO
-- ============================================
-- SELECT 
--   email,
--   page_permissions,
--   array_length(page_permissions, 1) as permissions_count,
--   page_permissions::text as permissions_text
-- FROM public.user_profiles
-- ORDER BY email;

-- ============================================
-- 6. VERIFICAR RLS
-- ============================================
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'user_profiles';

-- ============================================
-- 7. VERIFICAR POLÍTICAS RLS
-- ============================================
SELECT 
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'user_profiles';

-- ============================================
-- 8. CORREÇÃO: REMOVER DEFAULT QUE PODE ESTAR CAUSANDO PROBLEMAS
-- ============================================
-- Se o default estiver causando problemas, remova-o:
-- ALTER TABLE public.user_profiles 
-- ALTER COLUMN page_permissions DROP DEFAULT;

-- E depois defina como nullable:
-- ALTER TABLE public.user_profiles 
-- ALTER COLUMN page_permissions DROP NOT NULL;

-- ============================================
-- 9. CORREÇÃO ALTERNATIVA: USAR JSONB EM VEZ DE TEXT[]
-- ============================================
-- Se TEXT[] não funcionar, podemos converter para JSONB:
-- ALTER TABLE public.user_profiles 
-- ALTER COLUMN page_permissions TYPE JSONB USING page_permissions::jsonb;

-- Mas isso requer mudanças no código também!

