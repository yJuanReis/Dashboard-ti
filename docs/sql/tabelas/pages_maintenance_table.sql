-- Tabela para gerenciar páginas em manutenção/avaliação
-- Permite controlar quais páginas aparecem com badge "Avaliar" na sidebar
-- e quais ficam ocultas por padrão para novos usuários

CREATE TABLE IF NOT EXISTS pages_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'avaliar' CHECK (status IN ('avaliar', 'dev', 'manutencao')),
  badge_text TEXT NOT NULL DEFAULT 'Avaliar',
  badge_variant TEXT NOT NULL DEFAULT 'yellow' CHECK (badge_variant IN ('yellow', 'gray', 'blue')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_pages_maintenance_path ON pages_maintenance(page_path);
CREATE INDEX IF NOT EXISTS idx_pages_maintenance_active ON pages_maintenance(is_active);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_pages_maintenance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pages_maintenance_updated_at
  BEFORE UPDATE ON pages_maintenance
  FOR EACH ROW
  EXECUTE FUNCTION update_pages_maintenance_updated_at();

-- Inserir páginas iniciais baseadas na configuração atual
INSERT INTO pages_maintenance (page_path, status, badge_text, badge_variant, is_active)
VALUES
  ('/Controle-hds', 'avaliar', 'Avaliar', 'yellow', true),
  ('/gestaorede', 'avaliar', 'Avaliar', 'yellow', true),
  ('/servidores', 'avaliar', 'Avaliar', 'yellow', true),
  ('/chamados', 'avaliar', 'Avaliar', 'yellow', true),
  ('/security-test', 'dev', 'Dev', 'gray', true),
  ('/configuracoes', 'dev', 'Dev', 'gray', true)
ON CONFLICT (page_path) DO NOTHING;

-- RLS (Row Level Security) - apenas admins podem ver/editar
ALTER TABLE pages_maintenance ENABLE ROW LEVEL SECURITY;

-- Política: apenas admins podem ler
CREATE POLICY "Admins can read pages_maintenance"
  ON pages_maintenance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Política: apenas admins podem inserir
CREATE POLICY "Admins can insert pages_maintenance"
  ON pages_maintenance
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Política: apenas admins podem atualizar
CREATE POLICY "Admins can update pages_maintenance"
  ON pages_maintenance
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Política: apenas admins podem deletar
CREATE POLICY "Admins can delete pages_maintenance"
  ON pages_maintenance
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

