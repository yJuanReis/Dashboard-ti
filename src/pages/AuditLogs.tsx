import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Search,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  fetchAuditLogs,
  countAuditLogs,
  exportLogsToCSV,
  checkSuspiciousActivity,
  type AuditLog,
  type AuditActionType,
  AuditAction,
} from "@/lib/auditService";
import { logger } from "@/lib/logger";
import { useAuth } from "@/contexts/AuthContext";

const ITEMS_PER_PAGE = 50;

// Tabelas disponíveis para filtro
// Nota: Controle de HDs usa a tabela 'nvrs' (slots dos NVRs)
const TABELAS_DISPONIVEIS = [
  { value: "", label: "Todas as tabelas" },
  { value: "passwords", label: "Senhas" },
  { value: "nvrs", label: "Controle NVR e HDs" },
  { value: "ramais", label: "Ramais" },
  { value: "impressoras", label: "Impressoras" },
  { value: "user_profiles", label: "Configurações/Usuários" },
  { value: "pages_maintenance", label: "Manutenção de Páginas" },
  { value: "nvr_config", label: "Configuração NVR" },
];

export default function AuditLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Filtros
  const [filterUser, setFilterUser] = useState("");
  const [filterAction, setFilterAction] = useState<string>("");
  const [filterTable, setFilterTable] = useState("");
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Alertas de segurança
  const [hasAlerts, setHasAlerts] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      
      const options: any = {
        limit: ITEMS_PER_PAGE,
        offset: (currentPage - 1) * ITEMS_PER_PAGE,
        order: 'desc' as const,
      };

      if (filterUser) options.user_id = filterUser;
      if (filterAction) options.action_type = filterAction as AuditActionType;
      if (filterTable) options.table_name = filterTable;
      if (filterDateStart) options.start_date = filterDateStart;
      if (filterDateEnd) options.end_date = filterDateEnd;

      const [logsData, count] = await Promise.all([
        fetchAuditLogs(options),
        countAuditLogs(options),
      ]);

      setLogs(logsData);
      setTotalCount(count);
    } catch (error) {
      logger.error("Erro ao carregar logs:", error);
      toast.error("Erro ao carregar logs de auditoria");
    } finally {
      setLoading(false);
    }
  };

  const checkSecurityAlerts = async () => {
    if (!user) return;
    
    try {
      const result = await checkSuspiciousActivity(user.id);
      setHasAlerts(result.hasAlerts);
      setAlerts(result.alerts);
    } catch (error) {
      logger.error("Erro ao verificar alertas:", error);
    }
  };

  const handleExportCSV = async () => {
    try {
      const options: any = {};
      if (filterUser) options.user_id = filterUser;
      if (filterAction) options.action_type = filterAction;
      if (filterTable) options.table_name = filterTable;
      if (filterDateStart) options.start_date = filterDateStart;
      if (filterDateEnd) options.end_date = filterDateEnd;

      const csvContent = await exportLogsToCSV(options);
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Logs exportados com sucesso!');
    } catch (error) {
      logger.error("Erro ao exportar logs:", error);
      toast.error("Erro ao exportar logs");
    }
  };

  const handleClearFilters = () => {
    setFilterUser("");
    setFilterAction("");
    setFilterTable("");
    setFilterDateStart("");
    setFilterDateEnd("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Filtra logs localmente por termo de busca
  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (log.user_name?.toLowerCase().includes(searchLower)) ||
      (log.user_email?.toLowerCase().includes(searchLower)) ||
      (log.description?.toLowerCase().includes(searchLower)) ||
      (log.table_name?.toLowerCase().includes(searchLower)) ||
      (log.record_id?.toLowerCase().includes(searchLower)) ||
      (log.ip_address?.toLowerCase().includes(searchLower))
    );
  });

  useEffect(() => {
    loadLogs();
    checkSecurityAlerts();
  }, [currentPage, filterUser, filterAction, filterTable, filterDateStart, filterDateEnd]);

  // Integração com botões do header no Layout
  useEffect(() => {
    const handleRefreshFromHeader = () => {
      loadLogs();
    };

    const handleExportFromHeader = () => {
      handleExportCSV();
    };

    window.addEventListener("audit-logs:refresh", handleRefreshFromHeader);
    window.addEventListener("audit-logs:export", handleExportFromHeader);
    
    return () => {
      window.removeEventListener("audit-logs:refresh", handleRefreshFromHeader);
      window.removeEventListener("audit-logs:export", handleExportFromHeader);
    };
  }, []); // Empty deps - as funções são estáveis

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('DELETE') || action.includes('FAILED')) return 'destructive';
    if (action.includes('CREATE')) return 'default'; // Verde
    if (action.includes('UPDATE')) return 'secondary'; // Azul
    return 'outline';
  };

  const getActionBadgeStyle = (action: string) => {
    if (action.includes('CREATE')) {
      return 'bg-green-500 hover:bg-green-600 text-white border-green-600';
    }
    if (action.includes('UPDATE')) {
      return 'bg-blue-500 hover:bg-blue-600 text-white border-blue-600';
    }
    if (action.includes('DELETE') || action.includes('FAILED')) {
      return 'bg-red-500 hover:bg-red-600 text-white border-red-600';
    }
    return '';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('DELETE')) return <XCircle className="w-4 h-4" />;
    if (action.includes('CREATE')) return <CheckCircle className="w-4 h-4" />;
    return <Eye className="w-4 h-4" />;
  };

  const getSeverityBadge = (severity: 'low' | 'medium' | 'high') => {
    const variants = {
      low: 'default',
      medium: 'secondary',
      high: 'destructive',
    };
    return variants[severity] || 'default';
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleCopyDetails = async () => {
    if (!selectedLog) return;
    
    const details = {
      id: selectedLog.id,
      data_hora: formatDateTime(selectedLog.created_at),
      usuario: `${selectedLog.user_name} (${selectedLog.user_email})`,
      acao: selectedLog.action || selectedLog.action_type,
      tabela: selectedLog.table_name,
      registro_id: selectedLog.record_id,
      descricao: selectedLog.description,
      ip: selectedLog.ip_address,
      campos_alterados: selectedLog.changed_fields || [],
      dados_antigos: selectedLog.old_data,
      dados_novos: selectedLog.new_data,
    };

    const text = JSON.stringify(details, null, 2);
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Detalhes copiados para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar detalhes');
    }
  };

  return (
    <div className="h-screen flex flex-col p-4 sm:p-6 lg:p-8 overflow-hidden">
      <div className="flex-1 flex flex-col space-y-4 overflow-hidden">

        {/* Alertas de Segurança */}
        {hasAlerts && alerts.length > 0 && (
          <Card className="border-red-500 bg-red-50 dark:bg-red-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertCircle className="w-5 h-5" />
                Alertas de Segurança
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alerts.map((alert, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-md">
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-muted-foreground">Tipo: {alert.type}</p>
                    </div>
                    <Badge variant={getSeverityBadge(alert.severity) as any}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Busca e Filtros */}
        <Card className="flex-shrink-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Busca e Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Busca rápida */}
            <div className="mb-4">
              <Label>Busca Rápida</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por usuário, email, descrição, tabela, ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>ID do Usuário</Label>
                <Input
                  placeholder="UUID do usuário..."
                  value={filterUser}
                  onChange={(e) => {
                    setFilterUser(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Ação</Label>
                <Select value={filterAction || "todos"} onValueChange={(value) => {
                  setFilterAction(value === "todos" ? "" : value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as ações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    <SelectItem value="CREATE">CREATE</SelectItem>
                    <SelectItem value="UPDATE">UPDATE</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Tabela/Serviço</Label>
                <Select value={filterTable || "todas"} onValueChange={(value) => {
                  setFilterTable(value === "todas" ? "" : value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as tabelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {TABELAS_DISPONIVEIS.map((tabela) => (
                      <SelectItem key={tabela.value || "todas"} value={tabela.value || "todas"}>
                        {tabela.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={filterDateStart}
                  onChange={(e) => {
                    setFilterDateStart(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={filterDateEnd}
                  onChange={(e) => {
                    setFilterDateEnd(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              
              <div className="flex items-end gap-2">
                <Button variant="outline" onClick={handleClearFilters} className="flex-1">
                  Limpar Filtros
                </Button>
                <Button variant="outline" onClick={loadLogs} size="icon" title="Recarregar">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Logs */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle>
                Registros ({searchTerm ? filteredLogs.length : totalCount} {searchTerm ? 'filtrados' : 'total'})
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden flex flex-col p-6">
            {loading ? (
              <div className="flex items-center justify-center p-8 flex-1">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (searchTerm ? filteredLogs : logs).length === 0 ? (
              <div className="text-center p-8 text-muted-foreground flex-1 flex items-center justify-center">
                {searchTerm ? 'Nenhum log encontrado com os critérios de busca' : 'Nenhum log encontrado'}
              </div>
            ) : (
              <>
                <div className="overflow-auto flex-1 -mx-6 px-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Tabela</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>ID Registro</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(searchTerm ? filteredLogs : logs).map((log) => (
                        <TableRow key={log.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="whitespace-nowrap">
                            <div 
                              className="group relative cursor-help z-[9999]"
                              title={formatDateTime(log.created_at)}
                            >
                              <span className="text-sm">{formatDate(log.created_at)}</span>
                              <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-popover border rounded-md shadow-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[9999] min-w-max">
                                <div className="font-semibold mb-1">Data e Hora Completa</div>
                                <div>{formatDateTime(log.created_at)}</div>
                                <div className="absolute bottom-0 left-4 transform -translate-y-full">
                                  <div className="border-4 border-transparent border-t-popover"></div>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{log.user_name || 'N/A'}</p>
                              <p className="text-xs text-muted-foreground">{log.user_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={getActionBadgeStyle(log.action || log.action_type) || 'bg-gray-500 hover:bg-gray-600 text-white border-gray-600'}
                            >
                              {log.action || log.action_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {log.table_name}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div 
                              className="truncate cursor-pointer hover:text-primary hover:underline transition-colors"
                              title="Clique para ver detalhes"
                              onClick={() => {
                                setSelectedLog(log);
                                setShowDetailsModal(true);
                              }}
                            >
                              {log.description || 'Sem descrição'}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.ip_address || 'N/A'}
                          </TableCell>
                          <TableCell className="font-mono text-xs max-w-[120px] truncate" title={log.record_id}>
                            {log.record_id}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedLog(log);
                                setShowDetailsModal(true);
                              }}
                              title="Ver detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginação */}
                {!searchTerm && (
                  <div className="flex items-center justify-between mt-4 flex-shrink-0">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} de {totalCount} registros
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-muted-foreground">
                        Página {currentPage} de {totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                      >
                        Próxima
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalhes */}
        {showDetailsModal && selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Detalhes do Log</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyDetails}>
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar Detalhes
                        </>
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => {
                      setShowDetailsModal(false);
                      setCopied(false);
                    }}>
                      <XCircle className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Data/Hora</Label>
                  <p className="text-sm">{formatDateTime(selectedLog.created_at)}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-semibold">Usuário</Label>
                  <p className="text-sm">{selectedLog.user_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedLog.user_email}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selectedLog.user_id}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-semibold">Ação</Label>
                  <div className="mt-1">
                    <Badge className={getActionBadgeStyle(selectedLog.action || selectedLog.action_type) || 'bg-gray-500 hover:bg-gray-600 text-white border-gray-600'}>
                      {selectedLog.action || selectedLog.action_type}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-semibold">Tabela/Registro</Label>
                  <p className="text-sm font-mono">{selectedLog.table_name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selectedLog.record_id}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-semibold">Descrição</Label>
                  <p className="text-sm whitespace-pre-wrap break-words">{selectedLog.description || 'Sem descrição'}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-semibold">Detalhes de Acesso</Label>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">IP:</span> {selectedLog.ip_address || 'N/A'}</p>
                    <p><span className="font-medium">Dispositivo:</span> {selectedLog.description?.match(/\[(.*?)\]/)?.[1] || 'N/A'}</p>
                  </div>
                </div>
                
                {selectedLog.changed_fields && selectedLog.changed_fields.length > 0 && (
                  <div>
                    <Label className="text-sm font-semibold">Campos Alterados ({selectedLog.changed_fields.length})</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedLog.changed_fields.map((field, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{field}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedLog.old_data && (
                  <div>
                    <Label className="text-sm font-semibold">Dados Antigos (antes da alteração)</Label>
                    <div className="mt-2 p-3 bg-muted rounded-md text-xs overflow-x-auto max-h-64 overflow-y-auto">
                      <pre className="whitespace-pre-wrap break-words">
                        {JSON.stringify(selectedLog.old_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                
                {selectedLog.new_data && (
                  <div>
                    <Label className="text-sm font-semibold">Dados Novos (após a alteração)</Label>
                    <div className="mt-2 p-3 bg-muted rounded-md text-xs overflow-x-auto max-h-64 overflow-y-auto">
                      <pre className="whitespace-pre-wrap break-words">
                        {JSON.stringify(selectedLog.new_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                
                {(!selectedLog.old_data && !selectedLog.new_data) && (
                  <div className="text-sm text-muted-foreground italic">
                    Nenhum dado adicional disponível para este registro
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
