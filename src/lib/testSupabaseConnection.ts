// Script de teste para verificar a conexão com o Supabase
// Use isso no console do navegador para testar sua tabela

import { logger } from './logger';
import { fetchPasswords } from './passwordsApiService';

/**
 * Testa a conexão com o Supabase usando as funções RPC
 * Execute isso no console do navegador: window.testSupabase()
 */
export async function testSupabaseConnection() {
  logger.log('🔍 Testando conexão com o Supabase via RPC...\n');

  try {
    // Tenta buscar dados usando a função RPC
    const data = await fetchPasswords();

    if (!data) {
      logger.error('❌ Erro ao acessar as senhas via RPC');
      logger.log('\n💡 Possíveis soluções:');
      logger.log('1. Verifique se as funções RPC foram criadas no Supabase');
      logger.log('2. Execute o script docs/sql/passwords_rpc_functions.sql');
      logger.log('3. Verifique as permissões das funções RPC no Supabase');
      logger.log('4. Verifique as políticas RLS (Row Level Security) no Supabase');
      return false;
    }

    logger.log('✅ Funções RPC configuradas corretamente!');
    
    if (data.length > 0) {
      logger.log(`\n📊 ${data.length} senha(s) encontrada(s)`);
      logger.log('\n📋 Estrutura do primeiro registro:');
      const firstItem = data[0];
      logger.log(`  - ID: ${firstItem.id}`);
      logger.log(`  - Serviço: ${firstItem.service}`);
      logger.log(`  - Categoria: ${firstItem.category}`);
      logger.log(`  - Username: ${firstItem.username ? '***' : '(vazio)'}`);
      logger.log(`  - Password: ${firstItem.password ? '***' : '(vazio)'}`);
      logger.log('✅ Estrutura dos dados está correta!');
    } else {
      logger.log('⚠️ Nenhuma senha encontrada');
      logger.log('💡 Adicione alguns dados na tabela passwords no Supabase Dashboard');
    }

    return true;
  } catch (error: any) {
    logger.error('❌ Erro ao testar conexão via RPC:', error);
    
    if (error?.message?.includes('function') || error?.message?.includes('does not exist')) {
      logger.log('\n💡 A função RPC não foi encontrada!');
      logger.log('Execute o script: docs/sql/passwords_rpc_functions.sql');
    }
    
    return false;
  }
}

// Disponibiliza a função globalmente para uso no console
if (typeof window !== 'undefined') {
  (window as any).testSupabase = testSupabaseConnection;
}


