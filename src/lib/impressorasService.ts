import { supabase } from './supabaseClient';
import { logCreate, logUpdate, logDelete } from './auditService';
import { logger } from "@/lib/logger";

// Interface para o formato no banco de dados
export interface ImpressoraDB {
  id: string;
  marina?: string | null;
  local?: string | null;
  modelo?: string | null;
  numero_serie?: string | null;
  ip?: string | null;
  observacao?: string | null;
  created_at?: string;
}

// Interface para o formato da aplicação
export interface Impressora {
  id: string;
  marina?: string;
  local?: string;
  modelo?: string;
  numero_serie?: string;
  ip?: string;
  observacao?: string;
}

/**
 * Converte Impressora do formato do banco para o formato da aplicação
 */
function dbToImpressora(dbImpressora: ImpressoraDB): Impressora {
  return {
    id: String(dbImpressora.id),
    marina: dbImpressora.marina || undefined,
    local: dbImpressora.local || undefined,
    modelo: dbImpressora.modelo || undefined,
    numero_serie: dbImpressora.numero_serie || undefined,
    ip: dbImpressora.ip || undefined,
    observacao: dbImpressora.observacao || undefined,
  };
}

/**
 * Converte Impressora do formato da aplicação para o formato do banco
 */
function impressoraToDB(impressora: Partial<Impressora>): Partial<ImpressoraDB> {
  return {
    marina: impressora.marina || null,
    local: impressora.local || null,
    modelo: impressora.modelo || null,
    numero_serie: impressora.numero_serie || null,
    ip: impressora.ip || null,
    observacao: impressora.observacao || null,
  };
}

/**
 * Trata erros do Supabase de forma consistente
 */
function handleSupabaseError(error: any, operation: string) {
  logger.error(`Erro ao ${operation}:`, error);
  throw new Error(`Erro ao ${operation}: ${error.message || 'Erro desconhecido'}`);
}

/**
 * Busca todas as impressoras do Supabase
 */
export async function fetchImpressoras(): Promise<Impressora[]> {
  try {
    logger.log('🔍 Buscando impressoras do Supabase...');
    const { data, error } = await supabase
      .from('impressoras')
      .select('*')
      .order('marina', { ascending: true })
      .order('modelo', { ascending: true });

    if (error) {
      logger.error('❌ Erro ao buscar impressoras:', error);
      logger.error('Detalhes do erro:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return [];
    }

    logger.log(`✅ ${data?.length || 0} impressoras encontradas no Supabase`);
    if (data && data.length > 0) {
      logger.log('📋 Primeira impressora (exemplo):', data[0]);
    }
    
    const impressoras = (data || []).map((item, index) => {
      try {
        return dbToImpressora(item);
      } catch (e) {
        logger.error(`❌ Erro ao converter impressora ${index}:`, e, item);
        return null;
      }
    }).filter((impressora): impressora is Impressora => impressora !== null);
    
    logger.log(`📦 ${impressoras.length} impressoras convertidas com sucesso`);
    return impressoras;
  } catch (error) {
    logger.error('❌ Erro ao buscar impressoras:', error);
    handleSupabaseError(error, 'buscar impressoras');
    return [];
  }
}

/**
 * Cria uma nova impressora no Supabase
 */
export async function createImpressora(impressora: Omit<Impressora, 'id'>): Promise<Impressora> {
  try {
    logger.log('➕ Criando nova impressora...', impressora);
    
    const dbData = impressoraToDB(impressora);
    const { data, error } = await supabase
      .from('impressoras')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      logger.error('❌ Erro ao criar impressora:', error);
      handleSupabaseError(error, 'criar impressora');
    }

    const novaImpressora = dbToImpressora(data);
    
    // Registrar auditoria
    await logCreate(
      'impressoras',
      novaImpressora.id,
      novaImpressora,
      `Criou impressora: ${novaImpressora.modelo || 'Sem modelo'} - ${novaImpressora.marina || 'Sem marina'}`
    ).catch(err => logger.warn('Erro ao registrar auditoria:', err));

    logger.log('✅ Impressora criada com sucesso:', novaImpressora);
    return novaImpressora;
  } catch (error) {
    logger.error('❌ Erro ao criar impressora:', error);
    handleSupabaseError(error, 'criar impressora');
    throw error;
  }
}

/**
 * Atualiza uma impressora existente no Supabase
 */
export async function updateImpressora(
  id: string,
  impressora: Partial<Impressora>
): Promise<Impressora> {
  try {
    logger.log(`🔄 Atualizando impressora ${id}...`, impressora);
    
    // Buscar dados antigos para auditoria
    const { data: oldData } = await supabase
      .from('impressoras')
      .select('*')
      .eq('id', id)
      .single();

    const dbData = impressoraToDB(impressora);
    const { data, error } = await supabase
      .from('impressoras')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('❌ Erro ao atualizar impressora:', error);
      handleSupabaseError(error, 'atualizar impressora');
    }

    const impressoraAtualizada = dbToImpressora(data);
    
    // Registrar auditoria
    if (oldData) {
      const oldImpressora = dbToImpressora(oldData);
      
      await logUpdate(
        'impressoras',
        id,
        oldImpressora,
        impressoraAtualizada,
        `Atualizou impressora: ${impressoraAtualizada.modelo || 'Sem modelo'} - ${impressoraAtualizada.marina || 'Sem marina'}`
      ).catch(err => logger.warn('Erro ao registrar auditoria:', err));
    }

    logger.log('✅ Impressora atualizada com sucesso:', impressoraAtualizada);
    return impressoraAtualizada;
  } catch (error) {
    logger.error('❌ Erro ao atualizar impressora:', error);
    handleSupabaseError(error, 'atualizar impressora');
    throw error;
  }
}

/**
 * Deleta uma impressora do Supabase
 */
export async function deleteImpressora(id: string): Promise<void> {
  try {
    logger.log(`🗑️ Deletando impressora ${id}...`);
    
    // Buscar dados para auditoria
    const { data: oldData } = await supabase
      .from('impressoras')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('impressoras')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('❌ Erro ao deletar impressora:', error);
      handleSupabaseError(error, 'deletar impressora');
    }

    // Registrar auditoria
    if (oldData) {
      const oldImpressora = dbToImpressora(oldData);
      await logDelete(
        'impressoras',
        id,
        oldImpressora,
        `Deletou impressora: ${oldImpressora.modelo || 'Sem modelo'} - ${oldImpressora.marina || 'Sem marina'}`
      ).catch(err => logger.warn('Erro ao registrar auditoria:', err));
    }

    logger.log('✅ Impressora deletada com sucesso');
  } catch (error) {
    logger.error('❌ Erro ao deletar impressora:', error);
    handleSupabaseError(error, 'deletar impressora');
    throw error;
  }
}

