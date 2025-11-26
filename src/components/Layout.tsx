import { ReactNode, useRef } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Menu, Search, HardDrive, Video } from "lucide-react";
import { useIsMobile, useIsLandscapeMobile } from "@/hooks/use-mobile";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile();
  const isLandscapeMobile = useIsLandscapeMobile();
  const navigate = useNavigate();
  const sidebarTriggerRef = useRef<HTMLButtonElement | null>(null);
  const location = useLocation();
  const [senhasViewMode, setSenhasViewMode] = useState<"table" | "cards">("table");
  const [senhasSearch, setSenhasSearch] = useState("");
  const [senhasService, setSenhasService] = useState("todos");
  const [senhasServicesOptions, setSenhasServicesOptions] = useState<string[]>(["todos"]);
  const [nvrSearch, setNvrSearch] = useState("");
  const [hdSearch, setHdSearch] = useState("");

  // Mantém a UI de sidebar disponível mesmo em landscape,
  // mas como drawer mobile (controlado por useIsMobile/useSidebar).
  const showSidebarUI = true;

  const isSenhasPage = location.pathname.toLowerCase().includes("senhas");
  const isNvrPage = location.pathname.toLowerCase().includes("controle-nvr");
  const isHdPage = location.pathname.toLowerCase().includes("controle-hds") || location.pathname.toLowerCase().includes("evolucao-hds");
  const isNvrOrHdPage = isNvrPage || isHdPage;

  // Sincroniza o estado local do header com o modo de visualização e filtros da página de Senhas
  useEffect(() => {
    if (!isSenhasPage) return;

    try {
      const stored = window.localStorage.getItem("senhas_view_mode");
      if (stored === "cards" || stored === "table") {
        setSenhasViewMode(stored);
      }
    } catch {
      // ignore
    }

    const handleViewModeChanged = (e: Event) => {
      const custom = e as CustomEvent;
      const mode = custom.detail;
      if (mode === "cards" || mode === "table") {
        setSenhasViewMode(mode);
      }
    };

    const handleServicesUpdated = (e: Event) => {
      const custom = e as CustomEvent<string[]>;
      if (Array.isArray(custom.detail) && custom.detail.length > 0) {
        setSenhasServicesOptions(custom.detail);
        if (!custom.detail.includes(senhasService)) {
          setSenhasService("todos");
        }
      }
    };

    window.addEventListener("senhas:viewModeChanged", handleViewModeChanged);
    window.addEventListener("senhas:servicesUpdated", handleServicesUpdated);
    return () => {
      window.removeEventListener("senhas:viewModeChanged", handleViewModeChanged);
      window.removeEventListener("senhas:servicesUpdated", handleServicesUpdated);
    };
  }, [isSenhasPage, senhasService]);

  const handleSenhasToggle = (mode: "table" | "cards") => {
    setSenhasViewMode(mode);
    try {
      window.localStorage.setItem("senhas_view_mode", mode);
    } catch {
      // ignore
    }
    const event = new CustomEvent("senhas:setViewMode", { detail: mode });
    window.dispatchEvent(event);
  };

  const handleSenhasSearchChange = (value: string) => {
    setSenhasSearch(value);
    const event = new CustomEvent("senhas:setSearch", { detail: value });
    window.dispatchEvent(event);
  };

  const handleSenhasServiceChange = (value: string) => {
    setSenhasService(value);
    const event = new CustomEvent("senhas:setService", { detail: value });
    window.dispatchEvent(event);
  };
  
  const handleNvrSearchChange = (value: string) => {
    setNvrSearch(value);
    const event = new CustomEvent("nvr:setSearch", { detail: value });
    window.dispatchEvent(event);
  };
  
  const handleHdSearchChange = (value: string) => {
    setHdSearch(value);
    const event = new CustomEvent("hd:setSearch", { detail: value });
    window.dispatchEvent(event);
  };
  
  return (
    <SidebarProvider defaultOpen={showSidebarUI && !isMobile}>
      <div className="flex min-h-screen w-full bg-background">
        {showSidebarUI && <AppSidebar sidebarTriggerRef={sidebarTriggerRef} />}
        
        <div className="flex-1 flex flex-col w-full h-screen overflow-hidden pb-12 md:pb-0">
          {/* Header with trigger - Responsivo */}
          <header className="app-header h-12 md:h-14 border-b border-border bg-background/95 backdrop-blur-sm flex-shrink-0 flex items-center px-3 md:px-4 gap-2 md:gap-4 z-30">
            {showSidebarUI ? (
              <SidebarTrigger
                ref={sidebarTriggerRef}
                className="hover:bg-secondary h-8 w-8 md:h-9 md:w-9"
              >
                <Menu className="w-4 h-4 md:w-5 md:h-5" />
              </SidebarTrigger>
            ) : (
              !isLandscapeMobile && (
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-secondary text-foreground border border-border"
                  aria-label="Voltar para a página anterior"
                >
                  <span className="text-lg leading-none">←</span>
                </button>
              )
            )}
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <h1 className="text-sm md:text-lg font-semibold text-foreground truncate">
                Sistema de Gestão TI
              </h1>

              {/* Filtros da página de Senhas no próprio header */}
              {isSenhasPage && (
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <div className="relative flex-1 min-w-[120px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Buscar por serviço, descrição ou utilizador..."
                      value={senhasSearch}
                      autoComplete="off"
                      onChange={(e) => handleSenhasSearchChange(e.target.value)}
                      className="pl-10 pr-10 h-8 text-xs md:text-sm"
                    />
                  </div>
                  {senhasServicesOptions.length > 0 && (
                    <div className="w-[130px] md:w-[160px]">
                      <select
                        value={senhasService}
                        onChange={(e) => handleSenhasServiceChange(e.target.value)}
                        className="px-2 py-1.5 bg-background border border-input rounded-md text-xs md:text-sm w-full"
                      >
                        {senhasServicesOptions.map((service) => (
                          <option key={service} value={service}>
                            {service === "todos"
                              ? "Serviços"
                              : service.charAt(0).toUpperCase() + service.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Campo de busca e botão de evolução da página de Controle NVR no header (apenas mobile) */}
              {isNvrPage && isMobile && (
                <div className="flex-1 flex items-center gap-2 min-w-0 justify-end">
                  <div className="relative flex-1 min-w-[120px] max-w-[240px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Buscar NVR..."
                      value={nvrSearch}
                      autoComplete="off"
                      onChange={(e) => handleNvrSearchChange(e.target.value)}
                      className="pl-10 pr-10 h-8 text-xs md:text-sm"
                    />
                  </div>
                  <Link to="/controle-hds">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs md:text-sm px-2 md:px-3"
                    >
                      <HardDrive className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="text-xs sm:hidden">HDs</span>
                      <span className="hidden sm:inline">Controle HDs</span>
                    </Button>
                  </Link>
                </div>
              )}

              {/* Campo de busca e botão de NVRs da página de Controle HD no header (apenas mobile) */}
              {isHdPage && isMobile && (
                <div className="flex-1 flex items-center gap-2 min-w-0 justify-end">
                  <div className="relative flex-1 min-w-[120px] max-w-[240px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Buscar NVR..."
                      value={hdSearch}
                      autoComplete="off"
                      onChange={(e) => handleHdSearchChange(e.target.value)}
                      className="pl-10 pr-10 h-8 text-xs md:text-sm"
                    />
                  </div>
                  <Link to="/controle-nvr">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs md:text-sm px-2 md:px-3"
                    >
                      <Video className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="text-xs">NVRs</span>
                    </Button>
                  </Link>
                </div>
              )}

              {/* Toggle compacto apenas no mobile e apenas na página de Senhas */}
              {isMobile && isSenhasPage && (
                <div className="inline-flex items-center gap-1 border rounded-md px-2 py-2 bg-background">
                  <button
                    type="button"
                    onClick={() => handleSenhasToggle("table")}
                    className={`px-3 py-1.5 text-xs rounded-md flex items-center gap-1 ${
                      senhasViewMode === "table"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-transparent text-foreground/90"
                    }`}
                  >
                    Planilha
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSenhasToggle("cards")}
                    className={`px-3 py-1.5 text-xs rounded-md flex items-center gap-1 ${
                      senhasViewMode === "cards"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-transparent text-foreground/80"
                    }`}
                  >
                    Cards
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Main content - Com scroll quando necessário e padding responsivo */}
          <main
            className={
              isSenhasPage
                ? "app-main flex-1 overflow-y-auto pt-1 pb-3 px-2 md:px-4 lg:px-6"
                : isNvrOrHdPage && isMobile
                ? "app-main flex-1 overflow-y-auto p-0"
                : "app-main flex-1 overflow-y-auto p-3 md:p-4 lg:p-6"
            }
          >
            <div className="max-w-full">
              {children}
            </div>
          </main>

          {/* Barra inferior fixa apenas no mobile (quando a UI da sidebar está disponível e não está em landscape) */}
          {showSidebarUI && !isLandscapeMobile && <MobileBottomBar />}
        </div>
      </div>
    </SidebarProvider>
  );
}
