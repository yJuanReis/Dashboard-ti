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

export default function AuditLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Filtros
  const [filterUser, setFilterUser] = useState("");
  const [filterAction, setFilterAction] = useState<string>("");
  const [filterTable, setFilterTable] = useState("");
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  
  // Alertas de segurança
  const [hasAlerts, setHasAlerts] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    loadLogs();
    checkSecurityAlerts();
  }, [currentPage, filterUser, filterAction, filterTable, filterDateStart, filterDateEnd]);

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
    setCurrentPage(1);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('DELETE') || action.includes('FAILED')) return 'destructive';
    if (action.includes('CREATE')) return 'default';
    if (action.includes('UPDATE')) return 'secondary';
    return 'outline';
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

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("/configuracoes")}>
              <Button variant="ghost" size="icon">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Logs de Auditoria</h1>
              <p className="text-muted-foreground">Rastreie todas as ações no sistema</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadLogs}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

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

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>ID do Usuário</Label>
                <Input
                  placeholder="UUID do usuário..."
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Ação</Label>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as ações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="CREATE">CREATE</SelectItem>
                    <SelectItem value="UPDATE">UPDATE</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Tabela</Label>
                <Input
                  placeholder="Nome da tabela..."
                  value={filterTable}
                  onChange={(e) => setFilterTable(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={filterDateStart}
                  onChange={(e) => setFilterDateStart(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={filterDateEnd}
                  onChange={(e) => setFilterDateEnd(e.target.value)}
                />
              </div>
              
              <div className="flex items-end">
                <Button variant="outline" onClick={handleClearFilters} className="w-full">
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Logs */}
        <Card>
          <CardHeader>
            <CardTitle>
              Registros ({totalCount} total)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                Nenhum log encontrado
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Tabela</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Dispositivo</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(log.created_at)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{log.user_name || 'N/A'}</p>
                              <p className="text-xs text-muted-foreground">{log.user_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getActionBadgeVariant(log.action || log.action_type) as any}>
                              {log.action || log.action_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {log.table_name}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {log.description}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.ip_address}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.device || 'N/A'}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedLog(log);
                                setShowDetailsModal(true);
                              }}
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
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="flex gap-2">
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
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
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
                  <Button variant="ghost" size="sm" onClick={() => setShowDetailsModal(false)}>
                    <XCircle className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold">Data/Hora</Label>
                  <p className="text-sm">{formatDate(selectedLog.created_at)}</p>
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
                    <Badge variant={getActionBadgeVariant(selectedLog.action || selectedLog.action_type) as any}>
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
                  <p className="text-sm">{selectedLog.description}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-semibold">Detalhes de Acesso</Label>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">IP:</span> {selectedLog.ip_address}</p>
                    <p><span className="font-medium">Dispositivo:</span> {selectedLog.device}</p>
                    <p className="text-xs text-muted-foreground break-all">
                      <span className="font-medium">User Agent:</span> {selectedLog.user_agent}
                    </p>
                  </div>
                </div>
                
                {selectedLog.changed_fields && selectedLog.changed_fields.length > 0 && (
                  <div>
                    <Label className="text-sm font-semibold">Campos Alterados</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedLog.changed_fields.map((field, i) => (
                        <Badge key={i} variant="secondary">{field}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedLog.old_data && (
                  <div>
                    <Label className="text-sm font-semibold">Dados Antigos</Label>
                    <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.old_data, null, 2)}
                    </pre>
                  </div>
                )}
                
                {selectedLog.new_data && (
                  <div>
                    <Label className="text-sm font-semibold">Dados Novos</Label>
                    <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.new_data, null, 2)}
                    </pre>
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
