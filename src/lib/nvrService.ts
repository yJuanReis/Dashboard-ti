import { supabase } from './supabaseClient';
import { NVR, Slot } from '@/contexts/NVRContext';

// Interface para o formato no banco de dados
export interface NVRDB {
  id: string;
  marina: string;
  name: string;
  model: string;
  owner: string;
  cameras: number;
  notes?: string | null;
  slots: Slot[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Converte NVR do formato do banco para o formato da aplicação
 */
function dbToNVR(dbNVR: NVRDB): NVR {
  // Garante que slots seja um array válido
  let slots: Slot[] = [];
  if (dbNVR.slots) {
    if (Array.isArray(dbNVR.slots)) {
      slots = dbNVR.slots;
    } else if (typeof dbNVR.slots === 'string') {
      // Se slots vier como string JSON, faz parse
      try {
        slots = JSON.parse(dbNVR.slots);
      } catch (e) {
        console.warn('Erro ao fazer parse de slots:', e);
        slots = [];
      }
    }
  }

  return {
    id: String(dbNVR.id),
    marina: dbNVR.marina || '',
    name: dbNVR.name || '',
    model: dbNVR.model || '',
    owner: dbNVR.owner || '',
    cameras: dbNVR.cameras || 0,
    notes: dbNVR.notes || undefined,
    slots: slots,
  };
}

/**
 * Converte NVR do formato da aplicação para o formato do banco
 */
function nvrToDB(nvr: Partial<NVR>): Partial<NVRDB> {
  return {
    marina: nvr.marina,
    name: nvr.name,
    model: nvr.model,
    owner: nvr.owner,
    cameras: nvr.cameras,
    notes: nvr.notes || null,
    slots: nvr.slots,
  };
}

/**
 * Trata erros do Supabase de forma consistente
 */
function handleSupabaseError(error: any, operation: string) {
  console.error(`Erro ao ${operation}:`, error);
  throw new Error(`Erro ao ${operation}: ${error.message || 'Erro desconhecido'}`);
}

/**
 * Busca todos os NVRs do Supabase
 */
export async function fetchNVRs(): Promise<NVR[]> {
  try {
    console.log('🔍 Buscando NVRs do Supabase...');
    const { data, error } = await supabase
      .from('nvrs')
      .select('*')
      .order('marina', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar NVRs:', error);
      console.error('Detalhes do erro:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      // Não lança erro aqui, apenas retorna array vazio para não quebrar a aplicação
      return [];
    }

    console.log(`✅ ${data?.length || 0} NVRs encontrados no Supabase`);
    if (data && data.length > 0) {
      console.log('📋 Primeiro NVR (exemplo):', data[0]);
    }
    
    const nvrs = (data || []).map((item, index) => {
      try {
        return dbToNVR(item);
      } catch (e) {
        console.error(`❌ Erro ao converter NVR ${index}:`, e, item);
        return null;
      }
    }).filter((nvr): nvr is NVR => nvr !== null);
    
    console.log(`📦 ${nvrs.length} NVRs convertidos com sucesso`);
    return nvrs;
  } catch (error) {
    console.error('❌ Erro ao buscar NVRs:', error);
    handleSupabaseError(error, 'buscar NVRs');
    return [];
  }
}

/**
 * Cria um novo NVR no Supabase
 */
export async function createNVR(nvr: Omit<NVR, 'id'>): Promise<NVR> {
  try {
    const nvrData = nvrToDB(nvr) as NVRDB;
    
    const { data, error } = await supabase
      .from('nvrs')
      .insert(nvrData)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, 'criar NVR');
      throw error;
    }

    return dbToNVR(data);
  } catch (error) {
    handleSupabaseError(error, 'criar NVR');
    throw error;
  }
}

/**
 * Atualiza um NVR existente no Supabase
 */
export async function updateNVR(id: string, updates: Partial<NVR>): Promise<NVR> {
  try {
    const updateData = nvrToDB(updates);
    
    // Remove campos undefined do updateData
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== undefined)
    );
    
    const { data, error } = await supabase
      .from('nvrs')
      .update(cleanUpdateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, 'atualizar NVR');
      throw error;
    }

    return dbToNVR(data);
  } catch (error) {
    handleSupabaseError(error, 'atualizar NVR');
    throw error;
  }
}

/**
 * Deleta um NVR do Supabase
 */
export async function deleteNVR(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('nvrs')
      .delete()
      .eq('id', id);

    if (error) {
      handleSupabaseError(error, 'deletar NVR');
      throw error;
    }
  } catch (error) {
    handleSupabaseError(error, 'deletar NVR');
    throw error;
  }
}

/**
 * Atualiza um slot específico de um NVR
 */
export async function updateNVRSlot(
  nvrId: string,
  slotIndex: number,
  slot: Slot
): Promise<NVR> {
  try {
    // Primeiro, busca o NVR atual
    const { data: currentNVR, error: fetchError } = await supabase
      .from('nvrs')
      .select('*')
      .eq('id', nvrId)
      .single();

    if (fetchError || !currentNVR) {
      handleSupabaseError(fetchError, 'buscar NVR para atualizar slot');
      throw fetchError;
    }

    // Atualiza o slot específico
    const slots = currentNVR.slots || [];
    const updatedSlots = [...slots];
    updatedSlots[slotIndex] = slot;

    // Atualiza o NVR com os slots atualizados
    const { data, error } = await supabase
      .from('nvrs')
      .update({
        slots: updatedSlots,
      })
      .eq('id', nvrId)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, 'atualizar slot do NVR');
      throw error;
    }

    return dbToNVR(data);
  } catch (error) {
    handleSupabaseError(error, 'atualizar slot do NVR');
    throw error;
  }
}

/**
 * Configura um listener em tempo real para mudanças na tabela NVR
 */
export function subscribeToNVRs(
  callback: (nvrs: NVR[]) => void
): () => void {
  const channel = supabase
    .channel('nvr-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'nvrs',
      },
      async () => {
        // Quando há mudanças, busca os dados atualizados
        const nvrs = await fetchNVRs();
        callback(nvrs);
      }
    )
    .subscribe();

  // Retorna função para cancelar a subscription
  return () => {
    supabase.removeChannel(channel);
  };
}

