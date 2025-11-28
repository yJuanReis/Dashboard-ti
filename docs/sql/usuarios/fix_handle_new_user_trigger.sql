-- Script SQL para corrigir o trigger handle_new_user
-- Este trigger cria o perfil automaticamente, mas precisa incluir password_temporary
-- Execute este script no SQL Editor do Supabase Dashboard

-- ============================================
-- ATUALIZAR FUNÇÃO handle_new_user
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, nome, role, password_temporary)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    -- Se password_temporary estiver nos metadados, usar; senão, false
    COALESCE((NEW.raw_user_meta_data->>'password_temporary')::boolean, false)
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    email = EXCLUDED.email,
    nome = COALESCE(EXCLUDED.nome, user_profiles.nome),
    role = COALESCE(EXCLUDED.role, user_profiles.role),
    password_temporary = COALESCE(EXCLUDED.password_temporary, user_profiles.password_temporary);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICAR SE O TRIGGER EXISTE
-- ============================================

-- O trigger já deve existir, mas vamos garantir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- NOTAS
-- ============================================
-- Este trigger agora:
-- 1. Cria o perfil automaticamente quando um usuário é criado
-- 2. Inclui o campo password_temporary dos metadados
-- 3. Faz UPDATE se o perfil já existir (evita erro de duplicata)
-- 4. Preserva valores existentes se não estiverem nos metadados

