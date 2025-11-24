# Fluxo de Senha Temporária - Guia Completo

Este documento explica o fluxo completo de criação de usuários com senha temporária e a obrigatoriedade de alteração no primeiro login.

## 📋 Visão Geral do Fluxo

1. **Admin adiciona usuário** (apenas email e senha temporária)
2. **Email é enviado** para o usuário com credenciais e link do site
3. **Usuário acessa o site** e faz login com a senha temporária
4. **Modal aparece automaticamente** solicitando alteração de senha e nome
5. **Usuário preenche** nome, nova senha e confirmação
6. **Sistema atualiza** perfil e remove flag de senha temporária

## 🔧 Configuração Inicial

### 1. Executar Script SQL

Execute o script SQL para adicionar o campo `password_temporary` na tabela `user_profiles`:

```sql
-- Execute: tutorial/sql/add_password_temporary_field.sql
```

Este script adiciona:
- Campo `password_temporary` (BOOLEAN) na tabela `user_profiles`
- Índice para melhor performance

### 2. Configurar Email no Supabase

⚠️ **IMPORTANTE:** Por padrão, o Supabase envia um email de **"Confirme seu email"** quando um usuário é criado. Para usuários criados pelo admin, isso não é necessário.

#### Opção A: Desabilitar Confirmação de Email (Desenvolvimento)

1. Acesse o **Supabase Dashboard**
2. Vá em **Authentication** > **Settings** > **Auth**
3. **Desmarque** "Enable email confirmations"
4. Salve as alterações

**Resultado:** Usuários criados pelo admin não receberão email de confirmação e poderão fazer login imediatamente.

⚠️ **Nota:** Isso é recomendado apenas para desenvolvimento. Para produção, use a Opção B.

#### Opção B: Edge Function com Admin API (Produção)

Para produção, recomenda-se criar uma Edge Function que:
- Usa Admin API para criar usuário já confirmado
- Envia email personalizado com credenciais
- Não envia email de confirmação padrão

Veja o guia completo em: `tutorial/md/CONFIGURAR_EMAIL_SENHA_TEMPORARIA.md`

#### Enviar Email com Credenciais

Atualmente, o sistema **não envia automaticamente** um email com as credenciais. Você pode:

1. **Enviar manualmente** após criar o usuário
2. **Criar uma Edge Function** que envia email personalizado
3. **Integrar com serviço de email externo** (SendGrid, Mailgun, etc.)

## 🎯 Como Usar

### Para Administradores

1. Acesse a página **Configurações**
2. Na seção **"Adicionar Novo Utilizador"**:
   - Preencha apenas o **Email** do usuário
   - Defina uma **Senha Temporária**
   - Clique em **Adicionar**
3. O sistema irá:
   - Criar o usuário no Supabase Auth
   - Marcar a senha como temporária no perfil
   - Enviar email automaticamente (se configurado)

### Para Usuários

1. Recebe email com:
   - Credenciais de login (email e senha temporária)
   - Link do site
2. Acessa o site e faz login
3. **Modal aparece automaticamente** solicitando:
   - Nome completo
   - Nova senha
   - Confirmação de senha
4. Após preencher e salvar:
   - Senha é atualizada
   - Nome é salvo no perfil
   - Flag de senha temporária é removida
   - Usuário pode usar o sistema normalmente

## 🔍 Verificações Técnicas

### Verificar se Campo Foi Adicionado

Execute no SQL Editor do Supabase:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name = 'password_temporary';
```

### Verificar Usuários com Senha Temporária

```sql
SELECT email, nome, password_temporary, created_at
FROM public.user_profiles
WHERE password_temporary = true;
```

### Atualizar Manualmente (se necessário)

Se precisar marcar um usuário como tendo senha temporária:

```sql
UPDATE public.user_profiles
SET password_temporary = true
WHERE email = 'usuario@exemplo.com';
```

Para remover a flag (após usuário alterar senha):

```sql
UPDATE public.user_profiles
SET password_temporary = false
WHERE email = 'usuario@exemplo.com';
```

## ⚠️ Importante

1. **O modal não pode ser fechado** até que o usuário altere a senha
2. **O usuário não pode navegar** no sistema enquanto a senha for temporária
3. **Após alterar a senha**, a página será recarregada automaticamente
4. **O nome é obrigatório** no primeiro login

## 🐛 Troubleshooting

### Modal não aparece após login

1. Verifique se o campo `password_temporary` existe na tabela
2. Verifique se o valor está como `true` no banco de dados
3. Verifique o console do navegador para erros
4. Verifique se o componente `PasswordTemporaryGuard` está sendo renderizado

### Email não é enviado

1. Verifique as configurações de email no Supabase Dashboard
2. Verifique se o template de email está configurado
3. Considere usar uma Edge Function para envio personalizado

### Erro ao atualizar senha

1. Verifique se o usuário tem permissão para atualizar o perfil
2. Verifique as políticas RLS da tabela `user_profiles`
3. Verifique os logs do Supabase para mais detalhes

## 📝 Notas de Desenvolvimento

- O componente `PasswordTemporaryGuard` verifica automaticamente após o login
- O modal é exibido de forma não bloqueante (não impede renderização)
- A verificação é feita tanto no `user_profiles` quanto no `user_metadata` como fallback
- Após alterar a senha, a página é recarregada para garantir sincronização

