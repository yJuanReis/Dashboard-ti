# Debug: Modal de Troca de Senha Não Aparece

## 🔍 Problema

O modal de troca de senha não aparece quando o usuário faz login com senha temporária.

## ✅ Soluções Implementadas

### 1. Script SQL para Corrigir Trigger

Execute o script: `tutorial/sql/fix_handle_new_user_trigger.sql`

Este script atualiza o trigger que cria perfis automaticamente para incluir o campo `password_temporary`.

### 2. Código Atualizado

O código agora:
- ✅ Faz UPSERT (insert ou update) ao criar perfil
- ✅ Verifica se o perfil já existe antes de inserir
- ✅ Tenta até 3 vezes com delay para encontrar o perfil
- ✅ Adiciona logs no console para debug

### 3. Verificação no Console

Abra o console do navegador (F12) e procure por:
- `PasswordTemporaryGuard: Verificando senha temporária...`
- `checkPasswordTemporary: password_temporary = true/false`
- `AuthContext: password_temporary = true/false`

## 🔧 Passos para Resolver

### Passo 1: Executar Script SQL

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Execute: `tutorial/sql/fix_handle_new_user_trigger.sql`

### Passo 2: Verificar Usuário Existente

Se você já criou um usuário antes das correções:

1. Execute: `tutorial/sql/verificar_e_corrigir_password_temporary.sql`
2. Verifique se o usuário tem `password_temporary = true`
3. Se não tiver, execute:

```sql
UPDATE public.user_profiles
SET password_temporary = TRUE
WHERE email = 'email-do-usuario@exemplo.com';
```

### Passo 3: Verificar no Console

1. Abra o console do navegador (F12)
2. Faça login com o usuário
3. Procure por mensagens de log
4. Verifique se `password_temporary = true` aparece

### Passo 4: Verificar no Banco de Dados

Execute no SQL Editor:

```sql
SELECT 
  email,
  password_temporary,
  nome,
  created_at
FROM public.user_profiles
WHERE email = 'email-do-usuario@exemplo.com';
```

O campo `password_temporary` deve ser `true`.

## 🐛 Troubleshooting

### "password_temporary é NULL"

Execute:

```sql
UPDATE public.user_profiles
SET password_temporary = TRUE
WHERE email = 'email-do-usuario@exemplo.com';
```

### "password_temporary é FALSE"

O usuário pode ter alterado a senha já. Verifique:

```sql
SELECT password_temporary, updated_at
FROM public.user_profiles
WHERE email = 'email-do-usuario@exemplo.com';
```

Se `updated_at` for recente, o usuário pode ter alterado a senha.

### "Perfil não encontrado"

O perfil pode não ter sido criado. Execute:

```sql
-- Verificar se o perfil existe
SELECT * FROM public.user_profiles
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'email-do-usuario@exemplo.com'
);

-- Se não existir, criar manualmente
INSERT INTO public.user_profiles (user_id, email, nome, role, password_temporary)
SELECT 
  id,
  email,
  NULL,
  'user',
  TRUE
FROM auth.users
WHERE email = 'email-do-usuario@exemplo.com';
```

### "Modal não aparece mesmo com password_temporary = true"

1. Verifique o console do navegador para erros
2. Verifique se o componente `PasswordTemporaryGuard` está sendo renderizado
3. Verifique se `passwordTemporary` está sendo atualizado no contexto

## 📝 Checklist

- [ ] Script SQL `fix_handle_new_user_trigger.sql` executado
- [ ] Campo `password_temporary` existe na tabela
- [ ] Usuário tem `password_temporary = true` no banco
- [ ] Console mostra `password_temporary = true`
- [ ] Componente `PasswordTemporaryGuard` está renderizado
- [ ] Não há erros no console

## 🔄 Testar Novamente

1. Crie um **novo usuário** através do formulário
2. Faça login com esse usuário
3. O modal deve aparecer automaticamente
4. Se não aparecer, verifique o console e o banco de dados

