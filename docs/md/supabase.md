# Supabase – Checklist de Configuração do Projeto

Este documento resume tudo o que o app espera encontrar no Supabase: variáveis de ambiente, tabelas, políticas, funções RPC e serviços habilitados. Use como guia ao subir o backend do dashboard.

---

## 1. Variáveis de ambiente (.env/.env.local)
```env
VITE_SUPABASE_URL=<url do seu projeto>
VITE_SUPABASE_ANON_KEY=<anon public key>
```
- O client (`src/lib/supabaseClient.ts`) lança erro imediatamente se esses valores não existirem.
- Nunca exponha a `service_role` no frontend; qualquer operação privilegiada é feita via RPC no backend.

---

## 2. Autenticação e perfis
- Auth padrão por e-mail/senha.
- Tabela complementar `user_profiles` (relacionada com `auth.users`) precisa existir com os campos:
  - `user_id` (UUID, PK/unique)
  - `email`
  - `nome`
  - `role` (`'admin' | 'user'`)
  - `page_permissions` (json/array de strings)
  - `password_temporary` (boolean)
  - `created_at`, `updated_at`
- Rota `/configuracoes` consulta esse registro para garantir que a role “real” seja `admin` antes de liberar recursos.

### Policies sugeridas (user_profiles)
- `SELECT`: qualquer usuário autenticado pode ler o próprio registro (`user_id = auth.uid()`).
- `INSERT/UPDATE/DELETE`: somente admins (policy pode verificar `exists` em `user_profiles` com `role = 'admin'` para o `auth.uid()`).

---

## 3. Tabelas esperadas

| Tabela             | Uso principal                                                                                   |
|--------------------|--------------------------------------------------------------------------------------------------|
| `passwords`        | Cofre de senhas/credenciais (campos mapeados em `src/lib/passwordsConfig.ts`).                   |
| `nvrs`             | Inventário de NVRs + slots (JSON), usado por Controle NVR/Controle HDs.                          |
| `nvr_config`       | Configurações auxiliares (ex.: preço médio do HD, chave `hd_price`).                             |
| `pages_maintenance`| Lista de rotas em manutenção (path, status, badge, is_active).                                   |
| `audit_logs`       | Histórico de CREATE/UPDATE/DELETE (consumido na página Audit Logs).                              |
| `user_profiles`    | Perfis e permissões (explicado acima).                                                           |
| `user_security_logs`| Registra ações sensíveis (troca de senha, bloqueios).                                           |

> Scripts prontos: veja `tutorial/sql/*.sql` para criar tabelas e funções com o mesmo schema usado aqui (`supabase_user_profiles_table.sql`, `supabase_audit_logs_table.sql`, etc.).

### Policies básicas
- `passwords`, `nvrs`, `nvr_config`, `pages_maintenance`, `user_security_logs`: RLS ativado. `SELECT` liberado para `auth.role() = 'authenticated'`. `INSERT/UPDATE/DELETE` restritos a admins onde fizer sentido.
- `audit_logs`: apenas admins devem conseguir ler (`SELECT`) e ninguém deve escrever manualmente (somente via `logAudit` no backend).

---

## 4. Funções RPC obrigatórias
Usadas para operações administrativas sem expor `service_role`. Devem validar se o `auth.uid()` é admin.

1. `update_user_password_by_admin(target_user_id uuid, new_password text)`
   - Chama `auth.admin.update_user`.
2. `delete_user_by_admin(target_user_id uuid)`
   - Chama `auth.admin.delete_user`.

Ambas são chamadas em `src/lib/adminService.ts`. Se não existirem, a tela de Configurações não consegue resetar ou excluir usuários.

---

## 5. Realtime e Storage
- **Realtime**: habilite para a tabela `nvrs`. O `NVRContext` abre o canal `nvr-changes` e atualiza a interface quando há alterações.
- **Storage**: buckets públicos com logos/imagens usados em Crachás e Assinaturas. Os URLs no código apontam para `https://<project>.supabase.co/storage/v1/object/public/...` e precisam existir.

---

## 6. Scripts utilitários no projeto
- `tutorial/sql/supabase_auth_setup.sql`: configura Auth, RLS e funções RPC.
- `tutorial/sql/supabase_user_profiles_table.sql`, `supabase_logs_table.sql`, etc.: criam tabelas listadas acima.
- `src/lib/checkSupabaseTables.ts`: script para descobrir rapidamente o nome das tabelas se estiver migrando de outro schema.

---

## 7. Policies sugeridas (resumo prático)
- `passwords`: `SELECT` para todos autenticados; `INSERT/UPDATE/DELETE` apenas para quem tiver role `admin` ou permissão especial.
- `nvrs`: `SELECT` para autenticados; `INSERT/UPDATE/DELETE` somente admins (ou equipe NVR).
- `pages_maintenance` e `nvr_config`: somente admins podem escrever; leitura liberada porque o app precisa dessas configs.
- `audit_logs`: `SELECT` restrito aos admins, `INSERT` apenas via função (o serviço já usa `supabase.from('audit_logs').insert` com o usuário atual — garanta política que permita `INSERT` para autenticados).
- `user_security_logs`: qualquer usuário pode `INSERT` (para logar suas ações); leitura opcional para admins.
- `user_profiles`: ver seção 2.

---

## 8. Checklist rápido
1. ✅ Configurar `.env` com URL e ANON KEY.
2. ✅ Criar tabelas (usar scripts existentes).
3. ✅ Habilitar RLS com policies adequadas.
4. ✅ Criar RPCs `update_user_password_by_admin` e `delete_user_by_admin`.
5. ✅ Ativar Realtime na tabela `nvrs`.
6. ✅ Disponibilizar assets necessários no Storage.
7. ✅ Testar com os scripts `testSupabaseConnection.ts` / `testNVRConnection.ts` se precisar validar.

Com tudo isso no lugar, o frontend funciona “plug and play” com sua instância Supabase. Se algo faltar, a maioria dos serviços (`passwordsService`, `nvrService`, `pagesMaintenanceService`) já loga erros descritivos no console para ajudar no diagnóstico.

