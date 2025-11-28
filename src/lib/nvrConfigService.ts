import { supabase } from './supabaseClient';
import { logger } from "@/lib/logger";
import { logCreate, logUpdate } from './auditService';

/**
 * Busca o preço do HD do Supabase
 */
export async function fetchHDPrice(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('nvr_config')
      .select('value')
      .eq('key', 'hd_price')
      .single();

    if (error) {
      logger.error('Erro ao buscar preço do HD:', error);
      // Retorna valor padrão se houver erro
      return 100.0;
    }

    if (data && data.value) {
      // O valor está armazenado como JSONB, pode ser número ou string
      const price = typeof data.value === 'number' 
        ? data.value 
        : parseFloat(String(data.value));
      
      return isNaN(price) ? 100.0 : price;
    }

    return 100.0;
  } catch (error) {
    logger.error('Erro ao buscar preço do HD:', error);
    return 100.0;
  }
}

/**
 * Salva o preço do HD no Supabase
 */
export async function saveHDPrice(price: number): Promise<void> {
  try {
    // Busca dados antigos antes de atualizar (para o log de auditoria)
    const { data: oldData } = await supabase
      .from('nvr_config')
      .select('*')
      .eq('key', 'hd_price')
      .single();

    const { data: newData, error } = await supabase
      .from('nvr_config')
      .upsert({
        key: 'hd_price',
        value: price,
      }, {
        onConflict: 'key'
      })
      .select()
      .single();

    if (error) {
      logger.error('Erro ao salvar preço do HD:', error);
      throw error;
    }

    // Registra log de auditoria
    if (oldData && newData) {
      // É uma atualização
      await logUpdate(
        'nvr_config',
        newData.id || 'hd_price',
        oldData as Record<string, any>,
        newData as Record<string, any>,
        `Atualizou preço do HD: ${oldData.value} → ${price}`
      ).catch(err => logger.warn('Erro ao registrar log de auditoria:', err));
    } else if (newData) {
      // É uma criação
      await logCreate(
        'nvr_config',
        newData.id || 'hd_price',
        newData as Record<string, any>,
        `Criou configuração de preço do HD: ${price}`
      ).catch(err => logger.warn('Erro ao registrar log de auditoria:', err));
    }
  } catch (error) {
    logger.error('Erro ao salvar preço do HD:', error);
    throw error;
  }
}

