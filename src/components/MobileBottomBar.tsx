import { Home, Search, User, Menu } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/components/ui/sidebar";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { NAVIGATION_ITEMS } from "@/config/navigation.config";

export function MobileBottomBar() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();
  const { hasPermission } = usePagePermissions();

  // Itens principais para navegação mobile (baseados na configuração global)
  const MOBILE_MAIN_NAVIGATION = NAVIGATION_ITEMS.filter((item) => !item.mobileHidden);

  if (!isMobile) {
    return null;
  }

  const homeItem =
    MOBILE_MAIN_NAVIGATION.find((item) => item.url === "/home") ??
    MOBILE_MAIN_NAVIGATION[0];

  const handleSafeNavigate = (path: string) => {
    if (!path) return;
    if (hasPermission(path)) {
      navigate(path);
    } else {
      navigate("/home");
    }
  };

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md shadow-[0_-4px_12px_rgba(0,0,0,0.08)] md:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 pb-2 pt-1.5 gap-1">
        {/* Home */}
        <button
          type="button"
          onClick={() => handleSafeNavigate(homeItem?.url ?? "/home")}
          className={`flex flex-col items-center justify-center px-2 py-1 rounded-full transition-all duration-200 ${
            isActivePath(homeItem?.url ?? "/home")
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="mt-0.5 text-[10px] font-medium">Início</span>
        </button>

        {/* Buscar (direciona para Senhas por enquanto) */}
        <button
          type="button"
          onClick={() => handleSafeNavigate("/senhas")}
          className={`flex flex-col items-center justify-center px-2 py-1 rounded-full transition-all duration-200 ${
            isActivePath("/senhas")
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <Search className="h-5 w-5" />
          <span className="mt-0.5 text-[10px] font-medium">Buscar</span>
        </button>

        {/* Perfil (leva às Configurações se permitido) */}
        <button
          type="button"
          onClick={() => handleSafeNavigate("/configuracoes")}
          className={`flex flex-col items-center justify-center px-2 py-1 rounded-full transition-all duration-200 ${
            isActivePath("/configuracoes")
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <User className="h-5 w-5" />
          <span className="mt-0.5 text-[10px] font-medium">Perfil</span>
        </button>

        {/* Menu (abre o drawer da sidebar) */}
        <button
          type="button"
          onClick={() => setOpenMobile(true)}
          className="flex flex-col items-center justify-center px-2 py-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200"
        >
          <Menu className="h-5 w-5" />
          <span className="mt-0.5 text-[10px] font-medium">Menu</span>
        </button>
      </div>
    </nav>
  );
}


