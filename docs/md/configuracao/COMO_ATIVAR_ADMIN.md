# 🚀 Como Ativar o Acesso Admin nas Configurações

## ❓ Problema
A página **Configurações** não aparece no menu lateral e quando você tenta acessar `/configuracoes` aparece "Acesso Negado".

## ✅ Solução Rápida

### Passo 1: Abrir o SQL Editor no Supabase
1. Acesse [https://supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione seu projeto
4. No menu lateral esquerdo, clique em **SQL Editor**

### Passo 2: Executar o Script de Setup
1. Abra o arquivo `tutorial/sql/SETUP_COMPLETO_ADMIN.sql`
2. **IMPORTANTE**: Na **linha 265**, substitua `'seu-email@exemplo.com'` pelo seu email real que você usa para fazer login
   ```sql
   WHERE email = 'seu@email.com'  -- 👈 Coloque SEU email aqui!
   ```
3. Copie **TODO** o conteúdo do arquivo
4. Cole no SQL Editor do Supabase
5. Clique no botão **Run** (ou pressione `Ctrl + Enter`)

### Passo 3: Verificar se Funcionou
Após executar o script, você deve ver no final:
- ✅ Tabela `user_profiles` criada
- ✅ Seu email com `role = 'admin'`
- ✅ 4 funções criadas

Se vir isso, está tudo certo!

### Passo 4: Fazer Logout e Login
1. Na aplicação, faça **logout**
2. Faça **login** novamente com seu email
3. A página **Configurações** deve aparecer no menu lateral agora! ⚙️

---

## 🔍 Diagnóstico de Problemas

### Como saber qual é o meu email?
Execute esta query no SQL Editor:
```sql
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;
```

Isso vai mostrar todos os usuários. Copie o email exato do seu usuário.

### Como verificar se sou admin?
Execute esta query no SQL Editor:
```sql
SELECT email, role, created_at
FROM public.user_profiles
WHERE role = 'admin';
```

Se aparecer seu email com `role = 'admin'`, você é admin!

### Como verificar se a tabela existe?
Execute esta query:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles';
```

Se aparecer `user_profiles`, a tabela existe.

---

## 🆘 Problemas Comuns

### Problema 1: "relation public.user_profiles does not exist"
**Causa**: A tabela não foi criada ainda.
**Solução**: Execute o script `SETUP_COMPLETO_ADMIN.sql` completo.

### Problema 2: "Acesso Negado" mesmo após executar o script
**Causa**: Você não fez logout/login após executar o script.
**Solução**: 
1. Faça logout da aplicação
2. Faça login novamente
3. Teste novamente

### Problema 3: Configurações não aparece no menu
**Causa 1**: Você não é admin no banco de dados.
**Solução**: Verifique se executou o script com o email correto (linha 265).

**Causa 2**: O cache do navegador está desatualizado.
**Solução**: 
1. Pressione `Ctrl + Shift + R` (Windows/Linux) ou `Cmd + Shift + R` (Mac) para recarregar sem cache
2. Ou limpe o cache no menu Configurações (se conseguir acessar)

### Problema 4: "permission denied for table user_profiles"
**Causa**: As políticas RLS estão bloqueando o acesso.
**Solução**: Execute o script `SETUP_COMPLETO_ADMIN.sql` novamente - ele recria todas as políticas corretas.

---

## 📋 Checklist de Verificação

Antes de pedir ajuda, verifique:
- [ ] Executei o script `SETUP_COMPLETO_ADMIN.sql` completo
- [ ] Substituí `'seu-email@exemplo.com'` pelo meu email real na linha 265
- [ ] Meu email está exatamente como aparece no Supabase Auth (sem espaços extras)
- [ ] Fiz logout e login novamente após executar o script
- [ ] Recarreguei a página com Ctrl+Shift+R
- [ ] Verifiquei que meu usuário tem `role = 'admin'` no banco
- [ ] A tabela `user_profiles` existe no banco de dados

Se todos os itens acima estão OK e ainda não funciona, execute o script de diagnóstico:
`tutorial/sql/DIAGNOSTICO_ADMIN.sql`

---

## 🎯 O Que o Script Faz?

O script `SETUP_COMPLETO_ADMIN.sql` faz tudo automaticamente:

1. ✅ Cria a tabela `user_profiles` se não existir
2. ✅ Adiciona a coluna `page_permissions` para controlar acesso a páginas
3. ✅ Configura as políticas RLS (Row Level Security) corretas
4. ✅ Cria triggers para criar perfis automaticamente quando novos usuários se registram
5. ✅ Cria tabela de auditoria para registrar ações administrativas
6. ✅ Cria funções para admins alterarem senhas e excluir usuários
7. ✅ **Promove seu usuário a admin** 🔥
8. ✅ Verifica se tudo foi criado corretamente

---

## 📝 Notas Importantes

- **Segurança**: O script usa RLS (Row Level Security) para garantir que apenas admins possam acessar e modificar dados sensíveis
- **Auditoria**: Todas as ações administrativas são registradas na tabela `admin_audit_log`
- **Permissões**: Admins têm acesso a TODAS as páginas automaticamente
- **Reversível**: Se precisar remover o admin, basta executar:
  ```sql
  UPDATE public.user_profiles 
  SET role = 'user' 
  WHERE email = 'seu@email.com';
  ```

---

## 🎓 Entendendo o Sistema de Permissões

O sistema tem 3 níveis de controle:

### 1. **Role** (papel)
- `admin`: Acesso total a tudo
- `user`: Acesso controlado por permissões

### 2. **Page Permissions** (permissões de página)
- `NULL` ou `[]`: Usuário tem acesso a TODAS as páginas
- `['/home', '/senhas']`: Usuário só acessa Home e Senhas
- Só se aplica a usuários com `role = 'user'`
- Admins ignoram isso e têm acesso a tudo

### 3. **AdminOnlyRoute** (rotas exclusivas para admin)
- A página `/configuracoes` é exclusiva para admins
- Mesmo que um usuário tenha `/configuracoes` em `page_permissions`, ele não acessa se não for admin
- Por isso é ESSENCIAL ter `role = 'admin'` no banco

---

## 💡 Dicas

1. **Backup**: Antes de executar o script, você pode fazer um backup do banco:
   - No Supabase Dashboard, vá em **Database** > **Backups**

2. **Teste em Desenvolvimento**: Se tiver um projeto de teste, execute o script lá primeiro

3. **Múltiplos Admins**: Para promover outro usuário a admin:
   ```sql
   UPDATE public.user_profiles 
   SET role = 'admin' 
   WHERE email = 'outro-usuario@exemplo.com';
   ```

4. **Ver Todos os Admins**:
   ```sql
   SELECT email, nome, role, created_at
   FROM public.user_profiles
   WHERE role = 'admin'
   ORDER BY created_at;
   ```

---

## 📞 Suporte

Se após seguir todos os passos ainda não funcionar, forneça as seguintes informações:

1. Resultado da query:
   ```sql
   SELECT email, role FROM public.user_profiles WHERE email = 'seu@email.com';
   ```

2. Resultado da query:
   ```sql
   SELECT * FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles';
   ```

3. Se aparece algum erro no console do navegador (F12)

4. Se a página `/configuracoes` mostra "Acesso Negado" ou erro 404

---

**Criado em**: 19 de Novembro de 2025  
**Versão**: 1.0  
**Última atualização**: 19/11/2025

