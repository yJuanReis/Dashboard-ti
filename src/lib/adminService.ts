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
import { logUpdate, logDelete } from './auditService';

/**
 * Atualiza a senha de um usuário (via RPC seguro)
 * A função RPC valida permissões e executa a operação no servidor
 */
export async function updateUserPasswordByAdmin(
  targetUserId: string,
  newPassword: string,
  userEmail?: string,
  userName?: string
): Promise<void> {
  try {
    // Busca dados do usuário antes de atualizar (para o log)
    let oldUserData: Record<string, any> | null = null;
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();
      
      if (profile) {
        oldUserData = profile as Record<string, any>;
      }
    } catch (err) {
      // Se não conseguir buscar, continua mesmo assim
      console.warn('Não foi possível buscar dados do usuário para log:', err);
    }

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

    // Registra log de auditoria
    const email = userEmail || oldUserData?.email || 'Desconhecido';
    logUpdate(
      'user_profiles',
      targetUserId,
      oldUserData || { user_id: targetUserId },
      { ...oldUserData, password: '***REDACTED***' } as Record<string, any>,
      `Alterou senha do usuário "${email}"`
    ).catch(err => console.warn('Erro ao registrar log de auditoria:', err));
  } catch (error: any) {
    console.error('Erro ao atualizar senha:', error);
    throw error;
  }
}

/**
 * Deleta um usuário do sistema (via RPC seguro)
 * A função RPC valida permissões e executa a operação no servidor
 */
export async function deleteUserByAdmin(
  targetUserId: string,
  userEmail?: string,
  userName?: string
): Promise<void> {
  try {
    // Busca dados do usuário antes de deletar (para o log)
    let oldUserData: Record<string, any> | null = null;
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();
      
      if (profile) {
        oldUserData = profile as Record<string, any>;
      }
    } catch (err) {
      // Se não conseguir buscar, continua mesmo assim
      console.warn('Não foi possível buscar dados do usuário para log:', err);
    }

    // Validar e executar via RPC (função do servidor faz tudo)
    const { error } = await supabase.rpc('delete_user_by_admin', {
      target_user_id: targetUserId
    });

    if (error) {
      throw new Error(error.message);
    }

    // Registra log de auditoria
    const email = userEmail || oldUserData?.email || 'Desconhecido';
    logDelete(
      'user_profiles',
      targetUserId,
      oldUserData || { user_id: targetUserId, email },
      `Excluiu usuário "${email}"`
    ).catch(err => console.warn('Erro ao registrar log de auditoria:', err));
  } catch (error: any) {
    console.error('Erro ao excluir usuário:', error);
    throw error;
  }
}

