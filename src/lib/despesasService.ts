/**
 * =====================================================
 * DESPESAS SERVICE - Gerenciamento de Despesas T.I.
 * =====================================================
 * Serviço para buscar e gerenciar despesas recorrentes
 * e esporádicas da tabela despesas_ti
 */




import { supabase } from './supabaseClient';
import { logger } from './logger';

// =====================================================
// INTERFACES
// =====================================================

export interface DespesaRecorrente {
  id: number;
  apelido: string;
  match_texto: string;
  match_empresa: string;
  match_fornecedor?: string;
  dia_vencimento: number;
  ativo: boolean;
  descricao_padrao?: string;
  valor_estimado?: number | string | null;
  recorrencia?: string; // ✅ Novo campo para recorrência (Mensal, Anual, Trimestral, ou personalizado)
  created_at: string;
  updated_at: string;
  status_mes_atual?: string; // ✅ Novo campo para status mensal
}

export interface DespesaTI {
  id: string;
  servico: string;
  descricao: string;
  tipo_despesa: 'Recorrente' | 'Esporadico';
  valor_medio: number;
  empresa?: string | null; // ✅ Mudou de 'marina' para 'empresa'
  jan?: number;
  fev?: number;
  mar?: number;
  abr?: number;
  mai?: number;
  jun?: number;
  jul?: number;
  ago?: number;
  set_?: number; // ✅ Com underscore
  out_?: number; // ✅ Com underscore
  nov?: number;
  dez?: number;
  created_at?: string;
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
    
    const { data: allData } = await supabase
      .from('despesas_ti')
      .select('*')
      .eq('tipo_despesa', 'Recorrente')
      .limit(1);

    if (allData && allData.length > 0) {
      logger.log('📋 Estrutura da primeira despesa (todas as colunas):', Object.keys(allData[0]));
    }

    const { data, error } = await supabase
      .from('despesas_ti')
      .select('id, servico, descricao, tipo_despesa, valor_medio, marina, jan, fev, mar, abr, mai, jun, jul, ago, set_, out_, nov, dez, created_at')
      .eq('tipo_despesa', 'Recorrente')
      .order('servico', { ascending: true });

    if (error) {
      logger.error('❌ Erro na query:', error);
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
    
    const { data, error } = await supabase
      .from('despesas_ti')
      .select('id, servico, descricao, tipo_despesa, valor_medio, marina, jan, fev, mar, abr, mai, jun, jul, ago, set_, out_, nov, dez, created_at')
      .eq('tipo_despesa', 'Esporadico')
      .order('servico', { ascending: true });

    if (error) {
      logger.error('❌ Erro na query:', error);
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
 * Mapeia os dados para garantir compatibilidade
 */
function mapDespesasCompatibilidade(data: any[]): DespesaTI[] {
  return data.map(item => ({
    ...item,
    servico: item.servico || item.fornecedor || '',
    descricao: item.descricao || item.desc_servico || '',
    fornecedor: item.servico || item.fornecedor || '',
    desc_servico: item.descricao || item.desc_servico || '',
  }));
}

/**
 * Busca todas as despesas
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
    return { recorrentes, esporadicas };
  } catch (error) {
    logger.error('❌ Erro ao buscar todas as despesas:', error);
    return { recorrentes: [], esporadicas: [] };
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
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set_', 'out_', 'nov', 'dez'];
  const dataHoje = new Date();
  const mesAtual = meses[dataHoje.getMonth()];
  const valorMes = (despesa as any)[mesAtual];
  return valorMes || despesa.valor_medio || 0;
}

/**
 * Obtém o nome da coluna do mês atual
 */
export function getMesAtual(): string {
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set_', 'out_', 'nov', 'dez'];
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
 * 🔧 FUNÇÃO CORRIGIDA - Atualiza o check de uma despesa
 */
export async function toggleDespesaCheck(despesaId: string, marcado: boolean): Promise<void> {
  try {
    const mesAtual = getMesAtual();
    const updateData: any = {};
    const nomeColuna = mesAtual;
    
    // 🟢 CORREÇÃO: Agora usa o parâmetro 'marcado' corretamente
    updateData[nomeColuna] = marcado ? 1 : 0;

    logger.log(`🔄 Atualizando check da despesa ${despesaId} no mês ${nomeColuna} para ${marcado ? 'marcado' : 'desmarcado'}`);

    const { error } = await supabase
      .from('despesas_ti')
      .update(updateData)
      .eq('id', despesaId); // 🟢 CORREÇÃO: Filtra pelo ID específico

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
export const resetarChecksMesAtual = async () => {
  const mesAtual = getMesAtual();
  const updateData = { [mesAtual]: 0 };
  
  const { error } = await supabase
    .from('despesas_ti')
    .update(updateData)
    .eq('tipo_despesa', 'Recorrente');

  if (error) {
    console.error('Erro ao resetar checks:', error);
    throw error;
  }
};

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
      .select('id, servico, descricao, tipo_despesa, valor_medio, marina, jan, fev, mar, abr, mai, jun, jul, ago, set_, out_, nov, dez, created_at')
      .eq('tipo_despesa', 'Recorrente')
      .or(`${mesAtual}.is.null,${mesAtual}.eq.0`)
      .order('servico', { ascending: true });

    if (error) {
      logger.error('❌ Erro ao buscar despesas pendentes:', error);
      const { data: todasDespesas, error: errorTodas } = await supabase
        .from('despesas_ti')
        .select('*')
        .eq('tipo_despesa', 'Recorrente')
        .order('servico', { ascending: true });

      if (errorTodas) {
        handleSupabaseError(errorTodas, 'buscar despesas pendentes');
      }

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
 * Normaliza string para comparação
 */
function normalizarString(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Verifica se duas strings são similares
 */
function stringsSimilares(str1: string, str2: string): boolean {
  const norm1 = normalizarString(str1);
  const norm2 = normalizarString(str2);
  
  if (norm1 === norm2) return true;
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
  const palavras1 = norm1.split(/\s+/).filter(p => p.length > 2);
  const palavras2 = norm2.split(/\s+/).filter(p => p.length > 2);
  return palavras1.some(p => palavras2.includes(p));
}

/**
 * Busca e marca automaticamente a despesa correspondente
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

    const { data: despesasRaw, error } = await supabase
      .from('despesas_ti')
      .select('*')
      .eq('tipo_despesa', 'Recorrente');

    if (error) {
      logger.error('❌ Erro ao buscar despesas para match:', error);
      return false;
    }

    if (!despesasRaw || despesasRaw.length === 0) return false;

    const despesas = mapDespesasCompatibilidade(despesasRaw);
    let despesaEncontrada: DespesaTI | null = null;

    const clean = (str: string | null | undefined) => (str || '').toLowerCase().trim();
    const inputServico = clean(servicoNome);
    const inputDesc = clean(servicoDescricao);
    const inputEmpresa = clean(empresa);

    despesas.sort((a, b) => {
      const temEmpresaA = !!a.empresa;
      const temEmpresaB = !!b.empresa;
      if (temEmpresaA && !temEmpresaB) return -1;
      if (!temEmpresaA && temEmpresaB) return 1;
      return 0;
    });

    for (const despesa of despesas) {
      const dbServico = clean(despesa.servico);
      const dbDescricao = clean(despesa.descricao);
      const dbEmpresa = clean(despesa.empresa);

      const servicoMatch =
        inputServico === dbServico ||
        inputDesc === dbServico ||
        dbDescricao === inputServico ||
        dbServico.includes(inputServico) ||
        inputServico.includes(dbServico) ||
        (dbDescricao && dbDescricao.includes(inputServico));

      let empresaMatch = false;
      if (dbEmpresa) {  
        empresaMatch = (inputEmpresa === dbEmpresa);
      } else {
        empresaMatch = true;
      }

      if (servicoMatch && empresaMatch) { // ✅ Match encontrado
        despesaEncontrada = despesa as DespesaTI;
        break;
      }
    }

    if (!despesaEncontrada) {
      logger.log('⚠️ Nenhuma despesa correspondente encontrada');
      return false;
    }

    const jaMarcada = isDespesaMarcada(despesaEncontrada);
    if (jaMarcada) {
      logger.log(`ℹ️ Despesa "${despesaEncontrada.servico}" encontrada, mas já estava marcada.`);
      return true;
    }

    await toggleDespesaCheck(despesaEncontrada.id, true);
    logger.log(`✅ Despesa "${despesaEncontrada.servico}" marcada automaticamente com sucesso!`);
    return true;
  } catch (error) {
    logger.error('❌ Erro ao marcar despesa por serviço:', error);
    return false;
  }
}

/**
 * Busca despesas correspondentes sem marcar
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

    for (const despesa of despesas) {
      const dbServico = despesa.servico;
      const dbDescricao = despesa.descricao;

      const servicoMatch = stringsSimilares(servicoNome, dbServico);
      const empresaMatch = !empresa || !despesa.empresa || stringsSimilares(empresa, despesa.empresa);

      if (servicoMatch && empresaMatch) {
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

// =====================================================
// DESPESAS RECORRENTES - NOVO SISTEMA SIMPLIFICADO
// =====================================================

/**
 * Busca todas as despesas recorrentes com status mensal
 */
export async function fetchDespesasRecorrentesSimplificado(): Promise<DespesaRecorrente[]> {
  try {
    logger.log('🔍 Buscando despesas recorrentes simplificado...');

    const { data, error } = await supabase
      .from('despesas_recorrentes')
      .select('*')
      .eq('ativo', true)
      .order('apelido', { ascending: true });

    if (error) {
      logger.error('❌ Erro ao buscar despesas recorrentes simplificado:', error);
      return [];
    }

    logger.log(`✅ ${data?.length || 0} despesas recorrentes encontradas`);
    return data || [];
  } catch (error) {
    logger.error('❌ Erro ao buscar despesas recorrentes simplificado:', error);
    return [];
  }
}

/**
 * Atualiza o status mensal de uma despesa recorrente
 */
export async function atualizarStatusDespesaRecorrente(
  despesaId: number,
  status: 'LANCADO' | 'PENDENTE'
): Promise<void> {
  try {
    logger.log(`🔄 Atualizando status da despesa ${despesaId} para ${status}`);

    const { error } = await supabase
      .from('despesas_recorrentes')
      .update({
        status_mes_atual: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', despesaId);

    if (error) {
      logger.error('❌ Erro ao atualizar status da despesa recorrente:', error);
      throw error;
    }

    logger.log(`✅ Status da despesa ${despesaId} atualizado para ${status}`);
  } catch (error) {
    logger.error('❌ Erro ao atualizar status da despesa recorrente:', error);
    throw error;
  }
}

/**
 * Reseta todas as despesas recorrentes para PENDENTE (dia 1 do mês)
 */
export async function resetarStatusMensalDespesasRecorrentes(): Promise<void> {
  try {
    logger.log('🔄 Resetando status mensal de todas as despesas recorrentes...');

    const { error } = await supabase
      .from('despesas_recorrentes')
      .update({
        status_mes_atual: 'PENDENTE',
        updated_at: new Date().toISOString()
      })
      .eq('ativo', true);

    if (error) {
      logger.error('❌ Erro ao resetar status mensal:', error);
      throw error;
    }

    logger.log('✅ Status mensal resetado para todas as despesas recorrentes');
  } catch (error) {
    logger.error('❌ Erro ao resetar status mensal:', error);
    throw error;
  }
}

/**
 * Verifica se deve mostrar aviso de reset (7 dias antes do dia 1)
 */
export function deveMostrarAvisoReset(): boolean {
  const hoje = new Date();
  const dia = hoje.getDate();

  // Mostra aviso quando faltar 7 dias para o dia 1
  // Se hoje é dia 25, por exemplo, faltam 6 dias para o próximo dia 1
  const diasParaProximoDia1 = 31 - dia + 1; // Próximo dia 1
  return diasParaProximoDia1 <= 7 && diasParaProximoDia1 > 0;
}

/**
 * Obtém mensagem de aviso de reset
 */
export function getMensagemAvisoReset(): string {
  const hoje = new Date();
  const dia = hoje.getDate();
  const diasRestantes = 31 - dia + 1;

  if (diasRestantes === 1) {
    return "⚠️ Aviso: Amanhã (dia 1) todas as despesas recorrentes serão resetadas para 'Pendente'.";
  } else {
    return `⚠️ Aviso: Faltam ${diasRestantes} dias para o reset mensal (dia 1). Todas as despesas serão marcadas como 'Pendente'.`;
  }
}

/**
 * Atualiza uma despesa recorrente específica (edição)
 */
export async function atualizarDespesaRecorrente(
  despesaData: {
    id: number;
    apelido: string;
    match_empresa: string;
    match_texto: string;
    valor_estimado?: number | null;
  }
): Promise<void> {
  try {
    logger.log(`🔄 Atualizando despesa recorrente ${despesaData.id}...`, despesaData);

    const updateData = {
      apelido: despesaData.apelido.trim(),
      match_empresa: despesaData.match_empresa.trim(),
      match_texto: despesaData.match_texto.trim(),
      valor_estimado: despesaData.valor_estimado,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('despesas_recorrentes')
      .update(updateData)
      .eq('id', despesaData.id);

    if (error) {
      logger.error('❌ Erro ao atualizar despesa recorrente:', error);
      throw error;
    }

    logger.log(`✅ Despesa recorrente ${despesaData.id} atualizada com sucesso`);
  } catch (error) {
    logger.error('❌ Erro ao atualizar despesa recorrente:', error);
    throw error;
  }
}

/**
 * Cria uma nova despesa recorrente
 */
export async function createDespesaRecorrente(
  despesaData: {
    apelido: string;
    tipo: 'servico' | 'produto';
    match_empresa: string;
    match_texto: string;
    match_fornecedor?: string;
    dia_vencimento: number;
    descricao_padrao?: string;
    valor_estimado?: number;
    recorrencia?: string; // ✅ Novo campo para recorrência
  }
): Promise<DespesaRecorrente> {
  try {
    logger.log('➕ Criando nova despesa recorrente...', despesaData);

    // Validar campos obrigatórios
    if (!despesaData.apelido?.trim()) {
      throw new Error('Apelido é obrigatório');
    }
    if (!despesaData.match_empresa?.trim()) {
      throw new Error('Empresa é obrigatória');
    }
    if (!despesaData.match_texto?.trim()) {
      throw new Error('Texto de correspondência é obrigatório');
    }
    if (!despesaData.dia_vencimento || despesaData.dia_vencimento < 1 || despesaData.dia_vencimento > 31) {
      throw new Error('Dia de vencimento deve ser entre 1 e 31');
    }

    const insertData = {
      apelido: despesaData.apelido.trim(),
      match_empresa: despesaData.match_empresa.trim(),
      match_texto: despesaData.match_texto.trim(),
      dia_vencimento: despesaData.dia_vencimento,
      ativo: true,
      descricao_padrao: despesaData.descricao_padrao?.trim() || null,
      valor_estimado: despesaData.valor_estimado || null,
      recorrencia: despesaData.recorrencia || 'Mensal', // ✅ Novo campo com valor padrão
      status_mes_atual: 'PENDENTE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('despesas_recorrentes')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      logger.error('❌ Erro ao criar despesa recorrente:', error);
      throw error;
    }

    logger.log('✅ Despesa recorrente criada com sucesso:', data);
    return data;
  } catch (error) {
    logger.error('❌ Erro ao criar despesa recorrente:', error);
    throw error;
  }
}
