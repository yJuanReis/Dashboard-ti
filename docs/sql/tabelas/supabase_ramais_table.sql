-- Script SQL para criar a tabela Ramais no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- Cria a tabela ramais (se ainda não existir)
CREATE TABLE IF NOT EXISTS public.ramais (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero TEXT,
    nome TEXT,
    setor TEXT,
    marina TEXT,
    local TEXT,
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cria índices para melhorar a performance nas buscas
CREATE INDEX IF NOT EXISTS idx_ramais_numero ON public.ramais(numero);
CREATE INDEX IF NOT EXISTS idx_ramais_marina ON public.ramais(marina);
CREATE INDEX IF NOT EXISTS idx_ramais_nome ON public.ramais(nome);
CREATE INDEX IF NOT EXISTS idx_ramais_setor ON public.ramais(setor);

-- Habilita Row Level Security (RLS) - descomente se necessário
-- ALTER TABLE public.ramais ENABLE ROW LEVEL SECURITY;

-- Cria políticas RLS (ajuste conforme suas necessidades de segurança)
-- Descomente e ajuste se RLS estiver habilitado
-- Política para permitir leitura para todos os usuários autenticados
-- CREATE POLICY "Permitir leitura para usuários autenticados"
--     ON public.ramais FOR SELECT
--     USING (auth.role() = 'authenticated');

-- Política para permitir inserção para usuários autenticados
-- CREATE POLICY "Permitir inserção para usuários autenticados"
--     ON public.ramais FOR INSERT
--     TO authenticated
--     WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir atualização para usuários autenticados
-- CREATE POLICY "Permitir atualização para usuários autenticados"
--     ON public.ramais FOR UPDATE
--     TO authenticated
--     USING (auth.role() = 'authenticated')
--     WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir exclusão para usuários autenticados
-- CREATE POLICY "Permitir exclusão para usuários autenticados"
--     ON public.ramais FOR DELETE
--     TO authenticated
--     USING (auth.role() = 'authenticated');

