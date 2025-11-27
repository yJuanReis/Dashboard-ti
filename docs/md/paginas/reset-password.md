# Reset Password (`/reset-password`)

Fluxo protegido responsável por finalizar a redefinição de senha iniciada na tela de login. Lida com três cenários:

1. Usuário abriu o link do e-mail de recuperação (token `recovery` no hash) e precisa cadastrar nova senha.
2. Usuário acessou a rota diretamente sem token → precisa autenticar para continuar.
3. Usuário já está logado, mas possui `password_temporary` marcado → força troca imediata via modal.

---

## Conexões com outras páginas e serviços

- **Origem do fluxo**: botão “Recuperar Senha” no `/login` dispara `supabase.auth.resetPasswordForEmail` com `redirectTo /reset-password`.
- **AuthContext**: reutiliza `useAuth()` para `user`, `signIn`, `passwordTemporary`, `checkPasswordTemporary` e `loading`.
- **Logout**: usa `useLogout()` para derrubar sessões inválidas (ex.: perfil não encontrado).
- **Supabase**:
  - `supabase.auth.getSession`, `supabase.auth.updateUser`, `supabase.auth.refreshSession`
  - `supabase.from("user_profiles")` para validar/criar perfil e marcar `password_temporary`.
- **PasswordChangeModal**: quando `password_temporary === true` e usuário já está autenticado, abre o modal global exigindo mudança.

---

## Fluxo de acesso

```59:96:src/pages/ResetPassword.tsx
useEffect(() => {
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get("access_token");
  const type = hashParams.get("type");

  if (!accessToken || type !== "recovery") {
    setNeedsLogin(true);
    return;
  }

  if (user) {
    checkUserExists();
  } else {
    setNeedsLogin(true);
  }
}, [user, navigate, logout]);
```

- Se não houver token `recovery`, a tela exibe cartão solicitando login (cenário 2).
- Se houver token e usuário já estiver logado, chama `checkUserExists` para garantir perfil válido no `user_profiles`.
- Caso não esteja logado, `needsLogin` permanece `true` e o usuário deve autenticar dentro da própria página para prosseguir.

---

## Verificações com Supabase

### Garantir que o perfil existe
```34:57:src/pages/ResetPassword.tsx
const checkUserExists = async () => {
  if (!user?.id) return;
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, nome")
    .eq("user_id", user.id)
    .single();
  if (error || !data) {
    await logout();
    toast.error("Sua conta não foi encontrada...");
    return;
  }
  setNeedsLogin(false);
};
```
- Evita que um usuário sem `user_profiles` continue no fluxo.
- Em caso de ausência, força logout e solicita contato com administrador.

### Sincronizar `password_temporary`
- Após login (`needsLogin` falso) chama `checkPasswordTemporary()` (fornecido pelo AuthContext), que atualiza o estado global e pode abrir o `PasswordChangeModal`.
- No final do reset a página marca `password_temporary: true` novamente para exigir troca imediata ao entrar (ver adiante).

---

## Cenário “precisa logar para continuar”

```256:333:src/pages/ResetPassword.tsx
if (needsLogin) {
  return (
    <Card>
      <form onSubmit={handleLogin}>
        ... inputs de email e senha ...
      </form>
    </Card>
  );
}
```
- Renderiza uma mini tela de login. O handler `handleLogin` reaproveita `useAuth().signIn`.
- Após login bem-sucedido, valida novamente no Supabase se há perfil e se a senha atual é temporária usando `checkPasswordTemporary`.

---

## Formulário principal de redefinição

```337:383:src/pages/ResetPassword.tsx
const handleResetPassword = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!password) { setError("..."); return; }
  if (password.length < 6) { ... }
  if (password !== confirmPassword) { ... }
  if (!nome.trim()) { ... }

  const { data: userProfile, error: checkProfileError } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!userProfile) {
    await supabase.from("user_profiles").insert({
      user_id: user.id,
      email: user.email || "",
      nome: null,
      role: "user",
      password_temporary: true,
    });
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password,
    data: { nome: nome.trim(), name: nome.trim() },
  });
  ...
  await supabase
    .from("user_profiles")
    .update({
      nome: nome.trim(),
      password_temporary: true,
    })
    .eq("user_id", user.id);

  await supabase.auth.refreshSession();
  window.location.href = "/home";
};
```

### Passos principais
1. **Validação local**: senha mínima, confirmação igual e obrigatoriedade do nome.
2. **Check/insert de perfil**: se `user_profiles` estiver vazio, cria um entry com `password_temporary: true`.
3. **Atualiza Supabase Auth**: `updateUser` altera senha e salva `nome`/`name` nos metadados.
4. **Marca `password_temporary`** novamente no perfil → garante que, ao logar depois, o modal force troca imediata (a senha recém-definida via link é considerada temporária por política interna).
5. **Refresh de sessão**: busca tokens atualizados para que o AuthContext reflita o novo nome.
6. **Redirect final**: vai para `/home`, onde `PasswordTemporaryGuard` detectará `password_temporary = true` e obrigará nova troca via modal dedicado.

---

## Modal de senha temporária

```80:95:src/pages/ResetPassword.tsx
useEffect(() => {
  if (passwordTemporary === true && user && !authLoading && !needsLogin) {
    setShowPasswordModal(true);
  } else {
    setShowPasswordModal(false);
  }
}, [passwordTemporary, user, authLoading, needsLogin]);
```
- Caso o usuário chegue logado e o estado global indique senha temporária, o `PasswordChangeModal` abre automaticamente na própria página, reaproveitando o componente usado em outros fluxos.
- Complementa a experiência iniciada nas páginas protegidas (substitui a senha temporária assim que possível).

---

## Interações com outras telas

| Origem/Destino | Como se relaciona |
|----------------|-------------------|
| `Login`        | `resetPasswordForEmail` envia usuário para `/reset-password`; botões e mensagens fazem referência cruzada. |
| `PasswordTemporaryGuard` (Layouts internos) | Após completar reset e redirecionar para `/home`, o guard verifica `password_temporary` e mostra modal forçando nova troca. |
| `Configuracoes` | Ações administrativas que marcam senha temporária ou enviam e-mail de reset têm compatibilidade direta com este fluxo. |
| `Audit Logs`    | Recomenda-se (futuro) registrar eventos de reset para auditoria, embora não esteja implementado aqui. |

---

## Mensagens e UX

- **Dois cartões distintos**:
  - Login obrigatório (quando `needsLogin`).
  - Formulário de redefinição (quando token válido e usuário autenticado).
- **Feedback** com `toast` para erros (nome incorreto, senha fraca, perfil inexistente) e sucesso.
- **Botões com ícones** (ex.: `Lock`, `Eye/EyeOff`) reforçam contexto.
- **Loader** (`Loader2`) no envio de login/reset e no botão do modal de senha temporária reaproveitado.

---

## Pontos de atenção / segurança

- **Validação do token**: só permite fluxo completo se o hash contiver `access_token` e `type=recovery`.
- **Confirmação do nome**: evita que terceiros redefinam senha sem saber o nome cadastrado (requisito interno).
- **Perfil inexistente**: sistema cria automaticamente, mas mantém `password_temporary: true` até que o usuário passe pelo modal final — reduz superfícies inconsistentes.
- **Logout forçado**: se `user_profiles` não existe, sessão é encerrada para impedir acessos parciais.
- **Reuso do modal global**: mantém consistência e garante que qualquer senha temporária seja substituída antes de acessar rotas protegidas.

---

## Possíveis melhorias

- Persistir eventos em `audit_logs` para rastrear redefinições.
- Medir força da senha (ex.: reutilizar `zxcvbn` como em Configurações).
- Expor `password_temporary` no UI para administradores verificarem quem ainda não concluiu o fluxo.
- Internacionalização das mensagens.

---

## Arquivos relacionados

- `src/pages/Login.tsx`: inicia fluxo e redireciona para cá.
- `src/components/PasswordChangeModal.tsx`: modal compartilhado para troca de senha.
- `src/hooks/use-logout.ts`: usado para derrubar sessões durante validações.
- `src/contexts/AuthContext.tsx`: fornece `signIn`, `passwordTemporary`, `checkPasswordTemporary`.

