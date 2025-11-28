# Sistema de Gestão de Usuários - Administrador

Este documento descreve o sistema completo de gestão de usuários implementado para administradores.

## 📋 Funcionalidades Implementadas

### 1. **Controle Total de Usuários**
- ✅ Editar informações do usuário (nome, email, role)
- ✅ Alterar senha de outros usuários
- ✅ Excluir usuários do sistema
- ✅ Criar novos usuários

### 2. **Sistema de Permissões de Páginas**
- ✅ Definir quais páginas cada usuário pode acessar
- ✅ Administradores têm acesso automático a todas as páginas
- ✅ Usuários sem restrições (array vazio) têm acesso a todas as páginas
- ✅ Bloqueio automático de acesso a páginas não permitidas
- ✅ Sidebar filtra automaticamente páginas sem permissão

## 🔧 Configuração

### Passo 1: Executar Script SQL de Permissões

Execute o script `tutorial/sql/supabase_user_permissions.sql` no SQL Editor do Supabase:

```sql
-- Este script adiciona a coluna page_permissions à tabela user_profiles
```

### Passo 2: Executar Script SQL de Admin (se ainda não executou)

Execute o script `tutorial/sql/supabase_admin_functions.sql` no SQL Editor do Supabase.

### Passo 3: Verificar Service (Concluído)

✅ Não é necessário configurar nenhuma chave adicional. As operações administrativas são executadas de forma segura via funções RPC no backend do Supabase.

## 🎯 Como Usar

### Editar Usuário

1. Na página de **Configurações**, vá até a seção **Painel Administrativo**
2. Na tabela de usuários, clique no botão **Editar** (ícone de lápis verde)
3. No modal que abrir:
   - Altere o **Nome** do usuário
   - Altere o **Email** do usuário
   - Altere o **Tipo de Utilizador** (Admin ou User)
   - Selecione as **Permissões de Páginas** (apenas para usuários normais)
4. Clique em **Salvar Alterações**

### Gerenciar Permissões de Páginas

1. Ao editar um usuário, role até a seção **Permissões de Acesso às Páginas**
2. Clique nas páginas que deseja permitir acesso
3. Páginas selecionadas ficam verdes
4. Use **Marcar Todas** ou **Desmarcar Todas** para facilitar
5. **Nota**: Administradores têm acesso automático a todas as páginas

### Alterar Senha de Usuário

1. Na tabela de usuários, clique no botão **Cadeado** (ícone azul)
2. Digite a nova senha
3. Clique em **Confirmar Alteração**

### Excluir Usuário

1. Na tabela de usuários, clique no botão **Lixo** (ícone vermelho)
2. Confirme a exclusão
3. O usuário será removido do sistema

## 📊 Páginas Disponíveis para Permissões

- `/home` - Início
- `/senhas` - Senhas
- `/crachas` - Crachás
- `/assinaturas` - Assinaturas
- `/controle-nvr` - Controle NVR
- `/Controle-hds` - Controle de HDs
- `/termos` - Termo de Responsabilidade
- `/gestaorede` - Gestão de Rede
- `/servidores` - Servidores
- `/chamados` - Chamados
- `/security-test` - Security Test

**Nota**: `/configuracoes` só é acessível para administradores e não aparece na lista de permissões.

## 🔒 Comportamento de Permissões

### Administradores
- ✅ Acesso automático a **todas** as páginas
- ✅ Podem editar qualquer usuário
- ✅ Não aparecem restrições de permissões ao editar

### Usuários Normais

**Sem restrições (padrão):**
- Se `page_permissions` estiver vazio ou null → Acesso a **todas** as páginas

**Com restrições:**
- Se `page_permissions` tiver valores → Acesso **apenas** às páginas listadas
- Tentativas de acessar páginas não permitidas mostram tela de "Acesso Negado"
- Páginas sem permissão não aparecem no sidebar

## 🛠️ Arquivos Criados/Modificados

### Novos Arquivos
- `src/components/PagePermissionGuard.tsx` - Componente que verifica permissões
- `src/hooks/usePagePermissions.ts` - Hook para gerenciar permissões
- `tutorial/sql/supabase_user_permissions.sql` - Script SQL para permissões
- `tutorial/md/GESTAO_USUARIOS_ADMIN.md` - Esta documentação

### Arquivos Modificados
- `src/pages/Configuracoes.tsx` - Adicionado modal de edição e gestão de permissões
- `src/components/AppSidebar.tsx` - Filtra itens baseado em permissões
- `src/App.tsx` - Integrado PagePermissionGuard nas rotas
- `src/lib/adminService.ts` - Refatorado para usar apenas RPC (sem exposição de credenciais)

## 🧪 Testando

1. **Criar um usuário normal:**
   - Use o formulário "Adicionar Novo Utilizador"
   - O usuário terá acesso total por padrão

2. **Restringir acesso:**
   - Edite o usuário
   - Desmarque algumas páginas
   - Salve
   - Faça login com esse usuário
   - Verifique que apenas as páginas permitidas aparecem no sidebar

3. **Testar bloqueio:**
   - Tente acessar diretamente uma URL não permitida
   - Deve aparecer a tela "Acesso Negado"

4. **Promover a Admin:**
   - Edite o usuário
   - Mude o tipo para "Administrador"
   - Salve
   - O usuário agora tem acesso a todas as páginas

## ⚠️ Notas Importantes

1. **Segurança**: Todas as operações administrativas são executadas via RPC no backend. Nenhuma credencial sensível é exposta no frontend.

2. **Permissões Padrão**: Usuários novos têm acesso total (array vazio) até que um admin defina restrições.

3. **Case Sensitivity**: As rotas são case-sensitive. Certifique-se de usar exatamente: `/Controle-hds` (com C maiúsculo).

4. **Configurações**: A página `/configuracoes` só é acessível para admins e não aparece na lista de permissões editáveis.

5. **Fallback**: Se houver erro ao verificar permissões, o sistema permite acesso (fail-open) para não bloquear usuários legítimos.

