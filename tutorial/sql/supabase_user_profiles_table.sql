-- Script SQL para criar tabela de perfis de usuários no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard
-- Esta tabela armazena informações adicionais dos usuários do Auth

-- ============================================
-- CRIAR TABELA USER_PROFILES
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- HABILITAR RLS (Row Level Security)
-- ============================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS
-- ============================================

-- Política: Usuários autenticados podem ver todos os perfis
CREATE POLICY "Usuários autenticados podem ler perfis"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Apenas admins podem inserir perfis
CREATE POLICY "Apenas admins podem criar perfis"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Política: Apenas admins podem atualizar perfis
CREATE POLICY "Apenas admins podem atualizar perfis"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Política: Apenas admins podem deletar perfis
CREATE POLICY "Apenas admins podem deletar perfis"
  ON public.user_profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- TRIGGER PARA ATUALIZAR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER PARA CRIAR PERFIL AUTOMATICAMENTE
-- (Opcional - cria perfil quando usuário é criado no Auth)
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, nome, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger (se ainda não existir)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ÍNDICES PARA MELHOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- ============================================
-- VERIFICAÇÕES
-- ============================================

-- Verificar se a tabela foi criada:
-- SELECT * FROM public.user_profiles;

-- Verificar políticas RLS:
-- SELECT * FROM pg_policies WHERE tablename = 'user_profiles';

-- ============================================
-- NOTAS
-- ============================================

-- 1. Esta tabela armazena informações adicionais dos usuários
-- 2. O user_id referencia auth.users(id) com CASCADE DELETE
-- 3. As políticas RLS garantem que apenas admins possam gerenciar usuários
-- 4. O trigger cria automaticamente um perfil quando um usuário é criado no Auth
-- 5. Ajuste as políticas conforme suas necessidades de segurança

