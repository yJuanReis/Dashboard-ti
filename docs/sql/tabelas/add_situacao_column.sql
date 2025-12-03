-- Adicionar coluna 'situacao' nas tabelas 'servicos' e 'produtos'
-- Esta coluna armazena a situação de cada SC (paga, cancelado, ou vazio)

-- Adicionar coluna na tabela servicos
ALTER TABLE public.servicos
ADD COLUMN IF NOT EXISTS situacao TEXT;

-- Adicionar coluna na tabela produtos
ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS situacao TEXT;

-- Comentário na coluna para documentação
COMMENT ON COLUMN public.servicos.situacao IS 'Situação da SC: paga, cancelado, ou vazio';
COMMENT ON COLUMN public.produtos.situacao IS 'Situação da SC: paga, cancelado, ou vazio';

