import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { clearAdminCache, updateAdminCache } from "@/lib/disableConsoleInProduction";
import { logger } from "@/lib/logger";
import {
  withTimingProtection,
  recordLoginAttempt,
  isLocked,
  shouldRequireCaptcha,
  resetLoginAttempts,
  getLockoutTimeRemaining,
  createError,
  mapSupabaseError,
  AUTH_ERRORS,
  type AppError
} from "@/lib/errorService";
import { logAction, AuditAction, logCreate } from "@/lib/auditService";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  passwordTemporary: boolean | null; // null = não verificado ainda, true/false = resultado
  isUnauthorizedDomain: boolean; // true quando domínio não autorizado é detectado
  setIsUnauthorizedDomain: (value: boolean) => void; // função para resetar o estado
  signIn: (email: string, password: string, captchaToken?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  checkPasswordTemporary: () => Promise<void>;
  requiresCaptcha: (email: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordTemporary, setPasswordTemporary] = useState<boolean | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);

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
            const newProfileData = {
              user_id: userId,
              email: userEmail,
              nome: userEmail.split('@')[0], // Usar parte antes do @ como nome padrão
              role: "user",
            };

            const { data: createdProfile, error: insertError } = await supabase
              .from("user_profiles")
              .insert(newProfileData)
              .select()
              .single();

            if (!insertError && createdProfile) {
              // Perfil criado com sucesso - registrar log de auditoria
              await logCreate(
                'user_profiles',
                userId,
                createdProfile as Record<string, any>,
                `Criou perfil automaticamente durante login: ${userEmail}`
              ).catch(err => logger.warn('Erro ao registrar log de auditoria:', err));

              return true;
            } else {
              // Se falhar ao criar (pode ser RLS), retornar true mesmo assim
              logger.warn("Não foi possível criar perfil automaticamente:", insertError);
              return true; // Permitir login mesmo sem perfil
            }
          } catch (insertErr) {
            logger.warn("Erro ao criar perfil:", insertErr);
            return true; // Permitir login mesmo sem perfil
          }
        }
      }

      // Para qualquer erro, permitir login (não bloquear usuários legítimos)
      if (error) {
        // Não logar erro 42703 (coluna não existe) - pode ser problema de estrutura da tabela
        if (error.code !== '42703') {
          logger.warn("Erro ao verificar usuário (permitindo login mesmo assim):", error);
        }
        return true; // Permitir login mesmo com erro
      }

      // Se não houver dados, usuário não existe, mas permitir login
      return true;
    } catch (err) {
      // Em caso de erro, permitir login para não bloquear usuários legítimos
      logger.warn("Erro ao verificar usuário (permitindo login mesmo assim):", err);
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
      logger.log("checkPasswordTemporary: Verificando para user_id:", user.id);
      
      // Tentar até 3 vezes com delay crescente (o perfil pode estar sendo criado)
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("password_temporary")
          .eq("user_id", user.id)
          .maybeSingle();

        logger.log(`checkPasswordTemporary: Tentativa ${attempts + 1}, dados:`, data, "erro:", error);

        if (!error && data) {
          const isTemporary = data.password_temporary === true;
          logger.log("checkPasswordTemporary: password_temporary =", isTemporary);
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
      logger.log("checkPasswordTemporary: Perfil não encontrado após", maxAttempts, "tentativas, usando fallback");
      const isTemporary = user.user_metadata?.password_temporary === true;
      logger.log("checkPasswordTemporary: Fallback user_metadata, password_temporary =", isTemporary);
      setPasswordTemporary(isTemporary);
    } catch (err) {
      // Em caso de erro, assumir que não é temporária
      logger.warn("Erro ao verificar senha temporária:", err);
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
        logger.error("Erro ao processar sessão:", error);
      } finally {
        if (isMounted) {
          clearTimeout(loadingTimeout);
          setLoading(false);
        }
      }
    }).catch((error) => {
      logger.error("Erro ao obter sessão:", error);
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
          const userEmail = session.user.email;
          
          // Verifica se o usuário está autorizado (apenas para emails do domínio brmarinas.com.br)
          if (userEmail) {
            // Primeiro, validar o domínio do email
            const emailDomain = userEmail.split('@')[1]?.toLowerCase();
            const allowedDomains = ['brmarinas.com.br'];
            
            if (!emailDomain || !allowedDomains.includes(emailDomain)) {
              logger.error('Domínio não autorizado:', emailDomain, 'para email:', userEmail);
              // Setar flag de domínio não autorizado e fazer logout
              setIsUnauthorizedDomain(true);
              await supabase.auth.signOut();
              toast.error('Acesso negado: apenas emails do domínio brmarinas.com.br são permitidos');
              return;
            }

            // Depois, verificar se o email está na tabela authorized_emails
            const { data: isAuthorized, error: authError } = await supabase
              .rpc('is_user_authorized', { user_email: userEmail });

            if (authError) {
              logger.error('Erro ao verificar autorização:', authError);
              // Desloga o usuário se houver erro na verificação
              await supabase.auth.signOut();
              toast.error('Erro ao verificar autorização. Tente novamente.');
              return;
            }

            if (!isAuthorized) {
              // Usuário não autorizado - desloga e mostra mensagem
              await supabase.auth.signOut();
              toast.error('Acesso negado: usuário não autorizado');
              return;
            }
          }

          // Se chegou aqui, o usuário está autorizado
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
          (async () => {
            try {
              const { data: profileData, error: profileError } = await supabase
                .from("user_profiles")
                .select("password_temporary")
                .eq("user_id", session.user.id)
                .maybeSingle();

              if (isMounted) {
                // Se encontrou dados no banco, usar o valor do banco (prioridade máxima)
                if (!profileError && profileData !== null) {
                  const isTemporary = profileData.password_temporary === true;
                  logger.log("onAuthStateChange: password_temporary do banco =", isTemporary);
                  setPasswordTemporary(isTemporary);
                } else {
                  // Se não encontrou no banco, usar fallback dos metadados
                  const isTemporary = session.user.user_metadata?.password_temporary === true;
                  logger.log("onAuthStateChange: password_temporary do metadata (fallback) =", isTemporary);
                  setPasswordTemporary(isTemporary);
                }
              }
            } catch (err) {
              logger.warn("Erro ao verificar password_temporary no onAuthStateChange:", err);
              // Usar fallback dos metadados apenas em caso de erro
              if (isMounted) {
                const isTemporary = session.user.user_metadata?.password_temporary === true;
                logger.log("onAuthStateChange: password_temporary do metadata (erro) =", isTemporary);
                setPasswordTemporary(isTemporary);
              }
            }
          })();
        } else {
          setSession(null);
          setUser(null);
          setPasswordTemporary(null);
          // Limpar cache quando não há sessão
          clearAdminCache();
        }
      } catch (error) {
        logger.error("Erro ao processar mudança de auth:", error);
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

  const signIn = useCallback(async (email: string, password: string, captchaToken?: string) => {
    const identifier = email.trim().toLowerCase();
    
    return withTimingProtection(async () => {
      try {
        // Verificar se está bloqueado
        if (isLocked(identifier)) {
          const remainingMinutes = getLockoutTimeRemaining(identifier);
          const error = createError({
            ...AUTH_ERRORS.ACCOUNT_LOCKED,
            userMessage: `Sua conta foi bloqueada temporariamente. Tente novamente em ${remainingMinutes} minuto${remainingMinutes > 1 ? 's' : ''}`
          });
          throw error;
        }

        // Verificar se requer CAPTCHA
        if (shouldRequireCaptcha(identifier) && !captchaToken) {
          const error = createError(AUTH_ERRORS.CAPTCHA_REQUIRED);
          throw error;
        }

        // Validação básica antes de enviar ao Supabase
        if (!email || !email.includes("@")) {
          const error = createError(AUTH_ERRORS.INVALID_EMAIL);
          throw error;
        }

        if (!password || password.length < 6) {
          const error = createError(AUTH_ERRORS.PASSWORD_TOO_WEAK);
          throw error;
        }

        // Tenta fazer login no Supabase
        const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
          email: identifier,
          password,
        });

        if (supabaseError) {
          // Registrar tentativa falhada
          recordLoginAttempt(identifier);
          
          // Registrar auditoria de login falhado
          logAction(
            AuditAction.USER_LOGIN_FAILED,
            identifier,
            `Tentativa de login falhada para ${identifier}`,
            { email: identifier, error: supabaseError.message }
          ).catch(err => logger.warn('Erro ao registrar auditoria:', err));
          
          // Mapear erro do Supabase para nosso formato
          const appError = mapSupabaseError(supabaseError);
          const error = createError(appError, {
            email: identifier,
            timestamp: Date.now()
          });
          
          logger.error("Erro Supabase ao fazer login:", {
            code: error.code,
            message: error.technicalMessage,
            status: (supabaseError as any)?.status,
          });

          throw error;
        }

        // Verifica se a sessão foi criada
        if (!data.session || !data.user) {
          recordLoginAttempt(identifier);
          const error = createError(AUTH_ERRORS.SESSION_EXPIRED);
          throw error;
        }

        // Login bem-sucedido - resetar tentativas
        resetLoginAttempts(identifier);

        // Registrar auditoria de login bem-sucedido
        logAction(
          AuditAction.USER_LOGIN,
          data.user.id,
          `Login realizado com sucesso por ${data.user.email}`,
          { email: data.user.email }
        ).catch(err => logger.warn('Erro ao registrar auditoria:', err));

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
            logger.log("AuthContext: Verificando password_temporary para usuário:", data.user.id);
            const { data: profileData, error: profileError } = await supabase
              .from("user_profiles")
              .select("password_temporary")
              .eq("user_id", data.user.id)
              .maybeSingle();

            logger.log("AuthContext: Dados do perfil:", profileData, "Erro:", profileError);

            if (!profileError && profileData) {
              const isTemporary = profileData.password_temporary === true;
              logger.log("AuthContext: password_temporary =", isTemporary);
              setPasswordTemporary(isTemporary);
            } else {
              // Fallback para user_metadata
              const isTemporary = data.user.user_metadata?.password_temporary === true;
              logger.log("AuthContext: Usando fallback user_metadata, password_temporary =", isTemporary);
              setPasswordTemporary(isTemporary);
            }
          } catch (err) {
            logger.warn("Erro ao verificar senha temporária:", err);
            setPasswordTemporary(false);
          }
        }, 1000);

        toast.success("Login realizado com sucesso!");
      } catch (error) {
        const appError = error as AppError | Error;
        
        // Se for um AppError, usar a mensagem estruturada
        if ('code' in appError && 'userMessage' in appError) {
          toast.error(appError.userMessage);
        } else {
          // Fallback para erro genérico
          toast.error("Não foi possível fazer login. Verifique suas credenciais e tente novamente.");
        }
        
        throw error;
      }
    });
  }, [checkUserExists, updateAdminRoleCache]);

  const requiresCaptcha = useCallback((email: string): boolean => {
    return shouldRequireCaptcha(email.trim().toLowerCase());
  }, []);

const signInWithGoogle = useCallback(async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/home`,
        queryParams: {
          // 'hd' força o Google a aceitar apenas emails deste domínio
          hd: 'brmarinas.com.br',
          // Opcional: força a caixa de seleção de conta aparecer sempre
          prompt: 'select_account' 
        }
      },
    });

    if (error) throw error;
    
  } catch (error) {
    console.error('Erro ao iniciar login com Google:', error.message);
    // Aqui você pode adicionar um toast/alerta para o usuário
  }
}, []);


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
      logger.error("Erro ao criar conta:", authError);
      toast.error(authError.message || "Erro ao criar conta.");
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const currentUserId = user?.id;
      const currentUserEmail = user?.email;
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Registrar auditoria de logout
      if (currentUserId) {
        logAction(
          AuditAction.USER_LOGOUT,
          currentUserId,
          `Logout realizado por ${currentUserEmail}`,
          { email: currentUserEmail }
        ).catch(err => logger.warn('Erro ao registrar auditoria:', err));
      }

      // Limpar cache do admin ao fazer logout
      clearAdminCache();

      setSession(null);
      setUser(null);
      setPasswordTemporary(null);
      toast.success("Logout realizado com sucesso!");
    } catch (error) {
      const authError = error as AuthError;
      logger.error("Erro ao fazer logout:", authError);
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
        isUnauthorizedDomain,
        setIsUnauthorizedDomain,
        signIn,
        signInWithGoogle,
        signOut,
        signUp,
        checkPasswordTemporary,
        requiresCaptcha,
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