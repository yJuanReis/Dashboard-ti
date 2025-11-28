-- ═══════════════════════════════════════════════════════════════
-- CORREÇÃO: Permitir que usuários atualizem password_temporary
-- ═══════════════════════════════════════════════════════════════
-- PROBLEMA: Usuários não conseguem atualizar password_temporary = false
-- SOLUÇÃO: Garantir que a política RLS permite atualizar este campo
-- ═══════════════════════════════════════════════════════════════

-- Verificar políticas existentes de UPDATE
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_profiles'
AND cmd = 'UPDATE'
ORDER BY policyname;

-- ============================================
-- REMOVER POLÍTICA RESTRITIVA (SE EXISTIR)
-- ============================================
-- Se houver uma política que só permite atualizar 'nome', vamos removê-la
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio nome" ON public.user_profiles;

-- ============================================
-- CRIAR POLÍTICA CORRETA PARA UPDATE
-- ============================================
-- Política: Usuários podem atualizar seu próprio perfil
-- Permite atualizar nome, password_temporary e outros campos do próprio perfil
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- VERIFICAR SE FUNCIONOU
-- ============================================
-- Execute como usuário comum (não admin) para testar:
-- UPDATE public.user_profiles
-- SET password_temporary = false, nome = 'Teste'
-- WHERE user_id = auth.uid();

-- ============================================
-- VERIFICAR DADOS ATUAIS
-- ============================================
-- Verificar se há usuários com password_temporary = true
SELECT 
  user_id,
  email,
  nome,
  password_temporary,
  updated_at
FROM public.user_profiles
WHERE password_temporary = true
ORDER BY updated_at DESC;

-- ============================================
-- CORREÇÃO MANUAL (SE NECESSÁRIO)
-- ============================================
-- Se mesmo assim não funcionar, execute como admin para corrigir manualmente:
-- UPDATE public.user_profiles
-- SET password_temporary = false
-- WHERE email = 'seu-email@exemplo.com';

