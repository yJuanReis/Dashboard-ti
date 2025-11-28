import { supabase } from './supabaseClient';
import { NVR, Slot } from '@/contexts/NVRContext';
import { logCreate, logUpdate, logDelete } from './auditService';
import { logger } from "@/lib/logger";

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
        logger.warn('Erro ao fazer parse de slots:', e);
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
  logger.error(`Erro ao ${operation}:`, error);
  throw new Error(`Erro ao ${operation}: ${error.message || 'Erro desconhecido'}`);
}

/**
 * Busca todos os NVRs do Supabase
 */
export async function fetchNVRs(): Promise<NVR[]> {
  try {
    logger.log('🔍 Buscando NVRs do Supabase...');
    const { data, error } = await supabase
      .from('nvrs')
      .select('*')
      .order('marina', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      logger.error('❌ Erro ao buscar NVRs:', error);
      logger.error('Detalhes do erro:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      // Não lança erro aqui, apenas retorna array vazio para não quebrar a aplicação
      return [];
    }

    logger.log(`✅ ${data?.length || 0} NVRs encontrados no Supabase`);
    if (data && data.length > 0) {
      logger.log('📋 Primeiro NVR (exemplo):', data[0]);
    }
    
    const nvrs = (data || []).map((item, index) => {
      try {
        return dbToNVR(item);
      } catch (e) {
        logger.error(`❌ Erro ao converter NVR ${index}:`, e, item);
        return null;
      }
    }).filter((nvr): nvr is NVR => nvr !== null);
    
    logger.log(`📦 ${nvrs.length} NVRs convertidos com sucesso`);
    return nvrs;
  } catch (error) {
    logger.error('❌ Erro ao buscar NVRs:', error);
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
      .select('id, marina, name, model, owner, cameras, notes, slots, created_at, updated_at')
      .single();

    if (error) {
      handleSupabaseError(error, 'criar NVR');
      throw error;
    }

    const createdNVR = dbToNVR(data);
    
    // Registra log de auditoria
    logCreate(
      'nvrs',
      createdNVR.id,
      nvrData as Record<string, any>,
      `Criou NVR "${nvr.name}" (${nvr.marina})`
    ).catch(err => logger.warn('Erro ao registrar log de auditoria:', err));

    return createdNVR;
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
    // Busca os dados antigos antes de atualizar (para o log de auditoria)
    const { data: oldData } = await supabase
      .from('nvrs')
      .select('*')
      .eq('id', id)
      .single();

    const updateData = nvrToDB(updates);
    
    // Remove campos undefined do updateData
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== undefined)
    );
    
    const { data, error } = await supabase
      .from('nvrs')
      .update(cleanUpdateData)
      .eq('id', id)
      .select('id, marina, name, model, owner, cameras, notes, slots, created_at, updated_at')
      .single();

    if (error) {
      handleSupabaseError(error, 'atualizar NVR');
      throw error;
    }

    const updatedNVR = dbToNVR(data);
    
    // Registra log de auditoria
    if (oldData) {
      const oldNVR = dbToNVR(oldData);
      const nvrName = updatedNVR.name || oldNVR.name || 'Desconhecido';
      
      // Remove campos que não existem na tabela antes de passar para o log
      const { updated_at, ...oldDataClean } = oldData as Record<string, any>;
      const { updated_at: _, ...newDataClean } = data as Record<string, any>;
      
      logUpdate(
        'nvrs',
        id,
        oldDataClean,
        newDataClean,
        `Atualizou NVR "${nvrName}"`
      ).catch(err => logger.warn('Erro ao registrar log de auditoria:', err));
    }

    return updatedNVR;
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
    // Busca os dados antes de deletar (para o log de auditoria)
    const { data: oldData } = await supabase
      .from('nvrs')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('nvrs')
      .delete()
      .eq('id', id);

    if (error) {
      handleSupabaseError(error, 'deletar NVR');
      throw error;
    }

    // Registra log de auditoria
    if (oldData) {
      const oldNVR = dbToNVR(oldData);
      const nvrName = oldNVR.name || 'Desconhecido';
      
      logDelete(
        'nvrs',
        id,
        oldData as Record<string, any>,
        `Excluiu NVR "${nvrName}"`
      ).catch(err => logger.warn('Erro ao registrar log de auditoria:', err));
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
      .select('id, marina, name, model, owner, cameras, notes, slots, created_at, updated_at')
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
      .select('id, marina, name, model, owner, cameras, notes, slots, created_at, updated_at')
      .single();

    if (error) {
      handleSupabaseError(error, 'atualizar slot do NVR');
      throw error;
    }

    const updatedNVR = dbToNVR(data);
    
    // Registra log de auditoria para atualização de slot
    if (currentNVR) {
      try {
        const oldNVR = dbToNVR(currentNVR);
        const oldSlot = oldNVR.slots?.[slotIndex];
        const newSlot = updatedNVR.slots?.[slotIndex];
        
        // Cria descrição detalhada da mudança
        let description = `Atualizou slot ${slotIndex + 1} do NVR "${updatedNVR.name}" (${updatedNVR.marina})`;
        
        if (oldSlot && newSlot) {
          const changes: string[] = [];
          
          if (oldSlot.hdSize !== newSlot.hdSize) {
            changes.push(`HD: ${oldSlot.hdSize}TB → ${newSlot.hdSize}TB`);
          }
          
          if (oldSlot.status !== newSlot.status) {
            changes.push(`Status: ${oldSlot.status} → ${newSlot.status}`);
          }
          
          if (oldSlot.purchased !== newSlot.purchased) {
            changes.push(`Comprado: ${oldSlot.purchased ? 'Sim' : 'Não'} → ${newSlot.purchased ? 'Sim' : 'Não'}`);
          }
          
          if (changes.length > 0) {
            description += ` - ${changes.join(', ')}`;
          }
        }
        
        // Remove campos que não existem na tabela antes de passar para o log
        const { updated_at, ...oldDataClean } = currentNVR as Record<string, any>;
        const { updated_at: _, ...newDataClean } = data as Record<string, any>;
        
        // Prepara dados para o log (limita tamanho de arrays grandes para evitar problemas)
        const prepareDataForLog = (data: Record<string, any>) => {
          const prepared = { ...data };
          // Se slots for muito grande, cria uma versão resumida
          if (prepared.slots && Array.isArray(prepared.slots) && prepared.slots.length > 0) {
            // Mantém apenas o slot alterado e informações básicas dos outros
            const slotsSummary = prepared.slots.map((slot: any, idx: number) => {
              if (idx === slotIndex) {
                // Slot alterado - mantém todos os dados
                return slot;
              } else {
                // Outros slots - apenas informações básicas
                return {
                  status: slot.status,
                  hdSize: slot.hdSize,
                  purchased: slot.purchased
                };
              }
            });
            prepared.slots = slotsSummary;
          }
          return prepared;
        };
        
        const oldDataForLog = prepareDataForLog(oldDataClean);
        const newDataForLog = prepareDataForLog(newDataClean);
        
        // Aguarda o log ser registrado e trata erros explicitamente
        // Garante que record_id seja string
        const recordId = String(nvrId);
        
        logger.log(`📝 Tentando registrar log de auditoria para slot ${slotIndex + 1} do NVR ${updatedNVR.name}`, {
          nvrId: recordId,
          slotIndex,
          description
        });
        
        await logUpdate(
          'nvrs',
          recordId,
          oldDataForLog,
          newDataForLog,
          description
        );
        logger.log(`✅ Log de auditoria registrado com sucesso para slot ${slotIndex + 1} do NVR ${updatedNVR.name}`);
      } catch (err: any) {
        // Loga o erro mas não interrompe o fluxo
        logger.error('❌ Erro ao registrar log de auditoria para slot:', err);
        logger.error('Detalhes do erro:', {
          nvrId: String(nvrId),
          slotIndex,
          nvrName: updatedNVR.name,
          error: err,
          errorMessage: err?.message,
          errorStack: err?.stack
        });
        // Tenta registrar um log alternativo sem dados complexos
        try {
          await logUpdate(
            'nvrs',
            String(nvrId),
            { id: nvrId, slots: 'array' },
            { id: nvrId, slots: 'array_updated' },
            description
          ).catch(() => {
            logger.error('❌ Falha ao registrar log alternativo');
          });
        } catch (altErr) {
          logger.error('❌ Erro ao tentar log alternativo:', altErr);
        }
      }
    }

    return updatedNVR;
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

