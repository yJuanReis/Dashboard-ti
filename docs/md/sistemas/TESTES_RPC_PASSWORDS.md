# 🧪 GUIA DE TESTES - Funções RPC de Senhas

**Data:** 28/11/2025  
**Status:** ✅ Pronto para Testes

---

## 📋 Pré-requisitos

### 1. Executar o Script SQL no Supabase

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Crie uma nova query
4. Cole o conteúdo do arquivo: `docs/sql/passwords_rpc_functions.sql`
5. Execute o script (Run)
6. Verifique se as 4 funções foram criadas:
   - `get_passwords()`
   - `create_password()`
   - `update_password()`
   - `delete_password()`

### 2. Verificar Permissões

Execute no SQL Editor:

```sql
-- Verificar se as funções foram criadas
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE '%password%'
ORDER BY p.proname;
```

---

## 🧪 Testes Manuais no SQL Editor

### Teste 1: Listar Senhas (GET)

```sql
SELECT * FROM get_passwords();
```

**Resultado Esperado:**
- Lista todas as senhas da tabela
- Ordenadas por `servico` (ASC)
- Estrutura completa de cada registro

---

### Teste 2: Criar Nova Senha (CREATE)

```sql
-- Teste básico (apenas campos obrigatórios)
SELECT * FROM create_password(
  p_servico := 'Teste RPC - Serviço 1'
);

-- Teste completo (todos os campos)
SELECT * FROM create_password(
  p_servico := 'Teste RPC - Gmail',
  p_usuario := 'teste@gmail.com',
  p_senha := 'SenhaSegura123!',
  p_descricao := 'Conta de email de teste',
  p_link_de_acesso := 'https://mail.google.com',
  p_marina := 'Itajaí',
  p_tipo := 'Email'
);
```

**Resultado Esperado:**
- Registro criado com sucesso
- Retorna o registro completo incluindo ID e `created_at`
- Se serviço estiver vazio, deve retornar erro: "O campo serviço é obrigatório"

---

### Teste 3: Atualizar Senha (UPDATE)

```sql
-- Substituir 123 pelo ID real do registro
SELECT * FROM update_password(
  p_id := 123,
  p_senha := 'NovaSenhaAtualizada456!'
);

-- Atualizar múltiplos campos
SELECT * FROM update_password(
  p_id := 123,
  p_servico := 'Gmail - Atualizado',
  p_descricao := 'Descrição atualizada via RPC'
);
```

**Resultado Esperado:**
- Registro atualizado com sucesso
- Retorna o registro completo com os dados atualizados
- Se ID não existir, deve retornar erro: "Registro com ID X não encontrado"

---

### Teste 4: Deletar Senha (DELETE)

```sql
-- Substituir 123 pelo ID real do registro
SELECT delete_password(123);
```

**Resultado Esperado:**
- Retorna JSON:
  ```json
  {
    "success": true,
    "message": "Senha deletada com sucesso",
    "deleted_record": {
      "id": 123,
      "servico": "Nome do Serviço",
      "created_at": "2025-11-28T..."
    }
  }
  ```
- Se ID não existir, deve retornar erro: "Registro com ID X não encontrado"

---

## 🌐 Testes no Frontend

### Teste 1: Verificar Conexão RPC

1. Abra o console do navegador (F12)
2. Execute:
   ```javascript
   window.testSupabase()
   ```

**Resultado Esperado:**
```
🔍 Testando conexão com o Supabase via RPC...
✅ Funções RPC configuradas corretamente!
📊 X senha(s) encontrada(s)
📋 Estrutura do primeiro registro:
  - ID: 1
  - Serviço: Gmail
  - Categoria: Email
  - Username: ***
  - Password: ***
✅ Estrutura dos dados está correta!
```

---

### Teste 2: Listar Senhas na Página

1. Acesse a página **Senhas** (`/senhas`)
2. Verifique se as senhas são carregadas
3. Verifique os filtros e busca

**Resultado Esperado:**
- Senhas aparecem na tabela
- Filtros funcionam corretamente
- Busca funciona

---

### Teste 3: Criar Nova Senha

1. Na página **Senhas**, clique em "Adicionar Senha"
2. Preencha o formulário:
   - **Serviço:** Teste Frontend
   - **Usuário:** teste@example.com
   - **Senha:** SenhaTest123
   - **Descrição:** Criado via frontend
3. Clique em "Salvar"

**Resultado Esperado:**
- Toast de sucesso: "Senha criada com sucesso"
- Nova senha aparece na tabela
- Log de auditoria registrado

---

### Teste 4: Editar Senha

1. Clique no botão de editar de uma senha
2. Altere alguns campos
3. Clique em "Salvar"

**Resultado Esperado:**
- Toast de sucesso: "Senha atualizada com sucesso"
- Dados atualizados na tabela
- Log de auditoria registrado

---

### Teste 5: Deletar Senha

1. Clique no botão de deletar de uma senha
2. Confirme a exclusão

**Resultado Esperado:**
- Toast de sucesso: "Senha deletada com sucesso"
- Senha removida da tabela
- Log de auditoria registrado

---

## 🐛 Testes de Erro

### Teste 1: Criar sem Serviço

```sql
SELECT * FROM create_password(
  p_servico := ''
);
```

**Resultado Esperado:**
- Erro: "O campo serviço é obrigatório"

---

### Teste 2: Atualizar ID Inexistente

```sql
SELECT * FROM update_password(
  p_id := 999999,
  p_servico := 'Teste'
);
```

**Resultado Esperado:**
- Erro: "Registro com ID 999999 não encontrado"

---

### Teste 3: Deletar ID Inexistente

```sql
SELECT delete_password(999999);
```

**Resultado Esperado:**
- Erro: "Registro com ID 999999 não encontrado"

---

## ✅ Checklist de Validação

### Funcionalidades

- [ ] **GET** - Listar senhas funciona
- [ ] **CREATE** - Criar senha funciona
- [ ] **UPDATE** - Atualizar senha funciona
- [ ] **DELETE** - Deletar senha funciona

### Validações

- [ ] Criar senha sem serviço retorna erro
- [ ] Atualizar ID inexistente retorna erro
- [ ] Deletar ID inexistente retorna erro

### Segurança

- [ ] Estrutura do banco NÃO está exposta no frontend
- [ ] `passwordsConfig.ts` foi removido
- [ ] Apenas tipos TypeScript permanecem no frontend
- [ ] Logs de auditoria funcionam
- [ ] Permissões RPC estão corretas (apenas `authenticated`)

### Frontend

- [ ] Página Senhas carrega corretamente
- [ ] Filtros funcionam
- [ ] Busca funciona
- [ ] CRUD completo funciona via interface
- [ ] Toast messages aparecem corretamente
- [ ] Não há erros no console

---

## 📊 Comparação: Antes vs Depois

### ❌ ANTES (Inseguro)

```typescript
// Frontend expõe estrutura completa do banco
export const PASSWORDS_CONFIG = {
  tableName: 'passwords',
  fieldMapping: {
    id: 'id',
    service: 'servico',
    username: 'usuario',
    password: 'senha',
    // ... todos os campos mapeados
  }
};

// Acesso direto ao banco
const { data } = await supabase
  .from('passwords')  // ❌ Nome da tabela exposto
  .select('*');       // ❌ Estrutura exposta
```

### ✅ DEPOIS (Seguro)

```typescript
// Frontend apenas tipos, sem estrutura do banco
export interface PasswordEntry {
  id: string;
  service: string;
  username: string;
  password: string;
  // ...
}

// Acesso via RPC (estrutura oculta)
const { data } = await supabase
  .rpc('get_passwords');  // ✅ Função abstrata
```

---

## 🚀 Próximos Passos Após Testes

1. ✅ Verificar que todos os testes passaram
2. ✅ Fazer commit das alterações
3. ✅ Atualizar checklist de segurança
4. ✅ Testar em produção (Vercel)
5. ✅ Documentar mudanças no README

---

## 📝 Notas Importantes

### Performance
- Funções RPC são **mais rápidas** que queries complexas
- Ordenação feita no banco é mais eficiente
- Cache pode ser implementado no futuro

### Manutenção
- Mudanças na estrutura do banco são feitas apenas nas funções RPC
- Frontend não precisa ser alterado
- Versionamento de API facilitado

### Segurança
- ✅ Estrutura do banco protegida
- ✅ Validações centralizadas no backend
- ✅ Logs de auditoria funcionando
- ✅ Permissões RLS respeitadas

---

## 🆘 Troubleshooting

### Erro: "function get_passwords() does not exist"

**Solução:**
1. Execute o script `docs/sql/passwords_rpc_functions.sql`
2. Verifique se você está logado no Supabase
3. Verifique as permissões da função

### Erro: "permission denied for function"

**Solução:**
```sql
-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_passwords() TO authenticated;
GRANT EXECUTE ON FUNCTION create_password TO authenticated;
GRANT EXECUTE ON FUNCTION update_password TO authenticated;
GRANT EXECUTE ON FUNCTION delete_password TO authenticated;
```

### Erro: "Column 'X' does not exist"

**Solução:**
- Verifique a estrutura da tabela `passwords`
- Compare com as funções RPC
- Ajuste as funções se necessário

---

**Última Atualização:** 28/11/2025  
**Autor:** Sistema de Segurança - Dashboard TI

