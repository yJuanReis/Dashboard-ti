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
} from "lucide-react";
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

      const despesaData = {
        apelido: formCreate.apelido.trim(),
        tipo: 'servico' as const,
        match_empresa: formCreate.match_empresa.trim(),
        match_texto: formCreate.match_texto.trim(),
        match_fornecedor: '',
        dia_vencimento: 1, // Valor padrão
        ativo: true,
        descricao_padrao: '',
        valor_estimado: formCreate.valor_estimado ? parseFloat(formCreate.valor_estimado) : null,
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
              <TableHead className="text-right">Ações</TableHead>
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
                  <TableCell className="text-right">
                    {despesa.status_mes_atual !== 'LANCADO' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleLancar(despesa)}
                        className="h-7"
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
                        className="h-7"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Cancelar
                      </Button>
                    )}
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
                <Input
                  id="vencimento"
                  value={formLancamento.vencimento || ''}
                  onChange={(e) => setFormLancamento({ ...formLancamento, vencimento: e.target.value })}
                  placeholder="DD/MM/YYYY"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor">Valor Da SC</Label>
                <Input
                  id="valor"
                  value={formLancamento.valor || ''}
                  onChange={(e) => setFormLancamento({ ...formLancamento, valor: e.target.value })}
                  placeholder="Digite o valor"
                />
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
              <Label htmlFor="create-valor">Valor Médio (opcional)</Label>
              <Input
                id="create-valor"
                type="number"
                step="0.01"
                min="0"
                value={formCreate.valor_estimado || ''}
                onChange={(e) => setFormCreate({ ...formCreate, valor_estimado: e.target.value })}
                placeholder="Valor aproximado"
              />
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
    </div>
  );
}
