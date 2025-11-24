-- ============================================
-- TABELA DE SOLICITAÇÕES DE ACESSO
-- ============================================
-- Esta tabela armazena as solicitações de acesso ao sistema
-- feitas através da página de login

CREATE TABLE IF NOT EXISTS public.access_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  motivo TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_access_requests_email ON public.access_requests(email);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON public.access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_created_at ON public.access_requests(created_at DESC);

-- ============================================
-- HABILITAR RLS (Row Level Security)
-- ============================================

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS
-- ============================================

-- Política: Qualquer pessoa pode inserir solicitações (público)
CREATE POLICY "Qualquer pessoa pode solicitar acesso"
  ON public.access_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Política: Apenas admins podem ver todas as solicitações
CREATE POLICY "Admins podem ver todas as solicitações"
  ON public.access_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Política: Apenas admins podem atualizar solicitações
CREATE POLICY "Admins podem atualizar solicitações"
  ON public.access_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Política: Apenas admins podem deletar solicitações
CREATE POLICY "Admins podem deletar solicitações"
  ON public.access_requests
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE public.access_requests IS 'Armazena solicitações de acesso ao sistema feitas através da página de login';
COMMENT ON COLUMN public.access_requests.status IS 'Status da solicitação: pending, approved, rejected, processed';
COMMENT ON COLUMN public.access_requests.processed_by IS 'ID do administrador que processou a solicitação';
COMMENT ON COLUMN public.access_requests.processed_at IS 'Data e hora em que a solicitação foi processada';

-- ============================================
-- VERIFICAÇÕES
-- ============================================

-- Verificar se a tabela foi criada
SELECT 
  tablename,
  schemaname
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'access_requests';

-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'access_requests'
ORDER BY cmd, policyname;

