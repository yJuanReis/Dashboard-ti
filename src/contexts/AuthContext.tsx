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

  // Função para verificar e criar perfil se não existir
  const checkUserExists = useCallback(async (userId: string, userEmail?: string): Promise<boolean> => {
    try {
      // Primeiro, tentar buscar o perfil
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      // Se encontrou o perfil, retornar true
      if (data && !error) {
        return true;
      }

      // Se não encontrou (erro PGRST116 = não encontrado), tentar criar
      if (error && (error.code === 'PGRST116' || error.code === 'PGRST301')) {
        // Usuário não existe na tabela, tentar criar automaticamente
        if (userEmail) {
          try {
            const { error: insertError } = await supabase
              .from("user_profiles")
              .insert({
                user_id: userId,
                email: userEmail,
                nome: userEmail.split('@')[0], // Usar parte antes do @ como nome padrão
                role: "user",
              });

            if (!insertError) {
              // Perfil criado com sucesso
              return true;
            } else {
              // Se falhar ao criar (pode ser RLS), retornar true mesmo assim
              // para não bloquear o login
              console.warn("Não foi possível criar perfil automaticamente:", insertError);
              return true; // Permitir login mesmo sem perfil
            }
          } catch (insertErr) {
            console.warn("Erro ao criar perfil:", insertErr);
            return true; // Permitir login mesmo sem perfil
          }
        }
      }

      // Para outros erros (400, RLS, etc), permitir login mesmo assim
      // para não bloquear usuários legítimos
      if (error) {
        console.warn("Erro ao verificar usuário (permitindo login mesmo assim):", error);
        return true; // Permitir login mesmo com erro
      }

      // Se não houver dados e não houver erro, usuário não existe
      // Mas permitir login mesmo assim (pode ser criado depois)
      return true;
    } catch (err) {
      // Em caso de erro, permitir login para não bloquear usuários legítimos
      console.warn("Erro ao verificar usuário (permitindo login mesmo assim):", err);
      return true;
    }
  }, []);

  // Função para verificar e atualizar cache do role do admin
  const updateAdminRoleCache = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle(); // Usar maybeSingle para evitar erro quando não encontrar

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
        setSession(session);
        setUser(session.user);
        // Verificar e criar perfil se necessário (não bloquear se falhar)
        await checkUserExists(session.user.id, session.user.email).catch(() => {
          // Ignorar erros, não bloquear a sessão
        });
        // Atualizar cache do role do admin
        await updateAdminRoleCache(session.user.id).catch(() => {
          // Ignorar erros, não bloquear a sessão
        });
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
        setSession(session);
        setUser(session.user);
        // Verificar e criar perfil se necessário (não bloquear se falhar)
        await checkUserExists(session.user.id, session.user.email).catch(() => {
          // Ignorar erros, não bloquear a sessão
        });
        // Atualizar cache do role do admin
        await updateAdminRoleCache(session.user.id).catch(() => {
          // Ignorar erros, não bloquear a sessão
        });
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

      // Verificar se o usuário existe no banco de dados e criar se necessário
      // Passar o email para poder criar o perfil automaticamente
      const exists = await checkUserExists(data.user.id, data.user.email);
      
      // Não bloquear login se houver erro - o perfil pode ser criado depois
      // Apenas logar o aviso
      if (!exists) {
        console.warn("Perfil do usuário não encontrado, mas permitindo login");
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

