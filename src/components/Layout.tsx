import React, { ReactNode, useRef, useMemo } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Search, HardDrive, Video, Table2, LayoutGrid, Type, ArrowUp, ArrowDown, Download, Printer, Phone, Plus, X, RefreshCw, Home, Package, ArrowLeft, Loader2 } from "lucide-react";
import { useIsMobile, useIsLandscapeMobile } from "@/hooks/use-mobile";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { NAVIGATION_ITEMS } from "@/config/navigation.config";
import { NVR_MODELS } from "@/contexts/NVRContext";
import { ChevronUp } from "lucide-react";



interface LayoutProps {
  children: ReactNode;
}

// Componente Glider para tabs de visualização (Planilha/Cards)
function ViewModeGlider({
  viewMode,
  viewModeTabRefs,
}: {
  viewMode: "table" | "cards";
  viewModeTabRefs: React.MutableRefObject<Map<string, HTMLLabelElement>>;
}) {
  const [gliderStyle, setGliderStyle] = useState({ width: 0, transform: "translateX(0)" });

  useEffect(() => {
    const timer = setTimeout(() => {
      const activeKey = viewMode === "table" ? "Planilha" : "Cards";
      const activeLabel = viewModeTabRefs.current.get(activeKey);

      if (activeLabel) {
        const container = activeLabel.parentElement;
        if (container) {
          let translateX = 0;

          const order = ["Planilha", "Cards"];

          for (const key of order) {
            if (key === activeKey) break;
            const label = viewModeTabRefs.current.get(key);
            if (label) {
              translateX += label.offsetWidth;
            }
          }

          const width = activeLabel.offsetWidth;
          setGliderStyle({
            width: width,
            transform: `translateX(${translateX}px)`,
          });
        }
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [viewMode, viewModeTabRefs]);

  return (
    <span
      className="absolute left-1.5 top-1.5 h-7 bg-blue-100 dark:bg-blue-900/30 rounded-full transition-all duration-250 ease-out z-0"
      style={{
        width: `${gliderStyle.width}px`,
        transform: gliderStyle.transform,
      }}
    />
  );
}

export function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile();
  const isLandscapeMobile = useIsLandscapeMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const [senhasViewMode, setSenhasViewMode] = useState<"table" | "cards">("table");
  const senhasViewModeTabRefs = useRef<Map<string, HTMLLabelElement>>(new Map());
  const [senhasSearch, setSenhasSearch] = useState("");
  const [senhasService, setSenhasService] = useState("todos");
  const [senhasServicesOptions, setSenhasServicesOptions] = useState<string[]>(["todos"]);
  const [senhasFontSize, setSenhasFontSize] = useState(14);
  const [nvrSearch, setNvrSearch] = useState("");
  const [hdSearch, setHdSearch] = useState("");
  const [impressorasSearch, setImpressorasSearch] = useState("");
  const [impressorasMarinaFilter, setImpressorasMarinaFilter] = useState("");
  const [ramaisSearch, setRamaisSearch] = useState("");


  const [nvrMarinaFilter, setNvrMarinaFilter] = useState("");
  const [nvrOwnerFilter, setNvrOwnerFilter] = useState("");
  const [nvrModelFilter, setNvrModelFilter] = useState("");

  // Estados para paginação global
  const [globalPagination, setGlobalPagination] = useState<{
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    visible: boolean;
  }>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12,
    visible: false,
  });

  // Mantém a UI de sidebar disponível mesmo em landscape,
  // mas como drawer mobile (controlado por useIsMobile/useSidebar).
  const showSidebarUI = true;

  const isHomePage = location.pathname.toLowerCase() === "/home" || location.pathname === "/";
  const isSenhasPage = location.pathname.toLowerCase().includes("senhas");
  const isNvrPage = location.pathname.toLowerCase().includes("controle-nvr");
  const isHdPage = location.pathname.toLowerCase().includes("controle-hds") || location.pathname.toLowerCase().includes("evolucao-hds");
  const isNvrOrHdPage = isNvrPage || isHdPage;
  const isImpressorasPage = location.pathname.toLowerCase().includes("impressoras");
  const isRamaisPage = location.pathname.toLowerCase().includes("ramais");

  const isAuditLogsPage = location.pathname.toLowerCase().includes("logs");
  const isConfiguracoesPage = location.pathname.toLowerCase().includes("configuracoes"); // Linha nova
  const isChamadosPage = location.pathname.toLowerCase().includes("chamados");
  const isServidoresPage = location.pathname.toLowerCase().includes("servidores");
  const isGestaoRedePage = location.pathname.toLowerCase().includes("gestaorede");
  const isTermosPage = location.pathname.toLowerCase().includes("termos");
  const isAssinaturasPage = location.pathname.toLowerCase().includes("assinaturas");
  const isCrachasPage = location.pathname.toLowerCase().includes("crachas");
  const isTesteDeSegurancaPage = location.pathname.toLowerCase().includes("teste-de-seguranca");



  const MARINA_OPTIONS = [
    "BRACUHY",
    "BOA VISTA",
    "BUZIOS",
    "GLORIA",
    "ITACURUÇA",
    "PARATY",
    "PIRATAS",
    "RIBEIRA",
    "VEROLME",
    "PICCOLA"
  ];

  // Obter o nome da página atual baseado na rota
  const currentPageTitle = useMemo(() => {
    const path = location.pathname.toLowerCase();
    const navItem = NAVIGATION_ITEMS.find(item =>
      item.url.toLowerCase() === path || path.startsWith(item.url.toLowerCase() + "/")
    );
    return navItem?.title || "Início";
  }, [location.pathname]);

  // Sincroniza o estado local do header com o modo de visualização e filtros da página de Senhas
  useEffect(() => {
    if (!isSenhasPage) return;

    try {
      const stored = window.localStorage.getItem("senhas_view_mode");
      if (stored === "cards" || stored === "table") {
        setSenhasViewMode(stored);
      }
      const storedFontSize = window.localStorage.getItem("senhas_font_size");
      if (storedFontSize) {
        const fontSize = parseInt(storedFontSize, 10);
        if (!isNaN(fontSize) && fontSize >= 10 && fontSize <= 24) {
          setSenhasFontSize(fontSize);
        }
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

    const handleFontSizeChanged = (e: Event) => {
      const custom = e as CustomEvent;
      const size = custom.detail;
      if (typeof size === 'number' && size >= 10 && size <= 24) {
        setSenhasFontSize(size);
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
    window.addEventListener("senhas:fontSizeChanged", handleFontSizeChanged);
    window.addEventListener("senhas:servicesUpdated", handleServicesUpdated);
    return () => {
      window.removeEventListener("senhas:viewModeChanged", handleViewModeChanged);
      window.removeEventListener("senhas:fontSizeChanged", handleFontSizeChanged);
      window.removeEventListener("senhas:servicesUpdated", handleServicesUpdated);
    };
  }, [isSenhasPage, senhasService]);

  // Handler global para tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Primeiro, tentar fechar modais (dispatch evento global)
        const escEvent = new CustomEvent('global:esc');
        window.dispatchEvent(escEvent);

        // Se estiver na página de senhas, limpar filtros
        if (isSenhasPage) {
          handleSenhasSearchChange("");
          handleSenhasServiceChange("todos");
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSenhasPage]);

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

  const handleSenhasFontSizeChange = (newSize: number) => {
    const clampedSize = Math.max(10, Math.min(24, newSize));
    setSenhasFontSize(clampedSize);
    try {
      window.localStorage.setItem("senhas_font_size", clampedSize.toString());
    } catch {
      // ignore
    }
    const event = new CustomEvent("senhas:setFontSize", { detail: clampedSize });
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
  
  const handleImpressorasSearchChange = (value: string) => {
    setImpressorasSearch(value);
    const event = new CustomEvent("impressoras:setSearch", { detail: value });
    window.dispatchEvent(event);
  };
  
  const handleImpressorasMarinaFilterChange = (value: string) => {
    setImpressorasMarinaFilter(value);
    const event = new CustomEvent("impressoras:setMarinaFilter", { detail: value });
    window.dispatchEvent(event);
  };
  
  const handleImpressorasClearFilters = () => {
    setImpressorasSearch("");
    setImpressorasMarinaFilter("");
    const event = new CustomEvent("impressoras:clearFilters");
    window.dispatchEvent(event);
  };
  
  const handleRamaisSearchChange = (value: string) => {
    setRamaisSearch(value);
    const event = new CustomEvent("ramais:setSearch", { detail: value });
    window.dispatchEvent(event);
  };
  
  const handleRamaisClearFilters = () => {
    setRamaisSearch("");
    const event = new CustomEvent("ramais:clearFilters");
    window.dispatchEvent(event);
  };
  



  
  const handleNvrMarinaFilterChange = (value: string) => {
    setNvrMarinaFilter(value);
    const event = new CustomEvent("nvr:setMarinaFilter", { detail: value });
    window.dispatchEvent(event);
  };
  
  const handleNvrOwnerFilterChange = (value: string) => {
    setNvrOwnerFilter(value);
    const event = new CustomEvent("nvr:setOwnerFilter", { detail: value });
    window.dispatchEvent(event);
  };
  
  const handleNvrModelFilterChange = (value: string) => {
    setNvrModelFilter(value);
    const event = new CustomEvent("nvr:setModelFilter", { detail: value });
    window.dispatchEvent(event);
  };
  
  const handleNvrClearFilters = () => {
    setNvrSearch("");
    setNvrMarinaFilter("");
    setNvrOwnerFilter("");
    setNvrModelFilter("");
    const event = new CustomEvent("nvr:clearFilters");
    window.dispatchEvent(event);
  };



  // Handlers para paginação global
  const handleGlobalPaginationUpdate = (event: Event) => {
    const custom = event as CustomEvent<{
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      visible: boolean;
    }>;
    setGlobalPagination(custom.detail);
  };

  const handleGlobalPaginationChange = (newPage: number) => {
    const event = new CustomEvent("global-pagination:pageChanged", { detail: newPage });
    window.dispatchEvent(event);
  };

  // Event listeners para paginação global
  useEffect(() => {
    window.addEventListener("global-pagination:update", handleGlobalPaginationUpdate);

    return () => {
      window.removeEventListener("global-pagination:update", handleGlobalPaginationUpdate);
    };
  }, []);

  // Resetar paginação global quando sair das páginas de senhas
  useEffect(() => {
    if (!isSenhasPage) {
      setGlobalPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 12,
        visible: false,
      });
    }
  }, [isSenhasPage]);

  return (
    <SidebarProvider defaultOpen={showSidebarUI && !isMobile}>
      <div className="flex min-h-screen w-full bg-background">
        {showSidebarUI && <AppSidebar />}
        
        <div className="flex-1 flex flex-col w-full h-screen overflow-hidden pb-12 md:pb-0">
          {/* Header - Responsivo */}
          <header className="app-header h-12 md:h-14 border-b border-border bg-background/95 backdrop-blur-sm flex-shrink-0 flex items-center px-3 md:px-4 gap-2 md:gap-4 z-30 relative">
            {/* Título à esquerda */}
            <div className="flex items-center gap-2 min-w-0">
              {!showSidebarUI && !isLandscapeMobile && (
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-secondary text-foreground border border-border"
                  aria-label="Voltar para a página anterior"
                
                >
                  <span className="text-lg leading-none">←</span>
                </button>
              )}

              {/* Botão Home nas páginas de Senhas, Controle NVR e Controle HD */}
              {(isSenhasPage || isTesteDeSegurancaPage || isNvrPage || isHdPage || isConfiguracoesPage || isAuditLogsPage || isRamaisPage || isImpressorasPage || isChamadosPage || isServidoresPage || isGestaoRedePage || isTermosPage || isAssinaturasPage || isCrachasPage) && (
                <button
                  type="button"
                  onClick={() => navigate("/home")}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-secondary text-foreground border border-border transition-colors"
                  aria-label="Voltar para o início"
                  title="Voltar ao início"
                >
                  <Home className="h-4 w-4" />
                </button>
              )}
              <h1 className="text-sm md:text-lg font-semibold text-foreground truncate">
                {currentPageTitle}
              </h1>
            </div>

            {/* Filtros e controles à direita */}
            <div className="flex-1 min-w-0 flex items-center gap-2 justify-end">

              {/* Filtros da página de Senhas no próprio header */}
              {isSenhasPage && (
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <div className="relative max-w-[300px] md:max-w-[400px] min-w-[120px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Buscar..."
                      value={senhasSearch}
                      autoComplete="off"
                      onChange={(e) => handleSenhasSearchChange(e.target.value)}
                      className="pl-10 pr-10 h-8 text-xs md:text-sm"
                    />
                    {senhasSearch && (
                      <button
                        onClick={() => handleSenhasSearchChange("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Tabs de visualização - Apenas Desktop */}
                  {!isMobile && (
                    <div className="relative inline-flex items-center bg-white dark:bg-slate-800 shadow-sm rounded-full p-1.5 border border-slate-200 dark:border-slate-700">
                      <input
                        type="radio"
                        id="senhas-view-table"
                        name="senhas-view-tabs"
                        className="hidden"
                        checked={senhasViewMode === "table"}
                        onChange={() => handleSenhasToggle("table")}
                      />
                      <label
                        ref={(el) => {
                          if (el) senhasViewModeTabRefs.current.set("Planilha", el);
                        }}
                        htmlFor="senhas-view-table"
                        className={`relative z-10 flex items-center justify-center gap-1.5 h-7 px-3 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                          senhasViewMode === "table"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-slate-700 dark:text-slate-300"
                        } hover:bg-blue-100 dark:hover:bg-blue-900/30`}
                      >
                        <Table2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Planilha</span>
                      </label>
                      <input
                        type="radio"
                        id="senhas-view-cards"
                        name="senhas-view-tabs"
                        className="hidden"
                        checked={senhasViewMode === "cards"}
                        onChange={() => handleSenhasToggle("cards")}
                      />
                      <label
                        ref={(el) => {
                          if (el) senhasViewModeTabRefs.current.set("Cards", el);
                        }}
                        htmlFor="senhas-view-cards"
                        className={`relative z-10 flex items-center justify-center gap-1.5 h-7 px-3 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                          senhasViewMode === "cards"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-slate-700 dark:text-slate-300"
                        } hover:bg-blue-100 dark:hover:bg-blue-900/30`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Cards</span>
                      </label>
                      <ViewModeGlider viewMode={senhasViewMode} viewModeTabRefs={senhasViewModeTabRefs} />
                    </div>
                  )}
                  {/* Controle de tamanho de fonte - Apenas Desktop */}
                  {!isMobile && (
                    <div className="flex items-center gap-1 border rounded-md p-1 bg-background">
                      <Type className="w-4 h-4 text-muted-foreground mx-1" />
                      <button
                        type="button"
                        onClick={() => handleSenhasFontSizeChange(senhasFontSize - 1)}
                        className="h-7 w-7 p-0 flex items-center justify-center hover:bg-secondary rounded"
                        title="Diminuir fonte"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-medium text-foreground min-w-[2.5rem] text-center">
                        {senhasFontSize}px
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSenhasFontSizeChange(senhasFontSize + 1)}
                        className="h-7 w-7 p-0 flex items-center justify-center hover:bg-secondary rounded"
                        title="Aumentar fonte"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Botão Adicionar Senha - Apenas Desktop */}
                  {!isMobile && (
                    <Button
                      onClick={() => {
                        const event = new CustomEvent("senhas:openTypeSelector");
                        window.dispatchEvent(event);
                      }}
                      className="gap-1 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white border-blue-600 text-xs sm:text-sm"
                      size="sm"
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Adicionar Senha</span>
                      <span className="sm:hidden">Adicionar</span>
                    </Button>
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

              {/* Botões de ação da página de Controle HD no header (apenas desktop) */}
              {isHdPage && !isMobile && (
                <div className="flex items-center gap-2 ml-auto">
                  <Button 
                    onClick={() => {
                      const event = new CustomEvent("hd:export");
                      window.dispatchEvent(event);
                    }}
                    className="gap-1 md:gap-2 bg-slate-500 hover:bg-slate-600 text-white border-slate-600 text-xs md:text-sm" 
                    size="sm"
                    variant="outline"
                  >
                    <Download className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Exportar (XLSX)</span>
                    <span className="sm:hidden">Exportar</span>
                  </Button>
                  <Link to="/controle-nvr">
                    <Button variant="outline" size="sm" className="gap-1 md:gap-2 text-xs md:text-sm">
                      <Video className="w-3 h-3 md:w-4 md:h-4" />
                      NVRs
                    </Button>
                  </Link>
                </div>
              )}

              {/* Busca e filtros da página de Impressoras no header (apenas desktop) */}
              {isImpressorasPage && !isMobile && (
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <div className="relative max-w-[300px] md:max-w-[400px] min-w-[120px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Buscar..."
                      value={impressorasSearch}
                      autoComplete="off"
                      onChange={(e) => handleImpressorasSearchChange(e.target.value)}
                      className="pl-10 pr-10 h-8 text-xs md:text-sm"
                    />
                    {impressorasSearch && (
                      <button
                        onClick={() => handleImpressorasSearchChange("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="w-[130px] md:w-[160px]">
                    <Select value={impressorasMarinaFilter || undefined} onValueChange={handleImpressorasMarinaFilterChange}>
                      <SelectTrigger className="h-8 text-xs md:text-sm">
                        <SelectValue placeholder="Todas as marinas" />
                      </SelectTrigger>
                      <SelectContent>
                        {MARINA_OPTIONS.sort().map((marina) => (
                          <SelectItem key={marina} value={marina}>
                            {marina}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {(impressorasSearch || impressorasMarinaFilter) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleImpressorasClearFilters}
                      className="h-8 text-xs px-2"
                    >
                      <X className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Limpar</span>
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      const event = new CustomEvent("impressoras:openDialog");
                      window.dispatchEvent(event);
                    }}
                    size="sm"
                    className="gap-1 md:gap-2 bg-primary hover:bg-primary/90 text-xs md:text-sm ml-auto"
                  >
                    <Plus className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Nova Impressora</span>
                    <span className="sm:hidden">Novo</span>
                  </Button>
                </div>
              )}

              {/* Busca da página de Ramais no header (apenas desktop) */}
              {isRamaisPage && !isMobile && (
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <div className="relative max-w-[300px] md:max-w-[400px] min-w-[120px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Buscar..."
                      value={ramaisSearch}
                      autoComplete="off"
                      onChange={(e) => handleRamaisSearchChange(e.target.value)}
                      className="pl-10 pr-10 h-8 text-xs md:text-sm"
                    />
                    {ramaisSearch && (
                      <button
                        onClick={() => handleRamaisSearchChange("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {ramaisSearch && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRamaisClearFilters}
                      className="h-8 text-xs px-2"
                    >
                      <X className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Limpar</span>
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      const event = new CustomEvent("ramais:openDialog");
                      window.dispatchEvent(event);
                    }}
                    size="sm"
                    className="gap-1 md:gap-2 bg-primary hover:bg-primary/90 text-xs md:text-sm ml-auto"
                  >
                    <Plus className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Novo Ramal</span>
                    <span className="sm:hidden">Novo</span>
                  </Button>
                </div>
              )}

              {/* Busca e filtros da página de Controle NVR no header (apenas desktop) */}
              {isNvrPage && !isMobile && (
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <div className="relative max-w-[300px] md:max-w-[400px] min-w-[120px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Buscar..."
                      value={nvrSearch}
                      autoComplete="off"
                      onChange={(e) => handleNvrSearchChange(e.target.value)}
                      className="pl-10 pr-10 h-8 text-xs md:text-sm"
                    />
                    {nvrSearch && (
                      <button
                        onClick={() => handleNvrSearchChange("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {(nvrSearch || nvrMarinaFilter || nvrOwnerFilter || nvrModelFilter) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNvrClearFilters}
                      className="h-8 text-xs px-2"
                    >
                      <X className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Limpar</span>
                    </Button>
                  )}
                  <Link to="/controle-hds">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 md:gap-2 text-xs md:text-sm"
                    >
                      <HardDrive className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="hidden sm:inline">Controle HDs</span>
                      <span className="sm:hidden">HDs</span>
                    </Button>
                  </Link>
                  <Button
                    onClick={() => {
                      const event = new CustomEvent("nvr:openDialog");
                      window.dispatchEvent(event);
                    }}
                    size="sm"
                    className="gap-1 md:gap-2 bg-primary hover:bg-primary/90 text-xs md:text-sm"
                  >
                    <Plus className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Novo NVR</span>
                    <span className="sm:hidden">Novo</span>
                  </Button>
                </div>
              )}







              {isAuditLogsPage && !isMobile && (
                <div className="flex-1 flex items-center gap-2 min-w-0 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const event = new CustomEvent("audit-logs:refresh");
                      window.dispatchEvent(event);
                    }}
                    className="gap-1 md:gap-2 text-xs md:text-sm"
                    size="sm"
                  >
                    <RefreshCw className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Atualizar</span>
                    <span className="sm:hidden">Atualizar</span>
                  </Button>
                  <Button
                    onClick={() => {
                      const event = new CustomEvent("audit-logs:export");
                      window.dispatchEvent(event);
                    }}
                    className="gap-1 md:gap-2 text-xs md:text-sm"
                    size="sm"
                  >
                    <Download className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Exportar CSV</span>
                    <span className="sm:hidden">Exportar</span>
                  </Button>
                </div>
              )}

            </div>
          </header>

          {/* Main content - Com scroll quando necessário e padding responsivo */}
          <main
            className={
              isSenhasPage
                ? "app-main flex-1 overflow-y-auto p-0 custom-scrollbar"
                : isNvrOrHdPage && isMobile
                ? "app-main flex-1 overflow-y-auto p-0 custom-scrollbar"
                : "app-main flex-1 overflow-y-auto p-3 md:p-4 lg:p-6 custom-scrollbar"
            }
          >
            <div className="max-w-full">
              {children}
            </div>
          </main>

          {/* Componente de Paginação Global - Apenas nas páginas de senhas */}
          {isSenhasPage && globalPagination.visible && globalPagination.totalPages > 1 && (
            <div className="flex items-center justify-between py-4 border-t px-4 bg-background/95 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Mostrando {(globalPagination.currentPage - 1) * globalPagination.itemsPerPage + 1} a{' '}
                  {Math.min(globalPagination.currentPage * globalPagination.itemsPerPage, globalPagination.totalItems)} de{' '}
                  {globalPagination.totalItems} itens
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGlobalPaginationChange(globalPagination.currentPage - 1)}
                  disabled={globalPagination.currentPage === 1}
                  className="gap-1"
                >
                  <ChevronUp className="w-4 h-4 rotate-[-90deg]" />
                  Anterior
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, globalPagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (globalPagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (globalPagination.currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (globalPagination.currentPage >= globalPagination.totalPages - 2) {
                      pageNum = globalPagination.totalPages - 4 + i;
                    } else {
                      pageNum = globalPagination.currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={globalPagination.currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleGlobalPaginationChange(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGlobalPaginationChange(globalPagination.currentPage + 1)}
                  disabled={globalPagination.currentPage === globalPagination.totalPages}
                  className="gap-1"
                >
                  Próximo
                  <ChevronUp className="w-4 h-4 rotate-90" />
                </Button>
              </div>
            </div>
          )}

          {/* Barra inferior fixa apenas no mobile (quando a UI da sidebar está disponível e não está em landscape) */}
          {showSidebarUI && !isLandscapeMobile && <MobileBottomBar />}
        </div>
      </div>
    </SidebarProvider>
  );
}