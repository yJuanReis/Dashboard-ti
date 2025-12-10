/**
 * Serviço de Auditoria - Sistema de Logs
 * 
 * Este serviço registra todas as mudanças feitas no sistema:
 * - CREATE: Quando um registro é criado
 * - UPDATE: Quando um registro é atualizado (com valores antigos e novos)
 * - DELETE: Quando um registro é excluído (com dados do registro excluído)
 * 
 * Todas as informações são registradas: quem fez, quando, o que mudou
 */

import { supabase } from './supabaseClient';
import { logger } from "@/lib/logger";
import { getUserIP } from './ipService';

// Tipos de ação de auditoria expandidos
export type AuditActionType = 'CREATE' | 'UPDATE' | 'DELETE';

// Enum de ações específicas do sistema
export enum AuditAction {
  // Senhas
  PASSWORD_CREATED = 'PASSWORD_CREATED',
  PASSWORD_VIEWED = 'PASSWORD_VIEWED',
  PASSWORD_COPIED = 'PASSWORD_COPIED',
  PASSWORD_UPDATED = 'PASSWORD_UPDATED',
  PASSWORD_DELETED = 'PASSWORD_DELETED',
  PASSWORD_EXPORTED = 'PASSWORD_EXPORTED',
  
  // Usuários
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_LOGIN_FAILED = 'USER_LOGIN_FAILED',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  USER_PERMISSIONS_CHANGED = 'USER_PERMISSIONS_CHANGED',
  
  // Sessões
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_TIMEOUT = 'SESSION_TIMEOUT',
  
  // Segurança
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
}

// Contexto adicional para auditoria
export interface AuditContext {
  ip: string;
  userAgent: string;
  location?: string;
  device?: string;
  timestamp?: string;
}

// Interface para um log de auditoria
export interface AuditLog {
  id?: string;
  action_type: AuditActionType;
  table_name: string;
  record_id: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  changed_fields?: string[];
  description?: string;
  ip_address?: string;
  user_agent?: string;
  location?: string;
  device?: string;
  action?: AuditAction;
  created_at?: string;
}

// Interface para opções de busca de logs
export interface FetchAuditLogsOptions {
  table_name?: string;
  action_type?: AuditActionType;
  user_id?: string;
  record_id?: string;
  limit?: number;
  offset?: number;
  start_date?: string;
  end_date?: string;
  order_by?: 'created_at';
  order?: 'asc' | 'desc';
}

/**
 * Obtém informações do usuário atual
 */
async function getCurrentUserInfo(): Promise<{
  user_id?: string;
  user_email?: string;
  user_name?: string;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {};
    }

    // Busca informações adicionais do perfil
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('nome, email')
      .eq('user_id', user.id)
      .single();

    return {
      user_id: user.id,
      user_email: user.email || profile?.email,
      user_name: profile?.nome || user.user_metadata?.nome || user.user_metadata?.name,
    };
  } catch (error) {
    logger.warn('Erro ao obter informações do usuário:', error);
    // Tenta pelo menos pegar o user básico
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return {
        user_id: user?.id,
        user_email: user?.email,
      };
    } catch {
      return {};
    }
  }
}

/**
 * Compara dois objetos e retorna os campos que foram alterados
 */
function getChangedFields(oldData: Record<string, any>, newData: Record<string, any>): string[] {
  const changed: string[] = [];
  
  // Função auxiliar para comparar valores (incluindo arrays e objetos)
  const isEqual = (a: any, b: any): boolean => {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    
    // Compara arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, idx) => isEqual(val, b[idx]));
    }
    
    // Compara objetos
    if (typeof a === 'object' && typeof b === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      return keysA.every(key => isEqual(a[key], b[key]));
    }
    
    return false;
  };
  
  // Verifica campos que mudaram ou foram adicionados
  for (const key in newData) {
    if (!isEqual(oldData[key], newData[key])) {
      changed.push(key);
    }
  }
  
  // Verifica campos que foram removidos
  for (const key in oldData) {
    if (!(key in newData)) {
      changed.push(key);
    }
  }
  
  return changed;
}

/**
 * Remove campos sensíveis dos dados antes de salvar no log
 * (por exemplo, senhas não devem ser registradas em texto claro)
 */
function sanitizeData(data: Record<string, any>): Record<string, any> {
  const sanitized = { ...data };
  const sensitiveFields = ['password', 'senha', 'token', 'secret', 'api_key', 'apikey'];
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }
  
  return sanitized;
}

/**
 * Obtém contexto do navegador
 */
function getAuditContext(): Partial<AuditContext> {
  try {
    const userAgent = navigator.userAgent || '';
    
    // Detectar tipo de dispositivo
    let device = 'Desktop';
    if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      device = 'Mobile';
    } else if (/Tablet|iPad/i.test(userAgent)) {
      device = 'Tablet';
    }

    return {
      userAgent,
      device,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.warn('Erro ao obter contexto de auditoria:', error);
    return {};
  }
}

/**
 * Registra um log de auditoria
 */
export async function logAudit(entry: Omit<AuditLog, 'id' | 'created_at'>): Promise<void> {
  try {
    // Obtém informações do usuário atual
    const userInfo = await getCurrentUserInfo();
    
    // Obtém IP do usuário
    const ipAddress = await getUserIP();
    
    // Obtém contexto do navegador
    const context = getAuditContext();
    
    // Prepara o registro
    // NOTA: Apenas campos que existem na tabela audit_logs devem ser incluídos
    // Schema da tabela: id, action_type, table_name, record_id, user_id, user_email, 
    // user_name, old_data, new_data, changed_fields, description, ip_address, created_at
    // Campos NÃO disponíveis: device, user_agent, location, action
    
    // Adiciona informações de device/user_agent na description se disponível
    let descriptionWithContext = entry.description || '';
    if (context.device || context.userAgent) {
      const deviceInfo = context.device ? ` [${context.device}]` : '';
      if (descriptionWithContext && deviceInfo) {
        descriptionWithContext += deviceInfo;
      }
    }
    
    // Prepara o registro apenas com campos que existem na tabela
    const logRecord: Record<string, any> = {
      action_type: entry.action_type,
      table_name: entry.table_name,
      record_id: String(entry.record_id), // Garante que seja string
      user_id: entry.user_id || userInfo.user_id || null,
      user_email: entry.user_email || userInfo.user_email || null,
      user_name: entry.user_name || userInfo.user_name || null,
      old_data: entry.old_data ? sanitizeData(entry.old_data) : null,
      new_data: entry.new_data ? sanitizeData(entry.new_data) : null,
      changed_fields: entry.changed_fields || [],
      description: descriptionWithContext || null,
      ip_address: ipAddress || entry.ip_address || null,
      // created_at será definido automaticamente pelo banco (DEFAULT NOW())
      // NÃO incluir: device, user_agent, location, action (não existem na tabela)
    };

    // Validação antes de inserir
    if (!entry.table_name || !entry.record_id) {
      logger.error('❌ Tentativa de inserir log inválido:', {
        table_name: entry.table_name,
        record_id: entry.record_id,
        action_type: entry.action_type
      });
      return;
    }

    // Insere no banco de dados
    // NOTA: Não usamos .select() porque usuários não-admin não podem ler audit_logs
    // O INSERT funciona, mas o SELECT retornaria 401 para não-admins
    const { error } = await supabase
      .from('audit_logs')
      .insert(logRecord);

    if (error) {
      logger.error('❌ Erro ao registrar log de auditoria:', error);
      logger.error('Detalhes do erro:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        table: entry.table_name,
        record_id: entry.record_id,
        action_type: entry.action_type
      });
      logger.error('Dados do log que falhou:', {
        table_name: logRecord.table_name,
        record_id: logRecord.record_id,
        action_type: logRecord.action_type,
        description: logRecord.description
      });
      // Não lança erro para não quebrar o fluxo da aplicação
      // Mas registra no console para debug
    } else {
      logger.log('✅ Log de auditoria registrado com sucesso:', {
        table: entry.table_name,
        record_id: entry.record_id,
        description: entry.description,
        action_type: entry.action_type
      });
    }
  } catch (error: any) {
    logger.error('❌ Erro ao registrar log de auditoria (catch):', error);
    logger.error('Stack trace:', error?.stack);
    // Não lança erro para não quebrar o fluxo da aplicação
  }
}

/**
 * Registra uma ação de CREATE
 */
export async function logCreate(
  tableName: string,
  recordId: string,
  newData: Record<string, any>,
  description?: string
): Promise<void> {
  await logAudit({
    action_type: 'CREATE',
    table_name: tableName,
    record_id: recordId,
    new_data: newData,
    description: description || `Criou registro em ${tableName}`,
  });
}

/**
 * Registra uma ação de UPDATE
 */
export async function logUpdate(
  tableName: string,
  recordId: string,
  oldData: Record<string, any>,
  newData: Record<string, any>,
  description?: string
): Promise<void> {
  try {
    // Garante que recordId seja string
    const recordIdStr = String(recordId);
    
    // Validação básica
    if (!tableName || !recordIdStr) {
      logger.warn('⚠️ Tentativa de log com dados inválidos:', { tableName, recordId: recordIdStr });
      return;
    }
    
    const changedFields = getChangedFields(oldData, newData);
    
    await logAudit({
      action_type: 'UPDATE',
      table_name: tableName,
      record_id: recordIdStr,
      old_data: oldData,
      new_data: newData,
      changed_fields: changedFields,
      description: description || `Atualizou registro em ${tableName}`,
    });
  } catch (error: any) {
    logger.error('❌ Erro em logUpdate:', error);
    logger.error('Detalhes:', {
      tableName,
      recordId,
      errorMessage: error?.message,
      errorStack: error?.stack
    });
    // Re-lança o erro para que o código chamador possa tratá-lo
    throw error;
  }
}

/**
 * Registra uma ação de DELETE
 */
export async function logDelete(
  tableName: string,
  recordId: string,
  oldData: Record<string, any>,
  description?: string
): Promise<void> {
  await logAudit({
    action_type: 'DELETE',
    table_name: tableName,
    record_id: recordId,
    old_data: oldData,
    description: description || `Excluiu registro de ${tableName}`,
  });
}

/**
 * Busca logs de auditoria
 * Apenas administradores podem buscar logs
 */
export async function fetchAuditLogs(options: FetchAuditLogsOptions = {}): Promise<AuditLog[]> {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*');

    // Aplica filtros
    if (options.table_name) {
      query = query.eq('table_name', options.table_name);
    }

    if (options.action_type) {
      query = query.eq('action_type', options.action_type);
    }

    if (options.user_id) {
      query = query.eq('user_id', options.user_id);
    }

    if (options.record_id) {
      query = query.eq('record_id', options.record_id);
    }

    if (options.start_date) {
      query = query.gte('created_at', options.start_date);
    }

    if (options.end_date) {
      query = query.lte('created_at', options.end_date);
    }

    // Ordenação
    const orderBy = options.order_by || 'created_at';
    const ascending = options.order === 'asc';
    query = query.order(orderBy, { ascending });

    // Limite e offset
    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Erro ao buscar logs de auditoria:', error);
      throw error;
    }

    return (data || []) as AuditLog[];
  } catch (error) {
    logger.error('Erro ao buscar logs de auditoria:', error);
    throw error;
  }
}

/**
 * Conta o total de logs (para paginação)
 */
export async function countAuditLogs(options: Omit<FetchAuditLogsOptions, 'limit' | 'offset' | 'order_by' | 'order'> = {}): Promise<number> {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true });

    // Aplica os mesmos filtros
    if (options.table_name) {
      query = query.eq('table_name', options.table_name);
    }

    if (options.action_type) {
      query = query.eq('action_type', options.action_type);
    }

    if (options.user_id) {
      query = query.eq('user_id', options.user_id);
    }

    if (options.record_id) {
      query = query.eq('record_id', options.record_id);
    }

    if (options.start_date) {
      query = query.gte('created_at', options.start_date);
    }

    if (options.end_date) {
      query = query.lte('created_at', options.end_date);
    }

    const { count, error } = await query;

    if (error) {
      logger.error('Erro ao contar logs de auditoria:', error);
      throw error;
    }

    return count || 0;
  } catch (error) {
    logger.error('Erro ao contar logs de auditoria:', error);
    throw error;
  }
}

/**
 * Registra ação específica de auditoria (senhas, usuários, segurança)
 */
export async function logAction(
  action: AuditAction,
  recordId: string,
  description?: string,
  additionalData?: Record<string, any>
): Promise<void> {
  const tableName = action.startsWith('PASSWORD_') ? 'passwords' 
    : action.startsWith('USER_') ? 'user_profiles'
    : action.startsWith('SESSION_') ? 'sessions'
    : 'security_logs';
  
  const actionType = action.includes('DELETED') ? 'DELETE' 
    : action.includes('CREATED') ? 'CREATE'
    : 'UPDATE';

  await logAudit({
    action_type: actionType,
    table_name: tableName,
    record_id: recordId,
    description: description || action,
    action,
    new_data: additionalData,
  });
}

/**
 * Detecta e registra atividade suspeita
 */
export async function logSuspiciousActivity(
  reason: string,
  details: Record<string, any>
): Promise<void> {
  await logAction(
    AuditAction.SUSPICIOUS_ACTIVITY,
    `suspicious-${Date.now()}`,
    reason,
    details
  );
}

/**
 * Verifica eventos suspeitos e retorna alertas
 */
export async function checkSuspiciousActivity(userId: string): Promise<{
  hasAlerts: boolean;
  alerts: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}> {
  try {
    const alerts: Array<{
      type: string;
      message: string;
      severity: 'low' | 'medium' | 'high';
    }> = [];

    // Verificar múltiplos logins falhados nas últimas 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: failedLogins } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .ilike('description', `%${AuditAction.USER_LOGIN_FAILED}%`)
      .gte('created_at', oneDayAgo);

    if (failedLogins && failedLogins.length >= 5) {
      alerts.push({
        type: 'failed_logins',
        message: `${failedLogins.length} tentativas de login falhadas nas últimas 24 horas`,
        severity: 'high',
      });
    }

    // Verificar acessos de IPs diferentes na última hora
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentLogs } = await supabase
      .from('audit_logs')
      .select('ip_address')
      .eq('user_id', userId)
      .gte('created_at', oneHourAgo);

    if (recentLogs) {
      const uniqueIPs = new Set(recentLogs.map(log => log.ip_address));
      if (uniqueIPs.size > 2) {
        alerts.push({
          type: 'multiple_ips',
          message: `Acessos de ${uniqueIPs.size} IPs diferentes na última hora`,
          severity: 'medium',
        });
      }
    }

    // Verificar exclusões em massa (mais de 10 registros em 5 minutos)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: deletions } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('action_type', 'DELETE')
      .gte('created_at', fiveMinutesAgo);

    if (deletions && deletions.length >= 10) {
      alerts.push({
        type: 'mass_deletion',
        message: `${deletions.length} registros excluídos nos últimos 5 minutos`,
        severity: 'high',
      });
    }

    return {
      hasAlerts: alerts.length > 0,
      alerts,
    };
  } catch (error) {
    logger.error('Erro ao verificar atividade suspeita:', error);
    return { hasAlerts: false, alerts: [] };
  }
}

/**
 * Exporta logs para CSV
 */
export async function exportLogsToCSV(options: FetchAuditLogsOptions = {}): Promise<string> {
  try {
    const logs = await fetchAuditLogs({ ...options, limit: 10000 });
    
    // Cabeçalho do CSV
    const headers = [
      'Data/Hora',
      'Usuário',
      'Email',
      'Ação',
      'Tabela',
      'ID do Registro',
      'Descrição',
      'IP',
      'Dispositivo',
    ];
    
    // Converter logs para linhas CSV
    const rows = logs.map(log => [
      log.created_at || '',
      log.user_name || '',
      log.user_email || '',
      log.action || log.action_type || '',
      log.table_name || '',
      log.record_id || '',
      log.description || '',
      log.ip_address || '',
      log.device || '',
    ]);
    
    // Construir CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    return csvContent;
  } catch (error) {
    logger.error('Erro ao exportar logs para CSV:', error);
    throw error;
  }
}

