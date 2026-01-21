-- ============================================
-- REMOVER TABELAS NÃO UTILIZADAS
-- ============================================
-- Script para deletar as tabelas servicos, produtos e despesas_recorrentes
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================

-- ============================================
-- 1. REMOVER TRIGGERS E FUNÇÕES RELACIONADAS
-- ============================================

-- Remover trigger da tabela despesas_recorrentes
DROP TRIGGER IF EXISTS update_despesas_recorrentes_updated_at_trigger ON public.despesas_recorrentes;

-- Remover função da tabela despesas_recorrentes
DROP FUNCTION IF EXISTS update_despesas_recorrentes_updated_at();

-- ============================================
-- 2. REMOVER ÍNDICES DAS TABELAS
-- ============================================

-- Índices da tabela despesas_recorrentes
DROP INDEX IF EXISTS idx_despesas_recorrentes_tipo;
DROP INDEX IF EXISTS idx_despesas_recorrentes_match_empresa;
DROP INDEX IF EXISTS idx_despesas_recorrentes_ativo;
DROP INDEX IF EXISTS idx_despesas_recorrentes_created_at;

-- ============================================
-- 3. REMOVER POLÍTICAS RLS (se existirem)
-- ============================================

-- Políticas da tabela despesas_recorrentes (descomente se RLS estiver habilitado)
-- DROP POLICY IF EXISTS "Permitir leitura para usuários autenticados" ON public.despesas_recorrentes;
-- DROP POLICY IF EXISTS "Permitir inserção para usuários autenticados" ON public.despesas_recorrentes;
-- DROP POLICY IF EXISTS "Permitir atualização para usuários autenticados" ON public.despesas_recorrentes;
-- DROP POLICY IF EXISTS "Permitir exclusão para usuários autenticados" ON public.despesas_recorrentes;

-- ============================================
-- 4. DESABILITAR RLS (se estiver habilitado)
-- ============================================

-- ALTER TABLE public.despesas_recorrentes DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. REMOVER AS TABELAS
-- ============================================

-- Remover tabela despesas_recorrentes
DROP TABLE IF EXISTS public.despesas_recorrentes;

-- Remover tabela servicos
DROP TABLE IF EXISTS public.servicos;

-- Remover tabela produtos
DROP TABLE IF EXISTS public.produtos;

-- ============================================
-- 6. VERIFICAR RESULTADO
-- ============================================

-- Verificar se as tabelas foram removidas
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('servicos', 'produtos', 'despesas_recorrentes')
ORDER BY tablename;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- ⚠️  ATENÇÃO: Esta operação é IRREVERSÍVEL!
--
-- Antes de executar este script:
-- 1. Faça backup dos dados se necessário
-- 2. Certifique-se de que essas tabelas não são mais utilizadas
-- 3. Execute em ambiente de desenvolvimento primeiro
--
-- Após executar:
-- 1. Verifique se não há erros na aplicação
-- 2. Remova referências no código se ainda existirem
-- 3. Atualize documentação se necessário
-- ============================================