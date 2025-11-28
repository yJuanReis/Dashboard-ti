// Script de teste para verificar a conexão com a tabela NVR no Supabase
// Execute isso no console do navegador para testar sua tabela

import { supabase } from './supabaseClient';
import { logger } from './logger';

/**
 * Testa a conexão com o Supabase e verifica se a tabela NVR existe
 * Execute isso no console do navegador: window.testNVRConnection()
 */
export async function testNVRConnection() {
  logger.log('🔍 Testando conexão com a tabela NVR no Supabase...\n');

  try {
    // Tenta buscar dados da tabela
    const { data, error } = await supabase
      .from('nvrs')
      .select('*')
      .limit(5);

    if (error) {
      logger.error('❌ Erro ao acessar a tabela NVRs:', error);
      logger.log('\n💡 Possíveis soluções:');
      logger.log('1. Verifique se a tabela "nvrs" existe no Supabase Dashboard');
      logger.log('2. Verifique as políticas RLS (Row Level Security) no Supabase');
      logger.log('3. Verifique se você está autenticado (se RLS estiver habilitado)');
      logger.log('4. Verifique a estrutura da tabela (deve ter: id, marina, name, model, owner, cameras, notes, slots)');
      return false;
    }

    logger.log('✅ Tabela NVR encontrada!');
    logger.log(`📊 Total de registros encontrados: ${data?.length || 0}\n`);
    
    if (data && data.length > 0) {
      logger.log('📋 Estrutura do primeiro registro:');
      logger.log(JSON.stringify(data[0], null, 2));
      logger.log('\n📝 Campos esperados:');
      logger.log('- id (UUID ou string)');
      logger.log('- marina (string)');
      logger.log('- name (string)');
      logger.log('- model (string)');
      logger.log('- owner (string)');
      logger.log('- cameras (number)');
      logger.log('- notes (string ou null)');
      logger.log('- slots (JSONB/array de objetos)');
      logger.log('\n✅ Dados parecem estar corretos!');
    } else {
      logger.log('⚠️ Tabela existe mas está vazia');
      logger.log('💡 Adicione alguns NVRs através da interface ou diretamente no Supabase');
    }
    
    return true;
  } catch (error) {
    logger.error('❌ Erro ao testar conexão:', error);
    return false;
  }
}

// Disponibiliza a função globalmente para uso no console
if (typeof window !== 'undefined') {
  (window as any).testNVRConnection = testNVRConnection;
}

