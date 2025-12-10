import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Key
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import ReCAPTCHA from "react-google-recaptcha";

// Chave pública do Google reCAPTCHA v2
// IMPORTANTE: Esta chave é específica para localhost e o domínio de produção
// Configure sua própria chave em: https://www.google.com/recaptcha/admin
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"; // Chave de teste do Google

export default function Login() {
  // Estados de Controle de UI
  const [isSignUpMode, setIsSignUpMode] = useState(false); // Controla a animação de deslize

  // Estados de Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Estados de Registro (Novos)
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Estados Gerais
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean | null>(null);
  
  // Recuperação de Senha
  const [showRecuperarSenha, setShowRecuperarSenha] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState("");
  const [isSendingRecuperacao, setIsSendingRecuperacao] = useState(false);
  
  // Captcha
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  
  const { signIn, signUp, signInWithGoogle, requiresCaptcha } = useAuth();
  const navigate = useNavigate();

  // Verifica conexão com Supabase
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error) {
          logger.error("Erro Supabase:", error);
          setIsSupabaseConnected(false);
        } else {
          setIsSupabaseConnected(true);
        }
      } catch (err) {
        setIsSupabaseConnected(false);
      }
    };
    checkSupabaseConnection();
  }, []);

  // Monitora necessidade de Captcha (Apenas no Login)
  useEffect(() => {
    if (email.trim() && !isSignUpMode) {
      const needsCaptcha = requiresCaptcha(email);
      setShowCaptcha(needsCaptcha);
      if (!needsCaptcha) {
        setCaptchaToken(null);
        recaptchaRef.current?.reset();
      }
    }
  }, [email, requiresCaptcha, isSignUpMode]);

  const handleCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
    logger.log("CAPTCHA token recebido:", token ? "válido" : "inválido");
  };

  // --- LÓGICA DE LOGIN ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!email.trim() || !password) {
        throw new Error("Preencha todos os campos.");
      }

      if (showCaptcha && !captchaToken) {
        throw new Error("Complete o CAPTCHA.");
      }

      await signIn(email, password, captchaToken || undefined);
      
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
      navigate("/home");
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login.");
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  // --- LÓGICA DE REGISTRO ---
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!regName.trim() || !regEmail.trim() || !regPassword) {
        throw new Error("Preencha todos os campos.");
      }

      await signUp(regEmail, regPassword);
      
      toast.success("Conta criada com sucesso! Verifique seu email para confirmar.");
      setIsSignUpMode(false);
      setRegName("");
      setRegEmail("");
      setRegPassword("");
    } catch (err: any) {
      setError(err.message || "Erro ao registrar.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- LÓGICA DE RECUPERAÇÃO ---
  const handleRecuperarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRecuperacao.includes("@")) {
      toast.error("Email inválido");
      return;
    }
    setIsSendingRecuperacao(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        emailRecuperacao.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/reset-de-senha` }
      );
      if (error) throw error;
      toast.success("Email enviado com sucesso!");
      setShowRecuperarSenha(false);
      setEmailRecuperacao("");
    } catch (error) {
      toast.error("Erro ao enviar email.");
    } finally {
      setIsSendingRecuperacao(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Animated Background Container - MANTIDO */}
      <div className="aurora-background"></div>

      {/* Injeção de CSS específico para esta página */}
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&display=swap");

        .auth-body {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          font-family: "Poppins", sans-serif;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
        }

        .container-auth {
          background-color: #fff;
          border-radius: 25px;
          box-shadow: 0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22);
          position: relative;
          overflow: hidden;
          width: 768px;
          max-width: 100%;
          min-height: 550px;
        }

        .form-container {
          position: absolute;
          top: 0;
          height: 100%;
          transition: all 0.6s ease-in-out;
        }

        .sign-in-container {
          left: 0;
          width: 50%;
          z-index: 2;
        }

        .container-auth.right-panel-active .sign-in-container {
          transform: translateX(100%);
        }

        .sign-up-container {
          left: 0;
          width: 50%;
          opacity: 0;
          z-index: 1;
        }

        .container-auth.right-panel-active .sign-up-container {
          transform: translateX(100%);
          opacity: 1;
          z-index: 5;
          animation: show 0.6s;
        }

        @keyframes show {
          0%, 49.99% { opacity: 0; z-index: 1; }
          50%, 100% { opacity: 1; z-index: 5; }
        }

        .overlay-container {
          position: absolute;
          top: 0;
          left: 50%;
          width: 50%;
          height: 100%;
          overflow: hidden;
          transition: transform 0.6s ease-in-out;
          z-index: 100;
        }

        .container-auth.right-panel-active .overlay-container {
          transform: translateX(-100%);
        }

        .overlay {
          background: #4B5563;
          background: -webkit-linear-gradient(to right, #2563EB, #9333EA);
          background: linear-gradient(to right, #2563EB, #9333EA);
          color: #FFFFFF;
          position: relative;
          left: -100%;
          height: 100%;
          width: 200%;
          transform: translateX(0);
          transition: transform 0.6s ease-in-out;
        }
        
        .container-auth.right-panel-active .overlay {
          transform: translateX(50%);
        }

        .overlay-panel {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 0 40px;
          text-align: center;
          top: 0;
          height: 100%;
          width: 50%;
          transform: translateX(0);
          transition: transform 0.6s ease-in-out;
          z-index: 2;
        }

        .overlay-left {
          transform: translateX(-20%);
        }

        .container-auth.right-panel-active .overlay-left {
          transform: translateX(0);
        }

        .overlay-right {
          right: 0;
          transform: translateX(0);
          background: url('/login.png');
          background-repeat: no-repeat;
          background-size: 100% 100%;
          background-position: center;
        }
        
        .overlay-right::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.0);
          z-index: 1;
        }
        
        .overlay-right > * {
          position: relative;
          z-index: 2;
        }
              
        .container-auth.right-panel-active .overlay-right {
          transform: translateX(20%);
        }

        .classic-form {
          background-color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 0 50px;
          height: 100%;
          text-align: center;
        }

        .classic-input {
          background-color: #eee;
          border: none;
          padding: 12px 15px;
          margin: 8px 0;
          width: 100%;
          border-radius: 5px;
          color: #000;
        }
        
        .classic-input::placeholder {
          color: #999;
        }
        
        .classic-btn {
          border-radius: 20px;
          border: 1px solid #2563EB;
          background-color: #2563EB;
          color: #FFFFFF;
          font-size: 12px;
          font-weight: bold;
          padding: 12px 45px;
          letter-spacing: 1px;
          text-transform: uppercase;
          transition: transform 80ms ease-in;
          cursor: pointer;
          margin-top: 20px;
        }

        .classic-btn:active {
          transform: scale(0.95);
        }

        .classic-btn:focus {
          outline: none;
        }

        .classic-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .classic-btn.ghost {
          background-color: transparent;
          border-color: #FFFFFF;
        }

        .social-container {
          margin: 20px 0;
        }

        .social-link {
          border: 1px solid #DDDDDD;
          border-radius: 50%;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          margin: 0 5px;
          height: 40px;
          width: 40px;
          color: #333;
          transition: 0.3s;
          text-decoration: none;
        }
        
        .social-link:hover {
          background-color: #f0f0f0;
          color: #2563EB;
        }
      `}</style>

      {/* Container Principal com Classe Condicional para Animação */}
      <div className={`container-auth ${isSignUpMode ? "right-panel-active" : ""} relative z-10`} id="container">
        
        {/* --- FORMULÁRIO DE REGISTRO (Sign Up) --- */}
        <div className="form-container sign-up-container">
          <form className="classic-form" onSubmit={handleRegisterSubmit}>
            <h1 className="font-bold text-3xl mb-2 text-slate-800">Criar Conta</h1>
            
            <div className="social-container">
              <a 
                href="#" 
                className="social-link" 
                onClick={async (e) => {
                  e.preventDefault();
                  try {
                    setIsLoading(true);
                    setError(null);
                    await signInWithGoogle();
                  } catch (err: any) {
                    setError(err.message || "Erro ao fazer login com Google.");
                  } finally {
                    setIsLoading(false);
                  }
                }}
                title="Entrar com Google"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </a>
            </div>
            
            <span className="text-xs text-slate-500 mb-4">ou use seu email para registro</span>
            
            {error && isSignUpMode && (
              <div className="w-full p-2 mb-2 text-xs text-red-600 bg-red-50 rounded border border-red-200 flex items-center gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <input 
              type="text" 
              placeholder="Nome" 
              className="classic-input"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              required 
            />
            <input 
              type="email" 
              placeholder="Email" 
              className="classic-input"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              required 
            />
            <input 
              type="password" 
              placeholder="Senha" 
              className="classic-input"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              required 
            />
            
            <button className="classic-btn" disabled={isLoading} type="submit">
               {isLoading ? "Criando..." : "Registrar"}
            </button>
          </form>
        </div>

        {/* --- FORMULÁRIO DE LOGIN (Sign In) --- */}
        <div className="form-container sign-in-container">
          <form className="classic-form" onSubmit={handleLoginSubmit}>
            <h1 className="font-bold text-3xl mb-2 text-slate-800">Entrar</h1>
            
            <div className="social-container">
              <a 
                href="#" 
                className="social-link" 
                onClick={async (e) => {
                  e.preventDefault();
                  try {
                    setIsLoading(true);
                    setError(null);
                    await signInWithGoogle();
                  } catch (err: any) {
                    setError(err.message || "Erro ao fazer login com Google.");
                  } finally {
                    setIsLoading(false);
                  }
                }}
                title="Entrar com Google"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </a>
            </div>
            
            <span className="text-xs text-slate-500 mb-4">ou use sua conta</span>
            
            {/* Aviso de erro se houver */}
            {/* Aviso de erro se houver */}
            {error && (
              <div className="w-full p-2 mb-2 text-xs text-red-600 bg-red-50 rounded border border-red-200 flex items-center gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}
             {/* Aviso de conexão Supabase */}
             {isSupabaseConnected === false && (
               <div className="w-full p-2 mb-2 text-xs text-orange-600 bg-orange-50 rounded border border-orange-200">
                 Erro de conexão
               </div>
            )}

            <input 
              type="email" 
              placeholder="Email" 
              className="classic-input"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              required 
            />
            <input 
              type="password" 
              placeholder="Senha" 
              className="classic-input"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              required 
            />

            {/* Link esqueci minha senha */}
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); setShowRecuperarSenha(true); }}
              className="text-xs text-slate-600 mt-2 hover:text-blue-600 hover:underline"
            >
              Esqueceu sua senha?
            </a>

            {/* CAPTCHA Condicional */}
            {showCaptcha && (
              <div className="mt-4 scale-75 origin-center">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={RECAPTCHA_SITE_KEY}
                  onChange={handleCaptchaChange}
                  theme="light"
                />
              </div>
            )}

            <button className="classic-btn" disabled={isLoading || isSupabaseConnected === false} type="submit">
              {isLoading ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : "Entrar"}
            </button>
          </form>
        </div>

        {/* --- OVERLAY DE ANIMAÇÃO --- */}
        <div className="overlay-container">
          <div className="overlay">
            {/* Painel Esquerdo (Visível quando em modo Cadastro) */}
            <div className="overlay-panel overlay-left">
              <h1 className="font-bold text-3xl text-white mb-4">Bem-vindo de volta!</h1>
              <p className="text-sm font-light leading-6 mb-8">
                Para se manter conectado conosco, faça login com suas informações pessoais
              </p>
              <button 
                className="classic-btn ghost" 
                id="signIn"
                onClick={() => setIsSignUpMode(false)}
                type="button"
              >
                Entrar
              </button>
            </div>
            
            {/* Painel Direito (Visível quando em modo Login) */}
            <div className="overlay-panel overlay-right">


            </div>
          </div>
        </div>
      </div>

      {/* --- DIALOG DE RECUPERAÇÃO DE SENHA (shadcn) --- */}
      <Dialog open={showRecuperarSenha} onOpenChange={setShowRecuperarSenha}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Recuperar Senha
            </DialogTitle>
            <DialogDescription>
              Digite seu email para receber um link de redefinição.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecuperarSenha} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-recuperacao">Email</Label>
              <Input
                id="email-recuperacao"
                type="email"
                placeholder="seu@email.com"
                value={emailRecuperacao}
                onChange={(e) => setEmailRecuperacao(e.target.value)}
                disabled={isSendingRecuperacao}
                required
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Enviar
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

