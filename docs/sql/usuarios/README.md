# 👤 Scripts de Usuários

Esta pasta contém scripts relacionados a usuários, autenticação e perfis.

## 📄 Arquivos

### Criação de Usuários
- **create_user_direct.sql** - Criar usuário diretamente
- **create_user_by_admin_function.sql** - Função para criar usuário por admin
- **criar_perfil_usuario_manual.sql** - Criar perfil de usuário manualmente

### Correções
- **add_password_temporary_field.sql** - Adicionar campo password_temporary
- **fix_create_user_direct_email_confirmation.sql** - Corrigir confirmação de email
- **fix_handle_new_user_trigger.sql** - Corrigir trigger de novo usuário
- **fix_password_temporary_update_policy.sql** - Corrigir política de atualização de senha temporária
- **fix_rls_user_profiles_login.sql** - Corrigir RLS de login de perfis
- **fix_updated_at_trigger.sql** - Corrigir trigger de updated_at

### Verificações
- **verificar_e_corrigir_password_temporary.sql** - Verificar e corrigir password_temporary
- **verificar_e_corrigir_user_profiles.sql** - Verificar e corrigir user_profiles

### Permissões
- **supabase_diagnose_page_permissions.sql** - Diagnosticar permissões de páginas
- **supabase_update_page_permissions.sql** - Atualizar permissões de páginas
- **supabase_user_permissions.sql** - Permissões de usuários

## 🔗 Links Relacionados

- [Funções](../funcoes/)
- [RLS](../rls/)
- [Configuração de Usuários](../../md/configuracao/)

