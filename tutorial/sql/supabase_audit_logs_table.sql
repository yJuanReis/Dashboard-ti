-- ═══════════════════════════════════════════════════════════════
-- 📋 SISTEMA DE LOGS DE AUDITORIA - SUPABASE
-- ═══════════════════════════════════════════════════════════════
-- Execute este script no SQL Editor do Supabase Dashboard
-- 
-- Este sistema registra todas as mudanças feitas no sistema:
-- - Criação de registros (CREATE)
-- - Atualização de registros (UPDATE) - com valores antigos e novos
-- - Exclusão de registros (DELETE) - com dados do registro excluído
-- - Informações: quem fez, quando, o que mudou
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- PARTE 1: CRIAR TABELA AUDIT_LOGS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Informações sobre a ação
  action_type TEXT NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE')),
  table_name TEXT NOT NULL, -- Nome da tabela afetada (ex: 'passwords', 'nvrs', 'user_profiles')
  record_id TEXT NOT NULL, -- ID do registro afetado
  
  -- Informações sobre o usuário
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT, -- Email do usuário (para facilitar consultas)
  user_name TEXT, -- Nome do usuário (se disponível)
  
  -- Dados da mudança
  old_data JSONB, -- Dados ANTES da mudança (para UPDATE e DELETE)
  new_data JSONB, -- Dados DEPOIS da mudança (para CREATE e UPDATE)
  changed_fields TEXT[], -- Array de campos que foram alterados (para UPDATE)
  
  -- Informações adicionais
  description TEXT, -- Descrição da ação (ex: "Atualizou senha do serviço X")
  ip_address TEXT, -- IP do usuário (opcional)
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ═══════════════════════════════════════════════════════════════
-- PARTE 2: ÍNDICES PARA MELHOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON public.audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_action ON public.audit_logs(table_name, action_type);

-- ═══════════════════════════════════════════════════════════════
-- PARTE 3: HABILITAR RLS (Row Level Security)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
-- PARTE 4: POLÍTICAS RLS
-- ═══════════════════════════════════════════════════════════════

-- Política: Apenas usuários autenticados podem inserir logs
-- (Isso permite que o sistema registre logs automaticamente)
CREATE POLICY "Permitir inserção de logs de auditoria"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política: Apenas administradores podem ler logs
CREATE POLICY "Apenas admins podem ler logs de auditoria"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- PARTE 5: COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ═══════════════════════════════════════════════════════════════

COMMENT ON TABLE public.audit_logs IS 
'Sistema de logs de auditoria. Registra todas as mudanças (CREATE, UPDATE, DELETE) 
feitas no sistema, incluindo quem fez, quando, o que mudou e valores antigos/novos.';

COMMENT ON COLUMN public.audit_logs.action_type IS 
'Tipo de ação: CREATE (criação), UPDATE (atualização), DELETE (exclusão)';

COMMENT ON COLUMN public.audit_logs.table_name IS 
'Nome da tabela onde a mudança ocorreu (ex: passwords, nvrs, user_profiles)';

COMMENT ON COLUMN public.audit_logs.record_id IS 
'ID do registro que foi criado, atualizado ou excluído';

COMMENT ON COLUMN public.audit_logs.old_data IS 
'Dados ANTES da mudança (em formato JSON). Disponível para UPDATE e DELETE.';

COMMENT ON COLUMN public.audit_logs.new_data IS 
'Dados DEPOIS da mudança (em formato JSON). Disponível para CREATE e UPDATE.';

COMMENT ON COLUMN public.audit_logs.changed_fields IS 
'Array de nomes dos campos que foram alterados (apenas para UPDATE)';

-- ═══════════════════════════════════════════════════════════════
-- FIM DO SCRIPT
-- ═══════════════════════════════════════════════════════════════

