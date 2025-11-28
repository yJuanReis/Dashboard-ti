/**
 * Testes do Error Service
 * 
 * Testa os diferentes cenários de erro e validações de timing
 */

import {
  withTimingProtection,
  ensureMinimumDelay,
  addRandomDelay,
  recordLoginAttempt,
  isLocked,
  shouldRequireCaptcha,
  resetLoginAttempts,
  getLockoutTimeRemaining,
  createError,
  mapSupabaseError,
  AUTH_ERRORS,
} from '../errorService';

// Testes de timing protection
describe('Timing Protection', () => {
  test('ensureMinimumDelay deve aguardar o tempo mínimo', async () => {
    const startTime = Date.now();
    const minDuration = 1000; // 1 segundo
    
    await ensureMinimumDelay(startTime, minDuration);
    
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeGreaterThanOrEqual(minDuration);
  });

  test('ensureMinimumDelay não deve aguardar se tempo já passou', async () => {
    const startTime = Date.now() - 2000; // 2 segundos atrás
    const minDuration = 1000; // 1 segundo
    
    const beforeDelay = Date.now();
    await ensureMinimumDelay(startTime, minDuration);
    const afterDelay = Date.now();
    
    // Não deve ter esperado significativamente
    expect(afterDelay - beforeDelay).toBeLessThan(100);
  });

  test('addRandomDelay deve adicionar delay variável', async () => {
    const maxDelay = 500;
    const startTime = Date.now();
    
    await addRandomDelay(maxDelay);
    
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeGreaterThanOrEqual(0);
    expect(elapsed).toBeLessThanOrEqual(maxDelay + 50); // +50ms de margem
  });

  test('withTimingProtection deve proteger operação bem-sucedida', async () => {
    const startTime = Date.now();
    const minDuration = 1000;
    
    const result = await withTimingProtection(async () => {
      return 'success';
    }, minDuration);
    
    const elapsed = Date.now() - startTime;
    expect(result).toBe('success');
    expect(elapsed).toBeGreaterThanOrEqual(minDuration);
  });

  test('withTimingProtection deve proteger operação com erro', async () => {
    const startTime = Date.now();
    const minDuration = 1000;
    
    try {
      await withTimingProtection(async () => {
        throw new Error('Test error');
      }, minDuration);
    } catch (error: any) {
      expect(error.message).toBe('Test error');
    }
    
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeGreaterThanOrEqual(minDuration);
  });
});

// Testes de rate limiting
describe('Rate Limiting', () => {
  const testIdentifier = 'test@example.com';

  beforeEach(() => {
    resetLoginAttempts(testIdentifier);
  });

  test('primeira tentativa não deve estar bloqueada', () => {
    expect(isLocked(testIdentifier)).toBe(false);
    expect(shouldRequireCaptcha(testIdentifier)).toBe(false);
  });

  test('deve exigir CAPTCHA após 3 tentativas', () => {
    recordLoginAttempt(testIdentifier);
    expect(shouldRequireCaptcha(testIdentifier)).toBe(false);
    
    recordLoginAttempt(testIdentifier);
    expect(shouldRequireCaptcha(testIdentifier)).toBe(false);
    
    recordLoginAttempt(testIdentifier);
    expect(shouldRequireCaptcha(testIdentifier)).toBe(true);
    expect(isLocked(testIdentifier)).toBe(true);
  });

  test('resetLoginAttempts deve limpar tentativas', () => {
    recordLoginAttempt(testIdentifier);
    recordLoginAttempt(testIdentifier);
    recordLoginAttempt(testIdentifier);
    
    expect(shouldRequireCaptcha(testIdentifier)).toBe(true);
    
    resetLoginAttempts(testIdentifier);
    
    expect(shouldRequireCaptcha(testIdentifier)).toBe(false);
    expect(isLocked(testIdentifier)).toBe(false);
  });

  test('getLockoutTimeRemaining deve retornar tempo restante', () => {
    recordLoginAttempt(testIdentifier);
    recordLoginAttempt(testIdentifier);
    recordLoginAttempt(testIdentifier);
    
    const remaining = getLockoutTimeRemaining(testIdentifier);
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(5); // 5 minutos máximo
  });
});

// Testes de criação de erros
describe('Error Creation', () => {
  test('createError deve adicionar timestamp', () => {
    const error = createError(AUTH_ERRORS.INVALID_CREDENTIALS);
    
    expect(error.timestamp).toBeDefined();
    expect(error.code).toBe('AUTH001');
    expect(error.userMessage).toBe('Email ou senha incorretos');
  });

  test('createError deve aceitar contexto adicional', () => {
    const context = { email: 'test@example.com' };
    const error = createError(AUTH_ERRORS.INVALID_CREDENTIALS, context);
    
    expect(error.timestamp).toBeDefined();
  });
});

// Testes de mapeamento de erros do Supabase
describe('Supabase Error Mapping', () => {
  test('deve mapear erro de credenciais inválidas', () => {
    const supabaseError = {
      message: 'Invalid login credentials',
      status: 400
    };
    
    const appError = mapSupabaseError(supabaseError);
    expect(appError.code).toBe('AUTH001');
    expect(appError.userMessage).toBe('Email ou senha incorretos');
  });

  test('deve mapear erro de email não verificado', () => {
    const supabaseError = {
      message: 'Email not confirmed'
    };
    
    const appError = mapSupabaseError(supabaseError);
    expect(appError.code).toBe('AUTH004');
  });

  test('deve mapear erro de rate limit', () => {
    const supabaseError = {
      status: 429,
      message: 'Too many requests'
    };
    
    const appError = mapSupabaseError(supabaseError);
    expect(appError.code).toBe('AUTH009');
  });

  test('deve mapear erro de rede', () => {
    const supabaseError = {
      name: 'NetworkError',
      message: 'Network connection failed'
    };
    
    const appError = mapSupabaseError(supabaseError);
    expect(appError.code).toBe('AUTH010');
  });

  test('deve mapear erro desconhecido', () => {
    const supabaseError = {
      message: 'Unknown error'
    };
    
    const appError = mapSupabaseError(supabaseError);
    expect(appError.code).toBe('AUTH999');
  });
});

// Testes de consistência de mensagens
describe('Error Messages', () => {
  test('todas as mensagens de erro devem ter campos obrigatórios', () => {
    Object.entries(AUTH_ERRORS).forEach(([key, error]) => {
      expect(error.userMessage).toBeDefined();
      expect(error.technicalMessage).toBeDefined();
      expect(error.code).toBeDefined();
      expect(error.level).toBeDefined();
      expect(['user', 'technical', 'security']).toContain(error.level);
    });
  });

  test('mensagens de usuário não devem revelar detalhes técnicos', () => {
    Object.entries(AUTH_ERRORS).forEach(([key, error]) => {
      const userMsg = error.userMessage.toLowerCase();
      
      // Não deve conter termos técnicos
      expect(userMsg).not.toContain('token');
      expect(userMsg).not.toContain('session');
      expect(userMsg).not.toContain('database');
      expect(userMsg).not.toContain('query');
      expect(userMsg).not.toContain('sql');
    });
  });
});

// Testes de performance e timing consistency
describe('Timing Consistency', () => {
  test('operações de sucesso e falha devem ter timing similar', async () => {
    const minDuration = 1000;
    const tolerance = 100; // 100ms de tolerância
    
    // Operação bem-sucedida
    const successStart = Date.now();
    await withTimingProtection(async () => {
      return 'success';
    }, minDuration);
    const successDuration = Date.now() - successStart;
    
    // Operação com falha
    const failureStart = Date.now();
    try {
      await withTimingProtection(async () => {
        throw new Error('failure');
      }, minDuration);
    } catch {}
    const failureDuration = Date.now() - failureStart;
    
    // Ambas devem ter duração similar (diferença < tolerância)
    const difference = Math.abs(successDuration - failureDuration);
    expect(difference).toBeLessThan(tolerance);
  });

  test('múltiplas operações devem ter timing consistente', async () => {
    const minDuration = 500;
    const iterations = 5;
    const durations: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await withTimingProtection(async () => {
        // Operação rápida
        return 'test';
      }, minDuration);
      durations.push(Date.now() - start);
    }
    
    // Calcular média e desvio padrão
    const average = durations.reduce((a, b) => a + b) / durations.length;
    const variance = durations.reduce((sum, duration) => {
      return sum + Math.pow(duration - average, 2);
    }, 0) / durations.length;
    const stdDev = Math.sqrt(variance);
    
    // Desvio padrão deve ser baixo (timing consistente)
    // Com random delay, esperamos alguma variação (até 500ms)
    expect(stdDev).toBeLessThan(300);
  });
});

console.log('✅ Todos os testes do Error Service foram definidos');
console.log('📝 Para executar os testes, use: npm test');

