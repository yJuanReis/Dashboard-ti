import { useState, useEffect } from "react";
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
  DialogDescription,
} from "@/components/ui/dialog";
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
  Phone,
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
  fetchRamais,
  createRamal,
  updateRamal,
  deleteRamal,
  type Ramal,
} from "@/lib/ramaisService";
import { useSidebar } from "@/components/ui/sidebar";
import { logger } from "@/lib/logger";

type SortField = "marina" | "nome_local" | "ramais";
type SortDirection = "asc" | "desc";

export default function Ramais() {
  const { isMobile } = useSidebar();
  const [ramais, setRamais] = useState<Ramal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("nome_local");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showDialog, setShowDialog] = useState(false);
  const [editingRamal, setEditingRamal] = useState<Ramal | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [ramalToDelete, setRamalToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    marina: "",
    nome_local: "",
    ramais: "",
  });

  // Carregar ramais
  useEffect(() => {
    loadRamais();
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

    const handleOpenDialogFromHeader = () => {
      setEditingRamal(null);
      setFormData({
        marina: "",
        nome_local: "",
        ramais: "",
      });
      setShowDialog(true);
    };

    window.addEventListener("ramais:setSearch", handleSearchFromHeader);
    window.addEventListener("ramais:clearFilters", handleClearFilters);
    window.addEventListener("ramais:openDialog", handleOpenDialogFromHeader);
    
    return () => {
      window.removeEventListener("ramais:setSearch", handleSearchFromHeader);
      window.removeEventListener("ramais:clearFilters", handleClearFilters);
      window.removeEventListener("ramais:openDialog", handleOpenDialogFromHeader);
    };
  }, []);

  const loadRamais = async () => {
    try {
      setLoading(true);
      const data = await fetchRamais();
      setRamais(data);
    } catch (error) {
      logger.error('Erro ao carregar ramais:', error);
      toast.error("Erro ao carregar ramais");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar e ordenar ramais
  const filteredAndSortedRamais = [...ramais]
    .filter((ramal) => {
      const matchesSearch =
        !searchTerm ||
        `${ramal.marina || ""} ${ramal.nome_local || ""} ${ramal.ramais || ""}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      return matchesSearch;
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

  const handleOpenDialog = (ramal?: Ramal) => {
    if (ramal) {
      setEditingRamal(ramal);
      setFormData({
        marina: ramal.marina || "",
        nome_local: ramal.nome_local || "",
        ramais: ramal.ramais || "",
      });
    } else {
      setEditingRamal(null);
      setFormData({
        marina: "",
        nome_local: "",
        ramais: "",
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.nome_local) {
      toast.error("Preencha o nome/local do ramal");
      return;
    }

    try {
      if (editingRamal) {
        await updateRamal(editingRamal.id, formData);
        toast.success("Ramal atualizado com sucesso!");
      } else {
        await createRamal(formData);
        toast.success("Ramal criado com sucesso!");
      }
      setShowDialog(false);
      loadRamais();
    } catch (error: any) {
      logger.error('Erro ao salvar ramal:', error);
      toast.error(error.message || "Erro ao salvar ramal");
    }
  };

  const handleDelete = (id: string) => {
    setRamalToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (ramalToDelete) {
      try {
        await deleteRamal(ramalToDelete);
        toast.success("Ramal deletado com sucesso!");
        setShowDeleteDialog(false);
        setRamalToDelete(null);
        loadRamais();
      } catch (error: any) {
        logger.error('Erro ao deletar ramal:', error);
        toast.error(error.message || "Erro ao deletar ramal");
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
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

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">


      {/* Tabela */}
      <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 w-full">
        <Table className="w-full caption-bottom text-xs md:text-sm min-w-[600px]">
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
                onClick={() => handleSort("nome_local")}
              >
                <div className="flex items-center justify-center gap-1">
                  Nome/Local
                  <SortIcon field="nome_local" />
                </div>
              </TableHead>
              <TableHead
                className="text-center bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                onClick={() => handleSort("ramais")}
              >
                <div className="flex items-center justify-center gap-1">
                  Ramais
                  <SortIcon field="ramais" />
                </div>
              </TableHead>
              <TableHead className="text-right bg-slate-100 dark:bg-slate-800">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Carregando ramais...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredAndSortedRamais.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <p className="text-muted-foreground">
                    Nenhum ramal encontrado
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedRamais.map((ramal, index) => (
                <TableRow
                  key={ramal.id}
                  className={index % 2 === 0 ? "bg-card" : "bg-muted/30"}
                >
                  <TableCell className="text-center text-xs md:text-sm font-medium">
                    {ramal.marina || "-"}
                  </TableCell>
                  <TableCell className="text-center text-xs md:text-sm font-medium">
                    {ramal.nome_local || "-"}
                  </TableCell>
                  <TableCell className="text-center text-xs md:text-sm font-mono">
                    {ramal.ramais || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleOpenDialog(ramal)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(ramal.id)}
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
      </div>

      {/* Dialog de Edição/Criação */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRamal ? "Editar Ramal" : "Novo Ramal"}
            </DialogTitle>
            <DialogDescription>
              {editingRamal
                ? "Atualize as informações do ramal"
                : "Preencha os dados do novo ramal"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="marina">Marina</Label>
              <Input
                id="marina"
                value={formData.marina}
                onChange={(e) => setFormData({ ...formData, marina: e.target.value })}
                placeholder="Ex: Marina Costabella, Marina Verolme"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome_local">Nome/Local *</Label>
              <Input
                id="nome_local"
                value={formData.nome_local}
                onChange={(e) => setFormData({ ...formData, nome_local: e.target.value })}
                placeholder="Ex: Luiz Silva Coord. Marina, Recepção MV, T.I"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ramais">Ramais</Label>
              <Input
                id="ramais"
                value={formData.ramais}
                onChange={(e) => setFormData({ ...formData, ramais: e.target.value })}
                placeholder="Ex: 220, 246 / 244, 200/225/227"
              />
              <p className="text-xs text-muted-foreground">
                Você pode inserir um único ramal (ex: 220) ou múltiplos separados por / ou espaço (ex: 200/225/227)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingRamal ? "Atualizar" : "Criar"}
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
              Tem certeza que deseja excluir este ramal? Esta ação não pode ser desfeita.
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
