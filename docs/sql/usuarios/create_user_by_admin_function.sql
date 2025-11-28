-- Script SQL para criar função RPC que permite admin criar usuários
-- Esta função usa SECURITY DEFINER para ter privilégios elevados
-- Execute este script no SQL Editor do Supabase Dashboard

-- ============================================
-- FUNÇÃO: Criar Usuário (Admin)
-- ============================================
-- Esta função permite que admins criem usuários sem estar sujeitos
-- ao rate limiting rigoroso do signUp público

CREATE OR REPLACE FUNCTION public.create_user_by_admin(
  user_email TEXT,
  user_password TEXT,
  is_temporary BOOLEAN DEFAULT TRUE
)
RETURNS JSON AS $$
DECLARE
  new_user_id UUID;
  new_user_record RECORD;
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem criar usuários';
  END IF;

  -- Verificar se o email já existe
  IF EXISTS (
    SELECT 1 FROM auth.users WHERE email = LOWER(user_email)
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Email já está em uso',
      'error_code', 'EMAIL_EXISTS'
    );
  END IF;

  -- Criar usuário usando a função do Supabase (requer extensão)
  -- Nota: Esta é uma abordagem alternativa usando auth.users diretamente
  -- O Supabase não permite inserção direta em auth.users por segurança
  -- Então vamos usar uma abordagem diferente: criar via RPC que chama a API Admin internamente
  
  -- Alternativa: Retornar instruções para criar via API Admin
  -- Ou usar uma Edge Function que tem acesso à service role key
  
  -- Por enquanto, vamos criar o perfil e deixar que o admin use o Dashboard
  -- ou vamos criar uma função que retorna um token temporário para criação
  
  -- SOLUÇÃO: Usar a função auth.users() do Supabase via extensão
  -- Mas como não temos acesso direto, vamos criar uma função que
  -- retorna um JSON com instruções ou usa uma abordagem alternativa
  
  -- Vamos criar uma função que prepara os dados e retorna sucesso
  -- O frontend ainda precisará usar signUp, mas podemos melhorar o tratamento
  
  RETURN json_build_object(
    'success', false,
    'message', 'Use a função create_user_via_rpc que será implementada via Edge Function',
    'note', 'Esta função requer uma Edge Function com service role key'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION public.create_user_by_admin(TEXT, TEXT, BOOLEAN) TO authenticated;

-- ============================================
-- NOTA IMPORTANTE
-- ============================================
-- Esta função não pode criar usuários diretamente em auth.users por questões de segurança.
-- A melhor solução é:
-- 1. Melhorar o tratamento de erro 429 no frontend
-- 2. Adicionar retry logic com delay
-- 3. Ou criar uma Edge Function que usa service role key
-- 4. Ou usar o Dashboard do Supabase para criar usuários manualmente

