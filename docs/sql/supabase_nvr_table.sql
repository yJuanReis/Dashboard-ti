-- Script SQL para criar a tabela NVR no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- Cria a tabela nvrs (se ainda não existir)
-- NOTA: Se a tabela já existe com o nome "nvrs", você pode pular esta parte
CREATE TABLE IF NOT EXISTS public.nvrs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    marina TEXT NOT NULL,
    name TEXT NOT NULL,
    model TEXT NOT NULL,
    owner TEXT NOT NULL,
    cameras INTEGER DEFAULT 0,
    notes TEXT,
    slots JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cria um índice para melhorar a performance nas buscas
CREATE INDEX IF NOT EXISTS idx_nvrs_marina ON public.nvrs(marina);
CREATE INDEX IF NOT EXISTS idx_nvrs_owner ON public.nvrs(owner);
CREATE INDEX IF NOT EXISTS idx_nvrs_model ON public.nvrs(model);

-- Cria uma função para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Cria um trigger para atualizar o updated_at automaticamente
CREATE TRIGGER update_nvrs_updated_at BEFORE UPDATE ON public.nvrs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilita Row Level Security (RLS) - descomente se necessário
-- ALTER TABLE public.nvrs ENABLE ROW LEVEL SECURITY;

-- Cria políticas RLS (ajuste conforme suas necessidades de segurança)
-- Descomente e ajuste se RLS estiver habilitado
-- Política para permitir leitura para todos os usuários autenticados
-- CREATE POLICY "Permitir leitura para usuários autenticados"
--     ON public.nvrs FOR SELECT
--     USING (auth.role() = 'authenticated');

-- Política para permitir inserção para usuários autenticados
-- CREATE POLICY "Permitir inserção para usuários autenticados"
--     ON public.nvrs FOR INSERT
--     WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir atualização para usuários autenticados
-- CREATE POLICY "Permitir atualização para usuários autenticados"
--     ON public.nvrs FOR UPDATE
--     USING (auth.role() = 'authenticated');

-- Política para permitir deleção para usuários autenticados
-- CREATE POLICY "Permitir deleção para usuários autenticados"
--     ON public.nvrs FOR DELETE
--     USING (auth.role() = 'authenticated');

-- Exemplo de estrutura do campo slots (JSONB):
-- [
--   {
--     "status": "active",
--     "hdSize": 14,
--     "purchased": false
--   },
--   {
--     "status": "empty",
--     "hdSize": 0,
--     "purchased": false
--   }
-- ]


