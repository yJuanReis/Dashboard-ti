-- Script SQL para adicionar campo password_temporary na tabela user_profiles
-- Execute este script no SQL Editor do Supabase Dashboard

-- ============================================
-- ADICIONAR CAMPO PASSWORD_TEMPORARY
-- ============================================

-- Adicionar coluna password_temporary (BOOLEAN) para marcar senhas temporárias
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS password_temporary BOOLEAN DEFAULT FALSE;

-- Criar índice para melhor performance em consultas
CREATE INDEX IF NOT EXISTS idx_user_profiles_password_temporary 
ON public.user_profiles(password_temporary) 
WHERE password_temporary = TRUE;

-- ============================================
-- COMENTÁRIOS
-- ============================================

-- Este campo será usado para:
-- 1. Marcar quando um usuário foi criado com senha temporária pelo admin
-- 2. Forçar o usuário a alterar a senha no primeiro login
-- 3. Mostrar modal de troca de senha obrigatória após login

-- Quando o usuário alterar a senha pela primeira vez, este campo deve ser atualizado para FALSE

