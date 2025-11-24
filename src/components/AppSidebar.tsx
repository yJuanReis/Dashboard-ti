import { 
  LayoutDashboard, 
  Shield, 
  IdCard, 
  Mail, 
  Video, 
  HardDrive,
  FileText,
  Network,
  Server,
  Wrench,
  Users,
  Settings,
  Bell,
  Key,
  LogOut,
  X,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Waves
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import zxcvbn from "zxcvbn";
import { getPagesInMaintenance } from "@/lib/pagesMaintenanceService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  useSidebar,
} from "@/components/ui/sidebar";

type NavigationItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: {
    text: string;
    variant: "blue" | "gray" | "yellow";
  };
};

const baseNavigationItems: Omit<NavigationItem, "badge">[] = [
  { 
    title: "Início", 
    url: "/home", 
    icon: LayoutDashboard,
  },
  { 
    title: "Senhas", 
    url: "/senhas", 
    icon: Key,
  },
  { 
    title: "Crachás", 
    url: "/crachas", 
    icon: IdCard,
  },
  { 
    title: "Assinaturas", 
    url: "/assinaturas", 
    icon: Mail,
  },
  { 
    title: "Controle NVR", 
    url: "/controle-nvr", 
    icon: Video,
  },
  { 
    title: "Controle de HDs", 
    url: "/Controle-hds", 
    icon: HardDrive,
  },
  { 
    title: "Termo de Responsabilidade", 
    url: "/termos", 
    icon: FileText,
  },
  { 
    title: "Gestão de Rede", 
    url: "/gestaorede", 
    icon: Network,
  },
  { 
    title: "Servidores", 
    url: "/servidores", 
    icon: Server,
  },
  { 
    title: "Chamados", 
    url: "/chamados", 
    icon: Wrench,
  },
  { 
    title: "Configurações", 
    url: "/configuracoes", 
    icon: Settings,
  },
];

// navigationItems será criado dinamicamente dentro do componente

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

export function AppSidebar() {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { hasPermission, role } = usePagePermissions();
  const isCollapsed = state === "collapsed";

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
    const loadPagesMaintenance = async () => {
      try {
        const pages = await getPagesInMaintenance();
        console.log('[AppSidebar] Páginas em manutenção carregadas:', pages.map(p => ({ path: p.page_path, is_active: p.is_active })));
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
        console.log('[AppSidebar] Objeto atualizado com', Object.keys(maintenanceObj).length, 'páginas:', Object.keys(maintenanceObj));
        setPagesMaintenance(maintenanceObj);
      } catch (error) {
        console.error("Erro ao carregar páginas em manutenção:", error);
      }
    };
    
    // Carregar imediatamente
    loadPagesMaintenance();
    
    // Listener para mudanças imediatas
    const handleMaintenanceChange = async (event: any) => {
      console.log('[AppSidebar] Evento pagesMaintenanceChanged recebido:', event.detail);
      // Pequeno delay para garantir que o banco foi atualizado
      await new Promise(resolve => setTimeout(resolve, 200));
      await loadPagesMaintenance();
      // Forçar atualização do filteredNavigationItems
      setMaintenanceUpdateTrigger(prev => prev + 1);
    };
    window.addEventListener('pagesMaintenanceChanged', handleMaintenanceChange);
    
    // Recarregar a cada 30 segundos para pegar mudanças
    const interval = setInterval(loadPagesMaintenance, 30000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('pagesMaintenanceChanged', handleMaintenanceChange);
    };
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Adiciona badges dinamicamente baseado na configuração de manutenção do banco
  const navigationItems: NavigationItem[] = useMemo(() => {
    const maintenanceKeys = Object.keys(pagesMaintenance);
    console.log('[AppSidebar] Recalculando navigationItems, páginas em manutenção:', maintenanceKeys);
    return baseNavigationItems.map(item => {
      // Normalizar path para comparação
      const normalizedItemUrl = item.url.toLowerCase().trim();
      const maintenanceConfig = Object.entries(pagesMaintenance).find(([path]) => {
        return path.toLowerCase().trim() === normalizedItemUrl;
      })?.[1];
      
      if (maintenanceConfig) {
        console.log(`[AppSidebar] Adicionando badge para ${item.url}:`, maintenanceConfig);
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
    console.log('[AppSidebar] Recalculando filteredNavigationItems, trigger:', maintenanceUpdateTrigger);
    return navigationItems.filter((item) => {
      // Configurações só para admin
      if (item.url === "/configuracoes") {
        const isAdmin = role === "admin";
        // Log para debug
        if (!isAdmin) {
          console.log("Configurações oculta: usuário não é admin", { role, userEmail: user?.email });
        }
        return isAdmin;
      }
      // Outras páginas: verificar permissão
      const hasAccess = hasPermission(item.url);
      if (!hasAccess) {
        console.log(`[AppSidebar] Página ${item.url} filtrada (sem permissão)`, {
          hasPermission: hasAccess,
          role,
          url: item.url
        });
      }
      return hasAccess;
    });
  }, [navigationItems, hasPermission, role, user?.email, maintenanceUpdateTrigger]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

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
        const { error: profileError } = await supabase
          .from("user_profiles")
          .update({ nome: nomeExibicao.trim() })
          .eq("user_id", user.id);

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
            console.warn("Erro ao atualizar perfil:", profileError);
          }
        }
      } catch (profileErr) {
        // Ignorar erros de tabela não encontrada
        console.warn("Erro ao atualizar perfil:", profileErr);
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
      console.error("Erro ao salvar nome:", error);
      toast.error("Erro ao salvar nome. Tente novamente.");
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
        toast.error("Senha atual incorreta");
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
        toast.error("Erro ao alterar senha: " + updateError.message);
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
      console.error("Erro ao alterar senha:", error);
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
      console.error("Erro ao limpar cache:", error);
      toast.error("Erro ao limpar cache. Tente novamente.");
    }
  }, []);

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-60"} collapsible="icon">
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border p-4">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-blue-500/20">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sidebar-foreground text-base tracking-tight">BR Marinas</h2>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-blue-500/20">
              <Waves className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="p-2">
        {/* Navigation Group */}
        <SidebarGroup className="p-2">
          <SidebarGroupLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
            {!isCollapsed && "Navegação"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.url);
                
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild className="h-8 text-sm mb-0.5">
                      <NavLink 
                        to={item.url}
                        onClick={() => {
                          // Fecha a sidebar no mobile ao clicar em um link
                          if (isMobile) {
                            setOpenMobile(false);
                          }
                        }}
                        className="transition-all duration-200 hover:bg-sidebar-accent text-sidebar-foreground flex items-center gap-2 px-2 py-1.5 rounded-md group"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                      >
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        {!isCollapsed && (
                          <>
                            <span className="font-medium text-xs truncate flex-1">
                              {item.title}
                            </span>
                            {item.badge && (
                              <Badge 
                                variant="outline" 
                                className={`${getBadgeClasses(item.badge.variant)} text-[10px] px-1.5 py-0 h-4 shadow`}
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

      {/* Footer */}
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
                <Bell className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
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
              className="w-7 h-7 bg-gradient-to-br from-primary/20 to-primary/30 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
              title="Configurações"
            >
              <span className="text-primary font-semibold text-[10px]">
                {displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </span>
            </button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => setNotificationsModalOpen(true)}
              title="Notificações"
            >
              <Bell className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-7 w-7"
              title="Sair"
            >
              <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
            <div className="scale-75">
              <ThemeToggle />
            </div>
          </div>
        )}
      </SidebarFooter>

      {/* Modal de Notificações */}
      <Dialog open={notificationsModalOpen} onOpenChange={setNotificationsModalOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificações
            </DialogTitle>
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
                          toast.error("Erro ao enviar email: " + error.message);
                          return;
                        }
                        
                        toast.success("Email de redefinição de senha enviado com sucesso!");
                      } catch (error: any) {
                        toast.error("Erro ao enviar email: " + error.message);
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
