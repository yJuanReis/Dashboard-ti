import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica a sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuta mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Validação básica antes de enviar ao Supabase
      if (!email || !email.includes("@")) {
        throw new Error("Por favor, insira um email válido");
      }

      if (!password || password.length < 6) {
        throw new Error("A senha deve ter pelo menos 6 caracteres");
      }

      // Tenta fazer login no Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        // Tratamento específico de erros do Supabase
        let errorMessage = "Erro ao fazer login. Verifique suas credenciais.";
        
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Email ou senha incorretos. Tente novamente.";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Por favor, confirme seu email antes de fazer login.";
        } else if (error.message.includes("Too many requests")) {
          errorMessage = "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
        } else {
          errorMessage = error.message;
        }
        
        throw new Error(errorMessage);
      }

      // Verifica se a sessão foi criada
      if (!data.session || !data.user) {
        throw new Error("Falha ao criar sessão. Tente novamente.");
      }

      setSession(data.session);
      setUser(data.user);
      toast.success("Login realizado com sucesso!");
    } catch (error) {
      const authError = error as AuthError | Error;
      console.error("Erro ao fazer login:", authError);
      
      const errorMessage = authError instanceof Error 
        ? authError.message 
        : (authError as AuthError).message || "Erro ao fazer login. Verifique suas credenciais.";
      
      toast.error(errorMessage);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Conta criada com sucesso! Verifique seu email para confirmar.");
    } catch (error) {
      const authError = error as AuthError;
      console.error("Erro ao criar conta:", authError);
      toast.error(authError.message || "Erro ao criar conta.");
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setSession(null);
      setUser(null);
      toast.success("Logout realizado com sucesso!");
    } catch (error) {
      const authError = error as AuthError;
      console.error("Erro ao fazer logout:", authError);
      toast.error("Erro ao fazer logout.");
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signOut,
        signUp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}

