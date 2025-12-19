import { supabase } from './supabaseClient';
import { logger } from "@/lib/logger";

// Interface para configuração de despesa recorrente
export interface DespesaRecorrente {
  id: number;
  apelido: string;
  tipo: 'servico' | 'produto';
  match_empresa: string;
  match_texto: string;
  match_fornecedor?: string;
  dia_vencimento: number;
  ativo: boolean;
  descricao_padrao?: string;
  valor_estimado?: number | string | null;
  created_at: string;
  updated_at: string;
}

// Interface para resultado do checklist
export interface ChecklistItem {
  id: string; // ID único composto
  regra: DespesaRecorrente;
  status: 'LANCADO' | 'PENDENTE';
  lancamento_id?: string; // ID do lançamento encontrado
  lancamento_detalhes?: any; // Detalhes do lançamento encontrado
}

/**
 * Busca todas as configurações de despesas recorrentes ativas
 */
export async function fetchDespesasRecorrentes(): Promise<DespesaRecorrente[]> {
  try {
    logger.log('🔍 Buscando configurações de despesas recorrentes...');

    const { data, error } = await supabase
      .from('despesas_recorrentes')
      .select('*')
      .eq('ativo', true)
      .order('apelido', { ascending: true });

    if (error) {
      logger.error('❌ Erro ao buscar despesas recorrentes:', error);
      throw error;
    }

    logger.log(`✅ ${data?.length || 0} configurações encontradas`);
    return data || [];
  } catch (error) {
    logger.error('❌ Erro ao buscar despesas recorrentes:', error);
    return [];
  }
}

/**
 * Busca lançamentos (servicos e produtos) para um ano específico
 */
export async function fetchLancamentosAno(ano: number): Promise<any[]> {
  try {
    logger.log(`🔍 Buscando lançamentos do ano ${ano}...`);

    const [servicos, produtos] = await Promise.all([
      supabase
        .from('servicos')
        .select('*')
        .eq('ano', ano),
      supabase
        .from('produtos')
        .select('*')
        .eq('ano', ano)
    ]);

    if (servicos.error) {
      logger.error('❌ Erro ao buscar serviços:', servicos.error);
      throw servicos.error;
    }

    if (produtos.error) {
      logger.error('❌ Erro ao buscar produtos:', produtos.error);
      throw produtos.error;
    }

    const lancamentos = [
      ...(servicos.data || []).map(s => ({ ...s, tipo: 'servico' })),
      ...(produtos.data || []).map(p => ({ ...p, tipo: 'produto' }))
    ];

    logger.log(`✅ ${lancamentos.length} lançamentos encontrados (${servicos.data?.length || 0} serviços + ${produtos.data?.length || 0} produtos)`);
    return lancamentos;
  } catch (error) {
    logger.error('❌ Erro ao buscar lançamentos:', error);
    return [];
  }
}

/**
 * Normaliza string para comparação (remove espaços e converte para minúsculas)
 */
function normalizarString(str: string | null | undefined): string {
  if (!str) return '';
  return str.trim().toLowerCase();
}

/**
 * Extrai o mês de uma string de data (DD/MM/YYYY ou YYYY-MM-DD)
 */
function extrairMes(dataStr: string | null | undefined): number | null {
  if (!dataStr) return null;

  try {
    let date: Date | null = null;

    // Tentar formato DD/MM/YYYY
    if (dataStr.includes('/')) {
      const [dia, mes, ano] = dataStr.split('/').map(Number);
      if (dia && mes && ano) {
        date = new Date(ano, mes - 1, dia);
      }
    }
    // Tentar formato YYYY-MM-DD
    else if (dataStr.includes('-')) {
      date = new Date(dataStr);
    }

    return date && !isNaN(date.getTime()) ? date.getMonth() + 1 : null;
  } catch (error) {
    logger.warn(`Erro ao parsear data: ${dataStr}`, error);
    return null;
  }
}

/**
 * Verifica se um lançamento corresponde a uma regra para um mês específico
 */
function lancamentoCorresponde(
  lancamento: any,
  regra: DespesaRecorrente,
  mes: number
): boolean {
  // Validação de Contexto (Empresa) - CASE SENSITIVE conforme spec
  const empresaLancamento = normalizarString(lancamento.empresa);
  const empresaRegra = normalizarString(regra.match_empresa);

  if (empresaLancamento !== empresaRegra) {
    return false;
  }

  // Validação de Conteúdo (O Que) - FLEXÍVEL conforme spec
  const textoLancamento = regra.tipo === 'servico'
    ? normalizarString(lancamento.servico)
    : normalizarString(lancamento.produto);
  const textoRegra = normalizarString(regra.match_texto);

  if (!textoLancamento.includes(textoRegra)) {
    return false;
  }

  // Validação ADICIONAL: Verificar descrição para evitar matches duplicados
  // Quando há regras com match_texto similar (ex: "CLARO" para múltiplos serviços),
  // usamos a descrição ou descricao_padrao para garantir match único
  if (regra.descricao_padrao) {
    const descricaoLancamento = regra.tipo === 'servico'
      ? normalizarString(lancamento.descricao)
      : normalizarString(lancamento.informacoes);
    const descricaoPadrao = normalizarString(regra.descricao_padrao);

    // Se a regra tem descricao_padrao, a descrição do lançamento DEVE conter ela
    // Se não tiver descrição no lançamento mas a regra exige, não é match
    if (!descricaoLancamento || !descricaoLancamento.includes(descricaoPadrao)) {
      return false;
    }
  }

  // Validação de Fornecedor (opcional para produtos)
  if (regra.match_fornecedor && regra.tipo === 'produto') {
    const fornecedorLancamento = normalizarString(lancamento.fornecedor);
    const fornecedorRegra = normalizarString(regra.match_fornecedor);
    if (!fornecedorLancamento.includes(fornecedorRegra)) {
      return false;
    }
  }

  // Validação Temporal (Quando)
  let dataLancamento: string | null = null;

  if (regra.tipo === 'servico') {
    dataLancamento = lancamento.vencimento || lancamento.data_solicitacao;
  } else {
    dataLancamento = lancamento.vencimento || lancamento.data_sc;
  }

  const mesLancamento = extrairMes(dataLancamento);
  if (mesLancamento === null || mesLancamento !== mes) {
    return false;
  }

  return true;
}

/**
 * Executa o checklist de despesas recorrentes para um mês/ano específico
 */
export async function executarChecklist(mes: number, ano: number): Promise<ChecklistItem[]> {
  try {
    logger.log(`🔍 Executando checklist para ${mes}/${ano}...`);

    // Fase 1: Aquisição de Dados
    const [regras, lancamentos] = await Promise.all([
      fetchDespesasRecorrentes(),
      fetchLancamentosAno(ano)
    ]);

    logger.log(`📊 ${regras.length} regras ativas, ${lancamentos.length} lançamentos encontrados`);

    // Fase 2: Preparação - Ordenar regras por especificidade
    // Primeiro: regras com descricao_padrao (mais específicas)
    // Segundo: maior match_texto (mais específico)
    // Terceiro: alfabética
    const regrasOrdenadas = [...regras].sort((a, b) => {
      // Primeiro critério: regras com descricao_padrao são mais específicas
      const aTemDescricao = !!a.descricao_padrao;
      const bTemDescricao = !!b.descricao_padrao;
      if (aTemDescricao && !bTemDescricao) return -1;
      if (!aTemDescricao && bTemDescricao) return 1;

      // Segundo critério: maior match_texto (mais específico)
      const lenA = normalizarString(a.match_texto).length;
      const lenB = normalizarString(b.match_texto).length;
      if (lenA !== lenB) return lenB - lenA;

      // Terceiro critério: alfabético
      return a.apelido.localeCompare(b.apelido);
    });

    // Fase 3: O Loop de Reconciliação
    const resultados: ChecklistItem[] = [];
    const lancamentosUtilizados = new Set<string>(); // Para evitar reuso de lançamentos

    for (const regra of regrasOrdenadas) {
      let status: 'LANCADO' | 'PENDENTE' = 'PENDENTE';
      let lancamentoEncontrado: any = null;

      // Procurar correspondência nos lançamentos não utilizados
      for (const lancamento of lancamentos) {
        if (lancamentosUtilizados.has(lancamento.id)) {
          continue; // Pular lançamentos já utilizados
        }

        if (lancamentoCorresponde(lancamento, regra, mes)) {
          status = 'LANCADO';
          lancamentoEncontrado = lancamento;
          lancamentosUtilizados.add(lancamento.id); // Marcar como utilizado

          // Log específico para regras CLARO (para debug)
          if (normalizarString(regra.match_texto).includes('claro')) {
            logger.log(`✅ Regra CLARO "${regra.apelido}" encontrou correspondência com lançamento ID ${lancamento.id}`);
          }

          break; // Considera apenas o primeiro encontrado
        }
      }

      const item: ChecklistItem = {
        id: `checklist_${regra.id}_${mes}_${ano}`,
        regra,
        status,
        lancamento_id: lancamentoEncontrado?.id,
        lancamento_detalhes: lancamentoEncontrado
      };

      resultados.push(item);
    }

    // Fase 3: Ordenação (PENDENTE primeiro)
    resultados.sort((a, b) => {
      if (a.status === 'PENDENTE' && b.status === 'LANCADO') return -1;
      if (a.status === 'LANCADO' && b.status === 'PENDENTE') return 1;
      return a.regra.apelido.localeCompare(b.regra.apelido);
    });

    logger.log(`✅ Checklist executado: ${resultados.filter(r => r.status === 'LANCADO').length} lançados, ${resultados.filter(r => r.status === 'PENDENTE').length} pendentes`);
    return resultados;
  } catch (error) {
    logger.error('❌ Erro ao executar checklist:', error);
    throw error;
  }
}

/**
 * Cria objeto pré-populado para lançamento baseado na regra
 */
export function criarLancamentoPrePopulado(regra: DespesaRecorrente, mes: number, ano: number): any {
  // Calcular data de vencimento
  const vencimento = new Date(ano, mes - 1, regra.dia_vencimento);
  const vencimentoStr = vencimento.toLocaleDateString('pt-BR');

  // Descrição com sufixo dinâmico
  const descricao = regra.descricao_padrao
    ? `${regra.descricao_padrao} - Ref: ${mes.toString().padStart(2, '0')}/${ano}`
    : `Ref: ${mes.toString().padStart(2, '0')}/${ano}`;

  const base = {
    empresa: regra.match_empresa,
    descricao,
    vencimento: vencimentoStr,
    valor: regra.valor_estimado ? (typeof regra.valor_estimado === 'number' ? regra.valor_estimado.toString() : regra.valor_estimado) : '',
    ano
  };

  if (regra.tipo === 'servico') {
    return {
      ...base,
      servico: regra.match_texto
    };
  } else {
    return {
      ...base,
      produto: regra.match_texto,
      fornecedor: regra.match_fornecedor || ''
    };
  }
}

/**
 * Cria uma nova configuração de despesa recorrente
 */
export async function createDespesaRecorrente(
  despesa: Omit<DespesaRecorrente, 'id' | 'created_at' | 'updated_at'>
): Promise<DespesaRecorrente> {
  try {
    logger.log('➕ Criando configuração de despesa recorrente...', despesa);

    const { data, error } = await supabase
      .from('despesas_recorrentes')
      .insert(despesa)
      .select()
      .single();

    if (error) {
      logger.error('❌ Erro ao criar despesa recorrente:', error);
      throw error;
    }

    logger.log('✅ Configuração criada com sucesso:', data);
    return data;
  } catch (error) {
    logger.error('❌ Erro ao criar despesa recorrente:', error);
    throw error;
  }
}

/**
 * Atualiza uma configuração de despesa recorrente
 */
export async function updateDespesaRecorrente(
  id: number,
  updates: Partial<DespesaRecorrente>
): Promise<DespesaRecorrente> {
  try {
    logger.log(`🔄 Atualizando configuração ${id}...`, updates);

    const { data, error } = await supabase
      .from('despesas_recorrentes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('❌ Erro ao atualizar despesa recorrente:', error);
      throw error;
    }

    logger.log('✅ Configuração atualizada com sucesso:', data);
    return data;
  } catch (error) {
    logger.error('❌ Erro ao atualizar despesa recorrente:', error);
    throw error;
  }
}

/**
 * Desativa uma configuração de despesa recorrente (soft delete)
 */
export async function deleteDespesaRecorrente(id: number): Promise<void> {
  try {
    logger.log(`🗑️ Desativando configuração ${id}...`);

    const { error } = await supabase
      .from('despesas_recorrentes')
      .update({ ativo: false })
      .eq('id', id);

    if (error) {
      logger.error('❌ Erro ao desativar despesa recorrente:', error);
      throw error;
    }

    logger.log('✅ Configuração desativada com sucesso');
  } catch (error) {
    logger.error('❌ Erro ao desativar despesa recorrente:', error);
    throw error;
  }
}
