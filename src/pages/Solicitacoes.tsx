import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  ChevronUp,
  Calendar as CalendarIcon,
  Check,
  Table2,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Building2,
  Receipt,
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
import {
  fetchTodasDespesas,
  getValorMesAtual,
  getMesAtual,
  isDespesaMarcada,
  toggleDespesaCheck,
  resetarChecksMesAtual,
  resetarSeDia1,
  type DespesaTI,
} from "@/lib/despesasService";
import { useSidebar } from "@/components/ui/sidebar";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { HorizontalBarChart } from "@/components/charts/HorizontalBarChart";


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
  const [activeMainTab, setActiveMainTab] = useState<"lista" | "central">("lista");
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
  const [showServicosModal, setShowServicosModal] = useState(false);
  const [showProdutosModal, setShowProdutosModal] = useState(false);
  const [showDespesasModal, setShowDespesasModal] = useState(false);
  // Refs para agrupar eventos de marcação de despesas e debounce
  const pendingDespesaEventsRef = useRef<Array<{ servico: string; marina?: string }>>([]);
  const despesaDebounceRef = useRef<number | null>(null);
  const [despesasRecorrentes, setDespesasRecorrentes] = useState<DespesaTI[]>([]);
  const [despesasEsporadicas, setDespesasEsporadicas] = useState<DespesaTI[]>([]);
  const [loadingDespesas, setLoadingDespesas] = useState(false);
  const [confirmarMarcacao, setConfirmarMarcacao] = useState<{
    open: boolean;
    despesaId: string | null;
    despesaNome: string | null;
    descricao: string | null;
    marina: string | null;
  }>({
    open: false,
    despesaId: null,
    despesaNome: null,
    descricao: null,
    marina: null,
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [servicosMesesExibidos, setServicosMesesExibidos] = useState(6);
  const [produtosMesesExibidos, setProdutosMesesExibidos] = useState(6);
  const [servicosMesesExpandidos, setServicosMesesExpandidos] = useState<Set<string>>(new Set());
  const [produtosMesesExpandidos, setProdutosMesesExpandidos] = useState<Set<string>>(new Set());

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

  const loadDespesas = async () => {
    try {
      setLoadingDespesas(true);
      const { recorrentes, esporadicas } = await fetchTodasDespesas();
      
      // Debug: verificar se a marina está vindo
      logger.log('🔍 Debug - Despesas carregadas:', {
        totalRecorrentes: recorrentes.length,
        totalEsporadicas: esporadicas.length,
        primeiraRecorrente: recorrentes[0] ? {
          fornecedor: recorrentes[0].fornecedor,
          marina: recorrentes[0].marina,
          temMarina: !!recorrentes[0].marina
        } : null,
        primeiraEsporadica: esporadicas[0] ? {
          fornecedor: esporadicas[0].fornecedor,
          marina: esporadicas[0].marina,
          temMarina: !!esporadicas[0].marina
        } : null
      });
      
      setDespesasRecorrentes(recorrentes);
      setDespesasEsporadicas(esporadicas);
    } catch (error) {
      logger.error("Erro ao carregar despesas:", error);
      toast.error("Erro ao carregar despesas");
    } finally {
      setLoadingDespesas(false);
    }
  };

  const handleToggleDespesa = async (despesaId: string, marcado: boolean) => {
    // Se for desmarcar, não pede confirmação
    if (!marcado) {
      try {
        await toggleDespesaCheck(despesaId, marcado);
        // Atualizar o estado local
        setDespesasRecorrentes(prev => 
          prev.map(d => {
            if (d.id === despesaId) {
              const mesAtual = getMesAtual();
              return { ...d, [mesAtual]: 0 };
            }
            return d;
          })
        );
        toast.success("Despesa desmarcada");
      } catch (error) {
        logger.error("Erro ao atualizar despesa:", error);
        toast.error("Erro ao atualizar despesa");
      }
      return;
    }

    // Se for marcar, pede confirmação
    const despesa = despesasRecorrentes.find(d => d.id === despesaId);
    if (despesa) {
      setConfirmarMarcacao({
        open: true,
        despesaId: despesaId,
        despesaNome: despesa.fornecedor,
        descricao: despesa.desc_servico || null,
        marina: despesa.marina || null,
      });
    }
  };

  const confirmarMarcarDespesa = async () => {
    if (!confirmarMarcacao.despesaId) return;

    try {
      await toggleDespesaCheck(confirmarMarcacao.despesaId, true);
      // Atualizar o estado local
      setDespesasRecorrentes(prev => 
        prev.map(d => {
          if (d.id === confirmarMarcacao.despesaId) {
            const mesAtual = getMesAtual();
            return { ...d, [mesAtual]: 1 };
          }
          return d;
        })
      );
      toast.success("Despesa marcada com sucesso");
      setConfirmarMarcacao({ open: false, despesaId: null, despesaNome: null, descricao: null, marina: null });
    } catch (error) {
      logger.error("Erro ao atualizar despesa:", error);
      toast.error("Erro ao atualizar despesa");
      setConfirmarMarcacao({ open: false, despesaId: null, despesaNome: null, descricao: null, marina: null });
    }
  };

  const handleResetarChecks = () => {
    // Abre o AlertDialog de confirmação
    setShowResetConfirm(true);
  };

  const performResetConfirmed = async () => {
    try {
      setShowResetConfirm(false);
      setLoadingDespesas(true);
      const mesAtual = getMesAtual();
      // Chama serviço para resetar no banco
      await resetarChecksMesAtual();

      // Atualiza estado local para refletir desmarcados imediatamente
      setDespesasRecorrentes(prev => prev.map(d => ({ ...d, [mesAtual]: 0 })));

      // Recarrega do servidor para garantir consistência
      await loadDespesas();

      toast.success('Todos os checks foram desmarcados para o mês atual');
    } catch (error) {
      logger.error('Erro ao resetar checks:', error);
      toast.error('Erro ao resetar checks');
    } finally {
      setLoadingDespesas(false);
    }
  };

  // Carregar dados
  useEffect(() => {
    loadItems();
    loadConfigSolicitacoes();
  }, []);

  // Listener para quando uma despesa for marcada automaticamente ao criar serviço
  useEffect(() => {
    // Debounced handler: agrupa múltiplos eventos e processa uma única vez
    const handleDespesaMarcada = (event: CustomEvent) => {
      const { servico, marina } = event.detail || {};
      // Empilha o evento
      pendingDespesaEventsRef.current.push({ servico, marina });

      // Reinicia o debounce
      if (despesaDebounceRef.current) {
        window.clearTimeout(despesaDebounceRef.current);
      }

      despesaDebounceRef.current = window.setTimeout(async () => {
        try {
          const eventos = pendingDespesaEventsRef.current.splice(0);
          // Recarrega as despesas do servidor para garantir dados fresh
          await loadDespesas();
          // Abre modal para mostrar o checklist atualizado
          setShowDespesasModal(true);

          // Mostrar toast resumido (um ou vários eventos)
          if (eventos.length === 1) {
            const e = eventos[0];
            toast.success(`Despesa marcada automaticamente no checklist: ${e.servico}${e.marina ? ` (${e.marina})` : ''}`);
          } else if (eventos.length > 1) {
            toast.success(`${eventos.length} despesas marcadas automaticamente no checklist`);
          }
        } catch (err) {
          logger.error('Erro ao processar marcação automática de despesas:', err);
          toast.error('Erro ao atualizar checklist de despesas');
        } finally {
          if (despesaDebounceRef.current) {
            window.clearTimeout(despesaDebounceRef.current);
            despesaDebounceRef.current = null;
          }
        }
      }, 250);
    };

    window.addEventListener('despesa:marcada-automaticamente', handleDespesaMarcada as EventListener);

    return () => {
      window.removeEventListener('despesa:marcada-automaticamente', handleDespesaMarcada as EventListener);
      if (despesaDebounceRef.current) {
        window.clearTimeout(despesaDebounceRef.current);
        despesaDebounceRef.current = null;
      }
      pendingDespesaEventsRef.current = [];
    };
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

    const handleTipoTabFromHeader = (event: Event) => {
      const custom = event as CustomEvent<"servico" | "produto">;
      const tipo = custom.detail === "produto" ? "produto" : "servico";
      setActiveTipoTab(tipo);
    };

    const handleMainTabFromHeader = (event: Event) => {
      const custom = event as CustomEvent<"lista" | "central">;
      const tab = custom.detail === "central" ? "central" : "lista";
      setActiveMainTab(tab);
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
    window.addEventListener("solicitacoes:setTipoTab", handleTipoTabFromHeader);
    window.addEventListener("solicitacoes:setMainTab", handleMainTabFromHeader);
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
      window.removeEventListener("solicitacoes:setTipoTab", handleTipoTabFromHeader);
      window.removeEventListener("solicitacoes:setMainTab", handleMainTabFromHeader);
      window.removeEventListener("solicitacoes:openCreateDialog", handleOpenCreateDialog);
      window.removeEventListener("solicitacoes:clearFilters", handleClearFilters);
    };
  }, [items, servicosUnicos, anosDisponiveis]);

  // Notificar o Layout sobre o tipo atual quando mudar
  useEffect(() => {
    const event = new CustomEvent("solicitacoes:tipoTabChanged", { detail: activeTipoTab });
    window.dispatchEvent(event);
  }, [activeTipoTab]);

  // Notificar o Layout sobre a aba principal atual quando mudar
  useEffect(() => {
    const event = new CustomEvent("solicitacoes:mainTabChanged", { detail: activeMainTab });
    window.dispatchEvent(event);
  }, [activeMainTab]);

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

  // Função auxiliar para extrair apenas números de uma string
  const extractNumbers = (value: string): string => {
    return value.replace(/\D/g, '');
  };

  // Função para verificar se uma SC é duplicada (mesma SC na mesma empresa)
  const idsDuplicados = useMemo(() => {
    // Criar um mapa de SCs por empresa
    const scPorEmpresa = new Map<string, Set<string>>();
    
    items.forEach((item) => {
      if (!item.sc || !item.empresa) return;
      
      const normalizedSC = extractNumbers(item.sc);
      if (!normalizedSC) return;
      
      const empresa = item.empresa.trim();
      const key = `${empresa}|${normalizedSC}`;
      
      if (!scPorEmpresa.has(key)) {
        scPorEmpresa.set(key, new Set());
      }
      scPorEmpresa.get(key)!.add(item.id);
    });
    
    // Criar um Set com IDs de itens que têm SC duplicada
    const idsDuplicadosSet = new Set<string>();
    scPorEmpresa.forEach((ids) => {
      if (ids.size > 1) {
        // Se há mais de um item com a mesma SC na mesma empresa, todos são duplicados
        ids.forEach(id => idsDuplicadosSet.add(id));
      }
    });
    
    return idsDuplicadosSet;
  }, [items]);

  // Função auxiliar para verificar se um item é duplicado
  const isSCDuplicada = (itemId: string, sc: string, empresa: string): boolean => {
    if (!sc || !empresa) return false;
    return idsDuplicados.has(itemId);
  };

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
      
      // Filtro de duplicados: se showDuplicados estiver ativo, mostrar apenas duplicados
      // Se não estiver ativo, mostrar todos (incluindo duplicados)
      const matchesDuplicados = !showDuplicados || (showDuplicados && isSCDuplicada(item.id, item.sc || "", item.empresa || ""));
      
      return matchesTipo && matchesAno && matchesSearch && matchesServico && matchesDuplicados;
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
  const stats = useMemo(() => {
    const servicos = items.filter((i) => i.tipo === "servico");
    const produtos = items.filter((i) => i.tipo === "produto");
    
    const calcularValor = (item: ServicoProduto) => {
      if (!item.valor) return 0;
      const valorStr = item.valor.replace(/[^\d,.-]/g, "").replace(",", ".");
      return parseFloat(valorStr) || 0;
    };

    const valorTotal = items.reduce((sum, i) => sum + calcularValor(i), 0);
    const valorServicos = servicos.reduce((sum, i) => sum + calcularValor(i), 0);
    const valorProdutos = produtos.reduce((sum, i) => sum + calcularValor(i), 0);

    const comValor = items.filter(i => calcularValor(i) > 0);
    const mediaValor = comValor.length > 0 ? valorTotal / comValor.length : 0;
    const mediaServicos = servicos.filter(i => calcularValor(i) > 0).length > 0 
      ? valorServicos / servicos.filter(i => calcularValor(i) > 0).length 
      : 0;
    const mediaProdutos = produtos.filter(i => calcularValor(i) > 0).length > 0
      ? valorProdutos / produtos.filter(i => calcularValor(i) > 0).length
      : 0;

    const paga = items.filter(i => i.situacao === "paga").length;
    const cancelada = items.filter(i => i.situacao === "cancelado").length;
    const pendente = items.filter(i => !i.situacao || i.situacao === "?").length;
    
    const valorPaga = items
      .filter(i => i.situacao === "paga")
      .reduce((sum, i) => sum + calcularValor(i), 0);
    const valorPendente = items
      .filter(i => !i.situacao || i.situacao === "?")
      .reduce((sum, i) => sum + calcularValor(i), 0);
    const valorCancelada = items
      .filter(i => i.situacao === "cancelado")
      .reduce((sum, i) => sum + calcularValor(i), 0);

    // Top empresas por valor 
    // Filtrar apenas campos de empresa válidos (não SCs ou números)
    const empresasMap = new Map<string, number>();
    items.forEach(item => {
      if (item.empresa && calcularValor(item) > 0) {
        const empresa = item.empresa.trim();
        // Filtrar valores que são apenas números (provavelmente SCs)
        const isOnlyNumbers = /^\d+$/.test(empresa);
        // Filtrar valores muito curtos ou que parecem SCs
        if (!isOnlyNumbers && empresa.length > 2 && empresa !== item.sc) {
          const atual = empresasMap.get(empresa) || 0;
          empresasMap.set(empresa, atual + calcularValor(item));
        }
      }
    });
    const topEmpresas = Array.from(empresasMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Top 5 serviços mais caros
    const topServicos = servicos
      .map(servico => ({
        servico: servico.servico || "-",
        descricao: servico.descricao || "-",
        valor: calcularValor(servico),
        empresa: servico.empresa || "-",
      }))
      .filter(s => s.valor > 0)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);

    // Anos disponíveis
    const anos = Array.from(new Set(items.map(i => i.ano).filter(Boolean))).sort((a, b) => (b || 0) - (a || 0));

    // Insights adicionais
    const semValor = items.filter(i => calcularValor(i) === 0).length;
    const taxaPreenchimento = items.length > 0 ? ((items.length - semValor) / items.length * 100) : 0;
    
    // Distribuição por ano
    const distribuicaoAno = new Map<number, number>();
    items.forEach(item => {
      if (item.ano) {
        distribuicaoAno.set(item.ano, (distribuicaoAno.get(item.ano) || 0) + 1);
      }
    });
    const topAno = Array.from(distribuicaoAno.entries())
      .sort((a, b) => b[1] - a[1])[0] || [null, 0];

    // Empresas com mais itens (quantidade)
    const empresasQtdMap = new Map<string, number>();
    items.forEach(item => {
      if (item.empresa) {
        empresasQtdMap.set(item.empresa, (empresasQtdMap.get(item.empresa) || 0) + 1);
      }
    });
    const topEmpresasQtd = Array.from(empresasQtdMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    // Serviços mais frequentes
    const servicosFreqMap = new Map<string, number>();
    servicos.forEach(item => {
      if (item.servico) {
        servicosFreqMap.set(item.servico, (servicosFreqMap.get(item.servico) || 0) + 1);
      }
    });
    const topServicosFreq = Array.from(servicosFreqMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    // Itens com OC vs sem OC
    const comOC = items.filter(i => i.oc && i.oc.trim() !== "").length;
    const semOC = items.length - comOC;

    // Itens com nota fiscal vs sem
    const comNF = items.filter(i => i.nota_fiscal && i.nota_fiscal.trim() !== "").length;
    const semNF = items.length - comNF;

    // Média de itens por mês (baseado nos últimos 12 meses)
    const mesesComItens = new Set<string>();
    items.forEach(item => {
      const data = item.tipo === "servico" ? item.data_solicitacao : item.data_sc;
      if (data) {
        const parts = data.split('/');
        if (parts.length === 3) {
          const mes = parts[1];
          let ano = parseInt(parts[2], 10);
          if (ano < 100) ano += 2000;
          mesesComItens.add(`${ano}-${mes}`);
        }
      }
    });
    const mediaItensMes = mesesComItens.size > 0 ? items.length / mesesComItens.size : 0;

    return {
      total: items.length,
      servicos: servicos.length,
      produtos: produtos.length,
      valorTotal,
      valorServicos,
      valorProdutos,
      mediaValor,
      topEmpresas,
      topServicos,
      anos: anos.length,
      anoAtual: anos[0] || new Date().getFullYear(),
      // Situação
      paga,
      cancelada,
      pendente,
      valorPaga,
      valorPendente,
      valorCancelada,
      // Insights
      semValor,
      taxaPreenchimento,
      topAno: topAno[0] ? { ano: topAno[0], quantidade: topAno[1] } : null,
      topEmpresasQtd,
      topServicosFreq,
      comOC,
      semOC,
      comNF,
      semNF,
      mediaItensMes,
      mesesComItens: mesesComItens.size,
    };
  }, [items]);

  // Agrupar serviços por mês
  const servicosPorMes = useMemo(() => {
    const servicos = items.filter((i) => i.tipo === "servico" && i.data_solicitacao);
    
    // Função para extrair mês/ano da data brasileira (dd/mm/yyyy)
    const extrairMesAno = (dataStr: string): string | null => {
      if (!dataStr) return null;
      const parts = dataStr.split('/');
      if (parts.length === 3) {
        const mes = parseInt(parts[1], 10);
        let ano = parseInt(parts[2], 10);
        if (ano < 100) ano += 2000;
        
        if (!isNaN(mes) && !isNaN(ano) && mes >= 1 && mes <= 12) {
          // Criar data para formatar o nome do mês
          const date = new Date(ano, mes - 1, 1);
          const nomeMes = format(date, "MMMM yyyy", { locale: ptBR });
          return `${ano}-${String(mes).padStart(2, '0')}`; // Chave para ordenação
        }
      }
      return null;
    };

    // Agrupar por mês/ano
    const agrupados = new Map<string, {
      mesAno: string;
      nomeMes: string;
      servicos: ServicoProduto[];
      quantidade: number;
      valorTotal: number;
    }>();

    servicos.forEach((servico) => {
      const chave = extrairMesAno(servico.data_solicitacao || "");
      if (!chave) return;

      if (!agrupados.has(chave)) {
        const parts = servico.data_solicitacao?.split('/') || [];
        const mes = parseInt(parts[1] || "1", 10);
        let ano = parseInt(parts[2] || "2024", 10);
        if (ano < 100) ano += 2000;
        const date = new Date(ano, mes - 1, 1);
        const nomeMes = format(date, "MMMM/yyyy", { locale: ptBR });
        
        agrupados.set(chave, {
          mesAno: chave,
          nomeMes: nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1),
          servicos: [],
          quantidade: 0,
          valorTotal: 0,
        });
      }

      const grupo = agrupados.get(chave)!;
      grupo.servicos.push(servico);
      grupo.quantidade += 1;
      
      if (servico.valor) {
        const valorStr = servico.valor.replace(/[^\d,.-]/g, "").replace(",", ".");
        const valor = parseFloat(valorStr) || 0;
        grupo.valorTotal += valor;
      }
    });

    // Converter para array e ordenar (mais recente primeiro)
    return Array.from(agrupados.values()).sort((a, b) => {
      return b.mesAno.localeCompare(a.mesAno);
    });
  }, [items]);

  // Agrupar produtos por mês
  const produtosPorMes = useMemo(() => {
    const produtos = items.filter((i) => i.tipo === "produto" && i.data_sc);
    
    // Função para extrair mês/ano da data brasileira (dd/mm/yyyy)
    const extrairMesAno = (dataStr: string): string | null => {
      if (!dataStr) return null;
      const parts = dataStr.split('/');
      if (parts.length === 3) {
        const mes = parseInt(parts[1], 10);
        let ano = parseInt(parts[2], 10);
        if (ano < 100) ano += 2000;
        
        if (!isNaN(mes) && !isNaN(ano) && mes >= 1 && mes <= 12) {
          // Criar data para formatar o nome do mês
          const date = new Date(ano, mes - 1, 1);
          const nomeMes = format(date, "MMMM yyyy", { locale: ptBR });
          return `${ano}-${String(mes).padStart(2, '0')}`; // Chave para ordenação
        }
      }
      return null;
    };

    // Agrupar por mês/ano
    const agrupados = new Map<string, {
      mesAno: string;
      nomeMes: string;
      produtos: ServicoProduto[];
      quantidade: number;
      valorTotal: number;
    }>();

    produtos.forEach((produto) => {
      const chave = extrairMesAno(produto.data_sc || "");
      if (!chave) return;

      if (!agrupados.has(chave)) {
        const parts = produto.data_sc?.split('/') || [];
        const mes = parseInt(parts[1] || "1", 10);
        let ano = parseInt(parts[2] || "2024", 10);
        if (ano < 100) ano += 2000;
        const date = new Date(ano, mes - 1, 1);
        const nomeMes = format(date, "MMMM/yyyy", { locale: ptBR });
        
        agrupados.set(chave, {
          mesAno: chave,
          nomeMes: nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1),
          produtos: [],
          quantidade: 0,
          valorTotal: 0,
        });
      }

      const grupo = agrupados.get(chave)!;
      grupo.produtos.push(produto);
      grupo.quantidade += 1;
      
      if (produto.valor) {
        const valorStr = produto.valor.replace(/[^\d,.-]/g, "").replace(",", ".");
        const valor = parseFloat(valorStr) || 0;
        grupo.valorTotal += valor;
      }
    });

    // Converter para array e ordenar (mais recente primeiro)
    return Array.from(agrupados.values()).sort((a, b) => {
      return b.mesAno.localeCompare(a.mesAno);
    });
  }, [items]);

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

  const [confirmarDelete, setConfirmarDelete] = useState<{ open: boolean; item: ServicoProduto | null }>({ open: false, item: null });

  const performDeleteConfirmed = async () => {
    const item = confirmarDelete.item;
    try {
      if (!item) return;

      // Extrair dbId
      let dbId = (item as any)._dbId;
      if (!dbId && item.id) {
        const match = item.id.match(/^(servico|produto)_(\d+)_/);
        if (match) dbId = match[2];
      }

      if (!dbId) {
        toast.error('Não foi possível identificar o ID do item para deletar');
        setConfirmarDelete({ open: false, item: null });
        return;
      }

      if (item.tipo === 'servico') {
        const { deleteServico } = await import('@/lib/servicosProdutosService');
        await deleteServico(dbId);
      } else {
        const { deleteProduto } = await import('@/lib/servicosProdutosService');
        await deleteProduto(dbId);
      }

      toast.success('Item deletado com sucesso');
      await loadItems();
      setEditingRow(null);
      setEditingValues({});
    } catch (error) {
      logger.error('Erro ao deletar item:', error);
      toast.error('Erro ao deletar item');
    } finally {
      setConfirmarDelete({ open: false, item: null });
    }
  };

  const handleDeleteItem = async (item: ServicoProduto) => {
    // Abrir modal de confirmação em vez de usar window.confirm
    if (!item) return;
    setConfirmarDelete({ open: true, item });
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

  // Função para verificar se uma SC já existe (comparando números)
  // Aceita opcionalmente `ano` e `empresa` para checagens mais específicas
  const scExists = (sc: string, ano?: number | string | null, empresa?: string | null): boolean => {
    if (!sc) return false;
    const normalizedSC = extractNumbers(sc);
    if (!normalizedSC) return false;

    return items.some((item) => {
      if (!item.sc) return false;
      const itemNormalized = extractNumbers(item.sc);
      if (itemNormalized !== normalizedSC) return false;

      // Se ano foi fornecido, exigir que o ano do item corresponda
      if (ano !== undefined && ano !== null) {
        const itemAno = item.ano ? String(item.ano) : '';
        if (String(ano) !== itemAno) return false;
      }

      // Se empresa foi fornecida, exigir correspondência (ignorando caixa)
      if (empresa) {
        const itemEmpresa = item.empresa ? item.empresa.toLowerCase().trim() : '';
        if (itemEmpresa && itemEmpresa !== empresa.toLowerCase().trim()) return false;
      }

      return true;
    });
  };

  // Simplified: no duplicate detection. Just paginate the filtered/sorted items.
  const itemsParaExibir = useMemo(() => {
    return filteredAndSortedItems.slice(0, displayedCount);
  }, [filteredAndSortedItems, displayedCount]);

  // Resetar contador quando filtros mudarem
  useEffect(() => {
    setDisplayedCount(100);
  }, [activeTipoTab, anoFilter, servicoFilter, searchTerm, showDuplicados]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Conteúdo das abas */}
      {activeMainTab === "central" ? (
        /* Aba DADOS - Cards de Estatísticas */
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-4">
          {/* Cards Principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <Card className="border-l-4 border-l-primary bg-gradient-to-br from-background to-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total de Itens</p>
                    <p className="text-2xl md:text-3xl font-bold">{stats.total}</p>
                  </div>
                  <Package className="w-8 h-8 md:w-10 md:h-10 text-primary opacity-80" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-blue-600 bg-gradient-to-br from-background to-blue-500/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Serviços</p>
                    <p className="text-2xl md:text-3xl font-bold text-blue-600">{stats.servicos}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.valorServicos.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                  <Wrench className="w-8 h-8 md:w-10 md:h-10 text-blue-500 opacity-80" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-purple-600 bg-gradient-to-br from-background to-purple-500/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Produtos</p>
                    <p className="text-2xl md:text-3xl font-bold text-purple-600">{stats.produtos}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.valorProdutos.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                  <ShoppingCart className="w-8 h-8 md:w-10 md:h-10 text-purple-500 opacity-80" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-600 bg-gradient-to-br from-background to-green-500/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Valor Total</p>
                    <p className="text-xl md:text-2xl font-bold text-green-600">
                      {stats.valorTotal.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                        maximumFractionDigits: 0,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Média: {stats.mediaValor.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 md:w-10 md:h-10 text-green-600 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Botões para abrir modais de Serviços, Produtos e Despesas por Mês */}
          <div className="mb-6 flex gap-2 flex-wrap">
            <Button
              onClick={() => setShowServicosModal(true)}
              className="flex-1 min-w-[170px] flex items-center gap-3 px-4 py-2 rounded-lg shadow-sm transform transition hover:-translate-y-0.5 hover:shadow-md bg-gradient-to-r from-blue-500 to-blue-600 text-white"
            >
              <span className="p-2 rounded-full bg-white/20">
                <Wrench className="w-4 h-4 text-white" />
              </span>
              <span className="text-sm font-semibold">Serviços por Mês</span>
              <Badge variant="outline" className="ml-auto bg-white/20 text-white border-transparent">
                {servicosPorMes.length}
              </Badge>
            </Button>

            <Button
              onClick={() => setShowProdutosModal(true)}
              className="flex-1 min-w-[170px] flex items-center gap-3 px-4 py-2 rounded-lg shadow-sm transform transition hover:-translate-y-0.5 hover:shadow-md bg-gradient-to-r from-purple-500 to-purple-600 text-white"
            >
              <span className="p-2 rounded-full bg-white/20">
                <ShoppingCart className="w-4 h-4 text-white" />
              </span>
              <span className="text-sm font-semibold">Produtos por Mês</span>
              <Badge variant="outline" className="ml-auto bg-white/20 text-white border-transparent">
                {produtosPorMes.length}
              </Badge>
            </Button>

            <Button
              onClick={async () => {
                setShowDespesasModal(true);
                // Verificar se é dia 1 e resetar automaticamente
                try {
                  const foiResetado = await resetarSeDia1();
                  if (foiResetado) {
                    toast.success("Checklist resetado automaticamente (dia 1 do mês)");
                  }
                } catch (error) {
                  logger.error("Erro ao verificar/resetar no dia 1:", error);
                  // Não bloquear a abertura do modal se houver erro
                }
                loadDespesas();
              }}
              className="flex-1 min-w-[170px] flex items-center gap-3 px-4 py-2 rounded-lg shadow-sm transform transition hover:-translate-y-0.5 hover:shadow-md bg-gradient-to-r from-green-500 to-green-600 text-white"
            >
              <span className="p-2 rounded-full bg-white/20">
                <Receipt className="w-4 h-4 text-white" />
              </span>
              <span className="text-sm font-semibold">Despesas T.I.</span>
              <Badge variant="outline" className="ml-auto bg-white/20 text-white border-transparent">
                {despesasRecorrentes.length + despesasEsporadicas.length}
              </Badge>
            </Button>
          </div>

          {/* Cards de Insights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <p className="text-xs font-semibold">Taxa Preenchimento</p>
                </div>
                <p className="text-lg font-bold">{stats.taxaPreenchimento.toFixed(1)}%</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {stats.semValor} sem valor
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarIcon className="w-4 h-4 text-blue-500" />
                  <p className="text-xs font-semibold">Ano Mais Ativo</p>
                </div>
                {stats.topAno ? (
                  <>
                    <p className="text-lg font-bold">{stats.topAno.ano}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {stats.topAno.quantidade} itens
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">N/A</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-purple-500" />
                  <p className="text-xs font-semibold">Média/Mês</p>
                </div>
                <p className="text-lg font-bold">{stats.mediaItensMes.toFixed(1)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {stats.mesesComItens} meses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <p className="text-xs font-semibold">Com OC</p>
                </div>
                <p className="text-lg font-bold">{stats.comOC}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {stats.semOC} sem OC
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico Top 5 Empresas */}
          {stats.topEmpresas.length > 0 ? (
            <HorizontalBarChart
              data={stats.topEmpresas.map(([empresa, valor]) => ({
                empresa,
                valor,
              }))}
              title="Maiores Gastos por Marina"
              showLegend={false}
              maxBars={5}
              className="mb-6"
            />
          ) : (
            <Card className="mb-6">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground text-center py-2">
                  Nenhuma empresa encontrada
                </p>
              </CardContent>
            </Card>
          )}

          {/* Cards de Insights Úteis */}

        </div>
      ) : (
        /* Aba Lista - Tabela */
        <div className="flex-1 overflow-hidden min-h-0 w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 px-3 md:px-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        ) : itemsParaExibir.length === 0 ? (
          <div className="text-center py-12 px-3 md:px-4">
            <p className="text-muted-foreground">
              Nenhum item encontrado
            </p>
          </div>
        ) : (
          <div 
            className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar h-full w-full relative px-3 md:px-4 pb-3 md:pb-4"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              position: 'relative',
              boxSizing: 'border-box',
              isolation: 'isolate'
            }}
          >
            <Table className="w-full caption-bottom text-xs md:text-sm min-w-[1200px]">
              <TableHeader className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 shadow-md" style={{ position: 'sticky', top: 0 }}>
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
                      if (!isEditing) handleDoubleClick(item);
                    }}
                    onClick={(e) => { if (isEditing) e.stopPropagation(); }}
                  >
                    {activeTipoTab === "produto" ? (
                      <>
                        <TableCell className="text-center text-xs md:text-sm min-w-[120px] px-1">
                          {isEditing ? (
                            <Input value={editingValues.fornecedor || ""} onChange={(e) => handleFieldChange("fornecedor", e.target.value)} onKeyDown={handleKeyDown} onBlur={handleBlur} className="h-8 text-xs md:text-sm text-center" onClick={(e)=>e.stopPropagation()} onMouseDown={(e)=>e.stopPropagation()} />
                          ) : (
                            item.fornecedor || "-"
                          )}
                        </TableCell>
                        <TableCell className="text-center text-xs md:text-sm font-medium min-w-[150px] px-1">
                          {isEditing ? (
                            <Input value={editingValues.produto || ""} onChange={(e) => handleFieldChange("produto", e.target.value)} onKeyDown={handleKeyDown} onBlur={handleBlur} className="h-8 text-xs md:text-sm text-center" onClick={(e)=>e.stopPropagation()} onMouseDown={(e)=>e.stopPropagation()} />
                          ) : (
                            item.produto || "-"
                          )}
                        </TableCell>
                        <TableCell className="text-center text-xs md:text-sm min-w-[200px] px-1">
                          {isEditing ? (
                            <Input value={editingValues.informacoes || ""} onChange={(e) => handleFieldChange("informacoes", e.target.value)} onKeyDown={handleKeyDown} onBlur={handleBlur} className="h-8 text-xs md:text-sm text-center" onClick={(e)=>e.stopPropagation()} onMouseDown={(e)=>e.stopPropagation()} />
                          ) : (
                            item.informacoes || "-"
                          )}
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="text-center text-xs md:text-sm font-medium min-w-[120px]">
                          {isEditing ? (
                            <Input value={editingValues.servico || ""} onChange={(e) => handleFieldChange("servico", e.target.value)} onKeyDown={handleKeyDown} onBlur={handleBlur} className="h-8 text-xs md:text-sm text-center w-full" onClick={(e)=>e.stopPropagation()} onMouseDown={(e)=>e.stopPropagation()} />
                          ) : (
                            <div className="break-words whitespace-normal text-left px-1">{item.servico || "-"}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-xs md:text-sm min-w-[250px]">
                          {isEditing ? (
                            <Input value={editingValues.descricao || ""} onChange={(e) => handleFieldChange("descricao", e.target.value)} onKeyDown={handleKeyDown} onBlur={handleBlur} className="h-8 text-xs md:text-sm text-center w-full" onClick={(e)=>e.stopPropagation()} onMouseDown={(e)=>e.stopPropagation()} />
                          ) : (
                            <div className="break-words whitespace-normal text-left px-1">{item.descricao || "-"}</div>
                          )}
                        </TableCell>
                      </>
                    )}

                    <TableCell className="text-right text-xs md:text-sm min-w-[100px] px-1">
                      {isEditing ? (
                        <Input value={editingValues.empresa || ""} onChange={(e) => handleFieldChange("empresa", e.target.value)} onKeyDown={handleKeyDown} onBlur={handleBlur} className="h-8 text-xs md:text-sm text-right w-full" onClick={(e)=>e.stopPropagation()} onMouseDown={(e)=>e.stopPropagation()} />
                      ) : (
                        item.empresa || "-"
                      )}
                    </TableCell>

                    <TableCell className="text-left text-xs md:text-sm font-mono min-w-[90px] px-1">
                      {isEditing ? (
                        <Input value={editingValues.sc || ""} onChange={(e) => handleFieldChange("sc", e.target.value)} onKeyDown={handleKeyDown} onBlur={handleBlur} className="h-8 text-xs md:text-sm text-left font-mono w-full" onClick={(e)=>e.stopPropagation()} onMouseDown={(e)=>e.stopPropagation()} />
                      ) : (
                        <span 
                          className={cn(
                            isSCDuplicada(item.id, item.sc || "", item.empresa || "") && "bg-yellow-300 dark:bg-yellow-600 px-1 py-0.5 rounded font-semibold"
                          )}
                        >
                          {item.sc || "-"}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-center text-xs md:text-sm min-w-[110px] px-1">
                      {isEditing ? (
                        <Input value={isServico ? (editingValues.data_solicitacao || "") : (editingValues.data_sc || "")} onChange={(e) => handleFieldChange(isServico ? "data_solicitacao" : "data_sc", e.target.value)} onKeyDown={handleKeyDown} onBlur={handleBlur} className="h-8 text-xs md:text-sm text-center w-full" onClick={(e)=>e.stopPropagation()} onMouseDown={(e)=>e.stopPropagation()} />
                      ) : (
                        isServico ? (item.data_solicitacao || "-") : (item.data_sc || "-")
                      )}
                    </TableCell>

                    <TableCell className="text-center text-xs md:text-sm font-mono min-w-[100px] px-1">
                      {isEditing ? (
                        <Input value={editingValues.nota_fiscal || ""} onChange={(e) => handleFieldChange("nota_fiscal", e.target.value)} onKeyDown={handleKeyDown} onBlur={handleBlur} className="h-8 text-xs md:text-sm text-center font-mono" onClick={(e)=>e.stopPropagation()} onMouseDown={(e)=>e.stopPropagation()} />
                      ) : (
                        item.nota_fiscal || "-"
                      )}
                    </TableCell>

                    <TableCell className="text-center text-xs md:text-sm min-w-[110px] px-1">
                      {isEditing ? (
                        <div className="flex gap-1 items-center">
                          <Input value={editingValues.vencimento || ""} onChange={(e) => { const formatted = handleDateInput(e.target.value); handleFieldChange("vencimento", formatted); }} onKeyDown={handleKeyDown} onBlur={handleBlur} placeholder="dd/mm/aaaa" maxLength={10} className="h-8 text-xs md:text-sm text-center flex-1" onClick={(e)=>e.stopPropagation()} onMouseDown={(e)=>e.stopPropagation()} />
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={(e)=>e.stopPropagation()} onMouseDown={(e)=>e.stopPropagation()}>
                                <CalendarIcon className="h-3 w-3" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                              <Calendar mode="single" selected={parseDateBR(editingValues.vencimento as string || "")} onSelect={(date) => { if (date) { const formatted = formatDateBR(date); handleFieldChange("vencimento", formatted); } }} initialFocus locale={ptBR} />
                            </PopoverContent>
                          </Popover>
                        </div>
                      ) : (
                        item.vencimento || "-"
                      )}
                    </TableCell>

                    <TableCell className="text-center text-xs md:text-sm font-medium min-w-[90px] px-1">
                      {isEditing ? (
                        <Input value={editingValues.valor || ""} onChange={(e) => { const formatted = handleCurrencyInput(e.target.value); handleFieldChange("valor", formatted); }} onKeyDown={handleKeyDown} onBlur={(e) => { if (e.target.value) { const formatted = formatCurrency(e.target.value); handleFieldChange("valor", formatted); } handleBlur(e); }} placeholder="R$ 0,00" className="h-8 text-xs md:text-sm text-center" onClick={(e)=>e.stopPropagation()} onMouseDown={(e)=>e.stopPropagation()} />
                      ) : (
                        item.valor ? formatCurrency(item.valor) : "-"
                      )}
                    </TableCell>

                    <TableCell className="text-center text-xs md:text-sm font-mono min-w-[90px] px-1">
                      {isEditing ? (
                        <Input value={editingValues.oc || ""} onChange={(e) => handleFieldChange("oc", e.target.value)} onKeyDown={handleKeyDown} onBlur={handleBlur} className="h-8 text-xs md:text-sm text-center font-mono" onClick={(e)=>e.stopPropagation()} onMouseDown={(e)=>e.stopPropagation()} />
                      ) : (
                        <span>{item.oc || "-"}</span>
                      )}
                    </TableCell>

                    <TableCell className="text-center text-xs md:text-sm min-w-[120px] px-1">
                      {isEditing ? (
                        <Select value={editingValues.situacao || "vazio"} onValueChange={(value) => { const situacaoValue = value === "vazio" ? "" : value; handleFieldChange("situacao", situacaoValue); }} onOpenChange={(open) => { setIsSelectOpen(open); }}>
                          <SelectTrigger className="h-8 text-xs md:text-sm w-full" onClick={(e)=>{ e.stopPropagation(); e.preventDefault(); }} onMouseDown={(e)=>e.stopPropagation()}>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent onClick={(e)=>e.stopPropagation()} onMouseDown={(e)=>e.stopPropagation()}>
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

                    {isEditing && (
                      <div className="absolute left-1/2 -translate-x-1/2 -top-10 z-50 flex gap-2">
                        <Button type="button" size="sm" className="h-8 w-8 p-0 rounded-full shadow-lg bg-green-500 hover:bg-green-600 text-white border-2 border-white dark:border-gray-800" onClick={(e) => { e.stopPropagation(); handleSaveEdit(true); }} title="Salvar alterações"><Check className="h-4 w-4" /></Button>
                        <Button type="button" size="sm" className="h-8 w-8 p-0 rounded-full shadow-lg bg-yellow-500 hover:bg-yellow-600 text-white border-2 border-white dark:border-gray-800" onClick={(e) => { e.stopPropagation(); handleDeleteItem(item); }} title="Deletar item"><Trash2 className="h-4 w-4" /></Button>
                        <Button type="button" size="sm" className="h-8 w-8 p-0 rounded-full shadow-lg bg-red-500 hover:bg-red-600 text-white border-2 border-white dark:border-gray-800" onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }} title="Cancelar edição"><X className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
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
        )}
        </div>
      )}

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
                        if (scValue && scExists(scValue, createFormData.ano, createFormData.empresa)) {
                          toast.error("Esta SC já existe!");
                        }
                      }}
                      required
                      className={createFormData.sc && scExists(createFormData.sc, createFormData.ano, createFormData.empresa) ? "border-red-500 focus-visible:ring-red-500" : ""}
                    />
                    {createFormData.sc && scExists(createFormData.sc, createFormData.ano, createFormData.empresa) && (
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
                        if (scValue && scExists(scValue, createFormData.ano, createFormData.empresa)) {
                          toast.error("Esta SC já existe!");
                        }
                      }}
                      className={createFormData.sc && scExists(createFormData.sc, createFormData.ano, createFormData.empresa) ? "border-red-500 focus-visible:ring-red-500" : ""}
                    />
                    {createFormData.sc && scExists(createFormData.sc, createFormData.ano, createFormData.empresa) && (
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
                      if (scExists(createFormData.sc, createFormData.ano, createFormData.empresa)) {
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

                      // Se criou um serviço, verificar se existe correspondência em despesas recorrentes
                      if (createTipo === "servico") {
                        try {
                          // Recarrega despesas para garantir dados atualizados
                          await loadDespesas();

                          const servicoLower = (formDataToSave.servico || "").toString().toLowerCase().trim();
                          const fornecedorLower = (formDataToSave.fornecedor || "").toString().toLowerCase().trim();
                          const descricaoLower = (formDataToSave.descricao || "").toString().toLowerCase().trim();

                          const matches = despesasRecorrentes.filter(d => {
                            const forn = (d.fornecedor || "").toString().toLowerCase().trim();
                            const desc = (d.desc_servico || "").toString().toLowerCase().trim();
                            return (
                              (forn && fornecedorLower && forn === fornecedorLower) ||
                              (desc && descricaoLower && desc === descricaoLower) ||
                              (desc && servicoLower && desc.includes(servicoLower))
                            );
                          });

                          if (matches.length > 0) {
                            for (const m of matches) {
                              try {
                                await toggleDespesaCheck(m.id, true);
                                // Atualiza estado local rapidamente
                                setDespesasRecorrentes(prev => prev.map(d => d.id === m.id ? { ...d, [getMesAtual()]: 1 } : d));
                                // Notifica outros listeners (modal ou UI) com marina
                                window.dispatchEvent(new CustomEvent('despesa:marcada-automaticamente', { detail: { servico: formDataToSave.servico, marina: m.marina } }));
                              } catch (err) {
                                logger.error('Erro ao marcar despesa automaticamente:', err);
                              }
                            }
                          }
                        } catch (err) {
                          logger.error('Erro ao processar marcação automática de despesas:', err);
                        }
                      }

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

      {/* Modal de Serviços por Mês */}
      <Dialog 
        open={showServicosModal} 
        onOpenChange={(open) => {
          setShowServicosModal(open);
          if (!open) {
            setServicosMesesExibidos(6);
            setServicosMesesExpandidos(new Set());
          }
        }}
      >
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Serviços por Mês</DialogTitle>
            <DialogDescription>
              Lista de serviços agrupados por mês de solicitação
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {servicosPorMes.length === 0 ? (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Nenhum serviço encontrado com data de solicitação
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-2">
                  {servicosPorMes.slice(0, servicosMesesExibidos).map((grupo) => {
                    const isExpanded = servicosMesesExpandidos.has(grupo.mesAno);
                    return (
                      <Card key={grupo.mesAno}>
                        <CardContent className="p-2">
                          <button
                            onClick={() => {
                              setServicosMesesExpandidos(prev => {
                                const newSet = new Set(prev);
                                if (newSet.has(grupo.mesAno)) {
                                  newSet.delete(grupo.mesAno);
                                } else {
                                  newSet.add(grupo.mesAno);
                                }
                                return newSet;
                              });
                            }}
                            className="w-full flex items-center justify-between mb-1.5 hover:bg-muted/50 rounded p-1 -m-1 transition-colors"
                          >
                            <h4 className="text-xs font-semibold text-foreground">
                              {grupo.nomeMes}
                            </h4>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">
                                {grupo.quantidade} {grupo.quantidade === 1 ? 'serviço' : 'serviços'}
                              </span>
                              <span className="font-semibold text-blue-600">
                                {grupo.valorTotal.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                              {grupo.servicos.map((servico) => (
                                <div
                                  key={servico.id}
                                  className="flex items-center justify-between p-1.5 bg-muted/30 rounded text-xs hover:bg-muted/60 hover:shadow-sm transition-colors cursor-pointer"
                                >
                                  <div className="flex-1 min-w-0 pr-2">
                                    <p className="font-medium truncate">
                                      {servico.servico || "-"}
                                    </p>
                                    <p className="text-muted-foreground truncate text-[10px] leading-tight">
                                      {servico.descricao || "-"}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 ml-2 shrink-0">
                                    <span className="text-muted-foreground text-[10px] whitespace-nowrap">
                                      {servico.data_solicitacao || "-"}
                                    </span>
                                    {servico.valor && (
                                      <span className="font-medium text-xs whitespace-nowrap">
                                        {formatCurrency(servico.valor)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                {servicosPorMes.length > servicosMesesExibidos && (
                  <div className="flex justify-center mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setServicosMesesExibidos(prev => prev + 6)}
                      className="gap-2"
                    >
                      Carregar Mais
                      <Badge variant="secondary">
                        {servicosPorMes.length - servicosMesesExibidos} restantes
                      </Badge>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Produtos por Mês */}
      <Dialog 
        open={showProdutosModal} 
        onOpenChange={(open) => {
          setShowProdutosModal(open);
          if (!open) {
            setProdutosMesesExibidos(6);
            setProdutosMesesExpandidos(new Set());
          }
        }}
      >
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Produtos por Mês</DialogTitle>
            <DialogDescription>
              Lista de produtos agrupados por mês de SC
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {produtosPorMes.length === 0 ? (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Nenhum produto encontrado com data de SC
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-2">
                  {produtosPorMes.slice(0, produtosMesesExibidos).map((grupo) => {
                    const isExpanded = produtosMesesExpandidos.has(grupo.mesAno);
                    return (
                      <Card key={grupo.mesAno}>
                        <CardContent className="p-2">
                          <button
                            onClick={() => {
                              setProdutosMesesExpandidos(prev => {
                                const newSet = new Set(prev);
                                if (newSet.has(grupo.mesAno)) {
                                  newSet.delete(grupo.mesAno);
                                } else {
                                  newSet.add(grupo.mesAno);
                                }
                                return newSet;
                              });
                            }}
                            className="w-full flex items-center justify-between mb-1.5 hover:bg-muted/50 rounded p-1 -m-1 transition-colors"
                          >
                            <h4 className="text-xs font-semibold text-foreground">
                              {grupo.nomeMes}
                            </h4>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">
                                {grupo.quantidade} {grupo.quantidade === 1 ? 'prod.' : 'prod.'}
                              </span>
                              <span className="font-semibold text-purple-600">
                                {grupo.valorTotal.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                              {grupo.produtos.map((produto) => (
                                <div
                                  key={produto.id}
                                  className="flex items-center justify-between p-1.5 bg-muted/30 rounded text-xs hover:bg-muted/60 hover:shadow-sm transition-colors cursor-pointer"
                                >
                                  <div className="flex-1 min-w-0 pr-2">
                                    <p className="font-medium truncate">
                                      {produto.produto || "-"}
                                    </p>
                                    <p className="text-muted-foreground truncate text-[10px] leading-tight">
                                      {produto.informacoes || "-"}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 ml-2 shrink-0">
                                    <span className="text-muted-foreground text-[10px] whitespace-nowrap">
                                      {produto.data_sc || "-"}
                                    </span>
                                    {produto.valor && (
                                      <span className="font-medium text-xs whitespace-nowrap">
                                        {formatCurrency(produto.valor)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                {produtosPorMes.length > produtosMesesExibidos && (
                  <div className="flex justify-center mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setProdutosMesesExibidos(prev => prev + 6)}
                      className="gap-2"
                    >
                      Carregar Mais
                      <Badge variant="secondary">
                        {produtosPorMes.length - produtosMesesExibidos} restantes
                      </Badge>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Despesas T.I. - Checklist de SCs */}
      <Dialog open={showDespesasModal} onOpenChange={setShowDespesasModal}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                  Checklist de SCs - {getMesAtual().replace('_', '').toUpperCase()}
                </span>
              </DialogTitle>
              {/* Botão de reset movido para o final do modal (melhor localização) */}
            </div>
          </DialogHeader>

          {loadingDespesas ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Carregando despesas...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Layout em duas colunas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Coluna 1: Despesas Recorrentes */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Wrench className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-bold text-blue-600">Recorrentes</h3>
                      <Badge className="bg-blue-600 text-white hover:bg-blue-700">
                        {despesasRecorrentes.filter(d => isDespesaMarcada(d)).length}/{despesasRecorrentes.length}
                      </Badge>
                    </div>
                    {despesasRecorrentes.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhuma despesa recorrente encontrada
                      </p>
                    ) : (
                      <div className="max-h-[550px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <div className="grid grid-cols-2 gap-2">
                          {despesasRecorrentes.map((despesa) => {
                          const marcada = isDespesaMarcada(despesa);
                          return (
                            <div
                              key={despesa.id}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md",
                                marcada 
                                  ? "bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-600 shadow-sm" 
                                  : "bg-background border-orange-300 dark:border-orange-700 hover:border-orange-400"
                              )}
                              onClick={() => handleToggleDespesa(despesa.id, !marcada)}
                            >
                              <Checkbox
                                checked={marcada}
                                onCheckedChange={(checked) => 
                                  handleToggleDespesa(despesa.id, checked === true)
                                }
                                onClick={(e) => e.stopPropagation()}
                                className="shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className={cn(
                                    "font-medium text-sm",
                                    marcada && "line-through text-muted-foreground"
                                  )}>
                                    {despesa.fornecedor}
                                  </p>
                                  {despesa.marina && (
                                            <Badge 
                                              variant="outline"
                                              className={cn(
                                                "text-[14px] shrink-0 font-semibold px-2 py-0.5",
                                                marcada && "opacity-50"
                                              )}
                                            >
                                              {despesa.marina}
                                            </Badge>
                                          )}
                                </div>
                                <p className={cn(
                                  "text-xs text-muted-foreground",
                                  marcada && "line-through"
                                )}>
                                  {despesa.desc_servico}
                                </p>
                              </div>
                              <Badge 
                                className={cn(
                                  "shrink-0 font-semibold",
                                  marcada 
                                    ? "bg-green-600 text-white hover:bg-green-700" 
                                    : "bg-orange-500 text-white hover:bg-orange-600"
                                )}
                              >
                                {formatCurrency(String(despesa.valor_medio || 0))}
                              </Badge>
                            </div>
                          );
                        })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Coluna 2: Despesas Esporádicas */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      <h3 className="text-lg font-bold text-orange-600">Esporádicas</h3>
                      <Badge className="bg-orange-600 text-white hover:bg-orange-700">
                        {despesasEsporadicas.length}
                      </Badge>
                    </div>
                    {despesasEsporadicas.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhuma despesa esporádica encontrada
                      </p>
                    ) : (
                      <div className="max-h-[550px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <div className="grid grid-cols-2 gap-2">
                          {despesasEsporadicas.map((despesa) => {
                          const valorMes = getValorMesAtual(despesa);
                          return (
                            <div
                              key={despesa.id}
                              className="flex items-center gap-3 p-3 rounded-lg border-2 border-orange-300 dark:border-orange-700 bg-background hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-400 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-sm">
                                    {despesa.fornecedor}
                                  </p>
                                  {despesa.marina && (
                                                    <Badge 
                                                      variant="outline"
                                                      className="text-[14px] shrink-0 font-semibold px-2 py-0.5"
                                                    >
                                                      {despesa.marina}
                                                    </Badge>
                                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {despesa.desc_servico}
                                </p>
                              </div>
                              <Badge className="bg-orange-500 text-white hover:bg-orange-600 shrink-0 font-semibold">
                                {formatCurrency(String(valorMes))}
                              </Badge>
                            </div>
                          );
                        })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Resumo Visual + botão de reset ao lado */}
              <div className="flex items-start gap-4">
                <Card className="flex-1 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-2 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
                          <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                            {despesasRecorrentes.filter(d => isDespesaMarcada(d)).length} SCs criadas
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50"></div>
                          <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                            {despesasRecorrentes.filter(d => !isDespesaMarcada(d)).length} pendentes
                          </span>
                        </div>
                      </div>
                      <p className="text-base font-bold text-blue-600 dark:text-blue-400">
                        Progresso: {Math.round((despesasRecorrentes.filter(d => isDespesaMarcada(d)).length / Math.max(despesasRecorrentes.length, 1)) * 100)}%
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-start">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleResetarChecks}
                    className="gap-2 mt-2"
                  >
                    <X className="w-4 h-4" />
                    Resetar checks
                  </Button>
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação para Marcar Despesa */}
      <AlertDialog open={confirmarMarcacao.open} onOpenChange={(open) => {
        if (!open) {
          setConfirmarMarcacao({ open: false, despesaId: null, despesaNome: null, descricao: null, marina: null });
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Marcação de Despesa</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Você está prestes a marcar a despesa como <strong>SC criada</strong> no mês atual.
              </p>
              <div className="bg-muted p-3 rounded-md mt-3 space-y-2">
                <div>
                  <p className="font-semibold text-sm mb-1">Fornecedor:</p>
                  <p className="text-sm">{confirmarMarcacao.despesaNome}</p>
                </div>
                {confirmarMarcacao.descricao && (
                  <div>
                    <p className="font-semibold text-sm mt-2 mb-1">Descrição:</p>
                    <p className="text-sm text-muted-foreground">{confirmarMarcacao.descricao}</p>
                  </div>
                )}
                {confirmarMarcacao.marina && (
                  <div>
                    <p className="font-semibold text-sm mt-2 mb-1">Marina:</p>
                    <p className="text-sm">{confirmarMarcacao.marina}</p>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Esta ação indica que a Solicitação de Compra (SC) foi criada para este mês.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarMarcarDespesa} className="bg-green-600 hover:bg-green-700">
              Confirmar Marcação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Confirmação para Resetar Checks do Mês */}
      <AlertDialog open={showResetConfirm} onOpenChange={(open) => {
        if (!open) setShowResetConfirm(false);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar checks do mês</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá desmarcar todos os checks das despesas recorrentes para o mês atual. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={performResetConfirmed} className="bg-yellow-600 hover:bg-yellow-700">
              Resetar todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Confirmação para Deletar Item */}
      <AlertDialog open={confirmarDelete.open} onOpenChange={(open) => {
        if (!open) setConfirmarDelete({ open: false, item: null });
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Você está prestes a <strong>deletar</strong> este item. Esta ação não pode ser desfeita.</p>
              {confirmarDelete.item && (
                <div className="bg-muted p-3 rounded-md mt-3 space-y-2">
                  <div>
                    <p className="font-semibold text-sm mb-1">Serviço / Fornecedor:</p>
                    <p className="text-sm">{confirmarDelete.item.servico || confirmarDelete.item.fornecedor || '-'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-sm mt-2 mb-1">SC:</p>
                    <p className="text-sm">{confirmarDelete.item.sc || '-'}</p>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={performDeleteConfirmed} className="bg-red-600 hover:bg-red-700">
              Deletar item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
