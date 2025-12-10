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
  empresa?: string | null; // Coluna na tabela se chama "empresa", não "marina"
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
    
    // Primeiro, vamos tentar buscar tudo para ver o que realmente existe
    const { data: allData, error: allError } = await supabase
      .from('despesas_ti')
      .select('*')
      .eq('tipo_despesa', 'Recorrente')
      .limit(1);
    
    if (allData && allData.length > 0) {
      logger.log('📋 Estrutura da primeira despesa (todas as colunas):', Object.keys(allData[0]));
      logger.log('📋 Dados completos da primeira despesa:', allData[0]);
    }
    
    // Agora busca com select específico
    const { data, error } = await supabase
      .from('despesas_ti')
      .select('id, fornecedor, desc_servico, tipo_despesa, valor_medio, empresa, jan, fev, mar, abr, mai, jun, jul, ago, set, out_, nov, dez, created_at')
      .eq('tipo_despesa', 'Recorrente')
      .order('fornecedor', { ascending: true });

    if (error) {
      logger.error('❌ Erro na query:', error);
      // Se der erro com select específico, tenta com *
      logger.log('🔄 Tentando buscar com select *...');
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('despesas_ti')
        .select('*')
        .eq('tipo_despesa', 'Recorrente')
        .order('fornecedor', { ascending: true });
      
      if (fallbackError) {
        handleSupabaseError(fallbackError, 'buscar despesas recorrentes');
      }
      
      logger.log(`✅ ${fallbackData?.length || 0} despesas recorrentes encontradas (fallback)`);
      if (fallbackData && fallbackData.length > 0) {
        logger.log('📋 Primeira despesa (fallback):', { 
          fornecedor: fallbackData[0].fornecedor, 
          empresa: fallbackData[0].empresa,
          todasColunas: Object.keys(fallbackData[0])
        });
      }
      return (fallbackData || []) as DespesaTI[];
    }

    logger.log(`✅ ${data?.length || 0} despesas recorrentes encontradas`);
    if (data && data.length > 0) {
      logger.log('📋 Primeira despesa (exemplo):', { 
        fornecedor: data[0].fornecedor, 
        empresa: data[0].empresa,
        temEmpresa: !!data[0].empresa,
        tipoEmpresa: typeof data[0].empresa
      });
      
      // Log de algumas despesas para debug
      const despesasComEmpresa = data.filter(d => d.empresa);
      logger.log(`📊 Despesas com empresa: ${despesasComEmpresa.length} de ${data.length}`);
      if (despesasComEmpresa.length > 0) {
        logger.log('📋 Exemplo de despesa COM empresa:', despesasComEmpresa[0]);
      }
    }
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
      .select('id, fornecedor, desc_servico, tipo_despesa, valor_medio, empresa, jan, fev, mar, abr, mai, jun, jul, ago, set, out_, nov, dez, created_at')
      .eq('tipo_despesa', 'Esporadico')
      .order('fornecedor', { ascending: true });

    if (error) {
      logger.error('❌ Erro na query:', error);
      // Se der erro com select específico, tenta com *
      logger.log('🔄 Tentando buscar com select *...');
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('despesas_ti')
        .select('*')
        .eq('tipo_despesa', 'Esporadico')
        .order('fornecedor', { ascending: true });
      
      if (fallbackError) {
        handleSupabaseError(fallbackError, 'buscar despesas esporádicas');
      }
      
      logger.log(`✅ ${fallbackData?.length || 0} despesas esporádicas encontradas (fallback)`);
      if (fallbackData && fallbackData.length > 0) {
        logger.log('📋 Primeira despesa (fallback):', { 
          fornecedor: fallbackData[0].fornecedor, 
          empresa: fallbackData[0].empresa,
          todasColunas: Object.keys(fallbackData[0])
        });
      }
      return (fallbackData || []) as DespesaTI[];
    }

    logger.log(`✅ ${data?.length || 0} despesas esporádicas encontradas`);
    if (data && data.length > 0) {
      logger.log('📋 Primeira despesa (exemplo):', { 
        fornecedor: data[0].fornecedor, 
        empresa: data[0].empresa,
        temEmpresa: !!data[0].empresa,
        tipoEmpresa: typeof data[0].empresa
      });
      
      // Log de algumas despesas para debug
      const despesasComMarina = data.filter(d => d.marina);
      logger.log(`📊 Despesas com marina: ${despesasComMarina.length} de ${data.length}`);
    }
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
    
    // Usa o nome correto da coluna (out_ tem underscore)
    const nomeColuna = mesAtual;
    updateData[nomeColuna] = marcado ? 1 : 0;

    logger.log(`🔄 Atualizando check da despesa ${despesaId} no mês ${nomeColuna} para ${marcado ? 'marcado' : 'desmarcado'}`);

    const { error } = await supabase
      .from('despesas_ti')
      .update(updateData)
      .eq('id', despesaId);

    if (error) {
      logger.error(`❌ Erro ao atualizar coluna ${nomeColuna}:`, error);
      // Se a coluna não existe, informa o usuário
      if (error.message?.includes('Could not find') || error.code === 'PGRST204') {
        throw new Error(
          `A coluna '${nomeColuna}' não existe na tabela despesas_ti. ` +
          `Execute o script SQL em docs/sql/tabelas/add_colunas_mensais_despesas_ti.sql para criar as colunas necessárias.`
        );
      }
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
    const nomeColuna = mesAtual;
    updateData[nomeColuna] = 0;

    logger.log(`🔄 Resetando checks do mês ${nomeColuna} para todas as despesas recorrentes`);

    const { error } = await supabase
      .from('despesas_ti')
      .update(updateData)
      .eq('tipo_despesa', 'Recorrente');

    if (error) {
      logger.error(`❌ Erro ao resetar coluna ${nomeColuna}:`, error);
      // Se a coluna não existe, informa o usuário
      if (error.message?.includes('Could not find') || error.code === 'PGRST204') {
        throw new Error(
          `A coluna '${nomeColuna}' não existe na tabela despesas_ti. ` +
          `Execute o script SQL em docs/sql/tabelas/add_colunas_mensais_despesas_ti.sql para criar as colunas necessárias.`
        );
      }
      handleSupabaseError(error, 'resetar checks do mês');
    }

    logger.log(`✅ Todos os checks do mês ${nomeColuna} foram resetados`);
  } catch (error) {
    logger.error('❌ Erro ao resetar checks do mês:', error);
    throw error;
  }
}

/**
 * Verifica se é dia 1 do mês
 */
export function isDia1(): boolean {
  const hoje = new Date();
  return hoje.getDate() === 1;
}

/**
 * Verifica se é dia 10 do mês
 */
export function isDia10(): boolean {
  const hoje = new Date();
  return hoje.getDate() === 10;
}

/**
 * Reseta automaticamente os checks se for dia 1 do mês
 * Retorna true se o reset foi executado, false caso contrário
 */
export async function resetarSeDia1(): Promise<boolean> {
  if (!isDia1()) {
    logger.log('📅 Não é dia 1, não será feito reset automático');
    return false;
  }

  try {
    logger.log('📅 É dia 1 do mês! Resetando checks automaticamente...');
    await resetarChecksMesAtual();
    logger.log('✅ Reset automático executado com sucesso');
    return true;
  } catch (error) {
    logger.error('❌ Erro ao resetar automaticamente no dia 1:', error);
    throw error;
  }
}

/**
 * Busca despesas recorrentes pendentes (não marcadas) do mês atual
 */
export async function fetchDespesasPendentes(): Promise<DespesaTI[]> {
  try {
    const mesAtual = getMesAtual();
    logger.log(`🔍 Buscando despesas pendentes do mês ${mesAtual}...`);

    const { data, error } = await supabase
      .from('despesas_ti')
      .select('id, fornecedor, desc_servico, tipo_despesa, valor_medio, empresa, jan, fev, mar, abr, mai, jun, jul, ago, set, out_, nov, dez, created_at')
      .eq('tipo_despesa', 'Recorrente')
      .or(`${mesAtual}.is.null,${mesAtual}.eq.0`)
      .order('fornecedor', { ascending: true });

    if (error) {
      logger.error('❌ Erro ao buscar despesas pendentes:', error);
      // Fallback: buscar todas e filtrar
      const { data: todasDespesas, error: errorTodas } = await supabase
        .from('despesas_ti')
        .select('*')
        .eq('tipo_despesa', 'Recorrente')
        .order('fornecedor', { ascending: true });

      if (errorTodas) {
        handleSupabaseError(errorTodas, 'buscar despesas pendentes');
      }

      // Filtrar manualmente
      const pendentes = (todasDespesas || []).filter((d: any) => {
        const valor = d[mesAtual];
        return valor === null || valor === undefined || valor === 0;
      }) as DespesaTI[];

      logger.log(`✅ ${pendentes.length} despesas pendentes encontradas (fallback)`);
      return pendentes;
    }

    logger.log(`✅ ${data?.length || 0} despesas pendentes encontradas`);
    return (data || []) as DespesaTI[];
  } catch (error) {
    logger.error('❌ Erro ao buscar despesas pendentes:', error);
    return [];
  }
}

/**
 * Normaliza string para comparação (remove acentos, espaços extras, converte para minúsculas)
 */
function normalizarString(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .trim()
    .replace(/\s+/g, ' '); // Remove espaços extras
}

/**
 * Verifica se duas strings são similares (match parcial)
 */
function stringsSimilares(str1: string, str2: string): boolean {
  const norm1 = normalizarString(str1);
  const norm2 = normalizarString(str2);
  
  // Match exato
  if (norm1 === norm2) return true;
  
  // Match parcial (uma contém a outra)
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
  // Match por palavras (se tiver pelo menos uma palavra em comum)
  const palavras1 = norm1.split(/\s+/).filter(p => p.length > 2);
  const palavras2 = norm2.split(/\s+/).filter(p => p.length > 2);
  
  return palavras1.some(p => palavras2.includes(p));
}

/**
 * Busca e marca automaticamente a despesa correspondente quando um serviço é criado
 * @param servicoNome Nome do serviço (campo servico da tabela servicos)
 * @param empresa Nome da empresa (campo empresa da tabela servicos)
 * @returns true se encontrou e marcou uma despesa, false caso contrário
 */
export async function marcarDespesaPorServico(
  servicoNome: string | null | undefined,
  empresa: string | null | undefined
): Promise<boolean> {
  try {
    if (!servicoNome || !servicoNome.trim()) {
      logger.log('⚠️ Nome do serviço não fornecido, não será possível marcar despesa');
      return false;
    }

    logger.log(`🔍 Buscando despesa correspondente ao serviço: "${servicoNome}" (empresa: ${empresa || 'N/A'})`);

    // Buscar todas as despesas recorrentes
    const { data: despesas, error } = await supabase
      .from('despesas_ti')
      .select('*')
      .eq('tipo_despesa', 'Recorrente');

    if (error) {
      logger.error('❌ Erro ao buscar despesas:', error);
      return false;
    }

    if (!despesas || despesas.length === 0) {
      logger.log('⚠️ Nenhuma despesa recorrente encontrada');
      return false;
    }

    // Procurar despesa correspondente
    // Prioridade 1: Match exato de fornecedor e empresa
    // Prioridade 2: Match parcial de fornecedor e empresa
    // Prioridade 3: Match parcial de fornecedor apenas
    let despesaEncontrada: DespesaTI | null = null;

    // Tentar match exato primeiro
    for (const despesa of despesas) {
      const fornecedorMatch = stringsSimilares(servicoNome, despesa.fornecedor);
      const empresaMatch = !empresa || !despesa.empresa || stringsSimilares(empresa, despesa.empresa);
      
      if (fornecedorMatch && empresaMatch) {
        // Verificar também se a descrição do serviço corresponde
        const descMatch = !despesa.desc_servico || stringsSimilares(servicoNome, despesa.desc_servico);
        if (descMatch || !despesa.desc_servico) {
          despesaEncontrada = despesa as DespesaTI;
          logger.log(`✅ Despesa encontrada (match exato): ${despesa.fornecedor} - ${despesa.empresa || 'N/A'}`);
          break;
        }
      }
    }

    // Se não encontrou match exato, tentar match parcial apenas por fornecedor
    if (!despesaEncontrada) {
      for (const despesa of despesas) {
        if (stringsSimilares(servicoNome, despesa.fornecedor)) {
          despesaEncontrada = despesa as DespesaTI;
          logger.log(`✅ Despesa encontrada (match parcial): ${despesa.fornecedor}`);
          break;
        }
      }
    }

    if (!despesaEncontrada) {
      logger.log(`⚠️ Nenhuma despesa correspondente encontrada para o serviço: "${servicoNome}"`);
      return false;
    }

    // Verificar se já está marcada
    const mesAtual = getMesAtual();
    const jaMarcada = isDespesaMarcada(despesaEncontrada);
    
    if (jaMarcada) {
      logger.log(`ℹ️ Despesa ${despesaEncontrada.fornecedor} já está marcada no mês ${mesAtual}`);
      return true;
    }

    // Marcar a despesa
    logger.log(`📝 Marcando despesa ${despesaEncontrada.fornecedor} automaticamente...`);
    await toggleDespesaCheck(despesaEncontrada.id, true);
    logger.log(`✅ Despesa marcada automaticamente: ${despesaEncontrada.fornecedor} (empresa: ${despesaEncontrada.empresa || 'N/A'})`);
    
    return true;
  } catch (error) {
    logger.error('❌ Erro ao marcar despesa por serviço:', error);
    return false;
  }
}

