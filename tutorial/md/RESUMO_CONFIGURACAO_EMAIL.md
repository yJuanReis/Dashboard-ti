# 📧 Resumo Rápido - Configuração de Email Reset Password

## 🎯 Passos Essenciais no Supabase Dashboard

### 1. Acessar Configurações
```
Supabase Dashboard → Authentication → Settings
```

### 2. Configurações Principais

#### ✅ Password Reset (Redefinição de Senha)
- **Enable password reset**: ✅ **ATIVADO**
- **Redirect URL**: 
  - Desenvolvimento: `http://localhost:5173/reset-password`
  - Produção: `https://seu-dominio.com/reset-password`

#### ✅ Email Templates
- **Localização**: Authentication → Email Templates → Reset Password
- **Subject**: `Redefinir Senha - Dashboard TI BR Marinas`
- **Template**: Personalize conforme necessário (veja guia completo)

#### ✅ Email Confirmation (Opcional)
- **Desenvolvimento**: ❌ DESATIVADO (facilita testes)
- **Produção**: ✅ ATIVADO (mais seguro)

#### ✅ Secure Email Change
- ✅ **ATIVADO** (recomendado)

### 3. Configuração do Redirect URL

**No código já está configurado:**
```typescript
redirectTo: `${window.location.origin}/reset-password`
```

**No Supabase Dashboard, configure:**
1. Authentication → Settings → URL Configuration
2. **Site URL**: `https://seu-dominio.com` (ou `http://localhost:5173` para dev)
3. **Redirect URLs**: Adicione:
   - `http://localhost:5173/reset-password` (dev)
   - `https://seu-dominio.com/reset-password` (prod)

### 4. Testar

1. **No Dashboard Supabase:**
   - Authentication → Users
   - Selecione um usuário
   - Clique em "Send password reset email"

2. **Na Aplicação:**
   - Vá em Configurações
   - Clique em "Enviar Email de Redefinição"
   - Preencha nome e senha
   - Verifique o email recebido

## ⚠️ Importante

- O redirect URL no código usa `window.location.origin`, então funciona automaticamente
- Certifique-se de adicionar o redirect URL nas configurações do Supabase
- Em produção, use HTTPS
- Verifique a pasta de spam se o email não chegar

## 📚 Guia Completo

Para mais detalhes, consulte: `tutorial/md/CONFIGURACAO_EMAIL_RESET_PASSWORD.md`

