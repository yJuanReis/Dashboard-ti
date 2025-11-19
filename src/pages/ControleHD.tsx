import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Video,
  HardDrive,
  CheckCircle2,
  ShoppingCart,
  AlertTriangle,
  MessageSquare,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useNVR, NVR_MODELS, MARINA_OPTIONS, OWNER_OPTIONS, type NVR, type Slot } from "@/contexts/NVRContext";
import { fetchHDPrice, saveHDPrice } from "@/lib/nvrConfigService";

type SortField = "marina" | "name" | "model" | "owner";
type SortDirection = "asc" | "desc";

// Componente Glider para tabs de proprietário
function Glider({
  ownerFilter,
  ownerTabRefs,
}: {
  ownerFilter: string;
  ownerTabRefs: React.MutableRefObject<Map<string, HTMLLabelElement>>;
}) {
  const [gliderStyle, setGliderStyle] = useState({ width: 0, transform: "translateX(0)" });

  useEffect(() => {
    // Pequeno delay para garantir que os refs estejam prontos
    const timer = setTimeout(() => {
      const activeKey = ownerFilter === "" ? "Todos" : ownerFilter;
      const activeLabel = ownerTabRefs.current.get(activeKey);

      if (activeLabel) {
        const container = activeLabel.parentElement;
        if (container) {
          let translateX = 0;

          // Ordem fixa: Todos, depois as opções de OWNER_OPTIONS
          const order = ["Todos", ...OWNER_OPTIONS];
          
          // Calcula a posição X somando as larguras de todos os elementos anteriores
          for (const key of order) {
            if (key === activeKey) break;
            const label = ownerTabRefs.current.get(key);
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
  }, [ownerFilter, ownerTabRefs]);

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

export default function EvolucaoHDs() {
  const { nvrs, updateSlot } = useNVR();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [marinaFilter, setMarinaFilter] = useState<string>("");
  const [ownerFilter, setOwnerFilter] = useState<string>("");
  const [modelFilter, setModelFilter] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("marina");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [hdPrice, setHdPrice] = useState(100.0);
  const [selectedNVR, setSelectedNVR] = useState<NVR | null>(null);
  const priceSaveTimerRef = useRef<number | null>(null);
  const ownerTabRefs = useRef<Map<string, HTMLLabelElement>>(new Map());

  // Carrega o preço do HD do Supabase ao montar o componente
  useEffect(() => {
    const loadHDPrice = async () => {
      try {
        const price = await fetchHDPrice();
        setHdPrice(price);
      } catch (error) {
        console.error('Erro ao carregar preço do HD:', error);
        // Mantém o valor padrão se houver erro
      }
    };
    loadHDPrice();
  }, []);

  // Filtrar NVRs que precisam de ação (slots vazios ou undersized)
  const nvrsNeedingAction = nvrs.filter((nvr) =>
    (nvr.slots || []).some(
      (slot) =>
        slot.status === "empty" ||
        (slot.status !== "inactive" &&
          slot.hdSize > 0 &&
          slot.hdSize < 12)
    )
  );

  // Filtrar e ordenar
  const filteredAndSortedNVRs = [...nvrsNeedingAction]
    .filter((nvr) => {
      const matchesSearch =
        !searchTerm ||
        `${nvr.marina} ${nvr.name} ${nvr.model} ${nvr.owner}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesMarina = !marinaFilter || nvr.marina === marinaFilter;
      const matchesOwner = !ownerFilter || nvr.owner === ownerFilter;
      const matchesModel = !modelFilter || nvr.model === modelFilter;
      return matchesSearch && matchesMarina && matchesOwner && matchesModel;
    })
    .sort((a, b) => {
      const fieldA = a[sortField];
      const fieldB = b[sortField];
      const compare = String(fieldA).localeCompare(String(fieldB), "pt-BR", {
        numeric: true,
      });
      return sortDirection === "asc" ? compare : -compare;
    });

  // Calcular KPIs
  const calculateKPIs = () => {
    let totalSlotsInSystem = 0;
    let totalSlotsNeedingAction = 0;
    let totalSlotsValid = 0;
    let purchasedCount = 0;
    let emptySlotsCount = 0;
    let slotsWithHD12Plus = 0;
    let slotsWithHDLessThan12 = 0;

    nvrs.forEach((nvr) => {
      (nvr.slots || []).forEach((slot) => {
        if (slot.status === "inactive") return;

        totalSlotsInSystem++;
        const isEmpty = slot.status === "empty";
        const isUndersized = !isEmpty && slot.hdSize < 12;
        const hasHD12Plus = !isEmpty && slot.hdSize >= 12;
        const hasHDLessThan12 = !isEmpty && slot.hdSize > 0 && slot.hdSize < 12;

        if (isEmpty) {
          emptySlotsCount++;
        }

        if (hasHD12Plus) {
          slotsWithHD12Plus++;
        }

        if (hasHDLessThan12) {
          slotsWithHDLessThan12++;
        }

        if (isEmpty || isUndersized) {
          totalSlotsNeedingAction++;
          if (slot.purchased) purchasedCount++;
        } else {
          totalSlotsValid++;
        }
      });
    });

    const pendingSlotsCount = totalSlotsNeedingAction - purchasedCount;
    const progress =
      totalSlotsInSystem > 0
        ? ((totalSlotsValid + purchasedCount) / totalSlotsInSystem) * 100
        : 0;
    const estimatedCost = pendingSlotsCount * hdPrice;

    return {
      progress: progress.toFixed(0),
      emptySlots: pendingSlotsCount,
      cost: estimatedCost,
      totalSlots: emptySlotsCount + slotsWithHDLessThan12, // Total de HDs que precisam ser comprados
      emptySlotsCount: emptySlotsCount,
      slotsWithHD12Plus: slotsWithHD12Plus,
      slotsWithHDLessThan12: slotsWithHDLessThan12,
    };
  };

  const kpis = calculateKPIs();

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSlotToggle = async (nvrId: string, slotIndex: number) => {
    const nvr = nvrs.find((n) => n.id === nvrId);
    if (!nvr) return;

    const slot = nvr.slots[slotIndex];
    // Não permite toggle se o slot está OK (status OK não deve ser clicável)
    const isOk = slot.status !== "empty" && slot.status !== "inactive" && slot.hdSize >= 12;
    if (isOk) return;

    const updatedSlot: Slot = {
      ...slot,
      purchased: !slot.purchased,
    };

    try {
      await updateSlot(nvrId, slotIndex, updatedSlot);
      toast.success("Status do slot atualizado");
    } catch (error) {
      // Erro já foi tratado no contexto
      console.error('Erro ao atualizar slot:', error);
    }
  };

  const handlePriceChange = (value: string) => {
    const price = parseFloat(value) || 0;
    setHdPrice(price);

    // Debounce para salvar no Supabase
    if (priceSaveTimerRef.current) {
      clearTimeout(priceSaveTimerRef.current);
    }
    priceSaveTimerRef.current = window.setTimeout(async () => {
      try {
        await saveHDPrice(price);
        toast.success("Preço do HD salvo!");
      } catch (error) {
        console.error('❌ Erro ao salvar preço do HD:', error);
        toast.error('Erro ao salvar preço do HD');
      }
    }, 1000);
  };

  const handleExport = () => {
    // Verificar se XLSX está disponível
    if (typeof window === "undefined" || !(window as any).XLSX) {
      toast.error(
        "Biblioteca XLSX não encontrada. Por favor, recarregue a página."
      );
      return;
    }

    const XLSX = (window as any).XLSX;

    const dataToExport = nvrs.flatMap((nvr) =>
      (nvr.slots || [])
        .map((slot, index) => {
          const isEmpty = slot.status === "empty";
          const isUndersized =
            slot.status !== "inactive" &&
            !isEmpty &&
            slot.hdSize > 0 &&
            slot.hdSize < 12;

          if (!isEmpty && !isUndersized) return null;

          return {
            Responsável: nvr.owner,
            "Marina / Numeração": `${nvr.marina} / ${nvr.name}`,
            Modelo: nvr.model,
            Slot: index + 1,
            "Status Atual": isEmpty ? "Vazio" : `${slot.hdSize} TB`,
            Ação: isEmpty ? "Comprar" : "Substituir",
            Comprado: slot.purchased ? "Sim" : "Não",
          };
        })
        .filter(Boolean)
    );

    if (dataToExport.length === 0) {
      toast.info("Nenhum dado para exportar");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "EvolucaoHDs");
    XLSX.writeFile(
      workbook,
      `relatorio_evolucao_hds_${new Date().toISOString().slice(0, 10)}.xlsx`
    );

    toast.success("Relatório exportado com sucesso!");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setMarinaFilter("");
    setOwnerFilter("");
    setModelFilter("");
    setSearchFocused(false);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  // Função para criar botão de slot
  const createSlotButton = (slot: Slot, nvrId: string, slotIndex: number) => {
    if (slot.status === "inactive") return null;

    const isPurchased = slot.purchased === true;
    const isEmpty = slot.status === "empty";
    const isUndersized = !isEmpty && slot.hdSize > 0 && slot.hdSize < 12;
    const isOk = !isEmpty && !isUndersized && slot.hdSize >= 12;

    // Ícones SVG conforme referência
    const okIcon = (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
        <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"></path>
      </svg>
    );
    const buyIcon = (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
        <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
      </svg>
    );
    const replaceIcon = (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
        <path d="M128,24,24,80l104,56,104-56Zm-9.6,124.8a8,8,0,0,0,19.2,0L242.4,98.4a8,8,0,1,0-8.8-12.8L128,144,22.4,85.6a8,8,0,1,0-8.8,12.8ZM233.6,134.4,128,192,22.4,134.4a8,8,0,1,0-8.8,12.8L118.4,208a8,8,0,0,0,19.2,0L242.4,147.2a8,8,0,1,0-8.8-12.8Z"></path>
      </svg>
    );

    let className = "";
    let icon = okIcon;
    let mainText = "";
    let secondaryText = "";
    let title = "";

    if (isPurchased) {
      className = "status-purchased bg-green-600 hover:bg-green-700 border-green-500 text-white";
      icon = okIcon;
      mainText = "Comprado";
      secondaryText = "A instalar";
      title = "Comprado. Clique para desmarcar.";
    } else if (isEmpty) {
      className = "action-buy bg-red-600 hover:bg-red-700 border-red-500 text-white";
      icon = buyIcon;
      mainText = "Comprar";
      secondaryText = "(Vazio)";
      title = "Slot vazio. Clique para marcar como comprado.";
    } else if (isUndersized) {
      className = "action-replace bg-orange-600 hover:bg-orange-700 border-orange-500 text-white";
      icon = replaceIcon;
      mainText = `${slot.hdSize} TB`;
      secondaryText = "Substituir";
      title = `HD de ${slot.hdSize}TB. Clique para marcar como substituído.`;
    } else if (isOk) {
      className = "status-ok bg-green-600 border-green-500 text-white cursor-default";
      icon = okIcon;
      mainText = `${slot.hdSize} TB`;
      secondaryText = "OK";
      title = `HD de ${slot.hdSize}TB. Status OK.`;
    }

    return (
      <button
        key={slotIndex}
        onClick={() => !isOk && handleSlotToggle(nvrId, slotIndex)}
        disabled={isOk}
        className={`slot-evolution-button min-w-[90px] h-20 rounded-xl flex flex-col items-center justify-center border-2 transition-all font-bold text-sm ${className} ${
          isOk ? "" : "hover:shadow-lg hover:-translate-y-0.5"
        }`}
        title={title}
        data-nvr-id={nvrId}
        data-slot-index={slotIndex}
      >
        <div className="icon mb-1">{icon}</div>
        <span className="main-text text-base">{mainText}</span>
        {secondaryText && (
          <span className="secondary-text text-[10px] opacity-80 uppercase mt-0.5">
            {secondaryText}
          </span>
        )}
      </button>
    );
  };


  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Header Fixo */}
      <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur-sm px-4 py-2">
        <div className="flex flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <HardDrive className="w-6 h-6 text-primary" />
              Evolução de HDs
            </h1>
            <p className="text-sm text-muted-foreground">Acompanhe e planeje substituições de discos</p>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button 
              onClick={handleExport} 
              className="gap-2 bg-slate-500 hover:bg-slate-600 text-white border-slate-600" 
              size="sm"
              variant="outline"
            >
              <Download className="w-4 h-4" />
              Exportar (XLSX)
            </Button>
            <Link to="/controle-nvr">
              <Button variant="outline" size="sm" className="gap-2">
                <Video className="w-4 h-4" />
                NVRs
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Cabeçalho Unificado com KPIs e Controles - Fixo */}
      <div className="flex-shrink-0 border-b bg-background px-4 py-2">
        <Card>
          <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* KPIs em Sub-Cards */}
            <div className="flex flex-wrap items-stretch gap-2 flex-1">
              {/* Progresso Geral */}
              <Card className="flex-1 min-w-[120px]">
                <CardContent className="p-3">
                  <div className="flex flex-col gap-2 h-full items-center justify-center">
                    <div className="text-xl font-semibold text-muted-foreground text-center">
                      Progresso Geral {/* (Titulo do card) */}
                    </div>
                    <div className="text-3xl font-bold text-center">{kpis.progress}% {/* (conteudo do card 1) */}</div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                        style={{ width: `${kpis.progress}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informações de Slots */}
              <Card className="flex-1 min-w-[120px]">
                <CardContent className="px-2 py-3">
                  <div className="flex flex-col gap-1.5 h-full items-center justify-center">
                    <div className="text-xl font-semibold text-muted-foreground text-center">
                      Informações de Slots {/* (Titulo do card) */}
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
                      <div className="flex items-center gap-4">
                        <span className="text-lg text-muted-foreground">Vazios:</span>
                        <span className="text-2xl font-bold">{kpis.emptySlotsCount}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg text-muted-foreground">Maior que 12TB:</span>
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">{kpis.slotsWithHD12Plus}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg text-muted-foreground">Total a comprar:</span>
                        <span className="text-2xl font-bold">{kpis.totalSlots} {/* (conteudo do card 2) */}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg text-muted-foreground">Menor que 12TB:</span>
                        <span className="text-2xl font-bold text-red-600 dark:text-red-400">{kpis.slotsWithHDLessThan12}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Custo Estimado */}
              <Card className="flex-1 min-w-[120px]">
                <CardContent className="p-3">
                  <div className="flex flex-col gap-2 h-full items-center justify-center">
                    <div className="text-xl font-semibold text-muted-foreground text-center">
                      Custo Estimado {/* (Titulo do card) */}
                    </div>
                    <div className="text-3xl font-bold text-success text-center">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(kpis.cost)} {/* (conteudo do card 3) */}
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full opacity-0">
                      {/* Espaçador invisível para manter altura igual */}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Controles */}
            <div className="flex flex-wrap items-stretch gap-2">
              {/* Card de Preço */}
              <Card className="min-w-[140px]">
                <CardContent className="p-3">
                  <div className="flex flex-col gap-2 h-full">
                    <div className="flex flex-col">
                      <Label htmlFor="hd-price" className="text-xs font-medium text-muted-foreground mb-1">
                        Preço por HD (R$)
                      </Label>
                      <Input
                        id="hd-price"
                        type="number"
                        value={hdPrice}
                        onChange={(e) => handlePriceChange(e.target.value)}
                        placeholder="100,00"
                        min="0"
                        step="0.01"
                        className="w-full h-8 text-sm font-semibold"
                      />
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full opacity-0 mt-auto">
                      {/* Espaçador invisível para manter altura igual */}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros Fixos - Compactos */}
      <div className="flex-shrink-0 border-b border-border bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4 py-2 bg-background/95 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <nav className="flex flex-wrap gap-x-2 gap-y-2 items-center" aria-label="Marinas">
            <button
              onClick={() => setMarinaFilter("")}
              className={`whitespace-nowrap py-1.5 px-3 border-b-2 font-semibold text-xs flex items-center gap-1.5 transition-all duration-200 rounded-t ${
                marinaFilter === ""
                  ? "border-b-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Todos
            </button>
            {MARINA_OPTIONS.sort().map((marina) => {
              const isActive = marinaFilter === marina;
              return (
                <button
                  key={marina}
                  onClick={() => setMarinaFilter(marina)}
                  className={`whitespace-nowrap py-1.5 px-3 border-b-2 font-semibold text-xs flex items-center gap-1.5 transition-all duration-200 rounded-t ${
                    isActive
                      ? "border-b-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  {marina}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="relative inline-flex items-center bg-white dark:bg-slate-800 shadow-sm rounded-full p-1.5 border border-slate-200 dark:border-slate-700">
              <input
                type="radio"
                id="owner-all"
                name="owner-tabs"
                className="hidden"
                checked={ownerFilter === ""}
                onChange={() => setOwnerFilter("")}
              />
              <label
                ref={(el) => {
                  if (el) ownerTabRefs.current.set("Todos", el);
                }}
                htmlFor="owner-all"
                className={`relative z-10 flex items-center justify-center h-7 px-4 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                  ownerFilter === ""
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                Todos
              </label>
              {OWNER_OPTIONS.map((owner, index) => (
                <React.Fragment key={owner}>
                  <input
                    type="radio"
                    id={`owner-${index}`}
                    name="owner-tabs"
                    className="hidden"
                    checked={ownerFilter === owner}
                    onChange={() => setOwnerFilter(owner)}
                  />
                  <label
                    ref={(el) => {
                      if (el) ownerTabRefs.current.set(owner, el);
                    }}
                    htmlFor={`owner-${index}`}
                    className={`relative z-10 flex items-center justify-center h-7 px-4 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                      ownerFilter === owner
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-slate-700 dark:text-slate-300"
                    } ${
                      owner === "BR Marinas"
                        ? "hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        : owner === "Tele Litorânea"
                        ? "hover:bg-orange-100 dark:hover:bg-orange-900/30"
                        : ""
                    }`}
                  >
                    {owner}
                  </label>
                </React.Fragment>
              ))}
              <Glider ownerFilter={ownerFilter} ownerTabRefs={ownerTabRefs} />
            </div>
          </div>

          {/* Campo de Pesquisa - Direita */}
          <div className="relative ml-auto">
            <div
              className={`relative transition-all duration-200 ${
                searchFocused || searchTerm
                  ? "w-[200px]"
                  : "w-8"
              }`}
            >
              {!(searchFocused || searchTerm) ? (
                <button
                  onClick={() => setSearchFocused(true)}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10"
                >
                  <Search className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                  <Input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => {
                      if (!searchTerm) {
                        setSearchFocused(false);
                      }
                    }}
                    className="h-8 text-sm pl-8 pr-8"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSearchFocused(false);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          </div>

          {(searchTerm || marinaFilter || ownerFilter) && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="whitespace-nowrap h-8 text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Tabela com Scroll */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        <table className="w-full caption-bottom text-sm">
            <TableHeader className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800">
                <TableRow className="bg-slate-100 dark:bg-slate-800 border-b-2">
                  <TableHead className="text-center bg-slate-100 dark:bg-slate-800">
                    <div className="flex items-center justify-center gap-2">
                      <span>Responsável</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleSort("owner")}
                      >
                        <SortIcon field="owner" />
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead className="text-center bg-slate-100 dark:bg-slate-800">
                    <div className="flex items-center justify-center gap-2">
                      <span>Marina / Numeração</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleSort("marina")}
                      >
                        <SortIcon field="marina" />
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead className="text-center bg-slate-100 dark:bg-slate-800">
                    <div className="flex items-center justify-center gap-2">
                      <span>Modelo</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleSort("model")}
                      >
                        <SortIcon field="model" />
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead className="text-center bg-slate-100 dark:bg-slate-800">Status dos Slots</TableHead>
                  <TableHead className="text-center bg-slate-100 dark:bg-slate-800">
                    <span>OBS</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedNVRs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">
                        Nenhum NVR com slots vazios encontrado.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedNVRs.map((nvr, index) => (
                    <TableRow 
                      key={nvr.id}
                      className={index % 2 === 0 ? "bg-card" : "bg-muted/30"}
                    >
                      <TableCell className="text-center font-medium">
                        <span
                          className={`inline-block px-3 py-1 rounded-md transition-colors ${
                            nvr.owner === "BR Marinas"
                              ? "bg-blue-100 dark:bg-blue-900/30 cursor-default"
                              : nvr.owner === "Tele Litorânea" || nvr.owner === "Tele"
                              ? "bg-orange-100 dark:bg-orange-900/30 cursor-default"
                              : ""
                          }`}
                        >
                          {nvr.owner}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {nvr.marina} / {nvr.name}
                      </TableCell>
                      <TableCell className="text-center">
                        {nvr.model}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2 justify-center horizontal-row-simulation">
                          {(nvr.slots || []).map((slot, originalIndex) => {
                            if (slot.status === "inactive") return null;
                            return createSlotButton(slot, nvr.id, originalIndex);
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {nvr.notes ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedNVR(nvr)}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </table>
          </div>

      {/* Modal de Observações */}
      <Dialog open={selectedNVR !== null} onOpenChange={() => setSelectedNVR(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Observações: {selectedNVR?.marina} / {selectedNVR?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedNVR?.notes ? (
              <div className="text-sm text-muted-foreground whitespace-pre-wrap min-h-[100px]">
                {selectedNVR.notes}
              </div>
            ) : (
              <p className="text-muted-foreground italic min-h-[100px]">
                Nenhuma observação registada.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedNVR(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
