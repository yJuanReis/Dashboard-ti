import { supabase } from './supabaseClient';
import { logCreate, logUpdate, logDelete } from './auditService';
import { logger } from "@/lib/logger";

// Interface para o formato no banco de dados
export interface RamalDB {
  id: string;
  nome_local?: string | null;
  ramais?: string | null;
  marina?: string | null;
  created_at?: string;
}

// Interface para o formato da aplicação
export interface Ramal {
  id: string;
  nome_local?: string;
  ramais?: string;
  marina?: string;
}

/**
 * Converte Ramal do formato do banco para o formato da aplicação
 */
function dbToRamal(dbRamal: RamalDB): Ramal {
  return {
    id: String(dbRamal.id),
    nome_local: dbRamal.nome_local || undefined,
    ramais: dbRamal.ramais || undefined,
    marina: dbRamal.marina || undefined,
  };
}

/**
 * Converte Ramal do formato da aplicação para o formato do banco
 */
function ramalToDB(ramal: Partial<Ramal>): Partial<RamalDB> {
  return {
    nome_local: ramal.nome_local || null,
    ramais: ramal.ramais || null,
    marina: ramal.marina || null,
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
 * Busca todos os ramais do Supabase
 */
export async function fetchRamais(): Promise<Ramal[]> {
  try {
    logger.log('🔍 Buscando ramais do Supabase...');
    const { data, error } = await supabase
      .from('ramais')
      .select('*')
      .order('nome_local', { ascending: true });

    if (error) {
      logger.error('❌ Erro ao buscar ramais:', error);
      logger.error('Detalhes do erro:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return [];
    }

    logger.log(`✅ ${data?.length || 0} ramais encontrados no Supabase`);
    if (data && data.length > 0) {
      logger.log('📋 Primeiro ramal (exemplo):', data[0]);
    }
    
    const ramais = (data || []).map((item, index) => {
      try {
        return dbToRamal(item);
      } catch (e) {
        logger.error(`❌ Erro ao converter ramal ${index}:`, e, item);
        return null;
      }
    }).filter((ramal): ramal is Ramal => ramal !== null);
    
    logger.log(`📦 ${ramais.length} ramais convertidos com sucesso`);
    return ramais;
  } catch (error) {
    logger.error('❌ Erro ao buscar ramais:', error);
    handleSupabaseError(error, 'buscar ramais');
    return [];
  }
}

/**
 * Cria um novo ramal no Supabase
 */
export async function createRamal(ramal: Omit<Ramal, 'id'>): Promise<Ramal> {
  try {
    logger.log('➕ Criando novo ramal...', ramal);
    
    const dbData = ramalToDB(ramal);
    const { data, error } = await supabase
      .from('ramais')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      logger.error('❌ Erro ao criar ramal:', error);
      handleSupabaseError(error, 'criar ramal');
    }

    const novoRamal = dbToRamal(data);
    
    // Registrar auditoria
    await logCreate(
      'ramais',
      novoRamal.id,
      novoRamal,
      `Criou ramal: ${novoRamal.marina || 'Sem marina'} - ${novoRamal.nome_local || 'Sem nome'} - ${novoRamal.ramais || 'Sem ramais'}`
    ).catch(err => logger.warn('Erro ao registrar auditoria:', err));

    logger.log('✅ Ramal criado com sucesso:', novoRamal);
    return novoRamal;
  } catch (error) {
    logger.error('❌ Erro ao criar ramal:', error);
    handleSupabaseError(error, 'criar ramal');
    throw error;
  }
}

/**
 * Atualiza um ramal existente no Supabase
 */
export async function updateRamal(
  id: string,
  ramal: Partial<Ramal>
): Promise<Ramal> {
  try {
    logger.log(`🔄 Atualizando ramal ${id}...`, ramal);
    
    // Buscar dados antigos para auditoria
    const { data: oldData } = await supabase
      .from('ramais')
      .select('*')
      .eq('id', id)
      .single();

    const dbData = ramalToDB(ramal);
    const { data, error } = await supabase
      .from('ramais')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('❌ Erro ao atualizar ramal:', error);
      handleSupabaseError(error, 'atualizar ramal');
    }

    const ramalAtualizado = dbToRamal(data);
    
    // Registrar auditoria
    if (oldData) {
      const oldRamal = dbToRamal(oldData);
      
      await logUpdate(
        'ramais',
        id,
        oldRamal,
        ramalAtualizado,
        `Atualizou ramal: ${ramalAtualizado.marina || 'Sem marina'} - ${ramalAtualizado.nome_local || 'Sem nome'} - ${ramalAtualizado.ramais || 'Sem ramais'}`
      ).catch(err => logger.warn('Erro ao registrar auditoria:', err));
    }

    logger.log('✅ Ramal atualizado com sucesso:', ramalAtualizado);
    return ramalAtualizado;
  } catch (error) {
    logger.error('❌ Erro ao atualizar ramal:', error);
    handleSupabaseError(error, 'atualizar ramal');
    throw error;
  }
}

/**
 * Deleta um ramal do Supabase
 */
export async function deleteRamal(id: string): Promise<void> {
  try {
    logger.log(`🗑️ Deletando ramal ${id}...`);
    
    // Buscar dados para auditoria
    const { data: oldData } = await supabase
      .from('ramais')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('ramais')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('❌ Erro ao deletar ramal:', error);
      handleSupabaseError(error, 'deletar ramal');
    }

    // Registrar auditoria
    if (oldData) {
      const oldRamal = dbToRamal(oldData);
      await logDelete(
        'ramais',
        id,
        oldRamal,
        `Deletou ramal: ${oldRamal.marina || 'Sem marina'} - ${oldRamal.nome_local || 'Sem nome'} - ${oldRamal.ramais || 'Sem ramais'}`
      ).catch(err => logger.warn('Erro ao registrar auditoria:', err));
    }

    logger.log('✅ Ramal deletado com sucesso');
  } catch (error) {
    logger.error('❌ Erro ao deletar ramal:', error);
    handleSupabaseError(error, 'deletar ramal');
    throw error;
  }
}

