/**
 * Serviço para operações administrativas no Supabase
 * 
 * IMPORTANTE: Todas as operações administrativas são feitas via RPC Functions
 * no backend. NUNCA use service_role key no frontend - isso é um risco crítico!
 * 
 * As funções RPC validam permissões e executam operações privilegiadas
 * de forma segura no servidor.
 */

import { supabase } from './supabaseClient';

/**
 * Atualiza a senha de um usuário (via RPC seguro)
 * A função RPC valida permissões e executa a operação no servidor
 */
export async function updateUserPasswordByAdmin(
  targetUserId: string,
  newPassword: string
): Promise<void> {
  try {
    // Validar e executar via RPC (função do servidor faz tudo)
    const { error } = await supabase.rpc(
      'update_user_password_by_admin',
      {
        target_user_id: targetUserId,
        new_password: newPassword
      }
    );

    if (error) {
      throw new Error(error.message);
    }
  } catch (error: any) {
    console.error('Erro ao atualizar senha:', error);
    throw error;
  }
}

/**
 * Deleta um usuário do sistema (via RPC seguro)
 * A função RPC valida permissões e executa a operação no servidor
 */
export async function deleteUserByAdmin(targetUserId: string): Promise<void> {
  try {
    // Validar e executar via RPC (função do servidor faz tudo)
    const { error } = await supabase.rpc('delete_user_by_admin', {
      target_user_id: targetUserId
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error: any) {
    console.error('Erro ao excluir usuário:', error);
    throw error;
  }
}

