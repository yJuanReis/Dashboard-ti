import { useState, useEffect, useMemo, useRef } from "react";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  ShoppingCart,
  Wrench,
  Loader2,
  DollarSign,
  Package,
  ChevronDown,
  Calendar as CalendarIcon,
  Check,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  fetchServicosProdutos,
  createServico,
  createProduto,
  updateServico,
  updateProduto,
  type ServicoProduto,
} from "@/lib/servicosProdutosService";
import {
  fetchConfigSolicitacoes,
  fetchServicosUnicos,
  fetchConfigByServico,
  type ConfigSolicitacao,
} from "@/lib/configSolicitacoesService";
import { useSidebar } from "@/components/ui/sidebar";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";


type SortField =
  | "tipo"
  | "ano"
  | "empresa"
  | "valor"
  | "data_solicitacao"
  | "data_sc"
  | "vencimento"
  | "servico"
  | "produto"
  | "fornecedor"
  | "situacao";
type SortDirection = "asc" | "desc";

export default function Solicitacoes() {
  const { isMobile } = useSidebar();
  const [items, setItems] = useState<ServicoProduto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [servicoFilter, setServicoFilter] = useState<string>("todos");
  const [anoFilter, setAnoFilter] = useState<string>("todos");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [activeTipoTab, setActiveTipoTab] = useState<"servico" | "produto">("servico");
  const [showDuplicados, setShowDuplicados] = useState(false);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Partial<ServicoProduto>>({});
  const [displayedCount, setDisplayedCount] = useState(100);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createTipo, setCreateTipo] = useState<"servico" | "produto" | null>(null);
  const [createFormData, setCreateFormData] = useState<any>({});
  const [configSolicitacoes, setConfigSolicitacoes] = useState<ConfigSolicitacao[]>([]);
  const [servicosUnicosConfig, setServicosUnicosConfig] = useState<string[]>([]);
  const [configsFiltradas, setConfigsFiltradas] = useState<ConfigSolicitacao[]>([]);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Função para converter data brasileira (dd/mm/yyyy) para Date
  const parseDateBR = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Mês é 0-indexed
      let year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    return undefined;
  };

  // Função para converter Date para formato brasileiro (dd/mm/yyyy)
  const formatDateBR = (date: Date | undefined): string => {
    if (!date || isNaN(date.getTime())) return "";
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  // Função para validar e formatar entrada de data manual
  const handleDateInput = (value: string): string => {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, "");
    
    // Formata automaticamente: dd/mm/yyyy
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
  };

  // Função para formatar valor como moeda
  const formatCurrency = (value: string | number | undefined): string => {
    if (!value) return "";
    // Remove formatação existente
    const cleaned = String(value).replace(/[^\d,.-]/g, "").replace(",", ".");
    const numValue = parseFloat(cleaned);
    if (isNaN(numValue)) return "";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numValue);
  };

  // Função para processar entrada de moeda (mantém formato durante digitação)
  const handleCurrencyInput = (value: string): string => {
    if (!value) return "";
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, "");
    if (!numbers) return "";
    
    // Converte para número e formata
    const numValue = parseFloat(numbers) / 100; // Divide por 100 para considerar centavos
    if (isNaN(numValue)) return "";
    
    // Formata como moeda brasileira
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numValue);
  };

  // Função para converter moeda formatada para string simples (para salvar no banco)
  const currencyToString = (value: string): string => {
    if (!value) return "";
    // Remove R$, espaços e pontos de milhar, mantém vírgula decimal
    const cleaned = value.replace(/[R$\s.]/g, "").replace(",", ".");
    const numValue = parseFloat(cleaned);
    if (isNaN(numValue)) return "";
    // Retorna como string com vírgula (formato brasileiro)
    return numValue.toFixed(2).replace(".", ",");
  };


  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await fetchServicosProdutos();
      setItems(data);
    } catch (error) {
      logger.error("Erro ao carregar serviços e produtos:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados
  useEffect(() => {
    loadItems();
    loadConfigSolicitacoes();
  }, []);

  // Carregar configurações de solicitações
  const loadConfigSolicitacoes = async () => {
    try {
      const configs = await fetchConfigSolicitacoes();
      setConfigSolicitacoes(configs);
      
      const servicos = await fetchServicosUnicos();
      setServicosUnicosConfig(servicos);
    } catch (error) {
      logger.error("Erro ao carregar configurações de solicitações:", error);
    }
  };

  // Filtrar configurações quando o serviço mudar
  useEffect(() => {
    if (createFormData.servico) {
      const filtradas = configSolicitacoes.filter(
        (config) => config.servico === createFormData.servico
      );
      setConfigsFiltradas(filtradas);
      
      // Se houver apenas uma opção, preencher automaticamente
      if (filtradas.length === 1) {
        setCreateFormData({
          ...createFormData,
          descricao: filtradas[0].descricao,
          empresa: filtradas[0].empresa,
        });
      } else if (filtradas.length > 1 && !createFormData.descricao && !createFormData.empresa) {
        // Se houver múltiplas opções, limpar descrição e empresa para o usuário escolher
        setCreateFormData({
          ...createFormData,
          descricao: "",
          empresa: "",
        });
      }
    } else {
      setConfigsFiltradas([]);
    }
  }, [createFormData.servico]);

  // Obter serviços únicos para filtro (apenas para tipo servico)
  const servicosUnicos = useMemo(() => {
    if (activeTipoTab === "servico") {
      return Array.from(new Set(items.filter((i) => i.tipo === "servico").map((i) => i.servico).filter(Boolean))).sort();
    }
    return [];
  }, [items, activeTipoTab]);
  
  // Obter anos únicos baseado no tipo ativo
  const anosDisponiveis = useMemo(() => 
    Array.from(
      new Set(
        items
          .filter((i) => i.tipo === activeTipoTab)
          .map((i) => i.ano)
          .filter(Boolean)
      )
    ).sort((a, b) => (b || 0) - (a || 0)),
    [items, activeTipoTab]
  );

  // Integração com busca e filtros do header
  useEffect(() => {
    const handleSearchFromHeader = (event: Event) => {
      const custom = event as CustomEvent<string>;
      const value = typeof custom.detail === "string" ? custom.detail : "";
      setSearchTerm(value);
    };

    const handleServicoFilterFromHeader = (event: Event) => {
      const custom = event as CustomEvent<string>;
      const value = typeof custom.detail === "string" ? custom.detail : "todos";
      setServicoFilter(value);
    };

    const handleAnoFilterFromHeader = (event: Event) => {
      const custom = event as CustomEvent<string>;
      const value = typeof custom.detail === "string" ? custom.detail : "todos";
      setAnoFilter(value);
    };

    const handleToggleDuplicados = (event: Event) => {
      const custom = event as CustomEvent<boolean>;
      const value = typeof custom.detail === "boolean" ? custom.detail : false;
      setShowDuplicados(value);
    };

    const handleOpenCreateDialog = (event?: Event) => {
      console.log("🟢 [DIALOG] Abrindo dialog de criação...");
      setCreateTipo(null);
      setCreateFormData({});
      setConfigsFiltradas([]);
      setShowCreateDialog(true);
      console.log("🟢 [DIALOG] Dialog aberto");
    };

    const handleClearFilters = () => {
      setSearchTerm("");
      setServicoFilter("todos");
      setAnoFilter("todos");
    };

    // Enviar opções de serviço e ano para o Layout
    const sendOptionsToLayout = () => {
      const servicosEvent = new CustomEvent("solicitacoes:setServicoOptions", { 
        detail: servicosUnicos
      });
      window.dispatchEvent(servicosEvent);
      
      const anosEvent = new CustomEvent("solicitacoes:setAnoOptions", { 
        detail: anosDisponiveis.map(a => a?.toString() || "").filter(Boolean)
      });
      window.dispatchEvent(anosEvent);
    };

    window.addEventListener("solicitacoes:setSearch", handleSearchFromHeader);
    window.addEventListener("solicitacoes:setServicoFilter", handleServicoFilterFromHeader);
    window.addEventListener("solicitacoes:setAnoFilter", handleAnoFilterFromHeader);
    window.addEventListener("solicitacoes:toggleDuplicados", handleToggleDuplicados);
    window.addEventListener("solicitacoes:openCreateDialog", handleOpenCreateDialog);
    window.addEventListener("solicitacoes:clearFilters", handleClearFilters);

    // Enviar opções quando os dados mudarem
    if (items.length > 0) {
      sendOptionsToLayout();
    }

    return () => {
      window.removeEventListener("solicitacoes:setSearch", handleSearchFromHeader);
      window.removeEventListener("solicitacoes:setServicoFilter", handleServicoFilterFromHeader);
      window.removeEventListener("solicitacoes:setAnoFilter", handleAnoFilterFromHeader);
      window.removeEventListener("solicitacoes:toggleDuplicados", handleToggleDuplicados);
      window.removeEventListener("solicitacoes:openCreateDialog", handleOpenCreateDialog);
      window.removeEventListener("solicitacoes:clearFilters", handleClearFilters);
    };
  }, [items, servicosUnicos, anosDisponiveis]);

  // Selecionar automaticamente o ano mais recente quando mudar o tipo ou quando carregar os dados
  useEffect(() => {
    if (!loading && items.length > 0 && anoFilter === "todos") {
      const anosDoTipo = Array.from(
        new Set(
          items
            .filter((i) => i.tipo === activeTipoTab)
            .map((i) => i.ano)
            .filter(Boolean)
        )
      ).sort((a, b) => (b || 0) - (a || 0));
      
      if (anosDoTipo.length > 0) {
        const anoMaisRecente = anosDoTipo[0]?.toString();
        if (anoMaisRecente) {
          setAnoFilter(anoMaisRecente);
          const event = new CustomEvent("solicitacoes:setAnoFilter", { detail: anoMaisRecente });
          window.dispatchEvent(event);
        }
      }
    }
  }, [activeTipoTab, loading, items.length]);

  // Filtrar e ordenar
  const filteredAndSortedItems = [...items]
    .filter((item) => {
      // Filtro por tipo (aba principal)
      const matchesTipo = item.tipo === activeTipoTab;
      
      // Filtro por ano (do header)
      const matchesAno = anoFilter === "todos" || item.ano?.toString() === anoFilter;
      
      // Busca textual
      const matchesSearch =
        !searchTerm ||
        `${item.servico || ""} ${item.produto || ""} ${item.descricao || ""} ${item.informacoes || ""} ${item.empresa || ""} ${item.sc || ""} ${item.situacao || ""} ${item.nota_fiscal || ""} ${item.oc || ""} ${item.fornecedor || ""}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      
      // Filtro por serviço (apenas para tipo servico)
      const matchesServico = activeTipoTab === "produto" || servicoFilter === "todos" || item.servico === servicoFilter;
      
      return matchesTipo && matchesAno && matchesSearch && matchesServico;
    })
    .sort((a, b) => {
      // Se não houver ordenação manual, ordenar por created_at (mais recente primeiro)
      if (!sortField) {
        // Priorizar created_at se disponível
        if (a.created_at && b.created_at) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (a.created_at) return -1; // a tem created_at, b não - a vem primeiro
        if (b.created_at) return 1;  // b tem created_at, a não - b vem primeiro
        
        // Fallback: usar data de solicitação
        const dataA = a.data_solicitacao || a.data_sc || "";
        const dataB = b.data_solicitacao || b.data_sc || "";
        
        // Função auxiliar para converter data brasileira (dd/mm/yyyy) para timestamp
        const parseDate = (dateStr: string): number => {
          if (!dateStr) return 0;
          
          // Tentar formato brasileiro dd/mm/yyyy ou dd/mm/yy
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Mês é 0-indexed
            let year = parseInt(parts[2], 10);
            
            // Se o ano tem 2 dígitos, assumir 2000+
            if (year < 100) {
              year += 2000;
            }
            
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) {
              return date.getTime();
            }
          }
          
          // Tentar formato ISO (yyyy-mm-dd)
          const isoDate = new Date(dateStr);
          if (!isNaN(isoDate.getTime())) {
            return isoDate.getTime();
          }
          
          // Se não conseguir parsear, retornar 0 (será ordenado por último)
          return 0;
        };
        
        const timestampA = parseDate(dataA);
        const timestampB = parseDate(dataB);
        
        // Ordenar do mais recente para o mais antigo (desc)
        return timestampB - timestampA;
      }

      let fieldA: any = a[sortField];
      let fieldB: any = b[sortField];

      if (sortField === "ano" || sortField === "valor") {
        fieldA = fieldA || 0;
        fieldB = fieldB || 0;
        const numA = typeof fieldA === "string" ? parseFloat(fieldA.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0 : fieldA;
        const numB = typeof fieldB === "string" ? parseFloat(fieldB.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0 : fieldB;
        return sortDirection === "asc" ? numA - numB : numB - numA;
      }

      if (sortField === "data_solicitacao" || sortField === "data_sc" || sortField === "vencimento") {
        fieldA = fieldA || "";
        fieldB = fieldB || "";
        const compare = String(fieldA).localeCompare(String(fieldB), "pt-BR");
        return sortDirection === "asc" ? compare : -compare;
      }

      // Para campos específicos de serviço/produto
      if (sortField === "servico" || sortField === "produto") {
        fieldA = sortField === "servico" ? (a.servico || "") : (a.produto || "");
        fieldB = sortField === "servico" ? (b.servico || "") : (b.produto || "");
      } else if (sortField === "fornecedor") {
        fieldA = a.fornecedor || "";
        fieldB = b.fornecedor || "";
      } else {
        fieldA = fieldA || "";
        fieldB = fieldB || "";
      }

      const compare = String(fieldA).localeCompare(String(fieldB), "pt-BR", {
        numeric: true,
      });
      return sortDirection === "asc" ? compare : -compare;
    });

  // Calcular estatísticas
  const stats = {
    total: items.length,
    servicos: items.filter((i) => i.tipo === "servico").length,
    produtos: items.filter((i) => i.tipo === "produto").length,
    valorTotal: items
      .filter((i) => i.valor)
      .reduce((sum, i) => {
        const valorStr = i.valor?.replace(/[^\d,.-]/g, "").replace(",", ".") || "0";
        return sum + (parseFloat(valorStr) || 0);
      }, 0),
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleDoubleClick = (item: ServicoProduto) => {
    setEditingRow(item.id);
    setEditingValues({
      ...item,
    });
  };

  const handleCancelEdit = () => {
    // Limpar timeout de blur se existir
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setIsSelectOpen(false);
    setEditingRow(null);
    setEditingValues({});
  };

  // Função para converter campos de texto para maiúsculas
  const convertTextFieldsToUpperCase = (data: any): any => {
    const fieldsToUpperCase = [
      'servico',
      'descricao',
      'empresa',
      'sc',
      'nota_fiscal',
      'oc',
      'situacao',
      'fornecedor',
      'produto',
      'informacoes'
    ];
    
    const converted = { ...data };
    
    fieldsToUpperCase.forEach(field => {
      if (converted[field] && typeof converted[field] === 'string') {
        converted[field] = converted[field].toUpperCase();
      }
    });
    
    return converted;
  };

  const handleSaveEdit = async (skipReload = false) => {
    if (!editingRow) return;

    const item = items.find(i => i.id === editingRow);
    if (!item) return;

    try {
      // Extrair o ID real do banco do ID composto
      // Formato do ID: "servico_{dbId}_{ano}_{data}" ou "produto_{dbId}_{ano}_{data}"
      let dbId = (item as any)._dbId;
      
      if (!dbId && item.id) {
        // Tentar extrair do ID composto
        const match = item.id.match(/^(servico|produto)_(\d+)_/);
        if (match) {
          dbId = match[2];
        }
      }
      
      if (!dbId) {
        toast.error("Não foi possível identificar o ID do item");
        return;
      }
      
      // Preparar updates removendo campos que não devem ser atualizados
      const updates: any = { ...editingValues };
      delete updates.id;
      delete updates.tipo;
      delete updates._dbId;

      // Converter valor formatado para string simples antes de salvar
      if (updates.valor) {
        updates.valor = currencyToString(updates.valor as string);
      }

      // Converter campos de texto para maiúsculas
      const normalizedUpdates = convertTextFieldsToUpperCase(updates);

      if (item.tipo === "servico") {
        await updateServico(dbId, normalizedUpdates);
      } else {
        await updateProduto(dbId, normalizedUpdates);
      }

      // Atualizar o item na lista local
      setItems((prevItems) =>
        prevItems.map((i) =>
          i.id === item.id ? { ...i, ...normalizedUpdates } : i
        )
      );

      toast.success("Item atualizado com sucesso!");
      handleCancelEdit();
      
      if (!skipReload) {
        // Recarregar dados para garantir sincronização
        await loadItems();
      }
    } catch (error) {
      logger.error("Erro ao atualizar item:", error);
      toast.error("Erro ao atualizar item");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveEdit(true);
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  // Handler para blur - não salva mais automaticamente, apenas valida se está em outro campo
  const handleBlur = (e: React.FocusEvent) => {
    // Limpar timeout anterior se existir
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    
    // Não fazer nada no blur - o usuário deve usar o botão flutuante para salvar
    // Apenas manter a edição ativa se o foco estiver em outro campo da mesma linha
  };

  const handleFieldChange = (field: string, value: string) => {
    setEditingValues((prev) => ({
      ...prev,
      [field]: value || undefined,
    }));
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

  // Função auxiliar para extrair apenas números de uma string
  const extractNumbers = (value: string): string => {
    return value.replace(/\D/g, '');
  };

  // Função para verificar se uma SC já existe
  const scExists = (sc: string): boolean => {
    if (!sc) return false;
    const normalizedSC = extractNumbers(sc);
    if (!normalizedSC) return false;
    
    return items.some((item) => {
      if (!item.sc) return false;
      const itemNormalized = extractNumbers(item.sc);
      return itemNormalized === normalizedSC;
    });
  };

  // Detectar duplicatas em SC e OC (apenas números, ignorando símbolos)
  const getDuplicates = useMemo(() => {
    // Mapear valor original -> valor numérico normalizado
    const scOriginalToNormalized = new Map<string, string>();
    const ocOriginalToNormalized = new Map<string, string>();
    
    // Contadores baseados em valores numéricos normalizados
    const scCounts = new Map<string, number>();
    const ocCounts = new Map<string, number>();

    items.forEach((item) => {
      if (item.sc) {
        const normalized = extractNumbers(item.sc);
        if (normalized) {
          scOriginalToNormalized.set(item.sc, normalized);
          scCounts.set(normalized, (scCounts.get(normalized) || 0) + 1);
        }
      }
      if (item.oc) {
        const normalized = extractNumbers(item.oc);
        if (normalized) {
          ocOriginalToNormalized.set(item.oc, normalized);
          ocCounts.set(normalized, (ocCounts.get(normalized) || 0) + 1);
        }
      }
    });

    // Identificar valores numéricos duplicados
    const duplicateNormalizedSCs = new Set<string>();
    const duplicateNormalizedOCs = new Set<string>();

    scCounts.forEach((count, normalized) => {
      if (count > 1) duplicateNormalizedSCs.add(normalized);
    });
    ocCounts.forEach((count, normalized) => {
      if (count > 1) duplicateNormalizedOCs.add(normalized);
    });

    // Criar sets com valores originais que correspondem aos normalizados duplicados
    const duplicateSCs = new Set<string>();
    const duplicateOCs = new Set<string>();

    scOriginalToNormalized.forEach((normalized, original) => {
      if (duplicateNormalizedSCs.has(normalized)) {
        duplicateSCs.add(original);
      }
    });
    ocOriginalToNormalized.forEach((normalized, original) => {
      if (duplicateNormalizedOCs.has(normalized)) {
        duplicateOCs.add(original);
      }
    });

    return { duplicateSCs, duplicateOCs, duplicateNormalizedSCs, duplicateNormalizedOCs };
  }, [items]);

  // Filtrar apenas itens com duplicatas quando showDuplicados estiver ativo
  // E agrupar itens com o mesmo valor duplicado lado a lado
  const itemsParaExibir = useMemo(() => {
    let filtered = filteredAndSortedItems;
    
    if (showDuplicados) {
      // Filtrar apenas itens com duplicatas
      const itemsComDuplicatas = filteredAndSortedItems.filter((item) => {
        if (item.sc) {
          const normalized = extractNumbers(item.sc);
          if (normalized && getDuplicates.duplicateNormalizedSCs.has(normalized)) {
            return true;
          }
        }
        if (item.oc) {
          const normalized = extractNumbers(item.oc);
          if (normalized && getDuplicates.duplicateNormalizedOCs.has(normalized)) {
            return true;
          }
        }
        return false;
      });

      // Agrupar itens duplicados para exibir lado a lado
      const grouped: ServicoProduto[] = [];
      const processed = new Set<string>();

      // Primeiro, agrupar por SC duplicado
      itemsComDuplicatas.forEach((item) => {
        if (processed.has(item.id)) return;

        if (item.sc) {
          const normalizedSC = extractNumbers(item.sc);
          if (normalizedSC && getDuplicates.duplicateNormalizedSCs.has(normalizedSC)) {
            // Encontrar todos os itens com o mesmo SC normalizado
            const duplicates = itemsComDuplicatas.filter((other) => {
              if (processed.has(other.id)) return false;
              const otherNormalized = extractNumbers(other.sc || "");
              return otherNormalized === normalizedSC;
            });
            
            // Adicionar todos os duplicados do grupo
            duplicates.forEach((dup) => {
              grouped.push(dup);
              processed.add(dup.id);
            });
          }
        }
      });

      // Depois, agrupar por OC duplicado (apenas os que ainda não foram processados)
      itemsComDuplicatas.forEach((item) => {
        if (processed.has(item.id)) return;

        if (item.oc) {
          const normalizedOC = extractNumbers(item.oc);
          if (normalizedOC && getDuplicates.duplicateNormalizedOCs.has(normalizedOC)) {
            // Encontrar todos os itens com o mesmo OC normalizado
            const duplicates = itemsComDuplicatas.filter((other) => {
              if (processed.has(other.id)) return false;
              const otherNormalized = extractNumbers(other.oc || "");
              return otherNormalized === normalizedOC;
            });
            
            // Adicionar todos os duplicados do grupo
            duplicates.forEach((dup) => {
              grouped.push(dup);
              processed.add(dup.id);
            });
          }
        }
      });

      filtered = grouped;
    }
    
    return filtered.slice(0, displayedCount);
  }, [filteredAndSortedItems, showDuplicados, getDuplicates, displayedCount]);

  // Resetar contador quando filtros mudarem
  useEffect(() => {
    setDisplayedCount(100);
  }, [activeTipoTab, anoFilter, servicoFilter, searchTerm, showDuplicados]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 p-3 md:p-4 pb-2 md:pb-2">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total</p>
                <p className="text-lg md:text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Serviços</p>
                <p className="text-lg md:text-2xl font-bold text-blue-600">{stats.servicos}</p>
              </div>
              <Wrench className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Produtos</p>
                <p className="text-lg md:text-2xl font-bold text-purple-600">{stats.produtos}</p>
              </div>
              <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Valor Total</p>
                <p className="text-lg md:text-2xl font-bold">
                  {stats.valorTotal.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
              </div>
              <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abas de Tipo (Serviços/Produtos) */}
      <div className="px-3 md:px-4 pb-2">
        <div className="flex gap-2 border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTipoTab("servico")}
            className={cn(
              "px-4 py-2 border-b-2 font-semibold text-sm flex items-center gap-2 transition-all",
              activeTipoTab === "servico"
                ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Wrench className="w-4 h-4" />
            Serviços
            <Badge variant="secondary" className="ml-1">
              {items.filter((i) => i.tipo === "servico").length}
            </Badge>
          </button>
          <button
            type="button"
            onClick={() => setActiveTipoTab("produto")}
            className={cn(
              "px-4 py-2 border-b-2 font-semibold text-sm flex items-center gap-2 transition-all",
              activeTipoTab === "produto"
                ? "border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <ShoppingCart className="w-4 h-4" />
            Produtos
            <Badge variant="secondary" className="ml-1">
              {items.filter((i) => i.tipo === "produto").length}
            </Badge>
          </button>
        </div>
      </div>



      {/* Conteúdo - Tabela */}
      <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 w-full custom-scrollbar px-3 md:px-4 pb-3 md:pb-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        ) : itemsParaExibir.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhum item encontrado
            </p>
          </div>
        ) : (
          <Table className="w-full caption-bottom text-xs md:text-sm min-w-[1200px]">
            <TableHeader className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 shadow-sm">
              <TableRow className="bg-slate-100 dark:bg-slate-800 border-b-2">
                {activeTipoTab === "produto" ? (
                  <>
                    <TableHead className="text-center bg-slate-100 dark:bg-slate-800 min-w-[120px]">Fornecedor</TableHead>
                    <TableHead className="text-center bg-slate-100 dark:bg-slate-800 min-w-[150px]">Produto</TableHead>
                    <TableHead className="text-center bg-slate-100 dark:bg-slate-800 min-w-[200px]">Informações</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="text-center bg-slate-100 dark:bg-slate-800 min-w-[120px]">Serviço</TableHead>
                    <TableHead className="text-center bg-slate-100 dark:bg-slate-800 min-w-[250px]">Descrição</TableHead>
                  </>
                )}
                <TableHead className="text-right bg-slate-100 dark:bg-slate-800 min-w-[100px]">
                  Empresa
                </TableHead>
                <TableHead className="text-left bg-slate-100 dark:bg-slate-800 min-w-[90px]">SC</TableHead>
                <TableHead className="text-center bg-slate-100 dark:bg-slate-800 min-w-[110px]">
                  {activeTipoTab === "produto" ? "Data SC" : "Data Solicitação"}
                </TableHead>
                <TableHead className="text-center bg-slate-100 dark:bg-slate-800 min-w-[100px]">Nota Fiscal</TableHead>
                <TableHead className="text-center bg-slate-100 dark:bg-slate-800 min-w-[110px]">Vencimento</TableHead>
                <TableHead
                  className="text-center bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => handleSort("valor")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Valor
                    <SortIcon field="valor" />
                  </div>
                </TableHead>
                <TableHead className="text-center bg-slate-100 dark:bg-slate-800">OC</TableHead>
                <TableHead className="text-center bg-slate-100 dark:bg-slate-800 min-w-[120px]">Situação</TableHead>
              </TableRow>
            </TableHeader>
             <TableBody>
               {itemsParaExibir.map((item, index) => {
                 const isServico = item.tipo === "servico";
                 const isEditing = editingRow === item.id;
                 
                 // Determinar cor baseada na situação
                 const situacaoBgClass = item.situacao === "paga" 
                   ? "bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/40"
                   : item.situacao === "cancelado"
                   ? "bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/40"
                   : item.situacao === "?"
                   ? "bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/40"
                   : index % 2 === 0 ? "bg-card" : "bg-muted/30";
                 
                 return (
                   <TableRow
                     key={item.id}
                     data-row-id={item.id}
                     className={cn(
                       situacaoBgClass,
                       !item.situacao && "hover:bg-muted/50",
                       "transition-colors",
                       isEditing ? "ring-2 ring-primary cursor-default relative" : "cursor-pointer"
                     )}
                     onDoubleClick={(e) => {
                       if (!isEditing) {
                         handleDoubleClick(item);
                       }
                     }}
                     onClick={(e) => {
                       // Prevenir que clique simples interfira quando está editando
                       if (isEditing) {
                         e.stopPropagation();
                       }
                     }}
                   >
                     {activeTipoTab === "produto" ? (
                       <>
                         <TableCell className="text-center text-xs md:text-sm min-w-[120px] px-1">
                           {isEditing ? (
                             <Input
                               value={editingValues.fornecedor || ""}
                               onChange={(e) => handleFieldChange("fornecedor", e.target.value)}
                               onKeyDown={handleKeyDown}
                               onBlur={handleBlur}
                               className="h-8 text-xs md:text-sm text-center"
                               autoFocus={index === 0}
                               onClick={(e) => e.stopPropagation()}
                               onMouseDown={(e) => e.stopPropagation()}
                             />
                           ) : (
                             item.fornecedor || "-"
                           )}
                         </TableCell>
                         <TableCell className="text-center text-xs md:text-sm font-medium min-w-[150px] px-1">
                           {isEditing ? (
                             <Input
                               value={editingValues.produto || ""}
                               onChange={(e) => handleFieldChange("produto", e.target.value)}
                               onKeyDown={handleKeyDown}
                               onBlur={handleBlur}
                               className="h-8 text-xs md:text-sm text-center"
                               onClick={(e) => e.stopPropagation()}
                               onMouseDown={(e) => e.stopPropagation()}
                             />
                           ) : (
                             item.produto || "-"
                           )}
                         </TableCell>
                         <TableCell className="text-center text-xs md:text-sm min-w-[200px] px-1">
                           {isEditing ? (
                             <Input
                               value={editingValues.informacoes || ""}
                               onChange={(e) => handleFieldChange("informacoes", e.target.value)}
                               onKeyDown={handleKeyDown}
                               onBlur={handleBlur}
                               className="h-8 text-xs md:text-sm text-center"
                               onClick={(e) => e.stopPropagation()}
                               onMouseDown={(e) => e.stopPropagation()}
                             />
                           ) : (
                             item.informacoes || "-"
                           )}
                         </TableCell>
                       </>
                     ) : (
                       <>
                         <TableCell className="text-center text-xs md:text-sm font-medium min-w-[120px]">
                           {isEditing ? (
                             <Input
                               value={editingValues.servico || ""}
                               onChange={(e) => handleFieldChange("servico", e.target.value)}
                               onKeyDown={handleKeyDown}
                               onBlur={handleBlur}
                               className="h-8 text-xs md:text-sm text-center w-full"
                               autoFocus={index === 0}
                               onClick={(e) => e.stopPropagation()}
                               onMouseDown={(e) => e.stopPropagation()}
                             />
                           ) : (
                             <div className="break-words whitespace-normal text-left px-1">
                               {item.servico || "-"}
                             </div>
                           )}
                         </TableCell>
                         <TableCell className="text-center text-xs md:text-sm min-w-[250px]">
                           {isEditing ? (
                             <Input
                               value={editingValues.descricao || ""}
                               onChange={(e) => handleFieldChange("descricao", e.target.value)}
                               onKeyDown={handleKeyDown}
                               onBlur={handleBlur}
                               className="h-8 text-xs md:text-sm text-center w-full"
                               onClick={(e) => e.stopPropagation()}
                               onMouseDown={(e) => e.stopPropagation()}
                             />
                           ) : (
                             <div className="break-words whitespace-normal text-left px-1">
                               {item.descricao || "-"}
                             </div>
                           )}
                         </TableCell>
                       </>
                     )}
                     <TableCell className="text-right text-xs md:text-sm min-w-[100px] px-1">
                       {isEditing ? (
                         <Input
                           value={editingValues.empresa || ""}
                           onChange={(e) => handleFieldChange("empresa", e.target.value)}
                           onKeyDown={handleKeyDown}
                           onBlur={handleBlur}
                           className="h-8 text-xs md:text-sm text-right w-full"
                           onClick={(e) => e.stopPropagation()}
                           onMouseDown={(e) => e.stopPropagation()}
                         />
                       ) : (
                         item.empresa || "-"
                       )}
                     </TableCell>
                     <TableCell className="text-left text-xs md:text-sm font-mono min-w-[90px] px-1">
                       {isEditing ? (
                         <Input
                           value={editingValues.sc || ""}
                           onChange={(e) => handleFieldChange("sc", e.target.value)}
                           onKeyDown={handleKeyDown}
                           onBlur={handleBlur}
                           className="h-8 text-xs md:text-sm text-left font-mono w-full"
                           onClick={(e) => e.stopPropagation()}
                           onMouseDown={(e) => e.stopPropagation()}
                         />
                       ) : (
                         <span
                           className={cn(
                             item.sc && extractNumbers(item.sc) && getDuplicates.duplicateNormalizedSCs.has(extractNumbers(item.sc)) && "text-yellow-600 dark:text-yellow-400 font-bold"
                           )}
                         >
                           {item.sc || "-"}
                         </span>
                       )}
                     </TableCell>
                     <TableCell className="text-center text-xs md:text-sm min-w-[110px] px-1">
                       {isEditing ? (
                         <Input
                           value={isServico ? (editingValues.data_solicitacao || "") : (editingValues.data_sc || "")}
                           onChange={(e) => handleFieldChange(isServico ? "data_solicitacao" : "data_sc", e.target.value)}
                           onKeyDown={handleKeyDown}
                           onBlur={handleBlur}
                           className="h-8 text-xs md:text-sm text-center w-full"
                           onClick={(e) => e.stopPropagation()}
                           onMouseDown={(e) => e.stopPropagation()}
                         />
                       ) : (
                         isServico ? (item.data_solicitacao || "-") : (item.data_sc || "-")
                       )}
                     </TableCell>
                     <TableCell className="text-center text-xs md:text-sm font-mono min-w-[100px] px-1">
                       {isEditing ? (
                         <Input
                           value={editingValues.nota_fiscal || ""}
                           onChange={(e) => handleFieldChange("nota_fiscal", e.target.value)}
                           onKeyDown={handleKeyDown}
                           onBlur={handleBlur}
                           className="h-8 text-xs md:text-sm text-center font-mono"
                           onClick={(e) => e.stopPropagation()}
                           onMouseDown={(e) => e.stopPropagation()}
                         />
                       ) : (
                         item.nota_fiscal || "-"
                       )}
                     </TableCell>
                     <TableCell className="text-center text-xs md:text-sm min-w-[110px] px-1">
                       {isEditing ? (
                         <div className="flex gap-1 items-center">
                           <Input
                             value={editingValues.vencimento || ""}
                             onChange={(e) => {
                               const formatted = handleDateInput(e.target.value);
                               handleFieldChange("vencimento", formatted);
                             }}
                             onKeyDown={handleKeyDown}
                             onBlur={handleBlur}
                             placeholder="dd/mm/aaaa"
                             maxLength={10}
                             className="h-8 text-xs md:text-sm text-center flex-1"
                             onClick={(e) => e.stopPropagation()}
                             onMouseDown={(e) => e.stopPropagation()}
                           />
                           <Popover>
                             <PopoverTrigger asChild>
                               <Button
                                 type="button"
                                 variant="ghost"
                                 size="icon"
                                 className="h-8 w-8 shrink-0"
                                 onClick={(e) => e.stopPropagation()}
                                 onMouseDown={(e) => e.stopPropagation()}
                               >
                                 <CalendarIcon className="h-3 w-3" />
                               </Button>
                             </PopoverTrigger>
                             <PopoverContent className="w-auto p-0" align="end">
                               <Calendar
                                 mode="single"
                                 selected={parseDateBR(editingValues.vencimento as string || "")}
                                 onSelect={(date) => {
                                   if (date) {
                                     const formatted = formatDateBR(date);
                                     handleFieldChange("vencimento", formatted);
                                   }
                                 }}
                                 initialFocus
                                 locale={ptBR}
                               />
                             </PopoverContent>
                           </Popover>
                         </div>
                       ) : (
                         item.vencimento || "-"
                       )}
                     </TableCell>
                     <TableCell className="text-center text-xs md:text-sm font-medium min-w-[90px] px-1">
                       {isEditing ? (
                         <Input
                           value={editingValues.valor || ""}
                           onChange={(e) => {
                             const formatted = handleCurrencyInput(e.target.value);
                             handleFieldChange("valor", formatted);
                           }}
                           onKeyDown={handleKeyDown}
                           onBlur={(e) => {
                             // Garante formatação correta ao perder o foco
                             if (e.target.value) {
                               const formatted = formatCurrency(e.target.value);
                               handleFieldChange("valor", formatted);
                             }
                             handleBlur(e);
                           }}
                           placeholder="R$ 0,00"
                           className="h-8 text-xs md:text-sm text-center"
                           onClick={(e) => e.stopPropagation()}
                           onMouseDown={(e) => e.stopPropagation()}
                         />
                       ) : (
                         item.valor || "-"
                       )}
                     </TableCell>
                     <TableCell className="text-center text-xs md:text-sm font-mono min-w-[90px] px-1">
                       {isEditing ? (
                         <Input
                           value={editingValues.oc || ""}
                           onChange={(e) => handleFieldChange("oc", e.target.value)}
                           onKeyDown={handleKeyDown}
                           onBlur={handleBlur}
                           className="h-8 text-xs md:text-sm text-center font-mono"
                           onClick={(e) => e.stopPropagation()}
                           onMouseDown={(e) => e.stopPropagation()}
                         />
                       ) : (
                         <span
                           className={cn(
                             item.oc && extractNumbers(item.oc) && getDuplicates.duplicateNormalizedOCs.has(extractNumbers(item.oc)) && "text-yellow-600 dark:text-yellow-400 font-bold"
                           )}
                         >
                           {item.oc || "-"}
                         </span>
                       )}
                     </TableCell>
                     <TableCell className="text-center text-xs md:text-sm min-w-[120px] px-1">
                       {isEditing ? (
                         <Select
                           value={editingValues.situacao || "vazio"}
                           onValueChange={(value) => {
                             const situacaoValue = value === "vazio" ? "" : value;
                             handleFieldChange("situacao", situacaoValue);
                           }}
                           onOpenChange={(open) => {
                             setIsSelectOpen(open);
                           }}
                         >
                           <SelectTrigger 
                             className="h-8 text-xs md:text-sm w-full"
                             onClick={(e) => {
                               e.stopPropagation();
                               e.preventDefault();
                             }}
                             onMouseDown={(e) => {
                               e.stopPropagation();
                             }}
                           >
                             <SelectValue placeholder="Selecione..." />
                           </SelectTrigger>
                           <SelectContent 
                             onClick={(e) => e.stopPropagation()}
                             onMouseDown={(e) => e.stopPropagation()}
                           >
                             <SelectItem value="vazio">-</SelectItem>
                             <SelectItem value="paga">Paga</SelectItem>
                             <SelectItem value="?">?</SelectItem>
                             <SelectItem value="cancelado">Cancelado</SelectItem>
                           </SelectContent>
                         </Select>
                       ) : (
                         item.situacao || "-"
                       )}
                     </TableCell>
                     {/* Botão flutuante para confirmar/cancelar edição - centralizado na linha e acima */}
                     {isEditing && (
                       <div className="absolute left-1/2 -translate-x-1/2 -top-10 z-50 flex gap-2">
                         <Button
                           type="button"
                           size="sm"
                           className="h-8 w-8 p-0 rounded-full shadow-lg bg-green-500 hover:bg-green-600 text-white border-2 border-white dark:border-gray-800"
                           onClick={(e) => {
                             e.stopPropagation();
                             handleSaveEdit(true);
                           }}
                           title="Salvar alterações"
                         >
                           <Check className="h-4 w-4" />
                         </Button>
                         <Button
                           type="button"
                           size="sm"
                           className="h-8 w-8 p-0 rounded-full shadow-lg bg-red-500 hover:bg-red-600 text-white border-2 border-white dark:border-gray-800"
                           onClick={(e) => {
                             e.stopPropagation();
                             handleCancelEdit();
                           }}
                           title="Cancelar edição"
                         >
                           <X className="h-4 w-4" />
                         </Button>
                       </div>
                     )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        
        {/* Botão Carregar Mais */}
        {!loading && itemsParaExibir.length > 0 && filteredAndSortedItems.length > displayedCount && (
          <div className="flex justify-center py-4">
            <Button
              onClick={() => setDisplayedCount(prev => prev + 100)}
              variant="outline"
              className="gap-2"
            >
              Carregar Mais
              <Badge variant="secondary">
                {Math.min(100, filteredAndSortedItems.length - displayedCount)} restantes
              </Badge>
            </Button>
          </div>
        )}
      </div>

      {/* Dialog de Criação */}
      <Dialog 
        open={showCreateDialog} 
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) {
            setCreateTipo(null);
            setCreateFormData({});
            setConfigsFiltradas([]);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {!createTipo ? "Escolha o tipo" : createTipo === "servico" ? "Novo Serviço" : "Novo Produto"}
            </DialogTitle>
            <DialogDescription>
              {!createTipo 
                ? "Selecione se deseja criar um serviço ou um produto" 
                : createTipo === "servico" 
                  ? "Preencha os campos abaixo para criar um novo serviço" 
                  : "Preencha os campos abaixo para criar um novo produto"}
            </DialogDescription>
          </DialogHeader>

          {!createTipo ? (
            <div className="grid grid-cols-2 gap-4 py-4">
              <Button
                onClick={() => {
                  setCreateTipo("servico");
                  const hoje = new Date();
                  const dataFormatada = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
                  // Preencher automaticamente ano e data (não aparecem no formulário)
                  setCreateFormData({
                    ano: hoje.getFullYear(),
                    data_solicitacao: dataFormatada,
                  });
                }}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2"
              >
                <Wrench className="w-8 h-8 text-blue-500" />
                <span className="font-semibold">Serviço</span>
              </Button>
              <Button
                onClick={() => {
                  setCreateTipo("produto");
                  const hoje = new Date();
                  const dataFormatada = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
                  // Preencher automaticamente ano e data (não aparecem no formulário)
                  setCreateFormData({
                    ano: hoje.getFullYear(),
                    data_sc: dataFormatada,
                  });
                }}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2"
              >
                <ShoppingCart className="w-8 h-8 text-purple-500" />
                <span className="font-semibold">Produto</span>
              </Button>
            </div>
          ) : (
            <form
              id="create-form"
              onSubmit={(e) => {
                e.preventDefault();
                // O submit real é feito pelo botão
              }}
              className="space-y-4"
            >
              {createTipo === "servico" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="servico">
                      Serviço <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="servico"
                        value={createFormData.servico || ""}
                        onChange={(e) => {
                          const servicoValue = e.target.value;
                          setCreateFormData({ 
                            ...createFormData, 
                            servico: servicoValue,
                            // Limpar descrição e empresa se o serviço mudar
                            descricao: createFormData.servico !== servicoValue ? "" : createFormData.descricao,
                            empresa: createFormData.servico !== servicoValue ? "" : createFormData.empresa,
                          });
                        }}
                        placeholder="Digite ou selecione um serviço..."
                        required
                        className="flex-1"
                      />
                      {servicosUnicosConfig.length > 0 && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button type="button" variant="outline" size="icon" className="shrink-0">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="end">
                            <div className="max-h-[300px] overflow-y-auto">
                              {servicosUnicosConfig.map((servico) => (
                                <button
                                  key={servico}
                                  type="button"
                                  className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
                                  onClick={() => {
                                    setCreateFormData({ 
                                      ...createFormData, 
                                      servico: servico,
                                      descricao: "",
                                      empresa: "",
                                    });
                                  }}
                                >
                                  {servico}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descricao">
                      Descrição <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="descricao"
                        value={createFormData.descricao || ""}
                        onChange={(e) => setCreateFormData({ ...createFormData, descricao: e.target.value })}
                        required
                        placeholder="Digite ou selecione uma descrição..."
                        className="flex-1"
                      />
                      {configsFiltradas.length > 0 && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button type="button" variant="outline" size="icon" className="shrink-0">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0" align="end">
                            <div className="max-h-[300px] overflow-y-auto">
                              {Array.from(new Set(configsFiltradas.map((c) => c.descricao))).map((descricao) => {
                                const filtradasPorDescricao = configsFiltradas.filter(
                                  (c) => c.descricao === descricao
                                );
                                const empresasUnicas = Array.from(new Set(filtradasPorDescricao.map((c) => c.empresa)));
                                
                                return (
                                  <button
                                    key={descricao}
                                    type="button"
                                    className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
                                    onClick={() => {
                                      setCreateFormData((prev: any) => ({
                                        ...prev,
                                        descricao: descricao,
                                        empresa: empresasUnicas.length === 1 ? empresasUnicas[0] : prev.empresa,
                                      }));
                                    }}
                                  >
                                    {descricao}
                                  </button>
                                );
                              })}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="empresa">
                      Empresa <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="empresa"
                        value={createFormData.empresa || ""}
                        onChange={(e) => setCreateFormData({ ...createFormData, empresa: e.target.value })}
                        required
                        placeholder="Digite ou selecione uma empresa..."
                        className="flex-1"
                      />
                      {configsFiltradas.length > 0 && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button type="button" variant="outline" size="icon" className="shrink-0">
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="end">
                            <div className="max-h-[300px] overflow-y-auto">
                              {(() => {
                                // Filtrar empresas baseado na descrição selecionada (se houver)
                                let empresasDisponiveis = configsFiltradas;
                                if (createFormData.descricao) {
                                  empresasDisponiveis = empresasDisponiveis.filter(
                                    (c) => c.descricao === createFormData.descricao
                                  );
                                }
                                return Array.from(new Set(empresasDisponiveis.map((c) => c.empresa)));
                              })().map((empresa) => {
                                const filtradasPorEmpresa = configsFiltradas.filter(
                                  (c) => c.empresa === empresa
                                );
                                const descricoesUnicas = Array.from(new Set(filtradasPorEmpresa.map((c) => c.descricao)));
                                
                                return (
                                  <button
                                    key={empresa}
                                    type="button"
                                    className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
                                    onClick={() => {
                                      setCreateFormData((prev: any) => ({
                                        ...prev,
                                        empresa: empresa,
                                        descricao: descricoesUnicas.length === 1 ? descricoesUnicas[0] : prev.descricao,
                                      }));
                                    }}
                                  >
                                    {empresa}
                                  </button>
                                );
                              })}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sc">
                      SC <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="sc"
                      value={createFormData.sc || ""}
                      onChange={(e) => {
                        const scValue = e.target.value;
                        setCreateFormData({ ...createFormData, sc: scValue });
                        // Validar em tempo real
                        if (scValue && scExists(scValue)) {
                          toast.error("Esta SC já existe!");
                        }
                      }}
                      required
                      className={createFormData.sc && scExists(createFormData.sc) ? "border-red-500 focus-visible:ring-red-500" : ""}
                    />
                    {createFormData.sc && scExists(createFormData.sc) && (
                      <p className="text-xs text-red-500">Esta SC já existe no sistema</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nota_fiscal">Nota Fiscal</Label>
                    <Input
                      id="nota_fiscal"
                      value={createFormData.nota_fiscal || ""}
                      onChange={(e) => setCreateFormData({ ...createFormData, nota_fiscal: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vencimento">Vencimento</Label>
                    <div className="flex gap-2">
                      <Input
                        id="vencimento"
                        value={createFormData.vencimento || ""}
                        onChange={(e) => {
                          const formatted = handleDateInput(e.target.value);
                          setCreateFormData({ ...createFormData, vencimento: formatted });
                        }}
                        placeholder="dd/mm/aaaa"
                        maxLength={10}
                        className="flex-1"
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                          >
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            mode="single"
                            selected={parseDateBR(createFormData.vencimento || "")}
                            onSelect={(date) => {
                              if (date) {
                                const formatted = formatDateBR(date);
                                setCreateFormData({ ...createFormData, vencimento: formatted });
                              }
                            }}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor</Label>
                    <Input
                      id="valor"
                      value={createFormData.valor || ""}
                      onChange={(e) => {
                        const formatted = handleCurrencyInput(e.target.value);
                        setCreateFormData({ ...createFormData, valor: formatted });
                      }}
                      placeholder="R$ 0,00"
                      onBlur={(e) => {
                        // Garante formatação correta ao perder o foco
                        if (e.target.value) {
                          const formatted = formatCurrency(e.target.value);
                          setCreateFormData({ ...createFormData, valor: formatted });
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="oc">OC</Label>
                    <Input
                      id="oc"
                      value={createFormData.oc || ""}
                      onChange={(e) => setCreateFormData({ ...createFormData, oc: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="situacao">Situação</Label>
                    <Select
                      value={createFormData.situacao || "vazio"}
                      onValueChange={(value) => {
                        const situacaoValue = value === "vazio" ? "" : value;
                        setCreateFormData({ ...createFormData, situacao: situacaoValue });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vazio">-</SelectItem>
                        <SelectItem value="paga">Paga</SelectItem>
                        <SelectItem value="?">?</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fornecedor">Fornecedor</Label>
                    <Input
                      id="fornecedor"
                      value={createFormData.fornecedor || ""}
                      onChange={(e) => setCreateFormData({ ...createFormData, fornecedor: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="produto">Produto</Label>
                    <Input
                      id="produto"
                      value={createFormData.produto || ""}
                      onChange={(e) => setCreateFormData({ ...createFormData, produto: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="informacoes">Informações</Label>
                    <Input
                      id="informacoes"
                      value={createFormData.informacoes || ""}
                      onChange={(e) => setCreateFormData({ ...createFormData, informacoes: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="empresa">Empresa</Label>
                    <Input
                      id="empresa"
                      value={createFormData.empresa || ""}
                      onChange={(e) => setCreateFormData({ ...createFormData, empresa: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sc">SC</Label>
                    <Input
                      id="sc"
                      value={createFormData.sc || ""}
                      onChange={(e) => {
                        const scValue = e.target.value;
                        setCreateFormData({ ...createFormData, sc: scValue });
                        // Validar em tempo real
                        if (scValue && scExists(scValue)) {
                          toast.error("Esta SC já existe!");
                        }
                      }}
                      className={createFormData.sc && scExists(createFormData.sc) ? "border-red-500 focus-visible:ring-red-500" : ""}
                    />
                    {createFormData.sc && scExists(createFormData.sc) && (
                      <p className="text-xs text-red-500">Esta SC já existe no sistema</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nota_fiscal">Nota Fiscal</Label>
                    <Input
                      id="nota_fiscal"
                      value={createFormData.nota_fiscal || ""}
                      onChange={(e) => setCreateFormData({ ...createFormData, nota_fiscal: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vencimento">Vencimento</Label>
                    <div className="flex gap-2">
                      <Input
                        id="vencimento"
                        value={createFormData.vencimento || ""}
                        onChange={(e) => {
                          const formatted = handleDateInput(e.target.value);
                          setCreateFormData({ ...createFormData, vencimento: formatted });
                        }}
                        placeholder="dd/mm/aaaa"
                        maxLength={10}
                        className="flex-1"
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                          >
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            mode="single"
                            selected={parseDateBR(createFormData.vencimento || "")}
                            onSelect={(date) => {
                              if (date) {
                                const formatted = formatDateBR(date);
                                setCreateFormData({ ...createFormData, vencimento: formatted });
                              }
                            }}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor</Label>
                    <Input
                      id="valor"
                      value={createFormData.valor || ""}
                      onChange={(e) => {
                        const formatted = handleCurrencyInput(e.target.value);
                        setCreateFormData({ ...createFormData, valor: formatted });
                      }}
                      placeholder="R$ 0,00"
                      onBlur={(e) => {
                        // Garante formatação correta ao perder o foco
                        if (e.target.value) {
                          const formatted = formatCurrency(e.target.value);
                          setCreateFormData({ ...createFormData, valor: formatted });
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="oc">OC</Label>
                    <Input
                      id="oc"
                      value={createFormData.oc || ""}
                      onChange={(e) => setCreateFormData({ ...createFormData, oc: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="situacao">Situação</Label>
                    <Select
                      value={createFormData.situacao || "vazio"}
                      onValueChange={(value) => {
                        const situacaoValue = value === "vazio" ? "" : value;
                        setCreateFormData({ ...createFormData, situacao: situacaoValue });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vazio">-</SelectItem>
                        <SelectItem value="paga">Paga</SelectItem>
                        <SelectItem value="?">?</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setCreateTipo(null);
                    setCreateFormData({});
                    setConfigsFiltradas([]);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  type="button"
                  onClick={async (e) => {
                    console.log("🔵 [BOTÃO CLICADO] Iniciando processo de criação...");
                    console.log("🔵 [DEBUG] createTipo:", createTipo);
                    console.log("🔵 [DEBUG] createFormData:", createFormData);
                    
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (!createTipo) {
                      console.error("❌ [ERRO] createTipo está vazio/null");
                      toast.error("Selecione um tipo (Serviço ou Produto)");
                      return;
                    }
                    
                    // Validação para serviço
                    if (createTipo === "servico") {
                      console.log("🔵 [VALIDAÇÃO] Validando campos de serviço...");
                      if (!createFormData.servico || !createFormData.descricao || !createFormData.empresa || !createFormData.sc) {
                        console.error("❌ [VALIDAÇÃO FALHOU] Campos obrigatórios faltando:", {
                          servico: !!createFormData.servico,
                          descricao: !!createFormData.descricao,
                          empresa: !!createFormData.empresa,
                          sc: !!createFormData.sc
                        });
                        toast.error("Preencha todos os campos obrigatórios: Serviço, Descrição, Empresa e SC");
                        return;
                      }
                      console.log("✅ [VALIDAÇÃO] Campos de serviço OK");
                    }

                    // Validar se SC já existe
                    if (createFormData.sc) {
                      console.log("🔵 [VALIDAÇÃO SC] Verificando se SC já existe...");
                      if (scExists(createFormData.sc)) {
                        console.error("❌ [VALIDAÇÃO SC] SC já existe:", createFormData.sc);
                        toast.error("Esta SC já existe! Não é possível criar itens duplicados.");
                        return;
                      }
                      console.log("✅ [VALIDAÇÃO SC] SC não existe, pode continuar");
                    }

                    // Converter valor formatado para string simples antes de salvar
                    let formDataToSave = { ...createFormData };
                    if (formDataToSave.valor) {
                      console.log("🔵 [CONVERSÃO] Convertendo valor:", formDataToSave.valor);
                      formDataToSave.valor = currencyToString(formDataToSave.valor);
                      console.log("🔵 [CONVERSÃO] Valor convertido:", formDataToSave.valor);
                    }

                    // Converter campos de texto para maiúsculas
                    formDataToSave = convertTextFieldsToUpperCase(formDataToSave);

                    console.log("🔵 [DADOS FINAIS] Dados que serão salvos:", formDataToSave);

                    try {
                      console.log("🔵 [CRIAÇÃO] Iniciando criação no banco...");
                      if (createTipo === "servico") {
                        console.log("🔵 [CRIAÇÃO] Criando serviço...");
                        const resultado = await createServico(formDataToSave);
                        console.log("✅ [CRIAÇÃO] Serviço criado com sucesso:", resultado);
                        toast.success("Serviço criado com sucesso!");
                      } else {
                        console.log("🔵 [CRIAÇÃO] Criando produto...");
                        const resultado = await createProduto(formDataToSave);
                        console.log("✅ [CRIAÇÃO] Produto criado com sucesso:", resultado);
                        toast.success("Produto criado com sucesso!");
                      }
                      
                      console.log("🔵 [LIMPEZA] Fechando dialog e limpando dados...");
                      setShowCreateDialog(false);
                      setCreateTipo(null);
                      setCreateFormData({});
                      setConfigsFiltradas([]);
                      
                      console.log("🔵 [RECARREGAMENTO] Recarregando lista de itens...");
                      await loadItems();
                      console.log("✅ [SUCESSO] Processo completo finalizado!");
                    } catch (error) {
                      console.error("❌ [ERRO] Erro ao criar item:", error);
                      console.error("❌ [ERRO] Detalhes do erro:", {
                        message: error instanceof Error ? error.message : String(error),
                        stack: error instanceof Error ? error.stack : undefined,
                        error: error
                      });
                      logger.error("Erro ao criar item:", error);
                      toast.error("Erro ao criar item");
                    }
                  }}
                >
                  Criar {createTipo === "servico" ? "Serviço" : "Produto"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
