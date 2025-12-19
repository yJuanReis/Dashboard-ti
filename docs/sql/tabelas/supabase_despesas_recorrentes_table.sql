-- Script SQL para criar a tabela despesas_recorrentes no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- Cria a tabela despesas_recorrentes (se ainda não existir)
CREATE TABLE IF NOT EXISTS public.despesas_recorrentes (
    id BIGSERIAL PRIMARY KEY,
    apelido TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('servico', 'produto')),
    match_empresa TEXT NOT NULL,
    match_texto TEXT NOT NULL,
    match_fornecedor TEXT,
    dia_vencimento INTEGER NOT NULL,
    ativo BOOLEAN DEFAULT true,
    descricao_padrao TEXT,
    valor_estimado NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cria índices para melhorar a performance nas buscas
CREATE INDEX IF NOT EXISTS idx_despesas_recorrentes_tipo ON public.despesas_recorrentes(tipo);
CREATE INDEX IF NOT EXISTS idx_despesas_recorrentes_match_empresa ON public.despesas_recorrentes(match_empresa);
CREATE INDEX IF NOT EXISTS idx_despesas_recorrentes_ativo ON public.despesas_recorrentes(ativo);
CREATE INDEX IF NOT EXISTS idx_despesas_recorrentes_created_at ON public.despesas_recorrentes(created_at DESC);

-- Cria uma função para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION update_despesas_recorrentes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Cria um trigger para atualizar o updated_at automaticamente
DROP TRIGGER IF EXISTS update_despesas_recorrentes_updated_at_trigger ON public.despesas_recorrentes;
CREATE TRIGGER update_despesas_recorrentes_updated_at_trigger
    BEFORE UPDATE ON public.despesas_recorrentes
    FOR EACH ROW
    EXECUTE FUNCTION update_despesas_recorrentes_updated_at();

-- Habilita Row Level Security (RLS) - descomente se necessário
-- ALTER TABLE public.despesas_recorrentes ENABLE ROW LEVEL SECURITY;

-- Cria políticas RLS (ajuste conforme suas necessidades de segurança)
-- Descomente e ajuste se RLS estiver habilitado
-- Política para permitir leitura para todos os usuários autenticados
-- CREATE POLICY "Permitir leitura para usuários autenticados"
--     ON public.despesas_recorrentes FOR SELECT
--     USING (auth.role() = 'authenticated');

-- Política para permitir inserção para usuários autenticados
-- CREATE POLICY "Permitir inserção para usuários autenticados"
--     ON public.despesas_recorrentes FOR INSERT
--     TO authenticated
--     WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir atualização para usuários autenticados
-- CREATE POLICY "Permitir atualização para usuários autenticados"
--     ON public.despesas_recorrentes FOR UPDATE
--     TO authenticated
--     USING (auth.role() = 'authenticated')
--     WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir exclusão para usuários autenticados
-- CREATE POLICY "Permitir exclusão para usuários autenticados"
--     ON public.despesas_recorrentes FOR DELETE
--     TO authenticated
--     USING (auth.role() = 'authenticated');
