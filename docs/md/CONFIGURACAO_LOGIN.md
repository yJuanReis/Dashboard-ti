# Configuração do Sistema de Login com Supabase

Este guia explica como configurar e usar o sistema de autenticação que valida no Supabase.

## 📋 Pré-requisitos

1. Conta no Supabase (https://supabase.com)
2. Projeto criado no Supabase
3. Variáveis de ambiente configuradas

## 🔧 Configuração Inicial

### 1. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

**Onde encontrar essas informações:**
- Acesse seu projeto no Supabase Dashboard
- Vá em **Settings** > **API**
- Copie a **URL** e a **anon/public key**

### 2. Configurar Autenticação no Supabase

1. Acesse o **Supabase Dashboard**
2. Vá em **Authentication** > **Settings**
3. Verifique se **Email** está habilitado como provider
4. Configure as opções de email conforme necessário:
   - **Enable email confirmations**: Recomendado para produção
   - **Secure email change**: Recomendado para produção

### 3. Criar Primeiro Usuário

**Opção 1: Via Dashboard (Recomendado)**
1. Vá em **Authentication** > **Users**
2. Clique em **Add user**
3. Preencha:
   - **Email**: ex: `admin@brmarinas.com`
   - **Password**: escolha uma senha segura
   - **Auto Confirm User**: marque se quiser pular confirmação de email
4. Clique em **Create user**

**Opção 2: Via SQL (Apenas desenvolvimento)**
Execute no SQL Editor do Supabase:
```sql
-- Use a função do Supabase para criar usuário
-- Isso é mais seguro que inserir diretamente na tabela auth.users
```

## 🔐 Como Funciona a Validação

O sistema valida o login **diretamente no Supabase** através da API de autenticação:

1. **Frontend**: O usuário preenche email e senha
2. **Validação Local**: Validação básica (email válido, senha não vazia)
3. **Supabase Auth**: Envia credenciais para `supabase.auth.signInWithPassword()`
4. **Validação no Supabase**: 
   - Verifica se o email existe
   - Valida a senha (hash bcrypt)
   - Verifica se o email foi confirmado (se habilitado)
   - Cria uma sessão JWT
5. **Resposta**: Retorna sessão e dados do usuário ou erro

## 🛡️ Segurança

### Row Level Security (RLS)

Para proteger suas tabelas, configure políticas RLS:

```sql
-- Exemplo: Habilitar RLS em uma tabela
ALTER TABLE sua_tabela ENABLE ROW LEVEL SECURITY;

-- Política: Apenas usuários autenticados podem ler
CREATE POLICY "Usuários autenticados podem ler"
  ON sua_tabela
  FOR SELECT
  TO authenticated
  USING (true);
```

### Políticas Recomendadas

- **SELECT**: Apenas usuários autenticados
- **INSERT**: Apenas usuários autenticados (ou com permissões específicas)
- **UPDATE**: Apenas o próprio usuário ou admins
- **DELETE**: Apenas admins

## 🧪 Testando o Sistema

1. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

2. **Acesse a aplicação:**
   - Você será redirecionado para `/login`
   - Digite o email e senha do usuário criado
   - Clique em "Entrar"

3. **Verifique no console:**
   - Abra o DevTools (F12)
   - Veja os logs de autenticação
   - Verifique se a sessão foi criada

4. **Teste de logout:**
   - Clique no botão "Sair" no sidebar
   - Você será redirecionado para `/login`

## 🐛 Resolução de Problemas

### Erro: "Invalid login credentials"
- Verifique se o email está correto
- Verifique se a senha está correta
- Verifique se o usuário existe no Supabase

### Erro: "Email not confirmed"
- O usuário precisa confirmar o email
- Ou desabilite confirmação de email em Settings
- Ou marque "Auto Confirm User" ao criar o usuário

### Erro: "VITE_SUPABASE_URL não está definida"
- Verifique se o arquivo `.env.local` existe
- Verifique se as variáveis começam com `VITE_`
- Reinicie o servidor de desenvolvimento após criar/editar `.env.local`

### Erro de conexão com Supabase
- Verifique se a URL está correta
- Verifique se a anon key está correta
- Verifique sua conexão com a internet
- Verifique se o projeto Supabase está ativo

## 📝 Estrutura do Código

```
src/
├── contexts/
│   └── AuthContext.tsx      # Contexto de autenticação
├── pages/
│   └── Login.tsx             # Página de login
├── components/
│   ├── ProtectedRoute.tsx    # Componente para proteger rotas
│   └── AppSidebar.tsx       # Sidebar com botão de logout
└── lib/
    └── supabaseClient.ts     # Cliente Supabase configurado
```

## 🔄 Fluxo de Autenticação

```
1. Usuário acessa aplicação
   ↓
2. ProtectedRoute verifica sessão
   ↓
3. Se não autenticado → Redireciona para /login
   ↓
4. Usuário preenche credenciais
   ↓
5. signIn() envia para Supabase
   ↓
6. Supabase valida e retorna sessão
   ↓
7. Sessão é salva e usuário é redirecionado
   ↓
8. Rotas protegidas ficam acessíveis
```

## 🎯 Próximos Passos

- [ ] Configurar políticas RLS para suas tabelas
- [ ] Adicionar recuperação de senha
- [ ] Adicionar registro de novos usuários (se necessário)
- [ ] Configurar roles/permissões de usuário
- [ ] Adicionar autenticação social (Google, GitHub, etc.)

## 📚 Recursos

- [Documentação Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/auth-signinwithpassword)


