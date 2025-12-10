-- Script SQL para adicionar colunas mensais à tabela despesas_ti
-- Execute este script no SQL Editor do Supabase Dashboard

-- Adiciona colunas mensais se não existirem
-- Essas colunas serão usadas para marcar quais despesas recorrentes foram processadas em cada mês

DO $$ 
BEGIN
    -- Janeiro
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'despesas_ti' AND column_name = 'jan') THEN
        ALTER TABLE despesas_ti ADD COLUMN jan INTEGER DEFAULT 0;
    END IF;

    -- Fevereiro
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'despesas_ti' AND column_name = 'fev') THEN
        ALTER TABLE despesas_ti ADD COLUMN fev INTEGER DEFAULT 0;
    END IF;

    -- Março
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'despesas_ti' AND column_name = 'mar') THEN
        ALTER TABLE despesas_ti ADD COLUMN mar INTEGER DEFAULT 0;
    END IF;

    -- Abril
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'despesas_ti' AND column_name = 'abr') THEN
        ALTER TABLE despesas_ti ADD COLUMN abr INTEGER DEFAULT 0;
    END IF;

    -- Maio
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'despesas_ti' AND column_name = 'mai') THEN
        ALTER TABLE despesas_ti ADD COLUMN mai INTEGER DEFAULT 0;
    END IF;

    -- Junho
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'despesas_ti' AND column_name = 'jun') THEN
        ALTER TABLE despesas_ti ADD COLUMN jun INTEGER DEFAULT 0;
    END IF;

    -- Julho
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'despesas_ti' AND column_name = 'jul') THEN
        ALTER TABLE despesas_ti ADD COLUMN jul INTEGER DEFAULT 0;
    END IF;

    -- Agosto
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'despesas_ti' AND column_name = 'ago') THEN
        ALTER TABLE despesas_ti ADD COLUMN ago INTEGER DEFAULT 0;
    END IF;

    -- Setembro
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'despesas_ti' AND column_name = 'set') THEN
        ALTER TABLE despesas_ti ADD COLUMN set INTEGER DEFAULT 0;
    END IF;

    -- Outubro (usando out_ com underscore para evitar conflito com palavra reservada)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'despesas_ti' AND column_name = 'out_') THEN
        ALTER TABLE despesas_ti ADD COLUMN out_ INTEGER DEFAULT 0;
    END IF;

    -- Novembro
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'despesas_ti' AND column_name = 'nov') THEN
        ALTER TABLE despesas_ti ADD COLUMN nov INTEGER DEFAULT 0;
    END IF;

    -- Dezembro
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'despesas_ti' AND column_name = 'dez') THEN
        ALTER TABLE despesas_ti ADD COLUMN dez INTEGER DEFAULT 0;
    END IF;
END $$;

-- Comentários nas colunas para documentação
COMMENT ON COLUMN despesas_ti.jan IS 'Check para janeiro (1 = marcado, 0 = não marcado)';
COMMENT ON COLUMN despesas_ti.fev IS 'Check para fevereiro (1 = marcado, 0 = não marcado)';
COMMENT ON COLUMN despesas_ti.mar IS 'Check para março (1 = marcado, 0 = não marcado)';
COMMENT ON COLUMN despesas_ti.abr IS 'Check para abril (1 = marcado, 0 = não marcado)';
COMMENT ON COLUMN despesas_ti.mai IS 'Check para maio (1 = marcado, 0 = não marcado)';
COMMENT ON COLUMN despesas_ti.jun IS 'Check para junho (1 = marcado, 0 = não marcado)';
COMMENT ON COLUMN despesas_ti.jul IS 'Check para julho (1 = marcado, 0 = não marcado)';
COMMENT ON COLUMN despesas_ti.ago IS 'Check para agosto (1 = marcado, 0 = não marcado)';
COMMENT ON COLUMN despesas_ti.set IS 'Check para setembro (1 = marcado, 0 = não marcado)';
COMMENT ON COLUMN despesas_ti.out_ IS 'Check para outubro (1 = marcado, 0 = não marcado)';
COMMENT ON COLUMN despesas_ti.nov IS 'Check para novembro (1 = marcado, 0 = não marcado)';
COMMENT ON COLUMN despesas_ti.dez IS 'Check para dezembro (1 = marcado, 0 = não marcado)';

