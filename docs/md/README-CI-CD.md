# 🚀 Sistema CI/CD - Deploy Automático

Este projeto possui um sistema completo de **Integração Contínua (CI) e Deploy Contínuo (CD)** que atualiza automaticamente a versão do site sempre que você faz push para o GitHub.

## ✨ Funcionalidades

- ✅ **Versionamento automático** baseado na contagem de commits
- ✅ **Deploy automático** no Vercel a cada push
- ✅ **Hook pre-push** que atualiza versão antes do envio
- ✅ **GitHub Actions** para CI/CD completo
- ✅ **Display de versão** na página de configurações (admins)
- ✅ **Criação automática de releases** no GitHub

## 🔧 Como Funciona

### Fluxo Automático:
1. **Desenvolvimento**: Você trabalha normalmente no código
2. **Commit**: Faz commit das mudanças
3. **Push**: GitHub Actions detecta o push
4. **Versionamento**: Hook pre-push atualiza a versão automaticamente
5. **Build**: GitHub Actions executa testes e build
6. **Deploy**: Vercel faz deploy automático
7. **Release**: GitHub cria release automaticamente

### Versionamento:
- Formato: `1.{commits/10}.{commits%10}`
- Exemplo: Com 79 commits → `1.7.09`
- Contagem baseada no histórico completo do repositório

## 🚀 Configuração Inicial

### 1. Executar Setup Automático
```bash
npm run setup-ci-cd
```

Este comando irá:
- ✅ Verificar se tudo está configurado corretamente
- ✅ Configurar permissões dos hooks
- ✅ Gerar versão inicial
- ✅ Verificar arquivos necessários

### 2. Configurar Secrets no GitHub

Acesse **Settings → Secrets and variables → Actions** no seu repositório e adicione:

```
VERCEL_TOKEN=seu_token_do_vercel
VERCEL_ORG_ID=seu_org_id_do_vercel
VERCEL_PROJECT_ID=seu_project_id_do_vercel
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

**Como obter os tokens do Vercel:**
1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá em **Account Settings → Tokens**
3. Crie um novo token
4. Para ORG_ID e PROJECT_ID, use a API do Vercel ou veja no dashboard

### 3. Primeiro Push

```bash
# Fazer suas mudanças
git add .
git commit -m "feat: primeira implementação com CI/CD"

# Push - a versão será atualizada automaticamente
git push origin main
```

## 📊 Monitoramento

### Na Página de Configurações (apenas admins):
- ✅ **Versão atual** (ex: `1.7.09 (97b2e17)`)
- ✅ **Commit hash** do último commit
- ✅ **Contador de commits** total
- ✅ **Data do último build**
- ✅ **Data do último commit**

### No GitHub:
- ✅ **Actions**: Status de todos os builds
- ✅ **Releases**: Histórico de versões implantadas
- ✅ **Commits**: Histórico completo com versões

## 🔧 Comandos Úteis

```bash
# Ver versão atual
npm run version

# Setup completo do CI/CD
npm run setup-ci-cd

# Build de desenvolvimento
npm run build:dev

# Build de produção
npm run build
```

## 🛠️ Arquivos de Configuração

- `.github/workflows/ci-cd.yml` - Pipeline do GitHub Actions
- `.git/hooks/pre-push` - Hook que atualiza versão antes do push
- `scripts/generate-version.js` - Script de geração de versão
- `scripts/setup-ci-cd.js` - Setup automatizado
- `src/lib/version.ts` - Utilitários de versão
- `vercel.json` - Configuração do Vercel

## 📝 Como as Versões São Calculadas

```javascript
// Exemplo com 79 commits:
const commitCount = 79;
const minor = Math.floor(79 / 10); // 7
const patch = 79 % 10; // 9
const version = `1.${minor}.${patch}`; // "1.7.09"
```

## 🚨 Troubleshooting

### Hook pre-push não funciona:
```bash
# Configurar permissões manualmente
chmod +x .git/hooks/pre-push

# Ou executar setup novamente
npm run setup-ci-cd
```

### Build falha no GitHub Actions:
- Verifique os secrets configurados
- Verifique se as variáveis de ambiente estão corretas
- Veja os logs detalhados no Actions tab

### Deploy não acontece:
- Verifique se o workflow está sendo executado
- Confirme se a branch está correta (main/master)
- Verifique configuração do Vercel

## 🎯 Benefícios

- **Automação completa**: Push = Deploy automático
- **Versionamento consistente**: Baseado em commits reais
- **Histórico rastreável**: Todas as versões documentadas
- **Feedback imediato**: Status visual no GitHub
- **Segurança**: Apenas admins veem informações detalhadas

## 📞 Suporte

Se tiver problemas:
1. Execute `npm run setup-ci-cd` para diagnóstico
2. Verifique os logs do GitHub Actions
3. Consulte a documentação em `docs/md/deploy/`

---

**🎉 Pronto!** Agora toda vez que você fizer push, o site será automaticamente atualizado com a nova versão.
