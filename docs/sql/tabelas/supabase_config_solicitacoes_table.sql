-- Script SQL para criar a tabela config_solicitacoes no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard
-- Esta tabela armazena as configurações de serviços e empresas para solicitações

-- Cria a tabela config_solicitacoes (se ainda não existir)
CREATE TABLE IF NOT EXISTS public.config_solicitacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    servico TEXT NOT NULL,
    descricao TEXT NOT NULL,
    empresa TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cria índices para melhorar a performance nas buscas
CREATE INDEX IF NOT EXISTS idx_config_solicitacoes_servico ON public.config_solicitacoes(servico);
CREATE INDEX IF NOT EXISTS idx_config_solicitacoes_empresa ON public.config_solicitacoes(empresa);
CREATE INDEX IF NOT EXISTS idx_config_solicitacoes_descricao ON public.config_solicitacoes(descricao);

-- Cria uma função para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION update_config_solicitacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Cria um trigger para atualizar o updated_at automaticamente
DROP TRIGGER IF EXISTS update_config_solicitacoes_updated_at_trigger ON public.config_solicitacoes;
CREATE TRIGGER update_config_solicitacoes_updated_at_trigger 
    BEFORE UPDATE ON public.config_solicitacoes
    FOR EACH ROW 
    EXECUTE FUNCTION update_config_solicitacoes_updated_at();

-- Insere os dados iniciais
INSERT INTO public.config_solicitacoes (servico, descricao, empresa) VALUES
('JMV', 'STREAMING DE CÂMERAS DO TEMPO', 'VEROLME'),
('CLARO', 'LINK DE INTERNET', 'GLÓRIA'),
('CLARO', 'LINK DE INTERNET', 'ITACURUÇA'),
('CLARO', 'LINK DE INTERNET', 'PARATY'),
('CLARO', 'LINK DE INTERNET', 'RIBEIRA'),
('CLARO', 'LINK DE INTERNET', 'VEROLME'),
('DOCUSIGN', 'ASSINATURA DIGITAL', 'VEROLME'),
('EMEX', 'LINK DE INTERNET', 'BOA VISTA'),
('HOSTGATOR', 'RENOVAÇÃO DE PLANO M - BRMARINAS.COM.BR', 'VEROLME'),
('HOSTGATOR', 'RENOVAÇÃO DO DOMÍNIO AMIGOSDOMAR.ORG.BR', 'VEROLME'),
('IPNET', 'GOOGLE WORKSPACE', 'VEROLME'),
('JACTEL', 'TELEFONIA MÓVEL', 'GLÓRIA'),
('JUMP PARK', 'APLICATIVO DE CONTROLE DE ESTACIONAMENTO', 'GLÓRIA'),
('JUMP PARK', 'APLICATIVO DE CONTROLE DE ESTACIONAMENTO', 'EMG'),
('LOUPEN - LOGMEIN', 'RENOVAÇÃO DE LICENÇA', 'VEROLME'),
('MAPDATA', 'AUTOCAD', 'VEROLME'),
('MAX QUALITY', 'LOCAÇÃO DE IMPRESSORA', 'GLÓRIA'),
('MAX QUALITY', 'LOCAÇÃO DE IMPRESSORA', 'ITACURUÇA'),
('MAX QUALITY', 'LOCAÇÃO DE IMPRESSORA', 'JL BRACUHY'),
('MAX QUALITY', 'LOCAÇÃO DE IMPRESSORA', 'PIRATAS'),
('MAX QUALITY', 'LOCAÇÃO DE IMPRESSORA', 'RIBEIRA'),
('MAX QUALITY', 'LOCAÇÃO DE IMPRESSORA', 'VEROLME'),
('MAX QUALITY', 'LOCAÇÃO DE IMPRESSORA', 'BÚZIOS'),
('OI FIBRA', 'LINK DE INTERNET', 'GLÓRIA'),
('OI FIBRA', 'LINK DE INTERNET', 'PIRATAS'),
('OI FIBRA', 'LINK DE INTERNET', 'RIBEIRA'),
('OI FIBRA', 'LINK DE INTERNET', 'VEROLME'),
('OI TELECOM', 'TELEFONIA FIXA (LINHA)', 'GLÓRIA'),
('OI TELECOM', 'TELEFONIA FIXA (N° CLIENTE)', 'VEROLME'),
('SENIOR', 'SISTEMA DE GESTÃO', 'VEROLME'),
('PONTOMAIS', 'SISTEMA DE PONTO', 'VEROLME'),
('RJNET', 'LINK DE INTERNET', 'ITACURUÇA'),
('RJNET', 'LINK DE INTERNET', 'JL BRACUHY'),
('RJNET', 'LINK DE INTERNET', 'PARATY'),
('RJNET', 'LINK DE INTERNET', 'PIRATAS'),
('RJNET', 'LINK DE INTERNET', 'RIBEIRA'),
('RJNET', 'LINK DE INTERNET', 'VEROLME'),
('TELELITORANEA', 'CONTRATO DE LOCAÇÃO DE CÂMERAS', 'VEROLME'),
('TELELITORANEA', 'CONTRATO DE LOCAÇÃO DE CÂMERAS', 'RIBEIRA'),
('TELELITORANEA', 'CONTRATO DE LOCAÇÃO DE CÂMERAS', 'PARATY'),
('TELELITORANEA', 'CONTRATO DE LOCAÇÃO DE CÂMERAS', 'JL BRACUHY'),
('TELELITORANEA', 'CONTRATO DE LOCAÇÃO DE CÂMERAS', 'ITACURUÇA'),
('TELELITORANEA', 'CONTRATO DE LOCAÇÃO DE CÂMERAS', 'GLÓRIA'),
('TELELITORANEA', 'CONTRATO DE LOCAÇÃO DE CÂMERAS', 'BÚZIOS'),
('TNB', 'LINK DE INTERNET', 'GLÓRIA'),
('TOMTICKET', 'ASSINATURA DE SOFTWARE DE GESTÃO DE CHAMADOS', 'VEROLME'),
('VIVA ONLINE', 'LINK DE INTERNET (ADM-BR)', 'JL BRACUHY'),
('VIVO', 'TELEFONIA MÓVEL', 'GLÓRIA'),
('VIVO', 'TELEFONIA MÓVEL', 'VEROLME'),
('VIVO', 'TELEFONIA MÓVEL', 'JL BRACUHY'),
('TELELITORANEA', 'CONTRATO DE MANUTENÇÃO', 'VEROLME')
ON CONFLICT DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE public.config_solicitacoes IS 'Tabela de configuração de serviços e empresas para solicitações';
COMMENT ON COLUMN public.config_solicitacoes.servico IS 'Nome do serviço prestado';
COMMENT ON COLUMN public.config_solicitacoes.descricao IS 'Descrição detalhada do serviço';
COMMENT ON COLUMN public.config_solicitacoes.empresa IS 'Nome da empresa/marina que utiliza o serviço';

