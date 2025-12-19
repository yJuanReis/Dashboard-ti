import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
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
  const location = useLocation();
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
  const [servicosMesesExibidos, setServicosMesesExibidos] = useState(6);
  const [produtosMesesExibidos, setProdutosMesesExibidos] = useState(6);
  const [servicosMesesExpandidos, setServicosMesesExpandidos] = useState<Set<string>>(new Set());
  const [produtosMesesExpandidos, setProdutosMesesExpandidos] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

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

  // Função para normalizar nome da empresa (remover acentos e converter para maiúsculo)
  const normalizeEmpresa = (empresa: string): string => {
    if (!empresa) return "";
    return empresa
      .toUpperCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/\s+/g, ' '); // Normaliza espaços
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





  // Carregar dados iniciais
  useEffect(() => {
    loadItems();
    loadConfigSolicitacoes();
  }, []);

  // Abrir diálogo de criação automaticamente se query param ?new=1 estiver presente
  useEffect(() => {
    try {
      const q = new URLSearchParams(location.search);
      if (q.get("new") === "1") {
        setCreateTipo(null);
        setShowCreateDialog(true);
      }
    } catch (err) {
      console.warn('Erro ao processar query params:', err);
    }
  }, [location.search]);

  // Carregar configurações de solicitações (removido - não será mais usado)
  const loadConfigSolicitacoes = async () => {
    // Removido: lógica de auto-preenchimento inteligente
  };

  // Removido: lógica de filtragem de configurações inteligentes

  const servicosUnicos = useMemo(() => {
    if (activeTipoTab === "servico") {
      return Array.from(new Set(items.filter((i) => i.tipo === "servico").map((i) => i.servico).filter(Boolean))).sort();
    }
    return [];
  }, [items, activeTipoTab]);
  
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
      setSearchTerm(custom.detail || "");
    };

    const handleServicoFilterFromHeader = (event: Event) => {
      const custom = event as CustomEvent<string>;
      setServicoFilter(custom.detail || "todos");
    };

    const handleAnoFilterFromHeader = (event: Event) => {
      const custom = event as CustomEvent<string>;
      setAnoFilter(custom.detail || "todos");
    };

    const handleToggleDuplicados = (event: Event) => {
      const custom = event as CustomEvent<boolean>;
      setShowDuplicados(custom.detail || false);
    };

    const handleTipoTabFromHeader = (event: Event) => {
      const custom = event as CustomEvent<"servico" | "produto">;
      setActiveTipoTab(custom.detail === "produto" ? "produto" : "servico");
    };

    const handleMainTabFromHeader = (event: Event) => {
      const custom = event as CustomEvent<"lista" | "central">;
      setActiveMainTab(custom.detail === "central" ? "central" : "lista");
    };

    const handleOpenCreateDialog = () => {
      setCreateTipo(null);
      setCreateFormData({});
      setConfigsFiltradas([]);
      setShowCreateDialog(true);
    };

    const handleClearFilters = () => {
      setSearchTerm("");
      setServicoFilter("todos");
      setAnoFilter("todos");
    };

    const sendOptionsToLayout = () => {
      window.dispatchEvent(new CustomEvent("solicitacoes:setServicoOptions", { detail: servicosUnicos }));
      window.dispatchEvent(new CustomEvent("solicitacoes:setAnoOptions", { detail: anosDisponiveis.map(a => a?.toString() || "").filter(Boolean) }));
    };

    window.addEventListener("solicitacoes:setSearch", handleSearchFromHeader);
    window.addEventListener("solicitacoes:setServicoFilter", handleServicoFilterFromHeader);
    window.addEventListener("solicitacoes:setAnoFilter", handleAnoFilterFromHeader);
    window.addEventListener("solicitacoes:toggleDuplicados", handleToggleDuplicados);
    window.addEventListener("solicitacoes:setTipoTab", handleTipoTabFromHeader);
    window.addEventListener("solicitacoes:setMainTab", handleMainTabFromHeader);
    window.addEventListener("solicitacoes:openCreateDialog", handleOpenCreateDialog);
    window.addEventListener("solicitacoes:clearFilters", handleClearFilters);

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

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("solicitacoes:tipoTabChanged", { detail: activeTipoTab }));
  }, [activeTipoTab]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("solicitacoes:mainTabChanged", { detail: activeMainTab }));
  }, [activeMainTab]);

  useEffect(() => {
    if (!loading && items.length > 0 && anoFilter === "todos") {
      const anosDoTipo = Array.from(new Set(items.filter((i) => i.tipo === activeTipoTab).map((i) => i.ano).filter(Boolean))).sort((a, b) => (b || 0) - (a || 0));
      if (anosDoTipo.length > 0) {
        const anoMaisRecente = anosDoTipo[0]?.toString();
        if (anoMaisRecente) {
          setAnoFilter(anoMaisRecente);
          window.dispatchEvent(new CustomEvent("solicitacoes:setAnoFilter", { detail: anoMaisRecente }));
        }
      }
    }
  }, [activeTipoTab, loading, items.length]);

  // Enviar estado de loading para o Layout
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("solicitacoes:loadingChanged", { detail: loading }));
  }, [loading]);

  // Ouvir evento de loadItems do Layout
  useEffect(() => {
    const handleLoadItemsFromHeader = () => {
      loadItems();
    };

    window.addEventListener("solicitacoes:loadItems", handleLoadItemsFromHeader);
    return () => {
      window.removeEventListener("solicitacoes:loadItems", handleLoadItemsFromHeader);
    };
  }, []);

  const extractNumbers = (value: string): string => {
    return value.replace(/\D/g, '');
  };

  const idsDuplicados = useMemo(() => {
    const scPorEmpresa = new Map<string, Set<string>>();
    items.forEach((item) => {
      if (!item.sc || !item.empresa) return;
      const normalizedSC = extractNumbers(item.sc);
      if (!normalizedSC) return;
      const empresa = normalizeEmpresa(item.empresa);
      const key = `${empresa}|${normalizedSC}`;
      if (!scPorEmpresa.has(key)) scPorEmpresa.set(key, new Set());
      scPorEmpresa.get(key)!.add(item.id);
    });

    const idsDuplicadosSet = new Set<string>();
    scPorEmpresa.forEach((ids) => {
      if (ids.size > 1) ids.forEach(id => idsDuplicadosSet.add(id));
    });
    return idsDuplicadosSet;
  }, [items]);

  const isSCDuplicada = (itemId: string, sc: string, empresa: string): boolean => {
    if (!sc || !empresa) return false;
    return idsDuplicados.has(itemId);
  };

  const filteredAndSortedItems = [...items]
    .filter((item) => {
      const matchesTipo = item.tipo === activeTipoTab;
      const matchesAno = anoFilter === "todos" || item.ano?.toString() === anoFilter;
      const matchesSearch = !searchTerm || `${item.servico || ""} ${item.produto || ""} ${item.descricao || ""} ${item.informacoes || ""} ${item.empresa || ""} ${item.sc || ""} ${item.situacao || ""} ${item.nota_fiscal || ""} ${item.oc || ""} ${item.fornecedor || ""}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesServico = activeTipoTab === "produto" || servicoFilter === "todos" || item.servico === servicoFilter;
      const matchesDuplicados = !showDuplicados || (showDuplicados && isSCDuplicada(item.id, item.sc || "", item.empresa || ""));
      return matchesTipo && matchesAno && matchesSearch && matchesServico && matchesDuplicados;
    })
    .sort((a, b) => {
      if (!sortField) {
        if (a.created_at && b.created_at) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (a.created_at) return -1;
        if (b.created_at) return 1;
        const dataA = a.data_solicitacao || a.data_sc || "";
        const dataB = b.data_solicitacao || b.data_sc || "";
        const parseDate = (dateStr: string): number => {
          if (!dateStr) return 0;
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            let year = parseInt(parts[2], 10);
            if (year < 100) year += 2000;
            const date = new Date(year, parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
            if (!isNaN(date.getTime())) return date.getTime();
          }
          const isoDate = new Date(dateStr);
          if (!isNaN(isoDate.getTime())) return isoDate.getTime();
          return 0;
        };
        return parseDate(dataB) - parseDate(dataA);
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

      const compare = String(fieldA).localeCompare(String(fieldB), "pt-BR", { numeric: true });
      return sortDirection === "asc" ? compare : -compare;
    });

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
    
    const paga = items.filter(i => i.situacao === "paga").length;
    const cancelada = items.filter(i => i.situacao === "cancelado").length;
    const pendente = items.filter(i => !i.situacao || i.situacao === "?").length;
    const valorPaga = items.filter(i => i.situacao === "paga").reduce((sum, i) => sum + calcularValor(i), 0);
    const valorPendente = items.filter(i => !i.situacao || i.situacao === "?").reduce((sum, i) => sum + calcularValor(i), 0);
    const valorCancelada = items.filter(i => i.situacao === "cancelado").reduce((sum, i) => sum + calcularValor(i), 0);

    const empresasMap = new Map<string, number>();
    items.forEach(item => {
      if (item.empresa && calcularValor(item) > 0) {
        const empresa = item.empresa.trim();
        const isOnlyNumbers = /^\d+$/.test(empresa);
        if (!isOnlyNumbers && empresa.length > 2 && empresa !== item.sc) {
          const atual = empresasMap.get(empresa) || 0;
          empresasMap.set(empresa, atual + calcularValor(item));
        }
      }
    });
    const topEmpresas = Array.from(empresasMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

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

    const anos = Array.from(new Set(items.map(i => i.ano).filter(Boolean))).sort((a, b) => (b || 0) - (a || 0));
    const semValor = items.filter(i => calcularValor(i) === 0).length;
    const taxaPreenchimento = items.length > 0 ? ((items.length - semValor) / items.length * 100) : 0;
    
    const distribuicaoAno = new Map<number, number>();
    items.forEach(item => {
      if (item.ano) distribuicaoAno.set(item.ano, (distribuicaoAno.get(item.ano) || 0) + 1);
    });
    const topAno = Array.from(distribuicaoAno.entries()).sort((a, b) => b[1] - a[1])[0] || [null, 0];

    const empresasQtdMap = new Map<string, number>();
    items.forEach(item => {
      if (item.empresa) empresasQtdMap.set(item.empresa, (empresasQtdMap.get(item.empresa) || 0) + 1);
    });
    const topEmpresasQtd = Array.from(empresasQtdMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);

    const servicosFreqMap = new Map<string, number>();
    servicos.forEach(item => {
      if (item.servico) servicosFreqMap.set(item.servico, (servicosFreqMap.get(item.servico) || 0) + 1);
    });
    const topServicosFreq = Array.from(servicosFreqMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);

    const comOC = items.filter(i => i.oc && i.oc.trim() !== "").length;
    const semOC = items.length - comOC;
    const comNF = items.filter(i => i.nota_fiscal && i.nota_fiscal.trim() !== "").length;
    const semNF = items.length - comNF;

    const mesesComItens = new Set<string>();
    items.forEach(item => {
      const data = item.tipo === "servico" ? item.data_solicitacao : item.data_sc;
      if (data) {
        const parts = data.split('/');
        if (parts.length === 3) {
          let ano = parseInt(parts[2], 10);
          if (ano < 100) ano += 2000;
          mesesComItens.add(`${ano}-${parts[1]}`);
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
      paga, cancelada, pendente, valorPaga, valorPendente, valorCancelada,
      semValor, taxaPreenchimento, topAno: topAno[0] ? { ano: topAno[0], quantidade: topAno[1] } : null,
      topEmpresasQtd, topServicosFreq, comOC, semOC, comNF, semNF, mediaItensMes, mesesComItens: mesesComItens.size,
    };
  }, [items]);

  const servicosPorMes = useMemo(() => {
    const servicos = items.filter((i) => i.tipo === "servico" && i.data_solicitacao);
    
    const extrairMesAno = (dataStr: string): string | null => {
      if (!dataStr) return null;
      const parts = dataStr.split('/');
      if (parts.length === 3) {
        const mes = parseInt(parts[1], 10);
        let ano = parseInt(parts[2], 10);
        if (ano < 100) ano += 2000;
        if (!isNaN(mes) && !isNaN(ano) && mes >= 1 && mes <= 12) {
          const date = new Date(ano, mes - 1, 1);
          return `${ano}-${String(mes).padStart(2, '0')}`;
        }
      }
      return null;
    };

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

    return Array.from(agrupados.values()).sort((a, b) => b.mesAno.localeCompare(a.mesAno));
  }, [items]);

  const produtosPorMes = useMemo(() => {
    const produtos = items.filter((i) => i.tipo === "produto" && i.data_sc);
    
    const extrairMesAno = (dataStr: string): string | null => {
      if (!dataStr) return null;
      const parts = dataStr.split('/');
      if (parts.length === 3) {
        const mes = parseInt(parts[1], 10);
        let ano = parseInt(parts[2], 10);
        if (ano < 100) ano += 2000;
        if (!isNaN(mes) && !isNaN(ano) && mes >= 1 && mes <= 12) {
          const date = new Date(ano, mes - 1, 1);
          return `${ano}-${String(mes).padStart(2, '0')}`;
        }
      }
      return null;
    };

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

    return Array.from(agrupados.values()).sort((a, b) => b.mesAno.localeCompare(a.mesAno));
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
    setEditingValues({ ...item });
  };

  const handleCancelEdit = () => {
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
    if (!item) return;
    setConfirmarDelete({ open: true, item });
  };

  const convertTextFieldsToUpperCase = (data: any): any => {
    const fieldsToUpperCase = [
      'servico', 'descricao', 'empresa', 'sc', 'nota_fiscal',
      'oc', 'situacao', 'fornecedor', 'produto', 'informacoes'
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
      let dbId = (item as any)._dbId;
      if (!dbId && item.id) {
        const match = item.id.match(/^(servico|produto)_(\d+)_/);
        if (match) dbId = match[2];
      }
      
      if (!dbId) {
        toast.error("Não foi possível identificar o ID do item");
        return;
      }
      
      const updates: any = { ...editingValues };
      delete updates.id;
      delete updates.tipo;
      delete updates._dbId;

      if (updates.valor) {
        updates.valor = currencyToString(updates.valor as string);
      }

      const normalizedUpdates = convertTextFieldsToUpperCase(updates);

      if (item.tipo === "servico") {
        await updateServico(dbId, normalizedUpdates);
      } else {
        await updateProduto(dbId, normalizedUpdates);
      }

      setItems((prevItems) =>
        prevItems.map((i) =>
          i.id === item.id ? { ...i, ...normalizedUpdates } : i
        )
      );

      toast.success("Item atualizado com sucesso!");
      handleCancelEdit();
      
      if (!skipReload) await loadItems();
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

  const handleBlur = (e: React.FocusEvent) => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setEditingValues((prev) => ({
      ...prev,
      [field]: value || undefined,
    }));
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-50" />;
    return sortDirection === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  const scExists = (sc: string, ano?: number | string | null, empresa?: string | null): boolean => {
    if (!sc) return false;
    const normalizedSC = extractNumbers(sc);
    if (!normalizedSC) return false;

    return items.some((item) => {
      if (!item.sc) return false;
      const itemNormalized = extractNumbers(item.sc);
      if (itemNormalized !== normalizedSC) return false;

      if (ano !== undefined && ano !== null) {
        const itemAno = item.ano ? String(item.ano) : '';
        if (String(ano) !== itemAno) return false;
      }

      if (empresa) {
        const itemEmpresa = item.empresa ? normalizeEmpresa(item.empresa) : '';
        const paramEmpresa = normalizeEmpresa(empresa);
        if (itemEmpresa && itemEmpresa !== paramEmpresa) return false;
      }

      return true;
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!createTipo) {
      toast.error("Selecione um tipo (Serviço ou Produto)");
      return;
    }

    if (createTipo === "servico") {
      if (!createFormData.servico || !createFormData.descricao || !createFormData.empresa || !createFormData.sc) {
        toast.error("Preencha todos os campos obrigatórios: Serviço, Descrição, Empresa e SC");
        return;
      }
    }

    if (createFormData.sc && scExists(createFormData.sc, createFormData.ano, createFormData.empresa)) {
      toast.error(`⚠️ SC duplicada! Esta SC já foi lançada na empresa ${normalizeEmpresa(createFormData.empresa || '')}. Cada empresa deve ter SCs únicas.`, {
        style: {
          background: '#fee2e2',
          color: '#dc2626',
          border: '1px solid #fca5a5'
        }
      });
      return;
    }

    try {
      setIsCreating(true);

      let formDataToSave = { ...createFormData };

      if (formDataToSave.valor) {
        formDataToSave.valor = currencyToString(formDataToSave.valor);
      }

      formDataToSave = convertTextFieldsToUpperCase(formDataToSave);

      if (createTipo === "servico") {
        await createServico(formDataToSave);
        toast.success("Serviço criado com sucesso!");
      } else {
        await createProduto(formDataToSave);
        toast.success("Produto criado com sucesso!");
      }

      setShowCreateDialog(false);
      setCreateTipo(null);
      setCreateFormData({});
      setConfigsFiltradas([]);
      await loadItems();

    } catch (error) {
      console.error("Erro ao criar item:", error);
      toast.error("Erro ao criar item");
    } finally {
      setIsCreating(false);
    }
  };

  const itemsParaExibir = useMemo(() => {
    return filteredAndSortedItems.slice(0, displayedCount);
  }, [filteredAndSortedItems, displayedCount]);

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
                      {isEditing && (
                        <div className="absolute left-1/2 -translate-x-1/2 -top-10 z-50 flex gap-2">
                          <Button type="button" size="sm" className="h-8 w-8 p-0 rounded-full shadow-lg bg-green-500 hover:bg-green-600 text-white border-2 border-white dark:border-gray-800" onClick={(e) => { e.stopPropagation(); handleSaveEdit(true); }} title="Salvar alterações"><Check className="h-4 w-4" /></Button>
                          <Button type="button" size="sm" className="h-8 w-8 p-0 rounded-full shadow-lg bg-yellow-500 hover:bg-yellow-600 text-white border-2 border-white dark:border-gray-800" onClick={(e) => { e.stopPropagation(); handleDeleteItem(item); }} title="Deletar item"><Trash2 className="h-4 w-4" /></Button>
                          <Button type="button" size="sm" className="h-8 w-8 p-0 rounded-full shadow-lg bg-red-500 hover:bg-red-600 text-white border-2 border-white dark:border-gray-800" onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }} title="Cancelar edição"><X className="h-4 w-4" /></Button>
                        </div>
                      )}
                    </TableCell>
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="servico">
                      Serviço <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="servico"
                      value={createFormData.servico || ""}
                      onChange={(e) => setCreateFormData({ ...createFormData, servico: e.target.value })}
                      placeholder="Digite o serviço..."
                      required
                      className="bg-background border-2 shadow-sm focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="empresa">
                      Empresa <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={createFormData.empresa || ""}
                      onValueChange={(value) => setCreateFormData({ ...createFormData, empresa: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a marina..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BOA VISTA">BOA VISTA</SelectItem>
                        <SelectItem value="BRACUHY">BRACUHY</SelectItem>
                        <SelectItem value="PICCOLA">PICCOLA</SelectItem>
                        <SelectItem value="BÚZIOS">BÚZIOS</SelectItem>
                        <SelectItem value="ITACURUÇÁ">ITACURUÇÁ</SelectItem>
                        <SelectItem value="MARINA DA GLÓRIA">MARINA DA GLÓRIA</SelectItem>
                        <SelectItem value="PARATY">PARATY</SelectItem>
                        <SelectItem value="PIRATAS">PIRATAS</SelectItem>
                        <SelectItem value="RIBEIRA">RIBEIRA</SelectItem>
                        <SelectItem value="VEROLME">VEROLME</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="descricao">
                      Descrição <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="descricao"
                      value={createFormData.descricao || ""}
                      onChange={(e) => setCreateFormData({ ...createFormData, descricao: e.target.value })}
                      required
                      placeholder="Digite a descrição..."
                      className="bg-background border-2 shadow-sm focus:ring-2 focus:ring-primary/20"
                    />
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
                          toast.error(`Esta SC já foi lançada na ${createFormData.empresa}. Cada empresa deve ter SCs únicas.`);
                        }
                      }}
                      required
                      className={`bg-background border-2 shadow-sm focus:ring-2 focus:ring-primary/20 ${createFormData.sc && scExists(createFormData.sc, createFormData.ano, createFormData.empresa) ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                    {createFormData.sc && scExists(createFormData.sc, createFormData.ano, createFormData.empresa) && (
                      <p className="text-xs text-red-500">Esta SC já foi lançada na {createFormData.empresa}. Cada empresa deve ter SCs únicas.</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nota_fiscal">Nota Fiscal</Label>
                    <Input
                      id="nota_fiscal"
                      value={createFormData.nota_fiscal || ""}
                      onChange={(e) => setCreateFormData({ ...createFormData, nota_fiscal: e.target.value })}
                      className="bg-background border-2 shadow-sm focus:ring-2 focus:ring-primary/20"
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
                        className="flex-1 bg-background border-2 shadow-sm focus:ring-2 focus:ring-primary/20"
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
                      className="bg-background border-2 shadow-sm focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="oc">OC</Label>
                    <Input
                      id="oc"
                      value={createFormData.oc || ""}
                      onChange={(e) => setCreateFormData({ ...createFormData, oc: e.target.value })}
                      className="bg-background border-2 shadow-sm focus:ring-2 focus:ring-primary/20"
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
                      <SelectTrigger className="bg-background border-2 shadow-sm focus:ring-2 focus:ring-primary/20">
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
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fornecedor">Fornecedor</Label>
                    <Input
                      id="fornecedor"
                      value={createFormData.fornecedor || ""}
                      onChange={(e) => setCreateFormData({ ...createFormData, fornecedor: e.target.value })}
                      className="bg-background border-2 shadow-sm focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="empresa">Empresa</Label>
                    <Select
                      value={createFormData.empresa || ""}
                      onValueChange={(value) => setCreateFormData({ ...createFormData, empresa: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a marina..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BOA VISTA">BOA VISTA</SelectItem>
                        <SelectItem value="BRACUHY">BRACUHY</SelectItem>
                        <SelectItem value="PICCOLA">PICCOLA</SelectItem>
                        <SelectItem value="BÚZIOS">BÚZIOS</SelectItem>
                        <SelectItem value="ITACURUÇÁ">ITACURUÇÁ</SelectItem>
                        <SelectItem value="MARINA DA GLÓRIA">MARINA DA GLÓRIA</SelectItem>
                        <SelectItem value="PARATY">PARATY</SelectItem>
                        <SelectItem value="PIRATAS">PIRATAS</SelectItem>
                        <SelectItem value="RIBEIRA">RIBEIRA</SelectItem>
                        <SelectItem value="VEROLME">VEROLME</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="produto">Produto</Label>
                    <Input
                      id="produto"
                      value={createFormData.produto || ""}
                      onChange={(e) => setCreateFormData({ ...createFormData, produto: e.target.value })}
                      className="bg-background border-2 shadow-sm focus:ring-2 focus:ring-primary/20"
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
                      className={`bg-background border-2 shadow-sm focus:ring-2 focus:ring-primary/20 ${createFormData.sc && scExists(createFormData.sc, createFormData.ano, createFormData.empresa) ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                    {createFormData.sc && scExists(createFormData.sc, createFormData.ano, createFormData.empresa) && (
                      <p className="text-xs text-red-500">Esta SC já foi lançada na {createFormData.empresa}. Cada empresa deve ter SCs únicas.</p>
                    )}
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="informacoes">Informações</Label>
                    <Input
                      id="informacoes"
                      value={createFormData.informacoes || ""}
                      onChange={(e) => setCreateFormData({ ...createFormData, informacoes: e.target.value })}
                      className="bg-background border-2 shadow-sm focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nota_fiscal">Nota Fiscal</Label>
                    <Input
                      id="nota_fiscal"
                      value={createFormData.nota_fiscal || ""}
                      onChange={(e) => setCreateFormData({ ...createFormData, nota_fiscal: e.target.value })}
                      className="bg-background border-2 shadow-sm focus:ring-2 focus:ring-primary/20"
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
                        className="flex-1 bg-background border-2 shadow-sm focus:ring-2 focus:ring-primary/20"
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
                </div>
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
              onClick={handleCreateSubmit}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                `Criar ${createTipo === "servico" ? "Serviço" : "Produto"}`
              )}
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
