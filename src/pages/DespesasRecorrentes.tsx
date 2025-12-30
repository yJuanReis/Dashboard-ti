import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  CheckCircle,
  Clock,
  Plus,
  AlertTriangle,
  X,
  Calendar as CalendarIcon,
  Edit,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { createServico, checkSCDuplicadaPorEmpresa } from "@/lib/servicosProdutosService";
import { createDespesaRecorrente } from "@/lib/checklistService";
import {
  fetchDespesasRecorrentesSimplificado,
  atualizarStatusDespesaRecorrente,
  resetarStatusMensalDespesasRecorrentes,
  deveMostrarAvisoReset,
  getMensagemAvisoReset,
  type DespesaRecorrente,
} from "@/lib/despesasService";
import { useSidebar } from "@/components/ui/sidebar";
import { logger } from "@/lib/logger";

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

  // Validação e formatação automática: dd/mm/yyyy
  if (numbers.length <= 2) {
    // Valida dia (01-31)
    const day = parseInt(numbers);
    if (numbers.length === 2 && (day < 1 || day > 31)) {
      return numbers.slice(0, 1); // Remove último dígito se dia inválido
    }
    return numbers;
  } else if (numbers.length <= 4) {
    const day = parseInt(numbers.slice(0, 2));
    const month = parseInt(numbers.slice(2));

    // Valida dia e mês
    if (day < 1 || day > 31) return numbers.slice(0, 1);
    if (numbers.length === 4 && (month < 1 || month > 12)) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 3)}`; // Remove último dígito se mês inválido
    }

    return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  } else {
    const day = parseInt(numbers.slice(0, 2));
    const month = parseInt(numbers.slice(2, 4));
    const yearDigits = numbers.slice(4, 8);

    // Validações completas
    if (day < 1 || day > 31) return numbers.slice(0, 1);
    if (month < 1 || month > 12) return `${numbers.slice(0, 2)}/${numbers.slice(2, 3)}`;

    // Garante exatamente 4 dígitos para o ano
    if (yearDigits.length < 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${yearDigits}`;
    }

    const year = parseInt(yearDigits);
    if (year < 1900 || year > 2100) {
      // Se ano inválido, mantém os primeiros 3 dígitos e permite correção
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${yearDigits.slice(0, 3)}`;
    }

    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${yearDigits}`;
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

// Função para validar data
const isValidDate = (dateStr: string): boolean => {
  if (!dateStr || dateStr.trim() === '') return false;
  const date = parseDateBR(dateStr);
  return date !== undefined && !isNaN(date.getTime());
};

export default function DespesasRecorrentes() {
  const { isMobile } = useSidebar();
  const [despesas, setDespesas] = useState<DespesaRecorrente[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog de lançamento
  const [showLancamentoDialog, setShowLancamentoDialog] = useState(false);
  const [despesaLancamento, setDespesaLancamento] = useState<DespesaRecorrente | null>(null);
  const [formLancamento, setFormLancamento] = useState<any>({});
  const [salvandoLancamento, setSalvandoLancamento] = useState(false);

  // Dialog de criação de despesa
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formCreate, setFormCreate] = useState<any>({});
  const [salvandoCreate, setSalvandoCreate] = useState(false);

  // Dialog de edição de despesa
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [despesaEdit, setDespesaEdit] = useState<DespesaRecorrente | null>(null);
  const [formEdit, setFormEdit] = useState<any>({});
  const [salvandoEdit, setSalvandoEdit] = useState(false);

  // Carregar despesas iniciais
  useEffect(() => {
    carregarDespesas();
  }, []);

  // Integração com busca do header
  useEffect(() => {
    const handleSearchFromHeader = (event: Event) => {
      const custom = event as CustomEvent<string>;
      const value = typeof custom.detail === "string" ? custom.detail : "";
      setSearchTerm(value);
    };

    const handleClearFilters = () => {
      setSearchTerm("");
    };

    const handleOpenCreateDialog = () => {
      setFormCreate({});
      setShowCreateDialog(true);
    };

    window.addEventListener("despesas-recorrentes:setSearch", handleSearchFromHeader);
    window.addEventListener("despesas-recorrentes:clearFilters", handleClearFilters);
    window.addEventListener("despesas-recorrentes:openCreateDialog", handleOpenCreateDialog);

    return () => {
      window.removeEventListener("despesas-recorrentes:setSearch", handleSearchFromHeader);
      window.removeEventListener("despesas-recorrentes:clearFilters", handleClearFilters);
      window.removeEventListener("despesas-recorrentes:openCreateDialog", handleOpenCreateDialog);
    };
  }, []);

  // Verificar reset mensal
  useEffect(() => {
    const verificarResetMensal = async () => {
      try {
        const hoje = new Date();
        if (hoje.getDate() === 1) {
          logger.log('🎯 Dia 1 do mês - executando reset automático');
          await resetarStatusMensalDespesasRecorrentes();
          await carregarDespesas();
          toast.success("Status mensal resetado automaticamente!", {
            position: 'top-center',
            duration: 5000,
          });
        }
      } catch (error) {
        logger.error('Erro ao verificar reset mensal:', error);
      }
    };

    verificarResetMensal();
  }, []);

  const carregarDespesas = async () => {
    try {
      setLoading(true);
      const dados = await fetchDespesasRecorrentesSimplificado();
      setDespesas(dados);

      const lancados = dados.filter(d => d.status_mes_atual === 'LANCADO').length;
      const pendentes = dados.filter(d => d.status_mes_atual !== 'LANCADO').length;

      logger.log(`✅ ${dados.length} despesas carregadas: ${lancados} lançados, ${pendentes} pendentes`);
    } catch (error) {
      logger.error('Erro ao carregar despesas:', error);
      toast.error("Erro ao carregar despesas", {
        position: 'top-center',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar despesas
  const filteredDespesas = despesas.filter((despesa) => {
    const matchesSearch =
      !searchTerm ||
      despesa.apelido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      despesa.match_empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      despesa.match_texto.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleLancar = (despesa: DespesaRecorrente) => {
    setDespesaLancamento(despesa);
    setFormLancamento({
      servico: despesa.match_texto, // Preenche com match_texto da tabela
      descricao: despesa.apelido,   // Preenche com apelido da tabela
      empresa: despesa.match_empresa,
    });
    setShowLancamentoDialog(true);
  };

  const handleCancelarLancamento = async (despesa: DespesaRecorrente) => {
    try {
      logger.log(`Cancelando lançamento da despesa: ${despesa.apelido}`);

      // Atualizar status da despesa para PENDENTE
      await atualizarStatusDespesaRecorrente(despesa.id, 'PENDENTE');

      // Recarregar lista
      await carregarDespesas();

      toast.success("Lançamento cancelado!", {
        position: 'top-center',
        duration: 3000,
      });
    } catch (error: any) {
      logger.error('Erro ao cancelar lançamento:', error);
      toast.error(error.message || "Erro ao cancelar lançamento", {
        position: 'top-center',
        duration: 3000,
      });
    }
  };

  const handleSalvarLancamento = async () => {
    if (!despesaLancamento || salvandoLancamento) return;

    // Validação do campo SC
    if (!formLancamento.sc || formLancamento.sc.trim() === '') {
      toast.error("Campo SC (Solicitação de Compra) é obrigatório!");
      return;
    }

    // Validação do campo serviço
    if (!formLancamento.servico || formLancamento.servico.trim() === '') {
      toast.error("Campo Serviço é obrigatório!");
      return;
    }

    // Validação do campo vencimento (se preenchido)
    if (formLancamento.vencimento && formLancamento.vencimento.trim() !== '' && !isValidDate(formLancamento.vencimento)) {
      toast.error("Data de vencimento inválida. Use o formato DD/MM/YYYY!");
      return;
    }

    // Validação do campo valor (se preenchido)
    if (formLancamento.valor && formLancamento.valor.trim() !== '' && isNaN(parseFloat(formLancamento.valor.replace(/[^\d,.-]/g, "").replace(",", ".")))) {
      toast.error("Valor inválido. Digite um número válido!");
      return;
    }

    setSalvandoLancamento(true);

    try {
      logger.log(`Lançando despesa: ${despesaLancamento.apelido}`);

      // Verificar duplicidade de SC por empresa (normalizando empresa para ignorar acentos)
      const empresaNormalizada = despesaLancamento.match_empresa
        .toUpperCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/\s+/g, ' '); // Normaliza espaços

      const scDuplicada = await checkSCDuplicadaPorEmpresa(formLancamento.sc, empresaNormalizada);
      if (scDuplicada) {
        toast.error(`⚠️ SC duplicada! Esta SC já foi lançada na empresa ${despesaLancamento.match_empresa}. Cada empresa deve ter SCs únicas.`, {
          style: {
            background: '#fee2e2',
            color: '#dc2626',
            border: '1px solid #fca5a5'
          }
        });
        return;
      }

      // Criar o lançamento na tabela servicos
      const lancamentoData = {
        ano: new Date().getFullYear(),
        servico: formLancamento.servico,
        descricao: formLancamento.descricao || formLancamento.servico,
        empresa: despesaLancamento.match_empresa,
        sc: formLancamento.sc,
        nota_fiscal: formLancamento.nota_fiscal,
        data_solicitacao: new Date().toLocaleDateString('pt-BR'),
        vencimento: formLancamento.vencimento || new Date().toLocaleDateString('pt-BR'),
        valor: formLancamento.valor || '',
        oc: '',
        situacao: '?'
      };

      await createServico(lancamentoData);

      // Atualizar status da despesa para LANCADO
      await atualizarStatusDespesaRecorrente(despesaLancamento.id, 'LANCADO');

      // Recarregar lista
      await carregarDespesas();

      toast.success("Lançamento criado e status atualizado!", {
        position: 'top-center',
        duration: 3000,
      });

      setShowLancamentoDialog(false);
      setDespesaLancamento(null);
      setFormLancamento({});
    } catch (error: any) {
      logger.error('Erro ao salvar lançamento:', error);
      toast.error(error.message || "Erro ao salvar lançamento", {
        position: 'top-center',
        duration: 3000,
      });
    } finally {
      setSalvandoLancamento(false);
    }
  };

  const handleSalvarCreate = async () => {
    // Validação dos campos obrigatórios
    if (!formCreate.apelido || formCreate.apelido.trim() === '') {
      toast.error("Campo Descrição é obrigatório!");
      return;
    }

    if (!formCreate.match_empresa || formCreate.match_empresa.trim() === '') {
      toast.error("Campo Empresa é obrigatório!");
      return;
    }

    if (!formCreate.match_texto || formCreate.match_texto.trim() === '') {
      toast.error("Campo Serviço é obrigatório!");
      return;
    }

    setSalvandoCreate(true);

    try {
      logger.log(`Criando despesa recorrente: ${formCreate.apelido}`);

      const recorrenciaFinal = formCreate.recorrencia === 'Outro'
        ? (formCreate.recorrencia_personalizada?.trim() || 'Outro')
        : (formCreate.recorrencia || 'Mensal');

      const despesaData = {
        apelido: formCreate.apelido.trim(),
        tipo: 'servico' as const,
        match_empresa: formCreate.match_empresa.trim(),
        match_texto: formCreate.match_texto.trim(),
        dia_vencimento: 1, // Valor padrão
        ativo: true,
        descricao_padrao: '',
        valor_estimado: formCreate.valor_estimado ? parseFloat(currencyToString(formCreate.valor_estimado)) : null,
        recorrencia: recorrenciaFinal,
      };

      await createDespesaRecorrente(despesaData);

      // Recarregar lista
      await carregarDespesas();

      toast.success("Despesa recorrente criada com sucesso!", {
        position: 'top-center',
        duration: 3000,
      });

      setShowCreateDialog(false);
      setFormCreate({});
    } catch (error: any) {
      logger.error('Erro ao criar despesa recorrente:', error);
      toast.error(error.message || "Erro ao criar despesa recorrente", {
        position: 'top-center',
        duration: 3000,
      });
    } finally {
      setSalvandoCreate(false);
    }
  };

  const handleEditar = (despesa: DespesaRecorrente) => {
    setDespesaEdit(despesa);
    setFormEdit({
      apelido: despesa.apelido,
      match_texto: despesa.match_texto,
      match_empresa: despesa.match_empresa,
      valor_estimado: despesa.valor_estimado ? formatCurrency(despesa.valor_estimado.toString()) : '',
    });
    setShowEditDialog(true);
  };

  const handleSalvarEdit = async () => {
    if (!despesaEdit || salvandoEdit) return;

    // Validação dos campos obrigatórios
    if (!formEdit.apelido || formEdit.apelido.trim() === '') {
      toast.error("Campo Descrição é obrigatório!");
      return;
    }

    if (!formEdit.match_empresa || formEdit.match_empresa.trim() === '') {
      toast.error("Campo Empresa é obrigatório!");
      return;
    }

    if (!formEdit.match_texto || formEdit.match_texto.trim() === '') {
      toast.error("Campo Serviço é obrigatório!");
      return;
    }

    setSalvandoEdit(true);

    try {
      logger.log(`Editando despesa recorrente: ${despesaEdit.apelido} → ${formEdit.apelido}`);

      const { atualizarDespesaRecorrente } = await import('@/lib/despesasService');

      const despesaData = {
        id: despesaEdit.id,
        apelido: formEdit.apelido.trim(),
        match_empresa: formEdit.match_empresa.trim(),
        match_texto: formEdit.match_texto.trim(),
        valor_estimado: formEdit.valor_estimado ? parseFloat(currencyToString(formEdit.valor_estimado)) : null,
      };

      await atualizarDespesaRecorrente(despesaData);

      // Recarregar lista
      await carregarDespesas();

      toast.success("Despesa recorrente editada com sucesso!", {
        position: 'top-center',
        duration: 3000,
      });

      setShowEditDialog(false);
      setDespesaEdit(null);
      setFormEdit({});
    } catch (error: any) {
      logger.error('Erro ao editar despesa recorrente:', error);
      toast.error(error.message || "Erro ao editar despesa recorrente", {
        position: 'top-center',
        duration: 3000,
      });
    } finally {
      setSalvandoEdit(false);
    }
  };

  const getStatusIcon = (status?: string) => {
    return status === 'LANCADO' ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <Clock className="w-4 h-4 text-orange-500" />
    );
  };

  const getStatusText = (status?: string) => {
    return status === 'LANCADO' ? 'Lançado' : 'Pendente';
  };

  const mostrarAviso = deveMostrarAvisoReset();

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">

      {/* Aviso de Reset */}
      {mostrarAviso && (
        <Alert className="mb-4 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            {getMensagemAvisoReset()}
          </AlertDescription>
        </Alert>
      )}

      {/* Estatísticas rápidas */}
      {despesas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Lançados</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {despesas.filter(d => d.status_mes_atual === 'LANCADO').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">Pendentes</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {despesas.filter(d => d.status_mes_atual !== 'LANCADO').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Total de Despesas</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {despesas.length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela */}
      <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 w-full custom-scrollbar">
        <Table className="w-full caption-bottom text-xs md:text-sm min-w-[800px]">
          <TableHeader className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 shadow-sm">
            <TableRow className="bg-slate-100 dark:bg-slate-800 border-b-2">
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Serviço</TableHead>
              <TableHead className="text-center">Descrição</TableHead>
              <TableHead className="text-center">Empresa</TableHead>
              <TableHead className="text-center">Valor Estimado</TableHead>
              <TableHead className="text-center">Recorrência</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Carregando despesas...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredDespesas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-muted-foreground">
                    {despesas.length === 0 ? "Nenhuma despesa encontrada" : "Nenhum item encontrado"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredDespesas.map((despesa, index) => (
                <TableRow
                  key={despesa.id}
                  className={`${
                    despesa.status_mes_atual === 'LANCADO'
                      ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                      : index % 2 === 0
                        ? "bg-card"
                        : "bg-muted/30"
                  }`}
                >
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getStatusIcon(despesa.status_mes_atual)}
                      <span className="text-xs font-medium">
                        {getStatusText(despesa.status_mes_atual)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-xs md:text-sm">
                    {despesa.match_texto}
                  </TableCell>
                  <TableCell className="text-center text-xs md:text-sm font-medium">
                    {despesa.apelido}
                  </TableCell>
                  <TableCell className="text-center text-xs md:text-sm">
                    {despesa.match_empresa}
                  </TableCell>
                  <TableCell className="text-center text-xs md:text-sm font-mono">
                    {despesa.valor_estimado ? (
                      typeof despesa.valor_estimado === 'number'
                        ? `R$ ${despesa.valor_estimado.toFixed(2)}`
                        : typeof despesa.valor_estimado === 'string' && despesa.valor_estimado.trim() !== ''
                          ? `R$ ${parseFloat(despesa.valor_estimado).toFixed(2)}`
                          : '-'
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-center text-xs md:text-sm">
                    <Badge variant="secondary" className="text-xs">
                      Recorrente
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {/* Botão Lançar ou Cancelar */}
                      {despesa.status_mes_atual !== 'LANCADO' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleLancar(despesa)}
                          className="h-7"
                          title="Lançar despesa"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Lançar
                        </Button>
                      )}
                      {despesa.status_mes_atual === 'LANCADO' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelarLancamento(despesa)}
                          className="h-7 px-2"
                          title="Cancelar lançamento"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}

                      {/* Botão Editar */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditar(despesa)}
                        className="h-7 px-2"
                        title="Editar despesa"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de Lançamento */}
      <Dialog open={showLancamentoDialog} onOpenChange={(open) => {
        setShowLancamentoDialog(open);
        if (!open) {
          setDespesaLancamento(null);
          setFormLancamento({});
          setSalvandoLancamento(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Lançar Despesa
            </DialogTitle>
            <DialogDescription>
              Lançamento para: <strong>{despesaLancamento?.apelido}</strong><br />
              <span className="text-xs text-muted-foreground">
                Preencha os dados para criar o lançamento na página de Solicitações.
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sc">SC *</Label>
                <Input
                  id="sc"
                  value={formLancamento.sc || ''}
                  onChange={(e) => setFormLancamento({ ...formLancamento, sc: e.target.value })}
                  placeholder="Digite o número da SC"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nota_fiscal">Nota Fiscal *</Label>
                <Input
                  id="nota_fiscal"
                  value={formLancamento.nota_fiscal || ''}
                  onChange={(e) => setFormLancamento({ ...formLancamento, nota_fiscal: e.target.value })}
                  placeholder="Digite o número da NF"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="servico">Serviço *</Label>
              <Input
                id="servico"
                value={formLancamento.servico || ''}
                onChange={(e) => setFormLancamento({ ...formLancamento, servico: e.target.value })}
                placeholder="Digite o serviço"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={formLancamento.descricao || ''}
                onChange={(e) => setFormLancamento({ ...formLancamento, descricao: e.target.value })}
                placeholder="Digite a descrição detalhada"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vencimento">Vencimento (Boleto/Fatura)</Label>
                <div className="flex gap-2">
                  <Input
                    id="vencimento"
                    value={formLancamento.vencimento || ''}
                    onChange={(e) => {
                      const formatted = handleDateInput(e.target.value);
                      setFormLancamento({ ...formLancamento, vencimento: formatted });
                    }}
                    placeholder="DD/MM/YYYY"
                    maxLength={10}
                    className={`flex-1 ${formLancamento.vencimento && !isValidDate(formLancamento.vencimento) ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
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
                    <PopoverContent className="w-auto p-0" align="end" side="top" sideOffset={8} avoidCollisions={false}>
                      <Calendar
                        mode="single"
                        selected={parseDateBR(formLancamento.vencimento || "")}
                        onSelect={(date) => {
                          if (date) {
                            const formatted = formatDateBR(date);
                            setFormLancamento({ ...formLancamento, vencimento: formatted });
                          }
                        }}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {formLancamento.vencimento && !isValidDate(formLancamento.vencimento) && (
                  <p className="text-xs text-red-500">Data inválida. Use o formato DD/MM/YYYY</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor">Valor Da SC</Label>
                <Input
                  id="valor"
                  value={formLancamento.valor || ''}
                  onChange={(e) => {
                    const formatted = handleCurrencyInput(e.target.value);
                    setFormLancamento({ ...formLancamento, valor: formatted });
                  }}
                  onBlur={(e) => {
                    // Garante formatação correta ao perder o foco
                    if (e.target.value) {
                      const formatted = formatCurrency(e.target.value);
                      setFormLancamento({ ...formLancamento, valor: formatted });
                    }
                  }}
                  placeholder="R$ 0,00"
                  className={formLancamento.valor && isNaN(parseFloat(formLancamento.valor.replace(/[^\d,.-]/g, "").replace(",", "."))) ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {formLancamento.valor && isNaN(parseFloat(formLancamento.valor.replace(/[^\d,.-]/g, "").replace(",", "."))) && (
                  <p className="text-xs text-red-500">Valor inválido. Digite um número válido</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLancamentoDialog(false)}
              disabled={salvandoLancamento}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSalvarLancamento}
              disabled={salvandoLancamento}
            >
              {salvandoLancamento ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Lançamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Criação de Despesa */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open);
        if (!open) {
          setFormCreate({});
          setSalvandoCreate(false);
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
                value={formCreate.match_texto || ''}
                onChange={(e) => setFormCreate({ ...formCreate, match_texto: e.target.value })}
                placeholder="Texto que identifica o serviço nos lançamentos"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-descricao">Descrição *</Label>
              <Input
                id="create-descricao"
                value={formCreate.apelido || ''}
                onChange={(e) => setFormCreate({ ...formCreate, apelido: e.target.value })}
                placeholder="Nome descritivo da despesa"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-empresa">Empresa *</Label>
              <Select
                value={formCreate.match_empresa || ''}
                onValueChange={(value) => setFormCreate({ ...formCreate, match_empresa: value })}
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
                value={formCreate.valor_estimado || ''}
                onChange={(e) => {
                  const formatted = handleCurrencyInput(e.target.value);
                  setFormCreate({ ...formCreate, valor_estimado: formatted });
                }}
                onBlur={(e) => {
                  // Garante formatação correta ao perder o foco
                  if (e.target.value) {
                    const formatted = formatCurrency(e.target.value);
                    setFormCreate({ ...formCreate, valor_estimado: formatted });
                  }
                }}
                placeholder="R$ 0,00"
                className={formCreate.valor_estimado && isNaN(parseFloat(formCreate.valor_estimado.replace(/[^\d,.-]/g, "").replace(",", "."))) ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {formCreate.valor_estimado && isNaN(parseFloat(formCreate.valor_estimado.replace(/[^\d,.-]/g, "").replace(",", "."))) && (
                <p className="text-xs text-red-500">Valor inválido. Digite um número válido</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-recorrencia">Recorrência</Label>
              <Select
                value={formCreate.recorrencia || 'Mensal'}
                onValueChange={(value) => setFormCreate({ ...formCreate, recorrencia: value })}
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
              {formCreate.recorrencia === 'Outro' && (
                <Input
                  placeholder="Digite a recorrência personalizada..."
                  value={formCreate.recorrencia_personalizada || ''}
                  onChange={(e) => setFormCreate({ ...formCreate, recorrencia_personalizada: e.target.value })}
                  className="mt-2"
                />
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={salvandoCreate}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSalvarCreate}
              disabled={salvandoCreate}
            >
              {salvandoCreate ? (
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

      {/* Dialog de Edição de Despesa */}
      <Dialog open={showEditDialog} onOpenChange={(open) => {
        setShowEditDialog(open);
        if (!open) {
          setDespesaEdit(null);
          setFormEdit({});
          setSalvandoEdit(false);
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
                value={formEdit.match_texto || ''}
                onChange={(e) => setFormEdit({ ...formEdit, match_texto: e.target.value })}
                placeholder="Texto que identifica o serviço nos lançamentos"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-descricao">Descrição *</Label>
              <Input
                id="edit-descricao"
                value={formEdit.apelido || ''}
                onChange={(e) => setFormEdit({ ...formEdit, apelido: e.target.value })}
                placeholder="Nome descritivo da despesa"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-empresa">Empresa *</Label>
              <Select
                value={formEdit.match_empresa || ''}
                onValueChange={(value) => setFormEdit({ ...formEdit, match_empresa: value })}
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
                value={formEdit.valor_estimado || ''}
                onChange={(e) => {
                  const formatted = handleCurrencyInput(e.target.value);
                  setFormEdit({ ...formEdit, valor_estimado: formatted });
                }}
                onBlur={(e) => {
                  // Garante formatação correta ao perder o foco
                  if (e.target.value) {
                    const formatted = formatCurrency(e.target.value);
                    setFormEdit({ ...formEdit, valor_estimado: formatted });
                  }
                }}
                placeholder="R$ 0,00"
                className={formEdit.valor_estimado && isNaN(parseFloat(formEdit.valor_estimado.replace(/[^\d,.-]/g, "").replace(",", "."))) ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {formEdit.valor_estimado && isNaN(parseFloat(formEdit.valor_estimado.replace(/[^\d,.-]/g, "").replace(",", "."))) && (
                <p className="text-xs text-red-500">Valor inválido. Digite um número válido</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={salvandoEdit}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSalvarEdit}
              disabled={salvandoEdit}
            >
              {salvandoEdit ? (
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
    </div>
  );
}
