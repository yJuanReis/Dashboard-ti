import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { clearAdminCache, updateAdminCache } from "@/lib/disableConsoleInProduction";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  passwordTemporary: boolean | null; // null = não verificado ainda, true/false = resultado
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  checkPasswordTemporary: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordTemporary, setPasswordTemporary] = useState<boolean | null>(null);

  // Função para verificar e criar perfil se não existir
  const checkUserExists = useCallback(async (userId: string, userEmail?: string): Promise<boolean> => {
    try {
      // Tentar buscar o perfil usando apenas user_id (coluna que sempre existe)
      const { data, error } = await supabase
        .from("user_profiles")
        .select("user_id, email")
        .eq("user_id", userId)
        .maybeSingle();

      // Se encontrou o perfil, retornar true
      if (data && !error) {
        return true;
      }

      // Se não encontrou (erro PGRST116 = não encontrado), tentar criar
      if (error && (error.code === 'PGRST116' || error.code === 'PGRST301' || error.code === '42703')) {
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
              console.warn("Não foi possível criar perfil automaticamente:", insertError);
              return true; // Permitir login mesmo sem perfil
            }
          } catch (insertErr) {
            console.warn("Erro ao criar perfil:", insertErr);
            return true; // Permitir login mesmo sem perfil
          }
        }
      }

      // Para qualquer erro, permitir login (não bloquear usuários legítimos)
      if (error) {
        // Não logar erro 42703 (coluna não existe) - pode ser problema de estrutura da tabela
        if (error.code !== '42703') {
          console.warn("Erro ao verificar usuário (permitindo login mesmo assim):", error);
        }
        return true; // Permitir login mesmo com erro
      }

      // Se não houver dados, usuário não existe, mas permitir login
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

  // Função para verificar se a senha é temporária
  const checkPasswordTemporary = useCallback(async () => {
    if (!user) {
      setPasswordTemporary(null);
      return;
    }

    try {
      console.log("checkPasswordTemporary: Verificando para user_id:", user.id);
      
      // Tentar até 3 vezes com delay crescente (o perfil pode estar sendo criado)
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("password_temporary")
          .eq("user_id", user.id)
          .maybeSingle();

        console.log(`checkPasswordTemporary: Tentativa ${attempts + 1}, dados:`, data, "erro:", error);

        if (!error && data) {
          const isTemporary = data.password_temporary === true;
          console.log("checkPasswordTemporary: password_temporary =", isTemporary);
          setPasswordTemporary(isTemporary);
          return;
        }

        // Se não encontrou e ainda há tentativas, aguardar e tentar novamente
        if (attempts < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempts + 1))); // 1s, 2s, 3s
        }
        
        attempts++;
      }

      // Se não encontrou após todas as tentativas, verificar user_metadata como fallback
      console.log("checkPasswordTemporary: Perfil não encontrado após", maxAttempts, "tentativas, usando fallback");
      const isTemporary = user.user_metadata?.password_temporary === true;
      console.log("checkPasswordTemporary: Fallback user_metadata, password_temporary =", isTemporary);
      setPasswordTemporary(isTemporary);
    } catch (err) {
      // Em caso de erro, assumir que não é temporária
      console.warn("Erro ao verificar senha temporária:", err);
      setPasswordTemporary(false);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    let loadingTimeout: NodeJS.Timeout;

    // Timeout de segurança para garantir que loading seja false
    loadingTimeout = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 5000); // 5 segundos máximo

    // Verifica a sessão atual
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;

      try {
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          // Verificar e criar perfil se necessário (não bloquear se falhar)
          // Usar Promise.allSettled para garantir que todas completem
          await Promise.allSettled([
            checkUserExists(session.user.id, session.user.email),
            updateAdminRoleCache(session.user.id)
          ]);
          // Verificar senha temporária - PRIORIZAR banco de dados
          const { data: profileData, error: profileError } = await supabase
            .from("user_profiles")
            .select("password_temporary")
            .eq("user_id", session.user.id)
            .maybeSingle();
          
          // Se encontrou no banco, usar valor do banco; senão, usar metadata como fallback
          if (!profileError && profileData !== null) {
            setPasswordTemporary(profileData.password_temporary === true);
          } else {
            setPasswordTemporary(session.user.user_metadata?.password_temporary === true);
          }
        } else {
          setSession(null);
          setUser(null);
          setPasswordTemporary(null);
          // Limpar cache quando não há sessão
          clearAdminCache();
        }
      } catch (error) {
        console.error("Erro ao processar sessão:", error);
      } finally {
        if (isMounted) {
          clearTimeout(loadingTimeout);
          setLoading(false);
        }
      }
    }).catch((error) => {
      console.error("Erro ao obter sessão:", error);
      if (isMounted) {
        clearTimeout(loadingTimeout);
        setLoading(false);
      }
    });

    // Escuta mudanças na autenticação
    let isProcessingAuthChange = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted || isProcessingAuthChange) return;
      
      isProcessingAuthChange = true;

      try {
        if (session?.user) {
          // Só atualizar se realmente mudou
          setSession(prev => {
            if (prev?.access_token === session.access_token) {
              return prev; // Mesma sessão, não atualizar
            }
            return session;
          });
          setUser(prev => {
            if (prev?.id === session.user.id) {
              return prev; // Mesmo usuário, não atualizar
            }
            return session.user;
          });
          
          // Verificar e criar perfil se necessário (não bloquear se falhar)
          // Usar Promise.allSettled em background
          Promise.allSettled([
            checkUserExists(session.user.id, session.user.email),
            updateAdminRoleCache(session.user.id)
          ]).catch(() => {
            // Ignorar erros
          });
          
          // Verificar senha temporária quando o usuário faz login
          // PRIORIZAR o valor do banco de dados sobre user_metadata
          supabase
            .from("user_profiles")
            .select("password_temporary")
            .eq("user_id", session.user.id)
            .maybeSingle()
            .then(({ data: profileData, error: profileError }) => {
              if (isMounted) {
                // Se encontrou dados no banco, usar o valor do banco (prioridade máxima)
                if (!profileError && profileData !== null) {
                  const isTemporary = profileData.password_temporary === true;
                  console.log("onAuthStateChange: password_temporary do banco =", isTemporary);
                  setPasswordTemporary(isTemporary);
                } else {
                  // Se não encontrou no banco, usar fallback dos metadados
                  const isTemporary = session.user.user_metadata?.password_temporary === true;
                  console.log("onAuthStateChange: password_temporary do metadata (fallback) =", isTemporary);
                  setPasswordTemporary(isTemporary);
                }
              }
            })
            .catch((err) => {
              console.warn("Erro ao verificar password_temporary no onAuthStateChange:", err);
              // Usar fallback dos metadados apenas em caso de erro
              if (isMounted) {
                const isTemporary = session.user.user_metadata?.password_temporary === true;
                console.log("onAuthStateChange: password_temporary do metadata (erro) =", isTemporary);
                setPasswordTemporary(isTemporary);
              }
            });
        } else {
          setSession(null);
          setUser(null);
          setPasswordTemporary(null);
          // Limpar cache quando não há sessão
          clearAdminCache();
        }
      } catch (error) {
        console.error("Erro ao processar mudança de auth:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
          isProcessingAuthChange = false;
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
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

      // Definir sessão e usuário imediatamente
      setSession(data.session);
      setUser(data.user);

      // Fazer verificações em background (não bloquear o login)
      Promise.allSettled([
        checkUserExists(data.user.id, data.user.email),
        updateAdminRoleCache(data.user.id)
      ]).catch(() => {
        // Ignorar erros, não bloquear o login
      });

      // Verificar se a senha é temporária após login
      setTimeout(async () => {
        try {
          console.log("AuthContext: Verificando password_temporary para usuário:", data.user.id);
          const { data: profileData, error: profileError } = await supabase
            .from("user_profiles")
            .select("password_temporary")
            .eq("user_id", data.user.id)
            .maybeSingle();

          console.log("AuthContext: Dados do perfil:", profileData, "Erro:", profileError);

          if (!profileError && profileData) {
            const isTemporary = profileData.password_temporary === true;
            console.log("AuthContext: password_temporary =", isTemporary);
            setPasswordTemporary(isTemporary);
          } else {
            // Fallback para user_metadata
            const isTemporary = data.user.user_metadata?.password_temporary === true;
            console.log("AuthContext: Usando fallback user_metadata, password_temporary =", isTemporary);
            setPasswordTemporary(isTemporary);
          }
        } catch (err) {
          console.warn("Erro ao verificar senha temporária:", err);
          setPasswordTemporary(false);
        }
      }, 1000); // Aumentar delay para garantir que o perfil foi criado

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
      setPasswordTemporary(null);
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
        passwordTemporary,
        signIn,
        signOut,
        signUp,
        checkPasswordTemporary,
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

