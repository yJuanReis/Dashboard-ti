import { supabase } from './supabaseClient';
import { logger } from "@/lib/logger";

// Interface para ConfigSolicitacao
export interface ConfigSolicitacao {
  id: string;
  servico: string;
  descricao: string;
  empresa: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Busca todas as configurações de solicitações do Supabase
 */
export async function fetchConfigSolicitacoes(): Promise<ConfigSolicitacao[]> {
  try {
    logger.log('🔍 Buscando configurações de solicitações do Supabase...');
    const { data, error } = await supabase
      .from('config_solicitacoes')
      .select('*')
      .order('servico', { ascending: true });

    if (error) {
      logger.error('❌ Erro ao buscar configurações de solicitações:', error);
      return [];
    }

    logger.log(`✅ ${data?.length || 0} configurações encontradas no Supabase`);
    return (data || []).map((item) => ({
      id: item.id,
      servico: item.servico || '',
      descricao: item.descricao || '',
      empresa: item.empresa || '',
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));
  } catch (error) {
    logger.error('❌ Erro ao buscar configurações de solicitações:', error);
    return [];
  }
}

/**
 * Busca serviços únicos da tabela config_solicitacoes
 */
export async function fetchServicosUnicos(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('config_solicitacoes')
      .select('servico')
      .order('servico', { ascending: true });

    if (error) {
      logger.error('❌ Erro ao buscar serviços únicos:', error);
      return [];
    }

    const servicosUnicos = Array.from(new Set((data || []).map(item => item.servico).filter(Boolean)));
    return servicosUnicos;
  } catch (error) {
    logger.error('❌ Erro ao buscar serviços únicos:', error);
    return [];
  }
}

/**
 * Busca empresas únicas da tabela config_solicitacoes
 */
export async function fetchEmpresasUnicas(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('config_solicitacoes')
      .select('empresa')
      .order('empresa', { ascending: true });

    if (error) {
      logger.error('❌ Erro ao buscar empresas únicas:', error);
      return [];
    }

    const empresasUnicas = Array.from(new Set((data || []).map(item => item.empresa).filter(Boolean)));
    return empresasUnicas;
  } catch (error) {
    logger.error('❌ Erro ao buscar empresas únicas:', error);
    return [];
  }
}

/**
 * Busca configurações filtradas por serviço
 */
export async function fetchConfigByServico(servico: string): Promise<ConfigSolicitacao[]> {
  try {
    const { data, error } = await supabase
      .from('config_solicitacoes')
      .select('*')
      .eq('servico', servico)
      .order('empresa', { ascending: true });

    if (error) {
      logger.error('❌ Erro ao buscar configurações por serviço:', error);
      return [];
    }

    return (data || []).map((item) => ({
      id: item.id,
      servico: item.servico || '',
      descricao: item.descricao || '',
      empresa: item.empresa || '',
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));
  } catch (error) {
    logger.error('❌ Erro ao buscar configurações por serviço:', error);
    return [];
  }
}

/**
 * Busca configurações filtradas por empresa
 */
export async function fetchConfigByEmpresa(empresa: string): Promise<ConfigSolicitacao[]> {
  try {
    const { data, error } = await supabase
      .from('config_solicitacoes')
      .select('*')
      .eq('empresa', empresa)
      .order('servico', { ascending: true });

    if (error) {
      logger.error('❌ Erro ao buscar configurações por empresa:', error);
      return [];
    }

    return (data || []).map((item) => ({
      id: item.id,
      servico: item.servico || '',
      descricao: item.descricao || '',
      empresa: item.empresa || '',
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));
  } catch (error) {
    logger.error('❌ Erro ao buscar configurações por empresa:', error);
    return [];
  }
}

