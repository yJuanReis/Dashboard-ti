import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function corrigirCSV(inputPath, outputPath) {
  const conteudo = fs.readFileSync(inputPath, 'utf8');
  const linhas = conteudo.split('\n');

  const linhasCorrigidas = linhas.map(linha => {
    if (!linha.trim()) return linha;

    // Dividir a linha por vírgulas, mas considerando aspas
    const campos = [];
    let campoAtual = '';
    let dentroAspas = false;
    let i = 0;

    while (i < linha.length) {
      const char = linha[i];

      if (char === '"') {
        dentroAspas = !dentroAspas;
        campoAtual += char;
      } else if (char === ',' && !dentroAspas) {
        campos.push(campoAtual);
        campoAtual = '';
      } else {
        campoAtual += char;
      }
      i++;
    }

    // Adicionar o último campo
    campos.push(campoAtual);

    // Corrigir campos que precisam de aspas
    const camposCorrigidos = campos.map(campo => {
      // Se o campo contém vírgula, aspas ou quebras de linha, colocar entre aspas
      if (campo.includes(',') || campo.includes('"') || campo.includes('\n')) {
        // Escapar aspas duplas dentro do campo
        const campoEscapado = campo.replace(/"/g, '""');
        return `"${campoEscapado}"`;
      }
      return campo;
    });

    return camposCorrigidos.join(',');
  });

  const conteudoCorrigido = linhasCorrigidas.join('\n');
  fs.writeFileSync(outputPath, conteudoCorrigido, 'utf8');

  console.log(`CSV corrigido salvo em: ${outputPath}`);
}

const inputPath = path.join(__dirname, '..', 'csv-importação', '2025 - Solicitações de Serviços_ajustado.csv');
const outputPath = path.join(__dirname, '..', 'csv-importação', '2025 - Solicitações de Serviços v2.csv');

corrigirCSV(inputPath, outputPath);