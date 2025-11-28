-- ============================================
-- FUNÇÃO: Confirmar Email do Usuário
-- ============================================
-- Esta função confirma o email de um usuário automaticamente
-- Útil quando o admin cria o usuário e quer que ele possa fazer login imediatamente
-- Execute este script no SQL Editor do Supabase Dashboard

CREATE OR REPLACE FUNCTION public.confirm_user_email(
  user_email TEXT
)
RETURNS JSON AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Apenas administradores podem confirmar emails'
    );
  END IF;

  -- Buscar o ID do usuário pelo email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = LOWER(user_email);

  -- Verificar se o usuário existe
  IF target_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Usuário não encontrado'
    );
  END IF;

  -- Confirmar o email do usuário
  UPDATE auth.users
  SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    updated_at = NOW()
  WHERE id = target_user_id
    AND email_confirmed_at IS NULL; -- Só atualizar se ainda não estiver confirmado

  RETURN json_build_object(
    'success', true,
    'user_id', target_user_id,
    'email', LOWER(user_email),
    'message', 'Email confirmado com sucesso'
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

GRANT EXECUTE ON FUNCTION public.confirm_user_email(TEXT) TO authenticated;

