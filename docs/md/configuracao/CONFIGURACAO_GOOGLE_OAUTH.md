# Configuração de Autenticação com Google OAuth

Este guia explica como configurar a autenticação com Google no seu projeto usando Supabase.

## 📋 Pré-requisitos

1. Conta no Google Cloud Platform (https://console.cloud.google.com)
2. Projeto Supabase configurado
3. Acesso ao Dashboard do Supabase

## 🔧 Passo a Passo

### 1. Configuração no Google Cloud Platform

#### 1.1 Criar um Projeto

1. Acesse o [Google Cloud Console](https://console.cloud.google.com)
2. Clique em **Selecionar um projeto** > **Novo projeto**
3. Dê um nome ao projeto (ex: "Dashboard TI Auth")
4. Clique em **Criar**

#### 1.2 Configurar a Tela de Consentimento OAuth

1. No menu lateral, vá em **APIs e Serviços** > **Tela de consentimento OAuth**
2. Escolha **Externo** (para desenvolvimento) ou **Interno** (apenas para Workspace Google)
3. Clique em **Criar**
4. Preencha os campos obrigatórios:
   - **Nome do aplicativo**: Nome do seu app (ex: "Dashboard TI")
   - **Email de suporte do usuário**: Seu email
   - **Email de contato do desenvolvedor**: Seu email
5. Clique em **Salvar e continuar**
6. Na tela de **Escopos**, clique em **Salvar e continuar** (pode deixar os escopos padrão)
7. Na tela de **Usuários de teste**, adicione emails de teste se necessário
8. Clique em **Salvar e continuar**

#### 1.3 Criar Credenciais OAuth

1. Vá em **APIs e Serviços** > **Credenciais**
2. Clique em **+ Criar credenciais** > **ID do cliente OAuth**
3. Configure:
   - **Tipo de aplicativo**: Aplicativo da Web
   - **Nome**: Nome descritivo (ex: "Dashboard TI Web Client")
4. Em **Origens JavaScript autorizadas**, adicione:
   - `https://<seu-id-projeto>.supabase.co`
   - Exemplo: `https://abcdefghijklm.supabase.co`
5. Em **URIs de redirecionamento autorizados**, adicione:
   - `https://<seu-id-projeto>.supabase.co/auth/v1/callback`
   - Exemplo: `https://abcdefghijklm.supabase.co/auth/v1/callback`
6. Clique em **Criar**
7. **IMPORTANTE**: Copie o **ID do Cliente** e a **Chave Secreta do Cliente** - você precisará deles no próximo passo

### 2. Configuração no Supabase Dashboard

#### 2.1 Habilitar Provider Google

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Authentication** > **Providers**
3. Encontre **Google** na lista e clique para expandir
4. Ative o toggle **Enable Google provider**
5. Cole o **Client ID** e **Client Secret** que você copiou do Google Cloud Console
6. Clique em **Save**

#### 2.2 Configurar URLs de Redirecionamento

1. Ainda no Supabase Dashboard, vá em **Authentication** > **URL Configuration**
2. Em **Site URL**, adicione sua URL de produção:
   - Exemplo: `https://meu-app.vercel.app`
3. Em **Redirect URLs**, adicione:
   - `http://localhost:5173` (ou a porta que seu Vite usa localmente)
   - `http://localhost:5173/home` (página de destino após login)
   - `https://meu-app.vercel.app` (URL de produção)
   - `https://meu-app.vercel.app/home` (página de destino após login em produção)
4. Clique em **Save**

### 3. Como Funciona o Fluxo (Popup)

O login com Google usa um **popup** para não redirecionar a página atual:

1. **Usuário clica em "Entrar com Google"** no seu site
2. **Seu código chama** `signInWithGoogle()` do AuthContext
3. **Um popup é aberto** com a página de login do Google
4. **Usuário faz login** no Google e aceita as permissões (dentro do popup)
5. **Google redireciona** o popup de volta para o Supabase com um token
6. **Supabase valida** o token e cria uma sessão
7. **O código detecta** a nova sessão e fecha o popup automaticamente
8. **O `onAuthStateChange`** no AuthContext detecta a mudança e atualiza o estado
9. **Usuário permanece na mesma página** (sem redirecionamento)

### 4. Testando Localmente

1. Certifique-se de que suas variáveis de ambiente estão configuradas:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon
   ```

2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Acesse `http://localhost:5173`
4. Clique no botão do Google
5. Faça login com uma conta Google
6. Você deve ser redirecionado de volta para `/home`

### 5. Deploy na Vercel

1. Certifique-se de que as variáveis de ambiente estão configuradas na Vercel:
   - Vá em **Settings** > **Environment Variables**
   - Adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`

2. Após o deploy, atualize as URLs no Supabase:
   - Adicione a URL da Vercel nas **Redirect URLs**
   - Atualize a **Site URL** se necessário

3. **IMPORTANTE**: Para Preview Deployments (URLs dinâmicas de PRs):
   - Você pode adicionar um wildcard como `https://*.vercel.app` nas Redirect URLs
   - **CUIDADO**: Isso pode ser um risco de segurança - considere apenas para desenvolvimento

## 🔍 Troubleshooting

### Erro: "Não foi possível abrir o popup"

**Causa**: O navegador está bloqueando popups.

**Solução**:
1. Verifique se o bloqueador de popups está desativado para o seu site
2. Adicione o site às exceções do navegador
3. Tente em outro navegador para verificar se é um problema específico

### Erro: "redirect_uri_mismatch"

**Causa**: A URL que você está usando não está nas URIs de redirecionamento autorizadas.

**Solução**:
1. Verifique se `https://<seu-id>.supabase.co/auth/v1/callback` está nas **URIs de redirecionamento autorizados** do Google Cloud Console
2. Verifique se sua URL local/produção está nas **Redirect URLs** do Supabase

### Popup abre mas fecha imediatamente

**Causa**: Pode ser um problema de configuração no Google Cloud ou Supabase.

**Solução**:
1. Verifique se o Client ID e Client Secret estão corretos no Supabase
2. Verifique se o provider Google está habilitado no Supabase
3. Verifique o console do navegador para erros específicos

### Usuário loga mas não aparece autenticado

**Causa**: O perfil do usuário não foi criado automaticamente ou a sessão não foi detectada.

**Solução**:
- O `checkUserExists` no AuthContext cria o perfil automaticamente
- Verifique os logs do console para ver se há erros
- Verifique se a tabela `user_profiles` existe e tem as políticas RLS corretas
- Recarregue a página se necessário

### Erro ao criar perfil após login com Google

**Causa**: Políticas RLS podem estar bloqueando a criação do perfil.

**Solução**:
- Verifique as políticas RLS da tabela `user_profiles`
- Certifique-se de que usuários autenticados podem inserir seus próprios perfis

## 📝 Notas Importantes

1. **Primeiro Login**: Quando um usuário faz login com Google pela primeira vez, o Supabase cria automaticamente um registro em `auth.users`. O código tenta criar um perfil em `user_profiles` automaticamente.

2. **Email**: O email usado no Google será o mesmo usado no sistema. Certifique-se de que não há conflitos com emails já cadastrados.

3. **Senha**: Usuários que fazem login com Google não têm senha definida. Eles só podem fazer login via Google OAuth.

4. **Permissões**: O Google OAuth solicita permissões básicas (email, perfil). Você pode adicionar mais escopos se necessário no código.

## 🔐 Segurança

- Nunca exponha o **Client Secret** no frontend
- Use variáveis de ambiente para todas as configurações sensíveis
- Configure corretamente as URLs de redirecionamento para evitar ataques
- Revise regularmente as permissões OAuth no Google Cloud Console

