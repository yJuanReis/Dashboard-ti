-- Adicionar coluna recorrencia na tabela despesas_recorrentes
-- Para definir a frequência da despesa (Mensal, Anual, Trimestral, ou personalizado)

ALTER TABLE public.despesas_recorrentes
ADD COLUMN IF NOT EXISTS recorrencia TEXT DEFAULT 'Mensal';

-- Criar índice para melhorar performance nas consultas
CREATE INDEX IF NOT EXISTS idx_despesas_recorrentes_recorrencia
ON public.despesas_recorrentes(recorrencia);

-- Atualizar registros existentes para 'Mensal' se estiverem vazios
UPDATE public.despesas_recorrentes
SET recorrencia = 'Mensal'
WHERE recorrencia IS NULL OR recorrencia = '';
