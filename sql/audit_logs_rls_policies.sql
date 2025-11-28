-- =====================================================
-- RLS POLICIES PARA AUDIT_LOGS - Logs Imutáveis
-- =====================================================
-- 
-- Este script cria políticas de Row Level Security (RLS) para
-- garantir que os logs de auditoria sejam append-only (somente inserção)
-- e que apenas administradores possam ler os logs.
--
-- Execute este script no Supabase SQL Editor após criar a tabela audit_logs
--

-- Habilitar RLS na tabela audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICA 1: Permitir INSERT para usuários autenticados
-- =====================================================
-- Qualquer usuário autenticado pode inserir logs
-- (os logs serão criados automaticamente pelo sistema)
CREATE POLICY "Usuários autenticados podem inserir logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- POLÍTICA 2: Bloq

uear UPDATE e DELETE para todos
-- =====================================================
-- Ninguém pode atualizar ou deletar logs (append-only)
CREATE POLICY "Logs são imutáveis - sem UPDATE"
  ON audit_logs
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "Logs são imutáveis - sem DELETE"
  ON audit_logs
  FOR DELETE
  TO authenticated
  USING (false);

-- =====================================================
-- POLÍTICA 3: Apenas admins podem ler logs
-- =====================================================
-- Somente usuários com role 'admin' podem fazer SELECT
CREATE POLICY "Apenas admins podem ler logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );

-- =====================================================
-- VERIFICAÇÃO: Testar as políticas
-- =====================================================
-- 
-- Para testar se as políticas estão funcionando:
-- 
-- 1. Como usuário não-admin, tente fazer SELECT:
--    SELECT * FROM audit_logs;
--    (Deve retornar vazio ou erro)
--
-- 2. Como admin, tente fazer SELECT:
--    SELECT * FROM audit_logs;
--    (Deve retornar os logs)
--
-- 3. Como qualquer usuário, tente fazer UPDATE:
--    UPDATE audit_logs SET description = 'test' WHERE id = 'algum-id';
--    (Deve falhar)
--
-- 4. Como qualquer usuário, tente fazer DELETE:
--    DELETE FROM audit_logs WHERE id = 'algum-id';
--    (Deve falhar)
--

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================
-- Criar índices para melhorar a performance das consultas

-- Índice por usuário (para buscar logs de um usuário específico)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Índice por data (para buscar logs por período)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Índice por tipo de ação (para filtrar por ação)
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);

-- Índice por tabela (para filtrar por tabela)
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);

-- Índice composto para consultas complexas
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action_date 
  ON audit_logs(user_id, action_type, created_at DESC);

-- =====================================================
-- COMENTÁRIOS NAS COLUNAS
-- =====================================================
COMMENT ON TABLE audit_logs IS 'Tabela de auditoria com logs imutáveis (append-only). Apenas admins podem ler.';
COMMENT ON COLUMN audit_logs.action_type IS 'Tipo de ação: CREATE, UPDATE, DELETE';
COMMENT ON COLUMN audit_logs.action IS 'Ação específica do sistema (ex: PASSWORD_VIEWED, USER_LOGIN)';
COMMENT ON COLUMN audit_logs.ip_address IS 'Endereço IP do usuário que realizou a ação';
COMMENT ON COLUMN audit_logs.user_agent IS 'User agent do navegador usado';
COMMENT ON COLUMN audit_logs.device IS 'Tipo de dispositivo: Desktop, Mobile, Tablet';
COMMENT ON COLUMN audit_logs.old_data IS 'Dados antes da alteração (JSON)';
COMMENT ON COLUMN audit_logs.new_data IS 'Dados após a alteração (JSON)';
COMMENT ON COLUMN audit_logs.changed_fields IS 'Array de campos que foram alterados';

