import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { clearAdminCache, updateAdminCache } from "@/lib/disableConsoleInProduction";

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

  // Função para verificar se o usuário existe no banco de dados
  const checkUserExists = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle(); // Usar maybeSingle em vez de single para evitar erro 400 quando não encontrar

      // Se houver erro específico de RLS ou permissão, tratar diferente
      if (error) {
        // Erro 400 pode ser RLS ou query malformada
        // Erro PGRST116 = não encontrado (não é problema)
        if (error.code === 'PGRST116' || error.code === '42P01') {
          // Tabela não existe ou registro não encontrado
          return false;
        }
        
        // Para outros erros, logar e retornar false
        console.error("Erro ao verificar usuário:", error);
        return false;
      }

      // Se não houver dados, usuário não existe
      if (!data) {
        return false;
      }

      return true;
    } catch (err) {
      console.error("Erro ao verificar usuário:", err);
      return false;
    }
  }, []);

  // Função para verificar e atualizar cache do role do admin
  const updateAdminRoleCache = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (error || !data) {
        // Se não encontrar, verificar user_metadata como fallback
        const { data: { user } } = await supabase.auth.getUser();
        const fallbackRole = user?.user_metadata?.role;
        const isAdmin = fallbackRole === 'admin';
        updateAdminCache(userId, isAdmin);
        return;
      }

      const isAdmin = data.role === 'admin';
      updateAdminCache(userId, isAdmin);
    } catch (err) {
      // Em caso de erro, assumir que não é admin
      updateAdminCache(userId, false);
    }
  }, []);

  useEffect(() => {
    // Verifica a sessão atual
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Verificar se o usuário existe no banco
        const exists = await checkUserExists(session.user.id);
        if (!exists) {
          // Usuário não existe, fazer logout
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          toast.error("Sua conta não foi encontrada. Por favor, entre em contato com o administrador.");
        } else {
          setSession(session);
          setUser(session.user);
          // Atualizar cache do role do admin
          await updateAdminRoleCache(session.user.id);
        }
      } else {
        setSession(null);
        setUser(null);
        // Limpar cache quando não há sessão
        clearAdminCache();
      }
      setLoading(false);
    });

    // Escuta mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Verificar se o usuário existe no banco
        const exists = await checkUserExists(session.user.id);
        if (!exists) {
          // Usuário não existe, fazer logout
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          toast.error("Sua conta não foi encontrada. Por favor, entre em contato com o administrador.");
        } else {
          setSession(session);
          setUser(session.user);
          // Atualizar cache do role do admin
          await updateAdminRoleCache(session.user.id);
        }
      } else {
        setSession(null);
        setUser(null);
        // Limpar cache quando não há sessão
        clearAdminCache();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [checkUserExists, updateAdminRoleCache]);

  const signIn = useCallback(async (email: string, password: string) => {
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

      // Aguardar um pouco para garantir que a sessão está estabelecida
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verificar se o usuário existe no banco de dados
      // Tentar algumas vezes caso haja problema de timing
      let exists = false;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (!exists && attempts < maxAttempts) {
        exists = await checkUserExists(data.user.id);
        if (!exists && attempts < maxAttempts - 1) {
          // Aguardar um pouco antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        attempts++;
      }

      if (!exists) {
        // Fazer logout se o usuário não existir
        await supabase.auth.signOut();
        throw new Error("Sua conta não foi encontrada. Por favor, entre em contato com o administrador.");
      }

      setSession(data.session);
      setUser(data.user);
      // Atualizar cache do role do admin após login
      await updateAdminRoleCache(data.user.id);
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
  }, [checkUserExists, updateAdminRoleCache]);

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

      // Limpar cache do admin ao fazer logout
      clearAdminCache();

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

