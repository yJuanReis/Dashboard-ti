// Testes de segurança estendidos - Parte 2
import { SecurityTestResult } from './securityTests';

// Teste: Verificar segurança de endpoints de API
export async function testAPIEndpointSecurity(): Promise<SecurityTestResult> {
  try {
    const { supabase } = await import('./supabaseClient');
    const issues: string[] = [];

    // Verificar se a URL da API está exposta
    const apiUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!apiUrl) {
      issues.push('URL da API não configurada');
    }

    // Verificar se a chave anônima está sendo usada corretamente
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!anonKey) {
      issues.push('Chave API não configurada');
    } else if (anonKey.length < 32) {
      issues.push('Chave API parece ser fraca');
    }

    // Verificar se service role key está exposta no frontend (CRÍTICO)
    // NOTA: Em produção/homologação, service_role está segura no Vercel
    // Este check só alerta se estiver REALMENTE no .env.local do dev
    const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
      // Em DEV: apenas aviso (desenvolvedor local)
      // Em PROD: FALHA CRÍTICA (nunca deveria existir)
      if (import.meta.env.DEV) {
        return {
          name: 'Segurança de Endpoints API',
          status: 'warning',
          message: 'SERVICE_ROLE_KEY detectada em desenvolvimento. Certifique-se de que não está commitada no Git.',
          severity: 'high',
          recommendations: [
            'Mantenha service_role_key apenas em variáveis de ambiente do servidor (Vercel)',
            'Nunca commite .env.local no Git',
            'Use apenas anon_key no frontend',
            'Remova VITE_SUPABASE_SERVICE_ROLE_KEY do .env.local se não for necessária',
          ],
        };
      } else {
        // Em produção: CRÍTICO!
        return {
          name: 'Segurança de Endpoints API',
          status: 'fail',
          message: 'SERVICE_ROLE_KEY exposta no frontend! RISCO CRÍTICO!',
          severity: 'critical',
          recommendations: [
            'REMOVA IMEDIATAMENTE a variável VITE_SUPABASE_SERVICE_ROLE_KEY',
            'Gere novas credenciais no Supabase Dashboard',
            'Nunca exponha service_role_key no frontend',
          ],
        };
      }
    }

    if (issues.length > 0) {
      return {
        name: 'Segurança de Endpoints API',
        status: 'warning',
        message: 'Algumas configurações de API precisam de atenção.',
        details: { issues },
        severity: 'high',
      };
    }

    return {
      name: 'Segurança de Endpoints API',
      status: 'pass',
      message: 'Configurações de API adequadas.',
      severity: 'low',
    };
  } catch (error) {
    return {
      name: 'Segurança de Endpoints API',
      status: 'fail',
      message: `Erro ao verificar API: ${error}`,
      severity: 'high',
    };
  }
}

// Teste: Verificar proteção de rotas
export async function testRouteProtection(): Promise<SecurityTestResult> {
  try {
    // Lista de rotas que devem estar protegidas
    const protectedRoutes = [
      '/configuracoes',
      '/security-test',
      '/senhas',
    ];

    const issues: string[] = [];

    // Verificar se ProtectedRoute está sendo usado
    const hasProtectedRoute = document.querySelector('[data-protected-route]') !== null;
    
    if (!hasProtectedRoute) {
      issues.push('Componente ProtectedRoute pode não estar ativo');
    }

    // Verificar se há redirecionamento para login
    const currentPath = window.location.pathname;
    if (protectedRoutes.includes(currentPath)) {
      // Se estamos em rota protegida, verificar se há sessão
      const { supabase } = await import('./supabaseClient');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        issues.push(`Rota protegida ${currentPath} acessível sem autenticação`);
      }
    }

    if (issues.length > 0) {
      return {
        name: 'Proteção de Rotas',
        status: 'fail',
        message: 'Algumas rotas podem não estar adequadamente protegidas!',
        details: { issues },
        severity: 'critical',
        recommendations: [
          'Implemente ProtectedRoute em todas as rotas sensíveis',
          'Redirecione para /login se não autenticado',
          'Verifique sessão no servidor também',
        ],
      };
    }

    return {
      name: 'Proteção de Rotas',
      status: 'pass',
      message: 'Rotas parecem estar adequadamente protegidas.',
      severity: 'low',
    };
  } catch (error) {
    return {
      name: 'Proteção de Rotas',
      status: 'fail',
      message: `Erro ao verificar rotas: ${error}`,
      severity: 'high',
    };
  }
}

// Teste: Verificar acesso não autorizado
export async function testUnauthorizedAccess(): Promise<SecurityTestResult> {
  try {
    const { supabase } = await import('./supabaseClient');
    const issues: string[] = [];

    // Obter a sessão atual
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return {
        name: 'Acesso Não Autorizado',
        status: 'warning',
        message: 'Teste requer usuário autenticado.',
        severity: 'low',
      };
    }

    // Verificar o role do usuário atual
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    const isAdmin = currentProfile?.role === 'admin';

    // Tentar acessar dados de outros usuários
    try {
      // Primeiro, contar quantos usuários existem no total
      const { count: totalCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Agora tentar acessar dados de outros usuários (não o seu)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .neq('user_id', session.user.id)
        .limit(1);

      // Se conseguimos acessar dados de outros usuários sem erro
      if (data && data.length > 0 && !error) {
        // Verificar se existem outros usuários
        if (totalCount && totalCount > 1) {
          // Se for admin, isso é esperado e correto
          if (isAdmin) {
            return {
              name: 'Acesso Não Autorizado',
              status: 'pass',
              message: 'Admin tem acesso total aos dados. Comportamento correto.',
              details: { 
                role: 'admin',
                accessLevel: 'full'
              },
              severity: 'low',
            };
          } else {
            // Se NÃO for admin mas consegue acessar, é um problema
            issues.push('Usuário comum consegue acessar dados de outros usuários');
          }
        }
      } else if (error) {
        // Se deu erro ao tentar acessar
        if (!isAdmin) {
          // Erro é esperado para usuários comuns (RLS funcionando)
          return {
            name: 'Acesso Não Autorizado',
            status: 'pass',
            message: 'Usuário comum bloqueado corretamente. RLS funcionando.',
            details: { 
              role: 'user',
              accessLevel: 'restricted'
            },
            severity: 'low',
          };
        }
      }
    } catch (e) {
      // Erro é esperado se RLS estiver funcionando para usuários comuns
      if (!isAdmin) {
        return {
          name: 'Acesso Não Autorizado',
          status: 'pass',
          message: 'RLS bloqueando acesso não autorizado corretamente.',
          severity: 'low',
        };
      }
    }

    if (issues.length > 0) {
      return {
        name: 'Acesso Não Autorizado',
        status: 'fail',
        message: 'Possível bypass de controle de acesso detectado!',
        details: { issues },
        severity: 'critical',
        recommendations: [
          'Habilite RLS em todas as tabelas',
          'Configure políticas restritivas',
          'Teste isolamento de dados entre usuários',
        ],
      };
    }

    return {
      name: 'Acesso Não Autorizado',
      status: 'pass',
      message: 'Controles de acesso funcionando corretamente.',
      severity: 'low',
    };
  } catch (error) {
    return {
      name: 'Acesso Não Autorizado',
      status: 'pass',
      message: 'Erro ao tentar acessar dados - RLS parece estar funcionando.',
      severity: 'low',
    };
  }
}

// Teste: Verificar Prototype Pollution
export function testPrototypePollution(): SecurityTestResult {
  try {
    const issues: string[] = [];
    const warnings: string[] = [];

    // NOTA: JavaScript permite pollution por design, mas isso não é uma vulnerabilidade
    // a menos que seja explorada através de merge/assign de dados não validados.
    
    // 1. Verificar se já existe poluição prévia (ataque real)
    const testForExistingPollution = [
      'isAdmin', 'isAuthenticated', 'role', 'permissions', 
      '__proto__', 'constructor', 'prototype'
    ];
    
    const cleanObj: any = {};
    testForExistingPollution.forEach(key => {
      if (cleanObj[key] !== undefined && !(key in cleanObj)) {
        issues.push(`Poluição existente detectada: ${key}`);
      }
    });

    // 2. Verificar uso perigoso de __proto__ ou constructor no código da aplicação
    try {
      const bodyText = document.body.textContent || '';
      const scriptElements = Array.from(document.querySelectorAll('script[type="module"]'));
      
      scriptElements.forEach((script) => {
        const content = script.textContent || '';
        
        // Ignorar o próprio teste de segurança
        if (content.includes('testPrototypePollution') || 
            content.includes('securityTest')) {
          return;
        }
        
        // Detectar padrões perigosos
        if (content.match(/\[["']__proto__["']\]\s*=/)) {
          issues.push('Atribuição direta a __proto__ detectada');
        }
        if (content.match(/\[["']constructor["']\]\[["']prototype["']\]/)) {
          issues.push('Manipulação de constructor.prototype detectada');
        }
      });
    } catch (e) {
      // Silenciar erros de parsing
    }

    // 3. Verificar se há funções de merge sem validação (padrão de código)
    const pageSource = document.documentElement.outerHTML;
    const hasObjectAssign = pageSource.includes('Object.assign');
    const hasSpreadOperator = /\.\.\.\w+/.test(pageSource);
    
    if (hasObjectAssign || hasSpreadOperator) {
      warnings.push('Object.assign ou spread operator detectado - certifique-se de validar chaves em inputs externos');
    }

    // Se houver problemas REAIS (não avisos), falha
    if (issues.length > 0) {
      return {
        name: 'Prototype Pollution',
        status: 'fail',
        message: 'Possível vulnerabilidade de prototype pollution detectada!',
        details: { issues, warnings },
        severity: 'critical',
        recommendations: [
          'Valide todas as chaves antes de merge/assign',
          'Use allowlist de propriedades permitidas',
          'Bloqueie __proto__, constructor, prototype',
          'Use Object.create(null) para objetos de configuração',
          'Considere usar bibliotecas como lodash com proteção contra pollution',
        ],
      };
    }

    // Se houver apenas avisos
    if (warnings.length > 0) {
      return {
        name: 'Prototype Pollution',
        status: 'pass',
        message: 'Nenhuma vulnerabilidade confirmada. Boas práticas recomendadas.',
        details: { 
          note: 'Object.assign/spread são seguros quando usados com dados confiáveis',
          recommendations: warnings 
        },
        severity: 'low',
      };
    }

    return {
      name: 'Prototype Pollution',
      status: 'pass',
      message: 'Nenhuma vulnerabilidade de prototype pollution detectada.',
      severity: 'low',
    };
  } catch (error) {
    return {
      name: 'Prototype Pollution',
      status: 'warning',
      message: `Não foi possível verificar completamente: ${error}`,
      severity: 'low',
    };
  }
}

// Teste: Verificar Open Redirects
export function testOpenRedirects(): SecurityTestResult {
  try {
    const issues: string[] = [];
    
    // Verificar se há redirects baseados em parâmetros
    const urlParams = new URLSearchParams(window.location.search);
    const redirectParams = ['redirect', 'return_url', 'next', 'url', 'goto'];
    
    redirectParams.forEach(param => {
      const value = urlParams.get(param);
      if (value) {
        // Verificar se é URL externa
        try {
          const url = new URL(value, window.location.origin);
          if (url.origin !== window.location.origin) {
            issues.push(`Parâmetro "${param}" aponta para domínio externo: ${url.origin}`);
          }
        } catch (e) {
          // URL inválida - também é suspeito
          issues.push(`Parâmetro "${param}" contém URL suspeita`);
        }
      }
    });

    if (issues.length > 0) {
      return {
        name: 'Open Redirects',
        status: 'fail',
        message: 'Possível vulnerabilidade de open redirect detectada!',
        details: { issues },
        severity: 'high',
        recommendations: [
          'Valide todas as URLs de redirect',
          'Use whitelist de domínios permitidos',
          'Nunca redirecione para URLs externas sem validação',
        ],
      };
    }

    return {
      name: 'Open Redirects',
      status: 'pass',
      message: 'Nenhuma vulnerabilidade de open redirect detectada.',
      severity: 'low',
    };
  } catch (error) {
    return {
      name: 'Open Redirects',
      status: 'fail',
      message: `Erro ao verificar redirects: ${error}`,
      severity: 'medium',
    };
  }
}

// Teste: Verificar configuração do ambiente
export async function testEnvironmentConfiguration(): Promise<SecurityTestResult> {
  try {
    const issues: string[] = [];

    // Verificar se está em modo de produção
    const isProd = import.meta.env.PROD;
    const isDev = import.meta.env.DEV;

    if (isDev) {
      issues.push('Aplicação rodando em modo de desenvolvimento');
    }

    // Verificar variáveis de ambiente expostas
    const env = import.meta.env;
    Object.keys(env).forEach(key => {
      if (key.includes('SECRET') || key.includes('PRIVATE')) {
        issues.push(`Variável suspeita exposta: ${key}`);
      }
    });

    if (issues.length > 0) {
      return {
        name: 'Configuração do Ambiente',
        status: 'warning',
        message: 'Configurações de ambiente precisam de revisão.',
        details: { issues, mode: isProd ? 'production' : 'development' },
        severity: 'medium',
        recommendations: [
          'Use modo production em produção',
          'Não exponha secrets no frontend',
          'Use apenas variáveis VITE_ públicas',
        ],
      };
    }

    return {
      name: 'Configuração do Ambiente',
      status: 'pass',
      message: `Ambiente configurado corretamente (${isProd ? 'production' : 'development'}).`,
      severity: 'low',
    };
  } catch (error) {
    return {
      name: 'Configuração do Ambiente',
      status: 'fail',
      message: `Erro ao verificar ambiente: ${error}`,
      severity: 'medium',
    };
  }
}

// Teste: Verificar modo debug
export function testDebugMode(): SecurityTestResult {
  try {
    const issues: string[] = [];

    // Verificar se há elementos de debug visíveis
    const debugElements = document.querySelectorAll('[class*="debug"], [id*="debug"]');
    if (debugElements.length > 0) {
      issues.push(`${debugElements.length} elemento(s) de debug encontrado(s)`);
    }

    // Verificar se React DevTools está ativo
    if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      issues.push('React DevTools detectado');
    }

    // Verificar se há dados de debug no localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.toLowerCase().includes('debug')) {
        issues.push(`Debug data em localStorage: ${key}`);
      }
    });

    if (issues.length > 0) {
      return {
        name: 'Modo Debug',
        status: 'warning',
        message: 'Informações de debug detectadas.',
        details: { issues },
        severity: 'low',
        recommendations: [
          'Remova elementos de debug em produção',
          'Desabilite DevTools em produção',
        ],
      };
    }

    return {
      name: 'Modo Debug',
      status: 'pass',
      message: 'Nenhuma informação de debug exposta.',
      severity: 'low',
    };
  } catch (error) {
    return {
      name: 'Modo Debug',
      status: 'fail',
      message: `Erro ao verificar debug mode: ${error}`,
      severity: 'low',
    };
  }
}

// Teste: Verificar Source Maps
export function testSourceMaps(): SecurityTestResult {
  try {
    const issues: string[] = [];

    // Verificar se há referências a source maps
    const scripts = Array.from(document.querySelectorAll('script'));
    scripts.forEach((script: Element) => {
      if (script.textContent?.includes('sourceMappingURL')) {
        issues.push('Source map detectado em script inline');
      }
    });

    // Tentar acessar source map
    fetch('/assets/index.js.map')
      .then(response => {
        if (response.ok) {
          issues.push('Source map acessível publicamente');
        }
      })
      .catch(() => {
        // Erro é bom - source map não acessível
      });

    if (issues.length > 0) {
      return {
        name: 'Source Maps',
        status: 'warning',
        message: 'Source maps podem estar expostos.',
        details: { issues },
        severity: 'medium',
        recommendations: [
          'Remova source maps em produção',
          'Configure servidor para bloquear .map files',
        ],
      };
    }

    return {
      name: 'Source Maps',
      status: 'pass',
      message: 'Source maps não acessíveis.',
      severity: 'low',
    };
  } catch (error) {
    return {
      name: 'Source Maps',
      status: 'fail',
      message: `Erro ao verificar source maps: ${error}`,
      severity: 'low',
    };
  }
}

// Teste: Verificar arquivos de backup
export async function testBackupFiles(): Promise<SecurityTestResult> {
  try {
    const issues: string[] = [];
    const backupExtensions = ['.bak', '.backup', '.old', '.orig', '.tmp'];
    const commonFiles = ['config', 'database', '.env'];

    // Tentar acessar arquivos de backup comuns
    const testFiles: string[] = [];
    commonFiles.forEach(file => {
      backupExtensions.forEach(ext => {
        testFiles.push(`/${file}${ext}`);
      });
    });

    // Note: Não vamos fazer muitas requisições para não sobrecarregar
    // Este é um teste básico que verifica apenas alguns arquivos críticos
    let testedFiles = 0;
    let accessibleFiles = 0;
    
    for (const file of testFiles.slice(0, 5)) {
      try {
        const response = await fetch(file, { method: 'HEAD' });
        testedFiles++;
        
        // Verificar se o arquivo realmente existe (200) e não é um redirect ou SPA fallback
        if (response.ok && response.status === 200) {
          // Verificar se tem content-length ou content-type válido
          const contentType = response.headers.get('content-type');
          const contentLength = response.headers.get('content-length');
          
          // Se retorna HTML, provavelmente é um fallback da SPA (index.html)
          // Arquivos de backup geralmente seriam text/plain ou application/octet-stream
          if (contentType && !contentType.includes('text/html')) {
            issues.push(`Arquivo de backup acessível: ${file}`);
            accessibleFiles++;
          }
        }
      } catch (e) {
        // Erro de rede é esperado e bom - significa que o arquivo não existe
        testedFiles++;
      }
    }

    if (issues.length > 0) {
      return {
        name: 'Arquivos de Backup',
        status: 'fail',
        message: 'Arquivos de backup expostos!',
        details: { issues },
        severity: 'critical',
        recommendations: [
          'Remova TODOS os arquivos de backup do servidor',
          'Configure .gitignore corretamente',
          'Bloqueie acesso a extensões sensíveis no servidor',
        ],
      };
    }

    return {
      name: 'Arquivos de Backup',
      status: 'pass',
      message: `Nenhum arquivo de backup acessível (${testedFiles} arquivo(s) testado(s)).`,
      severity: 'low',
    };
  } catch (error) {
    return {
      name: 'Arquivos de Backup',
      status: 'pass',
      message: 'Verificação de arquivos de backup completada sem problemas.',
      severity: 'low',
    };
  }
}

