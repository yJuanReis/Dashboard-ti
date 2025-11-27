# Configurações (`/configuracoes`)

Painel administrativo exclusivo para gerenciar usuários, permissões, páginas em manutenção, políticas de senha, link para testes de segurança e ferramentas auxiliares (logs, versão). É a área mais sensível do app, exigindo múltiplas integrações com Supabase e serviços internos.

---

## Acesso e proteções

- **Guardas**:
  - `ProtectedRoute` → exige sessão Supabase válida.
  - `PasswordTemporaryGuard` → força troca de senha temporária antes de entrar.
  - `AdminOnlyRoute` → só permite usuários com role “admin”.
- **Permissões**:
  - Validadas no backend via `user_profiles.role`.
  - Campos `page_permissions` controlam quais rotas cada usuário vê; atualizados aqui.
- **Navegação**: item “Configurações” (ícone `Settings`) só aparece para admins (ver `navigation.config.ts`).

---

## Integrações com Supabase

### Tabela `user_profiles`
- Buscar todos os perfis (com fallback quando tabela não existe).
- Criar, editar (nome/email/role/permissões) e excluir usuários.
- Gerenciar `password_temporary` e `page_permissions`.
- Validar role real (consulta à tabela em vez de confiar apenas nos metadados do Auth).

### Auth API
- `supabase.auth.signInWithPassword` usado para confirmar senha antes de enviar e-mail de redefinição.
- `supabase.auth.updateUser` para trocar senha do usuário autenticado.
- `adminService` (`updateUserPasswordByAdmin`, `deleteUserByAdmin`) usa Supabase Admin API/Functions customizadas.

### Outras tabelas/serviços
- `user_security_logs`: registra ações críticas (troca de senha, tentativa incorreta) via `registrarLogSeguranca`.
- `pagesMaintenance` (`pagesMaintenanceService`): persistir quais rotas estão ocultas/em manutenção no Supabase.
- `audit_logs`: via `logUpdate` para registrar alterações administrativas (quando habilitado).

---

## Estrutura geral

`src/pages/Configuracoes.tsx` tem ~2800 linhas divididas em múltiplas seções. Destaques:

1. **Perfil do usuário atual**:
   - Mostrar nome, e-mail, role real.
   - Editar nome exibido (com loaders e feedback).
2. **Troca de senha (self-service)**:
   - Inputs para senha atual/nova/confirmar, indicador de força (`zxcvbn`).
   - Bloqueio temporário após 3 tentativas incorretas (30s).
   - Registro em `user_security_logs` após sucesso.
3. **Enviar e-mail de redefinição**:
   - Modal que pede nome + senha para confirmar.
   - Chama `supabase.auth.resetPasswordForEmail` com redirect para `/reset-password`.
4. **Gestão de usuários**:
   - Tabela com todos os perfis (fallback para usuário atual se tabela não existir).
   - Criar usuário: define email, role, permissões de páginas.
   - Editar usuário: altera nome/email/role/permissões.
   - Resetar senha de terceiros (`updateUserPasswordByAdmin`).
   - Excluir usuário (`deleteUserByAdmin`).
5. **Páginas em manutenção**:
   - Lista proveniente de `pagesMaintenanceService`.
   - Permite marcar/desmarcar rotas para esconder da navegação (ex.: `/chamados` antes de ficar pronto).
   - Campo para observações/logs.
6. **Ferramentas de segurança**:
   - Botão para abrir `/security-test` (seta `sessionStorage.securityTestFromConfig`).
   - Link para `/audit-logs`.
   - Cartões com recomendações de segurança.
7. **Informações de versão**:
   - Usa `getVersionString`/`getVersionInfo` (`src/lib/version.ts`) para exibir versão, hash, datas.
8. **Outros**:
   - Ações de logout.
   - Logs/console (via `logger`) para debug.

---

## Fluxos específicos

### Troca de senha (self)

```446:536:src/pages/Configuracoes.tsx
const handleAlterarSenha = useCallback(async () => {
  if (estaBloqueado) { toast.error(`Aguarde ${tempoRestante} segundos...`); return; }
  if (!senhaAtual || !novaSenha || !confirmarSenha) { ... }
  if (novaSenha.length < 6 || novaSenha !== confirmarSenha) { ... }
  if (forcaSenha.score < 2) { toast.error("Senha muito fraca"); return; }

  const { error: signInError } = await supabase.auth.signInWithPassword({ email: user?.email, password: senhaAtual });
  if (signInError) { incrementarTentativaErrada(); toast.error("Senha atual incorreta"); return; }
  resetarTentativas();

  const { error: updateError } = await supabase.auth.updateUser({ password: novaSenha });
  if (updateError) { toast.error("Erro ao alterar senha"); return; }

  const ip = await getUserIP();
  await registrarLogSeguranca(user?.id, "password_changed", ip);
  toast.success("Senha alterada com sucesso!");
  limparCampos();
}, [...]);
```

- Valida entrada, força mínima e confirma senha atual via login.
- Bloqueia tentativas repetidas (incrementa contador, aplica timer).
- Registra log em `user_security_logs`.

### Criar/editar usuário

```614:799:src/pages/Configuracoes.tsx
const carregarUsuarios = useCallback(async () => {
  if (tabelaProfilesExiste === false) {
    // fallback: usa apenas usuário atual
    return;
  }
  if (realRole !== 'admin') return;
  setLoadingUsuarios(true);
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);
    ...
    const { data: allProfiles } = await supabase.from("user_profiles").select("*").order("created_at", { ascending: false });
    setUsuarios(allProfiles.map(mapper));
  } catch (error) {
    toast.error("Erro ao carregar usuários. Verifique se a tabela user_profiles existe.");
    fallbackParaUsuarioAtual();
  } finally {
    setLoadingUsuarios(false);
  }
}, [...]);
```

- Detecta se a tabela existe; se não, evita erro repetido e usa fallback.
- Mapeia `page_permissions` cuidando de `null` vs `[]`.
- Modais permitem atribuir arrays de permissões para cada usuário.

### Páginas em manutenção

```355:359:src/pages/Configuracoes.tsx
const [pagesMaintenance, setPagesMaintenance] = useState<PageMaintenanceConfigService[]>([]);
...
useEffect(() => {
  const loadPagesMaintenance = async () => {
    setLoadingPagesMaintenance(true);
    try {
      const data = await getAllPagesMaintenance();
      setPagesMaintenance(data);
    } finally {
      setLoadingPagesMaintenance(false);
    }
  };
  loadPagesMaintenance();
}, []);
```

- Usa serviço `pagesMaintenanceService` para ler/atualizar configs.
- Controla expansão dos cards (`pagesMaintenanceExpanded`).
- Interface permite marcar rotas como “ocultas por padrão” e salvar observações.

---

## UX e componentes

- Página longa com várias seções, cada uma em `Card`/`Accordion`.
- Usa badges/ícones `ShieldAlert`, `ShieldCheck`, `Database` etc. para comunicar contexto.
- Modais (`Dialog`, `AlertDialog`) para ações destrutivas ou confirmação.
- Feedback constante via `toast`.
- Campos com skeleton/loaders enquanto supabase responde.

---

## Boas práticas implementadas

- **Verificação de role real**: busca no banco em vez de confiar apenas nos metadados (mitiga alteração manual no client).
- **Fallback quando tabela não existe**: evita apps quebrando em ambientes onde BK ainda não foi provisionado.
- **Bloqueio de brute force**: troca de senha tem contagem/timer e logs.
- **Logs de segurança**: registra IP, ação, timestamp.
- **Versionamento**: informa versão/commit usando script automático (`scripts/generate-version.js`).

---

## Possíveis evoluções

- Auditar todas as ações e exibir timeline na própria página.
- Editor visual para `page_permissions` (drag-and-drop por grupos).
- Integração com MFA (configurar chaves/OTP).
- Painel de health check (ver status de Supabase, storage, etc.).

---

## Arquivos relacionados

- `src/pages/Configuracoes.tsx` – página completa.
- `src/lib/adminService.ts`, `src/lib/auditService.ts`, `src/lib/pagesMaintenanceService.ts`, `src/lib/passwordGenerator.ts`, `src/lib/version.ts`.
- `src/components/PasswordChangeModal.tsx` (usado por guardas/fluxos).

