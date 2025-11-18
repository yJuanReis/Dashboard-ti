import { supabase } from './supabaseClient';

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
      console.error('Erro ao buscar preço do HD:', error);
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
    console.error('Erro ao buscar preço do HD:', error);
    return 100.0;
  }
}

/**
 * Salva o preço do HD no Supabase
 */
export async function saveHDPrice(price: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('nvr_config')
      .upsert({
        key: 'hd_price',
        value: price,
      }, {
        onConflict: 'key'
      });

    if (error) {
      console.error('Erro ao salvar preço do HD:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erro ao salvar preço do HD:', error);
    throw error;
  }
}

