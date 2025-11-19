import { supabase } from './supabaseClient';
import { getIcon } from './iconMap';
import type { LucideIcon } from 'lucide-react';
import { PASSWORDS_CONFIG, mapTableData } from './passwordsConfig';
import { logCreate, logUpdate, logDelete } from './auditService';
// import { logger } from './logsService'; // EM DESENVOLVIMENTO - Logs desabilitados temporariamente

// Interface para os dados que vêm do Supabase (sem o componente icon)
export interface PasswordEntryDB {
  id: string;
  service: string;
  username: string | null;
  password: string | null;
  category: string;
  description: string | null;
  icon: string | null; // Nome do ícone como string
  url: string | null;
  provider: "google" | "microsoft" | "routerboard" | "provedores" | "nvr" | null;
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
  updated_at?: string;
}

// Interface para uso no componente (com componente icon)
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

// Interface genérica para dados do Supabase (aceita qualquer estrutura)
type SupabaseRow = Record<string, any>;

// Função para converter dados do DB para o formato usado no componente
function dbToComponent(dbEntry: PasswordEntryDB): PasswordEntry {
  return {
    id: dbEntry.id || '',
    service: dbEntry.service || '',
    username: dbEntry.username || '',
    password: dbEntry.password || '',
    category: dbEntry.category || '',
    description: dbEntry.description || '',
    icon: getIcon(dbEntry.icon),
    url: dbEntry.url || undefined,
    provider: dbEntry.provider || null,
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

// Função auxiliar para tratar erros do Supabase de forma mais amigável
function handleSupabaseError(error: any, operation: string) {
  if (error?.code === '42P01') {
    throw new Error(`Tabela "${PASSWORDS_CONFIG.tableName}" não encontrada no Supabase. Verifique o nome da tabela em src/lib/passwordsConfig.ts`);
  }
  if (error?.code === '42703') {
    const columnName = error.message?.match(/column "([^"]+)"/)?.[1] || 'desconhecida';
    throw new Error(`Coluna "${columnName}" não encontrada na tabela "${PASSWORDS_CONFIG.tableName}". Verifique o mapeamento de campos em src/lib/passwordsConfig.ts. Erro completo: ${error.message}`);
  }
  console.error(`Erro ao ${operation}:`, error);
  throw error;
}

// Buscar todas as senhas
export async function fetchPasswords(): Promise<PasswordEntry[]> {
  try {
    // Busca usando o nome da tabela configurado
    // Usa select('*') para pegar todas as colunas disponíveis
    const { data, error } = await supabase
      .from(PASSWORDS_CONFIG.tableName)
      .select('*');

    if (error) {
      handleSupabaseError(error, 'buscar senhas');
      // Se for erro de tabela não encontrada, propaga o erro
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        throw error;
      }
      return [];
    }

    if (!data || data.length === 0) {
      console.log(`ℹ️ Nenhum dado encontrado na tabela "${PASSWORDS_CONFIG.tableName}"`);
      console.log('💡 Isso pode significar:');
      console.log('   1. A tabela está vazia - adicione dados no Supabase Dashboard');
      console.log('   2. O nome da tabela está incorreto em src/lib/passwordsConfig.ts');
      console.log('   3. As políticas RLS estão bloqueando o acesso');
      return [];
    }
    
    console.log(`✅ ${data.length} registro(s) encontrado(s) na tabela "${PASSWORDS_CONFIG.tableName}"`);

    // Mapeia os dados da tabela para o formato esperado
    const mappedData = data.map((row: SupabaseRow) => {
      const mapped = mapTableData(row);
      return dbToComponent(mapped as PasswordEntryDB);
    });

    // Ordena por serviço em JavaScript (mais seguro que ordenar no Supabase)
    mappedData.sort((a, b) => {
      const serviceA = a.service?.toLowerCase() || '';
      const serviceB = b.service?.toLowerCase() || '';
      return serviceA.localeCompare(serviceB);
    });

    return mappedData;
  } catch (error: any) {
    console.error('Erro ao buscar senhas:', error);
    // Retorna array vazio em caso de erro para não quebrar a aplicação
    if (error.message?.includes('não encontrada')) {
      throw error; // Re-lança erros de tabela não encontrada
    }
    return [];
  }
}

// Atualizar uma senha
export async function updatePassword(
  id: string,
  updates: Partial<Omit<PasswordEntryDB, 'id' | 'created_at' | 'updated_at'>>
): Promise<PasswordEntry> {
  try {
    // Busca os dados antigos antes de atualizar (para o log de auditoria)
    const { data: oldData } = await supabase
      .from(PASSWORDS_CONFIG.tableName)
      .select('*')
      .eq(PASSWORDS_CONFIG.fieldMapping.id, id)
      .single();

    // Mapeia os campos de atualização para os nomes da tabela
    const mapping = PASSWORDS_CONFIG.fieldMapping;
    const mappedUpdates: Record<string, any> = {};
    
    // Mapeia cada campo
    if (updates.service !== undefined) mappedUpdates[mapping.service] = updates.service;
    if (updates.username !== undefined) mappedUpdates[mapping.username] = updates.username;
    if (updates.password !== undefined) mappedUpdates[mapping.password] = updates.password;
    if (updates.description !== undefined) mappedUpdates[mapping.description] = updates.description;
    if (updates.url !== undefined) mappedUpdates[mapping.url] = updates.url;
    if (updates.marina !== undefined) mappedUpdates[mapping.marina] = updates.marina;
    if (updates.local !== undefined) mappedUpdates[mapping.local] = updates.local;
    if (updates.contas_compartilhadas_info !== undefined) mappedUpdates[mapping.contas_compartilhadas_info] = updates.contas_compartilhadas_info;
    if (updates.winbox !== undefined) mappedUpdates[mapping.winbox] = updates.winbox;
    if (updates.www !== undefined) mappedUpdates[mapping.www] = updates.www;
    if (updates.ssh !== undefined) mappedUpdates[mapping.ssh] = updates.ssh;
    if (updates.cloud_intelbras !== undefined) mappedUpdates[mapping.cloud_intelbras] = updates.cloud_intelbras;
    if (updates.link_rtsp !== undefined) mappedUpdates[mapping.link_rtsp] = updates.link_rtsp;
    if (updates.tipo !== undefined) mappedUpdates[mapping.tipo] = updates.tipo;
    if (updates.status !== undefined) mappedUpdates[mapping.status] = updates.status;

    const { data, error } = await supabase
      .from(PASSWORDS_CONFIG.tableName)
      .update(mappedUpdates)
      .eq(mapping.id, id)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, 'atualizar senha');
      throw error;
    }

    if (!data) {
      throw new Error('Nenhum dado retornado ao atualizar senha');
    }

    // Registra log de auditoria
    if (oldData) {
      const mappedOldData = mapTableData(oldData);
      const mappedNewData = mapTableData(data);
      const serviceName = mappedNewData.service || mappedOldData.service || 'Desconhecido';
      
      logUpdate(
        PASSWORDS_CONFIG.tableName,
        id,
        mappedOldData as Record<string, any>,
        mappedNewData as Record<string, any>,
        `Atualizou senha do serviço "${serviceName}"`
      ).catch(err => console.warn('Erro ao registrar log de auditoria:', err));
    }

    const mapped = mapTableData(data);
    return dbToComponent(mapped as PasswordEntryDB);
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    throw error;
  }
}

// Criar uma nova senha
export async function createPassword(
  entry: Partial<Omit<PasswordEntryDB, 'id' | 'created_at' | 'updated_at'>> & { service: string }
): Promise<PasswordEntry> {
  try {
    // Mapeia os campos para os nomes da tabela
    const mapping = PASSWORDS_CONFIG.fieldMapping;
    const mappedEntry: Record<string, any> = {};
    
    if (entry.service !== undefined) mappedEntry[mapping.service] = entry.service;
    if (entry.username !== undefined) mappedEntry[mapping.username] = entry.username;
    if (entry.password !== undefined) mappedEntry[mapping.password] = entry.password;
    // category, icon e provider são derivados/calculados, não são salvos na tabela
    if (entry.description !== undefined) mappedEntry[mapping.description] = entry.description;
    if (entry.url !== undefined) mappedEntry[mapping.url] = entry.url;
    if (entry.marina !== undefined) mappedEntry[mapping.marina] = entry.marina;
    if (entry.local !== undefined) mappedEntry[mapping.local] = entry.local;
    if (entry.contas_compartilhadas_info !== undefined) mappedEntry[mapping.contas_compartilhadas_info] = entry.contas_compartilhadas_info;
    if (entry.winbox !== undefined) mappedEntry[mapping.winbox] = entry.winbox;
    if (entry.www !== undefined) mappedEntry[mapping.www] = entry.www;
    if (entry.ssh !== undefined) mappedEntry[mapping.ssh] = entry.ssh;
    if (entry.cloud_intelbras !== undefined) mappedEntry[mapping.cloud_intelbras] = entry.cloud_intelbras;
    if (entry.link_rtsp !== undefined) mappedEntry[mapping.link_rtsp] = entry.link_rtsp;
    if (entry.tipo !== undefined) mappedEntry[mapping.tipo] = entry.tipo;
    if (entry.status !== undefined) mappedEntry[mapping.status] = entry.status;

    // Log do que será inserido (sem senha) - EM DESENVOLVIMENTO
    // const logEntry = { ...mappedEntry };
    // if (logEntry[PASSWORDS_CONFIG.fieldMapping.password]) {
    //   logEntry[PASSWORDS_CONFIG.fieldMapping.password] = '***';
    // }
    // logger.info('SUPABASE', 'Inserindo registro na tabela', {
    //   tabela: PASSWORDS_CONFIG.tableName,
    //   dados: logEntry,
    // });

    const { data, error } = await supabase
      .from(PASSWORDS_CONFIG.tableName)
      .insert(mappedEntry)
      .select()
      .single();

    if (error) {
      // logger.error('SUPABASE', 'Erro ao inserir', {
      //   tabela: PASSWORDS_CONFIG.tableName,
      //   erro: error.message,
      //   codigo: error.code,
      //   detalhes: error.details,
      //   hint: error.hint,
      // }); // EM DESENVOLVIMENTO
      handleSupabaseError(error, 'criar senha');
      throw error;
    }

    if (!data) {
      // logger.error('SUPABASE', 'Nenhum dado retornado após inserção'); // EM DESENVOLVIMENTO
      throw new Error('Nenhum dado retornado ao criar senha');
    }

    // logger.success('SUPABASE', 'Registro inserido com sucesso', {
    //   id: data.id || data[PASSWORDS_CONFIG.fieldMapping.id],
    //   tabela: PASSWORDS_CONFIG.tableName,
    // }); // EM DESENVOLVIMENTO

    const mapped = mapTableData(data);
    const recordId = data.id || data[PASSWORDS_CONFIG.fieldMapping.id];
    const serviceName = mapped.service || 'Desconhecido';
    
    // Registra log de auditoria
    logCreate(
      PASSWORDS_CONFIG.tableName,
      recordId,
      mapped as Record<string, any>,
      `Criou senha do serviço "${serviceName}"`
    ).catch(err => console.warn('Erro ao registrar log de auditoria:', err));

    return dbToComponent(mapped as PasswordEntryDB);
  } catch (error) {
    console.error('Erro ao criar senha:', error);
    throw error;
  }
}

// Deletar uma senha
export async function deletePassword(id: string): Promise<void> {
  try {
    // Busca os dados antes de deletar (para o log de auditoria)
    const { data: oldData } = await supabase
      .from(PASSWORDS_CONFIG.tableName)
      .select('*')
      .eq(PASSWORDS_CONFIG.fieldMapping.id, id)
      .single();

    const { error } = await supabase
      .from(PASSWORDS_CONFIG.tableName)
      .delete()
      .eq(PASSWORDS_CONFIG.fieldMapping.id, id);

    if (error) {
      handleSupabaseError(error, 'deletar senha');
      throw error;
    }

    // Registra log de auditoria
    if (oldData) {
      const mappedOldData = mapTableData(oldData);
      const serviceName = mappedOldData.service || 'Desconhecido';
      
      logDelete(
        PASSWORDS_CONFIG.tableName,
        id,
        mappedOldData as Record<string, any>,
        `Excluiu senha do serviço "${serviceName}"`
      ).catch(err => console.warn('Erro ao registrar log de auditoria:', err));
    }
  } catch (error) {
    console.error('Erro ao deletar senha:', error);
    throw error;
  }
}

