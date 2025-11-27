# Login (`/login`)

Interface pública que autentica usuários no Supabase e inicia a sessão do painel. Renderizada fora do `ProtectedRoute`, funciona como porta de entrada para todo o restante do sistema.

---

## Objetivos principais

1. **Validar conectividade com Supabase** e informar indisponibilidade antes de aceitar credenciais.
2. **Autenticar de forma segura** via `useAuth().signIn`, exibindo feedback visual (loaders, toasts, mensagens).
3. **Oferecer recuperação de senha** guiada, disparando o fluxo oficial (`resetPasswordForEmail`) com redirect para `/reset-password`.

---

## Estrutura geral

```12:91:src/pages/Login.tsx
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean | null>(null);
  ...
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          setIsSupabaseConnected(false);
        } else {
          setIsSupabaseConnected(true);
        }
      } catch {
        setIsSupabaseConnected(false);
      }
    };
    checkSupabaseConnection();
  }, []);
```

- **Hooks de estado**: armazenam credenciais, loading, erros, status do modal de recuperação e teste de conectividade.
- **Side-effect inicial**: dispara um `getSession` para checar disponibilidade do backend. Caso falhe, aparece um alerta “Erro de conexão”.

---

## Fluxo de autenticação

```52:87:src/pages/Login.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setIsLoading(true);
  try {
    if (!email.trim()) {
      setError("Por favor, insira seu email");
      setIsLoading(false);
      return;
    }
    if (!password) {
      setError("Por favor, insira sua senha");
      setIsLoading(false);
      return;
    }
    await signIn(email, password);
    navigate("/home");
  } catch {
    setError("Não foi possível fazer login...");
  } finally {
    setIsLoading(false);
  }
};
```

1. **Validação local mínima** (campos vazios) evita chamadas desnecessárias.
2. **`signIn`** delega ao `AuthContext`, que já aplica logging e armazenamento de sessão.
3. **Redirecionamento**: após sucesso, envia para `/home`.
4. **Estados visuais**: botão “Entrar” exibe loader `Loader2` e feedback textual (“Validando no Supabase…”).

---

## Recuperação de senha

```82:121:src/pages/Login.tsx
const handleRecuperarSenha = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!emailRecuperacao.trim() || !emailRecuperacao.includes("@")) {
    toast.error("Por favor, insira um email válido");
    return;
  }
  setIsSendingRecuperacao(true);
  try {
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      emailRecuperacao.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/reset-password` }
    );
    if (resetError) {
      toast.error("Erro ao enviar email de recuperação...");
      setIsSendingRecuperacao(false);
      return;
    }
    toast.success("Email de recuperação enviado!");
    setShowRecuperarSenha(false);
    setEmailRecuperacao("");
  } catch {
    toast.error("Erro ao processar solicitação. Tente novamente.");
  } finally {
    setIsSendingRecuperacao(false);
  }
};
```

- **Modal** aberto pelo botão “Recuperar Senha” pede e-mail e chama `resetPasswordForEmail`.
- **Redirect configurado** para `/reset-password`, garantindo continuidade do fluxo.
- **Mensagens de feedback** via `toast` e loader no botão (ícone `Loader2` + “Enviando...”).

---

## Experiência visual

- **Tema**: layout centralizado com background animado (`aurora-background`) compartilhado com a home.
- **Cartão principal**: `Card` com ícone `Server`, título “BR Marinas” e subtítulo “Painel de TI”.
- **Alertas contextuais**:
  - Conexão supabase falhou → banner vermelho acima do form.
  - Erro de credenciais → alerta com `AlertCircle`.
- **Formulário**: inputs da biblioteca `@/components/ui`, já com `autoComplete` adequado.
- **Ação secundária**: botão “Recuperar Senha” em modo `ghost`.

---

## Dependências e integrações

| Componente/Hook             | Uso                                                           |
|-----------------------------|---------------------------------------------------------------|
| `useAuth` (`signIn`)        | Autenticação com Supabase + gerenciamento de sessão global    |
| `supabase.auth.getSession`  | Health-check inicial                                          |
| `supabase.auth.resetPasswordForEmail` | Dispara email de reset com redirect controlado |
| `toast` (`sonner`)          | Feedback de erro/sucesso                                      |
| `useNavigate`               | Redireciona após login                                        |
| `Dialog`                    | Modal de recuperação                                          |


---

## Segurança & boas práticas

- **Sem leakage de erros detalhados**: mensagens genéricas para login e recuperação, evitando confirmação de existência de conta.
- **Redirect controlado** no reset: usa `window.location.origin` para prevenir open redirects.
- **Campos `autoComplete` configurados** (`email`, `current-password`) ajudam navegadores a gerenciar credenciais de forma segura.
- **Limpeza de estado**: ao fechar modal ou completar ações, os campos são resetados.

---

## Possíveis evoluções

- Capturar e exibir mensagens específicas de MFA/2FA, caso ativado no Supabase.
- Adicionar limite de tentativas e bloqueio temporário semelhante ao módulo de Configurações.
- Logar tentativas com sucesso/erro em `audit_logs` para observabilidade.

---

## Arquivos relacionados

- `src/pages/ResetPassword.tsx`: continuação do fluxo iniciado no modal.
- `src/contexts/AuthContext.tsx`: implementação de `signIn`, logging e armazenamento de sessão.
- `src/components/PasswordChangeModal.tsx`: usado após reset para forçar troca de senha temporária.

