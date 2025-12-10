-- Script SQL para adicionar coluna marina à tabela despesas_ti
-- Execute este script no SQL Editor do Supabase Dashboard

-- Adiciona coluna marina se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'despesas_ti' AND column_name = 'marina') THEN
        ALTER TABLE despesas_ti ADD COLUMN marina TEXT;
        COMMENT ON COLUMN despesas_ti.marina IS 'Nome da marina associada à despesa';
    END IF;
END $$;

