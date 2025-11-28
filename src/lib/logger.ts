/**
 * Sistema de Logging Seguro
 * 
 * Este módulo fornece funções de logging que só funcionam para usuários admin.
 * Em produção, console.log é desabilitado para usuários não-admin para evitar
 * vazamento de informações sensíveis.
 */

/* eslint-disable no-console */
// Este arquivo é o sistema de logging e precisa usar console internamente

import { supabase } from './supabaseClient';

// Cache do role do usuário para evitar múltiplas consultas
let cachedUserRole: string | null = null;
let cachedUserId: string | null = null;
let roleCheckPromise: Promise<boolean> | null = null;

/**
 * Verifica se o usuário atual é admin
 * Usa cache para evitar múltiplas consultas ao banco
 */
async function isAdmin(): Promise<boolean> {
  try {
    // Obter usuário atual do Supabase Auth
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    // Se o usuário mudou, limpar cache
    if (cachedUserId !== user.id) {
      cachedUserRole = null;
      cachedUserId = user.id;
      roleCheckPromise = null;
    }

    // Se já temos o role em cache, usar
    if (cachedUserRole !== null) {
      return cachedUserRole === 'admin';
    }

    // Se já há uma verificação em andamento, aguardar
    if (roleCheckPromise) {
      return await roleCheckPromise;
    }

    // Iniciar nova verificação
    roleCheckPromise = (async () => {
      try {
        // Buscar role do banco de dados
        const { data, error } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error || !data) {
          // Se não encontrar, verificar user_metadata como fallback
          const fallbackRole = user.user_metadata?.role;
          cachedUserRole = fallbackRole || 'user';
          return cachedUserRole === 'admin';
        }

        // Cachear o role
        cachedUserRole = data.role || 'user';
        return cachedUserRole === 'admin';
      } catch (error) {
        // Em caso de erro, assumir que não é admin
        cachedUserRole = 'user';
        return false;
      } finally {
        roleCheckPromise = null;
      }
    })();

    return await roleCheckPromise;
  } catch (error) {
    // Em caso de erro, assumir que não é admin
    return false;
  }
}

/**
 * Limpa o cache do role (útil quando o usuário faz logout ou muda de role)
 */
export function clearRoleCache(): void {
  cachedUserRole = null;
  cachedUserId = null;
  roleCheckPromise = null;
}

/**
 * Verifica se estamos em ambiente de desenvolvimento
 */
function isDevelopment(): boolean {
  return import.meta.env.DEV || import.meta.env.MODE === 'development';
}

/**
 * Logger seguro que só funciona para admins
 * As funções são síncronas na interface, mas verificam o role de forma assíncrona
 */
class SecureLogger {
  log(...args: any[]): void {
    // Verificar de forma assíncrona, mas não bloquear
    isAdmin().then((isAdminUser) => {
      if (isDevelopment() || isAdminUser) {
        console.log(...args);
      }
    }).catch(() => {
      // Em caso de erro, não fazer log
    });
  }

  info(...args: any[]): void {
    isAdmin().then((isAdminUser) => {
      if (isDevelopment() || isAdminUser) {
        console.info(...args);
      }
    }).catch(() => {});
  }

  warn(...args: any[]): void {
    isAdmin().then((isAdminUser) => {
      if (isDevelopment() || isAdminUser) {
        console.warn(...args);
      }
    }).catch(() => {});
  }

  error(...args: any[]): void {
    // Erros sempre são logados, mas em produção só mostram detalhes para admins
    isAdmin().then((isAdminUser) => {
      if (isDevelopment() || isAdminUser) {
        console.error(...args);
      } else {
        // Para não-admins em produção, logar apenas uma mensagem genérica
        console.error('Ocorreu um erro. Entre em contato com o administrador.');
      }
    }).catch(() => {
      // Em caso de erro na verificação, mostrar mensagem genérica
      console.error('Ocorreu um erro. Entre em contato com o administrador.');
    });
  }

  debug(...args: any[]): void {
    isAdmin().then((isAdminUser) => {
      if (isDevelopment() || isAdminUser) {
        console.debug(...args);
      }
    }).catch(() => {});
  }
}

// Exportar instância única do logger
export const logger = new SecureLogger();

// Exportar funções de conveniência (síncronas para uso fácil)
export const log = (...args: any[]) => logger.log(...args);
export const logInfo = (...args: any[]) => logger.info(...args);
export const logWarn = (...args: any[]) => logger.warn(...args);
export const logError = (...args: any[]) => logger.error(...args);
export const logDebug = (...args: any[]) => logger.debug(...args);

