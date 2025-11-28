-- Script SQL para criar a tabela de configurações NVR no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- Cria a tabela nvr_config para armazenar configurações globais
CREATE TABLE IF NOT EXISTS public.nvr_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cria um índice para melhorar a performance nas buscas
CREATE INDEX IF NOT EXISTS idx_nvr_config_key ON public.nvr_config(key);

-- Cria uma função para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION update_nvr_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Cria um trigger para atualizar o updated_at automaticamente
CREATE TRIGGER update_nvr_config_updated_at BEFORE UPDATE ON public.nvr_config
    FOR EACH ROW EXECUTE FUNCTION update_nvr_config_updated_at();

-- Insere o valor padrão do preço do HD (se não existir)
INSERT INTO public.nvr_config (key, value)
VALUES ('hd_price', '100.0'::jsonb)
ON CONFLICT (key) DO NOTHING;


