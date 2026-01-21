-- Inserir orçamento para 2026
INSERT INTO public.configuracoes_orcamento (chave, nome, valor, tipo)
VALUES ('orcamento_mensal_total_2026', 'Orçamento Mensal Total 2026', 150000.00, 'orcamento')
ON CONFLICT (chave) DO NOTHING;
