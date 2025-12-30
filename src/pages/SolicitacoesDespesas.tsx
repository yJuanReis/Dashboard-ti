import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  CheckCircle,
  Clock,
  TrendingUp,
  Building2,
  AlertTriangle,
  Check,
  Calendar as CalendarIcon,
} from "lucide-react";
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
  fetchDespesasRecorrentesSimplificado,
  atualizarStatusDespesaRecorrente,
  type DespesaRecorrente,
  deveMostrarAvisoReset,
  getMensagemAvisoReset,
} from "@/lib/despesasService";
import { OrcamentoService } from "@/lib/configuracoesService";
import { useSidebar } from "@/components/ui/sidebar";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SolicitacoesDespesas() {
  const { isMobile } = useSidebar();

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

  // Estados para Solicitações (copiados da página original)
  const [items, setItems] = useState<ServicoProduto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [servicoFilter, setServicoFilter] = useState<string>("todos");
  const [anoFilter, setAnoFilter] = useState<string>("todos");
  const [activeTipoTab, setActiveTipoTab] = useState<"servico" | "produto">("servico");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createTipo, setCreateTipo] = useState<"servico" | "produto" | null>(null);
  const [createFormData, setCreateFormData] = useState<any>({});
  const [isCreating, setIsCreating] = useState(false);

  // Estados para edição inline
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Partial<ServicoProduto>>({});
  const [confirmarDelete, setConfirmarDelete] = useState<{ open: boolean; item: ServicoProduto | null }>({ open: false, item: null });

  // Estados para Despesas Recorrentes
  const [despesas, setDespesas] = useState<DespesaRecorrente[]>([]);
  const [loadingDespesas, setLoadingDespesas] = useState(false);

  // Estados da página unificada
  const [activeMainTab, setActiveMainTab] = useState<"checklist" | "solicitacoes" | "central">("solicitacoes");

  // Estados para filtros do header
  const [comprasDespesasTesteSearch, setComprasDespesasTesteSearch] = useState("");
  const [comprasDespesasTesteTipo, setComprasDespesasTesteTipo] = useState<"servico" | "produto">("servico");
  const [comprasDespesasTesteAno, setComprasDespesasTesteAno] = useState("todos");
  const [comprasDespesasTesteAnoOptions, setComprasDespesasTesteAnoOptions] = useState<string[]>([]);

  // Estados para duplicados
  const [duplicados, setDuplicados] = useState<any[]>([]);
  const [loadingDuplicados, setLoadingDuplicados] = useState(false);

  // Estados para modais
  const [showLancarSCModal, setShowLancarSCModal] = useState(false);
  const [showImportDespesaModal, setShowImportDespesaModal] = useState(false);
  const [showCreateDespesaModal, setShowCreateDespesaModal] = useState(false);
  const [lancarSCFormData, setLancarSCFormData] = useState<any>({});
  const [importDespesaFormData, setImportDespesaFormData] = useState<any>({});
  const [createDespesaFormData, setCreateDespesaFormData] = useState<any>({});
  const [isLancandoSC, setIsLancandoSC] = useState(false);
  const [isImportandoDespesa, setIsImportandoDespesa] = useState(false);
  const [isCriandoDespesa, setIsCriandoDespesa] = useState(false);

  // Estados para cancelar lançamento
  const [confirmarCancelarLancamento, setConfirmarCancelarLancamento] = useState<{ open: boolean; despesa: DespesaRecorrente | null }>({ open: false, despesa: null });
  const [isCancelandoLancamento, setIsCancelandoLancamento] = useState(false);

  // Estados para edição de despesa
  const [showEditDespesaModal, setShowEditDespesaModal] = useState(false);
  const [despesaEdit, setDespesaEdit] = useState<DespesaRecorrente | null>(null);
  const [formEditDespesa, setFormEditDespesa] = useState<any>({});
  const [isSalvandoEditDespesa, setIsSalvandoEditDespesa] = useState(false);

  // Estado para aviso de reset mensal
  const [mostrarAviso, setMostrarAviso] = useState(false);

  // Estados para autocomplete do modal de criação
  const [servicosAutocomplete, setServicosAutocomplete] = useState<string[]>([]);
  const [descricoesAutocomplete, setDescricoesAutocomplete] = useState<string[]>([]);
  const [fornecedoresAutocomplete, setFornecedoresAutocomplete] = useState<string[]>([]);
  const [produtosAutocomplete, setProdutosAutocomplete] = useState<string[]>([]);

  // Estado para controle do modo de adição de fornecedor
  const [modoAdicaoFornecedor, setModoAdicaoFornecedor] = useState(false);

  // Estados para orçamento dinâmico
  const [orcamentoTotal, setOrcamentoTotal] = useState(150000); // fallback
  const [carregandoOrcamento, setCarregandoOrcamento] = useState(false);

  // Estados para adicionar nova conta contábil
  const [showAdicionarContaModal, setShowAdicionarContaModal] = useState(false);
  const [novaContaFormData, setNovaContaFormData] = useState({
    codigo: '',
    nome: '',
    orcamento: ''
  });
  const [contasContabeis, setContasContabeis] = useState([
    { codigo: '607', nome: 'Manutenção e Equipamentos', orcamento: 80000 },
    { codigo: '140', nome: 'Novos Projetos', orcamento: 50000 },
    { codigo: '999', nome: 'Outros / Diversos', orcamento: 20000 }
  ]);

  // Estado para edição inline do orçamento
  const [editandoOrcamento, setEditandoOrcamento] = useState(false);
  const [valorOrcamentoEditado, setValorOrcamentoEditado] = useState('');

  // Funções para edição inline do orçamento
  const iniciarEdicaoOrcamento = () => {
    setValorOrcamentoEditado(formatCurrency(orcamentoTotal.toString()));
    setEditandoOrcamento(true);
  };

  const salvarOrcamento = async () => {
    if (!valorOrcamentoEditado.trim()) {
      toast.error('Valor não pode ser vazio!');
      return;
    }

    const valorNumerico = parseFloat(currencyToString(valorOrcamentoEditado));
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      toast.error('Digite um valor válido!');
      return;
    }

    try {
      // Aqui você implementaria a lógica para salvar no banco
      // Por exemplo: await OrcamentoService.atualizarOrcamentoTotal(valorNumerico);
      toast.success('Orçamento atualizado com sucesso!');
      setEditandoOrcamento(false);
      setValorOrcamentoEditado('');
      // Simular atualização do valor
      loadOrcamento(); // Recarregar para mostrar o valor atualizado
    } catch (error) {
      logger.error('Erro ao salvar orçamento:', error);
      toast.error('Erro ao salvar orçamento');
    }
  };

  const cancelarEdicaoOrcamento = () => {
    setEditandoOrcamento(false);
    setValorOrcamentoEditado('');
  };

  // Carregar opções de autocomplete quando o componente monta
  useEffect(() => {
    const carregarOpcoesAutocomplete = async () => {
      try {
        const { buscarServicosParaAutocomplete, buscarDescricoesParaAutocomplete } = await import('@/lib/servicosProdutosService');

        // Carregar serviços para todas as empresas
        const empresas = ["BOA VISTA", "BRACUHY", "PICCOLA", "BÚZIOS", "ITACURUÇÁ", "GLÓRIA", "PARATY", "PIRATAS", "RIBEIRA", "VEROLME"];
        const todosServicos = new Set<string>();

        for (const empresa of empresas) {
          const servicos = await buscarServicosParaAutocomplete(empresa);
          servicos.forEach(s => todosServicos.add(s));
        }

        setServicosAutocomplete(Array.from(todosServicos).sort());

        // Para descrições, vamos usar os apelidos das despesas recorrentes (que aparecem na coluna "Serviço")
        const todasDescricoes = new Set<string>();
        if (despesas.length > 0) {
          despesas.forEach(d => {
            if (d.apelido && d.apelido.trim()) {
              todasDescricoes.add(d.apelido.trim());
            }
          });
        }

        setDescricoesAutocomplete(Array.from(todasDescricoes).sort());

        // Carregar fornecedores e produtos da tabela de produtos
        const produtosData = items.filter(item => item.tipo === 'produto');
        const fornecedoresUnicos = new Set<string>();
        const produtosUnicos = new Set<string>();

        produtosData.forEach(produto => {
          if (produto.fornecedor && produto.fornecedor.trim()) {
            fornecedoresUnicos.add(produto.fornecedor.trim());
          }
          if (produto.produto && produto.produto.trim()) {
            produtosUnicos.add(produto.produto.trim());
          }
        });

        setFornecedoresAutocomplete(Array.from(fornecedoresUnicos).sort());
        setProdutosAutocomplete(Array.from(produtosUnicos).sort());

      } catch (error) {
        logger.error('Erro ao carregar opções de autocomplete:', error);
      }
    };

    carregarOpcoesAutocomplete();
  }, [despesas, items]);

  // Filtros para solicitações
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

  // Carregar dados iniciais
  useEffect(() => {
    loadItems();
    loadDespesas();
    loadOrcamento();
  }, []);

  // Função para carregar orçamento do banco
  const loadOrcamento = async () => {
    try {
      setCarregandoOrcamento(true);
      const valor = await OrcamentoService.buscarOrcamentoTotal();
      setOrcamentoTotal(valor);
      logger.log(`Orçamento carregado: R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    } catch (error) {
      logger.error('Erro ao carregar orçamento:', error);
      // Mantém o valor padrão em caso de erro
      setOrcamentoTotal(150000);
    } finally {
      setCarregandoOrcamento(false);
    }
  };

  // Verificar aviso de reset mensal
  useEffect(() => {
    setMostrarAviso(deveMostrarAvisoReset());
  }, []);

  // Event listeners para comunicação com o header
  useEffect(() => {
    const handleOpenImportDespesaModal = () => {
      setImportDespesaFormData({
        apelido: '',
        tipo: 'servico',
        match_empresa: '',
        match_texto: '',
        dia_vencimento: new Date().getDate(),
        valor_estimado: '',
        recorrencia: 'Mensal',
        descricao_padrao: ''
      });
      setShowImportDespesaModal(true);
    };

    const handleOpenCreateDialog = () => {
      setCreateTipo(null);
      setCreateFormData({});
      setShowCreateDialog(true);
    };

    const handleOpenCreateDespesaModal = () => {
      setCreateDespesaFormData({
        apelido: '',
        tipo: 'servico',
        match_empresa: '',
        match_texto: '',
        dia_vencimento: new Date().getDate(),
        valor_estimado: '',
        recorrencia: 'Mensal',
        recorrencia_personalizada: '',
        descricao_padrao: ''
      });
      setShowCreateDespesaModal(true);
    };

    const handleSetSearch = (event: Event) => {
      const custom = event as CustomEvent<string>;
      setComprasDespesasTesteSearch(custom.detail || "");
    };

    const handleSetTipo = (event: Event) => {
      const custom = event as CustomEvent<string>;
      setComprasDespesasTesteTipo(custom.detail === "produto" ? "produto" : "servico");
    };

    const handleSetAno = (event: Event) => {
      const custom = event as CustomEvent<string>;
      setComprasDespesasTesteAno(custom.detail || "todos");
    };

    const handleClearFilters = () => {
      setComprasDespesasTesteSearch("");
      setComprasDespesasTesteTipo("servico");
      setComprasDespesasTesteAno("todos");
    };

    const handleSetAnoOptions = (event: Event) => {
      const custom = event as CustomEvent<string[]>;
      setComprasDespesasTesteAnoOptions(custom.detail || []);
    };

    const handleActiveTabChanged = (event: Event) => {
      const custom = event as CustomEvent<"checklist" | "solicitacoes" | "central">;
      setActiveMainTab(custom.detail || "checklist");
    };

    window.addEventListener("compras-despesas-teste:openImportDespesaModal", handleOpenImportDespesaModal);
    window.addEventListener("compras-despesas-teste:openCreateDialog", handleOpenCreateDialog);
    window.addEventListener("compras-despesas-teste:openCreateDespesaModal", handleOpenCreateDespesaModal);
    window.addEventListener("compras-despesas-teste:setSearch", handleSetSearch);
    window.addEventListener("compras-despesas-teste:setTipo", handleSetTipo);
    window.addEventListener("compras-despesas-teste:setAno", handleSetAno);
    window.addEventListener("compras-despesas-teste:clearFilters", handleClearFilters);
    window.addEventListener("compras-despesas-teste:setAnoOptions", handleSetAnoOptions);
    window.addEventListener("compras-despesas-teste:activeTabChanged", handleActiveTabChanged);

    return () => {
      window.removeEventListener("compras-despesas-teste:openImportDespesaModal", handleOpenImportDespesaModal);
      window.removeEventListener("compras-despesas-teste:openCreateDialog", handleOpenCreateDialog);
      window.removeEventListener("compras-despesas-teste:setSearch", handleSetSearch);
      window.removeEventListener("compras-despesas-teste:setTipo", handleSetTipo);
      window.removeEventListener("compras-despesas-teste:setAno", handleSetAno);
      window.removeEventListener("compras-despesas-teste:clearFilters", handleClearFilters);
      window.removeEventListener("compras-despesas-teste:setAnoOptions", handleSetAnoOptions);
      window.removeEventListener("compras-despesas-teste:activeTabChanged", handleActiveTabChanged);
    };
  }, []);

  // Detectar duplicados quando os items mudam
  useEffect(() => {
    if (items.length > 0) {
      detectarDuplicados();
    }
  }, [items]);

  // Função para detectar duplicados
  const detectarDuplicados = () => {
    setLoadingDuplicados(true);

    try {
      const gruposDuplicados: any[] = [];
      const processados = new Set<string>();

      // Agrupar por SC + Serviço + Empresa (chaves principais)
      const gruposPorChave = new Map<string, ServicoProduto[]>();

      items.forEach(item => {
        const servicoProduto = item.servico || item.produto || '';
        const chave = `${item.sc || ''}|${servicoProduto}|${item.empresa || ''}`.toLowerCase().trim();

        if (!gruposPorChave.has(chave)) {
          gruposPorChave.set(chave, []);
        }
        gruposPorChave.get(chave)!.push(item);
      });

      // Filtrar apenas grupos com mais de 1 item (duplicados)
      gruposPorChave.forEach((itensGrupo, chave) => {
        if (itensGrupo.length > 1) {
          // Verificar se há diferença de valor significativa (±5%)
          const valores = itensGrupo
            .map(item => {
              if (!item.valor) return 0;
              const valorStr = item.valor.replace(/[^\d,.-]/g, "").replace(",", ".");
              return parseFloat(valorStr) || 0;
            })
            .filter(v => v > 0)
            .sort((a, b) => a - b);

          if (valores.length > 1) {
            const valorMin = valores[0];
            const valorMax = valores[valores.length - 1];
            const diferencaPercentual = valorMin > 0 ? ((valorMax - valorMin) / valorMin) * 100 : 0;

            // Considerar duplicado se diferença <= 5% ou se valores são muito próximos
            if (diferencaPercentual <= 5 || Math.abs(valorMax - valorMin) <= 10) {
              gruposDuplicados.push({
                chave,
                itens: itensGrupo,
                valorMin,
                valorMax,
                diferencaPercentual,
                count: itensGrupo.length
              });
            }
          } else {
            // Mesmo sem valores, considerar duplicado se SC + Serviço + Empresa iguais
            gruposDuplicados.push({
              chave,
              itens: itensGrupo,
              valorMin: 0,
              valorMax: 0,
              diferencaPercentual: 0,
              count: itensGrupo.length
            });
          }
        }
      });

      // Ordenar por quantidade de duplicados (mais críticos primeiro)
      gruposDuplicados.sort((a, b) => b.count - a.count);

      setDuplicados(gruposDuplicados);
      logger.log(`Encontrados ${gruposDuplicados.length} grupos de duplicados`);
    } catch (error) {
      logger.error('Erro ao detectar duplicados:', error);
      toast.error('Erro ao detectar duplicados');
    } finally {
      setLoadingDuplicados(false);
    }
  };





  // Integração com filtros do header
  useEffect(() => {
    const handleSearchChange = (event: Event) => {
      const custom = event as CustomEvent<string>;
      setSearchTerm(custom.detail || "");
    };

    const handleTipoChange = (event: Event) => {
      const custom = event as CustomEvent<string>;
      setActiveTipoTab(custom.detail === "produto" ? "produto" : "servico");
    };

    const handleAnoChange = (event: Event) => {
      const custom = event as CustomEvent<string>;
      setAnoFilter(custom.detail || "todos");
    };

    const handleClearFilters = () => {
      setSearchTerm("");
      setActiveTipoTab("servico");
      setAnoFilter("todos");
    };

    const handleOpenCreateDialog = () => {
      setCreateTipo(null);
      setCreateFormData({});
      setShowCreateDialog(true);
    };

    window.addEventListener("compras-despesas-teste:setSearch", handleSearchChange);
    window.addEventListener("compras-despesas-teste:setTipo", handleTipoChange);
    window.addEventListener("compras-despesas-teste:setAno", handleAnoChange);
    window.addEventListener("compras-despesas-teste:clearFilters", handleClearFilters);
    window.addEventListener("compras-despesas-teste:openCreateDialog", handleOpenCreateDialog);

    return () => {
      window.removeEventListener("compras-despesas-teste:setSearch", handleSearchChange);
      window.removeEventListener("compras-despesas-teste:setTipo", handleTipoChange);
      window.removeEventListener("compras-despesas-teste:setAno", handleAnoChange);
      window.removeEventListener("compras-despesas-teste:clearFilters", handleClearFilters);
      window.removeEventListener("compras-despesas-teste:openCreateDialog", handleOpenCreateDialog);
    };
  }, []);

  // Notificar mudança de aba para o header
  useEffect(() => {
    const event = new CustomEvent("compras-despesas-teste:activeTabChanged", { detail: activeMainTab });
    window.dispatchEvent(event);
  }, [activeMainTab]);

  // Enviar opções de ano para o header
  useEffect(() => {
    if (anosDisponiveis.length > 0) {
      const event = new CustomEvent("compras-despesas-teste:setAnoOptions", { detail: anosDisponiveis.map(a => a?.toString() || "") });
      window.dispatchEvent(event);
    }
  }, [anosDisponiveis]);

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
      const data = await fetchDespesasRecorrentesSimplificado();
      setDespesas(data);
    } catch (error) {
      logger.error("Erro ao carregar despesas:", error);
      toast.error("Erro ao carregar despesas");
    } finally {
      setLoadingDespesas(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesTipo = item.tipo === activeTipoTab;
        const matchesAno = anoFilter === "todos" || item.ano?.toString() === anoFilter;
        const matchesSearch = !searchTerm || `${item.servico || ""} ${item.produto || ""} ${item.descricao || ""} ${item.empresa || ""} ${item.sc || ""}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesServico = activeTipoTab === "produto" || servicoFilter === "todos" || item.servico === servicoFilter;
        return matchesTipo && matchesAno && matchesSearch && matchesServico;
      })
      .sort((a, b) => {
        // Ordenação básica por data de criação (mais recentes primeiro)
        if (a.created_at && b.created_at) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (a.created_at) return -1;
        if (b.created_at) return 1;
        return 0;
      });
  }, [items, activeTipoTab, anoFilter, searchTerm, servicoFilter]);

  // Estatísticas consolidadas
  const stats = useMemo(() => {
    const servicos = items.filter((i) => i.tipo === "servico");
    const produtos = items.filter((i) => i.tipo === "produto");

    const calcularValor = (item: ServicoProduto) => {
      if (!item.valor) return 0;
      const valorStr = item.valor.replace(/[^\d,.-]/g, "").replace(",", ".");
      return parseFloat(valorStr) || 0;
    };

    const anoAtual = new Date().getFullYear();
    const valorTotal = items.filter(i => i.ano === anoAtual).reduce((sum, i) => sum + calcularValor(i), 0);
    const valorServicos = servicos.filter(i => i.ano === anoAtual).reduce((sum, i) => sum + calcularValor(i), 0);
    const valorProdutos = produtos.filter(i => i.ano === anoAtual).reduce((sum, i) => sum + calcularValor(i), 0);

    const lancados = despesas.filter(d => d.status_mes_atual === 'LANCADO').length;
    const pendentes = despesas.filter(d => d.status_mes_atual !== 'LANCADO').length;

    return {
      total: items.length,
      servicos: servicos.length,
      produtos: produtos.length,
      valorTotal,
      valorServicos,
      valorProdutos,
      despesasLancadas: lancados,
      despesasPendentes: pendentes,
      totalDespesas: despesas.length,
    };
  }, [items, despesas]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    try {
      setIsCreating(true);

      let formDataToSave = { ...createFormData };

      if (formDataToSave.valor) {
        formDataToSave.valor = currencyToString(formDataToSave.valor);
      }

      formDataToSave = Object.keys(formDataToSave).reduce((acc, key) => {
        acc[key] = typeof formDataToSave[key] === 'string' ? formDataToSave[key].toUpperCase() : formDataToSave[key];
        return acc;
      }, {} as any);

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
      await loadItems();

    } catch (error) {
      console.error("Erro ao criar item:", error);
      toast.error("Erro ao criar item");
    } finally {
      setIsCreating(false);
    }
  };

  const handleLancarSC = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!lancarSCFormData.nota_fiscal?.trim()) {
      toast.error("Nota Fiscal é obrigatória");
      return;
    }

    try {
      setIsLancandoSC(true);

      const despesa = lancarSCFormData.despesa;
      const valorString = currencyToString(lancarSCFormData.valor);

      logger.log('Iniciando lançamento de SC para despesa:', {
        despesaId: despesa.id,
        apelido: despesa.apelido,
        statusAtual: despesa.status_mes_atual
      });

      // Criar SC com dados do formulário
      const lancamentoData = {
        ano: new Date().getFullYear(),
        servico: despesa.match_texto,
        descricao: despesa.apelido,
        empresa: despesa.match_empresa,
        sc: lancarSCFormData.sc?.trim() || '',
        nota_fiscal: lancarSCFormData.nota_fiscal.trim(),
        data_solicitacao: new Date().toLocaleDateString('pt-BR'),
        valor: valorString,
        oc: lancarSCFormData.oc?.trim() || '',
        situacao: lancarSCFormData.situacao || 'paga',
      };

      logger.log('Criando SC com dados:', lancamentoData);
      await createServico(lancamentoData);

      // Atualizar status da despesa
      logger.log(`Atualizando status da despesa ${despesa.id} para LANCADO`);
      await atualizarStatusDespesaRecorrente(despesa.id, 'LANCADO');
      logger.log(`Status da despesa ${despesa.id} atualizado com sucesso`);

      // Recarregar dados
      logger.log('Recarregando dados das despesas...');
      const despesasAntes = [...despesas];
      await loadDespesas();
      const despesasDepois = [...despesas];
      logger.log('Dados das despesas recarregados', {
        antes: despesasAntes.length,
        depois: despesasDepois.length,
        despesaAtualizada: despesasDepois.find(d => d.id === despesa.id)?.status_mes_atual
      });

      // Aguardar um momento para garantir que os dados foram processados
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verificar novamente após delay
      logger.log('Verificando dados após delay', {
        despesaAtualizada: despesas.find(d => d.id === despesa.id)?.status_mes_atual,
        todasDespesas: despesas.map(d => ({ id: d.id, status: d.status_mes_atual }))
      });

      await loadItems();
      logger.log('Dados dos itens recarregados');

      setShowLancarSCModal(false);
      setLancarSCFormData({});

      toast.success("SC criada e despesa lançada com sucesso!", {
        position: 'top-center',
        duration: 3000,
      });
    } catch (error: any) {
      logger.error('Erro ao lançar SC:', error);
      toast.error(error.message || "Erro ao lançar SC", {
        position: 'top-center',
        duration: 3000,
      });
    } finally {
      setIsLancandoSC(false);
    }
  };

  const handleImportDespesa = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!importDespesaFormData.apelido?.trim()) {
      toast.error("Apelido é obrigatório");
      return;
    }
    if (!importDespesaFormData.match_empresa?.trim()) {
      toast.error("Empresa é obrigatória");
      return;
    }
    if (!importDespesaFormData.match_texto?.trim()) {
      toast.error("Texto de correspondência é obrigatório");
      return;
    }
    if (!importDespesaFormData.dia_vencimento || importDespesaFormData.dia_vencimento < 1 || importDespesaFormData.dia_vencimento > 31) {
      toast.error("Dia do vencimento deve ser entre 1 e 31");
      return;
    }

    try {
      setIsImportandoDespesa(true);

      const { createDespesaRecorrente } = await import('@/lib/despesasService');

      const despesaData = {
        apelido: importDespesaFormData.apelido.trim(),
        tipo: importDespesaFormData.tipo || 'servico',
        match_empresa: importDespesaFormData.match_empresa.trim(),
        match_texto: importDespesaFormData.match_texto.trim(),
        dia_vencimento: importDespesaFormData.dia_vencimento,
        valor_estimado: importDespesaFormData.valor_estimado ? parseFloat(currencyToString(importDespesaFormData.valor_estimado).replace(',', '.')) : undefined,
        descricao_padrao: importDespesaFormData.descricao_padrao?.trim() || undefined,
        recorrencia: importDespesaFormData.recorrencia || 'Mensal',
      };

      logger.log('Importando despesa recorrente:', despesaData);
      await createDespesaRecorrente(despesaData);

      // Recarregar dados
      await loadDespesas();

      setShowImportDespesaModal(false);
      setImportDespesaFormData({});

      toast.success("Despesa recorrente importada com sucesso!", {
        position: 'top-center',
        duration: 3000,
      });
    } catch (error: any) {
      logger.error('Erro ao importar despesa:', error);
      toast.error(error.message || "Erro ao importar despesa", {
        position: 'top-center',
        duration: 3000,
      });
    } finally {
      setIsImportandoDespesa(false);
    }
  };

  // Funções de edição inline
  const handleDoubleClick = (item: ServicoProduto) => {
    setEditingRow(item.id);
    setEditingValues({ ...item });
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditingValues({});
  };

  const handleSaveEdit = async () => {
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

      // Converter "vazio" para "" para situação
      if (updates.situacao === "vazio") {
        updates.situacao = "";
      }

      const normalizedUpdates = Object.keys(updates).reduce((acc, key) => {
        acc[key] = typeof updates[key] === 'string' ? updates[key].toUpperCase() : updates[key];
        return acc;
      }, {} as any);

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
    } catch (error) {
      logger.error("Erro ao atualizar item:", error);
      toast.error("Erro ao atualizar item");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setEditingValues((prev) => ({
      ...prev,
      [field]: value || undefined,
    }));
  };

  const handleDeleteItem = async (item: ServicoProduto) => {
    if (!item) return;
    setConfirmarDelete({ open: true, item });
  };

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
      handleCancelEdit();
    } catch (error) {
      logger.error('Erro ao deletar item:', error);
      toast.error('Erro ao deletar item');
    } finally {
      setConfirmarDelete({ open: false, item: null });
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">

      {/* Tabs principais */}
      <Tabs value={activeMainTab} onValueChange={(value: any) => setActiveMainTab(value)} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-3 mx-2 mt-2">
          <TabsTrigger value="solicitacoes" className="flex items-center gap-2">
            📝 Solicitações
            <Badge variant="secondary" className="ml-1">
              {stats.total}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="checklist" className="flex items-center gap-2">
            📋 Checklist
            {stats.despesasPendentes > 0 && (
              <Badge variant="destructive" className="ml-1">
                {stats.despesasPendentes}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="central" className="flex items-center gap-2">
            📊 Central
          </TabsTrigger>
        </TabsList>

        {/* Aba Checklist */}
        <TabsContent value="checklist" className="flex-1 overflow-hidden m-0">
          <div className="p-2 space-y-4 h-full overflow-y-auto">

            {/* Aviso de Reset */}
            {mostrarAviso && (
              <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  {getMensagemAvisoReset()}
                </AlertDescription>
              </Alert>
            )}

            {/* Tabela de Despesas */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Despesas Recorrentes Mensais</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {loadingDespesas ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Valor Estimado</TableHead>
                        <TableHead>Recorrência</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {despesas.map((despesa) => (
                        <TableRow
                          key={despesa.id}
                          className={cn(
                            despesa.status_mes_atual === 'LANCADO'
                              ? "bg-green-50 dark:bg-green-950/20"
                              : "bg-orange-50 dark:bg-orange-950/20"
                          )}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {despesa.status_mes_atual === 'LANCADO' ? (
                                <CheckCircle className="w-4 h-4 text-green-700" />
                              ) : (
                                <Clock className="w-4 h-4 text-red-700" />
                              )}
                              <span className="text-sm font-medium">
                                {despesa.status_mes_atual === 'LANCADO' ? 'Lançado' : 'Pendente'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{despesa.apelido}</TableCell>
                          <TableCell>{despesa.match_empresa}</TableCell>
                          <TableCell>
                            {despesa.valor_estimado ? formatCurrency(despesa.valor_estimado.toString()) : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {despesa.recorrencia || 'Mensal'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {despesa.status_mes_atual !== 'LANCADO' ? (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setLancarSCFormData({
                                      despesa,
                                      nota_fiscal: '',
                                      valor: despesa.valor_estimado ? formatCurrency(despesa.valor_estimado.toString()) : '',
                                      oc: '',
                                      situacao: 'paga'
                                    });
                                    setShowLancarSCModal(true);
                                  }}
                                  className="gap-2"
                                >
                                  <Plus className="w-3 h-3" />
                                  Lançar SC
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setConfirmarCancelarLancamento({ open: true, despesa })}
                                  className="gap-2"
                                >
                                  <X className="w-3 h-3" />
                                  Cancelar Lançamento
                                </Button>
                              )}

                              {/* Botão Editar */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setDespesaEdit(despesa);
                                  setFormEditDespesa({
                                    apelido: despesa.apelido,
                                    match_texto: despesa.match_texto,
                                    match_empresa: despesa.match_empresa,
                                    valor_estimado: despesa.valor_estimado ? formatCurrency(despesa.valor_estimado.toString()) : '',
                                  });
                                  setShowEditDespesaModal(true);
                                }}
                                className="h-7 px-2"
                                title="Editar despesa"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba Solicitações */}
        <TabsContent value="solicitacoes" className="flex-1 overflow-hidden m-0">
          <div className="p-2 space-y-4 h-full overflow-hidden flex flex-col">
            {/* Sub-tabs para Solicitações */}
            <Tabs value={activeTipoTab} onValueChange={(value: any) => setActiveTipoTab(value)} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="flex w-full mb-4">
                <TabsTrigger value="servico" className="w-1/2 flex items-center justify-center gap-2">
                  <span className="flex items-center gap-2">
                    🔧 Serviços
                    <Badge variant="secondary" className="ml-1 min-w-[2rem] text-center">
                      {stats.servicos}
                    </Badge>
                  </span>
                </TabsTrigger>
                <TabsTrigger value="produto" className="w-1/2 flex items-center justify-center gap-2">
                  <span className="flex items-center gap-2">
                    📦 Produtos
                    <Badge variant="secondary" className="ml-1 min-w-[2rem] text-center">
                      {stats.produtos}
                    </Badge>
                  </span>
                </TabsTrigger>
              </TabsList>

              {/* Sub-aba Produtos */}
              <TabsContent value="produto" className="flex-1 overflow-hidden m-0">
                <div className="flex-1 overflow-hidden mt-4">
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Nenhum produto encontrado</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto overflow-y-auto h-full custom-scrollbar">
                      <Table className="min-w-[1000px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[80px] md:w-[90px] text-center">Data SC</TableHead>
                            <TableHead className="w-[100px] md:w-[120px] lg:w-[140px] text-center">Fornecedor</TableHead>
                            <TableHead className="w-[200px] md:w-[230px] lg:w-[260px] text-center">Produto</TableHead>
                            <TableHead className="w-[150px] md:w-[180px] lg:w-[220px] xl:w-[250px] text-center">Descrição</TableHead>
                            <TableHead className="w-[50px] md:w-[70px] lg:w-[80px] text-right">Empresa</TableHead>
                            <TableHead className="w-[50px] md:w-[70px] text-left">SC</TableHead>
                            <TableHead className="w-[80px] md:w-[100px] text-center">Nota Fiscal</TableHead>
                            <TableHead className="w-[100px] md:w-[120px] text-center">Valor</TableHead>
                            <TableHead className="w-[60px] md:w-[80px] text-center">OC</TableHead>
                            <TableHead className="w-[80px] md:w-[100px] text-left">Situação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredItems.map((item) => {
                            const isEditing = editingRow === item.id;
                            const isServico = item.tipo === "servico";

                            return (
                              <TableRow
                                key={item.id}
                                className={cn(
                                  "transition-colors relative",
                                  item.situacao?.toLowerCase() === "paga"
                                    ? "bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/40"
                                    : item.situacao?.toLowerCase() === "cancelado"
                                    ? "bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/40"
                                    : item.situacao === "?"
                                    ? "bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/40"
                                    : isEditing
                                      ? "border-green-300 cursor-default"
                                      : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                )}
                                onDoubleClick={(e) => {
                                  if (!isEditing) {
                                    e.preventDefault();
                                    handleDoubleClick(item);
                                  }
                                }}
                                onClick={(e) => {
                                  if (isEditing) {
                                    e.stopPropagation();
                                    e.preventDefault();
                                  }
                                }}
                              >
                                <TableCell className="text-center text-xs">
                                  {item.created_at ? format(new Date(item.created_at), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                                </TableCell>
                                <TableCell className="break-words whitespace-pre-wrap text-center">
                                  {isEditing ? (
                                    <Input
                                      value={editingValues.fornecedor || ""}
                                      onChange={(e) => handleFieldChange("fornecedor", e.target.value)}
                                      onKeyDown={handleKeyDown}
                                      className="h-8 text-xs md:text-sm text-center"
                                      onClick={(e)=>e.stopPropagation()}
                                      onMouseDown={(e)=>e.stopPropagation()}
                                    />
                                  ) : (
                                    item.fornecedor || '-'
                                  )}
                                </TableCell>
                                <TableCell className="font-medium break-words whitespace-pre-wrap text-center">
                                  {isEditing ? (
                                    <Input
                                      value={editingValues.produto || editingValues.servico || ""}
                                      onChange={(e) => handleFieldChange(isServico ? "servico" : "produto", e.target.value)}
                                      onKeyDown={handleKeyDown}
                                      className="h-8 text-xs md:text-sm text-center"
                                      onClick={(e)=>e.stopPropagation()}
                                      onMouseDown={(e)=>e.stopPropagation()}
                                    />
                                  ) : (
                                    item.produto || item.servico || '-'
                                  )}
                                </TableCell>
                                <TableCell className="break-words whitespace-pre-wrap text-center">
                                  {isEditing ? (
                                    <Input
                                      value={editingValues.informacoes || editingValues.descricao || ""}
                                      onChange={(e) => handleFieldChange(isServico ? "descricao" : "informacoes", e.target.value)}
                                      onKeyDown={handleKeyDown}
                                      className="h-8 text-xs md:text-sm text-center"
                                      onClick={(e)=>e.stopPropagation()}
                                      onMouseDown={(e)=>e.stopPropagation()}
                                    />
                                  ) : (
                                    item.informacoes || item.descricao || '-'
                                  )}
                                </TableCell>
                                <TableCell className="break-words whitespace-pre-wrap text-right">
                                  {isEditing ? (
                                    <Select
                                      value={editingValues.empresa || ""}
                                      onValueChange={(value) => handleFieldChange("empresa", value)}
                                    >
                                      <SelectTrigger className="h-8 text-xs md:text-sm w-full">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent onClick={(e)=>e.stopPropagation()} onMouseDown={(e)=>e.stopPropagation()}>
                                        <SelectItem value="BOA VISTA">BOA VISTA</SelectItem>
                                        <SelectItem value="BRACUHY">BRACUHY</SelectItem>
                                        <SelectItem value="PICCOLA">PICCOLA</SelectItem>
                                        <SelectItem value="BÚZIOS">BÚZIOS</SelectItem>
                                        <SelectItem value="ITACURUÇÁ">ITACURUÇÁ</SelectItem>
                                        <SelectItem value="GLÓRIA">GLÓRIA</SelectItem>
                                        <SelectItem value="PARATY">PARATY</SelectItem>
                                        <SelectItem value="PIRATAS">PIRATAS</SelectItem>
                                        <SelectItem value="RIBEIRA">RIBEIRA</SelectItem>
                                        <SelectItem value="VEROLME">VEROLME</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    item.empresa || '-'
                                  )}
                                </TableCell>
                                <TableCell className="font-mono text-left">
                                  {isEditing ? (
                                    <Input
                                      value={editingValues.sc || ""}
                                      onChange={(e) => handleFieldChange("sc", e.target.value)}
                                      onKeyDown={handleKeyDown}
                                      className="h-8 text-xs md:text-sm font-mono"
                                      onClick={(e)=>e.stopPropagation()}
                                      onMouseDown={(e)=>e.stopPropagation()}
                                    />
                                  ) : (
                                    item.sc || '-'
                                  )}
                                </TableCell>
                                <TableCell className="font-mono text-center">
                                  {isEditing ? (
                                    <Input
                                      value={editingValues.nota_fiscal || ""}
                                      onChange={(e) => handleFieldChange("nota_fiscal", e.target.value)}
                                      onKeyDown={handleKeyDown}
                                      className="h-8 text-xs md:text-sm font-mono text-center"
                                      onClick={(e)=>e.stopPropagation()}
                                      onMouseDown={(e)=>e.stopPropagation()}
                                    />
                                  ) : (
                                    item.nota_fiscal || '-'
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {isEditing ? (
                                    <Input
                                      value={editingValues.valor || ""}
                                      onChange={(e) => {
                                        const formatted = handleCurrencyInput(e.target.value);
                                        handleFieldChange("valor", formatted);
                                      }}
                                      onKeyDown={handleKeyDown}
                                      className="h-8 text-xs md:text-sm text-center"
                                      onClick={(e)=>e.stopPropagation()}
                                      onMouseDown={(e)=>e.stopPropagation()}
                                    />
                                  ) : (
                                    item.valor ? formatCurrency(item.valor) : '-'
                                  )}
                                </TableCell>
                                <TableCell className="font-mono text-center">
                                  {isEditing ? (
                                    <Input
                                      value={editingValues.oc || ""}
                                      onChange={(e) => handleFieldChange("oc", e.target.value)}
                                      onKeyDown={handleKeyDown}
                                      className="h-8 text-xs md:text-sm font-mono text-center"
                                      onClick={(e)=>e.stopPropagation()}
                                      onMouseDown={(e)=>e.stopPropagation()}
                                    />
                                  ) : (
                                    item.oc || '-'
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {isEditing ? (
                                    <Select
                                      value={editingValues.situacao || ""}
                                      onValueChange={(value) => handleFieldChange("situacao", value)}
                                    >
                                      <SelectTrigger className="h-8 text-xs md:text-sm w-24">
                                        <SelectValue placeholder="Situação" />
                                      </SelectTrigger>
                                      <SelectContent onClick={(e)=>e.stopPropagation()} onMouseDown={(e)=>e.stopPropagation()}>
                                        <SelectItem value="paga">Paga</SelectItem>
                                        <SelectItem value="cancelado">Cancelado</SelectItem>
                                        <SelectItem value="?">?</SelectItem>
                                        <SelectItem value="vazio">-</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <Badge
                                      variant={
                                        item.situacao?.toLowerCase() === 'paga' ? 'default' :
                                        item.situacao?.toLowerCase() === 'cancelado' ? 'destructive' :
                                        'secondary'
                                      }
                                    >
                                      {item.situacao || '?'}
                                    </Badge>
                                  )}

                                  {isEditing && (
                                    <div className="absolute left-1/2 -translate-x-1/2 -top-10 z-50 flex gap-2">
                                      <Button type="button" size="sm" className="h-8 w-8 p-0 rounded-full shadow-lg bg-green-500 hover:bg-green-600 text-white border-2 border-white dark:border-gray-800" onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }} title="Salvar alterações"><Check className="h-4 w-4" /></Button>
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
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Sub-aba Serviços */}
              <TabsContent value="servico" className="flex-1 overflow-hidden m-0">
                <div className="flex-1 overflow-hidden mt-4">
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Nenhum serviço encontrado</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto overflow-y-auto h-full custom-scrollbar">
                      <Table className="min-w-[1000px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[80px] md:w-[90px] text-center">Data SC</TableHead>
                            <TableHead className="w-[300px] md:w-[350px] lg:w-[390px] text-center">Serviço</TableHead>
                            <TableHead className="w-[150px] md:w-[180px] lg:w-[220px] xl:w-[250px] text-center">Descrição</TableHead>
                            <TableHead className="w-[50px] md:w-[70px] lg:w-[80px] text-right">Empresa</TableHead>
                            <TableHead className="w-[50px] md:w-[70px] text-left">SC</TableHead>
                            <TableHead className="w-[80px] md:w-[100px] text-center">Nota Fiscal</TableHead>
                            <TableHead className="w-[100px] md:w-[120px] text-center">Valor</TableHead>
                            <TableHead className="w-[60px] md:w-[80px] text-center">OC</TableHead>
                            <TableHead className="w-[80px] md:w-[100px] text-left">Situação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredItems.map((item) => {
                            const isEditing = editingRow === item.id;
                            const isServico = item.tipo === "servico";

                            return (
                              <TableRow
                                key={item.id}
                                className={cn(
                                  "transition-colors relative",
                                  item.situacao?.toLowerCase() === "paga"
                                    ? "bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/40"
                                    : item.situacao?.toLowerCase() === "cancelado"
                                    ? "bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/40"
                                    : item.situacao === "?"
                                    ? "bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/40"
                                    : isEditing
                                      ? "border-green-300 cursor-default"
                                      : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                )}
                                onDoubleClick={(e) => {
                                  if (!isEditing) {
                                    e.preventDefault();
                                    handleDoubleClick(item);
                                  }
                                }}
                                onClick={(e) => {
                                  if (isEditing) {
                                    e.stopPropagation();
                                    e.preventDefault();
                                  }
                                }}
                              >
                                <TableCell className="text-center text-xs">
                                  {item.created_at ? format(new Date(item.created_at), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                                </TableCell>
                                <TableCell className="font-medium break-words whitespace-pre-wrap text-center">
                                  {isEditing ? (
                                    <Input
                                      value={editingValues.servico || editingValues.produto || ""}
                                      onChange={(e) => handleFieldChange(isServico ? "servico" : "produto", e.target.value)}
                                      onKeyDown={handleKeyDown}
                                      className="h-8 text-xs md:text-sm text-center"
                                      onClick={(e)=>e.stopPropagation()}
                                      onMouseDown={(e)=>e.stopPropagation()}
                                    />
                                  ) : (
                                    item.servico || item.produto || '-'
                                  )}
                                </TableCell>
                                <TableCell className="break-words whitespace-pre-wrap text-center">
                                  {isEditing ? (
                                    <Input
                                      value={editingValues.descricao || editingValues.informacoes || ""}
                                      onChange={(e) => handleFieldChange(isServico ? "descricao" : "informacoes", e.target.value)}
                                      onKeyDown={handleKeyDown}
                                      className="h-8 text-xs md:text-sm text-center"
                                      onClick={(e)=>e.stopPropagation()}
                                      onMouseDown={(e)=>e.stopPropagation()}
                                    />
                                  ) : (
                                    item.descricao || item.informacoes || '-'
                                  )}
                                </TableCell>
                                <TableCell className="break-words whitespace-pre-wrap text-right">
                                  {isEditing ? (
                                    <Select
                                      value={editingValues.empresa || ""}
                                      onValueChange={(value) => handleFieldChange("empresa", value)}
                                    >
                                      <SelectTrigger className="h-8 text-xs md:text-sm w-full">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent onClick={(e)=>e.stopPropagation()} onMouseDown={(e)=>e.stopPropagation()}>
                                        <SelectItem value="BOA VISTA">BOA VISTA</SelectItem>
                                        <SelectItem value="BRACUHY">BRACUHY</SelectItem>
                                        <SelectItem value="PICCOLA">PICCOLA</SelectItem>
                                        <SelectItem value="BÚZIOS">BÚZIOS</SelectItem>
                                        <SelectItem value="ITACURUÇÁ">ITACURUÇÁ</SelectItem>
                                        <SelectItem value="GLÓRIA">GLÓRIA</SelectItem>
                                        <SelectItem value="PARATY">PARATY</SelectItem>
                                        <SelectItem value="PIRATAS">PIRATAS</SelectItem>
                                        <SelectItem value="RIBEIRA">RIBEIRA</SelectItem>
                                        <SelectItem value="VEROLME">VEROLME</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    item.empresa || '-'
                                  )}
                                </TableCell>
                                <TableCell className="font-mono text-left">
                                  {isEditing ? (
                                    <Input
                                      value={editingValues.sc || ""}
                                      onChange={(e) => handleFieldChange("sc", e.target.value)}
                                      onKeyDown={handleKeyDown}
                                      className="h-8 text-xs md:text-sm font-mono"
                                      onClick={(e)=>e.stopPropagation()}
                                      onMouseDown={(e)=>e.stopPropagation()}
                                    />
                                  ) : (
                                    item.sc || '-'
                                  )}
                                </TableCell>
                                <TableCell className="font-mono text-center">
                                  {isEditing ? (
                                    <Input
                                      value={editingValues.nota_fiscal || ""}
                                      onChange={(e) => handleFieldChange("nota_fiscal", e.target.value)}
                                      onKeyDown={handleKeyDown}
                                      className="h-8 text-xs md:text-sm font-mono text-center"
                                      onClick={(e)=>e.stopPropagation()}
                                      onMouseDown={(e)=>e.stopPropagation()}
                                    />
                                  ) : (
                                    item.nota_fiscal || '-'
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {isEditing ? (
                                    <Input
                                      value={editingValues.valor || ""}
                                      onChange={(e) => {
                                        const formatted = handleCurrencyInput(e.target.value);
                                        handleFieldChange("valor", formatted);
                                      }}
                                      onKeyDown={handleKeyDown}
                                      className="h-8 text-xs md:text-sm text-center"
                                      onClick={(e)=>e.stopPropagation()}
                                      onMouseDown={(e)=>e.stopPropagation()}
                                    />
                                  ) : (
                                    item.valor ? formatCurrency(item.valor) : '-'
                                  )}
                                </TableCell>
                                <TableCell className="font-mono text-center">
                                  {isEditing ? (
                                    <Input
                                      value={editingValues.oc || ""}
                                      onChange={(e) => handleFieldChange("oc", e.target.value)}
                                      onKeyDown={handleKeyDown}
                                      className="h-8 text-xs md:text-sm font-mono text-center"
                                      onClick={(e)=>e.stopPropagation()}
                                      onMouseDown={(e)=>e.stopPropagation()}
                                    />
                                  ) : (
                                    item.oc || '-'
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isEditing ? (
                                    <Select
                                      value={editingValues.situacao || ""}
                                      onValueChange={(value) => handleFieldChange("situacao", value)}
                                    >
                                      <SelectTrigger className="h-8 text-xs md:text-sm w-24">
                                        <SelectValue placeholder="Situação" />
                                      </SelectTrigger>
                                      <SelectContent onClick={(e)=>e.stopPropagation()} onMouseDown={(e)=>e.stopPropagation()}>
                                        <SelectItem value="paga">Paga</SelectItem>
                                        <SelectItem value="cancelado">Cancelado</SelectItem>
                                        <SelectItem value="?">?</SelectItem>
                                        <SelectItem value="vazio">-</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <Badge
                                      variant={
                                        item.situacao?.toLowerCase() === 'paga' ? 'default' :
                                        item.situacao?.toLowerCase() === 'cancelado' ? 'destructive' :
                                        'secondary'
                                      }
                                    >
                                      {item.situacao || '?'}
                                    </Badge>
                                  )}

                                  {isEditing && (
                                    <div className="absolute left-1/2 -translate-x-1/2 -top-10 z-50 flex gap-2">
                                      <Button type="button" size="sm" className="h-8 w-8 p-0 rounded-full shadow-lg bg-green-500 hover:bg-green-600 text-white border-2 border-white dark:border-gray-800" onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }} title="Salvar alterações"><Check className="h-4 w-4" /></Button>
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
                    </div>
                  )}
                </div>
              </TabsContent>




            </Tabs>
          </div>
        </TabsContent>

        {/* Aba Central */}
        <TabsContent value="central" className="flex-1 overflow-hidden m-0">
          <div className="p-2 space-y-6 h-full overflow-y-auto">
            {/* Controle de Orçamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  💰 Controle de Orçamento
                </CardTitle>
                <CardDescription>
                  Monitoramento de gastos por conta contábil e limites estabelecidos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Orçamento Total */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-l-4 border-l-green-600">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Orçamento Total</p>
                          {editandoOrcamento ? (
                            <Input
                              value={valorOrcamentoEditado}
                              onChange={(e) => setValorOrcamentoEditado(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  salvarOrcamento();
                                } else if (e.key === 'Escape') {
                                  cancelarEdicaoOrcamento();
                                }
                              }}
                              placeholder="R$ 0,00"
                              className="text-2xl font-bold text-green-600 border-2 border-green-300 focus:border-green-500"
                              autoFocus
                            />
                          ) : (
                            <p className="text-2xl font-bold text-green-600">
                              {carregandoOrcamento ? (
                                <Loader2 className="w-6 h-6 animate-spin inline mr-2" />
                              ) : (
                                formatCurrency(orcamentoTotal.toString())
                              )}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {editandoOrcamento ? (
                            <>
                              <Button
                                size="sm"
                                onClick={salvarOrcamento}
                                className="h-8 px-3 bg-green-600 hover:bg-green-700"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelarEdicaoOrcamento}
                                className="h-8 px-3"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={iniciarEdicaoOrcamento}
                              className="h-8 w-8 p-0"
                              title="Editar orçamento"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-blue-600">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Gasto Atual</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {formatCurrency(stats.valorTotal)}
                          </p>
                        </div>
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-orange-600">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Disponível</p>
                          <p className="text-2xl font-bold text-orange-600">
                            R$ {Math.max(0, orcamentoTotal - stats.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {((stats.valorTotal / orcamentoTotal) * 100).toFixed(1)}% utilizado
                          </p>
                        </div>
                        <AlertTriangle className={`w-6 h-6 ${stats.valorTotal > (orcamentoTotal * 0.8) ? 'text-red-600' : 'text-orange-600'}`} />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Barra de Progresso do Orçamento */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso do Orçamento Mensal</span>
                    <span className={stats.valorTotal > (orcamentoTotal * 0.8) ? 'text-red-600 font-semibold' : 'text-muted-foreground'}>
                      {((stats.valorTotal / orcamentoTotal) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        stats.valorTotal > (orcamentoTotal * 0.8) ? 'bg-red-600' :
                        stats.valorTotal > (orcamentoTotal * 0.66) ? 'bg-orange-500' : 'bg-green-600'
                      }`}
                      style={{ width: `${Math.min((stats.valorTotal / orcamentoTotal) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>R$ 0</span>
                    <span>{formatCurrency((orcamentoTotal * 0.5).toString())} (50%)</span>
                    <span>{formatCurrency((orcamentoTotal * 0.8).toString())} (80%)</span>
                    <span>{formatCurrency(orcamentoTotal.toString())} (100%)</span>
                  </div>
                </div>

                {/* Alertas de Orçamento */}
                {stats.valorTotal > 120000 && (
                  <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      <strong>Alerta Crítico!</strong> O orçamento mensal já ultrapassou 80% do limite estabelecido (R$ 120.000).
                      Considere revisar os próximos lançamentos.
                    </AlertDescription>
                  </Alert>
                )}

                {stats.valorTotal > 100000 && stats.valorTotal <= 120000 && (
                  <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800 dark:text-orange-200">
                      <strong>Atenção!</strong> O orçamento mensal ultrapassou 66% do limite. Monitore os gastos restantes.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Contas Contábeis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 Distribuição por Conta Contábil
                </CardTitle>
                <CardDescription>
                  Gastos categorizados por conta contábil para melhor controle financeiro
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-8 h-8 text-orange-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-orange-600">Em desenvolvimento</h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Esta funcionalidade está sendo implementada e estará disponível em breve.
                        Permite categorizar gastos por contas contábeis específicas do seu setor.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Distribuição por Empresa */}
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-2 border-slate-200 dark:border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-center">
                  <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Distribuição por Empresa
                  </h3>
                </CardTitle>
                <CardDescription className="text-center">
                  Gastos distribuídos por marina/empresa
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Calcular gastos por empresa
                  const gastosPorEmpresa: { [key: string]: { valor: number; count: number; cor: string; icone: string } } = {};

                  filteredItems.forEach(item => {
                    if (item.empresa && item.valor) {
                      const valor = parseFloat(item.valor.replace(/[^\d,.-]/g, "").replace(",", "."));
                      if (valor > 0) {
                        if (!gastosPorEmpresa[item.empresa]) {
                          // Configurações visuais para cada empresa
                          const configs = {
                            'BOA VISTA': { cor: 'bg-gradient-to-r from-blue-500 to-blue-600', bgCard: 'bg-blue-50 dark:bg-blue-950/20' },
                            'BRACUHY': { cor: 'bg-gradient-to-r from-green-500 to-green-600', bgCard: 'bg-green-50 dark:bg-green-950/20' },
                            'PICCOLA': { cor: 'bg-gradient-to-r from-purple-500 to-purple-600', bgCard: 'bg-purple-50 dark:bg-purple-950/20' },
                            'BÚZIOS': { cor: 'bg-gradient-to-r from-pink-500 to-pink-600', bgCard: 'bg-pink-50 dark:bg-pink-950/20' },
                            'ITACURUÇÁ': { cor: 'bg-gradient-to-r from-indigo-500 to-indigo-600', bgCard: 'bg-indigo-50 dark:bg-indigo-950/20' },
                            'GLÓRIA': { cor: 'bg-gradient-to-r from-yellow-500 to-yellow-600', bgCard: 'bg-yellow-50 dark:bg-yellow-950/20' },
                            'PARATY': { cor: 'bg-gradient-to-r from-red-500 to-red-600', bgCard: 'bg-red-50 dark:bg-red-950/20' },
                            'PIRATAS': { cor: 'bg-gradient-to-r from-teal-500 to-teal-600', bgCard: 'bg-teal-50 dark:bg-teal-950/20' },
                            'RIBEIRA': { cor: 'bg-gradient-to-r from-orange-500 to-orange-600', bgCard: 'bg-orange-50 dark:bg-orange-950/20' },
                            'VEROLME': { cor: 'bg-gradient-to-r from-cyan-500 to-cyan-600', bgCard: 'bg-cyan-50 dark:bg-cyan-950/20' }
                          };
                          gastosPorEmpresa[item.empresa] = {
                            valor: 0,
                            count: 0,
                            cor: configs[item.empresa as keyof typeof configs]?.cor || 'bg-gradient-to-r from-gray-500 to-gray-600',
                            bgCard: configs[item.empresa as keyof typeof configs]?.bgCard || 'bg-gray-50 dark:bg-gray-950/20'
                          };
                        }
                        gastosPorEmpresa[item.empresa].valor += valor;
                        gastosPorEmpresa[item.empresa].count += 1;
                      }
                    }
                  });

                  // Ordenar alfabeticamente por nome da empresa
                  const empresasOrdenadas = Object.entries(gastosPorEmpresa)
                    .sort(([a], [b]) => a.localeCompare(b));

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {empresasOrdenadas.map(([empresa, dados], index) => {
                        const percentual = stats.valorTotal > 0 ? (dados.valor / stats.valorTotal) * 100 : 0;

                        return (
                          <div key={empresa} className="p-3 rounded-lg border bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 ${dados.cor.replace('bg-gradient-to-r', 'bg')} rounded-full opacity-70`}></div>

                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-white">
                                    {empresa}
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    {dados.count} {dados.count === 1 ? 'item' : 'itens'}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">
                                <p className="text-lg font-bold text-green-600">
                                  {formatCurrency(dados.valor.toString())}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {percentual.toFixed(1)}%
                                </p>
                              </div>
                            </div>

                            {/* Barra de progresso */}
                            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="h-2 bg-gray-600 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(percentual, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}

                      {empresasOrdenadas.length === 0 && (
                        <div className="col-span-1 md:col-span-2 text-center py-12">
                          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mb-4">
                            <Building2 className="w-8 h-8 text-gray-500" />
                          </div>
                          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                            Nenhum dado disponível
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Adicione itens com empresas para ver a distribuição
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Cards de Estatísticas Consolidadas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-primary">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total de Itens</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <Package className="w-8 h-8 text-primary opacity-80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-600">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Serviços</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.servicos}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(stats.valorServicos)}
                      </p>
                    </div>
                    <Wrench className="w-8 h-8 text-blue-500 opacity-80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-600">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Produtos</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.produtos}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(stats.valorProdutos)}
                      </p>
                    </div>
                    <ShoppingCart className="w-8 h-8 text-purple-500 opacity-80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-600">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Valor Total</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(stats.valorTotal)}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600 opacity-80" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cards de Despesas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-green-800 bg-gradient-to-br from-green-200 to-green-300 dark:from-green-700 dark:to-green-600 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-green-900 drop-shadow-sm" />
                    <span className="text-sm font-black text-green-950 dark:text-white">Despesas Lançadas</span>
                  </div>
                  <div className="text-4xl font-black text-green-950 dark:text-white mt-3 drop-shadow-sm">
                    {stats.despesasLancadas}
                  </div>
                  <p className="text-xs text-green-900 dark:text-green-100 mt-2 font-bold">
                    SCs criadas este mês
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-800 bg-gradient-to-br from-red-200 to-red-300 dark:from-red-700 dark:to-red-600 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Clock className="w-6 h-6 text-red-900 drop-shadow-sm" />
                    <span className="text-sm font-black text-red-950 dark:text-white">Despesas Pendentes</span>
                  </div>
                  <div className="text-4xl font-black text-red-950 dark:text-white mt-3 drop-shadow-sm">
                    {stats.despesasPendentes}
                  </div>
                  <p className="text-xs text-red-900 dark:text-red-100 mt-2 font-bold">
                    Aguardando lançamento
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-600">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Taxa de Lançamento</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mt-2">
                    {stats.totalDespesas > 0
                      ? Math.round((stats.despesasLancadas / stats.totalDespesas) * 100)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Despesas processadas
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Seção de Duplicados */}
            {duplicados.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Análise de Duplicados
                    <Badge variant="destructive" className="ml-2">
                      {duplicados.length}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Itens que podem ser duplicados baseados em SC, serviço e empresa
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 overflow-y-auto max-h-96 custom-scrollbar">
                    {duplicados.map((grupo, index) => (
                      <Card key={index} className="border-l-4 border-l-orange-500">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                              Grupo #{index + 1}
                            </CardTitle>
                            <Badge variant="destructive">
                              {grupo.count} duplicados
                            </Badge>
                          </div>
                          <CardDescription className="text-sm">
                            Diferença máxima: {grupo.diferencaPercentual.toFixed(1)}%
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                              <div>Serviço/Produto</div>
                              <div>Empresa</div>
                              <div>Valor</div>
                            </div>
                            {grupo.itens.map((item: ServicoProduto, itemIndex: number) => (
                              <div key={itemIndex} className="grid grid-cols-3 gap-4 py-2 border-b last:border-b-0">
                                <div className="font-medium">
                                  {item.servico || item.produto || '-'}
                                </div>
                                <div>{item.empresa || '-'}</div>
                                <div className="font-mono">
                                  {item.valor ? formatCurrency(item.valor) : '-'}
                                </div>
                              </div>
                            ))}
                            <div className="flex gap-2 pt-2">
                              <Button size="sm" variant="outline">
                                <Check className="w-4 h-4 mr-1" />
                                Marcar como Resolvido
                              </Button>
                              <Button size="sm" variant="outline">
                                <Package className="w-4 h-4 mr-1" />
                                Fundir Registros
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resumo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Resumo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Esta é uma página de teste que demonstra a unificação das funcionalidades
                  de Despesas Recorrentes e Solicitações em uma única interface.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-3 bg-muted rounded">
                    <p className="font-semibold text-sm">Checklist Integrado</p>
                    <p className="text-xs text-muted-foreground">
                      Despesas recorrentes com botão direto para lançar SCs
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded">
                    <p className="font-semibold text-sm">Solicitações Unificadas</p>
                    <p className="text-xs text-muted-foreground">
                      Serviços e produtos em uma única tabela filtrável
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de Criação */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) {
            setCreateTipo(null);
            setCreateFormData({});
          }
        }}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          {!createTipo ? (
            <div className="flex flex-col gap-4 py-4">
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
                    <Select
                      value={createFormData.servico || ""}
                      onValueChange={(value) => {
                        // Quando selecionar um serviço, buscar a despesa correspondente e preencher a descrição automaticamente
                        setCreateFormData({ ...createFormData, servico: value });

                        // Buscar a despesa correspondente para preencher a descrição automaticamente
                        if (value) {
                          const despesaCorrespondente = despesas.find(d =>
                            d.match_texto.toLowerCase() === value.toLowerCase() ||
                            d.apelido.toLowerCase() === value.toLowerCase()
                          );
                          if (despesaCorrespondente) {
                            setCreateFormData(prev => ({
                              ...prev,
                              servico: value,
                              descricao: despesaCorrespondente.apelido // Campo descrição recebe o nome da despesa
                            }));
                          }
                        }
                      }}
                      required
                    >
                      <SelectTrigger className="bg-background border-2 shadow-sm focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Selecione ou digite o serviço..." />
                      </SelectTrigger>
                      <SelectContent>
                        {servicosAutocomplete.map((servico) => (
                          <SelectItem key={servico} value={servico}>
                            {servico}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <SelectTrigger className="bg-background border-2 shadow-sm focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Selecione a marina..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BOA VISTA">BOA VISTA</SelectItem>
                        <SelectItem value="BRACUHY">BRACUHY</SelectItem>
                        <SelectItem value="PICCOLA">PICCOLA</SelectItem>
                        <SelectItem value="BÚZIOS">BÚZIOS</SelectItem>
                        <SelectItem value="ITACURUÇÁ">ITACURUÇÁ</SelectItem>
                        <SelectItem value="GLÓRIA">GLÓRIA</SelectItem>
                        <SelectItem value="PARATY">PARATY</SelectItem>
                        <SelectItem value="PIRATAS">PIRATAS</SelectItem>
                        <SelectItem value="RIBEIRA">RIBEIRA</SelectItem>
                        <SelectItem value="VEROLME">VEROLME</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descricao">
                      Descrição <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={createFormData.descricao || ""}
                      onValueChange={(value) => setCreateFormData({ ...createFormData, descricao: value })}
                      required
                    >
                      <SelectTrigger className="bg-background border-2 shadow-sm focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Selecione ou digite a descrição..." />
                      </SelectTrigger>
                      <SelectContent>
                        {descricoesAutocomplete.map((descricao) => (
                          <SelectItem key={descricao} value={descricao}>
                            {descricao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sc">
                      SC <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="sc"
                      value={createFormData.sc || ""}
                      onChange={(e) => setCreateFormData({ ...createFormData, sc: e.target.value })}
                      required
                      className="bg-background border-2 shadow-sm focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nota_fiscal">
                      Nota Fiscal <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nota_fiscal"
                      value={createFormData.nota_fiscal || ""}
                      onChange={(e) => setCreateFormData({ ...createFormData, nota_fiscal: e.target.value })}
                      className="bg-background border-2 shadow-sm focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vencimento">
                      Vencimento <span className="text-red-500">*</span>
                    </Label>
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
                        required
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
                      onBlur={(e) => {
                        // Garante formatação correta ao perder o foco
                        if (e.target.value) {
                          const formatted = formatCurrency(e.target.value);
                          setCreateFormData({ ...createFormData, valor: formatted });
                        }
                      }}
                      placeholder="R$ 0,00"
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

                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fornecedor">
                      Fornecedor <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      {!modoAdicaoFornecedor ? (
                        <Select
                          value={createFormData.fornecedor || ""}
                          onValueChange={(value) => setCreateFormData({ ...createFormData, fornecedor: value })}
                          required
                        >
                          <SelectTrigger className="bg-background border-2 shadow-sm focus:ring-2 focus:ring-primary/20 flex-1">
                            <SelectValue placeholder="Selecione o fornecedor..." />
                          </SelectTrigger>
                          <SelectContent>
                            {fornecedoresAutocomplete.map((fornecedor) => (
                              <SelectItem key={fornecedor} value={fornecedor}>
                                {fornecedor}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id="fornecedor"
                          value={createFormData.fornecedor || ""}
                          onChange={(e) => setCreateFormData({ ...createFormData, fornecedor: e.target.value })}
                          placeholder="Digite o novo fornecedor..."
                          className="bg-background border-2 shadow-sm focus:ring-2 focus:ring-primary/20 flex-1"
                          required
                        />
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setModoAdicaoFornecedor(!modoAdicaoFornecedor)}
                        title={modoAdicaoFornecedor ? "Voltar ao dropdown" : "Adicionar novo fornecedor"}
                      >
                        {modoAdicaoFornecedor ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </Button>
                    </div>
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
                      <SelectTrigger className="bg-background border-2 shadow-sm focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Selecione a marina..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BOA VISTA">BOA VISTA</SelectItem>
                        <SelectItem value="BRACUHY">BRACUHY</SelectItem>
                        <SelectItem value="PICCOLA">PICCOLA</SelectItem>
                        <SelectItem value="BÚZIOS">BÚZIOS</SelectItem>
                        <SelectItem value="ITACURUÇÁ">ITACURUÇÁ</SelectItem>
                        <SelectItem value="GLÓRIA">GLÓRIA</SelectItem>
                        <SelectItem value="PARATY">PARATY</SelectItem>
                        <SelectItem value="PIRATAS">PIRATAS</SelectItem>
                        <SelectItem value="RIBEIRA">RIBEIRA</SelectItem>
                        <SelectItem value="VEROLME">VEROLME</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="informacoes">
                      Informações <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="informacoes"
                      value={createFormData.informacoes || ""}
                      onChange={(e) => setCreateFormData({ ...createFormData, informacoes: e.target.value })}
                      className="bg-background border-2 shadow-sm focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sc">
                      SC <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="sc"
                      value={createFormData.sc || ""}
                      onChange={(e) => setCreateFormData({ ...createFormData, sc: e.target.value })}
                      className="bg-background border-2 shadow-sm focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nota_fiscal">
                      Nota Fiscal <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nota_fiscal"
                      value={createFormData.nota_fiscal || ""}
                      onChange={(e) => setCreateFormData({ ...createFormData, nota_fiscal: e.target.value })}
                      className="bg-background border-2 shadow-sm focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vencimento">
                      Vencimento <span className="text-red-500">*</span>
                    </Label>
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
                        required
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
                      onBlur={(e) => {
                        // Garante formatação correta ao perder o foco
                        if (e.target.value) {
                          const formatted = formatCurrency(e.target.value);
                          setCreateFormData({ ...createFormData, valor: formatted });
                        }
                      }}
                      placeholder="R$ 0,00"
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

      {/* Modal para Lançar SC */}
      <Dialog
        open={showLancarSCModal}
        onOpenChange={(open) => {
          setShowLancarSCModal(open);
          if (!open) {
            setLancarSCFormData({});
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleLancarSC}>
            <DialogHeader>
              <DialogTitle>Lançar SC - {lancarSCFormData.despesa?.apelido}</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar a Solicitação de Compra
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="sc">SC</Label>
                <Input
                  id="sc"
                  value={lancarSCFormData.sc || ""}
                  onChange={(e) => setLancarSCFormData({ ...lancarSCFormData, sc: e.target.value })}
                  placeholder="Número da SC"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nota_fiscal">Nota Fiscal *</Label>
                <Input
                  id="nota_fiscal"
                  value={lancarSCFormData.nota_fiscal || ""}
                  onChange={(e) => setLancarSCFormData({ ...lancarSCFormData, nota_fiscal: e.target.value })}
                  placeholder="Número da nota fiscal"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor">Valor</Label>
                <Input
                  id="valor"
                  value={lancarSCFormData.valor || ""}
                  onChange={(e) => {
                    const formatted = handleCurrencyInput(e.target.value);
                    setLancarSCFormData({ ...lancarSCFormData, valor: formatted });
                  }}
                  placeholder="R$ 0,00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oc">OC</Label>
                <Input
                  id="oc"
                  value={lancarSCFormData.oc || ""}
                  onChange={(e) => setLancarSCFormData({ ...lancarSCFormData, oc: e.target.value })}
                  placeholder="Ordem de Compra"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="situacao">Situação</Label>
                <Select
                  value={lancarSCFormData.situacao || "paga"}
                  onValueChange={(value) => setLancarSCFormData({ ...lancarSCFormData, situacao: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paga">Paga</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="?">?</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Resumo da despesa */}
            {lancarSCFormData.despesa && (
              <div className="bg-muted p-3 rounded-md space-y-2">
                <h4 className="font-semibold text-sm">Dados da Despesa:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Serviço:</span> {lancarSCFormData.despesa.match_texto}
                  </div>
                  <div>
                    <span className="font-medium">Empresa:</span> {lancarSCFormData.despesa.match_empresa}
                  </div>
                  <div>
                    <span className="font-medium">Valor Estimado:</span> {lancarSCFormData.despesa.valor_estimado ? formatCurrency(lancarSCFormData.despesa.valor_estimado.toString()) : '-'}
                  </div>
                  <div>
                    <span className="font-medium">Dia Vencimento:</span> {lancarSCFormData.despesa.dia_vencimento}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowLancarSCModal(false);
                  setLancarSCFormData({});
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLancandoSC}>
                {isLancandoSC ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Lançando...
                  </>
                ) : (
                  "Lançar SC"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para Importar Despesa Recorrente */}
      <Dialog
        open={showImportDespesaModal}
        onOpenChange={(open) => {
          setShowImportDespesaModal(open);
          if (!open) {
            setImportDespesaFormData({});
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleImportDespesa}>
            <DialogHeader>
              <DialogTitle>Importar Despesa Recorrente</DialogTitle>
              <DialogDescription>
                Cadastre uma nova despesa que será lançada automaticamente todos os meses
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="apelido">Apelido/Nome *</Label>
                <Input
                  id="apelido"
                  value={importDespesaFormData.apelido || ""}
                  onChange={(e) => setImportDespesaFormData({ ...importDespesaFormData, apelido: e.target.value })}
                  placeholder="Ex: Energia Elétrica, Internet, etc."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  value={importDespesaFormData.tipo || "servico"}
                  onValueChange={(value) => setImportDespesaFormData({ ...importDespesaFormData, tipo: value as 'servico' | 'produto' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="servico">Serviço</SelectItem>
                    <SelectItem value="produto">Produto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="match_empresa">Empresa *</Label>
                <Select
                  value={importDespesaFormData.match_empresa || ""}
                  onValueChange={(value) => setImportDespesaFormData({ ...importDespesaFormData, match_empresa: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BOA VISTA">BOA VISTA</SelectItem>
                    <SelectItem value="BRACUHY">BRACUHY</SelectItem>
                    <SelectItem value="PICCOLA">PICCOLA</SelectItem>
                    <SelectItem value="BÚZIOS">BÚZIOS</SelectItem>
                    <SelectItem value="ITACURUÇÁ">ITACURUÇÁ</SelectItem>
                    <SelectItem value="GLÓRIA">GLÓRIA</SelectItem>
                    <SelectItem value="PARATY">PARATY</SelectItem>
                    <SelectItem value="PIRATAS">PIRATAS</SelectItem>
                    <SelectItem value="RIBEIRA">RIBEIRA</SelectItem>
                    <SelectItem value="VEROLME">VEROLME</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="match_texto">Texto de Correspondência *</Label>
                <Input
                  id="match_texto"
                  value={importDespesaFormData.match_texto || ""}
                  onChange={(e) => setImportDespesaFormData({ ...importDespesaFormData, match_texto: e.target.value })}
                  placeholder="Texto que identifica o serviço"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dia_vencimento">Dia do Vencimento *</Label>
                <Input
                  id="dia_vencimento"
                  type="number"
                  min="1"
                  max="31"
                  value={importDespesaFormData.dia_vencimento || ""}
                  onChange={(e) => setImportDespesaFormData({ ...importDespesaFormData, dia_vencimento: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor_estimado">Valor Estimado</Label>
                <Input
                  id="valor_estimado"
                  value={importDespesaFormData.valor_estimado || ""}
                  onChange={(e) => {
                    const formatted = handleCurrencyInput(e.target.value);
                    setImportDespesaFormData({ ...importDespesaFormData, valor_estimado: formatted });
                  }}
                  placeholder="R$ 0,00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recorrencia">Recorrência</Label>
                <Select
                  value={importDespesaFormData.recorrencia || 'Mensal'}
                  onValueChange={(value) => setImportDespesaFormData({ ...importDespesaFormData, recorrencia: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a recorrência..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mensal">Mensal</SelectItem>
                    <SelectItem value="Anual">Anual</SelectItem>
                    <SelectItem value="Trimestral">Trimestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="descricao_padrao">Descrição Padrão</Label>
                <Input
                  id="descricao_padrao"
                  value={importDespesaFormData.descricao_padrao || ""}
                  onChange={(e) => setImportDespesaFormData({ ...importDespesaFormData, descricao_padrao: e.target.value })}
                  placeholder="Descrição padrão para os lançamentos"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowImportDespesaModal(false);
                  setImportDespesaFormData({});
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isImportandoDespesa}>
                {isImportandoDespesa ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  "Importar Despesa"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para Criar Despesa Recorrente */}
      <Dialog open={showCreateDespesaModal} onOpenChange={(open) => {
        setShowCreateDespesaModal(open);
        if (!open) {
          setCreateDespesaFormData({});
          setIsCriandoDespesa(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Adicionar Despesa Recorrente
            </DialogTitle>
            <DialogDescription>
              <span className="text-xs text-muted-foreground">
                Crie uma nova configuração de despesa recorrente para ser lançada mensalmente.
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-servico">Serviço *</Label>
              <Input
                id="create-servico"
                value={createDespesaFormData.match_texto || ''}
                onChange={(e) => setCreateDespesaFormData({ ...createDespesaFormData, match_texto: e.target.value })}
                placeholder="Texto que identifica o serviço nos lançamentos"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-descricao">Descrição *</Label>
              <Input
                id="create-descricao"
                value={createDespesaFormData.apelido || ''}
                onChange={(e) => setCreateDespesaFormData({ ...createDespesaFormData, apelido: e.target.value })}
                placeholder="Nome descritivo da despesa"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-empresa">Empresa *</Label>
              <Select
                value={createDespesaFormData.match_empresa || ''}
                onValueChange={(value) => setCreateDespesaFormData({ ...createDespesaFormData, match_empresa: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a marina..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOA VISTA">BOA VISTA</SelectItem>
                  <SelectItem value="BRACUHY">BRACUHY JL</SelectItem>
                  <SelectItem value="PICCOLA">PICCOLA</SelectItem>
                  <SelectItem value="BÚZIOS">BÚZIOS</SelectItem>
                  <SelectItem value="ITACURUÇÁ">ITACURUÇÁ</SelectItem>
                  <SelectItem value="GLÓRIA">GLÓRIA</SelectItem>
                  <SelectItem value="PARATY">PARATY</SelectItem>
                  <SelectItem value="PIRATAS">PIRATAS</SelectItem>
                  <SelectItem value="RIBEIRA">RIBEIRA</SelectItem>
                  <SelectItem value="VEROLME">VEROLME</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-valor">Valor Médio (opcional)</Label>
              <Input
                id="create-valor"
                value={createDespesaFormData.valor_estimado || ''}
                onChange={(e) => {
                  const formatted = handleCurrencyInput(e.target.value);
                  setCreateDespesaFormData({ ...createDespesaFormData, valor_estimado: formatted });
                }}
                onBlur={(e) => {
                  // Garante formatação correta ao perder o foco
                  if (e.target.value) {
                    const formatted = formatCurrency(e.target.value);
                    setCreateDespesaFormData({ ...createDespesaFormData, valor_estimado: formatted });
                  }
                }}
                placeholder="R$ 0,00"
                className={createDespesaFormData.valor_estimado && isNaN(parseFloat(createDespesaFormData.valor_estimado.replace(/[^\d,.-]/g, "").replace(",", "."))) ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {createDespesaFormData.valor_estimado && isNaN(parseFloat(createDespesaFormData.valor_estimado.replace(/[^\d,.-]/g, "").replace(",", "."))) && (
                <p className="text-xs text-red-500">Valor inválido. Digite um número válido</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-recorrencia">Recorrência</Label>
              <Select
                value={createDespesaFormData.recorrencia || 'Mensal'}
                onValueChange={(value) => setCreateDespesaFormData({ ...createDespesaFormData, recorrencia: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a recorrência..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mensal">Mensal</SelectItem>
                  <SelectItem value="Anual">Anual</SelectItem>
                  <SelectItem value="Trimestral">Trimestral</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
              {createDespesaFormData.recorrencia === 'Outro' && (
                <Input
                  placeholder="Digite a recorrência personalizada..."
                  value={createDespesaFormData.recorrencia_personalizada || ''}
                  onChange={(e) => setCreateDespesaFormData({ ...createDespesaFormData, recorrencia_personalizada: e.target.value })}
                  className="mt-2"
                />
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDespesaModal(false)}
              disabled={isCriandoDespesa}
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                // Validação dos campos obrigatórios
                if (!createDespesaFormData.apelido || createDespesaFormData.apelido.trim() === '') {
                  toast.error("Campo Descrição é obrigatório!");
                  return;
                }

                if (!createDespesaFormData.match_empresa || createDespesaFormData.match_empresa.trim() === '') {
                  toast.error("Campo Empresa é obrigatório!");
                  return;
                }

                if (!createDespesaFormData.match_texto || createDespesaFormData.match_texto.trim() === '') {
                  toast.error("Campo Serviço é obrigatório!");
                  return;
                }

                setIsCriandoDespesa(true);

                try {
                  logger.log(`Criando despesa recorrente: ${createDespesaFormData.apelido}`);

                  const { createDespesaRecorrente } = await import('@/lib/despesasService');

                  const recorrenciaFinal = createDespesaFormData.recorrencia === 'Outro'
                    ? (createDespesaFormData.recorrencia_personalizada?.trim() || 'Outro')
                    : (createDespesaFormData.recorrencia || 'Mensal');

                  const despesaData = {
                    apelido: createDespesaFormData.apelido.trim(),
                    tipo: 'servico' as const,
                    match_empresa: createDespesaFormData.match_empresa.trim(),
                    match_texto: createDespesaFormData.match_texto.trim(),
                    dia_vencimento: 1, // Valor padrão
                    ativo: true,
                    descricao_padrao: '',
                    valor_estimado: createDespesaFormData.valor_estimado ? parseFloat(currencyToString(createDespesaFormData.valor_estimado)) : null,
                    recorrencia: recorrenciaFinal,
                  };

                  await createDespesaRecorrente(despesaData);

                  // Recarregar lista
                  await loadDespesas();

                  toast.success("Despesa recorrente criada com sucesso!", {
                    position: 'top-center',
                    duration: 3000,
                  });

                  setShowCreateDespesaModal(false);
                  setCreateDespesaFormData({});
                } catch (error: any) {
                  logger.error('Erro ao criar despesa recorrente:', error);
                  toast.error(error.message || "Erro ao criar despesa recorrente", {
                    position: 'top-center',
                    duration: 3000,
                  });
                } finally {
                  setIsCriandoDespesa(false);
                }
              }}
              disabled={isCriandoDespesa}
            >
              {isCriandoDespesa ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Despesa
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Editar Despesa Recorrente */}
      <Dialog open={showEditDespesaModal} onOpenChange={(open) => {
        setShowEditDespesaModal(open);
        if (!open) {
          setDespesaEdit(null);
          setFormEditDespesa({});
          setIsSalvandoEditDespesa(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar Despesa Recorrente
            </DialogTitle>
            <DialogDescription>
              Edição de: <strong>{despesaEdit?.apelido}</strong><br />
              <span className="text-xs text-muted-foreground">
                Altere os dados da despesa recorrente conforme necessário.
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-servico">Serviço *</Label>
              <Input
                id="edit-servico"
                value={formEditDespesa.match_texto || ''}
                onChange={(e) => setFormEditDespesa({ ...formEditDespesa, match_texto: e.target.value })}
                placeholder="Texto que identifica o serviço nos lançamentos"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-descricao">Descrição *</Label>
              <Input
                id="edit-descricao"
                value={formEditDespesa.apelido || ''}
                onChange={(e) => setFormEditDespesa({ ...formEditDespesa, apelido: e.target.value })}
                placeholder="Nome descritivo da despesa"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-empresa">Empresa *</Label>
              <Select
                value={formEditDespesa.match_empresa || ''}
                onValueChange={(value) => setFormEditDespesa({ ...formEditDespesa, match_empresa: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a marina..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOA VISTA">BOA VISTA</SelectItem>
                  <SelectItem value="BRACUHY">BRACUHY JL</SelectItem>
                  <SelectItem value="PICCOLA">PICCOLA</SelectItem>
                  <SelectItem value="BÚZIOS">BÚZIOS</SelectItem>
                  <SelectItem value="ITACURUÇÁ">ITACURUÇÁ</SelectItem>
                  <SelectItem value="GLÓRIA">GLÓRIA</SelectItem>
                  <SelectItem value="PARATY">PARATY</SelectItem>
                  <SelectItem value="PIRATAS">PIRATAS</SelectItem>
                  <SelectItem value="RIBEIRA">RIBEIRA</SelectItem>
                  <SelectItem value="VEROLME">VEROLME</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-valor">Valor Médio (opcional)</Label>
              <Input
                id="edit-valor"
                value={formEditDespesa.valor_estimado || ''}
                onChange={(e) => {
                  const formatted = handleCurrencyInput(e.target.value);
                  setFormEditDespesa({ ...formEditDespesa, valor_estimado: formatted });
                }}
                onBlur={(e) => {
                  // Garante formatação correta ao perder o foco
                  if (e.target.value) {
                    const formatted = formatCurrency(e.target.value);
                    setFormEditDespesa({ ...formEditDespesa, valor_estimado: formatted });
                  }
                }}
                placeholder="R$ 0,00"
                className={formEditDespesa.valor_estimado && isNaN(parseFloat(formEditDespesa.valor_estimado.replace(/[^\d,.-]/g, "").replace(",", "."))) ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {formEditDespesa.valor_estimado && isNaN(parseFloat(formEditDespesa.valor_estimado.replace(/[^\d,.-]/g, "").replace(",", "."))) && (
                <p className="text-xs text-red-500">Valor inválido. Digite um número válido</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDespesaModal(false)}
              disabled={isSalvandoEditDespesa}
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!despesaEdit || isSalvandoEditDespesa) return;

                // Validação dos campos obrigatórios
                if (!formEditDespesa.apelido || formEditDespesa.apelido.trim() === '') {
                  toast.error("Campo Descrição é obrigatório!");
                  return;
                }

                if (!formEditDespesa.match_empresa || formEditDespesa.match_empresa.trim() === '') {
                  toast.error("Campo Empresa é obrigatório!");
                  return;
                }

                if (!formEditDespesa.match_texto || formEditDespesa.match_texto.trim() === '') {
                  toast.error("Campo Serviço é obrigatório!");
                  return;
                }

                setIsSalvandoEditDespesa(true);

                try {
                  logger.log(`Editando despesa recorrente: ${despesaEdit.apelido} → ${formEditDespesa.apelido}`);

                  const { atualizarDespesaRecorrente } = await import('@/lib/despesasService');

                  const despesaData = {
                    id: despesaEdit.id,
                    apelido: formEditDespesa.apelido.trim(),
                    match_empresa: formEditDespesa.match_empresa.trim(),
                    match_texto: formEditDespesa.match_texto.trim(),
                    valor_estimado: formEditDespesa.valor_estimado ? parseFloat(currencyToString(formEditDespesa.valor_estimado)) : null,
                  };

                  await atualizarDespesaRecorrente(despesaData);

                  // Recarregar lista
                  await loadDespesas();

                  toast.success("Despesa recorrente editada com sucesso!", {
                    position: 'top-center',
                    duration: 3000,
                  });

                  setShowEditDespesaModal(false);
                  setDespesaEdit(null);
                  setFormEditDespesa({});
                } catch (error: any) {
                  logger.error('Erro ao editar despesa recorrente:', error);
                  toast.error(error.message || "Erro ao editar despesa recorrente", {
                    position: 'top-center',
                    duration: 3000,
                  });
                } finally {
                  setIsSalvandoEditDespesa(false);
                }
              }}
              disabled={isSalvandoEditDespesa}
            >
              {isSalvandoEditDespesa ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Adicionar Conta Contábil */}
      <Dialog open={showAdicionarContaModal} onOpenChange={(open) => {
        setShowAdicionarContaModal(open);
        if (!open) {
          setNovaContaFormData({
            codigo: '',
            nome: '',
            orcamento: ''
          });
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Adicionar Nova Conta Contábil
            </DialogTitle>
            <DialogDescription>
              Configure uma nova conta contábil para controle de gastos
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="codigo-conta">Código da Conta *</Label>
              <Input
                id="codigo-conta"
                value={novaContaFormData.codigo}
                onChange={(e) => setNovaContaFormData({ ...novaContaFormData, codigo: e.target.value })}
                placeholder="Ex: 123, 456, 789"
                required
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome-conta">Nome da Conta *</Label>
              <Input
                id="nome-conta"
                value={novaContaFormData.nome}
                onChange={(e) => setNovaContaFormData({ ...novaContaFormData, nome: e.target.value })}
                placeholder="Ex: Material de Escritório, Software, etc."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orcamento-conta">Orçamento Mensal</Label>
              <Input
                id="orcamento-conta"
                value={novaContaFormData.orcamento}
                onChange={(e) => {
                  const formatted = handleCurrencyInput(e.target.value);
                  setNovaContaFormData({ ...novaContaFormData, orcamento: formatted });
                }}
                onBlur={(e) => {
                  if (e.target.value) {
                    const formatted = formatCurrency(e.target.value);
                    setNovaContaFormData({ ...novaContaFormData, orcamento: formatted });
                  }
                }}
                placeholder="R$ 0,00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAdicionarContaModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                // Validações
                if (!novaContaFormData.codigo || novaContaFormData.codigo.trim() === '') {
                  toast.error('Código da conta é obrigatório!');
                  return;
                }

                if (!novaContaFormData.nome || novaContaFormData.nome.trim() === '') {
                  toast.error('Nome da conta é obrigatório!');
                  return;
                }

                // Verificar se código já existe
                const codigoExiste = contasContabeis.some(conta => conta.codigo === novaContaFormData.codigo.trim());
                if (codigoExiste) {
                  toast.error('Já existe uma conta com este código!');
                  return;
                }

                // Adicionar nova conta
                const novaConta = {
                  codigo: novaContaFormData.codigo.trim(),
                  nome: novaContaFormData.nome.trim(),
                  orcamento: novaContaFormData.orcamento ? parseFloat(currencyToString(novaContaFormData.orcamento)) : 0
                };

                setContasContabeis(prev => [...prev, novaConta]);

                toast.success(`Conta ${novaConta.codigo} - ${novaConta.nome} adicionada com sucesso!`);

                // Fechar modal e limpar form
                setShowAdicionarContaModal(false);
                setNovaContaFormData({
                  codigo: '',
                  nome: '',
                  orcamento: ''
                });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Conta
            </Button>
          </DialogFooter>
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
                    <p className="text-sm">{confirmarDelete.item.servico || confirmarDelete.item.produto || '-'}</p>
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
            <AlertDialogAction onClick={() => setConfirmarDelete({ open: false, item: null })}>
              Cancelar
            </AlertDialogAction>
            <AlertDialogAction
              onClick={performDeleteConfirmed}
              className="bg-red-600 hover:bg-red-700"
            >
              Deletar item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}