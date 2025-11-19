-- ============================================
-- FUNÇÃO RPC PARA ATUALIZAR PERMISSÕES DE PÁGINAS
-- ============================================
-- Esta função garante que as permissões sejam salvas corretamente
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================

-- Função para atualizar page_permissions de um usuário
-- Permite que admins atualizem permissões de outros usuários
CREATE OR REPLACE FUNCTION public.update_user_page_permissions(
  target_user_id UUID,
  new_permissions TEXT[]
)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Verificar se o usuário atual é admin
  SELECT role INTO current_user_role
  FROM public.user_profiles
  WHERE user_id = auth.uid();
  
  -- Apenas admins podem atualizar permissões
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Apenas administradores podem atualizar permissões';
  END IF;
  
  -- Atualizar as permissões
  UPDATE public.user_profiles
  SET page_permissions = new_permissions
  WHERE user_id = target_user_id;
  
  -- Retornar sucesso
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant de permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION public.update_user_page_permissions(UUID, TEXT[]) TO authenticated;

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Testar a função (substitua o UUID pelo ID de um usuário de teste):
-- SELECT public.update_user_page_permissions(
--   'uuid-do-usuario-aqui'::UUID,
--   ARRAY['/home', '/senhas', '/crachas']::TEXT[]
-- );

-- Verificar se foi salvo:
-- SELECT email, page_permissions 
-- FROM public.user_profiles 
-- WHERE user_id = 'uuid-do-usuario-aqui';

