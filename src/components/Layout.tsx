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

// Componente Glider para tabs de tipo (Serviços/Produtos)
function TipoGlider({
  tipoTab,
  tipoTabRefs,
}: {
  tipoTab: "servico" | "produto";
  tipoTabRefs: React.MutableRefObject<Map<string, HTMLLabelElement>>;
}) {
  const [gliderStyle, setGliderStyle] = useState({ width: 0, transform: "translateX(0)" });

  useEffect(() => {
    const timer = setTimeout(() => {
      const activeKey = tipoTab === "servico" ? "Serviços" : "Produtos";
      const activeLabel = tipoTabRefs.current.get(activeKey);

      if (activeLabel) {
        const container = activeLabel.parentElement;
        if (container) {
          let translateX = 0;

          const order = ["Serviços", "Produtos"];
          
          for (const key of order) {
            if (key === activeKey) break;
            const label = tipoTabRefs.current.get(key);
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
  }, [tipoTab, tipoTabRefs]);

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

// Componente Glider para tabs principais de Solicitações (Lista/DADOS)
function SolicitacoesMainGlider({
  mainTab,
  mainTabRefs,
}: {
  mainTab: "lista" | "central";
  mainTabRefs: React.MutableRefObject<Map<string, HTMLLabelElement>>;
}) {
  const [gliderStyle, setGliderStyle] = useState({ width: 0, transform: "translateX(0)" });

  useEffect(() => {
    const timer = setTimeout(() => {
      const activeKey = mainTab === "lista" ? "Lista" : "DADOS";
      const activeLabel = mainTabRefs.current.get(activeKey);

      if (activeLabel) {
        const container = activeLabel.parentElement;
        if (container) {
          let translateX = 0;

          const order = ["Lista", "DADOS"];
          
          for (const key of order) {
            if (key === activeKey) break;
            const label = mainTabRefs.current.get(key);
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
  }, [mainTab, mainTabRefs]);

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

interface LayoutProps {
  children: ReactNode;
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
  const [solicitacoesSearch, setSolicitacoesSearch] = useState("");
  const [solicitacoesServicoFilter, setSolicitacoesServicoFilter] = useState("todos");
  const [solicitacoesAnoFilter, setSolicitacoesAnoFilter] = useState("todos");
  const [solicitacoesServicoOptions, setSolicitacoesServicoOptions] = useState<string[]>([]);
  const [solicitacoesAnoOptions, setSolicitacoesAnoOptions] = useState<string[]>([]);
  const [solicitacoesShowDuplicados, setSolicitacoesShowDuplicados] = useState(false);
  const [solicitacoesTipoTab, setSolicitacoesTipoTab] = useState<"servico" | "produto">("servico");
  const solicitacoesTipoTabRefs = useRef<Map<string, HTMLLabelElement>>(new Map());
  const [solicitacoesMainTab, setSolicitacoesMainTab] = useState<"lista" | "central">("lista");
  const solicitacoesMainTabRefs = useRef<Map<string, HTMLLabelElement>>(new Map());
  const [solicitacoesLoading, setSolicitacoesLoading] = useState(false);
  const [despesasMes, setDespesasMes] = useState(new Date().getMonth() + 1);
  const [despesasAno, setDespesasAno] = useState(new Date().getFullYear());
  const [despesasSearch, setDespesasSearch] = useState("");
  const [nvrMarinaFilter, setNvrMarinaFilter] = useState("");
  const [nvrOwnerFilter, setNvrOwnerFilter] = useState("");
  const [nvrModelFilter, setNvrModelFilter] = useState("");

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
  const isSolicitacoesPage = location.pathname.toLowerCase().includes("solicitacoes");
  const isDespesasRecorrentesPage = location.pathname.toLowerCase().includes("despesas-recorrentes");
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
  
  const handleSolicitacoesSearchChange = (value: string) => {
    setSolicitacoesSearch(value);
    const event = new CustomEvent("solicitacoes:setSearch", { detail: value });
    window.dispatchEvent(event);
  };

  const handleSolicitacoesServicoFilterChange = (value: string) => {
    setSolicitacoesServicoFilter(value);
    const event = new CustomEvent("solicitacoes:setServicoFilter", { detail: value });
    window.dispatchEvent(event);
  };

  const handleSolicitacoesAnoFilterChange = (value: string) => {
    setSolicitacoesAnoFilter(value);
    const event = new CustomEvent("solicitacoes:setAnoFilter", { detail: value });
    window.dispatchEvent(event);
  };

  const handleSolicitacoesClearFilters = () => {
    setSolicitacoesSearch("");
    setSolicitacoesServicoFilter("todos");
    setSolicitacoesAnoFilter("todos");
    const event = new CustomEvent("solicitacoes:clearFilters");
    window.dispatchEvent(event);
  };

  const handleSolicitacoesToggleDuplicados = (checked: boolean) => {
    setSolicitacoesShowDuplicados(checked);
    const event = new CustomEvent("solicitacoes:toggleDuplicados", { detail: checked });
    window.dispatchEvent(event);
  };

  const handleSolicitacoesToggleTipo = (tipo: "servico" | "produto") => {
    setSolicitacoesTipoTab(tipo);
    const event = new CustomEvent("solicitacoes:setTipoTab", { detail: tipo });
    window.dispatchEvent(event);
  };

  const handleSolicitacoesToggleMainTab = (tab: "lista" | "central") => {
    setSolicitacoesMainTab(tab);
    const event = new CustomEvent("solicitacoes:setMainTab", { detail: tab });
    window.dispatchEvent(event);
  };

  // Receber opções de serviço e ano da página
  useEffect(() => {
    const handleSetServicoOptions = (event: Event) => {
      const custom = event as CustomEvent<string[]>;
      const options = Array.isArray(custom.detail) ? custom.detail : [];
      setSolicitacoesServicoOptions(options);
    };

    const handleSetAnoOptions = (event: Event) => {
      const custom = event as CustomEvent<string[]>;
      const options = Array.isArray(custom.detail) ? custom.detail : [];
      setSolicitacoesAnoOptions(options);
    };

    const handleTipoTabChanged = (event: Event) => {
      const custom = event as CustomEvent<"servico" | "produto">;
      const tipo = custom.detail === "produto" ? "produto" : "servico";
      setSolicitacoesTipoTab(tipo);
    };

    const handleMainTabChanged = (event: Event) => {
      const custom = event as CustomEvent<"lista" | "central">;
      const tab = custom.detail === "central" ? "central" : "lista";
      setSolicitacoesMainTab(tab);
    };

    const handleSolicitacoesLoadingChanged = (event: Event) => {
      const custom = event as CustomEvent<boolean>;
      setSolicitacoesLoading(custom.detail || false);
    };

    window.addEventListener("solicitacoes:setServicoOptions", handleSetServicoOptions);
    window.addEventListener("solicitacoes:setAnoOptions", handleSetAnoOptions);
    window.addEventListener("solicitacoes:tipoTabChanged", handleTipoTabChanged);
    window.addEventListener("solicitacoes:mainTabChanged", handleMainTabChanged);
    window.addEventListener("solicitacoes:loadingChanged", handleSolicitacoesLoadingChanged);

    return () => {
      window.removeEventListener("solicitacoes:setServicoOptions", handleSetServicoOptions);
      window.removeEventListener("solicitacoes:setAnoOptions", handleSetAnoOptions);
      window.removeEventListener("solicitacoes:tipoTabChanged", handleTipoTabChanged);
      window.removeEventListener("solicitacoes:mainTabChanged", handleMainTabChanged);
      window.removeEventListener("solicitacoes:loadingChanged", handleSolicitacoesLoadingChanged);
    };
  }, []);
  
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

  const handleDespesasSearchChange = (value: string) => {
    setDespesasSearch(value);
    const event = new CustomEvent("despesas-recorrentes:setSearch", { detail: value });
    window.dispatchEvent(event);
  };
  
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
              {(isSenhasPage || isTesteDeSegurancaPage || isNvrPage || isHdPage || isSolicitacoesPage || isConfiguracoesPage || isAuditLogsPage || isRamaisPage || isImpressorasPage || isChamadosPage || isServidoresPage || isGestaoRedePage || isTermosPage || isAssinaturasPage || isCrachasPage) && (
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

              {/* Busca e filtros da página de Solicitações no header (apenas desktop) */}
              {isSolicitacoesPage && !isMobile && (
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <div className="relative max-w-[300px] md:max-w-[400px] min-w-[120px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Buscar..."
                      value={solicitacoesSearch}
                      autoComplete="off"
                      onChange={(e) => handleSolicitacoesSearchChange(e.target.value)}
                      className="pl-10 pr-10 h-8 text-xs md:text-sm"
                    />
                    {solicitacoesSearch && (
                      <button
                        onClick={() => handleSolicitacoesSearchChange("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="w-[130px] md:w-[150px]">
                    <Select value={solicitacoesAnoFilter || "todos"} onValueChange={handleSolicitacoesAnoFilterChange}>
                      <SelectTrigger className="h-8 text-xs md:text-sm">
                        <SelectValue placeholder="Ano" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {solicitacoesAnoOptions.map((ano) => (
                          <SelectItem key={ano} value={ano}>
                            {ano}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {(solicitacoesSearch || (solicitacoesServicoFilter && solicitacoesServicoFilter !== "todos") || (solicitacoesAnoFilter && solicitacoesAnoFilter !== "todos")) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSolicitacoesClearFilters}
                      className="h-8 text-xs px-2"
                    >
                      <X className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Limpar</span>
                    </Button>
                  )}
                  <div className="relative inline-flex items-center bg-white dark:bg-slate-800 shadow-sm rounded-full p-1.5 border border-slate-200 dark:border-slate-700">
                    <input
                      type="radio"
                      id="solicitacoes-main-lista"
                      name="solicitacoes-main-tabs"
                      className="hidden"
                      checked={solicitacoesMainTab === "lista"}
                      onChange={() => handleSolicitacoesToggleMainTab("lista")}
                    />
                    <label
                      ref={(el) => {
                        if (el) solicitacoesMainTabRefs.current.set("Lista", el);
                      }}
                      htmlFor="solicitacoes-main-lista"
                      className={`relative z-10 flex items-center justify-center gap-1.5 h-7 px-3 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                        solicitacoesMainTab === "lista"
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-slate-700 dark:text-slate-300"
                      } hover:bg-blue-100 dark:hover:bg-blue-900/30`}
                    >
                      <Table2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Lista</span>
                    </label>
                    <input
                      type="radio"
                      id="solicitacoes-main-central"
                      name="solicitacoes-main-tabs"
                      className="hidden"
                      checked={solicitacoesMainTab === "central"}
                      onChange={() => handleSolicitacoesToggleMainTab("central")}
                    />
                    <label
                      ref={(el) => {
                        if (el) solicitacoesMainTabRefs.current.set("DADOS", el);
                      }}
                      htmlFor="solicitacoes-main-central"
                      className={`relative z-10 flex items-center justify-center gap-1.5 h-7 px-3 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                        solicitacoesMainTab === "central"
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-slate-700 dark:text-slate-300"
                      } hover:bg-blue-100 dark:hover:bg-blue-900/30`}
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">DADOS</span>
                    </label>
                    <SolicitacoesMainGlider mainTab={solicitacoesMainTab} mainTabRefs={solicitacoesMainTabRefs} />
                  </div>
                  {solicitacoesMainTab === "lista" && (
                    <div className="relative inline-flex items-center bg-white dark:bg-slate-800 shadow-sm rounded-full p-1.5 border border-slate-200 dark:border-slate-700">
                      <input
                        type="radio"
                        id="solicitacoes-tipo-servico"
                        name="solicitacoes-tipo-tabs"
                        className="hidden"
                        checked={solicitacoesTipoTab === "servico"}
                        onChange={() => handleSolicitacoesToggleTipo("servico")}
                      />
                      <label
                        ref={(el) => {
                          if (el) solicitacoesTipoTabRefs.current.set("Serviços", el);
                        }}
                        htmlFor="solicitacoes-tipo-servico"
                        className={`relative z-10 flex items-center justify-center h-7 px-4 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                          solicitacoesTipoTab === "servico"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-slate-700 dark:text-slate-300"
                        } hover:bg-blue-100 dark:hover:bg-blue-900/30`}
                      >
                        Serviços
                      </label>
                      <input
                        type="radio"
                        id="solicitacoes-tipo-produto"
                        name="solicitacoes-tipo-tabs"
                        className="hidden"
                        checked={solicitacoesTipoTab === "produto"}
                        onChange={() => handleSolicitacoesToggleTipo("produto")}
                      />
                      <label
                        ref={(el) => {
                          if (el) solicitacoesTipoTabRefs.current.set("Produtos", el);
                        }}
                        htmlFor="solicitacoes-tipo-produto"
                        className={`relative z-10 flex items-center justify-center h-7 px-4 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                          solicitacoesTipoTab === "produto"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-slate-700 dark:text-slate-300"
                        } hover:bg-purple-100 dark:hover:bg-purple-900/30`}
                      >
                        Produtos
                      </label>
                      <TipoGlider tipoTab={solicitacoesTipoTab} tipoTabRefs={solicitacoesTipoTabRefs} />
                    </div>
                  )}
                  {solicitacoesMainTab === "lista" && (
                    <div className="flex items-center gap-2 px-2 py-1 border rounded-md bg-background">
                      <Switch
                        id="duplicados-switch"
                        checked={solicitacoesShowDuplicados}
                        onCheckedChange={handleSolicitacoesToggleDuplicados}
                      />
                      <Label htmlFor="duplicados-switch" className="text-xs cursor-pointer whitespace-nowrap">
                        Duplicados
                      </Label>
                    </div>

                  )}
                  {solicitacoesMainTab === "lista" && (
                    <Button
                      onClick={() => {
                        const event = new CustomEvent("solicitacoes:loadItems");
                        window.dispatchEvent(event);
                      }}
                      disabled={solicitacoesLoading}
                      size="sm"
                      className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
                    >
                      <Loader2 className={`w-3 h-3 ${solicitacoesLoading ? 'animate-spin' : ''}`} />
                      Atualizar 
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      const event = new CustomEvent("solicitacoes:openCreateDialog");
                      window.dispatchEvent(event);
                    }}
                    size="sm"
                    className="gap-1 md:gap-2 bg-primary hover:bg-primary/90 text-xs md:text-sm ml-auto"
                  >
                    <Plus className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Adicionar</span>
                    <span className="sm:hidden">Adicionar</span>
                  </Button>
                </div>
              )}

              {/* Busca e filtros da página de Despesas Recorrentes no header (apenas desktop) */}
              {isDespesasRecorrentesPage && !isMobile && (
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <div className="relative max-w-[300px] md:max-w-[400px] min-w-[120px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Buscar..."
                      value={despesasSearch}
                      autoComplete="off"
                      onChange={(e) => handleDespesasSearchChange(e.target.value)}
                      className="pl-10 pr-10 h-8 text-xs md:text-sm"
                    />
                    {despesasSearch && (
                      <button
                        onClick={() => handleDespesasSearchChange("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Select value={despesasMes.toString()} onValueChange={(value) => setDespesasMes(parseInt(value))}>
                      <SelectTrigger className="w-32 h-8 text-xs md:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                          <SelectItem key={mes} value={mes.toString()}>
                            {new Date(2024, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long' })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      value={despesasAno}
                      onChange={(e) => setDespesasAno(parseInt(e.target.value))}
                      className="w-20 h-8 text-xs md:text-sm"
                      min="2020"
                      max="2030"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const hoje = new Date();
                      setDespesasMes(hoje.getMonth() + 1);
                      setDespesasAno(hoje.getFullYear());
                    }}
                    className="h-8 text-xs px-2"
                  >
                    Mês Atual
                  </Button>
                  {despesasSearch && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDespesasSearchChange("")}
                      className="h-8 text-xs px-2"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Limpar
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      const event = new CustomEvent("despesas-recorrentes:openCreateDialog");
                      window.dispatchEvent(event);
                    }}
                    size="sm"
                    className="gap-1 md:gap-2 bg-primary hover:bg-primary/90 text-xs md:text-sm ml-auto"
                  >
                    <Plus className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Adicionar Despesa</span>
                    <span className="sm:hidden">Adicionar</span>
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

          {/* Barra inferior fixa apenas no mobile (quando a UI da sidebar está disponível e não está em landscape) */}
          {showSidebarUI && !isLandscapeMobile && <MobileBottomBar />}
        </div>
      </div>
    </SidebarProvider>
  );
}
