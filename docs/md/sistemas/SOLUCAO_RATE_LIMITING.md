# Solução para Erros 429 e 504 (Too Many Requests / Gateway Timeout)

## 🔴 Problemas

Ao tentar criar usuários através do formulário, você pode receber os seguintes erros:

### Erro 429 (Too Many Requests)
```
POST https://seu-projeto.supabase.co/auth/v1/signup 429 (Too Many Requests)
```
Este erro ocorre porque o Supabase tem **rate limiting** no endpoint público de criação de usuários (`signUp`) para prevenir abuso.

### Erro 504 (Gateway Timeout)
```
POST https://seu-projeto.supabase.co/auth/v1/signup 504 (Gateway Timeout)
```
Este erro ocorre quando o servidor do Supabase demora muito para responder (mais de 30 segundos). Pode ser causado por:
- Sobrecarga do servidor
- Problemas de rede
- Timeout da requisição

## ✅ Soluções

### Solução 1: Aguardar e Tentar Novamente (Recomendado para Testes)

- **Erro 429**: O rate limiting do Supabase geralmente é temporário. Aguarde **2-5 minutos** e tente novamente.
- **Erro 504**: O timeout geralmente é causado por sobrecarga temporária. Aguarde **1-2 minutos** e tente novamente.

### Solução 2: Criar Usuário Manualmente no Dashboard (Recomendado para Produção)

Esta é a forma mais confiável e não está sujeita a rate limiting:

1. Acesse o **Supabase Dashboard**
2. Vá em **Authentication** > **Users**
3. Clique em **"Add user"**
4. Preencha:
   - **Email**: email do novo usuário
   - **Password**: senha temporária
   - **Auto Confirm User**: ✅ Marque esta opção
5. Clique em **"Create user"**
6. Após criar, execute este SQL para marcar como senha temporária e criar o perfil:

```sql
-- Substitua 'usuario@exemplo.com' pelo email do usuário criado
INSERT INTO public.user_profiles (user_id, email, nome, role, password_temporary)
SELECT 
  id,
  email,
  NULL, -- Nome será preenchido no primeiro login
  'user',
  TRUE  -- Marcar como senha temporária
FROM auth.users
WHERE email = 'usuario@exemplo.com'
ON CONFLICT (user_id) 
DO UPDATE SET 
  password_temporary = TRUE,
  nome = NULL;
```

### Solução 3: Usar Edge Function (Avançado)

Criar uma Edge Function do Supabase que usa a **service role key** para criar usuários. Isso não está sujeito ao mesmo rate limiting.

**Passos:**

1. Crie uma Edge Function no Supabase
2. Use a service role key (nunca exponha no frontend!)
3. Chame a função do frontend via RPC

**Exemplo de Edge Function:**

```typescript
// supabase/functions/create-user/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { email, password, isTemporary } = await req.json()
  
  // Usar service role key (nunca exponha no frontend!)
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  // Criar usuário
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirmar
    user_metadata: {
      password_temporary: isTemporary || true
    }
  })
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  // Criar perfil
  await supabaseAdmin.from('user_profiles').insert({
    user_id: data.user.id,
    email: data.user.email,
    nome: null,
    role: 'user',
    password_temporary: isTemporary || true
  })
  
  return new Response(JSON.stringify({ success: true, user: data.user }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### Solução 4: Aumentar Rate Limit no Supabase (Plano Pago)

Se você estiver no plano **Pro** ou superior do Supabase, pode configurar rate limits mais altos:

1. Acesse **Settings** > **API** no Supabase Dashboard
2. Configure limites mais altos para autenticação
3. Entre em contato com o suporte do Supabase se necessário

## 🔧 Melhorias Implementadas no Código

O código agora:

1. ✅ Detecta erro 429 (Too Many Requests) e mostra mensagem clara
2. ✅ Detecta erro 504 (Gateway Timeout) e mostra mensagem específica
3. ✅ Implementa timeout de 30 segundos para evitar espera infinita
4. ✅ Mostra estado de loading durante a criação
5. ✅ Sugere aguardar ou usar o Dashboard
6. ✅ Trata outros erros comuns (email já existe, etc.)
7. ✅ Mostra aviso visual sobre rate limiting e timeout

## 📝 Recomendações

### Para Desenvolvimento/Testes:
- Use a **Solução 2** (Dashboard) para criar usuários de teste
- É mais rápido e confiável

### Para Produção:
- Implemente a **Solução 3** (Edge Function) para criar usuários programaticamente
- Mantenha a **Solução 2** como fallback
- Configure rate limits apropriados no Supabase

## ⚠️ Importante

- **Nunca exponha a service role key no frontend**
- Use Edge Functions ou backend para operações administrativas
- O rate limiting existe por segurança - não tente contorná-lo de forma insegura

## 🐛 Troubleshooting

### "Ainda recebo erro 429 mesmo aguardando"

1. Verifique se não há múltiplas tentativas simultâneas
2. Limpe o cache do navegador
3. Use o Dashboard do Supabase diretamente
4. Verifique se há outros processos criando usuários

### "Recebo erro 504 (Gateway Timeout) frequentemente"

1. Verifique sua conexão com a internet
2. Tente novamente após 1-2 minutos
3. Use o Dashboard do Supabase (mais confiável)
4. Verifique o status do Supabase em status.supabase.com

### "Como saber quando posso tentar novamente?"

- **Erro 429**: 
  - **2-5 minutos** para tentativas normais
  - **15-30 minutos** para muitas tentativas em sequência
- **Erro 504**:
  - **1-2 minutos** geralmente é suficiente
  - Se persistir, use o Dashboard do Supabase

### "Preciso criar muitos usuários de uma vez"

Use o Dashboard do Supabase ou crie uma Edge Function que processa em lote com delays entre criações.

