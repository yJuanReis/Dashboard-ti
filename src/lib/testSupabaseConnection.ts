// Script de teste para verificar a conexão com o Supabase
// Use isso no console do navegador para testar sua tabela

import { supabase } from './supabaseClient';
import { PASSWORDS_CONFIG } from './passwordsConfig';

/**
 * Testa a conexão com o Supabase e verifica se a tabela existe
 * Execute isso no console do navegador: window.testSupabase()
 */
export async function testSupabaseConnection() {
  console.log('🔍 Testando conexão com o Supabase...\n');
  console.log(`📋 Tabela configurada: "${PASSWORDS_CONFIG.tableName}"\n`);

  try {
    // Tenta buscar dados da tabela
    const { data, error } = await supabase
      .from(PASSWORDS_CONFIG.tableName)
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Erro ao acessar a tabela:', error);
      console.log('\n💡 Possíveis soluções:');
      console.log('1. Verifique o nome da tabela em src/lib/passwordsConfig.ts');
      console.log('2. Verifique se a tabela existe no Supabase Dashboard');
      console.log('3. Verifique as políticas RLS (Row Level Security) no Supabase');
      return false;
    }

    console.log('✅ Tabela encontrada!');
    
    if (data && data.length > 0) {
      console.log('\n📊 Estrutura da primeira linha:');
      console.log(JSON.stringify(data[0], null, 2));
      
      console.log('\n📋 Colunas encontradas:');
      Object.keys(data[0]).forEach(col => {
        console.log(`  - ${col}: ${typeof data[0][col]}`);
      });
      
      console.log('\n🔍 Verificando mapeamento de campos...');
      const mapping = PASSWORDS_CONFIG.fieldMapping;
      const row = data[0];
      
      const requiredFields = ['id', 'service', 'category'];
      const missingFields: string[] = [];
      
      requiredFields.forEach(field => {
        const mappedField = mapping[field as keyof typeof mapping];
        if (!row[mappedField]) {
          missingFields.push(`${field} (mapeado para "${mappedField}")`);
        }
      });
      
      if (missingFields.length > 0) {
        console.warn('⚠️ Campos obrigatórios não encontrados:');
        missingFields.forEach(field => console.warn(`  - ${field}`));
        console.log('\n💡 Ajuste o mapeamento em src/lib/passwordsConfig.ts');
      } else {
        console.log('✅ Todos os campos obrigatórios estão mapeados corretamente!');
      }
    } else {
      console.log('⚠️ Tabela existe mas está vazia');
      console.log('💡 Adicione alguns dados no Supabase Dashboard');
    }

    return true;
  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error);
    return false;
  }
}

// Disponibiliza a função globalmente para uso no console
if (typeof window !== 'undefined') {
  (window as any).testSupabase = testSupabaseConnection;
}


