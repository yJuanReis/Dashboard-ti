import { supabase } from './supabaseClient';
import { logger } from './logger';

export interface ConfiguracaoOrcamento {
  id: number;
  chave: string;
  nome: string;
  valor: number;
  tipo: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Busca uma configuração de orçamento por chave
 */
export async function buscarConfiguracaoPorChave(chave: string): Promise<ConfiguracaoOrcamento | null> {
  try {
    logger.log(`Buscando configuração: ${chave}`);

    const { data, error } = await supabase
      .from('configuracoes_orcamento')
      .select('*')
      .eq('chave', chave)
      .eq('ativo', true);

    if (error) {
      logger.error('Erro ao buscar configuração:', error);
      throw error;
    }

    // Retorna o primeiro resultado ou null se não encontrar
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    logger.error('Erro ao buscar configuração:', error);
    throw error;
  }
}

/**
 * Busca o valor de uma configuração por chave
 */
export async function buscarValorConfiguracao(chave: string, valorPadrao: number = 0): Promise<number> {
  try {
    const config = await buscarConfiguracaoPorChave(chave);
    return config ? config.valor : valorPadrao;
  } catch (error) {
    logger.error(`Erro ao buscar valor da configuração ${chave}:`, error);
    return valorPadrao;
  }
}

/**
 * Lista todas as configurações ativas
 */
export async function listarConfiguracoes(tipo?: string): Promise<ConfiguracaoOrcamento[]> {
  try {
    logger.log(`Listando configurações${tipo ? ` do tipo ${tipo}` : ''}`);

    let query = supabase
      .from('configuracoes_orcamento')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error('Erro ao listar configurações:', error);
    throw error;
  }
}

/**
 * Cria ou atualiza uma configuração
 */
export async function salvarConfiguracao(
  chave: string,
  nome: string,
  valor: number,
  tipo: string = 'orcamento'
): Promise<ConfiguracaoOrcamento> {
  try {
    logger.log(`Salvando configuração: ${chave} = ${valor}`);

    const { data, error } = await supabase
      .from('configuracoes_orcamento')
      .upsert({
        chave,
        nome,
        valor,
        tipo,
        ativo: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'chave'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.log(`Configuração ${chave} salva com sucesso`);
    return data;
  } catch (error) {
    logger.error('Erro ao salvar configuração:', error);
    throw error;
  }
}

/**
 * Atualiza o valor de uma configuração existente
 */
export async function atualizarValorConfiguracao(chave: string, valor: number): Promise<ConfiguracaoOrcamento> {
  try {
    logger.log(`Atualizando valor da configuração ${chave} para ${valor}`);

    const { data, error } = await supabase
      .from('configuracoes_orcamento')
      .update({
        valor,
        updated_at: new Date().toISOString()
      })
      .eq('chave', chave)
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.log(`Valor da configuração ${chave} atualizado com sucesso`);
    return data;
  } catch (error) {
    logger.error(`Erro ao atualizar valor da configuração ${chave}:`, error);
    throw error;
  }
}

/**
 * Desativa uma configuração (soft delete)
 */
export async function desativarConfiguracao(chave: string): Promise<void> {
  try {
    logger.log(`Desativando configuração: ${chave}`);

    const { error } = await supabase
      .from('configuracoes_orcamento')
      .update({
        ativo: false,
        updated_at: new Date().toISOString()
      })
      .eq('chave', chave);

    if (error) {
      throw error;
    }

    logger.log(`Configuração ${chave} desativada com sucesso`);
  } catch (error) {
    logger.error(`Erro ao desativar configuração ${chave}:`, error);
    throw error;
  }
}

/**
 * Funções específicas para orçamento
 */
export class OrcamentoService {
  /**
   * Gera a chave do orçamento baseada no ano
   */
  private static gerarChaveOrcamento(ano?: number): string {
    const anoAtual = ano || new Date().getFullYear();
    return `orcamento_mensal_total_${anoAtual}`;
  }

  /**
   * Busca o orçamento mensal total do ano atual
   */
  static async buscarOrcamentoTotal(ano?: number): Promise<number> {
    const chave = this.gerarChaveOrcamento(ano);
    return await buscarValorConfiguracao(chave, 150000);
  }

  /**
   * Atualiza o orçamento mensal total do ano atual
   */
  static async atualizarOrcamentoTotal(valor: number, ano?: number): Promise<ConfiguracaoOrcamento> {
    const chave = this.gerarChaveOrcamento(ano);
    const anoAtual = ano || new Date().getFullYear();

    return await salvarConfiguracao(
      chave,
      `Orçamento Mensal Total ${anoAtual}`,
      valor,
      'orcamento'
    );
  }

  /**
   * Busca o orçamento de um ano específico
   */
  static async buscarOrcamentoPorAno(ano: number): Promise<number> {
    return await this.buscarOrcamentoTotal(ano);
  }

  /**
   * Atualiza o orçamento de um ano específico
   */
  static async atualizarOrcamentoPorAno(valor: number, ano: number): Promise<ConfiguracaoOrcamento> {
    return await this.atualizarOrcamentoTotal(valor, ano);
  }
}