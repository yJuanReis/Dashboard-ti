const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '../csv-importação/2025 - Solicitações de Serviços.csv');
const outputFile = path.join(__dirname, '../csv-importação/2025 - Solicitações de Serviços_ajustado.csv');

// Função para parsear CSV simples considerando aspas
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current); // último campo
  return result;
}

console.log('Lendo arquivo CSV...');
const content = fs.readFileSync(inputFile, 'utf-8');
const lines = content.split('\n');

if (lines.length === 0) {
  console.error('Arquivo vazio');
  process.exit(1);
}

// Processar cabeçalho
const oldHeader = lines[0].trim();
console.log('Cabeçalho original:', oldHeader);

const newHeader = 'ano,servico,descricao,empresa,sc,data_solicitacao,nota_fiscal,vencimento,valor,oc,situacao';
console.log('Novo cabeçalho:', newHeader);

// Mapear índices antigos para novos
const oldColumns = parseCSVLine(oldHeader);
console.log('Colunas encontradas:', oldColumns.length, oldColumns);

// Índice das colunas no arquivo original
const anoIndex = oldColumns.indexOf('ano');
const servicoIndex = oldColumns.indexOf('servico');
const descricaoIndex = oldColumns.indexOf('descricao');
const empresaIndex = oldColumns.indexOf('empresa');
const scIndex = oldColumns.indexOf('sc');
const dataSolicitacaoIndex = oldColumns.indexOf('data_solocitacao');
const notaFiscalIndex = oldColumns.indexOf('nota_fiscal');
const vencimentoIndex = oldColumns.indexOf('vencimento');
const valorIndex = oldColumns.indexOf('valor');
const ocIndex = oldColumns.indexOf('oc');
const situacaoIndex = oldColumns.indexOf('situacao');

console.log('Índices encontrados:');
console.log('ano:', anoIndex);
console.log('servico:', servicoIndex);
console.log('descricao:', descricaoIndex);
console.log('empresa:', empresaIndex);
console.log('sc:', scIndex);
console.log('data_solicitacao:', dataSolicitacaoIndex);
console.log('nota_fiscal:', notaFiscalIndex);
console.log('vencimento:', vencimentoIndex);
console.log('valor:', valorIndex);
console.log('oc:', ocIndex);
console.log('situacao:', situacaoIndex);

console.log('Processando', lines.length, 'linhas...');

const newLines = [newHeader];
let processedLines = 0;

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const values = parseCSVLine(line);

  if (values.length !== oldColumns.length) {
    console.warn(`Linha ${i + 1} tem ${values.length} colunas, esperado ${oldColumns.length}`);
    console.log('Linha:', line.substring(0, 100));
    continue;
  }

  // Reordenar valores conforme novo esquema
  const reorderedValues = [
    values[anoIndex],           // ano
    values[servicoIndex],       // servico
    values[descricaoIndex],     // descricao
    values[empresaIndex],       // empresa
    values[scIndex],           // sc
    values[dataSolicitacaoIndex], // data_solicitacao
    values[notaFiscalIndex],    // nota_fiscal
    values[vencimentoIndex],    // vencimento
    values[valorIndex],         // valor
    values[ocIndex],           // oc
    values[situacaoIndex]      // situacao
  ];

  newLines.push(reorderedValues.join(','));
  processedLines++;
}

console.log('Escrevendo arquivo ajustado...');
fs.writeFileSync(outputFile, newLines.join('\n'), 'utf-8');

console.log('Arquivo ajustado criado:', outputFile);
console.log('Linhas processadas:', processedLines);