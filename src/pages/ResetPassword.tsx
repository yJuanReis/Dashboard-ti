import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLogout } from "@/hooks/use-logout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { PasswordChangeModal } from "@/components/PasswordChangeModal";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nome, setNome] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, passwordTemporary, checkPasswordTemporary, loading: authLoading } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const logout = useLogout();

  const checkUserExists = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, nome")
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        // Usuário não existe no banco, fazer logout
        await logout();
        toast.error("Sua conta não foi encontrada. Por favor, entre em contato com o administrador.");
        return;
      }

      // Se chegou aqui, o usuário existe e está logado
      setNeedsLogin(false);
    } catch (err) {
      console.error("Erro ao verificar usuário:", err);
      await logout();
    }
  };

  useEffect(() => {
    // Verificar se há um token de reset na URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const type = hashParams.get("type");

    // Se não houver token ou não for do tipo recovery, redirecionar
    if (!accessToken || type !== "recovery") {
      setNeedsLogin(true);
      return;
    }

    // Se já estiver logado, verificar se precisa fazer login novamente
    if (user) {
      checkUserExists();
    } else {
      setNeedsLogin(true);
    }
  }, [user, navigate, logout]);

  // Verificar senha temporária quando o usuário estiver logado
  useEffect(() => {
    if (user && !authLoading) {
      checkPasswordTemporary();
    }
  }, [user, authLoading, checkPasswordTemporary]);

  // Mostrar modal se senha for temporária
  useEffect(() => {
    if (passwordTemporary === true && user && !authLoading && !needsLogin) {
      console.log("ResetPassword: Mostrando modal de senha temporária");
      setShowPasswordModal(true);
    } else {
      setShowPasswordModal(false);
    }
  }, [passwordTemporary, user, authLoading, needsLogin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoggingIn(true);

    try {
      if (!email.trim()) {
        setError("Por favor, insira seu email");
        setIsLoggingIn(false);
        return;
      }

      if (!loginPassword) {
        setError("Por favor, insira sua senha");
        setIsLoggingIn(false);
        return;
      }

      // Fazer login
      await signIn(email, loginPassword);

      // Verificar se o usuário existe no banco
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        const { data: userProfile, error: profileError } = await supabase
          .from("user_profiles")
          .select("id, nome")
          .eq("user_id", sessionData.session.user.id)
          .single();

        if (profileError || !userProfile) {
          await logout();
          toast.error("Sua conta não foi encontrada. Por favor, entre em contato com o administrador.");
          return;
        }

        // Login bem-sucedido, continuar com reset de senha
        setNeedsLogin(false);
        // Verificar senha temporária após login
        await checkPasswordTemporary();
      }
    } catch (_error: any) {
      setError("Não foi possível fazer login. Verifique suas credenciais ou tente novamente mais tarde.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError("Por favor, insira uma nova senha");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (!nome.trim()) {
      setError("Por favor, preencha seu nome");
      return;
    }

    setIsLoading(true);

    try {
      // Verificar se o nome corresponde ao nome do usuário no banco
      if (!user?.id) {
        setError("Sessão inválida. Por favor, faça login novamente.");
        setIsLoading(false);
        return;
      }

      // Verificar se o perfil existe (não precisa validar nome, pois será preenchido agora)
      const { data: userProfile, error: checkProfileError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (checkProfileError && checkProfileError.code !== 'PGRST116') {
        // Erro diferente de "não encontrado"
        console.warn("Erro ao verificar perfil:", checkProfileError);
      }

      // Se o perfil não existir, criar (não deve acontecer, mas por segurança)
      if (!userProfile) {
        const { error: createError } = await supabase
          .from("user_profiles")
          .insert({
            user_id: user.id,
            email: user.email || "",
            nome: null,
            role: "user",
            password_temporary: true,
          });
        
        if (createError) {
          console.warn("Erro ao criar perfil:", createError);
        }
      }

      // Atualizar senha e nome nos metadados do Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
        data: {
          nome: nome.trim(),
          name: nome.trim(), // Também salvar como 'name' para compatibilidade
        },
      });

      if (updateError) {
        setError("Erro ao atualizar senha: " + updateError.message);
        setIsLoading(false);
        return;
      }

      // A página ResetPassword é usada apenas para recuperação de senha
      // Sempre marcar password_temporary como true para que o modal apareça no próximo login
      // Isso garante que o usuário altere a senha novamente após recuperá-la
      const { error: updateProfileError } = await supabase
        .from("user_profiles")
        .update({
          nome: nome.trim(),
          password_temporary: true, // Sempre marcar como temporária após recuperação
        })
        .eq("user_id", user.id);

      if (updateProfileError) {
        console.warn("Erro ao atualizar perfil (não crítico):", updateProfileError);
        // Não bloquear se falhar, pois a senha já foi atualizada
      }

      // Recarregar a sessão para atualizar os metadados do usuário no AuthContext
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Forçar atualização da sessão para que o AuthContext pegue o novo nome
        await supabase.auth.refreshSession();
      }

      toast.success("Senha redefinida e nome atualizado com sucesso!");
      // Recarregar para atualizar o estado de password_temporary
      window.location.href = "/home";
    } catch (error: any) {
      console.error("Erro ao redefinir senha:", error);
      setError("Não foi possível redefinir a senha. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (needsLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Lock className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Redefinir Senha</CardTitle>
            <CardDescription className="text-center">
              Por favor, faça login para continuar com a redefinição de senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoggingIn}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="Digite sua senha atual"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={isLoggingIn}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    disabled={isLoggingIn}
                  >
                    {showLoginPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Lock className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Redefinir Senha</CardTitle>
          <CardDescription className="text-center">
            Digite seu nome e uma nova senha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                type="text"
                placeholder="Digite seu nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua nova senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirme sua nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                "Redefinir Senha"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      {user && (
        <PasswordChangeModal
          open={showPasswordModal}
          userEmail={user.email || ""}
          userId={user.id}
          onSuccess={() => {
            setShowPasswordModal(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

