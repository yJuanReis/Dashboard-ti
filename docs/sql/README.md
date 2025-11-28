# 📊 Scripts SQL do Dashboard TI

Esta pasta contém todos os scripts SQL organizados por categoria para facilitar a navegação e manutenção.

## 📁 Estrutura de Pastas

### 📋 [tabelas/](./tabelas/)
Scripts para criação e gerenciamento de tabelas.

- `supabase_user_profiles_table.sql` - Tabela de perfis de usuários
- `supabase_audit_logs_table.sql` - Tabela de logs de auditoria
- `supabase_logs_table.sql` - Tabela de logs do sistema
- `supabase_nvr_table.sql` - Tabela de NVRs
- `supabase_nvr_config_table.sql` - Tabela de configuração de NVRs
- `pages_maintenance_table.sql` - Tabela de manutenção de páginas
- `access_requests_table.sql` - Tabela de requisições de acesso
- `remove_access_requests_table.sql` - Remover tabela de requisições

### 🔒 [rls/](./rls/)
Políticas de Row Level Security (RLS) e scripts de correção.

- `CORRIGIR_RLS_ACESSO.sql` - Corrigir RLS de acesso
- `REVERTER_RLS.sql` - Reverter políticas RLS
- `DESABILITAR_RLS_URGENTE.sql` - Desabilitar RLS urgentemente (emergência)
- `supabase_fix_page_permissions_rls.sql` - Corrigir RLS de permissões de páginas

### ⚙️ [funcoes/](./funcoes/)
Funções RPC (Remote Procedure Calls) e stored procedures.

- `supabase_admin_functions.sql` - Funções administrativas
- `passwords_rpc_functions.sql` - Funções RPC para senhas
- `get_client_ip_function.sql` - Função para obter IP do cliente
- `confirm_user_email.sql` - Função para confirmar email do usuário

### 👤 [usuarios/](./usuarios/)
Scripts relacionados a usuários, autenticação e perfis.

- `create_user_direct.sql` - Criar usuário diretamente
- `create_user_by_admin_function.sql` - Função para criar usuário por admin
- `criar_perfil_usuario_manual.sql` - Criar perfil de usuário manualmente
- `add_password_temporary_field.sql` - Adicionar campo password_temporary
- `fix_create_user_direct_email_confirmation.sql` - Corrigir confirmação de email
- `fix_handle_new_user_trigger.sql` - Corrigir trigger de novo usuário
- `fix_password_temporary_update_policy.sql` - Corrigir política de atualização de senha temporária
- `fix_rls_user_profiles_login.sql` - Corrigir RLS de login de perfis
- `fix_updated_at_trigger.sql` - Corrigir trigger de updated_at
- `verificar_e_corrigir_password_temporary.sql` - Verificar e corrigir password_temporary
- `verificar_e_corrigir_user_profiles.sql` - Verificar e corrigir user_profiles
- `supabase_diagnose_page_permissions.sql` - Diagnosticar permissões de páginas
- `supabase_update_page_permissions.sql` - Atualizar permissões de páginas
- `supabase_user_permissions.sql` - Permissões de usuários

### 📝 [auditoria/](./auditoria/)
Scripts relacionados ao sistema de auditoria.

- `audit_logs_rls_policies.sql` - Políticas RLS para logs de auditoria
- `audit_logs_retention_policy.sql` - Política de retenção de logs

### 🔧 [correcoes/](./correcoes/)
Scripts de correção e verificação de segurança.

- `CORRIGIR_SEGURANCA_COMPLETA.sql` - Correção completa de segurança
- `VERIFICAR_SEGURANCA.sql` - Verificar configurações de segurança

### 🚀 [setup/](./setup/)
Scripts de configuração inicial e setup.

- `SETUP_COMPLETO_ADMIN.sql` - Setup completo para admin
- `supabase_auth_setup.sql` - Setup de autenticação do Supabase

## 🔗 Ordem Recomendada de Execução

### Setup Inicial

1. **Setup básico:**
   ```sql
   -- 1. Setup de autenticação
   setup/supabase_auth_setup.sql
   
   -- 2. Criar tabelas principais
   tabelas/supabase_user_profiles_table.sql
   tabelas/supabase_audit_logs_table.sql
   tabelas/supabase_logs_table.sql
   tabelas/supabase_nvr_table.sql
   tabelas/supabase_nvr_config_table.sql
   tabelas/pages_maintenance_table.sql
   ```

2. **Funções RPC:**
   ```sql
   funcoes/supabase_admin_functions.sql
   funcoes/passwords_rpc_functions.sql
   funcoes/get_client_ip_function.sql
   funcoes/confirm_user_email.sql
   ```

3. **RLS Policies:**
   ```sql
   rls/supabase_fix_page_permissions_rls.sql
   auditoria/audit_logs_rls_policies.sql
   ```

4. **Setup Admin:**
   ```sql
   setup/SETUP_COMPLETO_ADMIN.sql
   ```

### Manutenção

- **Correções de usuários:** `usuarios/fix_*.sql`
- **Verificações:** `correcoes/VERIFICAR_SEGURANCA.sql`
- **Correções de segurança:** `correcoes/CORRIGIR_SEGURANCA_COMPLETA.sql`

## ⚠️ Avisos Importantes

1. **Sempre faça backup** antes de executar scripts de correção
2. **Teste em ambiente de desenvolvimento** primeiro
3. **Leia os comentários** em cada script antes de executar
4. **Scripts de emergência** (como `DESABILITAR_RLS_URGENTE.sql`) devem ser usados apenas em situações críticas

## 📚 Documentação Relacionada

- [Documentação Supabase](../md/supabase/)
- [Checklist de Segurança](../../CHECKLIST_SEGURANCA.md)
- [Sistema de Auditoria](../md/seguranca/SISTEMA_AUDITORIA.md)

---

**Última atualização**: 28/11/2024

