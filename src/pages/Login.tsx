import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Server, Loader2, AlertCircle, CheckCircle2, Key, Shield } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import ReCAPTCHA from "react-google-recaptcha";

// Chave pública do Google reCAPTCHA v2
// IMPORTANTE: Esta chave é específica para localhost e o domínio de produção
// Configure sua própria chave em: https://www.google.com/recaptcha/admin
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"; // Chave de teste do Google

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean | null>(null);
  const [showRecuperarSenha, setShowRecuperarSenha] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState("");
  const [isSendingRecuperacao, setIsSendingRecuperacao] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const { signIn, requiresCaptcha } = useAuth();
  const navigate = useNavigate();

  // Verifica conexão com Supabase ao montar o componente
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          logger.error("Erro ao conectar com Supabase:", error);
          setIsSupabaseConnected(false);
        } else {
          setIsSupabaseConnected(true);
        }
      } catch (err) {
        logger.error("Erro ao verificar conexão:", err);
        setIsSupabaseConnected(false);
      }
    };

    checkSupabaseConnection();
  }, []);

  // Verifica se precisa mostrar CAPTCHA quando o email muda
  useEffect(() => {
    if (email.trim()) {
      const needsCaptcha = requiresCaptcha(email);
      setShowCaptcha(needsCaptcha);
      
      // Resetar token do CAPTCHA se não precisar mais
      if (!needsCaptcha) {
        setCaptchaToken(null);
        recaptchaRef.current?.reset();
      }
    }
  }, [email, requiresCaptcha]);

  const handleCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
    logger.log("CAPTCHA token recebido:", token ? "válido" : "inválido");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validação básica no frontend
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

      // Verificar se CAPTCHA é necessário e foi preenchido
      if (showCaptcha && !captchaToken) {
        setError("Por favor, complete a verificação de segurança (CAPTCHA)");
        setIsLoading(false);
        return;
      }

      // Tenta fazer login - a validação real acontece no Supabase
      await signIn(email, password, captchaToken || undefined);
      
      // Resetar CAPTCHA após tentativa
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
      
      navigate("/home");
    } catch (_error: any) {
      // Erro detalhado já é tratado e logado no AuthContext
      setError("Não foi possível fazer login. Verifique suas credenciais ou tente novamente mais tarde.");
      
      // Resetar CAPTCHA após erro
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecuperarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailRecuperacao.trim() || !emailRecuperacao.includes("@")) {
      toast.error("Por favor, insira um email válido");
      return;
    }

    setIsSendingRecuperacao(true);

    try {
      // Enviar email de recuperação de senha
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        emailRecuperacao.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (resetError) {
        // Não mostrar erro específico por segurança (não revelar se o email existe ou não)
        logger.error("Erro ao enviar email de recuperação:", resetError);
        toast.error("Erro ao enviar email de recuperação. Verifique se o email está correto e tente novamente.");
        setIsSendingRecuperacao(false);
        return;
      }

      // Nota: password_temporary será marcado como true na página ResetPassword
      // quando o usuário redefinir a senha através do link de recuperação

      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.");
      setShowRecuperarSenha(false);
      setEmailRecuperacao("");
    } catch (error) {
      logger.error("Erro ao processar recuperação de senha:", error);
      toast.error("Erro ao processar solicitação. Tente novamente.");
    } finally {
      setIsSendingRecuperacao(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Animated Background Container */}
      <div className="aurora-background"></div>
      
      <Card className="w-full max-w-md shadow-xl relative z-10">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Server className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            BR Marinas
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Painel de TI - Faça login para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Alerta de conexão com Supabase */}
          {isSupabaseConnected === false && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-destructive font-medium">Erro de conexão</p>
                <p className="text-xs text-destructive/90 mt-1">
                  Não foi possível conectar ao Supabase. Verifique suas variáveis de ambiente.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                required
                disabled={isLoading}
                className="h-11"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                required
                disabled={isLoading}
                className="h-11"
                autoComplete="current-password"
              />
            </div>

            {/* Aviso de segurança quando CAPTCHA é exigido */}
            {showCaptcha && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-400">Verificação de segurança necessária</p>
                  <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                    Por favor, complete o CAPTCHA abaixo para continuar
                  </p>
                </div>
              </div>
            )}

            {/* CAPTCHA - mostrar após múltiplas tentativas */}
            {showCaptcha && (
              <div className="flex justify-center">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={RECAPTCHA_SITE_KEY}
                  onChange={handleCaptchaChange}
                  theme="light"
                />
              </div>
            )}

            {/* Mensagem de erro */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={isLoading || isSupabaseConnected === false}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validando no Supabase...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setShowRecuperarSenha(true)}
            >
              <Key className="w-4 h-4 mr-2" />
              Recuperar Senha
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Recuperar Senha */}
      <Dialog open={showRecuperarSenha} onOpenChange={setShowRecuperarSenha}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Recuperar Senha
            </DialogTitle>
            <DialogDescription>
              Digite seu email para receber um link de recuperação de senha.
              Após redefinir sua senha, você precisará alterá-la novamente ao entrar no sistema.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecuperarSenha} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-recuperacao">Email *</Label>
              <Input
                id="email-recuperacao"
                type="email"
                placeholder="seu@email.com"
                value={emailRecuperacao}
                onChange={(e) => setEmailRecuperacao(e.target.value)}
                disabled={isSendingRecuperacao}
                required
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowRecuperarSenha(false);
                  setEmailRecuperacao("");
                }}
                disabled={isSendingRecuperacao}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSendingRecuperacao}>
                {isSendingRecuperacao ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Enviar Email
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}

