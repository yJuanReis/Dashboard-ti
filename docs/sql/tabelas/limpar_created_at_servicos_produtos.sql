-- ============================================
-- Limpar created_at dos registros existentes
-- ============================================
-- Este script remove o created_at de todos os registros existentes
-- nas tabelas servicos e produtos, mantendo apenas para novos registros
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================

-- ============================================
-- 1. GARANTIR QUE A COLUNA created_at EXISTE E PERMITE NULL
-- ============================================

-- Adicionar created_at na tabela servicos se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'servicos' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.servicos 
    ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    
    RAISE NOTICE 'Coluna created_at adicionada à tabela servicos';
  ELSE
    -- Se já existe, garantir que permite NULL e tem DEFAULT para novos registros
    ALTER TABLE public.servicos 
    ALTER COLUMN created_at DROP NOT NULL,
    ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());
    
    RAISE NOTICE 'Coluna created_at já existe na tabela servicos - configurada para permitir NULL';
  END IF;
END $$;

-- Adicionar created_at na tabela produtos se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'produtos' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.produtos 
    ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    
    RAISE NOTICE 'Coluna created_at adicionada à tabela produtos';
  ELSE
    -- Se já existe, garantir que permite NULL e tem DEFAULT para novos registros
    ALTER TABLE public.produtos 
    ALTER COLUMN created_at DROP NOT NULL,
    ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());
    
    RAISE NOTICE 'Coluna created_at já existe na tabela produtos - configurada para permitir NULL';
  END IF;
END $$;

-- ============================================
-- 2. LIMPAR created_at DE TODOS OS REGISTROS EXISTENTES
-- ============================================

-- Limpar created_at na tabela servicos
UPDATE public.servicos
SET created_at = NULL
WHERE created_at IS NOT NULL;

-- Limpar created_at na tabela produtos
UPDATE public.produtos
SET created_at = NULL
WHERE created_at IS NOT NULL;

-- ============================================
-- 3. VERIFICAR RESULTADO
-- ============================================

-- Contar registros com created_at NULL em servicos
SELECT 
  'servicos' as tabela,
  COUNT(*) as total_registros,
  COUNT(created_at) as com_created_at,
  COUNT(*) - COUNT(created_at) as sem_created_at
FROM public.servicos;

-- Contar registros com created_at NULL em produtos
SELECT 
  'produtos' as tabela,
  COUNT(*) as total_registros,
  COUNT(created_at) as com_created_at,
  COUNT(*) - COUNT(created_at) as sem_created_at
FROM public.produtos;

-- ============================================
-- NOTAS
-- ============================================
-- Após executar este script:
-- - Todos os registros existentes terão created_at = NULL
-- - Novos registros terão created_at preenchido automaticamente
-- - A ordenação na aplicação usará:
--   * created_at para registros novos (mais recente primeiro)
--   * data_solicitacao/data_sc para registros antigos (mais recente primeiro)
-- ============================================

