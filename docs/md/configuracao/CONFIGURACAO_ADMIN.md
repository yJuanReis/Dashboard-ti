# Configuração do Sistema de Administração

Este guia explica como configurar o sistema de administração completo, permitindo que admins alterem senhas e excluam usuários.

## 📋 Pré-requisitos

1. Tabela `user_profiles` criada (execute `supabase_user_profiles_table.sql`)
2. Usuário criado no Supabase Auth
3. Acesso ao Supabase Dashboard

## 🔧 Passo a Passo

### 1. Executar Script SQL de Configuração Admin

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Abra o arquivo `tutorial/sql/supabase_admin_functions.sql`
4. Copie e cole todo o conteúdo no SQL Editor
5. Clique em **Run** para executar

### 2. Promover Usuário a Administrador

Após executar o script SQL, você precisa promover seu usuário a admin:

1. No final do script SQL, descomente a linha:
   ```sql
   UPDATE public.user_profiles 
   SET role = 'admin' 
   WHERE email = 'seu-email@exemplo.com';
   ```

2. Substitua `'seu-email@exemplo.com'` pelo email do seu usuário
3. Execute apenas essa query

**Alternativa via Dashboard:**
- Vá em **Table Editor** > `user_profiles`
- Encontre seu usuário pelo email
- Altere o campo `role` de `'user'` para `'admin'`
- Salve

### 3. Verificar Configuração

1. Faça login na aplicação com o usuário admin
2. Acesse a página de **Configurações**
3. Você deve ver:
   - Badge "Administrador" no seu perfil
   - Painel "Painel Administrativo" com:
     - Formulário para criar novos usuários
     - Tabela com todos os usuários
     - Botões de gestão (Cadeado e Lixo) para cada usuário

## ✅ Funcionalidades Disponíveis para Admin

### Criar Usuário
- Preencha email, nome e senha
- Clique no botão de adicionar
- O usuário será criado no Supabase Auth e um perfil será criado automaticamente

### Alterar Senha de Usuário
1. Na tabela de usuários, clique no ícone de **Cadeado** (🔒)
2. Digite a nova senha no modal
3. Clique em "Confirmar Alteração"
4. A senha será alterada imediatamente

### Excluir Usuário
1. Na tabela de usuários, clique no ícone de **Lixo** (🗑️)
2. Confirme a exclusão
3. O usuário será removido do sistema (auth.users e user_profiles)

## 🔒 Segurança

### ✅ Arquitetura Segura

Todas as operações administrativas são executadas via **RPC Functions** no backend do Supabase:

- ✅ **Sem exposição de credenciais**: Nenhuma service_role key é exposta no frontend
- ✅ **Validação no servidor**: As funções RPC validam permissões antes de executar operações
- ✅ **Auditoria**: Todas as operações são registradas via triggers
- ✅ **Seguro por padrão**: Ideal para ambientes de desenvolvimento e produção

### Como Funciona

1. O frontend chama uma função RPC (ex: `update_user_password_by_admin`)
2. A função valida se o usuário atual é admin
3. Se autorizado, a função executa a operação usando permissões SECURITY DEFINER
4. As operações são auditadas automaticamente

## 🐛 Resolução de Problemas

### Erro: "Apenas administradores podem..."
- Verifique se seu usuário tem `role = 'admin'` na tabela `user_profiles`
- Faça logout e login novamente após promover a admin

### Botões de gestão não aparecem
- Verifique se você está logado como admin
- Recarregue a página
- Verifique no console do navegador se há erros

### Erro ao alterar senha ou excluir usuário
- Verifique se as funções RPC foram criadas corretamente no Supabase
- Confirme que você tem role 'admin' na tabela user_profiles
- Veja o console do navegador para mais detalhes do erro
- Verifique os logs do Supabase no dashboard

## 📝 Verificações Úteis

### Verificar se você é admin:
```sql
SELECT email, role 
FROM public.user_profiles 
WHERE user_id = auth.uid();
```

### Verificar todas as funções criadas:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%admin%';
```

### Listar todos os usuários e suas roles:
```sql
SELECT up.email, up.role, up.created_at
FROM public.user_profiles up
ORDER BY up.created_at DESC;
```

## 🎯 Próximos Passos

1. ✅ Executar script SQL
2. ✅ Promover usuário a admin
3. ✅ Testar funcionalidades
4. 🔄 (Opcional) Configurar auditoria adicional

