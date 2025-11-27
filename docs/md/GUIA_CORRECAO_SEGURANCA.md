# 🔒 GUIA COMPLETO DE CORREÇÃO DE SEGURANÇA

## 📋 ÍNDICE

1. [Problemas Identificados](#problemas-identificados)
2. [Solução Implementada](#solução-implementada)
3. [Como Aplicar as Correções](#como-aplicar-as-correções)
4. [Verificação e Testes](#verificação-e-testes)
5. [Detalhes Técnicos](#detalhes-técnicos)
6. [Troubleshooting](#troubleshooting)

---

## ❌ PROBLEMAS IDENTIFICADOS

### Relatório do Pentest (19/11/2025)

```
Total de Testes: 41
✅ Passou: 23 (56%)
⚠️ Avisos: 16 (39%)
❌ Falhou: 2 (5%)
```

### 🚨 Falhas Críticas

1. **SERVICE_ROLE_KEY Exposta**
   - ❌ Chave de serviço detectada no frontend
   - ⚠️ Risco: Acesso total ao banco de dados

2. **Acesso Não Autorizado**
   - ❌ Usuários acessando dados de outros usuários
   - ⚠️ Risco: Vazamento de informações sensíveis

### ⚠️ Problemas de Políticas RLS

**Estado Anterior:**
- ✅ RLS ativado mas com políticas permissivas demais
- ❌ Políticas `allow_all` permitindo acesso total
- ❌ Usuários comuns vendo dados de outros usuários
- ⚠️ Tabelas sem RLS (`nvrs`, `nvr_config`)

---

## ✅ SOLUÇÃO IMPLEMENTADA

### 🎯 Objetivos

✅ **Manter** todas as funcionalidades existentes  
✅ **Corrigir** vulnerabilidades de segurança  
✅ **Implementar** RLS adequado em todas as tabelas  
✅ **Separar** permissões entre admin e usuário comum  

### 📊 Políticas de Segurança por Tabela

#### 1. **user_profiles** (Perfis de Usuários)

| Operação | Usuário Comum | Admin |
|----------|---------------|-------|
| **SELECT** | ✅ Apenas seu perfil | ✅ Todos os perfis |
| **UPDATE** | ✅ Apenas seu perfil | ✅ Todos os perfis |
| **INSERT** | ❌ Negado | ✅ Permitido |
| **DELETE** | ❌ Negado | ✅ Permitido |

**Por quê?**
- Usuário comum só gerencia seus próprios dados
- Admin gerencia todo o sistema de usuários

---

#### 2. **passwords** (Senhas Compartilhadas)

| Operação | Usuário Comum | Admin |
|----------|---------------|-------|
| **SELECT** | ✅ Todas as senhas | ✅ Todas as senhas |
| **INSERT** | ✅ Adicionar senhas | ✅ Adicionar senhas |
| **UPDATE** | ✅ Editar senhas | ✅ Editar senhas |
| **DELETE** | ❌ Negado | ✅ Permitido |

**Por quê?**
- Senhas são compartilhadas entre toda equipe de TI
- Delete restrito a admin para evitar exclusões acidentais
- Mantém funcionalidade de colaboração

---

#### 3. **nvrs** (Gravadores de Vídeo)

| Operação | Usuário Comum | Admin |
|----------|---------------|-------|
| **SELECT** | ✅ Todos os NVRs | ✅ Todos os NVRs |
| **INSERT** | ✅ Adicionar NVRs | ✅ Adicionar NVRs |
| **UPDATE** | ✅ Editar NVRs | ✅ Editar NVRs |
| **DELETE** | ❌ Negado | ✅ Permitido |

**Por quê?**
- NVRs são recursos compartilhados da infraestrutura
- Equipe toda gerencia NVRs
- Delete restrito a admin por segurança

---

#### 4. **nvr_config** (Configurações do Sistema)

| Operação | Usuário Comum | Admin |
|----------|---------------|-------|
| **SELECT** | ✅ Ler configs | ✅ Ler configs |
| **INSERT** | ❌ Negado | ✅ Permitido |
| **UPDATE** | ❌ Negado | ✅ Permitido |
| **DELETE** | ❌ Negado | ✅ Permitido |

**Por quê?**
- Configurações são sensíveis (ex: preço de HD)
- Todos podem consultar, só admin modifica
- Previne alterações acidentais

---

#### 5. **logs** (Registro de Auditoria)

| Operação | Usuário Comum | Admin |
|----------|---------------|-------|
| **SELECT** | ❌ Negado | ✅ Ver todos os logs |
| **INSERT** | ✅ Inserir logs | ✅ Inserir logs |
| **UPDATE** | ❌ **NEGADO A TODOS** | ❌ **NEGADO A TODOS** |
| **DELETE** | ❌ Negado | ✅ Limpeza de logs |

**Por quê?**
- Logs são para auditoria e segurança
- Usuários podem gerar logs de suas ações
- Logs são **imutáveis** (não podem ser editados)
- Apenas admin visualiza logs (dados sensíveis)

---

## 🚀 COMO APLICAR AS CORREÇÕES

### Passo 1: Acessar o Supabase Dashboard

1. Faça login no [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto: `fwjecuftytchybzusetq`
3. Vá para **SQL Editor** (menu lateral)
   - URL direta: `https://supabase.com/dashboard/project/fwjecuftytchybzusetq/sql/new`

---

### Passo 2: Executar Script de Correção

1. **Abra o arquivo:**
   ```
   tutorial/sql/CORRIGIR_SEGURANCA_COMPLETA.sql
   ```

2. **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)

3. **Cole no SQL Editor** do Supabase

4. **Execute o script** (botão "Run" ou Ctrl+Enter)

5. **Aguarde a conclusão** - você verá mensagens de sucesso:
   ```sql
   ✅ POLÍTICAS DE SEGURANÇA APLICADAS COM SUCESSO
   ```

⏱️ **Tempo estimado:** 10-15 segundos

---

### Passo 3: Verificar a Aplicação

1. **Abra um novo Query no SQL Editor**

2. **Cole e execute:**
   ```
   tutorial/sql/VERIFICAR_SEGURANCA.sql
   ```

3. **Verifique os resultados:**
   ```
   ✅ RLS: 5 de 5 tabelas com RLS ativo (PERFEITO)
   ✅ POLÍTICAS: 19 políticas configuradas (PERFEITO)
   ✅ FUNÇÃO: is_admin() está configurada
   
   🎉 SEGURANÇA OK - Todas as verificações passaram!
   ```

---

## ✅ VERIFICAÇÃO E TESTES

### Teste 1: Como Usuário Comum (no SQL Editor)

```sql
-- Faça login como usuário comum (não-admin)
SELECT * FROM user_profiles;
```

**✅ Resultado esperado:**  
- Retorna **APENAS 1 linha** (seu próprio perfil)

**❌ Se retornar múltiplas linhas:**  
- RLS não está funcionando corretamente
- Reexecute `CORRIGIR_SEGURANCA_COMPLETA.sql`

---

### Teste 2: Como Admin (no SQL Editor)

```sql
-- Faça login como admin
SELECT * FROM user_profiles;
```

**✅ Resultado esperado:**  
- Retorna **TODAS as linhas** (todos os perfis)

---

### Teste 3: Senhas Compartilhadas

```sql
-- Como qualquer usuário autenticado
SELECT COUNT(*) FROM passwords;
```

**✅ Resultado esperado:**  
- Retorna contagem de senhas (todos veem as senhas compartilhadas)

---

### Teste 4: Logs (Usuário Comum)

```sql
-- Como usuário comum (não-admin)
SELECT * FROM logs;
```

**✅ Resultado esperado:**  
- Retorna **0 linhas** (usuário comum não vê logs)

---

### Teste 5: Logs (Admin)

```sql
-- Como admin
SELECT * FROM logs;
```

**✅ Resultado esperado:**  
- Retorna **todos os logs** (admin vê tudo)

---

### Teste 6: Frontend (Teste de Segurança)

1. **Acesse a página:**
   ```
   http://localhost:5173/security-test
   ```

2. **Execute:**
   - Clique em **"Executar Todos os Testes"**

3. **Verifique:**
   ```
   ✅ Acesso Não Autorizado: PASSOU
   ⚠️ Segurança de Endpoints API: AVISO (apenas em DEV)
   
   Total: 0 falhas críticas
   ```

---

## 🔧 DETALHES TÉCNICOS

### Função `is_admin()`

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Características:**
- ✅ `SECURITY DEFINER`: Executa com privilégios do dono
- ✅ Verifica role do usuário atual
- ✅ Usada em todas as políticas RLS
- ✅ Performance: cache automático do Postgres

---

### Exemplo de Política RLS

```sql
-- Exemplo: user_profiles SELECT
CREATE POLICY "user_profiles_select_policy"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id    -- Vê o próprio perfil
  OR
  public.is_admin()       -- OU é admin (vê todos)
);
```

**Como funciona:**
1. Usuário faz query: `SELECT * FROM user_profiles`
2. Postgres adiciona automaticamente: `WHERE (auth.uid() = user_id OR is_admin())`
3. Usuário comum: retorna só seu perfil
4. Admin: retorna todos os perfis

---

### Políticas Imutáveis (Logs)

```sql
-- Logs NÃO tem política de UPDATE
-- Resultado: NENHUM usuário pode editar logs
```

**Por quê?**
- Logs são para auditoria
- Devem ser imutáveis (não editáveis)
- Garante integridade da auditoria

---

## 🆘 TROUBLESHOOTING

### ❌ Erro: "policy already exists"

**Causa:** Políticas antigas ainda existem

**Solução:** O script já remove políticas antigas automaticamente. Se ainda assim ocorrer:

```sql
-- Execute manualmente antes do script principal
DROP POLICY IF EXISTS "allow_all_select" ON user_profiles;
DROP POLICY IF EXISTS "allow_all_update" ON user_profiles;
DROP POLICY IF EXISTS "allow_all_insert" ON user_profiles;
DROP POLICY IF EXISTS "allow_all_delete" ON user_profiles;
-- ... repita para outras tabelas conforme necessário
```

---

### ❌ Erro: "function is_admin() does not exist"

**Causa:** Função não foi criada

**Solução:** Execute novamente o script `CORRIGIR_SEGURANCA_COMPLETA.sql`

---

### ⚠️ Usuário comum ainda vê dados de outros

**Verificações:**

1. **RLS está ativo?**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'user_profiles';
   ```
   - Deve retornar `rowsecurity = true`

2. **Políticas estão corretas?**
   ```sql
   SELECT policyname, cmd 
   FROM pg_policies 
   WHERE tablename = 'user_profiles';
   ```
   - Deve ter 4 políticas (SELECT, UPDATE, INSERT, DELETE)

3. **Limpe cache do navegador:**
   - Ctrl+Shift+R (hard refresh)
   - Faça logout e login novamente

---

### ⚠️ Admin não consegue ver todos os dados

**Verificações:**

1. **Usuário é realmente admin?**
   ```sql
   SELECT role FROM user_profiles WHERE user_id = auth.uid();
   ```
   - Deve retornar `role = 'admin'`

2. **Função is_admin() funciona?**
   ```sql
   SELECT public.is_admin();
   ```
   - Deve retornar `true` para admin

3. **Promover usuário a admin:**
   ```sql
   UPDATE user_profiles 
   SET role = 'admin' 
   WHERE email = 'seu-email@exemplo.com';
   ```

---

### ⚠️ Erro ao inserir logs

**Causa:** RLS pode estar bloqueando inserção

**Solução:**
```sql
-- Verificar política de INSERT em logs
SELECT * FROM pg_policies 
WHERE tablename = 'logs' AND cmd = 'INSERT';
```

- Deve permitir INSERT para `authenticated`

---

## 📊 CHECKLIST FINAL

Antes de considerar concluído, verifique:

- [ ] Script `CORRIGIR_SEGURANCA_COMPLETA.sql` executado com sucesso
- [ ] Script `VERIFICAR_SEGURANCA.sql` mostra "✅ SEGURANÇA OK"
- [ ] Teste 1 (usuário comum) passou - vê apenas 1 perfil
- [ ] Teste 2 (admin) passou - vê todos os perfis
- [ ] Teste 3 passou - senhas acessíveis a todos
- [ ] Teste 4 passou - usuário comum não vê logs
- [ ] Teste 5 passou - admin vê todos os logs
- [ ] Teste 6 (frontend `/security-test`) passou - 0 falhas críticas
- [ ] Aplicação funciona normalmente para usuários comuns
- [ ] Aplicação funciona normalmente para admins
- [ ] `SERVICE_ROLE_KEY` removida do `.env.local` (se existir)

---

## 🎉 RESULTADO ESPERADO

### Antes da Correção
```
❌ Falhou: 2 (5%)
⚠️ Avisos: 16 (39%)
```

### Depois da Correção
```
✅ Passou: 100%
❌ Falhou: 0
⚠️ Avisos: 0-2 (apenas avisos de desenvolvimento)
```

---

## 📚 PRÓXIMOS PASSOS

1. ✅ **Monitoramento:**
   - Execute `VERIFICAR_SEGURANCA.sql` mensalmente
   - Revise logs de auditoria regularmente

2. ✅ **Manutenção:**
   - Mantenha dependências atualizadas
   - Revise permissões ao adicionar novas tabelas

3. ✅ **Documentação:**
   - Documente novas tabelas que criar
   - Adicione políticas RLS para novas tabelas

4. ✅ **Backup:**
   - Configure backups automáticos no Supabase
   - Teste restauração de backup periodicamente

---

## 📞 SUPORTE

Se encontrar problemas não cobertos neste guia:

1. Revise os logs do Supabase Dashboard
2. Verifique as mensagens de erro completas
3. Consulte a [documentação do Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)

---

**Criado em:** 19/11/2025  
**Versão:** 1.0  
**Última atualização:** 19/11/2025

