#!/usr/bin/env tsx

/**
 * Script para importar dados CSV das tabelas serviços e produtos
 * Limpa as tabelas existentes e importa dados de 2025
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

// Obter __dirname em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
config({ path: path.join(__dirname, '..', '.env.local') });

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  console.error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Interfaces para os dados
interface ServicoCSV {
  serico?: string; // Note: typo no CSV
  descricao?: string;
  empresa?: string;
  sc?: string;
  data_solocitacao?: string;
  nota_fiscal?: string;
  vencimento?: string;
  valor?: string;
  oc?: string;
  ano?: string;
  situacao?: string;
}

interface ProdutoCSV {
  fornecedor?: string;
  produto?: string;
  informacoes?: string;
  empresa?: string;
  sc?: string;
  data_sc?: string;
  nota_fiscal?: string;
  vencimento?: string;
  valor?: string;
  oc?: string;
  ano?: string;
  situacao?: string;
}

// Função para formatar valor monetário brasileiro para string simples
function formatarValorMonetario(valorStr: string | undefined): string | undefined {
  if (!valorStr || valorStr.trim() === '') return undefined;

  // Remove R$, espaços e símbolos, mantém apenas números e vírgula/ponto
  const limpo = valorStr.replace(/[R$\s]/g, '').trim();

  // Se já estiver no formato correto (com vírgula), retorna como está
  if (limpo.includes(',')) {
    return limpo;
  }

  // Se for número sem vírgula, converte para formato brasileiro
  const numero = parseFloat(limpo.replace(',', '.'));
  if (!isNaN(numero)) {
    return numero.toFixed(2).replace('.', ',');
  }

  return limpo;
}

// Função para validar e converter data brasileira
function validarDataBrasileira(dataStr: string | undefined): string | undefined {
  if (!dataStr || dataStr.trim() === '') return undefined;

  // Formatos aceitos: dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd
  const formatos = [
    /^(\d{2})\/(\d{2})\/(\d{4})$/,  // dd/mm/yyyy
    /^(\d{2})-(\d{2})-(\d{4})$/,   // dd-mm-yyyy
    /^(\d{4})-(\d{2})-(\d{2})$/    // yyyy-mm-dd
  ];

  for (const formato of formatos) {
    const match = dataStr.match(formato);
    if (match) {
      let dia: string, mes: string, ano: string;

      if (formato === formatos[2]) {
        // yyyy-mm-dd
        [, ano, mes, dia] = match;
      } else {
        // dd/mm/yyyy ou dd-mm-yyyy
        [, dia, mes, ano] = match;
      }

      // Validar ranges
      const diaNum = parseInt(dia, 10);
      const mesNum = parseInt(mes, 10);
      const anoNum = parseInt(ano, 10);

      if (diaNum >= 1 && diaNum <= 31 &&
          mesNum >= 1 && mesNum <= 12 &&
          anoNum >= 2000 && anoNum <= 2030) {
        return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
      }
    }
  }

  console.warn(`⚠️ Data inválida: ${dataStr}`);
  return dataStr; // Retorna como está se não conseguir validar
}

// Função para ler e parsear CSV
function lerCSV<T>(caminhoArquivo: string): T[] {
  try {
    console.log(`📖 Lendo arquivo: ${caminhoArquivo}`);

    if (!fs.existsSync(caminhoArquivo)) {
      throw new Error(`Arquivo não encontrado: ${caminhoArquivo}`);
    }

    const conteudo = fs.readFileSync(caminhoArquivo, 'utf-8');

    // Detectar separador (vírgula ou ponto e vírgula)
    const separador = conteudo.includes(';') ? ';' : ',';

    const registros = parse(conteudo, {
      delimiter: separador,
      skip_empty_lines: true,
      trim: true,
      from_line: 2, // Pular header
      columns: true
    });

    console.log(`✅ ${registros.length} registros encontrados`);
    return registros as T[];
  } catch (error) {
    console.error(`❌ Erro ao ler CSV ${caminhoArquivo}:`, error);
    throw error;
  }
}

// Função para limpar tabelas
async function limparTabelas(): Promise<void> {
  console.log('🧹 Iniciando limpeza das tabelas...');

  try {
    // Fazer backup dos dados atuais (apenas log)
    console.log('📋 Fazendo backup dos dados atuais...');

    const { data: servicosAtuais, error: errorServicos } = await supabase
      .from('servicos')
      .select('*');

    const { data: produtosAtuais, error: errorProdutos } = await supabase
      .from('produtos')
      .select('*');

    if (errorServicos) {
      console.warn('⚠️ Erro ao fazer backup de serviços:', errorServicos);
    } else {
      console.log(`📋 Backup: ${servicosAtuais?.length || 0} serviços`);
    }

    if (errorProdutos) {
      console.warn('⚠️ Erro ao fazer backup de produtos:', errorProdutos);
    } else {
      console.log(`📋 Backup: ${produtosAtuais?.length || 0} produtos`);
    }

    // Limpar tabelas
    console.log('🗑️ Limpando tabela serviços...');
    const { error: deleteServicos } = await supabase
      .from('servicos')
      .delete()
      .neq('id', 0); // Deletar tudo (usando bigint)

    if (deleteServicos) {
      throw new Error(`Erro ao limpar serviços: ${deleteServicos.message}`);
    }

    console.log('🗑️ Limpando tabela produtos...');
    const { error: deleteProdutos } = await supabase
      .from('produtos')
      .delete()
      .neq('id', 0); // Deletar tudo (usando bigint)

    if (deleteProdutos) {
      throw new Error(`Erro ao limpar produtos: ${deleteProdutos.message}`);
    }

    console.log('✅ Tabelas limpas com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao limpar tabelas:', error);
    throw error;
  }
}

// Função para validar SC duplicada por empresa
async function validarSCDuplicada(sc: string, empresa: string, tipo: 'servico' | 'produto'): Promise<boolean> {
  try {
    if (!sc || !sc.trim() || !empresa || !empresa.trim()) {
      return false; // Não validar se campos vazios
    }

    const normalizedSC = sc.trim().replace(/\D/g, '');
    const normalizedEmpresa = empresa.trim().toUpperCase();

    if (!normalizedSC) return false;

    const tabela = tipo === 'servico' ? 'servicos' : 'produtos';

    const { data, error } = await supabase
      .from(tabela)
      .select('id, sc, empresa')
      .eq('empresa', normalizedEmpresa);

    if (error) {
      console.error(`❌ Erro ao validar SC duplicada:`, error);
      return false; // Em caso de erro, permitir continuar
    }

    const duplicada = data?.some(item => {
      if (!item.sc) return false;
      const itemNormalizedSC = item.sc.replace(/\D/g, '');
      return itemNormalizedSC === normalizedSC;
    });

    return duplicada || false;

  } catch (error) {
    console.error('❌ Erro na validação de SC duplicada:', error);
    return false;
  }
}

// Função para importar serviços
async function importarServicos(servicosCSV: ServicoCSV[], dryRun: boolean = false): Promise<{ sucesso: number, erros: number, duplicados: number }> {
  console.log(`🚀 Iniciando importação de serviços (${dryRun ? 'DRY RUN' : 'REAL'})...`);

  let sucesso = 0;
  let erros = 0;
  let duplicados = 0;

  for (let i = 0; i < servicosCSV.length; i++) {
    const linha = servicosCSV[i];
    const numeroLinha = i + 2; // +2 porque CSV começa na linha 1 e pulamos header

    try {
      // Verificar se linha tem dados válidos (não é vazia)
      const valores = Object.values(linha).filter(val => val && val.trim() !== '');
      if (valores.length === 0) {
        console.warn(`⚠️ Linha ${numeroLinha}: Linha vazia, pulando`);
        continue;
      }

      // Mapear campos (corrigindo typo "serico" -> "servico")
      const dadosServico = {
        ano: linha.ano ? parseInt(linha.ano, 10) : undefined,
        servico: linha.serico?.trim().toUpperCase() || undefined, // Correção do typo
        descricao: linha.descricao?.trim().toUpperCase() || undefined,
        empresa: linha.empresa?.trim().toUpperCase() || undefined,
        sc: linha.sc?.trim() || undefined,
        situacao: linha.situacao?.trim().toUpperCase() || 'PAGA',
        data_solicitacao: validarDataBrasileira(linha.data_solocitacao),
        nota_fiscal: linha.nota_fiscal?.trim() || undefined,
        vencimento: validarDataBrasileira(linha.vencimento),
        valor: formatarValorMonetario(linha.valor),
        oc: linha.oc?.trim() || undefined,
      };

      // Validações básicas - verificar se pelo menos serviço ou empresa existem
      if (!dadosServico.servico || !dadosServico.empresa) {
        console.warn(`⚠️ Linha ${numeroLinha}: Campos obrigatórios faltando (servico/empresa)`);
        erros++;
        continue;
      }

      // Verificar SC duplicada
      if (dadosServico.sc && dadosServico.empresa) {
        const scDuplicada = await validarSCDuplicada(dadosServico.sc, dadosServico.empresa, 'servico');
        if (scDuplicada) {
          console.warn(`⚠️ Linha ${numeroLinha}: SC ${dadosServico.sc} já existe para empresa ${dadosServico.empresa}`);
          duplicados++;
          continue;
        }
      }

      if (!dryRun) {
        const { error } = await supabase
          .from('servicos')
          .insert(dadosServico);

        if (error) {
          console.error(`❌ Linha ${numeroLinha}: Erro ao inserir - ${error.message}`);
          erros++;
          continue;
        }
      }

      console.log(`✅ Linha ${numeroLinha}: ${dadosServico.servico} (${dadosServico.empresa})`);
      sucesso++;

    } catch (error) {
      console.error(`❌ Linha ${numeroLinha}: Erro inesperado -`, error);
      erros++;
    }
  }

  console.log(`📊 Serviços - Sucesso: ${sucesso}, Erros: ${erros}, Duplicados: ${duplicados}`);
  return { sucesso, erros, duplicados };
}

// Função para importar produtos
async function importarProdutos(produtosCSV: ProdutoCSV[], dryRun: boolean = false): Promise<{ sucesso: number, erros: number, duplicados: number }> {
  console.log(`🚀 Iniciando importação de produtos (${dryRun ? 'DRY RUN' : 'REAL'})...`);

  let sucesso = 0;
  let erros = 0;
  let duplicados = 0;

  for (let i = 0; i < produtosCSV.length; i++) {
    const linha = produtosCSV[i];
    const numeroLinha = i + 2; // +2 porque CSV começa na linha 1 e pulamos header

    try {
      // Verificar se linha tem dados válidos (não é vazia)
      const valores = Object.values(linha).filter(val => val && val.trim() !== '');
      if (valores.length === 0) {
        console.warn(`⚠️ Linha ${numeroLinha}: Linha vazia, pulando`);
        continue;
      }

      // Mapear campos
      const dadosProduto = {
        ano: linha.ano ? parseInt(linha.ano, 10) : undefined,
        fornecedor: linha.fornecedor?.trim().toUpperCase() || undefined,
        produto: linha.produto?.trim().toUpperCase() || undefined,
        informacoes: linha.informacoes?.trim().toUpperCase() || undefined,
        empresa: linha.empresa?.trim().toUpperCase() || undefined,
        sc: linha.sc?.trim() || undefined,
        situacao: linha.situacao?.trim().toUpperCase() || 'PAGA',
        data_sc: validarDataBrasileira(linha.data_sc),
        nota_fiscal: linha.nota_fiscal?.trim() || undefined,
        vencimento: validarDataBrasileira(linha.vencimento),
        valor: formatarValorMonetario(linha.valor),
        oc: linha.oc?.trim() || undefined,
      };

      // Validações básicas - verificar se pelo menos produto, empresa ou SC existem
      if (!dadosProduto.produto && !dadosProduto.empresa && !dadosProduto.sc) {
        console.warn(`⚠️ Linha ${numeroLinha}: Campos obrigatórios faltando (produto/empresa/sc)`);
        erros++;
        continue;
      }

      // Verificar SC duplicada
      if (dadosProduto.sc && dadosProduto.empresa) {
        const scDuplicada = await validarSCDuplicada(dadosProduto.sc, dadosProduto.empresa, 'produto');
        if (scDuplicada) {
          console.warn(`⚠️ Linha ${numeroLinha}: SC ${dadosProduto.sc} já existe para empresa ${dadosProduto.empresa}`);
          duplicados++;
          continue;
        }
      }

      if (!dryRun) {
        const { error } = await supabase
          .from('produtos')
          .insert(dadosProduto);

        if (error) {
          console.error(`❌ Linha ${numeroLinha}: Erro ao inserir - ${error.message}`);
          erros++;
          continue;
        }
      }

      console.log(`✅ Linha ${numeroLinha}: ${dadosProduto.produto} (${dadosProduto.empresa})`);
      sucesso++;

    } catch (error) {
      console.error(`❌ Linha ${numeroLinha}: Erro inesperado -`, error);
      erros++;
    }
  }

  console.log(`📊 Produtos - Sucesso: ${sucesso}, Erros: ${erros}, Duplicados: ${duplicados}`);
  return { sucesso, erros, duplicados };
}

// Função principal
async function main() {
  console.log('🚀 Iniciando importação CSV dos dados de 2025\n');

  const dryRun = process.argv.includes('--dry-run');
  const skipCleanup = process.argv.includes('--skip-cleanup');

  if (dryRun) {
    console.log('🔍 MODO DRY RUN - Nenhuma alteração será feita no banco\n');
  }

  try {
    // Verificar se arquivos existem
    const caminhoProdutos = path.join(__dirname, '..', 'csv-importação', '2025 - Solicitações de Produtos.csv');
    const caminhoServicos = path.join(__dirname, '..', 'csv-importação', '2025 - Solicitações de Serviços.csv');

    console.log('📂 Verificando arquivos CSV...');
    console.log(`   Produtos: ${caminhoProdutos}`);
    console.log(`   Serviços: ${caminhoServicos}\n`);

    // Limpar tabelas (se não for dry-run e não skip)
    if (!dryRun && !skipCleanup) {
      await limparTabelas();
      console.log('');
    } else if (skipCleanup) {
      console.log('⏭️ Pulando limpeza das tabelas (--skip-cleanup)\n');
    }

    // Ler CSVs
    console.log('📖 Lendo arquivos CSV...');
    const produtosCSV = lerCSV<ProdutoCSV>(caminhoProdutos);
    const servicosCSV = lerCSV<ServicoCSV>(caminhoServicos);
    console.log('');

    // Importar dados
    const resultadoServicos = await importarServicos(servicosCSV, dryRun);
    console.log('');
    const resultadoProdutos = await importarProdutos(produtosCSV, dryRun);
    console.log('');

    // Relatório final
    console.log('📊 RELATÓRIO FINAL');
    console.log('==================');
    console.log(`Serviços: ${resultadoServicos.sucesso} importados, ${resultadoServicos.erros} erros, ${resultadoServicos.duplicados} duplicados`);
    console.log(`Produtos: ${resultadoProdutos.sucesso} importados, ${resultadoProdutos.erros} erros, ${resultadoProdutos.duplicados} duplicados`);
    console.log(`Total: ${resultadoServicos.sucesso + resultadoProdutos.sucesso} registros importados`);

    if (dryRun) {
      console.log('\n🔍 DRY RUN concluído! Execute sem --dry-run para importar realmente.');
    } else {
      console.log('\n✅ Importação concluída com sucesso!');
    }

  } catch (error) {
    console.error('❌ Erro fatal na importação:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
main().catch(console.error);

export { main as importarCSVs };