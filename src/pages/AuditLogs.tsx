import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Search, RefreshCw, Copy, Eye, X, Database, Filter, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAuditLogs, type AuditLog, type AuditActionType } from "@/lib/auditService";
import { format } from "date-fns";

export default function AuditLogs() {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsFilter, setLogsFilter] = useState<{
    table_name?: string;
    action_type?: AuditActionType;
    search?: string;
  }>({});
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const logsPerPage = 50;
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showLogDetails, setShowLogDetails] = useState(false);

  // Função para carregar logs de auditoria
  const carregarLogsAuditoria = useCallback(async () => {
    setLoadingLogs(true);
    try {
      // Busca todos os logs e filtra localmente se houver busca por texto
      const allLogs = await fetchAuditLogs({
        table_name: logsFilter.table_name,
        action_type: logsFilter.action_type,
        limit: 5000, // Buscar mais para filtrar localmente
        offset: 0,
        order_by: 'created_at',
        order: 'desc',
      });
      
      // Filtra por texto de busca se houver
      let filteredLogs = allLogs;
      if (logsFilter.search) {
        const searchLower = logsFilter.search.toLowerCase();
        filteredLogs = allLogs.filter(log => 
          log.description?.toLowerCase().includes(searchLower) ||
          log.user_email?.toLowerCase().includes(searchLower) ||
          log.user_name?.toLowerCase().includes(searchLower) ||
          log.table_name?.toLowerCase().includes(searchLower) ||
          log.record_id?.toLowerCase().includes(searchLower)
        );
      }
      
      // Aplica paginação
      const total = filteredLogs.length;
      const offset = (logsPage - 1) * logsPerPage;
      const paginatedLogs = filteredLogs.slice(offset, offset + logsPerPage);
      
      setAuditLogs(paginatedLogs);
      setLogsTotal(total);
    } catch (error: any) {
      console.error('Erro ao carregar logs de auditoria:', error);
      toast.error('Erro ao carregar logs de auditoria: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoadingLogs(false);
    }
  }, [logsPage, logsFilter, logsPerPage]);

  // Carregar logs quando mudar filtros ou página
  useEffect(() => {
    carregarLogsAuditoria();
  }, [carregarLogsAuditoria]);

  // Função para formatar data
  const formatarData = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm:ss");
    } catch {
      return dateString;
    }
  };

  // Função para obter cor do badge de ação
  const getActionBadgeColor = (action: AuditActionType) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'DELETE':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  // Função para obter nome amigável da tabela
  const getTableName = (tableName: string) => {
    const names: Record<string, string> = {
      'passwords': 'Senhas',
      'nvrs': 'NVRs',
      'user_profiles': 'Usuários',
    };
    return names[tableName] || tableName;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("Configuracoes")}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Database className="w-8 h-8 text-primary" />
              Logs de Auditoria
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Visualize todas as mudanças feitas no sistema - quem fez, quando e o que mudou
            </p>
          </div>
        </div>

        {/* Card Principal */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-muted-foreground" />
                Registro de Atividades
              </CardTitle>
              <Badge variant="outline" className="text-sm">
                {logsTotal} {logsTotal === 1 ? 'log' : 'logs'} encontrado{logsTotal !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filtros */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 p-4 rounded-lg border border-blue-200/50 dark:border-slate-600 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-900 dark:text-blue-200">
                <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Filtros de Busca
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[250px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por descrição, usuário, tabela ou ID..."
                      value={logsFilter.search || ''}
                      onChange={(e) => {
                        setLogsFilter({ ...logsFilter, search: e.target.value });
                        setLogsPage(1);
                      }}
                      className="h-10 pl-10 bg-white dark:bg-slate-800 border-blue-200 dark:border-slate-600 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-400 dark:focus:ring-blue-500 text-foreground"
                    />
                  </div>
                </div>
                <select
                  className="h-10 px-4 border rounded-md text-sm bg-white dark:bg-slate-800 border-blue-200 dark:border-slate-600 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-400 dark:focus:ring-blue-500 text-slate-700 dark:text-slate-200 font-medium"
                  value={logsFilter.action_type || ''}
                  onChange={(e) => {
                    setLogsFilter({ 
                      ...logsFilter, 
                      action_type: e.target.value as AuditActionType || undefined 
                    });
                    setLogsPage(1);
                  }}
                >
                  <option value="">Todas as ações</option>
                  <option value="CREATE">Criar</option>
                  <option value="UPDATE">Atualizar</option>
                  <option value="DELETE">Excluir</option>
                </select>
                <select
                  className="h-10 px-4 border rounded-md text-sm bg-white dark:bg-slate-800 border-blue-200 dark:border-slate-600 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-400 dark:focus:ring-blue-500 text-slate-700 dark:text-slate-200 font-medium"
                  value={logsFilter.table_name || ''}
                  onChange={(e) => {
                    setLogsFilter({ 
                      ...logsFilter, 
                      table_name: e.target.value || undefined 
                    });
                    setLogsPage(1);
                  }}
                >
                  <option value="">Todas as tabelas</option>
                  <option value="passwords">Senhas</option>
                  <option value="nvrs">NVRs</option>
                  <option value="user_profiles">Usuários</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLogsFilter({});
                    setLogsPage(1);
                  }}
                  className="h-10 border-blue-300 dark:border-slate-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-700 hover:border-blue-400 dark:hover:border-blue-500"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Limpar
                </Button>
              </div>
            </div>

            {/* Tabela de Logs */}
            {loadingLogs ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-4">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Carregando logs...</p>
                </div>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhum log encontrado</p>
                <p className="text-sm mt-2">
                  {Object.keys(logsFilter).length > 0 
                    ? 'Tente ajustar os filtros para encontrar mais resultados.'
                    : 'Ainda não há logs de auditoria registrados no sistema.'}
                </p>
              </div>
            ) : (
              <>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="w-[140px]">Data/Hora</TableHead>
                          <TableHead className="w-[100px]">Ação</TableHead>
                          <TableHead className="w-[130px]">Tabela</TableHead>
                          <TableHead className="w-[180px]">Usuário</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead className="w-[100px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs.map((log) => (
                          <TableRow key={log.id} className="hover:bg-slate-50/50">
                            <TableCell className="text-xs font-mono">
                              {formatarData(log.created_at)}
                            </TableCell>
                            <TableCell>
                              <Badge className={getActionBadgeColor(log.action_type)}>
                                {log.action_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-sm">
                                  {getTableName(log.table_name)}
                                </div>
                                <div className="font-mono text-xs text-muted-foreground">
                                  {log.table_name}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-sm">
                                  {log.user_name || log.user_email || 'Desconhecido'}
                                </div>
                                {log.user_email && log.user_name && (
                                  <div className="text-xs text-muted-foreground">
                                    {log.user_email}
                                  </div>
                                )}
                                {log.ip_address && (
                                  <div className="text-xs text-muted-foreground font-mono">
                                    IP: {log.ip_address}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="max-w-md">
                                {log.description || `${log.action_type} em ${getTableName(log.table_name)}`}
                              </div>
                              {log.record_id && (
                                <div className="text-xs text-muted-foreground font-mono mt-1">
                                  ID: {log.record_id.substring(0, 8)}...
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedLog(log);
                                    setShowLogDetails(true);
                                  }}
                                  title="Ver detalhes completos"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const details = {
                                      action: log.action_type,
                                      table: log.table_name,
                                      record_id: log.record_id,
                                      old_data: log.old_data,
                                      new_data: log.new_data,
                                      changed_fields: log.changed_fields,
                                      ip: log.ip_address,
                                    };
                                    navigator.clipboard.writeText(JSON.stringify(details, null, 2));
                                    toast.success('Detalhes copiados para a área de transferência');
                                  }}
                                  title="Copiar detalhes"
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Paginação */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {((logsPage - 1) * logsPerPage) + 1} a {Math.min(logsPage * logsPerPage, logsTotal)} de {logsTotal} logs
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                      disabled={logsPage === 1 || loadingLogs}
                    >
                      Anterior
                    </Button>
                    <span className="flex items-center px-4 text-sm text-muted-foreground">
                      Página {logsPage} de {Math.ceil(logsTotal / logsPerPage) || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLogsPage(p => p + 1)}
                      disabled={logsPage * logsPerPage >= logsTotal || loadingLogs}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Detalhes do Log */}
      {showLogDetails && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader className="flex-shrink-0 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Detalhes do Log de Auditoria
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowLogDetails(false);
                    setSelectedLog(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4 pt-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Ação</Label>
                  <div className="mt-1">
                    <Badge className={getActionBadgeColor(selectedLog.action_type)}>
                      {selectedLog.action_type}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Tabela</Label>
                  <p className="mt-1 font-mono text-sm">{selectedLog.table_name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">ID do Registro</Label>
                  <p className="mt-1 font-mono text-sm break-all">{selectedLog.record_id}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Data/Hora</Label>
                  <p className="mt-1 text-sm">{formatarData(selectedLog.created_at)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Usuário</Label>
                  <p className="mt-1 text-sm font-medium">
                    {selectedLog.user_name || selectedLog.user_email || 'Desconhecido'}
                  </p>
                  {selectedLog.user_email && selectedLog.user_name && (
                    <p className="text-xs text-muted-foreground">{selectedLog.user_email}</p>
                  )}
                  {selectedLog.user_id && (
                    <p className="text-xs text-muted-foreground font-mono">ID: {selectedLog.user_id}</p>
                  )}
                </div>
                {selectedLog.ip_address && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Endereço IP</Label>
                    <p className="mt-1 font-mono text-sm">{selectedLog.ip_address}</p>
                  </div>
                )}
              </div>

              {/* Descrição */}
              {selectedLog.description && (
                <div>
                  <Label className="text-xs text-muted-foreground">Descrição</Label>
                  <p className="mt-1 text-sm p-3 bg-slate-50 rounded-md border">{selectedLog.description}</p>
                </div>
              )}

              {/* Campos Alterados (apenas para UPDATE) */}
              {selectedLog.action_type === 'UPDATE' && selectedLog.changed_fields && selectedLog.changed_fields.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Campos Alterados</Label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedLog.changed_fields.map((field, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Dados Antigos (para UPDATE e DELETE) */}
              {(selectedLog.action_type === 'UPDATE' || selectedLog.action_type === 'DELETE') && selectedLog.old_data && (
                <div>
                  <Label className="text-xs text-muted-foreground">Dados Antigos</Label>
                  <div className="mt-1 p-3 bg-red-50 rounded-md border border-red-200">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.old_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Dados Novos (para CREATE e UPDATE) */}
              {(selectedLog.action_type === 'CREATE' || selectedLog.action_type === 'UPDATE') && selectedLog.new_data && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    {selectedLog.action_type === 'CREATE' ? 'Dados Criados' : 'Dados Novos'}
                  </Label>
                  <div className="mt-1 p-3 bg-green-50 rounded-md border border-green-200">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.new_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Botão para copiar tudo */}
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const fullDetails = {
                      id: selectedLog.id,
                      action_type: selectedLog.action_type,
                      table_name: selectedLog.table_name,
                      record_id: selectedLog.record_id,
                      user_id: selectedLog.user_id,
                      user_email: selectedLog.user_email,
                      user_name: selectedLog.user_name,
                      description: selectedLog.description,
                      ip_address: selectedLog.ip_address,
                      created_at: selectedLog.created_at,
                      old_data: selectedLog.old_data,
                      new_data: selectedLog.new_data,
                      changed_fields: selectedLog.changed_fields,
                    };
                    navigator.clipboard.writeText(JSON.stringify(fullDetails, null, 2));
                    toast.success('Detalhes completos copiados para a área de transferência');
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Detalhes Completos (JSON)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

