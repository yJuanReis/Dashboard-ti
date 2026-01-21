-- Verificar tabela e registros
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename = 'configuracoes_orcamento';

-- Listar todos os registros
SELECT * FROM public.configuracoes_orcamento ORDER BY chave;
