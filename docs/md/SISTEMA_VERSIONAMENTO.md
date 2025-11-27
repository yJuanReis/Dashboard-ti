# 📦 Sistema de Versionamento Baseado em Commits

Este documento explica como funciona o sistema de versionamento automático baseado no número de commits do Git.

## 🎯 Como Funciona

O sistema conta automaticamente o número total de commits no repositório Git e usa esse número para gerar a versão do sistema no formato `1.0.{número_de_commits}`.

### Exemplo:
- Se você tem **15 commits**, a versão será: `1.0.15`
- Se você tem **100 commits**, a versão será: `1.0.100`

## 📁 Arquivos Criados

### 1. `scripts/generate-version.js`
Script Node.js que:
- Conta o número total de commits usando `git rev-list --count HEAD`
- Obtém o hash do commit atual (7 caracteres)
- Obtém a data do último commit
- Gera o arquivo `src/lib/version.json` com todas as informações
- Atualiza o `package.json` com a versão

### 2. `src/lib/version.json`
Arquivo JSON gerado automaticamente contendo:
```json
{
  "version": "1.0.15",
  "commitCount": 15,
  "commitHash": "b5bc886",
  "commitDate": "2025-11-24 09:31:00 -0300",
  "buildDate": "2025-11-24T19:22:48.729Z"
}
```

### 3. `src/lib/version.ts`
Módulo TypeScript que exporta:
- `version`: Objeto completo com todas as informações
- `getVersionString()`: Retorna a versão formatada (ex: `1.0.15 (b5bc886)`)
- `getVersionInfo()`: Retorna todas as informações da versão

## 🚀 Como Usar

### Gerar Versão Manualmente

```bash
npm run version
```

### Build Automático

A versão é gerada automaticamente antes de cada build:

```bash
npm run build
```

O script `prebuild` no `package.json` executa automaticamente `npm run version` antes do build.

### Usar na Aplicação

```typescript
import { getVersionString, getVersionInfo } from "@/lib/version";

// Obter versão formatada
const versionString = getVersionString(); // "1.0.15 (b5bc886)"

// Obter todas as informações
const versionInfo = getVersionInfo();
console.log(versionInfo.version);      // "1.0.15"
console.log(versionInfo.commitCount);  // 15
console.log(versionInfo.commitHash);    // "b5bc886"
console.log(versionInfo.commitDate);    // "2025-11-24 09:31:00 -0300"
console.log(versionInfo.buildDate);     // "2025-11-24T19:22:48.729Z"
```

## 📍 Onde a Versão é Exibida

A versão é exibida na página de **Configurações** (`/configuracoes`), na seção "Informações do Sistema", mostrando:
- **Versão**: `1.0.15 (b5bc886)`
- **Commits**: `15`

## ⚙️ Configuração no package.json

```json
{
  "scripts": {
    "version": "node scripts/generate-version.js",
    "prebuild": "npm run version",
    "build": "vite build"
  }
}
```

## 🔧 Fallback

Se o Git não estiver disponível (por exemplo, em ambientes sem Git instalado), o script cria uma versão padrão:
- Versão: `1.0.0`
- Commit Count: `0`
- Commit Hash: `unknown`

## 📝 Notas Importantes

1. **A versão é atualizada automaticamente** antes de cada build
2. **O arquivo `version.json` é gerado automaticamente** e não deve ser editado manualmente
3. **A versão no `package.json` é atualizada** automaticamente pelo script
4. **O número de commits inclui TODOS os commits** do histórico do repositório, não apenas da branch atual

## 🎨 Personalização

Se você quiser mudar o formato da versão, edite o arquivo `scripts/generate-version.js`:

```javascript
// Formato atual: 1.0.{commitCount}
const version = `1.0.${commitCount}`;

// Exemplo alternativo: 0.{commitCount}.0
const version = `0.${commitCount}.0`;

// Exemplo alternativo: {major}.{minor}.{commitCount}
const major = 2;
const minor = 1;
const version = `${major}.${minor}.${commitCount}`;
```

