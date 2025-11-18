// Script de teste para verificar a conexão com a tabela NVR no Supabase
// Execute isso no console do navegador para testar sua tabela

import { supabase } from './supabaseClient';

/**
 * Testa a conexão com o Supabase e verifica se a tabela NVR existe
 * Execute isso no console do navegador: window.testNVRConnection()
 */
export async function testNVRConnection() {
  console.log('🔍 Testando conexão com a tabela NVR no Supabase...\n');

  try {
    // Tenta buscar dados da tabela
    const { data, error } = await supabase
      .from('nvrs')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Erro ao acessar a tabela NVRs:', error);
      console.log('\n💡 Possíveis soluções:');
      console.log('1. Verifique se a tabela "nvrs" existe no Supabase Dashboard');
      console.log('2. Verifique as políticas RLS (Row Level Security) no Supabase');
      console.log('3. Verifique se você está autenticado (se RLS estiver habilitado)');
      console.log('4. Verifique a estrutura da tabela (deve ter: id, marina, name, model, owner, cameras, notes, slots)');
      return false;
    }

    console.log('✅ Tabela NVR encontrada!');
    console.log(`📊 Total de registros encontrados: ${data?.length || 0}\n`);
    
    if (data && data.length > 0) {
      console.log('📋 Estrutura do primeiro registro:');
      console.log(JSON.stringify(data[0], null, 2));
      console.log('\n📝 Campos esperados:');
      console.log('- id (UUID ou string)');
      console.log('- marina (string)');
      console.log('- name (string)');
      console.log('- model (string)');
      console.log('- owner (string)');
      console.log('- cameras (number)');
      console.log('- notes (string ou null)');
      console.log('- slots (JSONB/array de objetos)');
      console.log('\n✅ Dados parecem estar corretos!');
    } else {
      console.log('⚠️ Tabela existe mas está vazia');
      console.log('💡 Adicione alguns NVRs através da interface ou diretamente no Supabase');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error);
    return false;
  }
}

// Disponibiliza a função globalmente para uso no console
if (typeof window !== 'undefined') {
  (window as any).testNVRConnection = testNVRConnection;
}

