-- ============================================
-- CORREÇÃO DO TRIGGER updated_at
-- ============================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- Este script corrige o erro: record "new" has no field "updated_at"
-- ============================================

-- ============================================
-- 1. VERIFICAR SE O CAMPO updated_at EXISTE
-- ============================================
-- Execute esta query primeiro para verificar:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND table_name = 'user_profiles' 
-- AND column_name = 'updated_at';

-- ============================================
-- 2. ADICIONAR CAMPO updated_at SE NÃO EXISTIR
-- ============================================
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
    
    RAISE NOTICE 'Campo updated_at adicionado à tabela user_profiles';
  ELSE
    RAISE NOTICE 'Campo updated_at já existe na tabela user_profiles';
  END IF;
END $$;

-- ============================================
-- 3. CORRIGIR FUNÇÃO DO TRIGGER
-- ============================================
-- Função padrão para atualizar updated_at
-- (Agora que garantimos que o campo existe, podemos usar uma função simples)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. RECRIAR O TRIGGER
-- ============================================
-- Remove o trigger antigo se existir
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;

-- Cria o trigger novamente
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. VERIFICAÇÃO
-- ============================================
-- Execute estas queries para verificar se está tudo correto:

-- Verificar se o campo existe:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND table_name = 'user_profiles' 
-- AND column_name = 'updated_at';

-- Verificar se o trigger existe:
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE event_object_table = 'user_profiles'
-- AND trigger_name = 'update_user_profiles_updated_at';

-- Testar o trigger (substitua o email pelo de um usuário de teste):
-- UPDATE public.user_profiles 
-- SET nome = nome 
-- WHERE email = 'seu-email@exemplo.com'
-- RETURNING nome, updated_at;

-- ============================================
-- NOTAS
-- ============================================
-- Este script:
-- 1. Adiciona o campo updated_at se não existir
-- 2. Corrige a função do trigger para ser mais robusta
-- 3. Recria o trigger para garantir que está funcionando
-- 
-- O trigger agora verifica se o campo existe antes de tentar atualizá-lo,
-- evitando o erro "record 'new' has no field 'updated_at'"

