import { supabase } from './supabaseClient';

// Interface para os logs
export interface LogEntry {
  id?: string;
  nivel: 'info' | 'success' | 'warning' | 'error';
  modulo: string; // 'SENHAS', 'SUPABASE', etc.
  mensagem: string;
  dados?: Record<string, any>; // Dados adicionais em JSON
  timestamp?: string;
  usuario?: string; // Pode ser usado no futuro para identificar usuário
  stack?: string; // Stack trace para erros
}

// Nome da tabela de logs
const LOGS_TABLE = 'logs';

/**
 * Salva um log no Supabase
 * Se falhar, apenas loga no console (não quebra a aplicação)
 */
export async function saveLog(entry: LogEntry): Promise<void> {
  try {
    // Prepara o registro para inserção
    const logRecord = {
      nivel: entry.nivel,
      modulo: entry.modulo,
      mensagem: entry.mensagem,
      dados: entry.dados ? JSON.stringify(entry.dados) : null,
      timestamp: entry.timestamp || new Date().toISOString(),
      usuario: entry.usuario || null,
      stack: entry.stack || null,
    };

    // Tenta inserir no Supabase
    const { error } = await supabase
      .from(LOGS_TABLE)
      .insert(logRecord);

    if (error) {
      // Se falhar, apenas loga no console (não quebra a aplicação)
      console.warn('⚠️ [LOGS] Erro ao salvar log no Supabase:', error.message);
      // Ainda mostra o log no console
      console.log(`[${entry.modulo}] ${entry.mensagem}`, entry.dados);
    }
  } catch (error) {
    // Se houver qualquer erro, apenas loga no console
    console.warn('⚠️ [LOGS] Erro ao salvar log:', error);
    // Ainda mostra o log no console
    console.log(`[${entry.modulo}] ${entry.mensagem}`, entry.dados);
  }
}

/**
 * Função helper para criar logs de forma mais fácil
 */
export const logger = {
  info: (modulo: string, mensagem: string, dados?: Record<string, any>) => {
    const entry: LogEntry = {
      nivel: 'info',
      modulo,
      mensagem,
      dados,
      timestamp: new Date().toISOString(),
    };
    console.log(`ℹ️ [${modulo}] ${mensagem}`, dados);
    saveLog(entry);
  },

  success: (modulo: string, mensagem: string, dados?: Record<string, any>) => {
    const entry: LogEntry = {
      nivel: 'success',
      modulo,
      mensagem,
      dados,
      timestamp: new Date().toISOString(),
    };
    console.log(`✅ [${modulo}] ${mensagem}`, dados);
    saveLog(entry);
  },

  warning: (modulo: string, mensagem: string, dados?: Record<string, any>) => {
    const entry: LogEntry = {
      nivel: 'warning',
      modulo,
      mensagem,
      dados,
      timestamp: new Date().toISOString(),
    };
    console.warn(`⚠️ [${modulo}] ${mensagem}`, dados);
    saveLog(entry);
  },

  error: (modulo: string, mensagem: string, dados?: Record<string, any>, stack?: string) => {
    const entry: LogEntry = {
      nivel: 'error',
      modulo,
      mensagem,
      dados,
      stack,
      timestamp: new Date().toISOString(),
    };
    console.error(`❌ [${modulo}] ${mensagem}`, dados);
    saveLog(entry);
  },
};

/**
 * Busca logs do Supabase
 */
export async function fetchLogs(options?: {
  modulo?: string;
  nivel?: LogEntry['nivel'];
  limite?: number;
  ordenarPor?: 'timestamp';
  ordem?: 'asc' | 'desc';
}): Promise<LogEntry[]> {
  try {
    let query = supabase
      .from(LOGS_TABLE)
      .select('*');

    if (options?.modulo) {
      query = query.eq('modulo', options.modulo);
    }

    if (options?.nivel) {
      query = query.eq('nivel', options.nivel);
    }

    if (options?.ordenarPor || !options?.ordenarPor) {
      query = query.order(options?.ordenarPor || 'timestamp', { 
        ascending: options?.ordem === 'asc' 
      });
    }

    if (options?.limite) {
      query = query.limit(options.limite);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar logs:', error);
      return [];
    }

    // Converte os dados de volta para o formato LogEntry
    return (data || []).map((log: any) => ({
      id: log.id,
      nivel: log.nivel,
      modulo: log.modulo,
      mensagem: log.mensagem,
      dados: log.dados ? JSON.parse(log.dados) : null,
      timestamp: log.timestamp,
      usuario: log.usuario,
      stack: log.stack,
    }));
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    return [];
  }
}

