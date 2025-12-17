/**
 * =====================================================
 * DESPESAS SERVICE - Gerenciamento de Despesas T.I.
 * =====================================================
 * * Serviço para buscar e gerenciar despesas recorrentes
 * e esporádicas da tabela despesas_ti
 */

import { supabase } from './supabaseClient';
import { logger } from './logger';

// =====================================================
// INTERFACES
// =====================================================

export interface DespesaTI {
  id: string;
  servico: string;      // Antigo: fornecedor
  descricao: string;    // Antigo: desc_servico
  tipo_despesa: 'Recorrente' | 'Esporadico';
  valor_medio: number;
  marina?: string | null;
  // Alias para compatibilidade com o código que usa 'empresa'
  empresa?: string | null;
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
  // Campos legados para compatibilidade temporária
  fornecedor?: string;
  desc_servico?: string;
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
    const { data: allData } = await supabase
      .from('despesas_ti')
      .select('*')
      .eq('tipo_despesa', 'Recorrente')
      .limit(1);
    
    if (allData && allData.length > 0) {
      logger.log('📋 Estrutura da primeira despesa (todas as colunas):', Object.keys(allData[0]));
    }
    
    // Agora busca com select específico (Atualizado para servico e descricao)
    // Inclui alias para compatibilidade com código antigo que usa fornecedor/desc_servico
    const { data, error } = await supabase
      .from('despesas_ti')
      .select('id, servico, descricao, tipo_despesa, valor_medio, marina, jan, fev, mar, abr, mai, jun, jul, ago, set, out_, nov, dez, created_at')
      .eq('tipo_despesa', 'Recorrente')
      .order('servico', { ascending: true }); // Ordenar pelo novo nome

    if (error) {
      logger.error('❌ Erro na query:', error);
      // Se der erro com select específico, tenta com *
      logger.log('🔄 Tentando buscar com select *...');
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('despesas_ti')
        .select('*')
        .eq('tipo_despesa', 'Recorrente')
        .order('servico', { ascending: true });
      
      if (fallbackError) {
        handleSupabaseError(fallbackError, 'buscar despesas recorrentes');
      }
      
      return mapDespesasCompatibilidade(fallbackData || []);
    }

    logger.log(`✅ ${data?.length || 0} despesas recorrentes encontradas`);
    return mapDespesasCompatibilidade(data || []);
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
    
    // Atualizado para servico e descricao
    const { data, error } = await supabase
      .from('despesas_ti')
      .select('id, servico, descricao, tipo_despesa, valor_medio, marina, jan, fev, mar, abr, mai, jun, jul, ago, set, out_, nov, dez, created_at')
      .eq('tipo_despesa', 'Esporadico')
      .order('servico', { ascending: true });

    if (error) {
      logger.error('❌ Erro na query:', error);
      // Se der erro com select específico, tenta com *
      logger.log('🔄 Tentando buscar com select *...');
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('despesas_ti')
        .select('*')
        .eq('tipo_despesa', 'Esporadico')
        .order('servico', { ascending: true });
      
      if (fallbackError) {
        handleSupabaseError(fallbackError, 'buscar despesas esporádicas');
      }
      
      return mapDespesasCompatibilidade(fallbackData || []);
    }

    logger.log(`✅ ${data?.length || 0} despesas esporádicas encontradas`);
    return mapDespesasCompatibilidade(data || []);
  } catch (error) {
    logger.error('❌ Erro ao buscar despesas esporádicas:', error);
    return [];
  }
}

/**
 * Mapeia os dados para garantir compatibilidade com código que usa fornecedor/desc_servico
 */
function mapDespesasCompatibilidade(data: any[]): DespesaTI[] {
  return data.map(item => ({
    ...item,
    // Garante que servico e descricao existam
    servico: item.servico || item.fornecedor || '',
    descricao: item.descricao || item.desc_servico || '',
    // Mantém compatibilidade reversa
    fornecedor: item.servico || item.fornecedor || '',
    desc_servico: item.descricao || item.desc_servico || '',
  }));
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
      .eq('tipo_despesa', 'Recorrente');

    if (error) {
      logger.error(`❌ Erro ao atualizar coluna ${nomeColuna}:`, error);
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
        // Hack de segurança: O Supabase exige um 'where' para updates.
        // Usamos "ID diferente de zero" para pegar TODAS as linhas da tabela
        // e garantir que nada fique marcado indevidamente.
        .gt('id', 0);

    if (error) {
      logger.error(`❌ Erro ao resetar coluna ${nomeColuna}:`, error);
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

    // Atualizado para servico e descricao
    const { data, error } = await supabase
      .from('despesas_ti')
      .select('id, servico, descricao, tipo_despesa, valor_medio, marina, jan, fev, mar, abr, mai, jun, jul, ago, set, out_, nov, dez, created_at')
      .eq('tipo_despesa', 'Recorrente')
      .or(`${mesAtual}.is.null,${mesAtual}.eq.0`)
      .order('servico', { ascending: true }); // Ordenar pelo novo nome

    if (error) {
      logger.error('❌ Erro ao buscar despesas pendentes:', error);
      // Fallback: buscar todas e filtrar
      const { data: todasDespesas, error: errorTodas } = await supabase
        .from('despesas_ti')
        .select('*')
        .eq('tipo_despesa', 'Recorrente')
        .order('servico', { ascending: true });

      if (errorTodas) {
        handleSupabaseError(errorTodas, 'buscar despesas pendentes');
      }

      // Filtrar manualmente e mapear
      const todasMapeadas = mapDespesasCompatibilidade(todasDespesas || []);
      const pendentes = todasMapeadas.filter((d: any) => {
        const valor = d[mesAtual];
        return valor === null || valor === undefined || valor === 0;
      });

      logger.log(`✅ ${pendentes.length} despesas pendentes encontradas (fallback)`);
      return pendentes;
    }

    logger.log(`✅ ${data?.length || 0} despesas pendentes encontradas`);
    return mapDespesasCompatibilidade(data || []);
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
 */
export async function marcarDespesaPorServico(
  servicoNome: string | null | undefined,
  servicoDescricao: string | null | undefined,
  empresa: string | null | undefined
): Promise<boolean> {
  try {
    if (!servicoNome || !servicoNome.trim()) {
      return false;
    }

    logger.log(`🔍 Tentando marcar despesa para: ${servicoNome} (Empresa: ${empresa || 'N/A'})`);

    // 1. Buscar todas as despesas recorrentes
    const { data: despesasRaw, error } = await supabase
      .from('despesas_ti')
      .select('*')
      .eq('tipo_despesa', 'Recorrente');

    if (error) {
      logger.error('❌ Erro ao buscar despesas para match:', error);
      return false;
    }
    
    if (!despesasRaw || despesasRaw.length === 0) return false;

    // 2. Mapear para garantir campos servico/descricao (compatibilidade)
    const despesas = mapDespesasCompatibilidade(despesasRaw);
    let despesaEncontrada: DespesaTI | null = null;

    // Funções auxiliares locais para limpeza
    const clean = (str: string | null | undefined) => (str || '').toLowerCase().trim();
    
    const inputServico = clean(servicoNome);
    const inputDesc = clean(servicoDescricao);
    const inputEmpresa = clean(empresa);

    // 3. Iterar para encontrar match
    // ORDENAÇÃO IMPORTANTE:
    // Itens com MARINA definida devem vir PRIMEIRO para terem prioridade no match.
    // Itens sem marina (genéricos) ficam por último como fallback.
    despesas.sort((a, b) => {
      const temMarinaA = !!a.marina;
      const temMarinaB = !!b.marina;
      if (temMarinaA && !temMarinaB) return -1; // a vem antes
      if (!temMarinaA && temMarinaB) return 1;  // b vem antes
      return 0;
    });

    for (const despesa of despesas) {
      // Dados do banco
      const dbServico = clean(despesa.servico);
      const dbDescricao = clean(despesa.descricao);
      const dbMarina = clean(despesa.marina);

      // Lógica de Match de Serviço (Nome ou Descrição)
      // Verifica se o nome do serviço bate com o serviço ou descrição do banco
      // E vice-versa, incluindo verificação de "contém"
      const servicoMatch = 
        inputServico === dbServico || 
        inputDesc === dbServico ||
        dbDescricao === inputServico ||
        dbServico.includes(inputServico) ||
        inputServico.includes(dbServico) ||
        (dbDescricao && dbDescricao.includes(inputServico));
      
      // Lógica de Match de Empresa (Marina)
      let marinaMatch = false;

      if (dbMarina) {
        // Se a despesa tem marina definida (específica),
        // EXIGE que a empresa recebida seja compatível.
        marinaMatch = (inputEmpresa === dbMarina);
      } else {
        // Se a despesa NÃO tem marina (genérica/fallback),
        // aceita o match apenas pelo nome do serviço.
        marinaMatch = true;
      }

      if (servicoMatch && marinaMatch) {
        despesaEncontrada = despesa as DespesaTI;
        // Assim que encontrar o primeiro match (que será o mais específico devido à ordenação),
        // encerra a busca.
        break; 
      }
    }

    if (!despesaEncontrada) {
      logger.log('⚠️ Nenhuma despesa correspondente encontrada');
      return false;
    }

    // 4. Verificar se já está marcada
    const jaMarcada = isDespesaMarcada(despesaEncontrada);
    
    if (jaMarcada) {
      logger.log(`ℹ️ Despesa "${despesaEncontrada.servico}" encontrada, mas já estava marcada.`);
      return true;
    }

    // 5. Marcar a despesa no banco
    await toggleDespesaCheck(despesaEncontrada.id, true);
    logger.log(`✅ Despesa "${despesaEncontrada.servico}" marcada automaticamente com sucesso!`);
    return true;

  } catch (error) {
    logger.error('❌ Erro ao marcar despesa por serviço:', error);
    return false;
  }
}

/**
 * Busca despesas correspondentes a um serviço sem marcar automaticamente
 */
export async function buscarDespesasCorrespondentes(
  servicoNome: string | null | undefined,
  empresa: string | null | undefined
): Promise<DespesaTI[]> {
  try {
    if (!servicoNome || !servicoNome.trim()) {
      return [];
    }

    const { data: despesasRaw, error } = await supabase
      .from('despesas_ti')
      .select('*')
      .eq('tipo_despesa', 'Recorrente');

    if (error || !despesasRaw) return [];

    const despesas = mapDespesasCompatibilidade(despesasRaw);
    const despesasEncontradas: DespesaTI[] = [];

    // Buscar todas as despesas que correspondem (exato ou parcial)
    for (const despesa of despesas) {
      // === AQUI MUDOU: Usa 'servico' e 'descricao' ===
      const dbServico = despesa.servico;
      const dbDescricao = despesa.descricao;

      const servicoMatch = stringsSimilares(servicoNome, dbServico);
      const marinaMatch = !empresa || !despesa.marina || stringsSimilares(empresa, despesa.marina);
      
      if (servicoMatch && marinaMatch) {
        const descMatch = !dbDescricao || stringsSimilares(servicoNome, dbDescricao);
        if (descMatch || !dbDescricao) {
          despesasEncontradas.push(despesa as DespesaTI);
        }
      }
    }

    return despesasEncontradas;
  } catch (error) {
    logger.error('❌ Erro ao buscar despesas correspondentes:', error);
    return [];
  }
}