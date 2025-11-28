-- =====================================================
-- POLÍTICA DE RETENÇÃO DE LOGS - 1 ANO
-- =====================================================
-- 
-- Este script cria uma função e um job agendado para
-- automaticamente deletar logs mais antigos que 1 ano.
--
-- IMPORTANTE: Este script requer a extensão pg_cron
-- que deve estar habilitada no seu projeto Supabase.
--
-- Para habilitar pg_cron:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em Database > Extensions
-- 3. Procure por 'pg_cron' e habilite
--

-- =====================================================
-- FUNÇÃO: Limpar logs antigos
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deletar logs com mais de 1 ano (365 dias)
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '365 days';
  
  -- Log da operação de limpeza
  RAISE NOTICE 'Limpeza de logs antigos executada em %', NOW();
END;
$$;

-- Adicionar comentário na função
COMMENT ON FUNCTION cleanup_old_audit_logs() IS 
  'Remove logs de auditoria com mais de 1 ano (365 dias). Executado automaticamente via pg_cron.';

-- =====================================================
-- POLÍTICA ALTERNATIVA: Função para customizar retenção
-- =====================================================
-- Esta função permite definir diferentes períodos de retenção
CREATE OR REPLACE FUNCTION cleanup_audit_logs_by_retention(retention_days INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Validar parâmetro
  IF retention_days < 1 THEN
    RAISE EXCEPTION 'retention_days deve ser maior que 0';
  END IF;
  
  -- Deletar e contar registros removidos
  WITH deleted AS (
    DELETE FROM audit_logs
    WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  -- Log da operação
  RAISE NOTICE 'Removidos % logs com mais de % dias', deleted_count, retention_days;
  
  RETURN deleted_count;
END;
$$;

-- Adicionar comentário
COMMENT ON FUNCTION cleanup_audit_logs_by_retention(INTEGER) IS 
  'Remove logs de auditoria mais antigos que o número de dias especificado. Retorna quantidade deletada.';

-- =====================================================
-- JOB AGENDADO: Executar limpeza automaticamente
-- =====================================================
-- NOTA: Só descomente isso se pg_cron estiver habilitado!
--
-- Este job executa a limpeza todo dia às 2h da manhã

/*
-- Verificar se pg_cron está habilitado
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Criar o job (executar apenas uma vez)
SELECT cron.schedule(
  'cleanup-old-audit-logs',           -- Nome do job
  '0 2 * * *',                         -- Cron: Todo dia às 2h AM
  $$SELECT cleanup_old_audit_logs();$$ -- Comando SQL
);

-- Para verificar se o job foi criado:
SELECT * FROM cron.job;

-- Para desabilitar o job (se necessário):
-- SELECT cron.unschedule('cleanup-old-audit-logs');
*/

-- =====================================================
-- TESTE MANUAL: Executar limpeza manualmente
-- =====================================================
-- 
-- Para executar a limpeza manualmente (como admin):
-- 
-- Opção 1: Usar a função padrão (1 ano):
-- SELECT cleanup_old_audit_logs();
--
-- Opção 2: Usar período customizado (ex: 180 dias):
-- SELECT cleanup_audit_logs_by_retention(180);
--
-- Para ver quantos logs seriam deletados SEM deletar:
-- SELECT COUNT(*) FROM audit_logs WHERE created_at < NOW() - INTERVAL '365 days';
--

-- =====================================================
-- VIEW: Estatísticas de retenção
-- =====================================================
-- View útil para monitorar a retenção de logs
CREATE OR REPLACE VIEW audit_logs_retention_stats AS
SELECT 
  COUNT(*) as total_logs,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as logs_last_7_days,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as logs_last_30_days,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '90 days') as logs_last_90_days,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '365 days') as logs_last_year,
  COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '365 days') as logs_older_than_year,
  MIN(created_at) as oldest_log,
  MAX(created_at) as newest_log,
  pg_size_pretty(pg_total_relation_size('audit_logs')) as table_size
FROM audit_logs;

-- Adicionar comentário
COMMENT ON VIEW audit_logs_retention_stats IS 
  'Estatísticas sobre retenção de logs de auditoria, incluindo quantidade por período e tamanho da tabela.';

-- =====================================================
-- FUNÇÃO: Arquivar logs antigos (alternativa à exclusão)
-- =====================================================
-- Em vez de deletar, você pode arquivar logs antigos em outra tabela
CREATE TABLE IF NOT EXISTS audit_logs_archive (
  LIKE audit_logs INCLUDING ALL
);

-- Adicionar comentário
COMMENT ON TABLE audit_logs_archive IS 
  'Arquivo de logs de auditoria antigos (mais de 1 ano).';

CREATE OR REPLACE FUNCTION archive_old_audit_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- Mover logs antigos para a tabela de arquivo
  WITH moved AS (
    INSERT INTO audit_logs_archive
    SELECT * FROM audit_logs
    WHERE created_at < NOW() - INTERVAL '365 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO archived_count FROM moved;
  
  -- Deletar da tabela principal
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '365 days';
  
  -- Log da operação
  RAISE NOTICE 'Arquivados % logs para audit_logs_archive', archived_count;
  
  RETURN archived_count;
END;
$$;

-- Adicionar comentário
COMMENT ON FUNCTION archive_old_audit_logs() IS 
  'Move logs com mais de 1 ano para a tabela audit_logs_archive antes de deletar da tabela principal.';

-- =====================================================
-- PERMISSÕES
-- =====================================================
-- Garantir que apenas admins podem executar as funções de limpeza
REVOKE ALL ON FUNCTION cleanup_old_audit_logs() FROM PUBLIC;
REVOKE ALL ON FUNCTION cleanup_audit_logs_by_retention(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION archive_old_audit_logs() FROM PUBLIC;

-- Conceder permissão apenas para authenticated (que será filtrado por RLS)
GRANT EXECUTE ON FUNCTION cleanup_old_audit_logs() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_audit_logs_by_retention(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION archive_old_audit_logs() TO authenticated;

-- Garantir que apenas admins podem ver a view de estatísticas
GRANT SELECT ON audit_logs_retention_stats TO authenticated;

-- =====================================================
-- INSTRUÇÕES FINAIS
-- =====================================================
--
-- 1. Execute este script no Supabase SQL Editor
-- 2. Habilite pg_cron se quiser limpeza automática
-- 3. Descomente e execute o código do job agendado
-- 4. Monitore com: SELECT * FROM audit_logs_retention_stats;
-- 5. Teste manualmente: SELECT cleanup_old_audit_logs();
--

