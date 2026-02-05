import { useState, useEffect } from "react";
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
  Printer,
  Copy,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
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
  fetchImpressoras,
  createImpressora,
  updateImpressora,
  deleteImpressora,
  type Impressora,
} from "@/lib/impressorasService";
import { useSidebar } from "@/components/ui/sidebar";
import { logger } from "@/lib/logger";
import { MobileTable, MobileCard, MobileCardRow } from "@/components/MobileTable";

type SortField = "modelo" | "numero_serie" | "ip" | "marina" | "local";
type SortDirection = "asc" | "desc";

// Opções para filtros baseadas nos dados reais
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
];

// Função para obter cor do modelo
function getModeloColor(modelo?: string): {
  bg: string;
  text: string;
  border: string;
  hover: string;
} {
  if (!modelo) {
    return {
      bg: "bg-slate-100 dark:bg-slate-800",
      text: "text-slate-600 dark:text-slate-400",
      border: "border-slate-300 dark:border-slate-700",
      hover: "hover:bg-slate-200 dark:hover:bg-slate-700",
    };
  }

  const modeloLower = modelo.toLowerCase().trim();
  
  // Mapeamento de cores por modelo
  if (modeloLower.includes("ecosys m2640")) {
    return {
      bg: "bg-blue-100 dark:bg-blue-900/30",
      text: "text-blue-700 dark:text-blue-300",
      border: "border-blue-300 dark:border-blue-700",
      hover: "hover:bg-blue-200 dark:hover:bg-blue-900/50",
    };
  }
  if (modeloLower.includes("epson l3250") || modeloLower.includes("epson")) {
    return {
      bg: "bg-purple-100 dark:bg-purple-900/30",
      text: "text-purple-700 dark:text-purple-300",
      border: "border-purple-300 dark:border-purple-700",
      hover: "hover:bg-purple-200 dark:hover:bg-purple-900/50",
    };
  }
  if (modeloLower.includes("ecosys m2040")) {
    return {
      bg: "bg-green-100 dark:bg-green-900/30",
      text: "text-green-700 dark:text-green-300",
      border: "border-green-300 dark:border-green-700",
      hover: "hover:bg-green-200 dark:hover:bg-green-900/50",
    };
  }
  if (modeloLower.includes("ecosys m8124")) {
    return {
      bg: "bg-orange-100 dark:bg-orange-900/30",
      text: "text-orange-700 dark:text-orange-300",
      border: "border-orange-300 dark:border-orange-700",
      hover: "hover:bg-orange-200 dark:hover:bg-orange-900/50",
    };
  }
  if (modeloLower.includes("ecosys m3655")) {
    return {
      bg: "bg-cyan-100 dark:bg-cyan-900/30",
      text: "text-cyan-700 dark:text-cyan-300",
      border: "border-cyan-300 dark:border-cyan-700",
      hover: "hover:bg-cyan-200 dark:hover:bg-cyan-900/50",
    };
  }
  if (modeloLower.includes("sharp") || modeloLower.includes("mx-4140")) {
    return {
      bg: "bg-pink-100 dark:bg-pink-900/30",
      text: "text-pink-700 dark:text-pink-300",
      border: "border-pink-300 dark:border-pink-700",
      hover: "hover:bg-pink-200 dark:hover:bg-pink-900/50",
    };
  }
  if (modeloLower.includes("ecosys")) {
    return {
      bg: "bg-indigo-100 dark:bg-indigo-900/30",
      text: "text-indigo-700 dark:text-indigo-300",
      border: "border-indigo-300 dark:border-indigo-700",
      hover: "hover:bg-indigo-200 dark:hover:bg-indigo-900/50",
    };
  }
  
  // Cor padrão para modelos não mapeados
  return {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-300 dark:border-amber-700",
    hover: "hover:bg-amber-200 dark:hover:bg-amber-900/50",
  };
}

export default function Impressoras() {
  const { isMobile } = useSidebar();
  const [impressoras, setImpressoras] = useState<Impressora[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [marinaFilter, setMarinaFilter] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("modelo");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showDialog, setShowDialog] = useState(false);
  const [editingImpressora, setEditingImpressora] = useState<Impressora | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [impressoraToDelete, setImpressoraToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    modelo: "",
    numero_serie: "",
    ip: "",
    marina: "",
    local: "",
    observacao: "",
  });

  // Carregar impressoras
  useEffect(() => {
    loadImpressoras();
  }, []);

  // Event listener para fechar dialogs com ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showDialog) {
          setShowDialog(false);
        } else if (showDeleteDialog) {
          setShowDeleteDialog(false);
        }
      }
    };

    if (showDialog || showDeleteDialog) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showDialog, showDeleteDialog]);

  // Integração com busca e filtros do header
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

    const handleClearFilters = () => {
      setSearchTerm("");
      setMarinaFilter("");
    };

    const handleOpenDialogFromHeader = () => {
      setEditingImpressora(null);
      setFormData({
        modelo: "",
        numero_serie: "",
        ip: "",
        marina: "",
        local: "",
        observacao: "",
      });
      setShowDialog(true);
    };

    window.addEventListener("impressoras:setSearch", handleSearchFromHeader);
    window.addEventListener("impressoras:setMarinaFilter", handleMarinaFilterFromHeader);
    window.addEventListener("impressoras:clearFilters", handleClearFilters);
    window.addEventListener("impressoras:openDialog", handleOpenDialogFromHeader);
    
    return () => {
      window.removeEventListener("impressoras:setSearch", handleSearchFromHeader);
      window.removeEventListener("impressoras:setMarinaFilter", handleMarinaFilterFromHeader);
      window.removeEventListener("impressoras:clearFilters", handleClearFilters);
      window.removeEventListener("impressoras:openDialog", handleOpenDialogFromHeader);
    };
  }, []);

  const loadImpressoras = async () => {
    try {
      setLoading(true);
      const data = await fetchImpressoras();
      setImpressoras(data);
    } catch (error) {
      logger.error('Erro ao carregar impressoras:', error);
      toast.error("Erro ao carregar impressoras");
    } finally {
      setLoading(false);
    }
  };

  // Função para copiar IP
  const handleCopyIP = async (ip: string) => {
    try {
      await navigator.clipboard.writeText(ip);
      toast.success(`IP ${ip} copiado para a área de transferência!`);
    } catch (error) {
      logger.error('Erro ao copiar IP:', error);
      toast.error("Erro ao copiar IP");
    }
  };

  // Filtrar e ordenar impressoras
  const filteredAndSortedImpressoras = [...impressoras]
    .filter((impressora) => {
      const matchesSearch =
        !searchTerm ||
        `${impressora.modelo} ${impressora.numero_serie} ${impressora.ip} ${impressora.marina} ${impressora.local} ${impressora.observacao}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesMarina = !marinaFilter || impressora.marina === marinaFilter;
      return matchesSearch && matchesMarina;
    })
    .sort((a, b) => {
      const fieldA = a[sortField] || "";
      const fieldB = b[sortField] || "";
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

  const handleOpenDialog = (impressora?: Impressora) => {
    if (impressora) {
      setEditingImpressora(impressora);
      setFormData({
        modelo: impressora.modelo || "",
        numero_serie: impressora.numero_serie || "",
        ip: impressora.ip || "",
        marina: impressora.marina || "",
        local: impressora.local || "",
        observacao: impressora.observacao || "",
      });
    } else {
      setEditingImpressora(null);
      setFormData({
        modelo: "",
        numero_serie: "",
        ip: "",
        marina: "",
        local: "",
        observacao: "",
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.modelo) {
      toast.error("Preencha o modelo da impressora");
      return;
    }

    try {
      if (editingImpressora) {
        await updateImpressora(editingImpressora.id, formData);
        toast.success("Impressora atualizada com sucesso!");
      } else {
        await createImpressora(formData);
        toast.success("Impressora criada com sucesso!");
      }
      setShowDialog(false);
      loadImpressoras();
    } catch (error: any) {
      logger.error('Erro ao salvar impressora:', error);
      toast.error(error.message || "Erro ao salvar impressora");
    }
  };

  const handleDelete = (id: string) => {
    setImpressoraToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (impressoraToDelete) {
      try {
        await deleteImpressora(impressoraToDelete);
        toast.success("Impressora deletada com sucesso!");
        setShowDeleteDialog(false);
        setImpressoraToDelete(null);
        loadImpressoras();
      } catch (error: any) {
        logger.error('Erro ao deletar impressora:', error);
        toast.error(error.message || "Erro ao deletar impressora");
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setMarinaFilter("");
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

  // Renderização mobile (cards)
  const mobileView = (
    <>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground mt-2">Carregando impressoras...</p>
        </div>
      ) : filteredAndSortedImpressoras.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhuma impressora encontrada</p>
        </div>
      ) : (
        filteredAndSortedImpressoras.map((impressora) => (
          <MobileCard
            key={impressora.id}
            title={impressora.modelo || "Sem modelo"}
            subtitle={`${impressora.marina || "Sem marina"} • ${impressora.local || "Sem local"}`}
          >
            <MobileCardRow label="Nº Série" value={impressora.numero_serie || "-"} />
            <MobileCardRow
              label="IP"
              value={
                impressora.ip && impressora.ip.toLowerCase() !== "wi-fi" ? (
                  <a
                    href={`http://${impressora.ip}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 hover:underline transition-colors"
                    title={`Abrir ${impressora.ip} em nova aba`}
                  >
                    {impressora.ip}
                  </a>
                ) : (
                  impressora.ip || "-"
                )
              }
            />
            <MobileCardRow label="Observação" value={impressora.observacao || "-"} />
            <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenDialog(impressora)}
                className="h-8 px-3"
              >
                <Edit className="w-4 h-4 mr-1" />
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(impressora.id)}
                className="h-8 px-3 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Excluir
              </Button>
            </div>
          </MobileCard>
        ))
      )}
    </>
  );

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Tabela/Cards */}
      <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 w-full custom-scrollbar">
        <MobileTable mobileView={mobileView}>
          <Table className="w-full caption-bottom text-xs md:text-sm min-w-[800px]">
            <TableHeader className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 shadow-sm">
              <TableRow className="bg-slate-100 dark:bg-slate-800 border-b-2">
                <TableHead
                  className="text-center bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => handleSort("marina")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Marina
                    <SortIcon field="marina" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-center bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => handleSort("local")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Local
                    <SortIcon field="local" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-center bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => handleSort("modelo")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Modelo
                    <SortIcon field="modelo" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-center bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => handleSort("numero_serie")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Nº Série
                    <SortIcon field="numero_serie" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-center bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => handleSort("ip")}
                >
                  <div className="flex items-center justify-center gap-1">
                    IP
                    <SortIcon field="ip" />
                  </div>
                </TableHead>
                <TableHead className="text-center bg-slate-100 dark:bg-slate-800">Observação</TableHead>
                <TableHead className="text-right bg-slate-100 dark:bg-slate-800">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="text-muted-foreground">Carregando impressoras...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAndSortedImpressoras.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">
                      Nenhuma impressora encontrada
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedImpressoras.map((impressora, index) => (
                  <TableRow
                    key={impressora.id}
                    className={index % 2 === 0 ? "bg-card" : "bg-muted/30"}
                  >
                    <TableCell className="text-center text-xs md:text-sm font-medium">
                      {impressora.marina || "-"}
                    </TableCell>
                    <TableCell className="text-center text-xs md:text-sm">
                      {impressora.local || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {impressora.modelo ? (
                        <div
                          className={`inline-flex items-center px-2.5 py-1 rounded-md border transition-all cursor-default ${getModeloColor(impressora.modelo).bg} ${getModeloColor(impressora.modelo).text} ${getModeloColor(impressora.modelo).border} ${getModeloColor(impressora.modelo).hover}`}
                          title={impressora.modelo}
                        >
                          <span className="text-xs md:text-sm font-medium">
                            {impressora.modelo}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs md:text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-xs md:text-sm font-mono">
                      {impressora.numero_serie || "-"}
                    </TableCell>
                    <TableCell className="text-center text-xs md:text-sm font-mono">
                      <div className="flex items-center justify-center gap-1">
                        {impressora.ip && impressora.ip.toLowerCase() !== "wi-fi" ? (
                          <>
                            <a
                              href={`http://${impressora.ip}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 hover:underline transition-colors cursor-pointer"
                              title={`Abrir ${impressora.ip} em nova aba`}
                            >
                              {impressora.ip}
                            </a>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => handleCopyIP(impressora.ip)}
                              title={`Copiar IP ${impressora.ip}`}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-muted-foreground">{impressora.ip || "-"}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-xs md:text-sm">
                      {impressora.observacao || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleOpenDialog(impressora)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(impressora.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </MobileTable>
      </div>

      {/* Dialog de Edição/Criação */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle>
              {editingImpressora ? "Editar Impressora" : "Nova Impressora"}
            </DialogTitle>
            <DialogDescription>
              {editingImpressora
                ? "Atualize as informações da impressora"
                : "Preencha os dados da nova impressora"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo *</Label>
                <Input
                  id="modelo"
                  value={formData.modelo}
                  onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                  placeholder="Ex: ECOSYS M2640idw"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero_serie">Nº Série</Label>
                <Input
                  id="numero_serie"
                  value={formData.numero_serie}
                  onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
                  placeholder="Ex: 6149"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ip">IP</Label>
                <Input
                  id="ip"
                  value={formData.ip}
                  onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                  placeholder="Ex: 192.168.1.100 ou Wi-Fi"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marina">Marina</Label>
                <Select
                  value={formData.marina}
                  onValueChange={(value) => setFormData({ ...formData, marina: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a marina" />
                  </SelectTrigger>
                  <SelectContent>
                    {MARINA_OPTIONS.map((marina) => (
                      <SelectItem key={marina} value={marina}>
                        {marina}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="local">Local</Label>
                <Input
                  id="local"
                  value={formData.local}
                  onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                  placeholder="Ex: RECEPÇÃO, Diretoria"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacao">Observação</Label>
                <Input
                  id="observacao"
                  value={formData.observacao}
                  onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                  placeholder="Ex: Em uso, Backup, etc."
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingImpressora ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta impressora? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}