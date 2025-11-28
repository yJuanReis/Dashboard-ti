# Configuração de Email de Redefinição de Senha - Supabase

Este guia explica como configurar as opções de email de redefinição de senha no Supabase Authentication.

## 📋 Acessar as Configurações

1. Acesse o **Supabase Dashboard**: https://app.supabase.com
2. Selecione seu projeto
3. No menu lateral, vá em **Authentication** > **Settings** (ou **Configurações**)
4. Role até a seção **Email Templates** ou **Email Auth**

## 🔧 Configurações Recomendadas

### 1. Email Confirmation (Confirmação de Email)

**Recomendação para Produção:**
- ✅ **Enable email confirmations**: **ATIVADO**
  - Isso garante que apenas emails verificados possam fazer login
  - Aumenta a segurança do sistema

**Recomendação para Desenvolvimento:**
- ⚠️ **Enable email confirmations**: **DESATIVADO**
  - Facilita testes durante o desenvolvimento
  - Permite login imediato após criar conta

### 2. Secure Email Change (Alteração Segura de Email)

**Recomendação:**
- ✅ **Secure email change**: **ATIVADO**
  - Requer confirmação por email antes de alterar o endereço
  - Previne alterações não autorizadas

### 3. Password Reset (Redefinição de Senha)

**Configurações:**
- ✅ **Enable password reset**: **ATIVADO** (geralmente já está ativado por padrão)
- **Redirect URL**: Configure para: `https://seu-dominio.com/reset-password`
  - Ou em desenvolvimento: `http://localhost:5173/reset-password` (ajuste a porta conforme necessário)

### 4. Email Templates (Modelos de Email)

#### Reset Password Email (Email de Redefinição de Senha)

**Localização:** Authentication > Email Templates > Reset Password

**Configuração Recomendada:**

```html
<h2>Redefinir Senha</h2>

<p>Olá,</p>

<p>Você solicitou a redefinição de senha para sua conta no Dashboard TI - BR Marinas.</p>

<p>Clique no link abaixo para redefinir sua senha:</p>

<p><a href="{{ .ConfirmationURL }}">Redefinir Senha</a></p>

<p>Se você não solicitou esta redefinição, ignore este email.</p>

<p>Este link expira em 1 hora.</p>

<p>Equipe TI - BR Marinas</p>
```

**Variáveis Disponíveis:**
- `{{ .ConfirmationURL }}` - URL completa com token de redefinição
- `{{ .Email }}` - Email do usuário
- `{{ .Token }}` - Token de redefinição (geralmente não necessário)

**Assunto (Subject) Recomendado:**
```
Redefinir Senha - Dashboard TI BR Marinas
```

### 5. SMTP Settings (Configurações SMTP - Opcional)

**Por padrão, o Supabase usa seu próprio serviço de email.** Para usar um SMTP personalizado:

1. Vá em **Authentication** > **Settings** > **SMTP Settings**
2. Configure:
   - **SMTP Host**: Ex: `smtp.gmail.com`, `smtp.mailgun.org`
   - **SMTP Port**: Ex: `587` (TLS) ou `465` (SSL)
   - **SMTP User**: Seu email/usuário SMTP
   - **SMTP Password**: Senha do SMTP
   - **Sender Email**: Email que aparecerá como remetente
   - **Sender Name**: Nome que aparecerá como remetente (ex: "BR Marinas TI")

**Serviços SMTP Populares:**
- **Mailgun**: smtp.mailgun.org (porta 587)
- **Gmail**: smtp.gmail.com (porta 587) - Requer "App Password"
- **AWS SES**: smtp.email.us-east-1.amazonaws.com (porta 587)

## 🔐 Configurações de Segurança Adicionais

### Rate Limiting (Limite de Taxa)

**Localização:** Authentication > Settings > Rate Limits

**Recomendações:**
- **Email sending rate limit**: 3-5 emails por hora por usuário
  - Previne spam e abuso
  - Protege contra ataques de força bruta

### Session Management (Gerenciamento de Sessão)

**Localização:** Authentication > Settings > Session Management

**Recomendações:**
- **JWT expiry**: 3600 segundos (1 hora) para desenvolvimento
- **JWT expiry**: 86400 segundos (24 horas) para produção
- **Refresh token rotation**: **ATIVADO**
  - Aumenta a segurança ao rotacionar tokens

## 📝 Checklist de Configuração

- [ ] Email confirmations configurado conforme ambiente (dev/prod)
- [ ] Secure email change ativado
- [ ] Password reset ativado
- [ ] Redirect URL configurado corretamente
- [ ] Template de email personalizado (opcional)
- [ ] Assunto do email configurado
- [ ] SMTP personalizado configurado (se necessário)
- [ ] Rate limiting configurado
- [ ] Session management configurado

## 🧪 Testar a Configuração

### 1. Testar Envio de Email

1. Vá em **Authentication** > **Users**
2. Selecione um usuário
3. Clique em **Send password reset email**
4. Verifique se o email foi recebido
5. Clique no link e verifique se redireciona corretamente

### 2. Testar no Código

1. Na aplicação, vá em **Configurações**
2. Clique em **Enviar Email de Redefinição**
3. Preencha nome e senha
4. Verifique se o email é enviado
5. Clique no link do email
6. Verifique se:
   - Precisa fazer login
   - Precisa preencher nome
   - Consegue redefinir a senha

## ⚠️ Problemas Comuns

### Email não está sendo enviado

**Soluções:**
1. Verifique se **Enable password reset** está ativado
2. Verifique se o email do usuário está confirmado (se email confirmation estiver ativado)
3. Verifique os logs em **Authentication** > **Logs**
4. Verifique se não atingiu o rate limit
5. Verifique a pasta de spam

### Link de reset não funciona

**Soluções:**
1. Verifique se o **Redirect URL** está configurado corretamente
2. Verifique se a rota `/reset-password` existe na aplicação
3. Verifique se o token não expirou (geralmente 1 hora)
4. Verifique os logs do navegador para erros

### Usuário não consegue fazer login após reset

**Soluções:**
1. Verifique se o usuário existe na tabela `user_profiles`
2. Verifique se a senha foi atualizada corretamente
3. Verifique os logs de autenticação
4. Tente fazer logout e login novamente

## 🔗 Links Úteis

- [Documentação Supabase Auth](https://supabase.com/docs/guides/auth)
- [Email Templates Supabase](https://supabase.com/docs/guides/auth/auth-email-templates)
- [SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs em **Authentication** > **Logs**
2. Verifique o console do navegador
3. Verifique os logs do servidor (se aplicável)
4. Consulte a documentação oficial do Supabase

