-- Script SQL para criar a tabela de logs no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- Cria a tabela de logs
CREATE TABLE IF NOT EXISTS logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nivel VARCHAR(20) NOT NULL CHECK (nivel IN ('info', 'success', 'warning', 'error')),
  modulo VARCHAR(50) NOT NULL,
  mensagem TEXT NOT NULL,
  dados JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  usuario VARCHAR(255),
  stack TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cria índices para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_modulo ON logs(modulo);
CREATE INDEX IF NOT EXISTS idx_logs_nivel ON logs(nivel);
CREATE INDEX IF NOT EXISTS idx_logs_modulo_nivel ON logs(modulo, nivel);

-- Habilita Row Level Security (RLS)
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção de logs (ajuste conforme necessário)
CREATE POLICY "Permitir inserção de logs"
  ON logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para permitir leitura de logs (ajuste conforme necessário)
CREATE POLICY "Permitir leitura de logs"
  ON logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Comentários nas colunas para documentação
COMMENT ON TABLE logs IS 'Tabela para armazenar logs da aplicação';
COMMENT ON COLUMN logs.nivel IS 'Nível do log: info, success, warning, error';
COMMENT ON COLUMN logs.modulo IS 'Módulo da aplicação que gerou o log (ex: SENHAS, SUPABASE)';
COMMENT ON COLUMN logs.mensagem IS 'Mensagem do log';
COMMENT ON COLUMN logs.dados IS 'Dados adicionais em formato JSON';
COMMENT ON COLUMN logs.timestamp IS 'Data e hora do log';
COMMENT ON COLUMN logs.usuario IS 'Identificador do usuário (opcional)';
COMMENT ON COLUMN logs.stack IS 'Stack trace para erros (opcional)';


