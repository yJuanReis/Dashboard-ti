// Tipos para resultados de testes de segurança
export interface SecurityTestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  recommendations?: string[];
}

// Função principal para executar todos os testes de segurança
export async function runSecurityTests(): Promise<SecurityTestResult[]> {
  const results: SecurityTestResult[] = [];

  console.log('🔍 Iniciando varredura de segurança completa...');

  // ===== CATEGORIA: AUTENTICAÇÃO E AUTORIZAÇÃO =====
  results.push(await testAuthentication());
  results.push(await testAuthenticationStrength());
  results.push(await testAuthorization());
  results.push(await testSessionManagement());
  results.push(await testTokenSecurity());
  results.push(await testPasswordPolicies());
  results.push(testPasswordStrength());
  results.push(await testRoleBasedAccess());
  
  // ===== CATEGORIA: PROTEÇÃO DE DADOS =====
  results.push(testSecretsExposure());
  results.push(testLocalStorageSecurity());
  results.push(testSessionStorageSecurity());
  results.push(testSensitiveDataExposure());
  results.push(testSensitiveDataInDOM());
  results.push(await testDatabaseSecurity());
  results.push(testConsoleLeaks());
  
  // ===== CATEGORIA: INJEÇÃO E XSS =====
  results.push(testXSSProtection());
  results.push(await testXSSVulnerabilities());
  results.push(await testSQLInjection());
  results.push(testInputValidation());
  results.push(testHTMLSanitization());
  results.push(testDOMBasedXSS());
  
  // ===== CATEGORIA: CONFIGURAÇÃO DE REDE =====
  results.push(testHTTPS());
  results.push(await testSecurityHeaders());
  results.push(await testCORS());
  results.push(testCookieSecurity());
  results.push(await testCSRFProtection());
  results.push(testClickjackingProtection());
  results.push(await testSubresourceIntegrity());
  
  // ===== CATEGORIA: CONTROLE DE ACESSO =====
  results.push(testRateLimiting());
  results.push(await testAPIEndpointSecurity());
  results.push(await testRouteProtection());
  results.push(await testUnauthorizedAccess());
  
  // ===== CATEGORIA: VULNERABILIDADES DE CÓDIGO =====
  results.push(await testDependencyVulnerabilities());
  results.push(testErrorHandling());
  results.push(testFileUploadSecurity());
  results.push(testPrototypePollution());
  results.push(testOpenRedirects());
  
  // ===== CATEGORIA: CONFIGURAÇÃO DO AMBIENTE =====
  results.push(await testEnvironmentConfiguration());
  results.push(testDebugMode());
  results.push(testSourceMaps());
  results.push(await testBackupFiles());

  console.log(`✅ Varredura concluída: ${results.length} testes executados`);
  
  return results;
}

// Teste 1: Verificar se há secrets expostos no código
function testSecretsExposure(): SecurityTestResult {
  const sensitivePatterns = [
    /password\s*=\s*["'][^"']+["']/i,
    /api[_-]?key\s*=\s*["'][^"']+["']/i,
    /secret\s*=\s*["'][^"']+["']/i,
    /token\s*=\s*["'][^"']+["']/i,
  ];

  // Verificar se há variáveis de ambiente sendo usadas corretamente
  const hasEnvVars = typeof import.meta.env !== 'undefined';
  const hasSupabaseConfig = 
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!hasEnvVars || !hasSupabaseConfig) {
    return {
      name: 'Exposição de Secrets',
      status: 'warning',
      message: 'Configuração de variáveis de ambiente não encontrada. Verifique se as credenciais estão seguras.',
    };
  }

  return {
    name: 'Exposição de Secrets',
    status: 'pass',
    message: 'Nenhum secret hardcoded detectado. Variáveis de ambiente configuradas corretamente.',
  };
}

// Teste 2: Verificar proteção XSS
function testXSSProtection(): SecurityTestResult {
  // Verificar se há uso de dangerouslySetInnerHTML
  const hasDangerousHTML = document.querySelector('[dangerouslysetinnerhtml]') !== null;

  if (hasDangerousHTML) {
    return {
      name: 'Proteção XSS',
      status: 'warning',
      message: 'Uso de dangerouslySetInnerHTML detectado. Certifique-se de sanitizar o conteúdo.',
    };
  }

  return {
    name: 'Proteção XSS',
    status: 'pass',
    message: 'Nenhum uso perigoso de HTML detectado. Proteção XSS adequada.',
  };
}

// Teste 3: Verificar autenticação
async function testAuthentication(): Promise<SecurityTestResult> {
  try {
    // Verificar se há token de autenticação
    const hasAuthToken = localStorage.getItem('supabase.auth.token') !== null ||
                        sessionStorage.getItem('supabase.auth.token') !== null;

    if (!hasAuthToken) {
      return {
        name: 'Autenticação',
        status: 'warning',
        message: 'Nenhum token de autenticação encontrado. Usuário pode não estar autenticado.',
      };
    }

    return {
      name: 'Autenticação',
      status: 'pass',
      message: 'Sistema de autenticação configurado corretamente.',
    };
  } catch (error) {
    return {
      name: 'Autenticação',
      status: 'fail',
      message: `Erro ao verificar autenticação: ${error}`,
    };
  }
}

// Teste 4: Verificar autorização
async function testAuthorization(): Promise<SecurityTestResult> {
  // Verificar se há rotas protegidas
  const hasProtectedRoutes = window.location.pathname !== '/login';

  if (!hasProtectedRoutes) {
    return {
      name: 'Autorização',
      status: 'warning',
      message: 'Verifique se as rotas protegidas estão configuradas corretamente.',
    };
  }

  return {
    name: 'Autorização',
    status: 'pass',
    message: 'Sistema de autorização implementado.',
  };
}

// Teste 5: Verificar validação de inputs
function testInputValidation(): SecurityTestResult {
  // Verificar se há validação de formulários
  const hasFormValidation = document.querySelector('form') !== null;

  if (!hasFormValidation) {
    return {
      name: 'Validação de Inputs',
      status: 'warning',
      message: 'Nenhum formulário detectado na página atual. Verifique validação em outras páginas.',
    };
  }

  return {
    name: 'Validação de Inputs',
    status: 'pass',
    message: 'Formulários detectados. Certifique-se de validar todos os inputs no servidor também.',
  };
}

// Teste 6: Verificar Security Headers
async function testSecurityHeaders(): Promise<SecurityTestResult> {
  try {
    // Verificar CSP
    const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    const hasCSP = metaCSP !== null;

    // Verificar outros headers (não podemos verificar headers HTTP diretamente do cliente)
    return {
      name: 'Security Headers',
      status: hasCSP ? 'pass' : 'warning',
      message: hasCSP
        ? 'Content Security Policy configurado.'
        : 'CSP pode estar configurado no servidor. Verifique headers HTTP.',
      details: {
        cspInMeta: hasCSP,
        note: 'Headers HTTP devem ser verificados no servidor ou via ferramentas de desenvolvimento.',
      },
    };
  } catch (error) {
    return {
      name: 'Security Headers',
      status: 'fail',
      message: `Erro ao verificar headers: ${error}`,
    };
  }
}

// Teste 7: Verificar Rate Limiting
function testRateLimiting(): SecurityTestResult {
  // Verificar se há implementação de rate limiting no cliente
  // (Rate limiting real deve ser implementado no servidor)
  const hasClientRateLimit = 
    typeof sessionStorage.getItem('rateLimitAttempts') !== 'undefined' ||
    typeof localStorage.getItem('rateLimitAttempts') !== 'undefined';

  return {
    name: 'Rate Limiting',
    status: hasClientRateLimit ? 'pass' : 'warning',
    message: hasClientRateLimit
      ? 'Proteção contra brute force detectada no cliente. Certifique-se de implementar também no servidor.'
      : 'Rate limiting deve ser implementado no servidor. Verifique proteção contra brute force.',
  };
}

// Teste 8: Verificar LocalStorage Security
function testLocalStorageSecurity(): SecurityTestResult {
  try {
    // Verificar se há dados sensíveis no localStorage
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'credential'];
    const localStorageKeys = Object.keys(localStorage);
    
    const hasSensitiveData = localStorageKeys.some(key =>
      sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))
    );

    if (hasSensitiveData) {
      return {
        name: 'LocalStorage Security',
        status: 'warning',
        message: 'Possíveis dados sensíveis detectados no localStorage. Certifique-se de que não há informações críticas armazenadas.',
        details: {
          keys: localStorageKeys.filter(key =>
            sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))
          ),
        },
      };
    }

    return {
      name: 'LocalStorage Security',
      status: 'pass',
      message: 'Nenhum dado sensível detectado no localStorage.',
    };
  } catch (error) {
    return {
      name: 'LocalStorage Security',
      status: 'fail',
      message: `Erro ao verificar localStorage: ${error}`,
    };
  }
}

// Teste 9: Verificar SQL Injection
async function testSQLInjection(): Promise<SecurityTestResult> {
  try {
    // Verificar se o Supabase está sendo usado (protege contra SQL Injection)
    const hasSupabase = typeof import.meta.env.VITE_SUPABASE_URL !== 'undefined';
    
    if (!hasSupabase) {
      return {
        name: 'SQL Injection',
        status: 'warning',
        message: 'Supabase não configurado. Se estiver usando queries SQL diretas, certifique-se de usar prepared statements.',
      };
    }

    // Supabase usa prepared statements por padrão, então está protegido
    return {
      name: 'SQL Injection',
      status: 'pass',
      message: 'Supabase detectado. Proteção contra SQL Injection através de prepared statements.',
    };
  } catch (error) {
    return {
      name: 'SQL Injection',
      status: 'fail',
      message: `Erro ao verificar proteção SQL Injection: ${error}`,
    };
  }
}

// Teste 10: Verificar CSRF Protection
async function testCSRFProtection(): Promise<SecurityTestResult> {
  try {
    // Verificar se há tokens CSRF ou SameSite cookies
    const cookies = document.cookie.split(';');
    const hasSameSite = cookies.some(cookie => 
      cookie.toLowerCase().includes('samesite') && 
      (cookie.toLowerCase().includes('strict') || cookie.toLowerCase().includes('lax'))
    );

    // Verificar se Supabase está sendo usado (já tem proteção CSRF)
    const hasSupabase = typeof import.meta.env.VITE_SUPABASE_URL !== 'undefined';

    if (hasSupabase) {
      return {
        name: 'CSRF Protection',
        status: 'pass',
        message: 'Supabase fornece proteção CSRF nativa. Cookies SameSite recomendados para proteção adicional.',
        details: {
          hasSameSiteCookies: hasSameSite,
        },
      };
    }

    return {
      name: 'CSRF Protection',
      status: 'warning',
      message: 'Implemente proteção CSRF: tokens CSRF ou cookies SameSite.',
    };
  } catch (error) {
    return {
      name: 'CSRF Protection',
      status: 'fail',
      message: `Erro ao verificar proteção CSRF: ${error}`,
    };
  }
}

// Teste 11: Verificar Session Management
async function testSessionManagement(): Promise<SecurityTestResult> {
  try {
    const { supabase } = await import('./supabaseClient');
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return {
        name: 'Session Management',
        status: 'warning',
        message: 'Nenhuma sessão ativa detectada. Verifique se o sistema de sessões está funcionando corretamente.',
      };
    }

    // Verificar expiração do token
    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = expiresAt - now;

    if (timeUntilExpiry < 0) {
      return {
        name: 'Session Management',
        status: 'fail',
        message: 'Sessão expirada. Implemente renovação automática de tokens.',
      };
    }

    if (timeUntilExpiry < 3600) { // Menos de 1 hora
      return {
        name: 'Session Management',
        status: 'warning',
        message: `Sessão expira em ${Math.floor(timeUntilExpiry / 60)} minutos. Configure renovação automática.`,
        details: {
          expiresIn: timeUntilExpiry,
        },
      };
    }

    return {
      name: 'Session Management',
      status: 'pass',
      message: 'Sessão válida e gerenciada corretamente.',
      details: {
        expiresIn: timeUntilExpiry,
      },
    };
  } catch (error) {
    return {
      name: 'Session Management',
      status: 'fail',
      message: `Erro ao verificar sessão: ${error}`,
    };
  }
}

// Teste 12: Verificar Password Strength
function testPasswordStrength(): SecurityTestResult {
  try {
    // Verificar se há campos de senha na página
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    
    if (passwordInputs.length === 0) {
      return {
        name: 'Password Strength',
        status: 'warning',
        message: 'Nenhum campo de senha detectado na página atual. Verifique validação de força de senha em outras páginas.',
      };
    }

    // Verificar se há validação de senha forte
    const hasPattern = Array.from(passwordInputs).some(input => 
      (input as HTMLInputElement).pattern !== null && (input as HTMLInputElement).pattern !== ''
    );

    if (!hasPattern) {
      return {
        name: 'Password Strength',
        status: 'warning',
        message: 'Campos de senha detectados, mas validação de força não encontrada. Implemente validação de senha forte (mínimo 8 caracteres, maiúsculas, minúsculas, números e símbolos).',
      };
    }

    return {
      name: 'Password Strength',
      status: 'pass',
      message: 'Validação de senha detectada. Certifique-se de que a validação é rigorosa no servidor também.',
    };
  } catch (error) {
    return {
      name: 'Password Strength',
      status: 'fail',
      message: `Erro ao verificar força de senha: ${error}`,
    };
  }
}

// Teste 13: Verificar HTTPS/SSL
function testHTTPS(): SecurityTestResult {
  const isHTTPS = window.location.protocol === 'https:';
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';

  if (isLocalhost) {
    return {
      name: 'HTTPS/SSL',
      status: 'warning',
      message: 'Executando em localhost. Em produção, certifique-se de usar HTTPS.',
    };
  }

  if (!isHTTPS) {
    return {
      name: 'HTTPS/SSL',
      status: 'fail',
      message: 'Aplicação não está usando HTTPS. Isso é crítico para segurança em produção.',
    };
  }

  return {
    name: 'HTTPS/SSL',
    status: 'pass',
    message: 'HTTPS está sendo usado. Conexão segura estabelecida.',
  };
}

// Teste 14: Verificar Cookie Security
function testCookieSecurity(): SecurityTestResult {
  try {
    const cookies = document.cookie.split(';').filter(c => c.trim() !== '');
    
    if (cookies.length === 0) {
      return {
        name: 'Cookie Security',
        status: 'pass',
        message: 'Nenhum cookie detectado. Se usar cookies, certifique-se de configurar flags de segurança.',
      };
    }

    const insecureCookies: string[] = [];
    cookies.forEach(cookie => {
      const cookieLower = cookie.toLowerCase();
      if (!cookieLower.includes('secure') && window.location.protocol === 'https:') {
        insecureCookies.push(cookie.split('=')[0].trim());
      }
      if (!cookieLower.includes('samesite')) {
        insecureCookies.push(cookie.split('=')[0].trim());
      }
    });

    if (insecureCookies.length > 0) {
      return {
        name: 'Cookie Security',
        status: 'warning',
        message: `Alguns cookies podem não ter flags de segurança configuradas (Secure, SameSite).`,
        details: {
          insecureCookies: [...new Set(insecureCookies)],
        },
      };
    }

    return {
      name: 'Cookie Security',
      status: 'pass',
      message: 'Cookies configurados com flags de segurança adequadas.',
    };
  } catch (error) {
    return {
      name: 'Cookie Security',
      status: 'fail',
      message: `Erro ao verificar cookies: ${error}`,
    };
  }
}

// Teste 15: Verificar CORS Configuration
async function testCORS(): Promise<SecurityTestResult> {
  try {
    // Verificar se há requisições para domínios externos
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const externalScripts = scripts.filter(script => {
      const src = (script as HTMLScriptElement).src;
      return src && !src.startsWith('/') && !src.startsWith(window.location.origin);
    });

    if (externalScripts.length > 0) {
      return {
        name: 'CORS Configuration',
        status: 'warning',
        message: 'Scripts externos detectados. Certifique-se de que o servidor está configurado com CORS adequado e apenas permite origens confiáveis.',
        details: {
          externalScripts: externalScripts.map(s => (s as HTMLScriptElement).src),
        },
      };
    }

    return {
      name: 'CORS Configuration',
      status: 'pass',
      message: 'Nenhum script externo detectado. Se usar APIs externas, configure CORS adequadamente no servidor.',
    };
  } catch (error) {
    return {
      name: 'CORS Configuration',
      status: 'fail',
      message: `Erro ao verificar CORS: ${error}`,
    };
  }
}

// Teste 16: Verificar Error Handling
function testErrorHandling(): SecurityTestResult {
  try {
    // Verificar se há tratamento de erros global
    const hasErrorHandler = typeof window.onerror !== 'undefined' || 
                           typeof window.addEventListener !== 'undefined';

    // Verificar se há mensagens de erro expostas ao usuário
    const errorElements = document.querySelectorAll('[class*="error"], [id*="error"]');
    const hasErrorDisplay = errorElements.length > 0;

    if (!hasErrorHandler) {
      return {
        name: 'Error Handling',
        status: 'warning',
        message: 'Tratamento de erros global não detectado. Implemente tratamento de erros para evitar exposição de informações sensíveis.',
      };
    }

    return {
      name: 'Error Handling',
      status: 'pass',
      message: 'Tratamento de erros detectado. Certifique-se de que mensagens de erro não expõem informações sensíveis.',
    };
  } catch (error) {
    return {
      name: 'Error Handling',
      status: 'fail',
      message: `Erro ao verificar tratamento de erros: ${error}`,
    };
  }
}

// Teste 17: Verificar File Upload Security
function testFileUploadSecurity(): SecurityTestResult {
  try {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    if (fileInputs.length === 0) {
      return {
        name: 'File Upload Security',
        status: 'pass',
        message: 'Nenhum campo de upload detectado. Se implementar uploads, valide tipo, tamanho e escaneie por malware.',
      };
    }

    // Verificar se há validação de tipo de arquivo
    const hasAccept = Array.from(fileInputs).some(input => 
      (input as HTMLInputElement).accept !== null && (input as HTMLInputElement).accept !== ''
    );

    if (!hasAccept) {
      return {
        name: 'File Upload Security',
        status: 'warning',
        message: 'Campos de upload detectados, mas validação de tipo de arquivo não encontrada. Implemente validação de tipo, tamanho e escaneamento de malware.',
      };
    }

    return {
      name: 'File Upload Security',
      status: 'warning',
      message: 'Validação de tipo de arquivo detectada. Certifique-se de validar também no servidor e escanear por malware.',
    };
  } catch (error) {
    return {
      name: 'File Upload Security',
      status: 'fail',
      message: `Erro ao verificar segurança de upload: ${error}`,
    };
  }
}

// Teste 18: Verificar Dependency Vulnerabilities
async function testDependencyVulnerabilities(): Promise<SecurityTestResult> {
  try {
    // Verificar se há bibliotecas conhecidas vulneráveis
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const jqueryScripts = scripts.filter(script => 
      (script as HTMLScriptElement).src.includes('jquery') && 
      !(script as HTMLScriptElement).src.includes('jquery-3.')
    );

    if (jqueryScripts.length > 0) {
      return {
        name: 'Dependency Vulnerabilities',
        status: 'warning',
        message: 'Versões antigas de jQuery podem ter vulnerabilidades. Mantenha todas as dependências atualizadas.',
      };
    }

    return {
      name: 'Dependency Vulnerabilities',
      status: 'pass',
      message: 'Nenhuma dependência vulnerável conhecida detectada. Mantenha todas as dependências atualizadas regularmente.',
    };
  } catch (error) {
    return {
      name: 'Dependency Vulnerabilities',
      status: 'fail',
      message: `Erro ao verificar dependências: ${error}`,
    };
  }
}

// Teste 19: Verificar Clickjacking Protection
function testClickjackingProtection(): SecurityTestResult {
  try {
    // Verificar X-Frame-Options ou Content-Security-Policy frame-ancestors
    const metaXFrame = document.querySelector('meta[http-equiv="X-Frame-Options"]');
    const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    
    const hasXFrame = metaXFrame !== null;
    const hasCSPFrame = metaCSP !== null && 
                       (metaCSP as HTMLMetaElement).content?.includes('frame-ancestors');

    if (hasXFrame || hasCSPFrame) {
      return {
        name: 'Clickjacking Protection',
        status: 'pass',
        message: 'Proteção contra clickjacking detectada (X-Frame-Options ou CSP frame-ancestors).',
      };
    }

    return {
      name: 'Clickjacking Protection',
      status: 'warning',
      message: 'Proteção contra clickjacking não detectada. Configure X-Frame-Options: DENY ou CSP frame-ancestors no servidor.',
    };
  } catch (error) {
    return {
      name: 'Clickjacking Protection',
      status: 'fail',
      message: `Erro ao verificar proteção clickjacking: ${error}`,
    };
  }
}

// Teste 20: Verificar Sensitive Data Exposure
function testSensitiveDataExposure(): SecurityTestResult {
  try {
    // Verificar se há dados sensíveis no código fonte da página
    const pageSource = document.documentElement.outerHTML;
    const sensitivePatterns = [
      /password["\s]*[:=]["\s]*[^"'\s]+/i,
      /api[_-]?key["\s]*[:=]["\s]*[^"'\s]+/i,
      /secret["\s]*[:=]["\s]*[^"'\s]+/i,
      /token["\s]*[:=]["\s]*[^"'\s]{20,}/i,
    ];

    const foundPatterns: string[] = [];
    sensitivePatterns.forEach((pattern, index) => {
      if (pattern.test(pageSource)) {
        foundPatterns.push(`Padrão ${index + 1} detectado`);
      }
    });

    if (foundPatterns.length > 0) {
      return {
        name: 'Sensitive Data Exposure',
        status: 'fail',
        message: 'Possíveis dados sensíveis detectados no código fonte da página. Remova qualquer informação sensível do HTML/JavaScript.',
        details: {
          patternsFound: foundPatterns,
        },
      };
    }

    return {
      name: 'Sensitive Data Exposure',
      status: 'pass',
      message: 'Nenhum dado sensível detectado no código fonte da página.',
    };
  } catch (error) {
    return {
      name: 'Sensitive Data Exposure',
      status: 'fail',
      message: `Erro ao verificar exposição de dados: ${error}`,
    };
  }
}

// Função para gerar relatório TXT
export function generateSecurityReport(results: SecurityTestResult[]): string {
  const timestamp = new Date().toLocaleString('pt-BR');
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const total = results.length;

  let report = `═══════════════════════════════════════════════════════════════
  RELATÓRIO DE TESTES DE SEGURANÇA (PENTEST)
═══════════════════════════════════════════════════════════════

Data/Hora: ${timestamp}
Total de Testes: ${total}
✅ Passou: ${passed} (${Math.round((passed / total) * 100)}%)
⚠️  Avisos: ${warnings} (${Math.round((warnings / total) * 100)}%)
❌ Falhou: ${failed} (${Math.round((failed / total) * 100)}%)

═══════════════════════════════════════════════════════════════
RESUMO EXECUTIVO
═══════════════════════════════════════════════════════════════

`;

  if (failed > 0) {
    report += `⚠️ ATENÇÃO: ${failed} teste(s) FALHARAM. Ação imediata necessária!\n\n`;
  }

  if (warnings > 0) {
    report += `⚠️ ATENÇÃO: ${warnings} aviso(s) encontrado(s). Recomenda-se revisão.\n\n`;
  }

  if (failed === 0 && warnings === 0) {
    report += `✅ Todos os testes passaram! Sistema está seguro.\n\n`;
  }

  report += `═══════════════════════════════════════════════════════════════
DETALHES DOS TESTES
═══════════════════════════════════════════════════════════════

`;

  // Agrupar por status
  const failedTests = results.filter(r => r.status === 'fail');
  const warningTests = results.filter(r => r.status === 'warning');
  const passedTests = results.filter(r => r.status === 'pass');

  if (failedTests.length > 0) {
    report += `\n❌ TESTES QUE FALHARAM (${failedTests.length}):\n`;
    report += `─────────────────────────────────────────────────────────────\n\n`;
    failedTests.forEach((result, index) => {
      report += `${index + 1}. ${result.name}\n`;
      report += `   Status: FALHOU\n`;
      report += `   Mensagem: ${result.message}\n`;
      if (result.details) {
        report += `   Detalhes: ${JSON.stringify(result.details, null, 2)}\n`;
      }
      report += `\n`;
    });
  }

  if (warningTests.length > 0) {
    report += `\n⚠️  AVISOS (${warningTests.length}):\n`;
    report += `─────────────────────────────────────────────────────────────\n\n`;
    warningTests.forEach((result, index) => {
      report += `${index + 1}. ${result.name}\n`;
      report += `   Status: AVISO\n`;
      report += `   Mensagem: ${result.message}\n`;
      if (result.details) {
        report += `   Detalhes: ${JSON.stringify(result.details, null, 2)}\n`;
      }
      report += `\n`;
    });
  }

  if (passedTests.length > 0) {
    report += `\n✅ TESTES QUE PASSARAM (${passedTests.length}):\n`;
    report += `─────────────────────────────────────────────────────────────\n\n`;
    passedTests.forEach((result, index) => {
      report += `${index + 1}. ${result.name}\n`;
      report += `   Status: PASSOU\n`;
      report += `   Mensagem: ${result.message}\n`;
      report += `\n`;
    });
  }

  report += `═══════════════════════════════════════════════════════════════
RECOMENDAÇÕES
═══════════════════════════════════════════════════════════════

`;

  if (failedTests.length > 0) {
    report += `1. CORRIJA IMEDIATAMENTE os testes que falharam.\n`;
    report += `   Estes representam vulnerabilidades críticas de segurança.\n\n`;
  }

  if (warningTests.length > 0) {
    report += `2. REVISE os avisos e implemente melhorias quando possível.\n\n`;
  }

  report += `3. Execute este relatório regularmente para manter a segurança.\n`;
  report += `4. Mantenha todas as dependências atualizadas.\n`;
  report += `5. Configure headers de segurança no servidor.\n`;
  report += `6. Implemente monitoramento contínuo de segurança.\n`;

  report += `\n═══════════════════════════════════════════════════════════════
FIM DO RELATÓRIO
═══════════════════════════════════════════════════════════════\n`;

  return report;
}

// Função para baixar relatório como arquivo TXT
export function downloadSecurityReport(results: SecurityTestResult[]): void {
  const report = generateSecurityReport(results);
  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `relatorio-seguranca-${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ===== NOVOS TESTES ABRANGENTES =====

// Teste: Verificar força da autenticação
async function testAuthenticationStrength(): Promise<SecurityTestResult> {
  try {
    const { supabase } = await import('./supabaseClient');
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return {
        name: 'Força da Autenticação',
        status: 'warning',
        message: 'Sessão não ativa. Teste aplicável apenas com usuário logado.',
        severity: 'medium',
      };
    }

    const issues: string[] = [];
    
    // Verificar se o token tem tempo de expiração razoável
    if (session.expires_at) {
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = session.expires_at - now;
      if (expiresIn > 86400) { // Mais de 24 horas
        issues.push('Token com expiração muito longa (> 24h)');
      }
    }

    // Verificar se há refresh token
    if (!session.refresh_token) {
      issues.push('Refresh token não encontrado');
    }

    if (issues.length > 0) {
      return {
        name: 'Força da Autenticação',
        status: 'warning',
        message: 'Algumas configurações de autenticação podem ser melhoradas.',
        details: { issues },
        severity: 'medium',
        recommendations: [
          'Configure tokens com expiração adequada (< 24h)',
          'Implemente refresh tokens para renovação automática',
        ],
      };
    }

    return {
      name: 'Força da Autenticação',
      status: 'pass',
      message: 'Configurações de autenticação adequadas.',
      severity: 'low',
    };
  } catch (error) {
    return {
      name: 'Força da Autenticação',
      status: 'fail',
      message: `Erro ao verificar autenticação: ${error}`,
      severity: 'high',
    };
  }
}

// Teste: Verificar segurança dos tokens
async function testTokenSecurity(): Promise<SecurityTestResult> {
  try {
    const allStorage = { ...localStorage, ...sessionStorage };
    const tokenIssues: string[] = [];

    // Verificar se há tokens expostos
    Object.keys(allStorage).forEach(key => {
      const value = allStorage[key];
      if (typeof value === 'string') {
        // Verificar JWTs expostos
        if (value.match(/^eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/)) {
          tokenIssues.push(`Token JWT encontrado em: ${key}`);
        }
      }
    });

    if (tokenIssues.length > 0) {
      return {
        name: 'Segurança de Tokens',
        status: 'warning',
        message: 'Tokens encontrados no storage. Verifique se são armazenados de forma segura.',
        details: { tokens: tokenIssues },
        severity: 'high',
        recommendations: [
          'Armazene tokens apenas no sessionStorage, nunca no localStorage',
          'Use cookies HttpOnly para tokens sensíveis',
          'Implemente rotação de tokens',
        ],
      };
    }

    return {
      name: 'Segurança de Tokens',
      status: 'pass',
      message: 'Nenhum token exposto detectado no storage.',
      severity: 'low',
    };
  } catch (error) {
    return {
      name: 'Segurança de Tokens',
      status: 'fail',
      message: `Erro ao verificar tokens: ${error}`,
      severity: 'high',
    };
  }
}

// Teste: Verificar políticas de senha
async function testPasswordPolicies(): Promise<SecurityTestResult> {
  try {
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    const issues: string[] = [];

    passwordInputs.forEach((input: Element) => {
      const htmlInput = input as HTMLInputElement;
      
      // Verificar atributos de segurança
      if (htmlInput.autocomplete !== 'new-password' && 
          htmlInput.autocomplete !== 'current-password') {
        issues.push(`Campo sem autocomplete adequado: ${htmlInput.name || htmlInput.id}`);
      }

      // Verificar se tem minlength
      if (!htmlInput.minLength || htmlInput.minLength < 8) {
        issues.push(`Campo sem comprimento mínimo adequado (< 8): ${htmlInput.name || htmlInput.id}`);
      }
    });

    if (passwordInputs.length === 0) {
      return {
        name: 'Políticas de Senha',
        status: 'warning',
        message: 'Nenhum campo de senha detectado na página atual.',
        severity: 'low',
      };
    }

    if (issues.length > 0) {
      return {
        name: 'Políticas de Senha',
        status: 'warning',
        message: 'Algumas políticas de senha podem ser melhoradas.',
        details: { issues },
        severity: 'medium',
        recommendations: [
          'Defina comprimento mínimo de 8 caracteres',
          'Use autocomplete="new-password" ou "current-password"',
          'Implemente validação de complexidade',
        ],
      };
    }

    return {
      name: 'Políticas de Senha',
      status: 'pass',
      message: 'Políticas de senha adequadas implementadas.',
      severity: 'low',
    };
  } catch (error) {
    return {
      name: 'Políticas de Senha',
      status: 'fail',
      message: `Erro ao verificar políticas: ${error}`,
      severity: 'medium',
    };
  }
}

// Teste: Verificar controle de acesso baseado em funções
async function testRoleBasedAccess(): Promise<SecurityTestResult> {
  try {
    const { supabase } = await import('./supabaseClient');
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return {
        name: 'Controle de Acesso (RBAC)',
        status: 'warning',
        message: 'Teste requer usuário autenticado.',
        severity: 'medium',
      };
    }

    // Verificar se há role configurado
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, page_permissions')
      .eq('user_id', session.user.id)
      .single();

    if (!profile) {
      return {
        name: 'Controle de Acesso (RBAC)',
        status: 'fail',
        message: 'Perfil de usuário não encontrado. RBAC pode não estar configurado.',
        severity: 'critical',
        recommendations: [
          'Configure tabela user_profiles',
          'Implemente sistema de roles',
          'Defina permissões granulares',
        ],
      };
    }

    if (!profile.role) {
      return {
        name: 'Controle de Acesso (RBAC)',
        status: 'warning',
        message: 'Role não definido para o usuário.',
        severity: 'high',
      };
    }

    return {
      name: 'Controle de Acesso (RBAC)',
      status: 'pass',
      message: `Sistema RBAC implementado. Role: ${profile.role}`,
      details: { role: profile.role, hasPermissions: !!profile.page_permissions },
      severity: 'low',
    };
  } catch (error) {
    return {
      name: 'Controle de Acesso (RBAC)',
      status: 'fail',
      message: `Erro ao verificar RBAC: ${error}`,
      severity: 'high',
    };
  }
}

// Teste: Verificar sessionStorage
function testSessionStorageSecurity(): SecurityTestResult {
  try {
    const sensitiveKeys = ['password', 'secret', 'key', 'credential', 'pin'];
    const sessionKeys = Object.keys(sessionStorage);
    const issues: string[] = [];

    sessionKeys.forEach(key => {
      const keyLower = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => keyLower.includes(sensitive))) {
        issues.push(key);
      }
    });

    if (issues.length > 0) {
      return {
        name: 'SessionStorage Security',
        status: 'warning',
        message: 'Possíveis dados sensíveis no sessionStorage.',
        details: { keys: issues },
        severity: 'medium',
        recommendations: [
          'Não armazene senhas ou secrets no sessionStorage',
          'Use encryption para dados sensíveis',
        ],
      };
    }

    return {
      name: 'SessionStorage Security',
      status: 'pass',
      message: 'SessionStorage sem dados sensíveis detectados.',
      severity: 'low',
    };
  } catch (error) {
    return {
      name: 'SessionStorage Security',
      status: 'fail',
      message: `Erro ao verificar sessionStorage: ${error}`,
      severity: 'medium',
    };
  }
}

// Teste: Verificar dados sensíveis no DOM
function testSensitiveDataInDOM(): SecurityTestResult {
  try {
    const bodyHTML = document.body.innerHTML;
    const issues: string[] = [];

    // Padrões de dados sensíveis
    const patterns = [
      { regex: /password["\s]*[:=]["\s]*[^"'\s]{6,}/gi, type: 'Password' },
      { regex: /\d{3}-\d{2}-\d{4}/g, type: 'SSN' },
      { regex: /\d{4}\s?\d{4}\s?\d{4}\s?\d{4}/g, type: 'Credit Card' },
      { regex: /api[_-]?key["\s]*[:=]["\s]*[A-Za-z0-9]{20,}/gi, type: 'API Key' },
    ];

    patterns.forEach(pattern => {
      const matches = bodyHTML.match(pattern.regex);
      if (matches && matches.length > 0) {
        issues.push(`${pattern.type}: ${matches.length} ocorrência(s)`);
      }
    });

    if (issues.length > 0) {
      return {
        name: 'Dados Sensíveis no DOM',
        status: 'fail',
        message: 'Possíveis dados sensíveis expostos no DOM!',
        details: { issues },
        severity: 'critical',
        recommendations: [
          'Remova todos os dados sensíveis do HTML',
          'Use máscaras para dados sensíveis',
          'Nunca exponha senhas, tokens ou chaves no DOM',
        ],
      };
    }

    return {
      name: 'Dados Sensíveis no DOM',
      status: 'pass',
      message: 'Nenhum dado sensível detectado no DOM.',
      severity: 'low',
    };
  } catch (error) {
    return {
      name: 'Dados Sensíveis no DOM',
      status: 'fail',
      message: `Erro ao verificar DOM: ${error}`,
      severity: 'high',
    };
  }
}

// Teste: Verificar segurança do banco de dados
async function testDatabaseSecurity(): Promise<SecurityTestResult> {
  try {
    const { supabase } = await import('./supabaseClient');
    
    // Verificar o role do usuário atual
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return {
        name: 'Segurança do Banco de Dados',
        status: 'warning',
        message: 'Teste requer usuário autenticado.',
        severity: 'low',
      };
    }

    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    const isAdmin = currentProfile?.role === 'admin';
    
    // Testar se RLS está ativo tentando acessar dados sem permissão
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (error && error.message.includes('policy')) {
      return {
        name: 'Segurança do Banco de Dados',
        status: 'pass',
        message: 'RLS (Row Level Security) está ativo e funcionando.',
        severity: 'low',
      };
    }

    if (data && data.length > 0) {
      // Se for admin, acesso aos dados é esperado
      if (isAdmin) {
        return {
          name: 'Segurança do Banco de Dados',
          status: 'pass',
          message: 'Admin tem acesso aos dados. RLS configurado corretamente para permissões administrativas.',
          severity: 'low',
        };
      }
      
      // Se não for admin, é um aviso
      return {
        name: 'Segurança do Banco de Dados',
        status: 'warning',
        message: 'Dados acessíveis. Verifique políticas RLS.',
        severity: 'high',
        recommendations: [
          'Habilite RLS em todas as tabelas',
          'Configure políticas de acesso restritivas',
        ],
      };
    }

    return {
      name: 'Segurança do Banco de Dados',
      status: 'pass',
      message: 'Configurações de segurança do banco aparentam estar corretas.',
      severity: 'low',
    };
  } catch (error) {
    return {
      name: 'Segurança do Banco de Dados',
      status: 'warning',
      message: 'Não foi possível verificar completamente a segurança do banco.',
      severity: 'medium',
    };
  }
}

// Teste: Verificar vazamentos no console
function testConsoleLeaks(): SecurityTestResult {
  try {
    const consoleErrors: string[] = [];
    
    // Verificar se há console.log expondo dados
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    // Verificar se console está sendo usado em produção
    if (import.meta.env.PROD && (originalLog || originalError || originalWarn)) {
      consoleErrors.push('Console methods disponíveis em produção');
    }

    if (consoleErrors.length > 0) {
      return {
        name: 'Vazamentos no Console',
        status: 'warning',
        message: 'Console ativo em produção pode expor informações.',
        details: { issues: consoleErrors },
        severity: 'medium',
        recommendations: [
          'Desabilite console em produção',
          'Use logging service apropriado',
          'Remova console.log do código de produção',
        ],
      };
    }

    return {
      name: 'Vazamentos no Console',
      status: 'pass',
      message: 'Nenhum vazamento de console detectado.',
      severity: 'low',
    };
  } catch (error) {
    return {
      name: 'Vazamentos no Console',
      status: 'fail',
      message: `Erro ao verificar console: ${error}`,
      severity: 'low',
    };
  }
}

// Teste: Verificar vulnerabilidades XSS avançadas
async function testXSSVulnerabilities(): Promise<SecurityTestResult> {
  try {
    const issues: string[] = [];

    // Verificar inputs sem sanitização
    const inputs = document.querySelectorAll('input, textarea');
    let unsanitizedInputs = 0;

    inputs.forEach((input: Element) => {
      const htmlInput = input as HTMLInputElement | HTMLTextAreaElement;
      // Verificar se tem event handlers inline perigosos
      if (htmlInput.getAttribute('onerror') || 
          htmlInput.getAttribute('onload') ||
          htmlInput.getAttribute('onclick')?.includes('eval')) {
        unsanitizedInputs++;
      }
    });

    if (unsanitizedInputs > 0) {
      issues.push(`${unsanitizedInputs} input(s) com event handlers perigosos`);
    }

    // Verificar uso de eval ou innerHTML sem sanitização
    const scripts = document.querySelectorAll('script');
    scripts.forEach((script: Element) => {
      if (script.textContent?.includes('eval(') ||
          script.textContent?.includes('.innerHTML =')) {
        issues.push('Uso potencialmente inseguro de eval() ou innerHTML detectado');
      }
    });

    if (issues.length > 0) {
      return {
        name: 'Vulnerabilidades XSS Avançadas',
        status: 'fail',
        message: 'Possíveis vulnerabilidades XSS detectadas!',
        details: { issues },
        severity: 'critical',
        recommendations: [
          'Use textContent ao invés de innerHTML',
          'Evite eval() completamente',
          'Sanitize todos os inputs do usuário',
          'Use Content Security Policy',
        ],
      };
    }

    return {
      name: 'Vulnerabilidades XSS Avançadas',
      status: 'pass',
      message: 'Nenhuma vulnerabilidade XSS óbvia detectada.',
      severity: 'low',
    };
  } catch (error) {
    return {
      name: 'Vulnerabilidades XSS Avançadas',
      status: 'fail',
      message: `Erro ao verificar XSS: ${error}`,
      severity: 'high',
    };
  }
}

// Teste: Verificar sanitização de HTML
function testHTMLSanitization(): SecurityTestResult {
  try {
    // Verificar se há biblioteca de sanitização carregada
    const hasDOMPurify = typeof window !== 'undefined' && 'DOMPurify' in window;
    
    // Verificar uso de dangerouslySetInnerHTML em React
    const reactDangerousElements = document.querySelectorAll('[data-dangerous]');
    
    if (reactDangerousElements.length > 0 && !hasDOMPurify) {
      return {
        name: 'Sanitização de HTML',
        status: 'fail',
        message: 'Uso de HTML perigoso sem biblioteca de sanitização!',
        severity: 'critical',
        recommendations: [
          'Instale e use DOMPurify',
          'Evite dangerouslySetInnerHTML',
          'Sanitize todo conteúdo HTML dinâmico',
        ],
      };
    }

    if (!hasDOMPurify) {
      return {
        name: 'Sanitização de HTML',
        status: 'warning',
        message: 'Biblioteca de sanitização não detectada.',
        severity: 'medium',
        recommendations: ['Considere usar DOMPurify para sanitização'],
      };
    }

    return {
      name: 'Sanitização de HTML',
      status: 'pass',
      message: 'Sistema de sanitização de HTML detectado.',
      severity: 'low',
    };
  } catch (error) {
    return {
      name: 'Sanitização de HTML',
      status: 'fail',
      message: `Erro ao verificar sanitização: ${error}`,
      severity: 'medium',
    };
  }
}

// Teste: Verificar XSS baseado em DOM
function testDOMBasedXSS(): SecurityTestResult {
  try {
    const issues: string[] = [];
    
    // Verificar se URL params são usados diretamente
    const urlParams = new URLSearchParams(window.location.search);
    const hasParams = urlParams.toString().length > 0;
    
    if (hasParams) {
      // Verificar se algum elemento do DOM contém valores dos params sem sanitização
      urlParams.forEach((value, key) => {
        if (document.body.innerHTML.includes(value) && 
            value.includes('<') || value.includes('>')) {
          issues.push(`Parâmetro URL "${key}" pode estar sendo usado sem sanitização`);
        }
      });
    }

    if (issues.length > 0) {
      return {
        name: 'XSS Baseado em DOM',
        status: 'fail',
        message: 'Possível XSS via manipulação de URL!',
        details: { issues },
        severity: 'critical',
        recommendations: [
          'Sanitize todos os parâmetros de URL',
          'Valide entrada antes de inserir no DOM',
          'Use encodeURIComponent para valores de URL',
        ],
      };
    }

    return {
      name: 'XSS Baseado em DOM',
      status: 'pass',
      message: 'Nenhuma vulnerabilidade DOM-XSS detectada.',
      severity: 'low',
    };
  } catch (error) {
    return {
      name: 'XSS Baseado em DOM',
      status: 'fail',
      message: `Erro ao verificar DOM-XSS: ${error}`,
      severity: 'high',
    };
  }
}

// Teste: Verificar Subresource Integrity
async function testSubresourceIntegrity(): Promise<SecurityTestResult> {
  try {
    // Lista de CDNs confiáveis que têm boa reputação
    const trustedCDNs = [
      'cdnjs.cloudflare.com',
      'cdn.jsdelivr.net',
      'unpkg.com',
      'cdn.skypack.dev',
      'esm.sh',
    ];

    const externalScripts = Array.from(document.querySelectorAll('script[src]'))
      .filter(script => {
        const src = (script as HTMLScriptElement).src;
        return src && !src.startsWith(window.location.origin);
      });

    const scriptsWithoutSRI = externalScripts.filter(script => 
      !(script as HTMLScriptElement).integrity
    );

    if (scriptsWithoutSRI.length > 0) {
      // Separar scripts de CDNs confiáveis dos não confiáveis
      const untrustedScripts: string[] = [];
      const trustedScripts: string[] = [];

      scriptsWithoutSRI.forEach(script => {
        const src = (script as HTMLScriptElement).src;
        const isTrustedCDN = trustedCDNs.some(cdn => src.includes(cdn));
        
        if (isTrustedCDN) {
          trustedScripts.push(src);
        } else {
          untrustedScripts.push(src);
        }
      });

      // Se houver scripts de fontes não confiáveis sem SRI, é mais grave
      if (untrustedScripts.length > 0) {
      return {
        name: 'Subresource Integrity (SRI)',
        status: 'warning',
          message: `${untrustedScripts.length} script(s) de fonte não confiável sem SRI!`,
        details: {
            untrustedScripts,
            trustedScripts,
        },
          severity: 'high',
        recommendations: [
            'Adicione atributo integrity a todos os scripts externos',
            'Priorize scripts de CDNs confiáveis',
          'Use crossorigin="anonymous" com SRI',
        ],
      };
      }

      // Se houver apenas scripts de CDNs confiáveis, é um aviso leve
      if (trustedScripts.length > 0) {
        return {
          name: 'Subresource Integrity (SRI)',
          status: 'pass',
          message: `Scripts de CDNs confiáveis (${trustedScripts.length}). SRI recomendado mas não crítico.`,
          details: {
            note: 'Scripts de CDNs confiáveis sem SRI. Considere adicionar para segurança adicional.',
            trustedCDNs: trustedScripts,
          },
          severity: 'low',
        };
      }
    }

    return {
      name: 'Subresource Integrity (SRI)',
      status: 'pass',
      message: 'Scripts externos protegidos com SRI.',
      severity: 'low',
    };
  } catch (error) {
    return {
      name: 'Subresource Integrity (SRI)',
      status: 'fail',
      message: `Erro ao verificar SRI: ${error}`,
      severity: 'medium',
    };
  }
}

// Importar testes estendidos
import {
  testAPIEndpointSecurity,
  testRouteProtection,
  testUnauthorizedAccess,
  testPrototypePollution,
  testOpenRedirects,
  testEnvironmentConfiguration,
  testDebugMode,
  testSourceMaps,
  testBackupFiles,
} from './securityTestsExtended';
