-- ============================================
-- REMOVER TABELA access_requests
-- ============================================
-- Este script remove completamente a tabela access_requests
-- e todas as políticas RLS relacionadas
-- 
-- ATENÇÃO: Esta operação é irreversível!
-- Certifique-se de fazer backup dos dados antes de executar.

-- ============================================
-- 1. REMOVER POLÍTICAS RLS
-- ============================================

DROP POLICY IF EXISTS "Qualquer pessoa pode solicitar acesso" ON public.access_requests;
DROP POLICY IF EXISTS "Admins podem ver todas as solicitações" ON public.access_requests;
DROP POLICY IF EXISTS "Admins podem atualizar solicitações" ON public.access_requests;
DROP POLICY IF EXISTS "Admins podem deletar solicitações" ON public.access_requests;

-- ============================================
-- 2. DESABILITAR RLS (se necessário)
-- ============================================

ALTER TABLE IF EXISTS public.access_requests DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. REMOVER ÍNDICES
-- ============================================

DROP INDEX IF EXISTS public.idx_access_requests_email;
DROP INDEX IF EXISTS public.idx_access_requests_status;
DROP INDEX IF EXISTS public.idx_access_requests_created_at;

-- ============================================
-- 4. REMOVER A TABELA
-- ============================================

DROP TABLE IF EXISTS public.access_requests CASCADE;

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar se a tabela foi removida
SELECT 
  tablename,
  schemaname
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'access_requests';

-- Se não retornar nenhuma linha, a tabela foi removida com sucesso.

