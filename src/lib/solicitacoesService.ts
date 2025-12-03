import { supabase } from './supabaseClient';
import { logCreate, logUpdate, logDelete } from './auditService';
import { logger } from "@/lib/logger";

// Interface para o formato no banco de dados
export interface SolicitacaoDB {
  id: string;
  titulo?: string | null;
  descricao?: string | null;
  tipo?: string | null; // 'servico' | 'produto'
  status?: string | null; // 'pendente' | 'em_andamento' | 'concluido' | 'cancelado'
  prioridade?: string | null; // 'baixa' | 'media' | 'alta' | 'critica'
  solicitante?: string | null;
  responsavel?: string | null;
  marina?: string | null;
  valor_estimado?: number | null;
  data_limite?: string | null;
  observacoes?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Interface para o formato da aplicação
export interface Solicitacao {
  id: string;
  titulo?: string;
  descricao?: string;
  tipo?: 'servico' | 'produto';
  status?: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
  prioridade?: 'baixa' | 'media' | 'alta' | 'critica';
  solicitante?: string;
  responsavel?: string;
  marina?: string;
  valor_estimado?: number;
  data_limite?: string;
  observacoes?: string;
}

/**
 * Converte Solicitacao do formato do banco para o formato da aplicação
 */
function dbToSolicitacao(dbSolicitacao: SolicitacaoDB): Solicitacao {
  return {
    id: String(dbSolicitacao.id),
    titulo: dbSolicitacao.titulo || undefined,
    descricao: dbSolicitacao.descricao || undefined,
    tipo: dbSolicitacao.tipo as 'servico' | 'produto' | undefined,
    status: dbSolicitacao.status as 'pendente' | 'em_andamento' | 'concluido' | 'cancelado' | undefined,
    prioridade: dbSolicitacao.prioridade as 'baixa' | 'media' | 'alta' | 'critica' | undefined,
    solicitante: dbSolicitacao.solicitante || undefined,
    responsavel: dbSolicitacao.responsavel || undefined,
    marina: dbSolicitacao.marina || undefined,
    valor_estimado: dbSolicitacao.valor_estimado || undefined,
    data_limite: dbSolicitacao.data_limite || undefined,
    observacoes: dbSolicitacao.observacoes || undefined,
  };
}

/**
 * Converte Solicitacao do formato da aplicação para o formato do banco
 */
function solicitacaoToDB(solicitacao: Partial<Solicitacao>): Partial<SolicitacaoDB> {
  return {
    titulo: solicitacao.titulo || null,
    descricao: solicitacao.descricao || null,
    tipo: solicitacao.tipo || null,
    status: solicitacao.status || null,
    prioridade: solicitacao.prioridade || null,
    solicitante: solicitacao.solicitante || null,
    responsavel: solicitacao.responsavel || null,
    marina: solicitacao.marina || null,
    valor_estimado: solicitacao.valor_estimado || null,
    data_limite: solicitacao.data_limite || null,
    observacoes: solicitacao.observacoes || null,
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
 * Busca todas as solicitações do Supabase
 */
export async function fetchSolicitacoes(): Promise<Solicitacao[]> {
  try {
    logger.log('🔍 Buscando solicitações do Supabase...');
    const { data, error } = await supabase
      .from('solicitacoes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('❌ Erro ao buscar solicitações:', error);
      logger.error('Detalhes do erro:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return [];
    }

    logger.log(`✅ ${data?.length || 0} solicitações encontradas no Supabase`);
    if (data && data.length > 0) {
      logger.log('📋 Primeira solicitação (exemplo):', data[0]);
    }
    
    const solicitacoes = (data || []).map((item, index) => {
      try {
        return dbToSolicitacao(item);
      } catch (e) {
        logger.error(`❌ Erro ao converter solicitação ${index}:`, e, item);
        return null;
      }
    }).filter((solicitacao): solicitacao is Solicitacao => solicitacao !== null);
    
    logger.log(`📦 ${solicitacoes.length} solicitações convertidas com sucesso`);
    return solicitacoes;
  } catch (error) {
    logger.error('❌ Erro ao buscar solicitações:', error);
    handleSupabaseError(error, 'buscar solicitações');
    return [];
  }
}

/**
 * Cria uma nova solicitação no Supabase
 */
export async function createSolicitacao(solicitacao: Omit<Solicitacao, 'id'>): Promise<Solicitacao> {
  try {
    logger.log('➕ Criando nova solicitação...', solicitacao);
    
    const dbData = solicitacaoToDB(solicitacao);
    const { data, error } = await supabase
      .from('solicitacoes')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      logger.error('❌ Erro ao criar solicitação:', error);
      handleSupabaseError(error, 'criar solicitação');
    }

    const novaSolicitacao = dbToSolicitacao(data);
    
    // Registrar auditoria
    await logCreate(
      'solicitacoes',
      novaSolicitacao.id,
      novaSolicitacao,
      `Criou solicitação: ${novaSolicitacao.titulo || 'Sem título'} - ${novaSolicitacao.tipo || 'Sem tipo'}`
    ).catch(err => logger.warn('Erro ao registrar auditoria:', err));

    logger.log('✅ Solicitação criada com sucesso:', novaSolicitacao);
    return novaSolicitacao;
  } catch (error) {
    logger.error('❌ Erro ao criar solicitação:', error);
    handleSupabaseError(error, 'criar solicitação');
    throw error;
  }
}

/**
 * Atualiza uma solicitação existente no Supabase
 */
export async function updateSolicitacao(
  id: string,
  solicitacao: Partial<Solicitacao>
): Promise<Solicitacao> {
  try {
    logger.log(`🔄 Atualizando solicitação ${id}...`, solicitacao);
    
    // Buscar dados antigos para auditoria
    const { data: oldData } = await supabase
      .from('solicitacoes')
      .select('*')
      .eq('id', id)
      .single();

    const dbData = solicitacaoToDB(solicitacao);
    const { data, error } = await supabase
      .from('solicitacoes')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('❌ Erro ao atualizar solicitação:', error);
      handleSupabaseError(error, 'atualizar solicitação');
    }

    const solicitacaoAtualizada = dbToSolicitacao(data);
    
    // Registrar auditoria
    if (oldData) {
      const oldSolicitacao = dbToSolicitacao(oldData);
      
      await logUpdate(
        'solicitacoes',
        id,
        oldSolicitacao,
        solicitacaoAtualizada,
        `Atualizou solicitação: ${solicitacaoAtualizada.titulo || 'Sem título'} - ${solicitacaoAtualizada.tipo || 'Sem tipo'}`
      ).catch(err => logger.warn('Erro ao registrar auditoria:', err));
    }

    logger.log('✅ Solicitação atualizada com sucesso:', solicitacaoAtualizada);
    return solicitacaoAtualizada;
  } catch (error) {
    logger.error('❌ Erro ao atualizar solicitação:', error);
    handleSupabaseError(error, 'atualizar solicitação');
    throw error;
  }
}

/**
 * Deleta uma solicitação do Supabase
 */
export async function deleteSolicitacao(id: string): Promise<void> {
  try {
    logger.log(`🗑️ Deletando solicitação ${id}...`);
    
    // Buscar dados para auditoria
    const { data: oldData } = await supabase
      .from('solicitacoes')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('solicitacoes')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('❌ Erro ao deletar solicitação:', error);
      handleSupabaseError(error, 'deletar solicitação');
    }

    // Registrar auditoria
    if (oldData) {
      const oldSolicitacao = dbToSolicitacao(oldData);
      await logDelete(
        'solicitacoes',
        id,
        oldSolicitacao,
        `Deletou solicitação: ${oldSolicitacao.titulo || 'Sem título'} - ${oldSolicitacao.tipo || 'Sem tipo'}`
      ).catch(err => logger.warn('Erro ao registrar auditoria:', err));
    }

    logger.log('✅ Solicitação deletada com sucesso');
  } catch (error) {
    logger.error('❌ Erro ao deletar solicitação:', error);
    handleSupabaseError(error, 'deletar solicitação');
    throw error;
  }
}

