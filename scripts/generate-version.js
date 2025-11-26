import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

try {
  // Detecta se está rodando em um hook pre-commit
  const isPreCommit = process.env.GIT_HOOK === 'pre-commit' || process.argv.includes('--pre-commit');
  
  // Detecta se está rodando em CI (Vercel, GitHub Actions, etc)
  // Vercel define várias variáveis de ambiente, verificamos todas
  const isCI = process.env.CI === 'true' || 
               process.env.VERCEL === '1' || 
               process.env.VERCEL_ENV !== undefined ||
               process.env.VERCEL_URL !== undefined ||
               process.env.VERCEL_REGION !== undefined;
  
  // Conta o número total de commits no repositório
  let commitCount = execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim();
  
  // Se estiver em pre-commit, adiciona 1 para contar o commit que está sendo feito
  if (isPreCommit) {
    commitCount = (parseInt(commitCount, 10) + 1).toString();
  }
  
  // Pega o hash do commit atual (primeiros 7 caracteres)
  // Em pre-commit, ainda não temos o hash do novo commit, então usamos o atual
  const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  
  // Pega a data do último commit (ou data atual se for pre-commit)
  let commitDate;
  try {
    commitDate = execSync('git log -1 --format=%ci', { encoding: 'utf-8' }).trim();
  } catch {
    // Se não houver commits ainda, usa a data atual
    commitDate = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' -0300';
  }
  
  // Se estiver em pre-commit, usa a data atual
  if (isPreCommit) {
    const now = new Date();
    const offset = -now.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const hours = Math.floor(Math.abs(offset) / 60).toString().padStart(2, '0');
    const minutes = (Math.abs(offset) % 60).toString().padStart(2, '0');
    commitDate = now.toISOString().replace('T', ' ').substring(0, 19) + ` ${sign}${hours}${minutes}`;
  }
  
  // Formata a versão: 1.{minor}.{patch}
  // Quando passa de 10 commits, incrementa o minor e usa o resto como patch
  const commitCountNum = parseInt(commitCount, 10);
  const minor = Math.floor(commitCountNum / 10);
  const patch = commitCountNum % 10;
  const patchFormatted = patch.toString().padStart(2, '0');
  const version = `1.${minor}.${patchFormatted}`;
  
  // Verifica se já existe uma versão commitada e se está correta
  const versionPath = resolve(process.cwd(), 'src/lib/version.json');
  let shouldUpdate = true;
  
  // Em CI (Vercel), SEMPRE atualiza para garantir que a versão está correta
  // Em desenvolvimento local, verifica se precisa atualizar
  if (existsSync(versionPath) && !isPreCommit && !isCI) {
    try {
      const existingVersion = JSON.parse(readFileSync(versionPath, 'utf-8'));
      // Se a versão existente corresponde aos commits atuais, não precisa atualizar
      if (existingVersion.commitCount === parseInt(commitCount, 10) && 
          existingVersion.commitHash === commitHash) {
        shouldUpdate = false;
        console.log(`✅ Versão já está atualizada: ${existingVersion.version} (${existingVersion.commitCount} commits)`);
      }
    } catch (e) {
      // Se não conseguir ler o arquivo, continua e atualiza
    }
  }
  
  // Em CI, sempre atualiza (ignora a verificação acima)
  if (isCI) {
    shouldUpdate = true;
    console.log(`🔄 CI detectado! Variáveis: VERCEL=${process.env.VERCEL}, VERCEL_ENV=${process.env.VERCEL_ENV}, CI=${process.env.CI}`);
    console.log(`🔄 Atualizando versão baseada nos commits do repositório...`);
  }
  
  if (shouldUpdate) {
    // Cria o objeto de versão
    const versionInfo = {
      version,
      commitCount: parseInt(commitCount, 10),
      commitHash,
      commitDate,
      buildDate: new Date().toISOString()
    };
    
    // Escreve o arquivo de versão em JSON
    writeFileSync(versionPath, JSON.stringify(versionInfo, null, 2), 'utf-8');
    
    // Atualiza o package.json
    const packageJsonPath = resolve(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    packageJson.version = version;
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');
    
    if (isPreCommit) {
      console.log(`✅ Versão atualizada para commit: ${version} (${commitCount} commits após este commit)`);
    } else {
      console.log(`✅ Versão gerada: ${version} (${commitCount} commits)`);
      console.log(`   Commit: ${commitHash}`);
      console.log(`   Data: ${commitDate}`);
    }
  }
  
} catch (error) {
  console.error('❌ Erro ao gerar versão:', error.message);
  // Fallback: cria uma versão padrão se não conseguir acessar o git
  const fallbackVersion = {
    version: '1.0.0',
    commitCount: 0,
    commitHash: 'unknown',
    commitDate: new Date().toISOString(),
    buildDate: new Date().toISOString()
  };
  
  const versionPath = resolve(process.cwd(), 'src/lib/version.json');
  writeFileSync(versionPath, JSON.stringify(fallbackVersion, null, 2), 'utf-8');
  console.log('⚠️  Versão padrão criada (git não disponível)');
}

