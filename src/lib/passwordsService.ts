/**
 * =====================================================
 * PASSWORDS SERVICE - CAMADA DE SERVIÇO
 * =====================================================
 * 
 * Este serviço atua como camada intermediária entre os
 * componentes e o passwordsApiService, adicionando:
 * - Logs de auditoria
 * - Validações adicionais
 * - Tratamento de erros
 * 
 * ARQUITETURA:
 * Componentes → passwordsService → passwordsApiService → RPC Functions → Banco
 * =====================================================
 */

import type { LucideIcon } from 'lucide-react';
import { 
  fetchPasswords as apiFetchPasswords,
  createPassword as apiCreatePassword,
  updatePassword as apiUpdatePassword,
  deletePassword as apiDeletePassword,
  type PasswordEntry as ApiPasswordEntry,
  type PasswordEntryDB
} from './passwordsApiService';
import { logCreate, logUpdate, logDelete } from './auditService';
import { logger } from '@/lib/logger';

// =====================================================
// RE-EXPORT DE INTERFACES
// =====================================================

export type { PasswordEntryDB } from './passwordsApiService';

export interface PasswordEntry {
  id: string;
  service: string;
  username: string;
  password: string;
  category: string;
  description: string;
  icon: LucideIcon;
  url?: string;
  provider?: "google" | "microsoft" | "routerboard" | "provedores" | "nvr" | null;
  marina?: string;
  local?: string;
  contas_compartilhadas_info?: string;
  winbox?: string;
  www?: string;
  ssh?: string;
  cloud_intelbras?: string;
  link_rtsp?: string;
  tipo?: string;
  status?: string;
}

// =====================================================
// OPERAÇÕES CRUD COM AUDITORIA
// =====================================================

/**
 * Buscar todas as senhas
 */
export async function fetchPasswords(): Promise<PasswordEntry[]> {
  try {
    return await apiFetchPasswords();
  } catch (error: any) {
    logger.error('Erro ao buscar senhas:', error);
    
    // Retorna array vazio em caso de erro para não quebrar a aplicação
    if (error.message?.includes('não encontrada')) {
      throw error; // Re-lança erros críticos
    }
    
    return [];
  }
}

/**
 * Criar uma nova senha
 */
export async function createPassword(
  entry: Partial<PasswordEntry> & { service: string }
): Promise<PasswordEntry> {
  try {
    // Valida campos obrigatórios
    if (!entry.service || entry.service.trim() === '') {
      throw new Error('O campo serviço é obrigatório');
    }

    // Cria a senha usando a API
    const result = await apiCreatePassword(entry);

    // Registra log de auditoria
    try {
      await logCreate(
        'passwords',
        result.id,
        {
          service: result.service,
          username: result.username,
          description: result.description,
          category: result.category,
          // Não loga a senha por segurança
        },
        `Criou senha do serviço "${result.service}"`
      );
    } catch (err) {
      logger.warn('Erro ao registrar log de auditoria:', err);
    }

    return result;
  } catch (error) {
    logger.error('Erro ao criar senha:', error);
    throw error;
  }
}

/**
 * Atualizar uma senha
 */
export async function updatePassword(
  id: string,
  updates: Partial<PasswordEntry>
): Promise<PasswordEntry> {
  try {
    // Valida ID
    if (!id) {
      throw new Error('ID é obrigatório para atualização');
    }

    // Busca dados antigos para o log de auditoria
    const allPasswords = await apiFetchPasswords();
    const oldData = allPasswords.find(p => p.id === id);

    // Atualiza a senha usando a API
    const result = await apiUpdatePassword(id, updates);

    // Registra log de auditoria
    if (oldData) {
      try {
        // Compara apenas campos não-sensíveis
        const oldDataForLog = {
          service: oldData.service,
          username: oldData.username,
          description: oldData.description,
          category: oldData.category,
        };

        const newDataForLog = {
          service: result.service,
          username: result.username,
          description: result.description,
          category: result.category,
        };

        await logUpdate(
          'passwords',
          id,
          oldDataForLog,
          newDataForLog,
          `Atualizou senha do serviço "${result.service}"`
        );
      } catch (err) {
        logger.warn('Erro ao registrar log de auditoria:', err);
      }
    }

    return result;
  } catch (error) {
    logger.error('Erro ao atualizar senha:', error);
    throw error;
  }
}

/**
 * Deletar uma senha
 */
export async function deletePassword(id: string): Promise<void> {
  try {
    // Valida ID
    if (!id) {
      throw new Error('ID é obrigatório para exclusão');
    }

    // Busca dados antes de deletar (para o log de auditoria)
    const allPasswords = await apiFetchPasswords();
    const oldData = allPasswords.find(p => p.id === id);

    // Deleta a senha usando a API
    await apiDeletePassword(id);

    // Registra log de auditoria
    if (oldData) {
      try {
        await logDelete(
          'passwords',
          id,
          {
            service: oldData.service,
            username: oldData.username,
            description: oldData.description,
            category: oldData.category,
          },
          `Excluiu senha do serviço "${oldData.service}"`
        );
      } catch (err) {
        logger.warn('Erro ao registrar log de auditoria:', err);
      }
    }
  } catch (error) {
    logger.error('Erro ao deletar senha:', error);
    throw error;
  }
}
