-- ============================================
-- VERIFICAR E CORRIGIR ESTRUTURA DA TABELA USER_PROFILES
-- ============================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- Este script verifica a estrutura da tabela e adiciona colunas faltantes
-- ============================================

-- ============================================
-- 1. VERIFICAR ESTRUTURA ATUAL DA TABELA
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- ============================================
-- 2. ADICIONAR COLUNA 'id' SE NÃO EXISTIR
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'id'
  ) THEN
    -- Adicionar coluna id como PRIMARY KEY
    ALTER TABLE public.user_profiles 
    ADD COLUMN id UUID DEFAULT gen_random_uuid();
    
    -- Criar índice único se não existir
    CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_id_unique ON public.user_profiles(id);
    
    -- Tornar a coluna NOT NULL
    ALTER TABLE public.user_profiles 
    ALTER COLUMN id SET NOT NULL;
    
    -- Adicionar constraint de PRIMARY KEY se não existir
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'user_profiles_pkey'
      ) THEN
        ALTER TABLE public.user_profiles 
        ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);
      END IF;
    END $$;
    
    RAISE NOTICE 'Coluna id adicionada à tabela user_profiles';
  ELSE
    RAISE NOTICE 'Coluna id já existe na tabela user_profiles';
  END IF;
END $$;

-- ============================================
-- 3. VERIFICAR SE TODAS AS COLUNAS NECESSÁRIAS EXISTEM
-- ============================================
-- Adicionar colunas faltantes se necessário

-- Verificar e adicionar 'user_id' se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
    
    CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_user_id_unique ON public.user_profiles(user_id);
    
    RAISE NOTICE 'Coluna user_id adicionada à tabela user_profiles';
  END IF;
END $$;

-- Verificar e adicionar 'email' se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD COLUMN email TEXT NOT NULL;
    
    RAISE NOTICE 'Coluna email adicionada à tabela user_profiles';
  END IF;
END $$;

-- Verificar e adicionar 'nome' se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'nome'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD COLUMN nome TEXT;
    
    RAISE NOTICE 'Coluna nome adicionada à tabela user_profiles';
  END IF;
END $$;

-- Verificar e adicionar 'role' se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user'));
    
    RAISE NOTICE 'Coluna role adicionada à tabela user_profiles';
  END IF;
END $$;

-- Verificar e adicionar 'created_at' se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    
    RAISE NOTICE 'Coluna created_at adicionada à tabela user_profiles';
  END IF;
END $$;

-- Verificar e adicionar 'updated_at' se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    
    RAISE NOTICE 'Coluna updated_at adicionada à tabela user_profiles';
  END IF;
END $$;

-- ============================================
-- 4. VERIFICAR ESTRUTURA FINAL
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- ============================================
-- 5. VERIFICAR SE A TABELA TEM DADOS
-- ============================================
SELECT COUNT(*) as total_usuarios FROM public.user_profiles;

-- ============================================
-- NOTAS
-- ============================================
-- Este script:
-- 1. Verifica a estrutura atual da tabela
-- 2. Adiciona colunas faltantes (id, user_id, email, nome, role, created_at, updated_at)
-- 3. Cria índices necessários
-- 4. Verifica a estrutura final
--
-- Execute este script se estiver recebendo erro "column does not exist"

