#!/usr/bin/env node

/**
 * Script de configuração do CI/CD
 * Facilita a configuração inicial do sistema de versionamento e deploy automático
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Configurando sistema CI/CD...\n');

// Verifica se estamos na raiz do projeto
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Execute este script na raiz do projeto (onde está o package.json)');
  process.exit(1);
}

// Verifica se é um repositório git
try {
  execSync('git rev-parse --git-dir', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ Este não é um repositório git válido');
  process.exit(1);
}

console.log('✅ Repositório git detectado');

// Verifica se o Node.js está instalado
try {
  execSync('node --version', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ Node.js não está instalado ou não está no PATH');
  process.exit(1);
}

console.log('✅ Node.js detectado');

// Verifica se os scripts necessários existem
const requiredFiles = [
  'scripts/generate-version.js',
  'src/lib/version.ts',
  'src/lib/version.json'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Arquivo necessário não encontrado: ${file}`);
    process.exit(1);
  }
}

console.log('✅ Arquivos necessários encontrados');

// Configura permissões dos hooks
const hooksDir = path.join(process.cwd(), '.git', 'hooks');
const prePushHook = path.join(hooksDir, 'pre-push');

if (fs.existsSync(prePushHook)) {
  try {
    fs.chmodSync(prePushHook, '755');
    console.log('✅ Permissões do hook pre-push configuradas');
  } catch (error) {
    console.warn('⚠️  Não foi possível configurar permissões do hook pre-push');
    console.warn('   Execute manualmente: chmod +x .git/hooks/pre-push');
  }
} else {
  console.warn('⚠️  Hook pre-push não encontrado. Ele será criado automaticamente no primeiro push.');
}

// Executa o script de geração de versão
console.log('\n🔄 Gerando versão inicial...');
try {
  execSync('node scripts/generate-version.js', { stdio: 'inherit' });
  console.log('✅ Versão inicial gerada');
} catch (error) {
  console.error('❌ Erro ao gerar versão inicial:', error.message);
  process.exit(1);
}

// Verifica se o workflow do GitHub Actions existe
const workflowPath = path.join(process.cwd(), '.github', 'workflows', 'ci-cd.yml');
if (fs.existsSync(workflowPath)) {
  console.log('✅ Workflow do GitHub Actions encontrado');
} else {
  console.warn('⚠️  Workflow do GitHub Actions não encontrado');
  console.warn('   Crie o arquivo .github/workflows/ci-cd.yml');
}

// Verifica se o projeto está configurado no Vercel
const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
if (fs.existsSync(vercelJsonPath)) {
  console.log('✅ Configuração do Vercel encontrada');
} else {
  console.warn('⚠️  Configuração do Vercel não encontrada');
  console.warn('   Crie o arquivo vercel.json na raiz do projeto');
}

console.log('\n🎉 Configuração CI/CD concluída!');
console.log('\n📋 Próximos passos:');
console.log('1. Configure os secrets no GitHub (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)');
console.log('2. Configure as variáveis de ambiente no Vercel');
console.log('3. Faça seu primeiro push para testar o sistema');
console.log('4. Acesse a página de configurações como admin para ver a versão atual');

console.log('\n📖 Para mais informações, consulte a documentação em docs/md/deploy/');

// Verifica se deve fazer commit inicial
const hasChanges = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
if (hasChanges) {
  console.log('\n📝 Detectadas mudanças não commitadas');
  console.log('   Considere fazer commit delas antes do primeiro push');
}

console.log('\n✨ Sistema pronto! Toda vez que você fizer push, a versão será atualizada automaticamente no site.');
