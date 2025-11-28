/**
 * Script de validação de timing
 * 
 * Este script valida que as operações de autenticação têm timing consistente
 * para prevenir ataques de timing attack
 */

import { withTimingProtection } from '../errorService';

interface TimingResult {
  operation: string;
  duration: number;
  success: boolean;
}

const results: TimingResult[] = [];

/**
 * Simula operação de login bem-sucedida
 */
async function simulateSuccessfulLogin(): Promise<void> {
  const start = Date.now();
  
  await withTimingProtection(async () => {
    // Simula verificação de credenciais (rápida)
    await new Promise(resolve => setTimeout(resolve, 50));
    return { success: true };
  });
  
  results.push({
    operation: 'successful_login',
    duration: Date.now() - start,
    success: true
  });
}

/**
 * Simula operação de login com falha
 */
async function simulateFailedLogin(): Promise<void> {
  const start = Date.now();
  
  try {
    await withTimingProtection(async () => {
      // Simula verificação de credenciais (rápida)
      await new Promise(resolve => setTimeout(resolve, 50));
      throw new Error('Invalid credentials');
    });
  } catch {
    // Esperado
  }
  
  results.push({
    operation: 'failed_login',
    duration: Date.now() - start,
    success: false
  });
}

/**
 * Simula operação lenta (ex: verificação de banco de dados)
 */
async function simulateSlowOperation(): Promise<void> {
  const start = Date.now();
  
  await withTimingProtection(async () => {
    // Simula operação mais lenta
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true };
  });
  
  results.push({
    operation: 'slow_operation',
    duration: Date.now() - start,
    success: true
  });
}

/**
 * Analisa os resultados e gera relatório
 */
function analyzeResults(): void {
  console.log('\n' + '='.repeat(70));
  console.log('📊 RELATÓRIO DE VALIDAÇÃO DE TIMING');
  console.log('='.repeat(70) + '\n');

  // Agrupar por tipo de operação
  const byOperation: Record<string, number[]> = {};
  results.forEach(result => {
    if (!byOperation[result.operation]) {
      byOperation[result.operation] = [];
    }
    byOperation[result.operation].push(result.duration);
  });

  // Analisar cada tipo de operação
  Object.entries(byOperation).forEach(([operation, durations]) => {
    const avg = durations.reduce((a, b) => a + b) / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / durations.length;
    const stdDev = Math.sqrt(variance);

    console.log(`\n${operation.toUpperCase().replace(/_/g, ' ')}`);
    console.log('-'.repeat(50));
    console.log(`  Tentativas: ${durations.length}`);
    console.log(`  Média: ${avg.toFixed(2)}ms`);
    console.log(`  Mínimo: ${min}ms`);
    console.log(`  Máximo: ${max}ms`);
    console.log(`  Desvio Padrão: ${stdDev.toFixed(2)}ms`);
    console.log(`  Variação: ${((max - min) / avg * 100).toFixed(2)}%`);
  });

  // Comparar timing entre sucesso e falha
  console.log('\n' + '='.repeat(70));
  console.log('🔍 ANÁLISE DE CONSISTÊNCIA');
  console.log('='.repeat(70));

  const successDurations = byOperation['successful_login'] || [];
  const failureDurations = byOperation['failed_login'] || [];

  if (successDurations.length > 0 && failureDurations.length > 0) {
    const successAvg = successDurations.reduce((a, b) => a + b) / successDurations.length;
    const failureAvg = failureDurations.reduce((a, b) => a + b) / failureDurations.length;
    const difference = Math.abs(successAvg - failureAvg);
    const percentDiff = (difference / Math.max(successAvg, failureAvg)) * 100;

    console.log(`\n  Média Login Sucesso: ${successAvg.toFixed(2)}ms`);
    console.log(`  Média Login Falha: ${failureAvg.toFixed(2)}ms`);
    console.log(`  Diferença: ${difference.toFixed(2)}ms (${percentDiff.toFixed(2)}%)`);

    if (percentDiff < 5) {
      console.log(`  ✅ EXCELENTE: Timing muito consistente (< 5% diferença)`);
    } else if (percentDiff < 10) {
      console.log(`  ✓ BOM: Timing razoavelmente consistente (< 10% diferença)`);
    } else if (percentDiff < 20) {
      console.log(`  ⚠️  ATENÇÃO: Timing moderadamente variável (< 20% diferença)`);
    } else {
      console.log(`  ❌ ALERTA: Timing inconsistente (> 20% diferença) - VULNERÁVEL A TIMING ATTACKS`);
    }
  }

  // Validações de segurança
  console.log('\n' + '='.repeat(70));
  console.log('🔒 VALIDAÇÕES DE SEGURANÇA');
  console.log('='.repeat(70) + '\n');

  const allDurations = results.map(r => r.duration);
  const minDuration = Math.min(...allDurations);
  const maxDuration = Math.max(...allDurations);

  // Verificar se o tempo mínimo está sendo respeitado (1000ms)
  if (minDuration >= 1000) {
    console.log('  ✅ Tempo mínimo respeitado (>= 1000ms)');
  } else {
    console.log(`  ❌ Tempo mínimo NÃO respeitado: ${minDuration}ms < 1000ms`);
  }

  // Verificar se o delay aleatório está funcionando
  const hasVariation = (maxDuration - minDuration) > 100; // Deve ter pelo menos 100ms de variação
  if (hasVariation) {
    console.log('  ✅ Delay aleatório funcionando corretamente');
  } else {
    console.log('  ⚠️  Delay aleatório pode não estar funcionando (pouca variação)');
  }

  // Verificar se não há operações muito rápidas (possível bypass)
  const tooFast = allDurations.filter(d => d < 500).length;
  if (tooFast === 0) {
    console.log('  ✅ Nenhuma operação suspeita detectada');
  } else {
    console.log(`  ⚠️  ${tooFast} operação(ões) muito rápida(s) detectada(s)`);
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

/**
 * Executa a validação
 */
async function runValidation(): Promise<void> {
  console.log('🚀 Iniciando validação de timing...\n');
  console.log('Executando 10 iterações de cada tipo de operação...\n');

  const iterations = 10;

  for (let i = 0; i < iterations; i++) {
    // Alternar entre diferentes tipos de operações
    await simulateSuccessfulLogin();
    await simulateFailedLogin();
    
    if (i % 3 === 0) {
      await simulateSlowOperation();
    }

    // Pequeno delay entre operações
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mostrar progresso
    process.stdout.write(`\rProgresso: ${Math.round(((i + 1) / iterations) * 100)}%`);
  }

  console.log('\n\n✅ Validação concluída!\n');
  analyzeResults();
}

// Executar validação se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runValidation().catch(error => {
    console.error('❌ Erro durante validação:', error);
    process.exit(1);
  });
}

export { runValidation, analyzeResults, results };

