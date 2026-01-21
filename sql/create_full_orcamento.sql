-- Tabela para configurações de orçamento mensal
-- Armazena os valores de orçamento para diferentes categorias

CREATE TABLE IF NOT EXISTS public.configuracoes_orcamento (
    id SERIAL PRIMARY KEY,
    chave VARCHAR(100) UNIQUE NOT NULL, -- Identificador único da configuração
    nome VARCHAR(200) NOT NULL, -- Nome descritivo da configuração
    valor DECIMAL(15,2) NOT NULL DEFAULT 0, -- Valor em reais
    tipo VARCHAR(50) NOT NULL DEFAULT 'orcamento', -- Tipo: 'orcamento', 'limite', etc.
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração padrão do orçamento mensal
INSERT INTO public.configuracoes_orcamento (chave, nome, valor, tipo)
VALUES ('orcamento_mensal_total', 'Orçamento Mensal Total', 150000.00, 'orcamento')
ON CONFLICT (chave) DO NOTHING;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_configuracoes_orcamento_chave
ON public.configuracoes_orcamento(chave);

CREATE INDEX IF NOT EXISTS idx_configuracoes_orcamento_tipo
ON public.configuracoes_orcamento(tipo);

CREATE INDEX IF NOT EXISTS idx_configuracoes_orcamento_ativo
ON public.configuracoes_orcamento(ativo);

-- RLS (Row Level Security) - Políticas de segurança
ALTER TABLE public.configuracoes_orcamento ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para usuários autenticados
CREATE POLICY "Configurações de orçamento são visíveis para usuários autenticados"
ON public.configuracoes_orcamento FOR SELECT
TO authenticated
USING (true);

-- Política para permitir edição apenas para usuários autenticados
CREATE POLICY "Configurações de orçamento podem ser editadas por usuários autenticados"
ON public.configuracoes_orcamento FOR ALL
TO authenticated
USING (true);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_configuracoes_orcamento_updated_at
    BEFORE UPDATE ON public.configuracoes_orcamento
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verificar se a tabela foi criada corretamente
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename = 'configuracoes_orcamento';
-- Inserir orçamento para 2026
INSERT INTO public.configuracoes_orcamento (chave, nome, valor, tipo)
VALUES ('orcamento_mensal_total_2026', 'Orçamento Mensal Total 2026', 150000.00, 'orcamento')
ON CONFLICT (chave) DO NOTHING;
