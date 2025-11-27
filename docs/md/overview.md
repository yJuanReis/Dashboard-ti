# Visão Geral do Dashboard TI BR Marinas

Documento que resume como o projeto está estruturado: arquitetura, fluxo de autenticação, navegação, páginas principais, integrações com Supabase e contextos compartilhados.

---

## 1. Arquitetura e Tech Stack
- **Frontend**: React + Vite + TypeScript, UI baseada em shadcn/ui + TailwindCSS.
- **Gerência de estado**: hooks e contextos leves (`AuthContext`, `NVRContext`, `NavigationHistoryContext`, `ThemeContext`).
- **Build**: `npm run build` (script `prebuild` gera `src/lib/version.json` com número de commits).
- **Ferramentas auxiliares**: `zxcvbn` (força de senha), `html2canvas`, `cropperjs`, `@supabase/supabase-js`, `sonner` (toasts), `lucide-react`.
- **Backend**: Supabase (Auth, Postgres, Storage, Functions, Realtime).

---

## 2. Fluxo de autenticação e guards
1. **Login `/login`** – valida credenciais no Supabase Auth.
2. **ProtectedRoute** – verifica sessão antes de renderizar o layout protegido.
3. **PasswordTemporaryGuard** – se `user_profiles.password_temporary` for true, mostra o modal obrigando troca (via `/reset-password` ou `PasswordChangeModal`).
4. **PagePermissionGuard** – confere se a rota está em `user_profiles.page_permissions`.
5. **AdminOnlyRoute** – valida `role === 'admin'` para telas sensíveis (`/configuracoes`, `/audit-logs`).

Além disso, a rota `/security-test` exige um flag de sessão (`sessionStorage.securityTestFromConfig`) setado na Configuração antes de permitir acesso.

---

## 3. Contextos principais
| Contexto                     | Responsabilidade |
|------------------------------|------------------|
| `AuthContext`                | Sessão Supabase, `signIn`, `signOut`, `passwordTemporary`. |
| `NavigationHistoryContext`   | Guarda últimas páginas visitadas (aproveitado no header). |
| `NVRContext`                 | Carrega/atualiza NVRs e slots, integra Realtime Supabase. |
| `ThemeContext`               | Tema claro/escuro. |

---

## 4. Páginas (resumo rápido)
> Todas as páginas possuem documentação detalhada em `docs/md/paginas/<nome>.md`.

| Página | Rota | Guardas | Status |
|--------|------|---------|--------|
| Login | `/login` | Público | Ativo |
| Reset Password | `/reset-password` | Público (depende de token) | Ativo |
| Home | `/home` | ProtectedRoute + PagePermissionGuard | Placeholder visual |
| Senhas | `/senhas` | ProtectedRoute + PagePermissionGuard | Produção |
| Crachás | `/crachas` | Idem | Produção |
| Assinaturas | `/assinaturas` | Idem | Produção |
| Termos | `/termos` | Idem | Produção |
| Controle NVR | `/controle-nvr` | Idem | Produção |
| Controle de HDs | `/controle-hds` | Idem | Produção |
| Servidores | `/servidores` | Idem | Em desenvolvimento |
| Gestão de Rede | `/gestaorede` | Idem | Em desenvolvimento |
| Chamados | `/chamados` | Idem | Em desenvolvimento |
| Configurações | `/configuracoes` | AdminOnlyRoute | Produção |
| Audit Logs | `/audit-logs` | AdminOnlyRoute | Produção |
| Security Test | `/security-test` | Guardas + flag da Configuração | Produção |
| Not Found | `*` | Público | Produção |

---

## 5. Integração com Supabase
Itens obrigatórios (detalhes em `docs/md/supabase.md`):
- Variáveis `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Tabelas: `passwords`, `nvrs`, `nvr_config`, `pages_maintenance`, `audit_logs`, `user_profiles`, `user_security_logs`.
- Policies RLS para cada tabela e Realtime habilitado em `nvrs`.
- RPCs `update_user_password_by_admin` e `delete_user_by_admin`.
- Storage público com logos usados em Crachás/Assinaturas.

---

## 6. Auditoria e segurança
- `auditService` registra CREATE/UPDATE/DELETE com usuário/IP, sanitizando campos sensíveis.
- Página `/audit-logs` expõe esses registros com filtros, paginação e modal de detalhes.
- Controle de senha:
  - Senhas nunca ficam visíveis por padrão (cards de Senhas).
  - Troca de senha do usuário exige senha atual, valida força (`zxcvbn`) e registra log em `user_security_logs`.
  - Senhas resetadas via admin são tratadas por RPC no backend (nenhum uso de `service_role` no client).
- Security Test dispara `runSecurityTests` e oferece relatório TXT para pentest interno.

---

## 7. Principais fluxos por área
- **Gestão de usuários** (Configurações): admins listam/permissões, criam usuários, resetam senhas, marcam rotas em manutenção e acessam versionamento e logs.
- **Senhas**: grid/cards com export CSV e edição inline, integrados ao Supabase e Audit Logs.
- **Crachás/Assinaturas/Termos**: ferramentas visuais para gerar arte (PNG ou PDF) usando `html2canvas` / `pdf-lib`.
- **Controle NVR**: CRUD completo de NVRs, slots com editor flutuante, Realtime.
- **Controle HDs**: derivado do NVR, calcula KPIs e gera relatório XLSX.
- **Audit Logs**: rastreia todas as ações sensíveis e facilita investigações.

---

## 8. Referências úteis
- `docs/md/paginas/` – documentação individual de cada rota.
- `docs/md/supabase.md` – checklist completo do backend.
- `tutorial/sql/` – scripts SQL para criar tabelas, policies e funções.
- `src/lib/` – serviços de acesso a dados (senha, NVR, auditoria, páginas em manutenção).

---

## 9. Como manter a documentação atualizada
1. Ao criar/alterar páginas, atualize o `.md` correspondente em `docs/md/paginas/`.
2. Se adicionar novas tabelas/policies, edite também `docs/md/supabase.md`.
3. Para overview geral, edite este arquivo (`docs/md/overview.md`) e/ou `docs/md/paginas.md`.

Com essas referências, qualquer membro da equipe consegue entender rapidamente o objetivo de cada área do dashboard e quais dependências precisam estar operacionais.

