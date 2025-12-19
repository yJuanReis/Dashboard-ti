-- Adicionar coluna status_mes_atual na tabela despesas_recorrentes
-- Para controlar o status mensal (LANCADO/PENDENTE) de cada despesa

ALTER TABLE despesas_recorrentes
ADD COLUMN IF NOT EXISTS status_mes_atual VARCHAR(20) DEFAULT 'PENDENTE';

-- Atualizar registros existentes para PENDENTE
UPDATE despesas_recorrentes
SET status_mes_atual = 'PENDENTE'
WHERE status_mes_atual IS NULL OR status_mes_atual = '';

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'despesas_recorrentes'
AND column_name = 'status_mes_atual';
