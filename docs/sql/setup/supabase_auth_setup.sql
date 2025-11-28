-- Script SQL para configurar autenticação no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard
-- Este script configura políticas RLS para garantir que apenas usuários autenticados acessem dados

-- ============================================
-- CONFIGURAÇÃO DE AUTENTICAÇÃO
-- ============================================

-- 1. Verificar se a autenticação está habilitada
-- A autenticação já vem habilitada por padrão no Supabase
-- Você pode verificar em: Authentication > Settings

-- 2. Configurar políticas RLS (Row Level Security) para suas tabelas
-- Exemplo para a tabela de senhas (ajuste conforme suas tabelas)

-- Habilita RLS na tabela (se ainda não estiver habilitado)
-- ALTER TABLE sua_tabela ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários autenticados leiam dados
-- CREATE POLICY "Usuários autenticados podem ler"
--   ON sua_tabela
--   FOR SELECT
--   TO authenticated
--   USING (true);

-- Política para permitir que usuários autenticados insiram dados
-- CREATE POLICY "Usuários autenticados podem inserir"
--   ON sua_tabela
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (true);

-- Política para permitir que usuários autenticados atualizem dados
-- CREATE POLICY "Usuários autenticados podem atualizar"
--   ON sua_tabela
--   FOR UPDATE
--   TO authenticated
--   USING (true);

-- Política para permitir que usuários autenticados deletem dados
-- CREATE POLICY "Usuários autenticados podem deletar"
--   ON sua_tabela
--   FOR DELETE
--   TO authenticated
--   USING (true);

-- ============================================
-- CONFIGURAÇÃO DE EMAIL (OPCIONAL)
-- ============================================

-- Por padrão, o Supabase envia emails de confirmação
-- Você pode configurar templates de email em:
-- Authentication > Email Templates

-- Para desabilitar confirmação de email (não recomendado para produção):
-- Vá em Authentication > Settings > Auth
-- Desmarque "Enable email confirmations"

-- ============================================
-- CRIAR PRIMEIRO USUÁRIO ADMINISTRADOR
-- ============================================

-- Você pode criar usuários de duas formas:

-- 1. Via Dashboard do Supabase:
--    - Vá em Authentication > Users
--    - Clique em "Add user"
--    - Preencha email e senha
--    - Marque "Auto Confirm User" se quiser que o usuário não precise confirmar email

-- 2. Via SQL (apenas para desenvolvimento/teste):
--    INSERT INTO auth.users (
--      instance_id,
--      id,
--      aud,
--      role,
--      email,
--      encrypted_password,
--      email_confirmed_at,
--      created_at,
--      updated_at,
--      confirmation_token,
--      email_change,
--      email_change_token_new,
--      recovery_token
--    ) VALUES (
--      '00000000-0000-0000-0000-000000000000',
--      gen_random_uuid(),
--      'authenticated',
--      'authenticated',
--      'admin@brmarinas.com',
--      crypt('senha_segura_aqui', gen_salt('bf')),
--      NOW(),
--      NOW(),
--      NOW(),
--      '',
--      '',
--      '',
--      ''
--    );

-- NOTA: O método SQL acima é complexo. É mais fácil criar via Dashboard.

-- ============================================
-- VERIFICAÇÕES
-- ============================================

-- Verificar usuários criados:
-- SELECT id, email, created_at, email_confirmed_at 
-- FROM auth.users;

-- Verificar sessões ativas:
-- SELECT * FROM auth.sessions;

-- ============================================
-- DICAS DE SEGURANÇA
-- ============================================

-- 1. Sempre use HTTPS em produção
-- 2. Configure políticas RLS adequadas para cada tabela
-- 3. Use senhas fortes (mínimo 8 caracteres, com letras, números e símbolos)
-- 4. Habilite confirmação de email em produção
-- 5. Configure rate limiting no Supabase Dashboard
-- 6. Monitore tentativas de login falhadas


