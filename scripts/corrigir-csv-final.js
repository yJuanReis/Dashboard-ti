import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function corrigirCSVFinal(inputPath, outputPath) {
  const conteudo = fs.readFileSync(inputPath, 'utf8');
  const linhas = conteudo.split('\n');

  const linhasCorrigidas = linhas.map(linha => {
    // Remover vírgula final se existir
    if (linha.endsWith(',')) {
      return linha.slice(0, -1);
    }
    return linha;
  });

  const conteudoCorrigido = linhasCorrigidas.join('\n');
  fs.writeFileSync(outputPath, conteudoCorrigido, 'utf8');

  console.log(`CSV corrigido salvo em: ${outputPath}`);
}

// Caminhos dos arquivos
const inputPath = path.join(__dirname, '..', 'csv-importação', '2025 - Solicitações de Serviços v2.csv');
const outputPath = path.join(__dirname, '..', 'csv-importação', '2025 - Solicitações de Serviços v2_corrigido.csv');

corrigirCSVFinal(inputPath, outputPath);