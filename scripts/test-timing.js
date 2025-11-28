#!/usr/bin/env node

/**
 * Script de teste de timing para validação manual
 * 
 * Este script permite testar rapidamente o timing protection
 * sem precisar configurar um framework de testes completo
 */

console.log('🚀 Iniciando teste de timing protection...\n');

// Simular o errorService (versão simplificada)
const TIMING_CONFIG = {
  MIN_DURATION: 1000,
  MAX_RANDOM_DELAY: 500,
};

async function ensureMinimumDelay(startTime, minDuration = TIMING_CONFIG.MIN_DURATION) {
  const elapsed = Date.now() - startTime;
  if (elapsed < minDuration) {
    await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
  }
}

async function addRandomDelay(maxDelay = TIMING_CONFIG.MAX_RANDOM_DELAY) {
  const randomDelay = Math.random() * maxDelay;
  await new Promise(resolve => setTimeout(resolve, randomDelay));
}

async function withTimingProtection(operation, minDuration = TIMING_CONFIG.MIN_DURATION) {
  const startTime = Date.now();
  
  try {
    const result = await operation();
    await ensureMinimumDelay(startTime, minDuration);
    await addRandomDelay();
    return result;
  } catch (error) {
    await ensureMinimumDelay(startTime, minDuration);
    await addRandomDelay();
    throw error;
  }
}

// Testes
const results = {
  success: [],
  failure: [],
  timing: {
    pass: 0,
    fail: 0
  }
};

async function testSuccessOperation() {
  const start = Date.now();
  await withTimingProtection(async () => {
    // Simula operação rápida
    await new Promise(resolve => setTimeout(resolve, 50));
    return 'success';
  });
  const duration = Date.now() - start;
  results.success.push(duration);
  return duration;
}

async function testFailureOperation() {
  const start = Date.now();
  try {
    await withTimingProtection(async () => {
      // Simula operação rápida que falha
      await new Promise(resolve => setTimeout(resolve, 50));
      throw new Error('Invalid credentials');
    });
  } catch {}
  const duration = Date.now() - start;
  results.failure.push(duration);
  return duration;
}

async function runTests() {
  console.log('Executando 10 operações de cada tipo...\n');
  
  for (let i = 0; i < 10; i++) {
    process.stdout.write(`\rProgresso: ${i + 1}/10`);
    await testSuccessOperation();
    await testFailureOperation();
    // Pequeno delay entre iterações
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 RESULTADOS');
  console.log('='.repeat(60) + '\n');
  
  // Calcular estatísticas
  const avgSuccess = results.success.reduce((a, b) => a + b) / results.success.length;
  const avgFailure = results.failure.reduce((a, b) => a + b) / results.failure.length;
  const minSuccess = Math.min(...results.success);
  const maxSuccess = Math.max(...results.success);
  const minFailure = Math.min(...results.failure);
  const maxFailure = Math.max(...results.failure);
  
  console.log('OPERAÇÕES BEM-SUCEDIDAS:');
  console.log(`  Média: ${avgSuccess.toFixed(2)}ms`);
  console.log(`  Mínimo: ${minSuccess}ms`);
  console.log(`  Máximo: ${maxSuccess}ms`);
  console.log(`  Variação: ${(maxSuccess - minSuccess)}ms\n`);
  
  console.log('OPERAÇÕES COM FALHA:');
  console.log(`  Média: ${avgFailure.toFixed(2)}ms`);
  console.log(`  Mínimo: ${minFailure}ms`);
  console.log(`  Máximo: ${maxFailure}ms`);
  console.log(`  Variação: ${(maxFailure - minFailure)}ms\n`);
  
  console.log('='.repeat(60));
  console.log('🔍 ANÁLISE DE TIMING');
  console.log('='.repeat(60) + '\n');
  
  const difference = Math.abs(avgSuccess - avgFailure);
  const percentDiff = (difference / Math.max(avgSuccess, avgFailure)) * 100;
  
  console.log(`Diferença absoluta: ${difference.toFixed(2)}ms`);
  console.log(`Diferença percentual: ${percentDiff.toFixed(2)}%\n`);
  
  // Validações
  console.log('VALIDAÇÕES:');
  
  // 1. Tempo mínimo
  const allTimings = [...results.success, ...results.failure];
  const minTiming = Math.min(...allTimings);
  if (minTiming >= TIMING_CONFIG.MIN_DURATION) {
    console.log(`  ✅ Tempo mínimo respeitado (${minTiming}ms >= ${TIMING_CONFIG.MIN_DURATION}ms)`);
    results.timing.pass++;
  } else {
    console.log(`  ❌ Tempo mínimo NÃO respeitado (${minTiming}ms < ${TIMING_CONFIG.MIN_DURATION}ms)`);
    results.timing.fail++;
  }
  
  // 2. Consistência de timing
  if (percentDiff < 5) {
    console.log(`  ✅ Timing MUITO consistente (${percentDiff.toFixed(2)}% < 5%)`);
    results.timing.pass++;
  } else if (percentDiff < 10) {
    console.log(`  ✓ Timing razoavelmente consistente (${percentDiff.toFixed(2)}% < 10%)`);
    results.timing.pass++;
  } else {
    console.log(`  ⚠️  Timing inconsistente (${percentDiff.toFixed(2)}% >= 10%)`);
    results.timing.fail++;
  }
  
  // 3. Random delay funcionando
  const maxVariation = Math.max(maxSuccess - minSuccess, maxFailure - minFailure);
  if (maxVariation > 100) {
    console.log(`  ✅ Random delay funcionando (variação ${maxVariation}ms > 100ms)`);
    results.timing.pass++;
  } else {
    console.log(`  ⚠️  Random delay pode não estar funcionando (variação ${maxVariation}ms < 100ms)`);
    results.timing.fail++;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📈 RESUMO');
  console.log('='.repeat(60) + '\n');
  
  const totalTests = results.timing.pass + results.timing.fail;
  const successRate = (results.timing.pass / totalTests) * 100;
  
  console.log(`Testes executados: ${totalTests}`);
  console.log(`Aprovados: ${results.timing.pass}`);
  console.log(`Falhados: ${results.timing.fail}`);
  console.log(`Taxa de sucesso: ${successRate.toFixed(2)}%\n`);
  
  if (successRate === 100) {
    console.log('🎉 EXCELENTE! Todos os testes passaram!');
  } else if (successRate >= 66) {
    console.log('✓ BOM! Maioria dos testes passou.');
  } else {
    console.log('⚠️  ATENÇÃO! Muitos testes falharam. Revisar implementação.');
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

// Executar testes
runTests().catch(error => {
  console.error('\n❌ Erro durante execução:', error);
  process.exit(1);
});

