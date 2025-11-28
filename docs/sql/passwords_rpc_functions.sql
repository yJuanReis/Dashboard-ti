-- =====================================================
-- FUNÇÕES RPC PARA ABSTRAÇÃO DE SENHAS
-- =====================================================
-- Este arquivo cria funções RPC para ocultar a estrutura
-- do banco de dados no frontend, melhorando a segurança
-- =====================================================

-- 1. FUNÇÃO: Buscar todas as senhas do usuário autenticado
-- =====================================================
CREATE OR REPLACE FUNCTION get_passwords()
RETURNS TABLE (
  id bigint,
  servico text,
  usuario text,
  senha text,
  descricao text,
  link_de_acesso text,
  marina text,
  local text,
  contas_compartilhadas_info text,
  winbox text,
  www text,
  ssh text,
  cloud_intelbras text,
  link_rtsp text,
  tipo text,
  status text,
  created_at timestamptz
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    servico,
    usuario,
    senha,
    descricao,
    link_de_acesso,
    marina,
    local,
    contas_compartilhadas_info,
    winbox,
    www,
    ssh,
    cloud_intelbras,
    link_rtsp,
    tipo,
    status,
    created_at
  FROM passwords
  ORDER BY servico ASC;
$$;

-- Comentário da função
COMMENT ON FUNCTION get_passwords() IS 'Retorna todas as senhas ordenadas por serviço. Abstrai a estrutura da tabela do frontend.';


-- 2. FUNÇÃO: Criar nova senha
-- =====================================================
CREATE OR REPLACE FUNCTION create_password(
  p_servico text,
  p_usuario text DEFAULT NULL,
  p_senha text DEFAULT NULL,
  p_descricao text DEFAULT NULL,
  p_link_de_acesso text DEFAULT NULL,
  p_marina text DEFAULT NULL,
  p_local text DEFAULT NULL,
  p_contas_compartilhadas_info text DEFAULT NULL,
  p_winbox text DEFAULT NULL,
  p_www text DEFAULT NULL,
  p_ssh text DEFAULT NULL,
  p_cloud_intelbras text DEFAULT NULL,
  p_link_rtsp text DEFAULT NULL,
  p_tipo text DEFAULT NULL,
  p_status text DEFAULT NULL
)
RETURNS TABLE (
  id bigint,
  servico text,
  usuario text,
  senha text,
  descricao text,
  link_de_acesso text,
  marina text,
  local text,
  contas_compartilhadas_info text,
  winbox text,
  www text,
  ssh text,
  cloud_intelbras text,
  link_rtsp text,
  tipo text,
  status text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record passwords;
BEGIN
  -- Validação: serviço é obrigatório
  IF p_servico IS NULL OR trim(p_servico) = '' THEN
    RAISE EXCEPTION 'O campo serviço é obrigatório';
  END IF;

  -- Insere o novo registro
  INSERT INTO passwords (
    servico,
    usuario,
    senha,
    descricao,
    link_de_acesso,
    marina,
    local,
    contas_compartilhadas_info,
    winbox,
    www,
    ssh,
    cloud_intelbras,
    link_rtsp,
    tipo,
    status
  ) VALUES (
    trim(p_servico),
    p_usuario,
    p_senha,
    p_descricao,
    p_link_de_acesso,
    p_marina,
    p_local,
    p_contas_compartilhadas_info,
    p_winbox,
    p_www,
    p_ssh,
    p_cloud_intelbras,
    p_link_rtsp,
    p_tipo,
    p_status
  )
  RETURNING * INTO v_record;

  -- Retorna o registro criado
  RETURN QUERY
  SELECT 
    v_record.id,
    v_record.servico,
    v_record.usuario,
    v_record.senha,
    v_record.descricao,
    v_record.link_de_acesso,
    v_record.marina,
    v_record.local,
    v_record.contas_compartilhadas_info,
    v_record.winbox,
    v_record.www,
    v_record.ssh,
    v_record.cloud_intelbras,
    v_record.link_rtsp,
    v_record.tipo,
    v_record.status,
    v_record.created_at;
END;
$$;

-- Comentário da função
COMMENT ON FUNCTION create_password IS 'Cria uma nova senha com validação de campos obrigatórios. Retorna o registro criado.';


-- 3. FUNÇÃO: Atualizar senha existente
-- =====================================================
CREATE OR REPLACE FUNCTION update_password(
  p_id bigint,
  p_servico text DEFAULT NULL,
  p_usuario text DEFAULT NULL,
  p_senha text DEFAULT NULL,
  p_descricao text DEFAULT NULL,
  p_link_de_acesso text DEFAULT NULL,
  p_marina text DEFAULT NULL,
  p_local text DEFAULT NULL,
  p_contas_compartilhadas_info text DEFAULT NULL,
  p_winbox text DEFAULT NULL,
  p_www text DEFAULT NULL,
  p_ssh text DEFAULT NULL,
  p_cloud_intelbras text DEFAULT NULL,
  p_link_rtsp text DEFAULT NULL,
  p_tipo text DEFAULT NULL,
  p_status text DEFAULT NULL
)
RETURNS TABLE (
  id bigint,
  servico text,
  usuario text,
  senha text,
  descricao text,
  link_de_acesso text,
  marina text,
  local text,
  contas_compartilhadas_info text,
  winbox text,
  www text,
  ssh text,
  cloud_intelbras text,
  link_rtsp text,
  tipo text,
  status text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record passwords;
BEGIN
  -- Validação: ID é obrigatório
  IF p_id IS NULL THEN
    RAISE EXCEPTION 'O ID é obrigatório para atualização';
  END IF;

  -- Verifica se o registro existe
  IF NOT EXISTS (SELECT 1 FROM passwords WHERE passwords.id = p_id) THEN
    RAISE EXCEPTION 'Registro com ID % não encontrado', p_id;
  END IF;

  -- Atualiza apenas os campos fornecidos (não-nulos)
  UPDATE passwords
  SET
    servico = COALESCE(p_servico, servico),
    usuario = CASE WHEN p_usuario IS NOT NULL THEN p_usuario ELSE usuario END,
    senha = CASE WHEN p_senha IS NOT NULL THEN p_senha ELSE senha END,
    descricao = CASE WHEN p_descricao IS NOT NULL THEN p_descricao ELSE descricao END,
    link_de_acesso = CASE WHEN p_link_de_acesso IS NOT NULL THEN p_link_de_acesso ELSE link_de_acesso END,
    marina = CASE WHEN p_marina IS NOT NULL THEN p_marina ELSE marina END,
    local = CASE WHEN p_local IS NOT NULL THEN p_local ELSE local END,
    contas_compartilhadas_info = CASE WHEN p_contas_compartilhadas_info IS NOT NULL THEN p_contas_compartilhadas_info ELSE contas_compartilhadas_info END,
    winbox = CASE WHEN p_winbox IS NOT NULL THEN p_winbox ELSE winbox END,
    www = CASE WHEN p_www IS NOT NULL THEN p_www ELSE www END,
    ssh = CASE WHEN p_ssh IS NOT NULL THEN p_ssh ELSE ssh END,
    cloud_intelbras = CASE WHEN p_cloud_intelbras IS NOT NULL THEN p_cloud_intelbras ELSE cloud_intelbras END,
    link_rtsp = CASE WHEN p_link_rtsp IS NOT NULL THEN p_link_rtsp ELSE link_rtsp END,
    tipo = CASE WHEN p_tipo IS NOT NULL THEN p_tipo ELSE tipo END,
    status = CASE WHEN p_status IS NOT NULL THEN p_status ELSE status END
  WHERE passwords.id = p_id
  RETURNING * INTO v_record;

  -- Retorna o registro atualizado
  RETURN QUERY
  SELECT 
    v_record.id,
    v_record.servico,
    v_record.usuario,
    v_record.senha,
    v_record.descricao,
    v_record.link_de_acesso,
    v_record.marina,
    v_record.local,
    v_record.contas_compartilhadas_info,
    v_record.winbox,
    v_record.www,
    v_record.ssh,
    v_record.cloud_intelbras,
    v_record.link_rtsp,
    v_record.tipo,
    v_record.status,
    v_record.created_at;
END;
$$;

-- Comentário da função
COMMENT ON FUNCTION update_password IS 'Atualiza uma senha existente. Apenas campos fornecidos são atualizados.';


-- 4. FUNÇÃO: Deletar senha
-- =====================================================
CREATE OR REPLACE FUNCTION delete_password(p_id bigint)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record passwords;
BEGIN
  -- Validação: ID é obrigatório
  IF p_id IS NULL THEN
    RAISE EXCEPTION 'O ID é obrigatório para exclusão';
  END IF;

  -- Busca o registro antes de deletar (para retornar informações)
  SELECT * INTO v_record FROM passwords WHERE id = p_id;

  -- Verifica se o registro existe
  IF v_record.id IS NULL THEN
    RAISE EXCEPTION 'Registro com ID % não encontrado', p_id;
  END IF;

  -- Deleta o registro
  DELETE FROM passwords WHERE id = p_id;

  -- Retorna informações do registro deletado
  RETURN json_build_object(
    'success', true,
    'message', 'Senha deletada com sucesso',
    'deleted_record', json_build_object(
      'id', v_record.id,
      'servico', v_record.servico,
      'created_at', v_record.created_at
    )
  );
END;
$$;

-- Comentário da função
COMMENT ON FUNCTION delete_password IS 'Deleta uma senha pelo ID. Retorna informações do registro deletado.';


-- =====================================================
-- PERMISSÕES
-- =====================================================
-- Concede permissões de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION get_passwords() TO authenticated;
GRANT EXECUTE ON FUNCTION create_password TO authenticated;
GRANT EXECUTE ON FUNCTION update_password TO authenticated;
GRANT EXECUTE ON FUNCTION delete_password TO authenticated;

-- Revoga permissões para usuários anônimos
REVOKE EXECUTE ON FUNCTION get_passwords() FROM anon;
REVOKE EXECUTE ON FUNCTION create_password FROM anon;
REVOKE EXECUTE ON FUNCTION update_password FROM anon;
REVOKE EXECUTE ON FUNCTION delete_password FROM anon;


-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================
-- 
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Verifique se as funções foram criadas com sucesso
-- 3. Teste cada função individualmente:
--
-- -- Listar senhas:
-- SELECT * FROM get_passwords();
--
-- -- Criar senha:
-- SELECT * FROM create_password('Teste Serviço', 'usuario@teste.com', 'senha123');
--
-- -- Atualizar senha:
-- SELECT * FROM update_password(1, p_senha := 'nova_senha');
--
-- -- Deletar senha:
-- SELECT delete_password(1);
--
-- =====================================================

