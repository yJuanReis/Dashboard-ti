// Script para verificar as tabelas existentes no Supabase
// Execute isso no console do navegador ou adicione temporariamente na página

import { supabase } from './supabaseClient';
import { logger } from './logger';

/**
 * Verifica quais tabelas existem no Supabase
 * ATENÇÃO: Isso requer permissões no Supabase para listar tabelas
 */
export async function checkTables() {
  try {
    // Tenta buscar de algumas tabelas comuns
    const tableNames = ['passwords', 'senhas', 'credentials', 'credenciais', 'password', 'senha'];
    
    logger.log('🔍 Verificando tabelas no Supabase...\n');
    
    for (const tableName of tableNames) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error && data !== null) {
          logger.log(`✅ Tabela "${tableName}" encontrada!`);
          if (data.length > 0) {
            logger.log('📋 Estrutura da primeira linha:');
            logger.log(JSON.stringify(data[0], null, 2));
          } else {
            logger.log('⚠️ Tabela existe mas está vazia');
          }
          return tableName;
        }
      } catch (err) {
        // Ignora erros de tabela não encontrada
      }
    }
    
    logger.log('❌ Nenhuma tabela conhecida encontrada');
    logger.log('💡 Dica: Verifique o nome da sua tabela no Supabase e atualize o código');
    return null;
  } catch (error) {
    logger.error('Erro ao verificar tabelas:', error);
    return null;
  }
}

/**
 * Lista todas as colunas de uma tabela (se possível)
 */
export async function getTableStructure(tableName: string) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      logger.error(`Erro ao buscar estrutura da tabela ${tableName}:`, error);
      return null;
    }
    
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      logger.log(`📊 Colunas da tabela "${tableName}":`);
      columns.forEach(col => {
        logger.log(`  - ${col}: ${typeof data[0][col]}`);
      });
      return columns;
    }
    
    return null;
  } catch (error) {
    logger.error('Erro ao obter estrutura da tabela:', error);
    return null;
  }
}


