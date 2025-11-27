-- ============================================
-- CRIAR PERFIL MANUAL PARA USUÁRIO
-- ============================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- Use este script para criar um perfil manualmente para um usuário
-- que está tendo problemas para fazer login
-- ============================================

-- IMPORTANTE: Substitua o user_id abaixo pelo ID do seu usuário
-- Você pode encontrar o user_id no Supabase Dashboard > Authentication > Users
-- Ou use o email para buscar:

-- ============================================
-- OPÇÃO 1: Criar perfil usando o user_id
-- ============================================
-- Substitua 'SEU_USER_ID_AQUI' pelo ID real do usuário
INSERT INTO public.user_profiles (user_id, email, nome, role)
SELECT 
  id as user_id,
  email,
  COALESCE(raw_user_meta_data->>'nome', raw_user_meta_data->>'name', split_part(email, '@', 1)) as nome,
  COALESCE(raw_user_meta_data->>'role', 'user') as role
FROM auth.users
WHERE id = '92f82a0d-1239-4f53-b0a9-49454e78fbdb' -- SUBSTITUA pelo seu user_id
ON CONFLICT (user_id) DO NOTHING; -- Não fazer nada se já existir

-- ============================================
-- OPÇÃO 2: Criar perfil usando o email
-- ============================================
-- Substitua 'seu-email@exemplo.com' pelo email real
INSERT INTO public.user_profiles (user_id, email, nome, role)
SELECT 
  id as user_id,
  email,
  COALESCE(raw_user_meta_data->>'nome', raw_user_meta_data->>'name', split_part(email, '@', 1)) as nome,
  COALESCE(raw_user_meta_data->>'role', 'user') as role
FROM auth.users
WHERE email = 'seu-email@exemplo.com' -- SUBSTITUA pelo seu email
ON CONFLICT (user_id) DO NOTHING; -- Não fazer nada se já existir

-- ============================================
-- OPÇÃO 3: Criar perfis para TODOS os usuários que não têm perfil
-- ============================================
-- CUIDADO: Execute apenas se quiser criar perfis para todos os usuários
INSERT INTO public.user_profiles (user_id, email, nome, role)
SELECT 
  id as user_id,
  email,
  COALESCE(raw_user_meta_data->>'nome', raw_user_meta_data->>'name', split_part(email, '@', 1)) as nome,
  COALESCE(raw_user_meta_data->>'role', 'user') as role
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_profiles)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- VERIFICAR SE FOI CRIADO
-- ============================================
-- Execute esta query para verificar se o perfil foi criado:
SELECT 
  up.id,
  up.user_id,
  up.email,
  up.nome,
  up.role,
  up.created_at
FROM public.user_profiles up
WHERE up.user_id = '92f82a0d-1239-4f53-b0a9-49454e78fbdb'; -- SUBSTITUA pelo seu user_id

-- ============================================
-- NOTAS
-- ============================================
-- 1. O user_id '92f82a0d-1239-4f53-b0a9-49454e78fbdb' no exemplo
--    é o ID que apareceu no erro do console
-- 2. Substitua pelo seu user_id real antes de executar
-- 3. Use ON CONFLICT DO NOTHING para evitar erros se já existir
-- 4. Após criar o perfil, tente fazer login novamente

