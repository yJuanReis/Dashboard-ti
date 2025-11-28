-- ============================================
-- CORREÇÃO: Criar Usuário SEM Confirmar Email
-- ============================================
-- Esta correção modifica a função create_user_direct para
-- NÃO confirmar o email automaticamente, permitindo que
-- o email de confirmação seja enviado via resend()
-- Execute este script no SQL Editor do Supabase Dashboard

CREATE OR REPLACE FUNCTION public.create_user_direct(
  user_email TEXT,
  user_password TEXT,
  user_role TEXT DEFAULT 'user',
  is_temporary BOOLEAN DEFAULT TRUE
)
RETURNS JSON AS $$
DECLARE
  new_user_id UUID;
  instance_id_val UUID;
  encrypted_pwd TEXT;
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Apenas administradores podem criar usuários'
    );
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

  -- Validar role
  IF user_role NOT IN ('admin', 'user') THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Role inválida. Use "admin" ou "user"'
    );
  END IF;

  -- Gerar novo UUID para o usuário
  new_user_id := gen_random_uuid();
  
  -- Obter instance_id do primeiro usuário existente (ou usar padrão)
  SELECT COALESCE(
    (SELECT instance_id FROM auth.users LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::UUID
  ) INTO instance_id_val;
  
  -- Criptografar senha usando a mesma função que o Supabase usa
  -- O Supabase usa bcrypt, então vamos usar crypt() com bf (Blowfish)
  -- Nota: A extensão pgcrypto precisa estar habilitada
  encrypted_pwd := crypt(user_password, gen_salt('bf'));

  -- Inserir diretamente em auth.users
  -- IMPORTANTE: email_confirmed_at = NULL para permitir envio de email de confirmação
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,  -- NULL = email NÃO confirmado (permite envio de confirmação)
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    raw_user_meta_data
  ) VALUES (
    instance_id_val,
    new_user_id,
    'authenticated',
    'authenticated',
    LOWER(user_email),
    encrypted_pwd,
    NULL,  -- NÃO confirmar email automaticamente - permite envio de email de confirmação
    NOW(),
    NOW(),
    '',
    '',
    '',
    '',
    jsonb_build_object(
      'role', user_role,
      'password_temporary', is_temporary
    )
  );

  -- Criar perfil na tabela user_profiles
  -- O trigger handle_new_user pode criar automaticamente, mas vamos garantir
  INSERT INTO public.user_profiles (
    user_id,
    email,
    nome,
    role,
    password_temporary
  ) VALUES (
    new_user_id,
    LOWER(user_email),
    NULL, -- Nome será preenchido no primeiro login
    user_role,
    is_temporary
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    role = user_role,
    password_temporary = is_temporary,
    email = LOWER(user_email);

  RETURN json_build_object(
    'success', true,
    'user_id', new_user_id,
    'email', LOWER(user_email),
    'message', 'Usuário criado com sucesso (email não confirmado - aguardando confirmação)'
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

GRANT EXECUTE ON FUNCTION public.create_user_direct(TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;

-- ============================================
-- NOTA IMPORTANTE
-- ============================================
-- Esta versão da função cria usuários com email NÃO confirmado.
-- Isso permite que o email de confirmação seja enviado via resend().
-- O usuário precisará confirmar o email antes de fazer login
-- (se "Enable email confirmations" estiver ativado no Supabase).

