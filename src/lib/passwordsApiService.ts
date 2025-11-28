/**
 * =====================================================
 * PASSWORDS API SERVICE - ABSTRAÇÃO RPC
 * =====================================================
 * 
 * Serviço que abstrai o acesso à tabela de senhas usando
 * funções RPC do Supabase, ocultando a estrutura do banco
 * de dados do frontend.
 * 
 * SEGURANÇA:
 * - Não expõe nomes de tabelas ou campos
 * - Validações centralizadas no backend (RPC)
 * - Facilita mudanças na estrutura do banco
 * =====================================================
 */

import { supabase } from './supabaseClient';
import { getIcon } from './iconMap';
import type { LucideIcon } from 'lucide-react';
import { logger } from '@/lib/logger';
import { sanitizeText } from './sanitize';

// =====================================================
// INTERFACES
// =====================================================

/**
 * Dados que vêm do Supabase via RPC (estrutura do banco)
 */
export interface PasswordEntryDB {
  id: string;
  servico: string;
  usuario: string | null;
  senha: string | null;
  descricao: string | null;
  link_de_acesso: string | null;
  marina: string | null;
  local: string | null;
  contas_compartilhadas_info: string | null;
  winbox: string | null;
  www: string | null;
  ssh: string | null;
  cloud_intelbras: string | null;
  link_rtsp: string | null;
  tipo: string | null;
  status: string | null;
  created_at?: string;
}

/**
 * Interface para uso no componente (formato normalizado)
 */
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
// FUNÇÕES DE TRANSFORMAÇÃO
// =====================================================

/**
 * Deriva a categoria do serviço baseado no nome
 */
function deriveCategory(service: string): string {
  if (!service) return 'Outros';
  const serviceLower = service.toLowerCase();
  
  if (serviceLower.includes('email') || serviceLower.includes('gmail') || serviceLower.includes('outlook')) {
    return 'Email';
  }
  if (serviceLower.includes('servidor') || serviceLower.includes('server')) {
    return 'Servidores';
  }
  if (serviceLower.includes('rede') || serviceLower.includes('router') || serviceLower.includes('winbox')) {
    return 'Redes';
  }
  
  return 'Outros';
}

/**
 * Deriva o ícone do serviço baseado no nome
 */
function deriveIconName(service: string): string | null {
  if (!service) return null;
  const serviceLower = service.toLowerCase();
  
  if (serviceLower.includes('email') || serviceLower.includes('gmail') || serviceLower.includes('outlook')) {
    return 'mail';
  }
  if (serviceLower.includes('servidor') || serviceLower.includes('server')) {
    return 'server';
  }
  if (serviceLower.includes('rede') || serviceLower.includes('router') || serviceLower.includes('winbox')) {
    return 'router';
  }
  
  return null;
}

/**
 * Converte dados do banco para formato do componente
 */
function dbToComponent(dbEntry: PasswordEntryDB): PasswordEntry {
  const iconName = deriveIconName(dbEntry.servico);
  
  return {
    id: String(dbEntry.id),
    service: dbEntry.servico || '',
    username: dbEntry.usuario || '',
    password: dbEntry.senha || '',
    category: deriveCategory(dbEntry.servico),
    description: dbEntry.descricao || '',
    icon: getIcon(iconName),
    url: dbEntry.link_de_acesso || undefined,
    provider: null,
    marina: dbEntry.marina || undefined,
    local: dbEntry.local || undefined,
    contas_compartilhadas_info: dbEntry.contas_compartilhadas_info || undefined,
    winbox: dbEntry.winbox || undefined,
    www: dbEntry.www || undefined,
    ssh: dbEntry.ssh || undefined,
    cloud_intelbras: dbEntry.cloud_intelbras || undefined,
    link_rtsp: dbEntry.link_rtsp || undefined,
    tipo: dbEntry.tipo || undefined,
    status: dbEntry.status || undefined,
  };
}

/**
 * Converte dados do componente para formato do banco
 * Aplica sanitização em todos os campos de texto
 */
function componentToDb(entry: Partial<PasswordEntry>): Partial<Omit<PasswordEntryDB, 'id' | 'created_at'>> {
  return {
    servico: entry.service ? sanitizeText(entry.service) : undefined,
    usuario: entry.username ? sanitizeText(entry.username) : undefined,
    senha: entry.password, // Senha não deve ser sanitizada pois pode ter caracteres especiais válidos
    descricao: entry.description ? sanitizeText(entry.description) : undefined,
    link_de_acesso: entry.url ? sanitizeText(entry.url) : undefined,
    marina: entry.marina ? sanitizeText(entry.marina) : undefined,
    local: entry.local ? sanitizeText(entry.local) : undefined,
    contas_compartilhadas_info: entry.contas_compartilhadas_info ? sanitizeText(entry.contas_compartilhadas_info) : undefined,
    winbox: entry.winbox ? sanitizeText(entry.winbox) : undefined,
    www: entry.www ? sanitizeText(entry.www) : undefined,
    ssh: entry.ssh ? sanitizeText(entry.ssh) : undefined,
    cloud_intelbras: entry.cloud_intelbras ? sanitizeText(entry.cloud_intelbras) : undefined,
    link_rtsp: entry.link_rtsp ? sanitizeText(entry.link_rtsp) : undefined,
    tipo: entry.tipo ? sanitizeText(entry.tipo) : undefined,
    status: entry.status ? sanitizeText(entry.status) : undefined,
  };
}

// =====================================================
// FUNÇÕES DE ERRO
// =====================================================

/**
 * Trata erros do Supabase de forma amigável
 */
function handleSupabaseError(error: any, operation: string): never {
  logger.error(`Erro ao ${operation}:`, error);
  
  if (error?.message) {
    throw new Error(`Erro ao ${operation}: ${error.message}`);
  }
  
  throw new Error(`Erro ao ${operation}`);
}

// =====================================================
// OPERAÇÕES CRUD
// =====================================================

/**
 * Busca todas as senhas usando RPC
 */
export async function fetchPasswords(): Promise<PasswordEntry[]> {
  try {
    const { data, error } = await supabase.rpc('get_passwords');

    if (error) {
      handleSupabaseError(error, 'buscar senhas');
    }

    if (!data || data.length === 0) {
      logger.log('ℹ️ Nenhuma senha encontrada');
      return [];
    }

    logger.log(`✅ ${data.length} senha(s) encontrada(s)`);

    // Converte os dados para o formato do componente
    return data.map((row: PasswordEntryDB) => dbToComponent(row));
  } catch (error: any) {
    logger.error('Erro ao buscar senhas:', error);
    return [];
  }
}

/**
 * Cria uma nova senha usando RPC
 */
export async function createPassword(
  entry: Partial<PasswordEntry> & { service: string }
): Promise<PasswordEntry> {
  try {
    // Valida campos obrigatórios
    if (!entry.service || entry.service.trim() === '') {
      throw new Error('O campo serviço é obrigatório');
    }

    // Converte para formato do banco
    const dbEntry = componentToDb(entry);

    // Chama a função RPC
    const { data, error } = await supabase.rpc('create_password', {
      p_servico: dbEntry.servico,
      p_usuario: dbEntry.usuario || null,
      p_senha: dbEntry.senha || null,
      p_descricao: dbEntry.descricao || null,
      p_link_de_acesso: dbEntry.link_de_acesso || null,
      p_marina: dbEntry.marina || null,
      p_local: dbEntry.local || null,
      p_contas_compartilhadas_info: dbEntry.contas_compartilhadas_info || null,
      p_winbox: dbEntry.winbox || null,
      p_www: dbEntry.www || null,
      p_ssh: dbEntry.ssh || null,
      p_cloud_intelbras: dbEntry.cloud_intelbras || null,
      p_link_rtsp: dbEntry.link_rtsp || null,
      p_tipo: dbEntry.tipo || null,
      p_status: dbEntry.status || null,
    });

    if (error) {
      handleSupabaseError(error, 'criar senha');
    }

    if (!data || data.length === 0) {
      throw new Error('Nenhum dado retornado ao criar senha');
    }

    logger.log(`✅ Senha criada com sucesso: ${dbEntry.servico}`);

    // Retorna o primeiro registro (RPC retorna array)
    return dbToComponent(data[0] as PasswordEntryDB);
  } catch (error) {
    logger.error('Erro ao criar senha:', error);
    throw error;
  }
}

/**
 * Atualiza uma senha usando RPC
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

    // Converte para formato do banco
    const dbUpdates = componentToDb(updates);

    // Chama a função RPC
    const { data, error } = await supabase.rpc('update_password', {
      p_id: parseInt(id),
      p_servico: dbUpdates.servico || null,
      p_usuario: dbUpdates.usuario || null,
      p_senha: dbUpdates.senha || null,
      p_descricao: dbUpdates.descricao || null,
      p_link_de_acesso: dbUpdates.link_de_acesso || null,
      p_marina: dbUpdates.marina || null,
      p_local: dbUpdates.local || null,
      p_contas_compartilhadas_info: dbUpdates.contas_compartilhadas_info || null,
      p_winbox: dbUpdates.winbox || null,
      p_www: dbUpdates.www || null,
      p_ssh: dbUpdates.ssh || null,
      p_cloud_intelbras: dbUpdates.cloud_intelbras || null,
      p_link_rtsp: dbUpdates.link_rtsp || null,
      p_tipo: dbUpdates.tipo || null,
      p_status: dbUpdates.status || null,
    });

    if (error) {
      handleSupabaseError(error, 'atualizar senha');
    }

    if (!data || data.length === 0) {
      throw new Error('Nenhum dado retornado ao atualizar senha');
    }

    logger.log(`✅ Senha atualizada com sucesso: ID ${id}`);

    // Retorna o primeiro registro (RPC retorna array)
    return dbToComponent(data[0] as PasswordEntryDB);
  } catch (error) {
    logger.error('Erro ao atualizar senha:', error);
    throw error;
  }
}

/**
 * Deleta uma senha usando RPC
 */
export async function deletePassword(id: string): Promise<void> {
  try {
    // Valida ID
    if (!id) {
      throw new Error('ID é obrigatório para exclusão');
    }

    // Chama a função RPC
    const { data, error } = await supabase.rpc('delete_password', {
      p_id: parseInt(id),
    });

    if (error) {
      handleSupabaseError(error, 'deletar senha');
    }

    logger.log(`✅ Senha deletada com sucesso: ID ${id}`);

    // data contém informações sobre o registro deletado (opcional)
    if (data) {
      logger.log('Registro deletado:', data);
    }
  } catch (error) {
    logger.error('Erro ao deletar senha:', error);
    throw error;
  }
}

