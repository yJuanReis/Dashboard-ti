import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
  Plus,
  Edit,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Video,
  HardDrive,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNVR, NVR_MODELS, MARINA_OPTIONS, OWNER_OPTIONS, type NVR, type Slot } from "@/contexts/NVRContext";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsLandscapeMobile } from "@/hooks/use-mobile";
import { logger } from "@/lib/logger";

// Funções auxiliares
function getHDSizeClass(size: number): string {
  if (!size || size <= 0) return "bg-gray-500";
  if (size <= 3) return "bg-red-500";
  if (size <= 4) return "bg-orange-500";
  if (size <= 6) return "bg-yellow-600";
  if (size <= 12) return "bg-yellow-400";
  if (size <= 14) return "bg-lime-500";
  if (size >= 18) return "bg-cyan-500";
  return "bg-gray-500";
}

function getSlotStatusClass(status: string, hdSize: number): string {
  const baseClass = getHDSizeClass(hdSize);
  return status === "inactive" ? `${baseClass} opacity-50` : baseClass;
}

// Componente para o menu de slot posicionado dinamicamente
function SlotMenu({
  nvrId,
  slotIndex,
  slotButtonRefs,
  slotSizes,
  onSelectSize,
}: {
  nvrId: string;
  slotIndex: number;
  slotButtonRefs: React.MutableRefObject<Map<string, HTMLButtonElement>>;
  slotSizes: Array<{ size: number; label: string }>;
  onSelectSize: (size: number) => void;
}) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = `${nvrId}-${slotIndex}`;
    const button = slotButtonRefs.current.get(key);
    
    if (button && menuRef.current) {
      const buttonRect = button.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      // Posicionar ao lado direito do botão por padrão
      let top = buttonRect.top + scrollY;
      let left = buttonRect.right + scrollX + 8;

      // Ajustar se o menu sair da tela à direita - posicionar à esquerda
      if (left + menuRect.width > window.innerWidth + scrollX) {
        left = buttonRect.left + scrollX - menuRect.width - 8;
      }

      // Ajustar verticalmente se necessário
      if (top + menuRect.height > window.innerHeight + scrollY) {
        top = window.innerHeight + scrollY - menuRect.height - 8;
      }

      // Garantir que não saia do topo
      if (top < scrollY) {
        top = scrollY + 8;
      }

      setPosition({ top, left });
    }
  }, [nvrId, slotIndex, slotButtonRefs]);

  return (
    <div
      ref={menuRef}
      className="slot-editor-menu fixed z-[100] w-auto p-2 bg-popover border rounded-md shadow-lg"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="grid grid-cols-2 gap-1">
        {slotSizes.map(({ size, label }) => {
          const colorClass = size === -1 
            ? "bg-yellow-400 opacity-50" 
            : size === 0 
            ? "bg-gray-500" 
            : getHDSizeClass(size);
          
          return (
            <Button
              key={size}
              variant="outline"
              size="sm"
              className={`text-xs text-white font-bold border-2 ${
                size === 0 
                  ? `${colorClass} border-gray-600 hover:opacity-80` 
                  : size === -1
                  ? `${colorClass} border-yellow-500 hover:opacity-80`
                  : `${colorClass} border-white/20 hover:opacity-80`
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelectSize(size);
              }}
            >
              {label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

type SortField = "marina" | "name" | "model" | "owner" | "cameras";
type SortDirection = "asc" | "desc";

export default function ControleNVR() {
  const { nvrs, setNvrs, updateNVR, addNVR, deleteNVR, updateSlot, loading } = useNVR();
  const { setOpenMobile, isMobile } = useSidebar();
  const isLandscapeMobile = useIsLandscapeMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [marinaFilter, setMarinaFilter] = useState<string>("");
  const [ownerFilter, setOwnerFilter] = useState<string>("");
  const [modelFilter, setModelFilter] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("marina");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showDialog, setShowDialog] = useState(false);
  const [editingNVR, setEditingNVR] = useState<NVR | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [nvrToDelete, setNvrToDelete] = useState<string | null>(null);
  const [slotEditorOpen, setSlotEditorOpen] = useState<{
    nvrId: string;
    slotIndex: number;
  } | null>(null);
  const [showUpdateAllDialog, setShowUpdateAllDialog] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef<boolean>(false);
  const slotButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Estado para detectar orientação
  const [isPortrait, setIsPortrait] = useState(false);
  const [ignoreOrientationWarning, setIgnoreOrientationWarning] = useState(false);

  // Detectar orientação e controlar sidebar
  useEffect(() => {
    const checkOrientation = () => {
      // Verifica se está em mobile (largura menor que 768px) e em modo retrato
      const isMobileDevice = window.innerWidth < 768;
      const isPortraitMode = window.innerHeight > window.innerWidth;
      const isLandscape = isMobileDevice && !isPortraitMode;
      
      setIsPortrait(isMobileDevice && isPortraitMode);
      
      // Se estiver em landscape no mobile, fecha a sidebar automaticamente
      if (isMobileDevice && isLandscape && isMobile) {
        setOpenMobile(false);
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, [isMobile, setOpenMobile]);

  // Integração com campo de busca no header (modo landscape mobile)
  useEffect(() => {
    const handleSearchFromHeader = (event: Event) => {
      const custom = event as CustomEvent<string>;
      const value = typeof custom.detail === "string" ? custom.detail : "";
      setSearchTerm(value);
    };

    window.addEventListener("nvr:setSearch", handleSearchFromHeader);
    return () => {
      window.removeEventListener("nvr:setSearch", handleSearchFromHeader);
    };
  }, []);

  const [formData, setFormData] = useState({
    marina: "",
    name: "",
    model: "",
    owner: "",
    cameras: 0,
    notes: "",
  });

  // Filtrar e ordenar NVRs
  const filteredAndSortedNVRs = [...nvrs]
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

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleOpenDialog = (nvr?: NVR) => {
    if (nvr) {
      setEditingNVR(nvr);
      setFormData({
        marina: nvr.marina,
        name: nvr.name,
        model: nvr.model,
        owner: nvr.owner,
        cameras: nvr.cameras,
        notes: nvr.notes || "",
      });
    } else {
      setEditingNVR(null);
      setFormData({
        marina: "",
        name: "",
        model: "",
        owner: "",
        cameras: 0,
        notes: "",
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.marina || !formData.name || !formData.model || !formData.owner) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      if (editingNVR) {
        // Ao editar, verificar se a marina + numeração mudou e se já existe outro NVR com essa combinação
        if (formData.marina !== editingNVR.marina || formData.name !== editingNVR.name) {
          const exists = nvrs.some(
            (nvr) => nvr.id !== editingNVR.id && nvr.marina === formData.marina && nvr.name === formData.name
          );
          if (exists) {
            toast.error(`Já existe um NVR com a numeração "${formData.name}" na marina "${formData.marina}". Por favor, escolha outra numeração.`);
            return;
          }
        }
        await updateNVR(editingNVR.id, formData);
      } else {
        // Ao criar, verificar se já existe um NVR com a mesma marina + numeração
        const exists = nvrs.some(
          (nvr) => nvr.marina === formData.marina && nvr.name === formData.name
        );
        if (exists) {
          toast.error(`Já existe um NVR com a numeração "${formData.name}" na marina "${formData.marina}". Por favor, escolha outra numeração.`);
          return;
        }

        const modelConfig = NVR_MODELS[formData.model];
        const slotsCount = modelConfig?.slots || 0;
        const slots: Slot[] = Array.from({ length: slotsCount }, () => ({
          status: "empty",
          hdSize: 0,
          purchased: false,
        }));

        await addNVR({
          ...formData,
          slots,
        });
      }
      setShowDialog(false);
    } catch (error) {
      // Erro já foi tratado no contexto
      logger.error('Erro ao salvar NVR:', error);
    }
  };

  const handleDelete = (id: string) => {
    setNvrToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (nvrToDelete) {
      try {
        await deleteNVR(nvrToDelete);
        setShowDeleteDialog(false);
        setNvrToDelete(null);
      } catch (error) {
        // Erro já foi tratado no contexto
        logger.error('Erro ao deletar NVR:', error);
      }
    }
  };

  const handleSlotUpdate = async (nvrId: string, slotIndex: number, size: number) => {
    const nvr = nvrs.find((n) => n.id === nvrId);
    if (!nvr) return;

    const newStatus: "empty" | "active" | "inactive" =
      size === 0 ? "empty" : size === -1 ? "inactive" : "active";
    const sizeToSave = size < 0 ? nvr.slots[slotIndex].hdSize : size;

    const updatedSlot = {
      status: newStatus,
      hdSize: sizeToSave,
      purchased: nvr.slots[slotIndex].purchased || false,
    };

    try {
      await updateSlot(nvrId, slotIndex, updatedSlot);
      setSlotEditorOpen(null);
      toast.success("Slot atualizado");
    } catch (error) {
      // Erro já foi tratado no contexto
      logger.error('Erro ao atualizar slot:', error);
    }
  };

  const handleSlotClick = (e: React.MouseEvent<HTMLButtonElement>, nvrId: string, slotIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    // Sempre abre o editor quando clica (toggle)
    if (slotEditorOpen?.nvrId === nvrId && slotEditorOpen?.slotIndex === slotIndex) {
      setSlotEditorOpen(null);
    } else {
      setSlotEditorOpen({ nvrId, slotIndex });
      const key = `${nvrId}-${slotIndex}`;
      slotButtonRefs.current.set(key, e.currentTarget);
    }
  };

  const handleUpdateAllSlots = async () => {
    let updatesCount = 0;
    const updatePromises: Promise<void>[] = [];
    
    nvrs.forEach((nvr) => {
      if (nvr.slots && Array.isArray(nvr.slots)) {
        nvr.slots.forEach((slot, slotIndex) => {
          // Mantém o tamanho do HD, mas muda o status para 'active' se houver HD
          if (slot.hdSize > 0 && slot.status !== "active") {
            updatePromises.push(
              updateSlot(nvr.id, slotIndex, { ...slot, status: "active" })
            );
            updatesCount++;
          }
        });
      }
    });

    try {
      await Promise.all(updatePromises);
      setShowUpdateAllDialog(false);
      if (updatesCount > 0) {
        toast.success(`${updatesCount} slots foram atualizados. Todos os slots com HD estão agora ativos.`);
      } else {
        toast.info("Não foram encontrados slots para atualizar.");
      }
    } catch (error) {
      logger.error('Erro ao atualizar todos os slots:', error);
      toast.error('Erro ao atualizar alguns slots');
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setMarinaFilter("");
    setOwnerFilter("");
    setModelFilter("");
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3 h-3" />
    ) : (
      <ArrowDown className="w-3 h-3" />
    );
  };

  const slotSizes = [
    { size: 0, label: "VAZIO" },
    { size: 3, label: "3TB" },
    { size: 4, label: "4TB" },
    { size: 6, label: "6TB" },
    { size: 12, label: "12TB" },
    { size: 14, label: "14TB" },
    { size: 18, label: "18TB" },
    { size: -1, label: "INATIVO" },
  ];

  // Fechar menu de slot ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (slotEditorOpen && !target.closest('.slot-editor-menu') && !target.closest('button[class*="w-11 h-11"]')) {
        setSlotEditorOpen(null);
      }
    };

    if (slotEditorOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [slotEditorOpen]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden relative">
      {/* Aviso de orientação para mobile em modo retrato */}
      {isPortrait && !ignoreOrientationWarning && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border-2 border-primary rounded-lg p-6 max-w-md text-center shadow-2xl">
            <div className="mb-4">
              <Video className="w-12 h-12 mx-auto text-primary mb-2" />
              <h2 className="text-xl font-bold text-foreground mb-2">
                Gire seu dispositivo
              </h2>
              <p className="text-sm text-muted-foreground">
                Para uma melhor visualização, gire seu dispositivo para o modo horizontal (landscape).
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <div className="w-8 h-8 border-2 border-muted-foreground rounded flex items-center justify-center">
                <span className="text-lg">📱</span>
              </div>
              <ArrowUpDown className="w-4 h-4" />
              <div className="w-8 h-8 border-2 border-primary rounded flex items-center justify-center">
                <span className="text-lg">📱</span>
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                className="px-4"
                onClick={() => setIgnoreOrientationWarning(true)}
              >
                Acessar mesmo assim
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Header Fixo */}
      {!isMobile && (
        <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur-sm px-2 md:px-4 py-1 md:py-1.5">
        <div className="flex flex-row justify-between items-center gap-2">
          <div className="min-w-0 flex-1">
            {!isMobile && (
              <>
                <h1 className="text-base md:text-xl font-bold text-foreground flex items-center gap-1.5 md:gap-2">
                  <Video className="hidden sm:inline-block w-4 h-4 md:w-6 md:h-6 text-primary flex-shrink-0" />
                  <span className="truncate">Controle de NVR</span>
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Gerencie gravadores de vídeo e status dos HDs
                </p>
              </>
            )}
          </div>
          {!isMobile && (
            <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
              <Link to="/controle-hds">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3"
                >
                  <HardDrive className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Controle HDs</span>
                </Button>
              </Link>
              <Button
                onClick={() => handleOpenDialog()}
                size="sm"
                className="gap-1 md:gap-2 bg-primary hover:bg-primary/90 text-xs md:text-sm px-2 md:px-3"
              >
                <Plus className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Novo NVR</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Faixa superior / filtros */}
      {isMobile ? (
        // Mobile: faixa fina sem filtros, para colar a tabela no header
        <div className="flex-shrink-0 border-b border-border bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-0.5 bg-background/95 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-1.5 md:gap-2" />
        </div>
      ) : (
        // Desktop: mantém filtros completos
        <div className="flex-shrink-0 border-b border-border bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-2 md:px-4 py-1.5 md:py-2 bg-background/95 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
            <div className="relative flex-1 min-w-[120px] sm:min-w-[200px] max-w-[250px] md:max-w-[300px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 md:pl-8 pr-7 md:pr-8 h-7 md:h-8 text-xs md:text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap hidden sm:inline">
                Marina:
              </label>
              <Select value={marinaFilter || undefined} onValueChange={(value) => setMarinaFilter(value || "")}>
                <SelectTrigger className="h-7 md:h-8 min-w-[100px] sm:min-w-[120px] text-xs">
                  <SelectValue placeholder="Todas" />
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

            <div className="flex items-center gap-1">
              <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap hidden sm:inline">
                Proprietário:
              </label>
              <Select value={ownerFilter || undefined} onValueChange={(value) => setOwnerFilter(value || "")}>
                <SelectTrigger className="h-7 md:h-8 min-w-[100px] sm:min-w-[120px] text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  {OWNER_OPTIONS.sort().map((owner) => (
                    <SelectItem 
                      key={owner} 
                      value={owner}
                      className={
                        owner === "BR Marinas"
                          ? "hover:bg-blue-100 dark:hover:bg-blue-900/30 focus:bg-blue-100 dark:focus:bg-blue-900/30"
                          : owner === "Tele Litorânea"
                          ? "hover:bg-orange-100 dark:hover:bg-orange-900/30 focus:bg-orange-100 dark:focus:bg-orange-900/30"
                          : ""
                      }
                    >
                      {owner}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap hidden sm:inline">
                Modelo:
              </label>
              <Select value={modelFilter || undefined} onValueChange={(value) => setModelFilter(value || "")}>
                <SelectTrigger className="h-7 md:h-8 min-w-[100px] sm:min-w-[120px] text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(NVR_MODELS).sort().map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(searchTerm || marinaFilter || ownerFilter || modelFilter) && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="whitespace-nowrap h-7 md:h-8 text-xs px-2"
              >
                <X className="w-3 h-3 mr-0.5 md:mr-1" />
                <span className="hidden sm:inline">Limpar</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Legenda Fixa - Oculta em todos os modos mobile para ganhar espaço */}
      {!isMobile && (
        <div className="flex-shrink-0 border-b bg-background px-2 md:px-4 py-1 md:py-2">
          <div className="flex flex-wrap items-center gap-1.5 md:gap-3">
            <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
              Legenda:
            </span>
            {[
              { size: 3, label: "3TB" },
              { size: 4, label: "4TB" },
              { size: 6, label: "6TB" },
              { size: 12, label: "12TB" },
              { size: 14, label: "14TB" },
              { size: 18, label: "18TB" },
              { size: 0, label: "Vazio" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div
                  className={`w-4 h-4 rounded ${getHDSizeClass(item.size)}`}
                />
                <span className="text-xs">{item.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-yellow-400 opacity-50" />
              <span className="text-xs">Inativo</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabela com Scroll - Otimizada para landscape mobile */}
      <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 w-full">
        <table className="w-full caption-bottom text-xs md:text-sm min-w-[600px] border-collapse">
            <TableHeader className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 shadow-sm">
                <TableRow className="bg-slate-100 dark:bg-slate-800 border-b-2 leading-tight m-0">
                  <TableHead 
                    className="text-center bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => handleSort("owner")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Responsável
                      <SortIcon field="owner" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-center bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => handleSort("marina")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Marina / Numeração
                      <SortIcon field="marina" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-center bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => handleSort("model")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Modelo
                      <SortIcon field="model" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-center bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => handleSort("cameras")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Câmeras
                      <SortIcon field="cameras" />
                    </div>
                  </TableHead>
                  <TableHead className="text-center bg-slate-100 dark:bg-slate-800">Status dos Slots</TableHead>
                  <TableHead className="text-right bg-slate-100 dark:bg-slate-800">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-muted-foreground">Carregando NVRs do banco de dados...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAndSortedNVRs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">
                        Nenhum NVR encontrado
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
                          className={`inline-block px-2 md:px-3 py-0.5 md:py-1 rounded-md transition-colors text-xs md:text-sm ${
                            nvr.owner === "BR Marinas"
                              ? "bg-blue-100 dark:bg-blue-900/30 cursor-default"
                              : nvr.owner === "Tele Litorânea"
                              ? "bg-orange-100 dark:bg-orange-900/30 cursor-default"
                              : ""
                          }`}
                        >
                          {nvr.owner}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-1 md:gap-2 justify-center text-xs md:text-sm">
                          <span className="marina-cell">{nvr.marina}</span>
                          <span className="text-muted-foreground">/</span>
                          <span className="name-cell font-medium">{nvr.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-xs md:text-sm">
                        {nvr.model} ({NVR_MODELS[nvr.model]?.slots || 0} slots)
                      </TableCell>
                      <TableCell className="text-center text-xs md:text-sm">
                        {nvr.cameras || 0} câmeras
                      </TableCell>
                      <TableCell>
                        {/* Desktop: mantém grid em 2 linhas como antes */}
                        {!isMobile && (
                          <div className="flex flex-col gap-2 md:gap-3">
                            <div className="flex gap-1.5 md:gap-3 justify-center flex-wrap">
                              {nvr.slots.slice(0, 4).map((slot, index) => {
                                const isEditorOpen =
                                  slotEditorOpen?.nvrId === nvr.id &&
                                  slotEditorOpen?.slotIndex === index;

                                return (
                                  <div key={index} className="flex flex-col items-center gap-0.5 md:gap-1">
                                    <div className="text-[10px] md:text-xs text-muted-foreground">#{index + 1}</div>
                                    <div className="relative">
                                      <button
                                        className={`w-9 h-9 md:w-11 md:h-11 rounded-lg flex items-center justify-center text-white text-[10px] md:text-xs font-bold shadow-md border-2 transition-all cursor-pointer hover:scale-105 ${
                                          slot.status === "inactive"
                                            ? "opacity-50"
                                            : ""
                                        } ${getSlotStatusClass(
                                          slot.status,
                                          slot.hdSize
                                        )} ${
                                          slot.hdSize === 0
                                            ? "border-gray-600"
                                            : "border-white/20"
                                        }`}
                                        title={`Slot ${index + 1}${
                                          slot.hdSize > 0
                                            ? ` - ${slot.hdSize}TB`
                                            : ""
                                        }\n\nClique rápido para editar este slot.\nClique longo para marcar TODOS os slots como ativos.`}
                                        onMouseDown={(e) => {
                                          e.stopPropagation();
                                          isLongPressRef.current = false;
                                          const timer = setTimeout(() => {
                                            isLongPressRef.current = true;
                                            setShowUpdateAllDialog(true);
                                            setSlotEditorOpen(null);
                                          }, 1000);
                                          longPressTimerRef.current = timer;
                                        }}
                                        onMouseUp={(e) => {
                                          e.stopPropagation();
                                          if (longPressTimerRef.current) {
                                            clearTimeout(longPressTimerRef.current);
                                            longPressTimerRef.current = null;
                                          }
                                        }}
                                        onMouseLeave={(e) => {
                                          if (longPressTimerRef.current) {
                                            clearTimeout(longPressTimerRef.current);
                                            longPressTimerRef.current = null;
                                          }
                                        }}
                                        ref={(el) => {
                                          if (el) {
                                            const key = `${nvr.id}-${index}`;
                                            slotButtonRefs.current.set(key, el);
                                          }
                                        }}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          // Só abre o editor se não foi um clique longo
                                          if (!isLongPressRef.current) {
                                            handleSlotClick(e, nvr.id, index);
                                          }
                                          // Reset da flag após um pequeno delay
                                          setTimeout(() => {
                                            isLongPressRef.current = false;
                                          }, 100);
                                        }}
                                      >
                                        {slot.hdSize > 0 ? `${slot.hdSize}TB` : "-"}
                                      </button>
                                      {isEditorOpen && (
                                        <SlotMenu
                                          nvrId={nvr.id}
                                          slotIndex={index}
                                          slotButtonRefs={slotButtonRefs}
                                          slotSizes={slotSizes}
                                          onSelectSize={(size) => handleSlotUpdate(nvr.id, index, size)}
                                        />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            {nvr.slots.length > 4 && (
                              <div className="flex gap-1.5 md:gap-3 justify-center flex-wrap">
                                {nvr.slots.slice(4).map((slot, index) => {
                                  const actualIndex = index + 4;
                                  const isEditorOpen =
                                    slotEditorOpen?.nvrId === nvr.id &&
                                    slotEditorOpen?.slotIndex === actualIndex;

                                  return (
                                    <div key={actualIndex} className="flex flex-col items-center gap-0.5 md:gap-1">
                                      <div className="text-[10px] md:text-xs text-muted-foreground">#{actualIndex + 1}</div>
                                      <div className="relative">
                                        <button
                                          className={`w-9 h-9 md:w-11 md:h-11 rounded-lg flex items-center justify-center text-white text-[10px] md:text-xs font-bold shadow-md border-2 transition-all cursor-pointer hover:scale-105 ${
                                            slot.status === "inactive"
                                              ? "opacity-50"
                                              : ""
                                          } ${getSlotStatusClass(
                                            slot.status,
                                            slot.hdSize
                                          )} ${
                                            slot.hdSize === 0
                                              ? "border-gray-600"
                                              : "border-white/20"
                                          }`}
                                          title={`Slot ${actualIndex + 1}${
                                            slot.hdSize > 0
                                              ? ` - ${slot.hdSize}TB`
                                              : ""
                                          }\n\nClique rápido para editar este slot.\nClique longo para marcar TODOS os slots como ativos.`}
                                          onMouseDown={(e) => {
                                            e.stopPropagation();
                                            isLongPressRef.current = false;
                                            const timer = setTimeout(() => {
                                              isLongPressRef.current = true;
                                              setShowUpdateAllDialog(true);
                                              setSlotEditorOpen(null);
                                            }, 1000);
                                            longPressTimerRef.current = timer;
                                          }}
                                          onMouseUp={(e) => {
                                            e.stopPropagation();
                                            if (longPressTimerRef.current) {
                                              clearTimeout(longPressTimerRef.current);
                                              longPressTimerRef.current = null;
                                            }
                                          }}
                                          onMouseLeave={(e) => {
                                            if (longPressTimerRef.current) {
                                              clearTimeout(longPressTimerRef.current);
                                              longPressTimerRef.current = null;
                                            }
                                          }}
                                          ref={(el) => {
                                            if (el) {
                                              const key = `${nvr.id}-${actualIndex}`;
                                              slotButtonRefs.current.set(key, el);
                                            }
                                          }}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            // Só abre o editor se não foi um clique longo
                                            if (!isLongPressRef.current) {
                                              handleSlotClick(e, nvr.id, actualIndex);
                                            }
                                            // Reset da flag após um pequeno delay
                                            setTimeout(() => {
                                              isLongPressRef.current = false;
                                            }, 100);
                                          }}
                                        >
                                          {slot.hdSize > 0 ? `${slot.hdSize}TB` : "-"}
                                        </button>
                                        {isEditorOpen && (
                                          <SlotMenu
                                            nvrId={nvr.id}
                                            slotIndex={actualIndex}
                                            slotButtonRefs={slotButtonRefs}
                                            slotSizes={slotSizes}
                                            onSelectSize={(size) => handleSlotUpdate(nvr.id, actualIndex, size)}
                                          />
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Mobile: todos os slots em linha única com scroll horizontal */}
                        {isMobile && (
                          <div className="w-full overflow-x-auto">
                            <div className="flex gap-1.5 justify-start items-stretch min-w-max pr-2">
                              {nvr.slots.map((slot, index) => {
                                const isEditorOpen =
                                  slotEditorOpen?.nvrId === nvr.id &&
                                  slotEditorOpen?.slotIndex === index;

                                return (
                                  <div key={index} className="flex flex-col items-center gap-0.5">
                                    <div className="text-[10px] text-muted-foreground">#{index + 1}</div>
                                    <div className="relative">
                                      <button
                                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shadow-md border-2 transition-all cursor-pointer hover:scale-105 ${
                                          slot.status === "inactive"
                                            ? "opacity-50"
                                            : ""
                                        } ${getSlotStatusClass(
                                          slot.status,
                                          slot.hdSize
                                        )} ${
                                          slot.hdSize === 0
                                            ? "border-gray-600"
                                            : "border-white/20"
                                        }`}
                                        title={`Slot ${index + 1}${
                                          slot.hdSize > 0
                                            ? ` - ${slot.hdSize}TB`
                                            : ""
                                        }\n\nClique rápido para editar este slot.\nClique longo para marcar TODOS os slots como ativos.`}
                                        onMouseDown={(e) => {
                                          e.stopPropagation();
                                          isLongPressRef.current = false;
                                          const timer = setTimeout(() => {
                                            isLongPressRef.current = true;
                                            setShowUpdateAllDialog(true);
                                            setSlotEditorOpen(null);
                                          }, 1000);
                                          longPressTimerRef.current = timer;
                                        }}
                                        onMouseUp={(e) => {
                                          e.stopPropagation();
                                          if (longPressTimerRef.current) {
                                            clearTimeout(longPressTimerRef.current);
                                            longPressTimerRef.current = null;
                                          }
                                        }}
                                        onMouseLeave={(e) => {
                                          if (longPressTimerRef.current) {
                                            clearTimeout(longPressTimerRef.current);
                                            longPressTimerRef.current = null;
                                          }
                                        }}
                                        ref={(el) => {
                                          if (el) {
                                            const key = `${nvr.id}-${index}`;
                                            slotButtonRefs.current.set(key, el);
                                          }
                                        }}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          // Só abre o editor se não foi um clique longo
                                          if (!isLongPressRef.current) {
                                            handleSlotClick(e, nvr.id, index);
                                          }
                                          // Reset da flag após um pequeno delay
                                          setTimeout(() => {
                                            isLongPressRef.current = false;
                                          }, 100);
                                        }}
                                      >
                                        {slot.hdSize > 0 ? `${slot.hdSize}TB` : "-"}
                                      </button>
                                      {isEditorOpen && (
                                        <SlotMenu
                                          nvrId={nvr.id}
                                          slotIndex={index}
                                          slotButtonRefs={slotButtonRefs}
                                          slotSizes={slotSizes}
                                          onSelectSize={(size) => handleSlotUpdate(nvr.id, index, size)}
                                        />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(nvr)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(nvr.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </table>
          </div>

      {/* Dialog de Edição/Criação */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>
              {editingNVR ? "Editar NVR" : "Novo NVR"}
            </DialogTitle>
            <DialogDescription>
              Preencha ou atualize as informações do equipamento NVR. Todos os campos obrigatórios estão marcados com *.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 1. Responsável */}
            <div className="space-y-2">
              <Label htmlFor="owner">
                Responsável <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.owner}
                onValueChange={(value) =>
                  setFormData({ ...formData, owner: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {OWNER_OPTIONS.sort().map((owner) => (
                    <SelectItem key={owner} value={owner}>
                      {owner}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Marina + Numeração */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marina">
                  Marina <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.marina}
                  onValueChange={(value) =>
                    setFormData({ ...formData, marina: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a marina" />
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
              <div className="space-y-2">
                <Label htmlFor="name">
                  Numeração <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    let value = e.target.value;
                    // Remove caracteres não numéricos
                    value = value.replace(/\D/g, '');
                    // Não permite apenas "0" ou "00"
                    if (value === '0' || value === '00') {
                      value = '';
                    }
                    // Se for um número de 1 dígito (1-9), adiciona zero à esquerda
                    else if (value.length === 1 && parseInt(value) >= 1 && parseInt(value) <= 9) {
                      value = `0${value}`;
                    }
                    setFormData({ ...formData, name: value });
                  }}
                  onBlur={(e) => {
                    // Ao sair do campo, garante formatação se necessário
                    let value = e.target.value.trim();
                    // Não permite apenas "0" ou "00"
                    if (value === '0' || value === '00') {
                      value = '';
                      setFormData({ ...formData, name: value });
                    }
                    else if (value && value.length === 1 && parseInt(value) >= 1 && parseInt(value) <= 9) {
                      value = `0${value}`;
                      setFormData({ ...formData, name: value });
                    }
                  }}
                  placeholder="Ex: 01, 02, 03, etc."
                />
                {formData.marina && formData.name && (
                  <p className="text-xs text-muted-foreground">
                    {nvrs.some(
                      (nvr) => nvr.marina === formData.marina && nvr.name === formData.name && (!editingNVR || nvr.id !== editingNVR.id)
                    ) ? (
                      <span className="text-red-600 dark:text-red-400">
                        ⚠️ Já existe um NVR com esta numeração nesta marina
                      </span>
                    ) : (
                      <span className="text-green-600 dark:text-green-400">
                        ✓ Numeração disponível
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* 3. Modelo */}
            <div className="space-y-2">
              <Label htmlFor="model">
                Modelo <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.model}
                onValueChange={(value) => {
                  setFormData({ ...formData, model: value });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(NVR_MODELS).sort().map((model) => (
                    <SelectItem key={model} value={model}>
                      {model} ({NVR_MODELS[model].slots} slots, máx:{" "}
                      {NVR_MODELS[model].maxCameras} câmeras)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.model && (
                <p className="text-xs text-muted-foreground">
                  Este modelo possui {NVR_MODELS[formData.model]?.slots || 0} slots e suporta até {NVR_MODELS[formData.model]?.maxCameras || 0} câmeras
                </p>
              )}
            </div>

            {/* 4. Quantidade de Câmeras */}
            <div className="space-y-2">
              <Label htmlFor="cameras">
                Quantidade de Câmeras
                {formData.model && (
                  <span className="text-muted-foreground text-xs ml-2">
                    (máx: {NVR_MODELS[formData.model]?.maxCameras || 0})
                  </span>
                )}
              </Label>
              <Input
                id="cameras"
                type="number"
                min="0"
                max={formData.model ? NVR_MODELS[formData.model]?.maxCameras : undefined}
                value={formData.cameras}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cameras: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="Número de câmeras conectadas"
              />
              {formData.model && formData.cameras > (NVR_MODELS[formData.model]?.maxCameras || 0) && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  ⚠️ O número de câmeras excede o máximo suportado por este modelo
                </p>
              )}
            </div>

            {/* 5. Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Observações adicionais sobre este NVR..."
                rows={3}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <DialogFooter>
            {editingNVR && (
              <Button
                variant="destructive"
                onClick={() => {
                  setShowDialog(false);
                  handleDelete(editingNVR.id);
                }}
                className="mr-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remover
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
              {editingNVR ? "Salvar Alterações" : "Adicionar NVR"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este NVR? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Atualizar Todos os Slots */}
      <AlertDialog open={showUpdateAllDialog} onOpenChange={setShowUpdateAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Atualizar Todos os Slots</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja marcar TODOS os slots de TODOS os NVRs
              como 'Ativo'? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowUpdateAllDialog(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateAllSlots}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
