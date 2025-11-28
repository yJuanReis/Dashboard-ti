import React, { useState, useEffect, useRef } from "react";
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
  ChevronDown,
  ChevronUp,
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

// Componente para o menu flutuante de todos os slots de um NVR
function SlotsMenu({
  nvrId,
  nvr,
  buttonRef,
  slotButtonRefs,
  slotSizes,
  onSlotClick,
  onLongPress,
  slotEditorOpen,
  onSelectSize,
}: {
  nvrId: string;
  nvr: NVR;
  buttonRef: React.RefObject<HTMLButtonElement>;
  slotButtonRefs: React.MutableRefObject<Map<string, HTMLButtonElement>>;
  slotSizes: Array<{ size: number; label: string }>;
  onSlotClick: (nvrId: string, slotIndex: number) => void;
  onLongPress: () => void;
  slotEditorOpen: { nvrId: string; slotIndex: number } | null;
  onSelectSize: (nvrId: string, slotIndex: number, size: number) => void;
}) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updatePosition = () => {
      if (buttonRef.current && menuRef.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const menuRect = menuRef.current.getBoundingClientRect();
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;

        // Posicionar à esquerda do botão por padrão
        let top = buttonRect.top + scrollY;
        let left = buttonRect.left + scrollX - menuRect.width - 8;

        // Ajustar se o menu sair da tela à esquerda - posicionar à direita
        if (left < scrollX) {
          left = buttonRect.right + scrollX + 8;
        }

        // Ajustar verticalmente se necessário - garantir que não saia da tela
        if (top + menuRect.height > window.innerHeight + scrollY) {
          top = window.innerHeight + scrollY - menuRect.height - 8;
        }

        // Garantir que não saia do topo
        if (top < scrollY) {
          top = scrollY + 8;
        }

        // Garantir valores mínimos válidos
        if (top > 0 && left >= 0) {
          setPosition({ top, left });
        } else {
          // Fallback: posicionar à esquerda do botão mesmo sem cálculo perfeito
          setPosition({ 
            top: buttonRect.top + scrollY, 
            left: buttonRect.left + scrollX - 300 // largura aproximada do menu
          });
        }
      }
    };

    // Pequeno delay para garantir que o DOM está atualizado
    const timer = setTimeout(updatePosition, 0);
    
    // Atualizar posição ao scrollar ou redimensionar
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [buttonRef, nvrId]);

  return (
    <div
      ref={menuRef}
      className="slots-menu fixed z-[100] w-auto p-3 bg-popover border rounded-md shadow-lg max-h-[80vh] overflow-y-auto min-w-[280px] custom-scrollbar"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col gap-2">
        <div className="text-xs font-semibold text-muted-foreground mb-1 text-center">
          Slots - {nvr.marina} / {nvr.name}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {nvr.slots.map((slot, index) => {
            const isEditorOpen = slotEditorOpen?.nvrId === nvrId && slotEditorOpen?.slotIndex === index;
            return (
              <div key={index} className="flex flex-col items-center gap-1">
                <div className="text-[10px] text-muted-foreground">#{index + 1}</div>
                <div className="relative">
                  <button
                    className={`w-11 h-11 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md border-2 transition-all cursor-pointer hover:scale-105 ${
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
                    }`}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      const timer = setTimeout(() => {
                        onLongPress();
                      }, 1000);
                      (e.currentTarget as any).longPressTimer = timer;
                    }}
                    onMouseUp={(e) => {
                      e.stopPropagation();
                      const timer = (e.currentTarget as any).longPressTimer;
                      if (timer) {
                        clearTimeout(timer);
                        (e.currentTarget as any).longPressTimer = null;
                      }
                    }}
                    onMouseLeave={(e) => {
                      const timer = (e.currentTarget as any).longPressTimer;
                      if (timer) {
                        clearTimeout(timer);
                        (e.currentTarget as any).longPressTimer = null;
                      }
                    }}
                    ref={(el) => {
                      if (el) {
                        const key = `${nvrId}-${index}`;
                        slotButtonRefs.current.set(key, el);
                      }
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const timer = (e.currentTarget as any).longPressTimer;
                      if (!timer) {
                        onSlotClick(nvrId, index);
                      }
                    }}
                  >
                    {slot.hdSize > 0 ? `${slot.hdSize}TB` : "-"}
                  </button>
                  {isEditorOpen && (
                    <SlotMenu
                      nvrId={nvrId}
                      slotIndex={index}
                      slotButtonRefs={slotButtonRefs}
                      slotSizes={slotSizes}
                      onSelectSize={(size) => onSelectSize(nvrId, index, size)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
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
  const ownerTabRefs = useRef<Map<string, HTMLLabelElement>>(new Map());
  const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set());
  const slotsMenuButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

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

  // Integração com campo de busca e filtros do header
  useEffect(() => {
    const handleSearchFromHeader = (event: Event) => {
      const custom = event as CustomEvent<string>;
      const value = typeof custom.detail === "string" ? custom.detail : "";
      setSearchTerm(value);
    };

    const handleMarinaFilterFromHeader = (event: Event) => {
      const custom = event as CustomEvent<string>;
      const value = typeof custom.detail === "string" ? custom.detail : "";
      setMarinaFilter(value);
    };

    const handleOwnerFilterFromHeader = (event: Event) => {
      const custom = event as CustomEvent<string>;
      const value = typeof custom.detail === "string" ? custom.detail : "";
      setOwnerFilter(value);
    };

    const handleModelFilterFromHeader = (event: Event) => {
      const custom = event as CustomEvent<string>;
      const value = typeof custom.detail === "string" ? custom.detail : "";
      setModelFilter(value);
    };

    const handleClearFilters = () => {
      setSearchTerm("");
      setMarinaFilter("");
      setOwnerFilter("");
      setModelFilter("");
    };

    const handleOpenDialogFromHeader = () => {
      setEditingNVR(null);
      setFormData({
        marina: "",
        name: "",
        model: "",
        owner: "",
        cameras: 0,
        notes: "",
      });
      setShowDialog(true);
    };

    window.addEventListener("nvr:setSearch", handleSearchFromHeader);
    window.addEventListener("nvr:setMarinaFilter", handleMarinaFilterFromHeader);
    window.addEventListener("nvr:setOwnerFilter", handleOwnerFilterFromHeader);
    window.addEventListener("nvr:setModelFilter", handleModelFilterFromHeader);
    window.addEventListener("nvr:clearFilters", handleClearFilters);
    window.addEventListener("nvr:openDialog", handleOpenDialogFromHeader);
    
    return () => {
      window.removeEventListener("nvr:setSearch", handleSearchFromHeader);
      window.removeEventListener("nvr:setMarinaFilter", handleMarinaFilterFromHeader);
      window.removeEventListener("nvr:setOwnerFilter", handleOwnerFilterFromHeader);
      window.removeEventListener("nvr:setModelFilter", handleModelFilterFromHeader);
      window.removeEventListener("nvr:clearFilters", handleClearFilters);
      window.removeEventListener("nvr:openDialog", handleOpenDialogFromHeader);
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
      
      // Fechar menu de slot editor se clicar fora
      if (slotEditorOpen) {
        const menuElement = document.querySelector('.slot-editor-menu');
        const buttonKey = `${slotEditorOpen.nvrId}-${slotEditorOpen.slotIndex}`;
        const buttonElement = slotButtonRefs.current.get(buttonKey);
        
        // Verificar se o clique foi fora do menu e fora do botão que abriu o menu
        const clickedOnMenu = menuElement && (menuElement.contains(target) || menuElement === target);
        const clickedOnButton = buttonElement && (buttonElement.contains(target) || buttonElement === target);
        
        // Também verificar se é um botão de slot (pode ter classes diferentes)
        const clickedOnAnySlotButton = target.closest('button') && 
          (target.closest('button')?.classList.contains('w-11') || 
           target.closest('button')?.className.includes('w-11'));
        
        if (!clickedOnMenu && !clickedOnButton && !clickedOnAnySlotButton) {
          setSlotEditorOpen(null);
        }
      }
      
      // Fechar menu de slots se clicar fora
      if (expandedSlots.size > 0) {
        const slotsMenuElement = document.querySelector('.slots-menu');
        const clickedOnSlotsMenu = slotsMenuElement && (slotsMenuElement.contains(target) || slotsMenuElement === target);
        const clickedOnSlotsButton = target.closest('button[class*="bg-primary"]') || 
                                     target.closest('button[class*="hover:bg-primary"]');
        
        if (!clickedOnSlotsMenu && !clickedOnSlotsButton) {
          setExpandedSlots(new Set());
        }
      }
    };

    if (slotEditorOpen || expandedSlots.size > 0) {
      // Usar capture phase para garantir que o evento seja capturado antes de outros handlers
      document.addEventListener('mousedown', handleClickOutside, true);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside, true);
      };
    }
  }, [slotEditorOpen, expandedSlots]);

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
      {/* Faixa superior - apenas mobile */}
      {isMobile && (
        <div className="flex-shrink-0 border-b border-border bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-0.5 bg-background/95 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-1.5 md:gap-2" />
        </div>
      )}

      {/* Filtros Fixos - Compactos - Ocultos em mobile */}
      {!isMobile && (
        <div className="flex-shrink-0 border-b border-border bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-3 md:px-4 py-2 bg-background/95 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <nav className="flex flex-wrap gap-x-2 gap-y-2 items-center" aria-label="Marinas">
                <button
                onClick={() => {
                  setMarinaFilter("");
                  const event = new CustomEvent("nvr:setMarinaFilter", { detail: "" });
                  window.dispatchEvent(event);
                }}
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
                    onClick={() => {
                      setMarinaFilter(marina);
                      const event = new CustomEvent("nvr:setMarinaFilter", { detail: marina });
                      window.dispatchEvent(event);
                    }}
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
                  id="nvr-owner-all"
                  name="nvr-owner-tabs"
                  className="hidden"
                  checked={ownerFilter === ""}
                  onChange={() => {
                    setOwnerFilter("");
                    const event = new CustomEvent("nvr:setOwnerFilter", { detail: "" });
                    window.dispatchEvent(event);
                  }}
                />
                <label
                  ref={(el) => {
                    if (el) ownerTabRefs.current.set("Todos", el);
                  }}
                  htmlFor="nvr-owner-all"
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
                      id={`nvr-owner-${index}`}
                      name="nvr-owner-tabs"
                      className="hidden"
                      checked={ownerFilter === owner}
                      onChange={() => {
                        setOwnerFilter(owner);
                        const event = new CustomEvent("nvr:setOwnerFilter", { detail: owner });
                        window.dispatchEvent(event);
                      }}
                    />
                    <label
                      ref={(el) => {
                        if (el) ownerTabRefs.current.set(owner, el);
                      }}
                      htmlFor={`nvr-owner-${index}`}
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
          </div>
        </div>
      )}

      {/* Legenda Fixa - Oculta em todos os modos mobile para ganhar espaço */}
      {!isMobile && (
        <div className="flex-shrink-0 border-b bg-background px-2 md:px-4 py-1 md:py-2">
          <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-3">
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
      <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 w-full custom-scrollbar">
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
                        {/* Desktop: botão para abrir menu flutuante de slots */}
                        {!isMobile && (
                          <div className="flex flex-col items-center gap-2">
                            <button
                              ref={(el) => {
                                if (el) {
                                  slotsMenuButtonRefs.current.set(nvr.id, el);
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (expandedSlots.has(nvr.id)) {
                                  setExpandedSlots(new Set());
                                } else {
                                  // Fechar todos os outros e abrir apenas este
                                  setExpandedSlots(new Set([nvr.id]));
                                }
                              }}
                              className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors text-xs md:text-sm font-medium"
                              title="Ver slots"
                            >
                              {expandedSlots.has(nvr.id) ? (
                                <>
                                  <ChevronUp className="w-4 h-4" />
                                  <span>Slots</span>
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4" />
                                  <span>Slots ({nvr.slots.length})</span>
                                </>
                              )}
                            </button>
                            {expandedSlots.has(nvr.id) && slotsMenuButtonRefs.current.get(nvr.id) && (
                              <SlotsMenu
                                nvrId={nvr.id}
                                nvr={nvr}
                                buttonRef={{ current: slotsMenuButtonRefs.current.get(nvr.id) || null }}
                                slotButtonRefs={slotButtonRefs}
                                slotSizes={slotSizes}
                                onSlotClick={(nvrId, slotIndex) => {
                                  handleSlotClick({ preventDefault: () => {}, stopPropagation: () => {} } as any, nvrId, slotIndex);
                                }}
                                onLongPress={() => {
                                  setShowUpdateAllDialog(true);
                                  setExpandedSlots(new Set());
                                }}
                                slotEditorOpen={slotEditorOpen}
                                onSelectSize={(nvrId, slotIndex, size) => handleSlotUpdate(nvrId, slotIndex, size)}
                              />
                            )}
                          </div>
                        )}

                        {/* Mobile: botão para abrir menu flutuante de slots */}
                        {isMobile && (
                          <div className="flex flex-col items-center gap-2">
                            <button
                              ref={(el) => {
                                if (el) {
                                  slotsMenuButtonRefs.current.set(nvr.id, el);
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (expandedSlots.has(nvr.id)) {
                                  setExpandedSlots(new Set());
                                } else {
                                  // Fechar todos os outros e abrir apenas este
                                  setExpandedSlots(new Set([nvr.id]));
                                }
                              }}
                              className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors text-xs font-medium"
                              title="Ver slots"
                            >
                              {expandedSlots.has(nvr.id) ? (
                                <>
                                  <ChevronUp className="w-4 h-4" />
                                  <span>Slots</span>
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4" />
                                  <span>Slots ({nvr.slots.length})</span>
                                </>
                              )}
                            </button>
                            {expandedSlots.has(nvr.id) && slotsMenuButtonRefs.current.get(nvr.id) && (
                              <SlotsMenu
                                nvrId={nvr.id}
                                nvr={nvr}
                                buttonRef={{ current: slotsMenuButtonRefs.current.get(nvr.id) || null }}
                                slotButtonRefs={slotButtonRefs}
                                slotSizes={slotSizes}
                                onSlotClick={(nvrId, slotIndex) => {
                                  handleSlotClick({ preventDefault: () => {}, stopPropagation: () => {} } as any, nvrId, slotIndex);
                                }}
                                onLongPress={() => {
                                  setShowUpdateAllDialog(true);
                                  setExpandedSlots(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(nvr.id);
                                    return newSet;
                                  });
                                }}
                                slotEditorOpen={slotEditorOpen}
                                onSelectSize={(nvrId, slotIndex, size) => handleSlotUpdate(nvrId, slotIndex, size)}
                              />
                            )}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full custom-scrollbar">
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
