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
  LogOut
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

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

const navigationItems = [
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
    url: "/controle-hds", 
    icon: HardDrive,
    badge: { text: "Avaliar", variant: "yellow" as const }
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
    badge: { text: "Avaliar", variant: "yellow" as const }
  },
  { 
    title: "Servidores", 
    url: "/servidores", 
    icon: Server,
    badge: { text: "Avaliar", variant: "yellow" as const }
  },
  { 
    title: "Chamados", 
    url: "/chamados", 
    icon: Wrench,
    badge: { text: "Avaliar", variant: "yellow" as const }
  },
  { 
    title: "Configurações", 
    url: "/configuracoes", 
    icon: Settings,
    badge: { text: "Dev", variant: "gray" as const }
  },
];

const getBadgeClasses = (variant: "blue" | "gray" | "yellow") => {
  switch (variant) {
    case "blue":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "yellow":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "gray":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-60"} collapsible="icon">
      {/* Header */}
      <SidebarHeader className="border-b border-slate-200/60 p-4">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <Server className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">BR Marinas</h2>
              <p className="text-[10px] text-slate-500">Painel de TI</p>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="p-2">
        {/* Navigation Group */}
        <SidebarGroup className="p-2">
          <SidebarGroupLabel className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 py-1.5">
            {!isCollapsed && "Navegação"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.url);
                
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild className="h-8 text-sm mb-0.5">
                      <NavLink 
                        to={item.url}
                        className="transition-all duration-200 hover:bg-slate-100 text-slate-700 flex items-center gap-2 px-2 py-1.5 rounded-md group"
                        activeClassName="bg-slate-200 text-slate-900 font-semibold"
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

        {/* System Status Group */}
        {!isCollapsed && (
          <SidebarGroup className="p-2 mt-2">
            <SidebarGroupLabel className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 py-1.5">
              Status do Sistema
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-2 py-1.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Servidores</span>
                  <Badge variant="outline" className="bg-success text-success-foreground border-success text-[10px] px-1.5 py-0 h-4 shadow">
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">NVRs Ativos</span>
                  <span className="font-semibold text-slate-900 text-xs">12</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Chamados</span>
                  <Badge variant="outline" className="bg-warning text-warning-foreground border-warning text-[10px] px-1.5 py-0 h-4 shadow">
                    3
                  </Badge>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-slate-200/60 p-3">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center">
                <span className="text-slate-700 font-semibold text-[10px]">TI</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-xs truncate">Equipa de TI</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email || "admin@brmarinas.com"}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Bell className="w-3.5 h-3.5 text-slate-600" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <LogOut className="w-3.5 h-3.5 mr-2" />
              Sair
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center">
              <span className="text-slate-700 font-semibold text-[10px]">TI</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-7 w-7"
              title="Sair"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-600" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
