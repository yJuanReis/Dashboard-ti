/**
 * Desabilita console.log em produção para usuários não-admin
 * 
 * Este script deve ser importado no início da aplicação (main.tsx)
 * para desabilitar console.log em produção, exceto para admins.
 * 
 * IMPORTANTE: Em produção, bloqueia TODOS os logs por padrão.
 * Apenas admins podem ver logs após verificação.
 */

/* eslint-disable no-console */
// Este arquivo gerencia o console e precisa usar console internamente

import { supabase } from './supabaseClient';

// Verifica se estamos em produção
const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';

// Cache do role do usuário
let cachedIsAdmin: boolean = false; // Por padrão, assume que NÃO é admin
let cachedUserId: string | null = null;
let roleCheckInProgress: Promise<boolean> | null = null;

/**
 * Verifica se o usuário atual é admin (com cache)
 * Retorna false por padrão até verificar
 */
async function checkIsAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      cachedIsAdmin = false;
      cachedUserId = null;
      return false;
    }

    // Se o usuário mudou, limpar cache
    if (cachedUserId !== user.id) {
      cachedIsAdmin = false; // Resetar para false
      cachedUserId = user.id;
      roleCheckInProgress = null;
    }

    // Se já temos em cache e não está em verificação, retornar
    if (roleCheckInProgress === null && cachedUserId === user.id) {
      return cachedIsAdmin;
    }

    // Se já há uma verificação em andamento, aguardar
    if (roleCheckInProgress) {
      return await roleCheckInProgress;
    }

    // Iniciar nova verificação
    roleCheckInProgress = (async () => {
      try {
        // Buscar role do banco
        const { data, error } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error || !data) {
          // Se não encontrar, verificar user_metadata como fallback
          const fallbackRole = user.user_metadata?.role;
          cachedIsAdmin = fallbackRole === 'admin';
        } else {
          cachedIsAdmin = data.role === 'admin';
        }

        return cachedIsAdmin;
      } catch {
        cachedIsAdmin = false;
        return false;
      } finally {
        roleCheckInProgress = null;
      }
    })();

    return await roleCheckInProgress;
  } catch {
    cachedIsAdmin = false;
    return false;
  }
}

/**
 * Verifica se é um erro crítico de permissão/segurança que deve ser mostrado
 */
function isCriticalError(args: any[]): boolean {
  const errorMessage = args.join(' ').toLowerCase();
  const criticalKeywords = [
    'permissão',
    'permission',
    'acesso negado',
    'access denied',
    'unauthorized',
    'forbidden',
    '403',
    '401',
    'não autorizado',
    'sem permissão'
  ];
  
  return criticalKeywords.some(keyword => errorMessage.includes(keyword));
}

/**
 * Salva as funções originais do console
 */
const originalConsole = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
};

/**
 * Desabilita console em produção para não-admins
 * BLOQUEIA TUDO por padrão até verificar se é admin
 */
export function disableConsoleInProduction() {
  if (!isProduction) {
    // Em desenvolvimento, não fazer nada
    return;
  }

  // Substituir console.log - BLOQUEADO por padrão
  console.log = (...args: any[]) => {
    // Bloquear imediatamente, verificar depois
    checkIsAdmin().then((isAdmin) => {
      if (isAdmin) {
        originalConsole.log(...args);
      }
      // Se não for admin, não fazer nada (bloqueado)
    }).catch(() => {
      // Em caso de erro, não fazer log (bloqueado)
    });
  };

  // Substituir console.info - BLOQUEADO por padrão
  console.info = (...args: any[]) => {
    checkIsAdmin().then((isAdmin) => {
      if (isAdmin) {
        originalConsole.info(...args);
      }
    }).catch(() => {});
  };

  // Substituir console.debug - BLOQUEADO por padrão
  console.debug = (...args: any[]) => {
    checkIsAdmin().then((isAdmin) => {
      if (isAdmin) {
        originalConsole.debug(...args);
      }
    }).catch(() => {});
  };

  // console.warn - BLOQUEADO por padrão, exceto erros críticos
  console.warn = (...args: any[]) => {
    const isCritical = isCriticalError(args);
    
    checkIsAdmin().then((isAdmin) => {
      if (isAdmin) {
        originalConsole.warn(...args);
      } else if (isCritical) {
        // Apenas erros críticos de permissão são mostrados
        originalConsole.warn('Aviso: Você não tem permissão para realizar esta operação.');
      }
      // Se não for admin e não for crítico, não mostrar nada
    }).catch(() => {
      // Em caso de erro, não mostrar nada
    });
  };

  // console.error - BLOQUEADO por padrão, exceto erros críticos
  console.error = (...args: any[]) => {
    const isCritical = isCriticalError(args);
    
    checkIsAdmin().then((isAdmin) => {
      if (isAdmin) {
        originalConsole.error(...args);
      } else if (isCritical) {
        // Apenas erros críticos de permissão/segurança são mostrados
        originalConsole.error('Erro: Você não tem permissão para realizar esta operação ou ocorreu um erro de segurança.');
      } else {
        // Para outros erros, mostrar mensagem genérica apenas se for realmente crítico
        // (quebras de site, erros de rede, etc)
        const errorStr = args.join(' ').toLowerCase();
        const siteBreakingErrors = ['network', 'rede', 'connection', 'conexão', 'failed', 'falhou'];
        if (siteBreakingErrors.some(keyword => errorStr.includes(keyword))) {
          originalConsole.error('Ocorreu um erro. Por favor, recarregue a página ou entre em contato com o administrador.');
        }
      }
    }).catch(() => {
      // Em caso de erro na verificação, não mostrar detalhes
    });
  };
}

/**
 * Atualiza o cache do role (chamar quando usuário faz login ou role muda)
 */
export function updateAdminCache(userId: string | null, isAdmin: boolean) {
  cachedUserId = userId;
  cachedIsAdmin = isAdmin;
  roleCheckInProgress = null;
}

/**
 * Limpa o cache do role (chamar quando usuário faz logout)
 */
export function clearAdminCache() {
  cachedIsAdmin = false;
  cachedUserId = null;
  roleCheckInProgress = null;
}

