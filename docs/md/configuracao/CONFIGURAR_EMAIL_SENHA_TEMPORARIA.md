# Configurar Email para Senha Temporária

## 🔴 Problema Atual

Quando o admin cria um usuário através do formulário, o Supabase envia automaticamente um email de **"Confirme seu email"**, mas o que queremos é:

- ✅ Email com **credenciais** (email e senha temporária)
- ✅ Link do site
- ❌ **NÃO** queremos email de confirmação (pois o admin já criou o usuário)

## ✅ Soluções

### Solução 1: Desabilitar Confirmação de Email (Recomendado para Desenvolvimento)

Esta é a solução mais simples para desenvolvimento/testes:

1. Acesse o **Supabase Dashboard**
2. Vá em **Authentication** > **Settings** > **Auth**
3. Desmarque **"Enable email confirmations"**
4. Salve as alterações

**Vantagens:**
- ✅ Usuários podem fazer login imediatamente
- ✅ Não recebem email de confirmação
- ✅ Simples de configurar

**Desvantagens:**
- ⚠️ Menos seguro (qualquer email pode criar conta)
- ⚠️ Não recomendado para produção

### Solução 2: Usar Admin API via Edge Function (Recomendado para Produção)

Criar uma Edge Function que usa a **Admin API** para criar usuários já confirmados:

1. A Edge Function usa a **service role key** (nunca exponha no frontend!)
2. Cria o usuário com `email_confirm: true`
3. Envia email personalizado com credenciais

**Vantagens:**
- ✅ Mais seguro
- ✅ Controle total sobre o email enviado
- ✅ Usuário já confirmado automaticamente
- ✅ Não envia email de confirmação padrão

**Desvantagens:**
- ⚠️ Requer criar Edge Function
- ⚠️ Mais complexo de implementar

### Solução 3: Personalizar Template de Email (Solução Intermediária)

Personalizar o template de "Confirm signup" para incluir as credenciais:

1. Acesse **Authentication** > **Email Templates** > **Confirm signup**
2. Personalize o template para incluir:
   - Email do usuário
   - Senha temporária (você precisará passar via metadata)
   - Link do site

**Limitação:** O template padrão não tem acesso à senha, então você precisaria usar uma abordagem diferente.

## 🎯 Recomendação

### Para Desenvolvimento/Testes:
Use a **Solução 1** (desabilitar confirmação de email)

### Para Produção:
Use a **Solução 2** (Edge Function com Admin API)

## 📝 Próximos Passos

Se quiser implementar a Solução 2 (Edge Function), posso ajudar a criar:
- Edge Function que cria usuário com Admin API
- Template de email personalizado
- Integração no frontend

Por enquanto, a **Solução 1** resolve o problema imediato de não enviar email de confirmação.

