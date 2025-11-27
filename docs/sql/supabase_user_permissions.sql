-- ============================================
-- SCRIPT DE PERMISSÕES DE PÁGINAS - SUPABASE
-- ============================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- Este script adiciona suporte a permissões de páginas por usuário
-- ============================================

-- ============================================
-- ADICIONAR COLUNA DE PERMISSÕES
-- ============================================
-- Adiciona coluna para armazenar permissões de páginas (array de strings)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS page_permissions TEXT[] DEFAULT ARRAY[]::TEXT[];

-- ============================================
-- COMENTÁRIO NA COLUNA
-- ============================================
COMMENT ON COLUMN public.user_profiles.page_permissions IS 
'Array de rotas permitidas para o usuário. Ex: ["/home", "/senhas", "/crachas"]. 
Administradores têm acesso a todas as páginas automaticamente.';

-- ============================================
-- ÍNDICE PARA MELHOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_page_permissions 
ON public.user_profiles USING GIN (page_permissions);

-- ============================================
-- FUNÇÃO: Verificar permissão de página
-- ============================================
-- Verifica se o usuário atual tem permissão para acessar uma página específica
CREATE OR REPLACE FUNCTION public.has_page_permission(page_path TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  user_permissions TEXT[];
BEGIN
  -- Obter role e permissões do usuário atual
  SELECT role, COALESCE(page_permissions, ARRAY[]::TEXT[]) 
  INTO user_role, user_permissions
  FROM public.user_profiles
  WHERE user_id = auth.uid();
  
  -- Se não encontrar o usuário, negar acesso
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Administradores têm acesso a todas as páginas
  IF user_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Verificar se a página está na lista de permissões
  -- Também permite acesso se o array estiver vazio (acesso total para usuários sem restrições)
  IF array_length(user_permissions, 1) IS NULL OR array_length(user_permissions, 1) = 0 THEN
    RETURN TRUE; -- Sem restrições = acesso total
  END IF;
  
  RETURN page_path = ANY(user_permissions);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION public.has_page_permission(TEXT) TO authenticated;

-- ============================================
-- VERIFICAÇÕES
-- ============================================

-- Verificar se a coluna foi criada:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND table_name = 'user_profiles' 
-- AND column_name = 'page_permissions';

-- Verificar permissões de um usuário:
-- SELECT email, role, page_permissions 
-- FROM public.user_profiles 
-- WHERE email = 'seu-email@exemplo.com';

-- Testar função de permissão (execute enquanto estiver logado):
-- SELECT public.has_page_permission('/home');
-- SELECT public.has_page_permission('/senhas');

-- ============================================
-- EXEMPLOS DE USO
-- ============================================

-- Dar acesso apenas a algumas páginas para um usuário:
-- UPDATE public.user_profiles 
-- SET page_permissions = ARRAY['/home', '/senhas', '/crachas']
-- WHERE email = 'usuario@exemplo.com';

-- Remover todas as restrições (acesso total):
-- UPDATE public.user_profiles 
-- SET page_permissions = ARRAY[]::TEXT[]
-- WHERE email = 'usuario@exemplo.com';

-- Adicionar uma página à lista de permissões:
-- UPDATE public.user_profiles 
-- SET page_permissions = array_append(page_permissions, '/nova-pagina')
-- WHERE email = 'usuario@exemplo.com'
-- AND NOT ('/nova-pagina' = ANY(page_permissions));

-- Remover uma página da lista de permissões:
-- UPDATE public.user_profiles 
-- SET page_permissions = array_remove(page_permissions, '/pagina-remover')
-- WHERE email = 'usuario@exemplo.com';

