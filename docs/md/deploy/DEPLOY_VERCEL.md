# 🚀 Guia de Deploy no Vercel

Este guia explica como fazer o deploy deste projeto no Vercel.

## 📋 Pré-requisitos

1. Conta no [Vercel](https://vercel.com)
2. Projeto no [Supabase](https://supabase.com)
3. Repositório Git (GitHub, GitLab ou Bitbucket)

## 🔧 Configuração no Vercel

### 1. Conectar o Repositório

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Clique em **Add New Project**
3. Importe seu repositório Git
4. O Vercel detectará automaticamente que é um projeto Vite

### 2. Configurar Variáveis de Ambiente

**⚠️ IMPORTANTE**: Configure as variáveis de ambiente no Vercel antes de fazer o deploy!

1. Na página de configuração do projeto, vá em **Environment Variables**
2. Adicione as seguintes variáveis:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

**Onde encontrar essas informações:**
- Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
- Vá em **Settings** > **API**
- Copie a **URL** (Project URL)
- Copie a **anon/public key**

### 3. Configurações do Build

O Vercel detecta automaticamente projetos Vite, mas você pode verificar:

- **Framework Preset**: Vite
- **Build Command**: `npm run build` (ou `bun run build`)
- **Output Directory**: `dist`
- **Install Command**: `npm install` (ou `bun install`)

### 4. Deploy

1. Clique em **Deploy**
2. Aguarde o build completar
3. Seu projeto estará disponível em `https://seu-projeto.vercel.app`

## 🔄 Atualizações Automáticas

Após a primeira configuração, cada push para o repositório Git irá:
- Disparar um novo deploy automaticamente
- Criar uma preview URL para Pull Requests
- Fazer deploy na branch principal (geralmente `main` ou `master`)

## ✅ Verificação Pós-Deploy

Após o deploy, verifique:

1. **Aplicação carrega corretamente**: Acesse a URL do Vercel
2. **Login funciona**: Teste o login com suas credenciais do Supabase
3. **Conexão com Supabase**: Verifique se os dados são carregados corretamente

## 🐛 Troubleshooting

### Erro: "VITE_SUPABASE_URL não está definida"

**Solução:**
- Verifique se as variáveis de ambiente foram configuradas no Vercel
- Certifique-se de que os nomes estão corretos: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- Faça um novo deploy após adicionar as variáveis

### Erro de Build

**Solução:**
- Verifique os logs do build no Vercel Dashboard
- Certifique-se de que todas as dependências estão no `package.json`
- Teste o build localmente: `npm run build`

### Problemas de Roteamento (404 em rotas)

O `vercel.json` já está configurado para SPA (Single Page Application), mas se houver problemas:

1. Verifique se o arquivo `vercel.json` está na raiz do projeto
2. O arquivo deve conter:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## 🔐 Segurança

- ✅ **NUNCA** commite arquivos `.env` ou `.env.local` no Git
- ✅ Use apenas `VITE_SUPABASE_ANON_KEY` (chave pública) no frontend
- ❌ **NUNCA** use `VITE_SUPABASE_SERVICE_ROLE_KEY` no frontend
- ✅ Configure as variáveis de ambiente diretamente no Vercel Dashboard

## 📚 Recursos Adicionais

- [Documentação do Vercel](https://vercel.com/docs)
- [Documentação do Supabase](https://supabase.com/docs)
- [Documentação do Vite](https://vitejs.dev)

