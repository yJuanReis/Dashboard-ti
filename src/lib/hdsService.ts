import { supabase } from './supabaseClient';
import { logger } from './logger';

export interface HD {
  id: string;
  modelo?: string;
  tamanho_tb?: number; // Assumindo que você tem uma coluna para tamanho em TB
  status?: string;
  local?: string;
}

export async function fetchHDs(): Promise<HD[]> {
  try {
    // Ajuste 'controle_hds' para o nome exato da sua tabela no Supabase se for diferente
    // Se a tabela se chamar apenas 'hds', mude aqui.
    const { data, error } = await supabase
      .from('controle_hds') 
      .select('*');

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error("Erro ao carregar HDs:", error);
    return [];
  }
}