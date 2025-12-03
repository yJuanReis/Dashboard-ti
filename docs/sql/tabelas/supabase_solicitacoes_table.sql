-- Script SQL para criar a tabela Solicitações no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- Cria a tabela solicitacoes (se ainda não existir)
CREATE TABLE IF NOT EXISTS public.solicitacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT,
    descricao TEXT,
    tipo TEXT CHECK (tipo IN ('servico', 'produto')),
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado')),
    prioridade TEXT DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica')),
    solicitante TEXT,
    responsavel TEXT,
    marina TEXT,
    valor_estimado NUMERIC(10, 2),
    data_limite DATE,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cria índices para melhorar a performance nas buscas
CREATE INDEX IF NOT EXISTS idx_solicitacoes_titulo ON public.solicitacoes(titulo);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_tipo ON public.solicitacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON public.solicitacoes(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_prioridade ON public.solicitacoes(prioridade);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_marina ON public.solicitacoes(marina);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_solicitante ON public.solicitacoes(solicitante);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_data_limite ON public.solicitacoes(data_limite);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_created_at ON public.solicitacoes(created_at DESC);

-- Cria uma função para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION update_solicitacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Cria um trigger para atualizar o updated_at automaticamente
DROP TRIGGER IF EXISTS update_solicitacoes_updated_at_trigger ON public.solicitacoes;
CREATE TRIGGER update_solicitacoes_updated_at_trigger 
    BEFORE UPDATE ON public.solicitacoes
    FOR EACH ROW 
    EXECUTE FUNCTION update_solicitacoes_updated_at();

-- Habilita Row Level Security (RLS) - descomente se necessário
-- ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;

-- Cria políticas RLS (ajuste conforme suas necessidades de segurança)
-- Descomente e ajuste se RLS estiver habilitado
-- Política para permitir leitura para todos os usuários autenticados
-- CREATE POLICY "Permitir leitura para usuários autenticados"
--     ON public.solicitacoes FOR SELECT
--     USING (auth.role() = 'authenticated');

-- Política para permitir inserção para usuários autenticados
-- CREATE POLICY "Permitir inserção para usuários autenticados"
--     ON public.solicitacoes FOR INSERT
--     TO authenticated
--     WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir atualização para usuários autenticados
-- CREATE POLICY "Permitir atualização para usuários autenticados"
--     ON public.solicitacoes FOR UPDATE
--     TO authenticated
--     USING (auth.role() = 'authenticated')
--     WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir exclusão para usuários autenticados
-- CREATE POLICY "Permitir exclusão para usuários autenticados"
--     ON public.solicitacoes FOR DELETE
--     TO authenticated
--     USING (auth.role() = 'authenticated');

