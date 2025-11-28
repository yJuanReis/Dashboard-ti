import { 
  Shield, 
  Users,
  Bell,
  LogOut,
  X,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Waves,
  Mail,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { useIsLandscapeMobile } from "@/hooks/use-mobile";
import {
  NAVIGATION_ITEMS as NAVIGATION_CONFIG,
  type NavigationItem as NavigationItemConfig,
} from "@/config/navigation.config";
import { useLogout } from "@/hooks/use-logout";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import zxcvbn from "zxcvbn";
import { getPagesInMaintenance } from "@/lib/pagesMaintenanceService";
import { logger } from "@/lib/logger";
import { logUpdate } from "@/lib/auditService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

type NavigationItem = NavigationItemConfig & {
  badge?: {
    text: string;
    variant: "blue" | "gray" | "yellow";
  };
};

interface AppSidebarProps {}

const getBadgeClasses = (variant: "blue" | "gray" | "yellow") => {
  switch (variant) {
    case "blue":
      return "bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30";
    case "yellow":
      return "bg-warning/10 text-warning border-warning/20 dark:bg-warning/20 dark:text-warning dark:border-warning/30";
    case "gray":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

// Tipo para força da senha
type PasswordStrength = {
  score: number; // 0-4
  label: string;
  color: string;
  bgColor: string;
};

// Função para calcular força da senha
function calcularForcaSenha(senha: string): PasswordStrength {
  if (!senha) {
    return { score: 0, label: "", color: "", bgColor: "" };
  }

  const result = zxcvbn(senha);
  const score = result.score;

  const strengths: PasswordStrength[] = [
    {
      score: 0,
      label: "Muito fraca",
      color: "text-red-600",
      bgColor: "bg-red-500",
    },
    {
      score: 1,
      label: "Fraca",
      color: "text-orange-600",
      bgColor: "bg-orange-500",
    },
    {
      score: 2,
      label: "Média",
      color: "text-yellow-600",
      bgColor: "bg-yellow-500",
    },
    {
      score: 3,
      label: "Forte",
      color: "text-blue-600",
      bgColor: "bg-blue-500",
    },
    {
      score: 4,
      label: "Excelente",
      color: "text-green-600",
      bgColor: "bg-green-500",
    },
  ];

  return strengths[score];
}

export function AppSidebar({}: AppSidebarProps) {
  const { state, setOpenMobile, isMobile, openMobile } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const { hasPermission, role } = usePagePermissions();
  const isLandscapeMobile = useIsLandscapeMobile();
  // No mobile (incluindo landscape), sempre mostra os títulos;
  // o estado "collapsed" só vale para desktop.
  const isCollapsed = !isMobile && state === "collapsed";
  const logout = useLogout();

  // Estados para modais
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Estados para nome de exibição
  const [nomeExibicao, setNomeExibicao] = useState(user?.user_metadata?.nome || user?.user_metadata?.name || "");
  const [loadingNome, setLoadingNome] = useState(false);

  // Estados para senhas
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  // Estados para prevenção de brute force
  const [tentativasErradas, setTentativasErradas] = useState(0);
  const [bloqueadoAté, setBloqueadoAté] = useState<Date | null>(null);

  // Estados para páginas em manutenção (usando objeto para garantir detecção de mudanças pelo React)
  const [pagesMaintenance, setPagesMaintenance] = useState<Record<string, { badgeText: string; badgeVariant: "blue" | "gray" | "yellow" }>>({});
  const [maintenanceUpdateTrigger, setMaintenanceUpdateTrigger] = useState(0);

  // Estados para notificações
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);

  // Referência para o primeiro item de navegação (para foco ao abrir no mobile)
  const firstNavItemRef = useRef<HTMLAnchorElement | null>(null);

  // Guardar valor anterior de openMobile para restaurar foco no trigger ao fechar
  const previousOpenMobileRef = useRef(openMobile);

  // Nome de exibição atualizado
  const displayName = useMemo(() => {
    return nomeExibicao || user?.user_metadata?.nome || user?.user_metadata?.name || "Utilizador";
  }, [nomeExibicao, user]);

  // Calcular força da senha
  const forcaSenha = useMemo(() => calcularForcaSenha(novaSenha), [novaSenha]);

  // Verificar se está bloqueado
  const estaBloqueado = useMemo(() => {
    if (!bloqueadoAté) return false;
    return new Date() < bloqueadoAté;
  }, [bloqueadoAté]);

  // Tempo restante de bloqueio
  const tempoRestante = useMemo(() => {
    if (!bloqueadoAté || !estaBloqueado) return 0;
    const diff = bloqueadoAté.getTime() - new Date().getTime();
    return Math.ceil(diff / 1000);
  }, [bloqueadoAté, estaBloqueado]);

  // Gerir foco ao abrir/fechar a sidebar mobile
  useEffect(() => {
    // Quando abrir no mobile, focar o primeiro item de navegação
    if (isMobile && openMobile && firstNavItemRef.current) {
      firstNavItemRef.current.focus();
    }

    previousOpenMobileRef.current = openMobile;
  }, [isMobile, openMobile]);

  // Fechar sidebar mobile sempre que a rota mudar
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [location.pathname, isMobile, setOpenMobile]);

  // Atualizar contador de bloqueio
  useEffect(() => {
    if (!estaBloqueado) return;

    const interval = setInterval(() => {
      if (new Date() >= bloqueadoAté!) {
        setBloqueadoAté(null);
        setTentativasErradas(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [estaBloqueado, bloqueadoAté]);

  // Atualizar nomeExibicao quando o user mudar (sincronização com AuthContext)
  useEffect(() => {
    const novoNome = user?.user_metadata?.nome || user?.user_metadata?.name || "";
    // Atualizar apenas se o nome nos metadados for diferente do estado local
    // Isso evita loops infinitos e permite edição local
    if (novoNome) {
      setNomeExibicao(prev => prev !== novoNome ? novoNome : prev);
    }
  }, [user?.user_metadata?.nome, user?.user_metadata?.name]);

  // Carregar páginas em manutenção e recarregar periodicamente
  useEffect(() => {
    let interval: number | null = null;

    const loadPagesMaintenance = async () => {
      try {
        // Evitar chamadas desnecessárias quando a aba não está visível
        if (typeof document !== "undefined" && document.visibilityState !== "visible") {
          return;
        }

        const pages = await getPagesInMaintenance();
        logger.log('[AppSidebar] Páginas em manutenção carregadas:', pages.map(p => ({ path: p.page_path, is_active: p.is_active })));
        // Criar objeto apenas com páginas ativas
        const maintenanceObj: Record<string, { badgeText: string; badgeVariant: "blue" | "gray" | "yellow" }> = {};
        pages.forEach(page => {
          // Garantir que só adiciona páginas ativas
          if (page.is_active) {
            maintenanceObj[page.page_path] = {
              badgeText: page.badge_text,
              badgeVariant: page.badge_variant as "blue" | "gray" | "yellow"
            };
          }
        });
        logger.log('[AppSidebar] Objeto atualizado com', Object.keys(maintenanceObj).length, 'páginas:', Object.keys(maintenanceObj));
        setPagesMaintenance(maintenanceObj);
      } catch (error) {
        logger.error("Erro ao carregar páginas em manutenção:", error);
      }
    };

    const setupInterval = () => {
      if (interval !== null) {
        window.clearInterval(interval);
        interval = null;
      }

      if (typeof document === "undefined" || document.visibilityState === "visible") {
        // Carregar imediatamente quando a aba estiver visível
        loadPagesMaintenance();
        // Recarregar a cada 30 segundos para pegar mudanças (apenas quando visível)
        interval = window.setInterval(loadPagesMaintenance, 30000);
      }
    };

    setupInterval();

    // Listener para mudanças imediatas
    const handleMaintenanceChange = async (event: any) => {
      logger.log('[AppSidebar] Evento pagesMaintenanceChanged recebido:', event.detail);
      // Pequeno delay para garantir que o banco foi atualizado
      await new Promise(resolve => setTimeout(resolve, 200));
      await loadPagesMaintenance();
      // Forçar atualização do filteredNavigationItems
      setMaintenanceUpdateTrigger(prev => prev + 1);
    };
    window.addEventListener('pagesMaintenanceChanged', handleMaintenanceChange);

    const handleVisibilityChange = () => {
      logger.log("[AppSidebar] visibilitychange:", document.visibilityState);
      setupInterval();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (interval !== null) {
        window.clearInterval(interval);
      }
      window.removeEventListener('pagesMaintenanceChanged', handleMaintenanceChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Adiciona badges dinamicamente baseado na configuração de manutenção do banco
  const navigationItems: NavigationItem[] = useMemo(() => {
    const maintenanceKeys = Object.keys(pagesMaintenance);
    logger.log('[AppSidebar] Recalculando navigationItems, páginas em manutenção:', maintenanceKeys);
    return NAVIGATION_CONFIG.map(item => {
      // Normalizar path para comparação
      const normalizedItemUrl = item.url.toLowerCase().trim();
      const maintenanceConfig = Object.entries(pagesMaintenance).find(([path]) => {
        return path.toLowerCase().trim() === normalizedItemUrl;
      })?.[1];
      
      if (maintenanceConfig) {
        logger.log(`[AppSidebar] Adicionando badge para ${item.url}:`, maintenanceConfig);
        return {
          ...item,
          badge: {
            text: maintenanceConfig.badgeText,
            variant: maintenanceConfig.badgeVariant
          }
        };
      }
      // Se não tem maintenanceConfig, retornar sem badge
      return { ...item };
    });
  }, [pagesMaintenance, maintenanceUpdateTrigger]);

  // Filtrar itens de navegação baseado em permissões
  const filteredNavigationItems: NavigationItem[] = useMemo(() => {
    logger.log('[AppSidebar] Recalculando filteredNavigationItems, trigger:', maintenanceUpdateTrigger);
    return navigationItems.filter((item) => {
      // Versão reduzida para mobile: oculta itens marcados como mobileHidden
      if (isMobile && item.mobileHidden) {
        return false;
      }
      // Itens mobileOnly não aparecem no desktop
      if (!isMobile && item.mobileOnly) {
        return false;
      }

      // Respeitar roles configuradas (se houver)
      if (item.roles && item.roles.length > 0 && !item.roles.includes(role as any)) {
        logger.log(`[AppSidebar] Página ${item.url} oculta por role`, {
          requiredRoles: item.roles,
          role,
          userEmail: user?.email,
        });
        return false;
      }

      // Verificar permissão
      const hasAccess = hasPermission(item.url);
      if (!hasAccess) {
        logger.log(`[AppSidebar] Página ${item.url} filtrada (sem permissão)`, {
          hasPermission: hasAccess,
          role,
          url: item.url
        });
      }
      return hasAccess;
    });
  }, [navigationItems, hasPermission, role, user?.email, maintenanceUpdateTrigger]);

  // Função para resetar tentativas (quando acertar)
  const resetarTentativas = useCallback(() => {
    setTentativasErradas(0);
    setBloqueadoAté(null);
  }, []);

  // Função para incrementar tentativas erradas
  const incrementarTentativaErrada = useCallback(() => {
    const novasTentativas = tentativasErradas + 1;
    setTentativasErradas(novasTentativas);

    if (novasTentativas >= 3) {
      const bloqueio = new Date();
      bloqueio.setSeconds(bloqueio.getSeconds() + 30);
      setBloqueadoAté(bloqueio);
      toast.error(
        `Muitas tentativas incorretas. Aguarde 30 segundos antes de tentar novamente.`
      );
    }
  }, [tentativasErradas]);

  // Função para salvar nome de exibição
  const handleSalvarNome = useCallback(async () => {
    if (!nomeExibicao.trim()) {
      toast.error("O nome não pode estar vazio");
      return;
    }

    if (!user) {
      toast.error("Usuário não encontrado");
      return;
    }

    setLoadingNome(true);
    try {
      // Atualizar user_metadata no Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          nome: nomeExibicao.trim(),
          name: nomeExibicao.trim(), // Também salvar como 'name' para compatibilidade
        },
      });

      if (updateError) {
        toast.error("Erro ao salvar nome: " + updateError.message);
        setLoadingNome(false);
        return;
      }

      // Atualizar também na tabela user_profiles se existir
      try {
        // Busca dados antigos antes de atualizar (para o log de auditoria)
        const { data: oldProfileData } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        const { data: updatedProfileData, error: profileError } = await supabase
          .from("user_profiles")
          .update({ nome: nomeExibicao.trim() })
          .eq("user_id", user.id)
          .select()
          .single();

        // Ignorar erro se a tabela não existir
        if (profileError) {
          const errorDetails = profileError as any;
          const isTableNotFound = 
            profileError.code === '42P01' ||
            profileError.code === 'PGRST116' ||
            profileError.code === 'PGRST205' ||
            profileError.code === '42704' ||
            errorDetails?.status === 404 ||
            errorDetails?.statusCode === 404 ||
            profileError.message?.toLowerCase().includes('does not exist') ||
            profileError.message?.toLowerCase().includes('could not find the table') ||
            profileError.message?.toLowerCase().includes('relation') ||
            profileError.message?.toLowerCase().includes('not found');
          
          // Se não for erro de tabela não encontrada, logar
          if (!isTableNotFound) {
            logger.warn("Erro ao atualizar perfil:", profileError);
          }
        } else if (oldProfileData && updatedProfileData) {
          // Registra log de auditoria
          await logUpdate(
            'user_profiles',
            user.id,
            oldProfileData as Record<string, any>,
            updatedProfileData as Record<string, any>,
            `Atualizou nome de exibição na sidebar: ${nomeExibicao.trim()}`
          ).catch(err => logger.warn('Erro ao registrar log de auditoria:', err));
        }
      } catch (profileErr) {
        // Ignorar erros de tabela não encontrada
        logger.warn("Erro ao atualizar perfil:", profileErr);
      }

      // Recarregar a sessão para atualizar o user no AuthContext
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // O user será atualizado automaticamente pelo AuthContext via onAuthStateChange
        // Mas forçamos uma atualização imediata recarregando a sessão
        await supabase.auth.refreshSession();
      }

      toast.success("Nome atualizado com sucesso!");
    } catch (error: any) {
      logger.error("Erro ao salvar nome:", error);
      toast.error("Não foi possível salvar o nome. Tente novamente.");
    } finally {
      setLoadingNome(false);
    }
  }, [nomeExibicao, user]);

  // Handler para alterar senha
  const handleAlterarSenha = useCallback(async () => {
    // Verificar se está bloqueado
    if (estaBloqueado) {
      toast.error(
        `Aguarde ${tempoRestante} segundos antes de tentar novamente.`
      );
      return;
    }

    // Validações básicas
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    if (novaSenha.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (senhaAtual === novaSenha) {
      toast.error("A nova senha deve ser diferente da senha atual");
      return;
    }

    // Validação de força mínima (score >= 2 = média)
    if (forcaSenha.score < 2) {
      toast.error("A senha é muito fraca. Escolha uma senha mais forte.");
      return;
    }

    setLoading(true);

    try {
      // Verificar senha atual com melhor validação
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: senhaAtual,
      });

      if (signInError) {
        incrementarTentativaErrada();
        toast.error("Não foi possível validar a senha atual. Verifique os dados e tente novamente.");
        setLoading(false);
        return;
      }

      // Resetar tentativas se acertou
      resetarTentativas();

      // Atualizar senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: novaSenha,
      });

      if (updateError) {
        logger.error("Erro ao alterar senha:", updateError);
        toast.error("Não foi possível alterar a senha. Tente novamente.");
        setLoading(false);
        return;
      }

      toast.success("Senha alterada com sucesso!");
      setMensagemSucesso("Senha alterada com sucesso!");
      
      // Limpar campos apenas após sucesso
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      
      // Limpar mensagem após 5 segundos
      setTimeout(() => setMensagemSucesso(""), 5000);
    } catch (error) {
      logger.error("Erro ao alterar senha:", error);
      toast.error("Erro ao alterar senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [
    senhaAtual,
    novaSenha,
    confirmarSenha,
    forcaSenha,
    user,
    estaBloqueado,
    tempoRestante,
    incrementarTentativaErrada,
    resetarTentativas,
  ]);

  // Função para limpar cache
  const handleLimparCache = useCallback(() => {
    try {
      // Limpar localStorage (exceto autenticação)
      const keysToKeep = ["supabase.auth.token"]; // Manter token de autenticação
      const allKeys = Object.keys(localStorage);
      allKeys.forEach((key) => {
        if (!keysToKeep.some((keepKey) => key.includes(keepKey))) {
          localStorage.removeItem(key);
        }
      });

      // Limpar sessionStorage
      sessionStorage.clear();

      // Limpar cache do navegador (se possível)
      if ("caches" in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            caches.delete(name);
          });
        });
      }

      toast.success("Cache limpo com sucesso!");
    } catch (error) {
      logger.error("Erro ao limpar cache:", error);
      toast.error("Erro ao limpar cache. Tente novamente.");
    }
  }, []);

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-60"} collapsible="icon">
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        {/* Desktop / tablet */}
        <div className="hidden md:flex items-center gap-2">
          {!isCollapsed ? (
            <>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-blue-500/20 flex-shrink-0">
                <Waves className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0 transition-opacity duration-300 ease-in-out">
                <h2 className="font-bold text-sidebar-foreground text-base tracking-tight truncate">
                  BR Marinas
                </h2>
              </div>
              <SidebarTrigger className="hover:bg-sidebar-accent h-8 w-8 flex-shrink-0" />
            </>
          ) : (
            <div className="w-full flex items-center justify-center">
              <SidebarTrigger className="hover:bg-sidebar-accent h-8 w-8 flex-shrink-0" />
            </div>
          )}
        </div>

        {/* Mini-header apenas no mobile (drawer) */}
        <div className="flex md:hidden items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-blue-500/20">
              <Waves className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Navegação
              </span>
              <span className="text-sm font-semibold text-sidebar-foreground">
                Menu
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-sidebar-accent"
            onClick={() => setOpenMobile(false)}
          >
            <X className="w-4 h-4" />
            <span className="sr-only">Fechar menu</span>
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        {/* Navigation Group */}
        <SidebarGroup className={cn("transition-all duration-300 ease-in-out", isCollapsed ? "p-2" : "p-2")}>
          <SidebarGroupLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
            {!isCollapsed && "Navegação"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className={cn(isCollapsed && "items-center")}>
              {filteredNavigationItems.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.url);
                
                return (
                  <SidebarMenuItem key={item.url} className={cn(isCollapsed && "flex justify-center")}>
                    <SidebarMenuButton 
                      asChild 
                      tooltip={isCollapsed ? item.title : undefined}
                      className={cn(
                        "text-sm mb-0.5 transition-all duration-300 ease-in-out",
                        isCollapsed ? "h-10 w-10 justify-center items-center" : "h-8"
                      )}
                    >
                      <NavLink 
                        to={item.url}
                        aria-label={item.title}
                        ref={index === 0 ? firstNavItemRef : undefined}
                        onClick={() => {
                          // Fecha a sidebar no mobile ao clicar em um link
                          if (isMobile) {
                            setOpenMobile(false);
                          }
                        }}
                        className={cn(
                          "transition-all duration-300 ease-in-out hover:bg-sidebar-accent text-sidebar-foreground flex rounded-md group",
                          isCollapsed ? "justify-center items-center w-10 h-10 p-0" : "items-center gap-2 px-2 py-1.5"
                        )}
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                      >
                        <Icon className={cn(
                          "flex-shrink-0 transition-all duration-300 ease-in-out",
                          isCollapsed ? "w-5 h-5" : "w-3.5 h-3.5"
                        )} />
                        {!isCollapsed && (
                          <>
                            <span className="font-medium text-xs truncate flex-1 transition-opacity duration-300 ease-in-out">
                              {item.title}
                            </span>
                            {item.badge && (
                              <Badge 
                                variant="outline" 
                                className={`${getBadgeClasses(item.badge.variant)} text-[10px] px-1.5 py-0 h-4 shadow transition-opacity duration-300 ease-in-out`}
                              >
                                {item.badge.text}
                              </Badge>
                            )}
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer - Oculto em landscape mobile */}
      {!isLandscapeMobile && (
        <SidebarFooter className="border-t border-sidebar-border p-3">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSettingsModalOpen(true)}
                className="flex items-center gap-2 flex-1 min-w-0 hover:bg-sidebar-accent rounded-md p-1 -ml-1 transition-colors"
                title="Configurações"
              >
                <div className="w-7 h-7 bg-gradient-to-br from-primary/20 to-primary/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-semibold text-[10px]">
                    {displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-semibold text-sidebar-foreground text-xs truncate">{displayName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email || "admin@brmarinas.com"}</p>
                </div>
              </button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 flex-shrink-0"
                onClick={() => setNotificationsModalOpen(true)}
                title="Notificações"
              >
                <Bell className={cn(
                  "text-muted-foreground transition-all",
                  isCollapsed ? "w-4 h-4" : "w-3.5 h-3.5"
                )} />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="flex-1 justify-start text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent min-w-0"
              >
                <LogOut className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
                <span className="truncate">Sair</span>
              </Button>
              <div className="flex-shrink-0 scale-90 origin-center">
                <ThemeToggle />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => setSettingsModalOpen(true)}
              className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/30 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
              title="Configurações"
            >
              <span className="text-primary font-semibold text-[10px]">
                {displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </span>
            </button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setNotificationsModalOpen(true)}
              title="Notificações"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="h-8 w-8"
              title="Sair"
            >
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </Button>
            <div className="scale-75">
              <ThemeToggle />
            </div>
          </div>
        )}
      </SidebarFooter>
      )}

      {/* Modal de Notificações */}
      <Dialog open={notificationsModalOpen} onOpenChange={setNotificationsModalOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificações
            </DialogTitle>
            <DialogDescription>
              Ajuste as preferências de notificações por e-mail e alertas do sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div className="flex-1">
                <h4 className="font-semibold text-foreground text-sm">Notificações por E-mail</h4>
                <p className="text-xs text-muted-foreground">Receba atualizações importantes por e-mail</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-2">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                />
                <div className="w-11 h-6 bg-muted border border-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-primary-foreground after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-primary-foreground after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div className="flex-1">
                <h4 className="font-semibold text-foreground text-sm">Alertas do Sistema</h4>
                <p className="text-xs text-muted-foreground">Notificações sobre atualizações e manutenções</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-2">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={systemAlerts}
                  onChange={(e) => setSystemAlerts(e.target.checked)}
                />
                <div className="w-11 h-6 bg-muted border border-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-primary-foreground after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-primary-foreground after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="pt-2 border-t">
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm"
                onClick={handleLimparCache}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Limpar Cache
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Configurações */}
      <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Configurações</DialogTitle>
            <DialogDescription>
              Atualize o seu nome de exibição e gerencie as opções de senha e segurança da conta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 md:space-y-6 pt-4">
            {/* Nome de Exibição */}
            <div>
              <Label htmlFor="displayName" className="text-sm font-medium mb-2">Nome de exibição</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="displayName"
                  type="text"
                  placeholder="O seu nome completo"
                  value={nomeExibicao}
                  onChange={(e) => setNomeExibicao(e.target.value)}
                  disabled={loadingNome}
                  autoComplete="off"
                  className="flex-1"
                />
                <Button 
                  onClick={handleSalvarNome}
                  disabled={loadingNome || !nomeExibicao.trim()}
                  className="w-full sm:w-auto"
                >
                  {loadingNome ? "A guardar..." : "Guardar"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Este nome será utilizado em todo o sistema
              </p>
            </div>

            {/* Seção Alterar Senha */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2 pb-2">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <h4 className="font-semibold text-lg">Alterar Senha</h4>
              </div>
              <div className="space-y-4">
                {/* Campo Senha Atual */}
                <div>
                  <Label htmlFor="senhaAtual" className="text-sm font-medium mb-2">
                    Senha Atual
                  </Label>
                  <div className="relative">
                    <Input
                      id="senhaAtual"
                      type={showSenhaAtual ? "text" : "password"}
                      placeholder="Digite a sua senha atual"
                      value={senhaAtual}
                      onChange={(e) => setSenhaAtual(e.target.value)}
                      disabled={loading || estaBloqueado}
                      className="pr-10"
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowSenhaAtual(!showSenhaAtual)}
                      disabled={loading || estaBloqueado}
                    >
                      {showSenhaAtual ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                {/* Campo Nova Senha */}
                <div>
                  <Label htmlFor="novaSenha" className="text-sm font-medium mb-2">
                    Nova Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="novaSenha"
                      type={showNovaSenha ? "text" : "password"}
                      placeholder="Digite a sua nova senha"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      disabled={loading || estaBloqueado}
                      className="pr-10"
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowNovaSenha(!showNovaSenha)}
                      disabled={loading || estaBloqueado}
                    >
                      {showNovaSenha ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Medidor de força da senha */}
                  {novaSenha && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={forcaSenha.color || "text-muted-foreground"}>
                          {forcaSenha.label || "Digite uma senha"}
                        </span>
                        {forcaSenha.score > 0 && (
                          <span className={forcaSenha.color}>
                            {forcaSenha.score}/4
                          </span>
                        )}
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            forcaSenha.bgColor || "bg-muted"
                          }`}
                          style={{
                            width: `${((forcaSenha.score + 1) / 5) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                {/* Campo Confirmar Senha */}
                <div>
                  <Label htmlFor="confirmarSenha" className="text-sm font-medium mb-2">
                    Confirmar Nova Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmarSenha"
                      type={showConfirmarSenha ? "text" : "password"}
                      placeholder="Confirme a sua nova senha"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      disabled={loading || estaBloqueado}
                      className="pr-10"
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                      disabled={loading || estaBloqueado}
                    >
                      {showConfirmarSenha ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  
                  {confirmarSenha && novaSenha && (
                    <p className={`text-xs mt-1 ${confirmarSenha === novaSenha ? "text-success" : "text-destructive"}`}>
                      {confirmarSenha === novaSenha ? "✓ Senhas coincidem" : "✗ Senhas não coincidem"}
                    </p>
                  )}
                </div>
                {estaBloqueado && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                    <p className="text-sm text-destructive">
                      Muitas tentativas incorretas. Aguarde <span className="font-semibold">{tempoRestante}</span> segundos.
                    </p>
                  </div>
                )}
                {mensagemSucesso && (
                  <div className="p-3 bg-success/10 border border-success/20 rounded-md flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-success mt-0.5" />
                    <p className="text-sm text-success">{mensagemSucesso}</p>
                  </div>
                )}
                <Button
                  onClick={handleAlterarSenha}
                  disabled={loading || estaBloqueado || forcaSenha.score < 2 || novaSenha !== confirmarSenha}
                  className="w-full"
                >
                  {loading ? "A alterar..." : "Alterar Senha"}
                </Button>
                
                {/* Botão de Enviar Reset de Senha */}
                <div className="pt-2 border-t">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (!user?.email) {
                        toast.error("Email não encontrado");
                        return;
                      }
                      
                      try {
                        const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                          redirectTo: `${window.location.origin}/reset-password`,
                        });
                        
                        if (error) {
                          logger.error("Erro ao enviar email de reset de senha:", error);
                          toast.error("Não foi possível enviar o email de redefinição. Tente novamente mais tarde.");
                          return;
                        }
                        
                        toast.success("Email de redefinição de senha enviado com sucesso!");
                      } catch (error: any) {
                        logger.error("Erro inesperado ao enviar email de reset de senha:", error);
                        toast.error("Não foi possível enviar o email de redefinição. Tente novamente mais tarde.");
                      }
                    }}
                    className="w-full"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Email de Reset de Senha
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
