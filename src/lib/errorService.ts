/**
 * Error Service - Sistema de gerenciamento de erros com níveis de segurança
 * 
 * Este serviço fornece:
 * - Níveis de erro (user, technical, security)
 * - Mensagens específicas mas seguras
 * - Timing protection para prevenir ataques de timing
 * - Rate limiting e tracking de tentativas
 */

import { logger } from './logger';

export type ErrorLevel = 'user' | 'technical' | 'security';

export interface AppError {
  userMessage: string;
  technicalMessage: string;
  code: string;
  level: ErrorLevel;
  timestamp?: number;
}

/**
 * Catálogo de erros de autenticação
 */
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: {
    userMessage: "Email ou senha incorretos",
    technicalMessage: "Invalid credentials provided",
    code: "AUTH001",
    level: 'user' as ErrorLevel
  },
  ACCOUNT_LOCKED: {
    userMessage: "Sua conta foi bloqueada temporariamente devido a múltiplas tentativas. Tente novamente em alguns minutos",
    technicalMessage: "Account locked due to multiple failed attempts",
    code: "AUTH002",
    level: 'security' as ErrorLevel
  },
  SESSION_EXPIRED: {
    userMessage: "Sua sessão expirou. Por favor, faça login novamente",
    technicalMessage: "Session expired or invalid",
    code: "AUTH003",
    level: 'user' as ErrorLevel
  },
  EMAIL_NOT_VERIFIED: {
    userMessage: "Por favor, verifique seu email antes de fazer login",
    technicalMessage: "Email not verified",
    code: "AUTH004",
    level: 'user' as ErrorLevel
  },
  PASSWORD_TOO_WEAK: {
    userMessage: "A senha não atende aos requisitos mínimos de segurança",
    technicalMessage: "Password does not meet security requirements",
    code: "AUTH005",
    level: 'user' as ErrorLevel
  },
  INVALID_EMAIL: {
    userMessage: "Por favor, insira um email válido",
    technicalMessage: "Invalid email format",
    code: "AUTH006",
    level: 'user' as ErrorLevel
  },
  CAPTCHA_REQUIRED: {
    userMessage: "Por favor, complete a verificação de segurança",
    technicalMessage: "CAPTCHA verification required",
    code: "AUTH007",
    level: 'security' as ErrorLevel
  },
  CAPTCHA_FAILED: {
    userMessage: "Falha na verificação de segurança. Tente novamente",
    technicalMessage: "CAPTCHA verification failed",
    code: "AUTH008",
    level: 'security' as ErrorLevel
  },
  TOO_MANY_REQUESTS: {
    userMessage: "Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente",
    technicalMessage: "Rate limit exceeded",
    code: "AUTH009",
    level: 'security' as ErrorLevel
  },
  NETWORK_ERROR: {
    userMessage: "Erro de conexão. Verifique sua internet e tente novamente",
    technicalMessage: "Network connection error",
    code: "AUTH010",
    level: 'technical' as ErrorLevel
  },
  UNKNOWN_ERROR: {
    userMessage: "Ocorreu um erro inesperado. Por favor, tente novamente mais tarde",
    technicalMessage: "Unknown error occurred",
    code: "AUTH999",
    level: 'technical' as ErrorLevel
  }
} as const;

/**
 * Catálogo de erros de validação
 */
export const VALIDATION_ERRORS = {
  REQUIRED_FIELD: {
    userMessage: "Este campo é obrigatório",
    technicalMessage: "Required field missing",
    code: "VAL001",
    level: 'user' as ErrorLevel
  },
  INVALID_FORMAT: {
    userMessage: "Formato inválido",
    technicalMessage: "Invalid data format",
    code: "VAL002",
    level: 'user' as ErrorLevel
  },
  MIN_LENGTH: {
    userMessage: "O valor é muito curto",
    technicalMessage: "Value does not meet minimum length",
    code: "VAL003",
    level: 'user' as ErrorLevel
  },
  MAX_LENGTH: {
    userMessage: "O valor é muito longo",
    technicalMessage: "Value exceeds maximum length",
    code: "VAL004",
    level: 'user' as ErrorLevel
  }
} as const;

/**
 * Configuração de timing protection
 */
const TIMING_CONFIG = {
  MIN_DURATION: 1000, // 1 segundo mínimo para operações sensíveis
  MAX_RANDOM_DELAY: 500, // 0-500ms de delay aleatório adicional
  LOCKOUT_THRESHOLD: 3, // Número de tentativas antes de exigir CAPTCHA
  LOCKOUT_DURATION: 5 * 60 * 1000, // 5 minutos de bloqueio
};

/**
 * Armazena tentativas de login por IP/email
 */
interface LoginAttempt {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  locked: boolean;
}

const loginAttempts = new Map<string, LoginAttempt>();

/**
 * Garante um delay mínimo para prevenir ataques de timing
 */
export async function ensureMinimumDelay(startTime: number, minDuration: number = TIMING_CONFIG.MIN_DURATION): Promise<void> {
  const elapsed = Date.now() - startTime;
  if (elapsed < minDuration) {
    await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
  }
}

/**
 * Adiciona um delay aleatório para dificultar análise de timing
 */
export async function addRandomDelay(maxDelay: number = TIMING_CONFIG.MAX_RANDOM_DELAY): Promise<void> {
  const randomDelay = Math.random() * maxDelay;
  await new Promise(resolve => setTimeout(resolve, randomDelay));
}

/**
 * Wrapper de proteção de timing para operações sensíveis
 */
export async function withTimingProtection<T>(
  operation: () => Promise<T>,
  minDuration: number = TIMING_CONFIG.MIN_DURATION
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await operation();
    await ensureMinimumDelay(startTime, minDuration);
    await addRandomDelay();
    return result;
  } catch (error) {
    // Garantir o mesmo timing em caso de erro
    await ensureMinimumDelay(startTime, minDuration);
    await addRandomDelay();
    throw error;
  }
}

/**
 * Registra uma tentativa de login
 */
export function recordLoginAttempt(identifier: string): void {
  const now = Date.now();
  const attempt = loginAttempts.get(identifier);

  if (!attempt) {
    loginAttempts.set(identifier, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
      locked: false
    });
    return;
  }

  // Se passou o tempo de lockout, resetar
  if (attempt.locked && (now - attempt.lastAttempt) > TIMING_CONFIG.LOCKOUT_DURATION) {
    loginAttempts.set(identifier, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
      locked: false
    });
    return;
  }

  // Incrementar contador
  attempt.count++;
  attempt.lastAttempt = now;

  // Bloquear se excedeu o limite
  if (attempt.count >= TIMING_CONFIG.LOCKOUT_THRESHOLD) {
    attempt.locked = true;
    logger.warn(`Login attempts threshold reached for identifier: ${identifier.substring(0, 10)}...`);
  }

  loginAttempts.set(identifier, attempt);
}

/**
 * Verifica se um identificador está bloqueado
 */
export function isLocked(identifier: string): boolean {
  const attempt = loginAttempts.get(identifier);
  
  if (!attempt) return false;

  // Se passou o tempo de lockout, desbloquear
  const now = Date.now();
  if (attempt.locked && (now - attempt.lastAttempt) > TIMING_CONFIG.LOCKOUT_DURATION) {
    loginAttempts.delete(identifier);
    return false;
  }

  return attempt.locked;
}

/**
 * Verifica se deve exigir CAPTCHA
 */
export function shouldRequireCaptcha(identifier: string): boolean {
  const attempt = loginAttempts.get(identifier);
  if (!attempt) return false;
  
  return attempt.count >= TIMING_CONFIG.LOCKOUT_THRESHOLD;
}

/**
 * Reseta as tentativas de login após sucesso
 */
export function resetLoginAttempts(identifier: string): void {
  loginAttempts.delete(identifier);
}

/**
 * Obtém tempo restante de bloqueio em minutos
 */
export function getLockoutTimeRemaining(identifier: string): number {
  const attempt = loginAttempts.get(identifier);
  if (!attempt || !attempt.locked) return 0;

  const now = Date.now();
  const elapsed = now - attempt.lastAttempt;
  const remaining = TIMING_CONFIG.LOCKOUT_DURATION - elapsed;

  return Math.ceil(remaining / 60000); // Converter para minutos
}

/**
 * Cria um erro padronizado com timestamp
 */
export function createError(errorTemplate: AppError, context?: Record<string, unknown>): AppError {
  const error: AppError = {
    ...errorTemplate,
    timestamp: Date.now()
  };

  // Log baseado no nível
  if (error.level === 'security') {
    logger.warn(`Security event: ${error.code} - ${error.technicalMessage}`, context);
  } else if (error.level === 'technical') {
    logger.error(`Technical error: ${error.code} - ${error.technicalMessage}`, context);
  }

  return error;
}

/**
 * Mapeia erros do Supabase para nosso formato
 */
export function mapSupabaseError(error: any): AppError {
  // Erros de credenciais inválidas
  if (
    error.message?.includes('Invalid login credentials') ||
    error.message?.includes('invalid_grant') ||
    error.status === 400
  ) {
    return AUTH_ERRORS.INVALID_CREDENTIALS;
  }

  // Email não verificado
  if (error.message?.includes('Email not confirmed')) {
    return AUTH_ERRORS.EMAIL_NOT_VERIFIED;
  }

  // Rate limiting
  if (error.status === 429 || error.message?.includes('rate limit')) {
    return AUTH_ERRORS.TOO_MANY_REQUESTS;
  }

  // Erros de rede
  if (
    error.message?.includes('network') ||
    error.message?.includes('fetch') ||
    error.name === 'NetworkError'
  ) {
    return AUTH_ERRORS.NETWORK_ERROR;
  }

  // Sessão expirada
  if (
    error.message?.includes('session') ||
    error.message?.includes('expired') ||
    error.message?.includes('token')
  ) {
    return AUTH_ERRORS.SESSION_EXPIRED;
  }

  // Erro desconhecido
  return AUTH_ERRORS.UNKNOWN_ERROR;
}

/**
 * Limpa tentativas antigas (garbage collection)
 * Deve ser chamado periodicamente
 */
export function cleanupOldAttempts(): void {
  const now = Date.now();
  const maxAge = TIMING_CONFIG.LOCKOUT_DURATION * 2; // 10 minutos

  for (const [identifier, attempt] of loginAttempts.entries()) {
    if ((now - attempt.lastAttempt) > maxAge) {
      loginAttempts.delete(identifier);
    }
  }
}

// Limpar tentativas antigas a cada 10 minutos
if (typeof window !== 'undefined') {
  setInterval(cleanupOldAttempts, 10 * 60 * 1000);
}

