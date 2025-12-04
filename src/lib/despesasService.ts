/**
 * =====================================================
 * DESPESAS SERVICE - Gerenciamento de Despesas T.I.
 * =====================================================
 * 
 * Serviço para buscar e gerenciar despesas recorrentes
 * e esporádicas da tabela despesas_ti
 */

import { supabase } from './supabaseClient';
import { logger } from './logger';

// =====================================================
// INTERFACES
// =====================================================

export interface DespesaTI {
  id: string;
  fornecedor: string;
  desc_servico: string;
  tipo_despesa: 'Recorrente' | 'Esporadico';
  valor_medio: number;
  jan?: number;
  fev?: number;
  mar?: number;
  abr?: number;
  mai?: number;
  jun?: number;
  jul?: number;
  ago?: number;
  set?: number;
  out_?: number;
  nov?: number;
  dez?: number;
  created_at?: string;
  updated_at?: string;
}

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function handleSupabaseError(error: any, operation: string) {
  logger.error(`❌ Erro ao ${operation}:`, error);
  throw new Error(`Erro ao ${operation}: ${error.message || 'Erro desconhecido'}`);
}

// =====================================================
// OPERAÇÕES CRUD
// =====================================================

/**
 * Busca todas as despesas recorrentes
 */
export async function fetchDespesasRecorrentes(): Promise<DespesaTI[]> {
  try {
    logger.log('🔍 Buscando despesas recorrentes...');
    const { data, error } = await supabase
      .from('despesas_ti')
      .select('*')
      .eq('tipo_despesa', 'Recorrente')
      .order('fornecedor', { ascending: true });

    if (error) {
      handleSupabaseError(error, 'buscar despesas recorrentes');
    }

    logger.log(`✅ ${data?.length || 0} despesas recorrentes encontradas`);
    return (data || []) as DespesaTI[];
  } catch (error) {
    logger.error('❌ Erro ao buscar despesas recorrentes:', error);
    return [];
  }
}

/**
 * Busca todas as despesas esporádicas
 */
export async function fetchDespesasEsporadicas(): Promise<DespesaTI[]> {
  try {
    logger.log('🔍 Buscando despesas esporádicas...');
    const { data, error } = await supabase
      .from('despesas_ti')
      .select('*')
      .eq('tipo_despesa', 'Esporadico')
      .order('fornecedor', { ascending: true });

    if (error) {
      handleSupabaseError(error, 'buscar despesas esporádicas');
    }

    logger.log(`✅ ${data?.length || 0} despesas esporádicas encontradas`);
    return (data || []) as DespesaTI[];
  } catch (error) {
    logger.error('❌ Erro ao buscar despesas esporádicas:', error);
    return [];
  }
}

/**
 * Busca todas as despesas (recorrentes e esporádicas)
 */
export async function fetchTodasDespesas(): Promise<{
  recorrentes: DespesaTI[];
  esporadicas: DespesaTI[];
}> {
  try {
    const [recorrentes, esporadicas] = await Promise.all([
      fetchDespesasRecorrentes(),
      fetchDespesasEsporadicas(),
    ]);

    return {
      recorrentes,
      esporadicas,
    };
  } catch (error) {
    logger.error('❌ Erro ao buscar todas as despesas:', error);
    return {
      recorrentes: [],
      esporadicas: [],
    };
  }
}

/**
 * Formata valor em Real (BRL)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Obtém o valor do mês atual para uma despesa esporádica
 */
export function getValorMesAtual(despesa: DespesaTI): number {
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out_', 'nov', 'dez'];
  const dataHoje = new Date();
  const mesAtual = meses[dataHoje.getMonth()];
  
  // Tenta pegar o valor específico do mês, se não, usa a média
  const valorMes = (despesa as any)[mesAtual];
  return valorMes || despesa.valor_medio || 0;
}

/**
 * Obtém o nome da coluna do mês atual
 */
export function getMesAtual(): string {
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out_', 'nov', 'dez'];
  const dataHoje = new Date();
  return meses[dataHoje.getMonth()];
}

/**
 * Verifica se uma despesa recorrente está marcada no mês atual
 */
export function isDespesaMarcada(despesa: DespesaTI): boolean {
  const mesAtual = getMesAtual();
  const valor = (despesa as any)[mesAtual];
  return valor === 1 || valor === true;
}

/**
 * Atualiza o check de uma despesa recorrente para o mês atual
 */
export async function toggleDespesaCheck(despesaId: string, marcado: boolean): Promise<void> {
  try {
    const mesAtual = getMesAtual();
    const updateData: any = {};
    updateData[mesAtual] = marcado ? 1 : 0;

    const { error } = await supabase
      .from('despesas_ti')
      .update(updateData)
      .eq('id', despesaId);

    if (error) {
      handleSupabaseError(error, 'atualizar check da despesa');
    }

    logger.log(`✅ Check da despesa ${despesaId} atualizado para ${marcado ? 'marcado' : 'desmarcado'}`);
  } catch (error) {
    logger.error('❌ Erro ao atualizar check da despesa:', error);
    throw error;
  }
}

/**
 * Reseta todos os checks do mês atual para despesas recorrentes
 */
export async function resetarChecksMesAtual(): Promise<void> {
  try {
    const mesAtual = getMesAtual();
    const updateData: any = {};
    updateData[mesAtual] = 0;

    const { error } = await supabase
      .from('despesas_ti')
      .update(updateData)
      .eq('tipo_despesa', 'Recorrente');

    if (error) {
      handleSupabaseError(error, 'resetar checks do mês');
    }

    logger.log(`✅ Todos os checks do mês ${mesAtual} foram resetados`);
  } catch (error) {
    logger.error('❌ Erro ao resetar checks do mês:', error);
    throw error;
  }
}

