import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X, Eye, EyeOff, Copy, Plus, Loader2, Check, Grid3x3, Chrome, Building2, Server, Network, Info, AlertTriangle, ChevronDown, ChevronUp, CreditCard, Wifi, Shield, Globe, Video, Router, Camera, HardDrive, LockKeyhole, Pencil, Table2, LayoutGrid, ArrowUpDown, ArrowUp, ArrowDown, Type, FileText, Download } from "lucide-react"; // Adicionado 'Check' e ícones das abas
import { toast } from "sonner";
import { fetchPasswords, createPassword, updatePassword, type PasswordEntry } from "@/lib/passwordsService";
import { cn } from "@/lib/utils"; // Importa o helper `cn`
// import { logger } from "@/lib/logsService"; // EM DESENVOLVIMENTO - Logs desabilitados temporariamente
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSidebar } from "@/components/ui/sidebar";
import { logAction, AuditAction } from "@/lib/auditService";
import { PasswordField as SecurePasswordField } from "@/components/PasswordField";

// --- Componentes de Card Modulares ---

// Função helper para determinar o tipo do card
function getCardType(password: PasswordEntry): string {
  if (password.tipo) {
    const tipoLower = password.tipo.toLowerCase();
    if (tipoLower.includes('cftv')) return 'cftv';
    if (tipoLower.includes('google')) return 'google';
    if (tipoLower.includes('microsoft')) return 'microsoft';
    if (tipoLower.includes('provedor')) return 'provedor';
    if (tipoLower.includes('rede') || tipoLower.includes('router')) return 'rede';
    if (tipoLower.includes('servidor')) return 'servidor';
    if (tipoLower.includes('intelbras')) return 'intelbras';
    if (tipoLower.includes('acesso web')) return 'acesso web';
    if (tipoLower.includes('maquina cartao') || tipoLower.includes('máquina')) return 'maquina cartao';
  }
  
  // Fallback para categoria
  const category = password.category?.toLowerCase() || '';
  if (category.includes('cftv')) return 'cftv';
  if (category.includes('google')) return 'google';
  if (category.includes('microsoft')) return 'microsoft';
  if (category.includes('provedor')) return 'provedor';
  if (category.includes('rede')) return 'rede';
  if (category.includes('servidor')) return 'servidor';
  if (category.includes('intelbras')) return 'intelbras';
  if (category.includes('acesso web')) return 'acesso web';
  
  return 'outros';
}

// Componente base compartilhado - Helper para copiar
function useCopyHandler(passwordId?: string, passwordService?: string) {
  const [copied, setCopied] = useState<string | null>(null);
  
  const handleCopy = (text: string | undefined, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    
    // Registrar auditoria quando senha ou campo sensível for copiado
    if (passwordId && (label === 'Senha' || label.toLowerCase().includes('senha'))) {
      logAction(
        AuditAction.PASSWORD_COPIED,
        passwordId,
        `Campo copiado: ${label} de ${passwordService || 'registro desconhecido'}`,
        { field: label, service: passwordService }
      ).catch(err => console.warn('Erro ao registrar auditoria:', err));
    }
  };
  
  return { copied, handleCopy };
}

// Componente para campo de texto copiável
function CopyableField({ 
  label, value, copied, onCopy, className = ""
}: { 
  label: string, 
  value: string | null | undefined, 
  copied: string | null,
  onCopy: (text: string, label: string) => void,
  className?: string
}) {
  if (!value) return null;
  
  return (
    <div className={`flex items-center justify-between gap-2 ${className}`}>
      <span className="text-base font-medium text-slate-500 dark:text-slate-400">{label}:</span>
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-md pr-1">
        <span className="text-base font-mono font-medium text-slate-800 dark:text-slate-200 px-2 py-0.5">{value}</span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700" 
          onClick={() => onCopy(value, label)}
        >
          {copied === label ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
        </Button>
      </div>
    </div>
  );
}

// Componente para campo de senha (mantido para compatibilidade, mas agora usa SecurePasswordField internamente)
function PasswordField({ 
  password, 
  isVisible, 
  onToggleVisibility,
  copied,
  onCopy
}: { 
  password: PasswordEntry,
  isVisible: boolean,
  onToggleVisibility: () => void,
  copied: string | null,
  onCopy: (text: string, label: string) => void
}) {
  if (!password.password) return null;
  
  // Usa o componente seguro, mas mantém a interface antiga para compatibilidade
  // O componente seguro gerencia sua própria visibilidade, então ignoramos isVisible
  return (
    <SecurePasswordField
      value={password.password}
      auditLog={true}
      passwordId={password.id}
      passwordService={password.service}
      onCopy={() => onCopy(password.password || '', "Senha")}
    />
  );
}

// Componente para campo de acesso (URL)
function AccessField({ 
  url, 
  copied, 
  onCopy 
}: { 
  url: string | null | undefined, 
  copied: string | null,
  onCopy: (text: string, label: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-base font-medium text-slate-500 dark:text-slate-400">Acesso:</span>
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-md pr-1">
        {url ? (
          <>
            <a 
              href={url.startsWith('http') ? url : `http://${url}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-base font-mono font-medium text-indigo-600 hover:underline truncate max-w-[180px] dark:text-indigo-400 px-2 py-0.5"
            >
              {url}
            </a>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700" 
              onClick={() => onCopy(url, "Acesso")}
            >
              {copied === 'Acesso' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
          </>
        ) : (
          <>
            <span className="text-base font-mono font-medium text-slate-400 dark:text-slate-500 px-2 py-0.5 opacity-50 cursor-not-allowed">
              Sem acesso
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-slate-400 dark:text-slate-600 opacity-50 cursor-not-allowed" 
              disabled
              title="Sem link de acesso disponível"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// Componente de Modal de Detalhes - Mostra todas as colunas da tabela
function DetailsModal({ 
  password, 
  isOpen, 
  onClose, 
  isVisible, 
  onToggleVisibility 
}: { 
  password: PasswordEntry, 
  isOpen: boolean, 
  onClose: () => void,
  isVisible: boolean,
  onToggleVisibility: () => void
}) {
  const { copied, handleCopy } = useCopyHandler(password.id, password.service);

  const fields = [
    { label: 'Tipo', value: password.tipo },
    { label: 'Marina', value: password.marina },
    { label: 'Serviço', value: password.service },
    { label: 'Descrição', value: password.description },
    { label: 'Usuário', value: password.username },
    { label: 'Senha', value: password.password, isPassword: true },
    { label: 'Link de Acesso', value: password.url },
    { label: 'Local', value: password.local },
    { label: 'Contas Compartilhadas', value: password.contas_compartilhadas_info },
    { label: 'Winbox', value: password.winbox },
    { label: 'WWW', value: password.www },
    { label: 'SSH', value: password.ssh },
    { label: 'Cloud Intelbras', value: password.cloud_intelbras },
    { label: 'Link RTSP', value: password.link_rtsp },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Detalhes Completos - {password.service}
          </DialogTitle>
          <DialogDescription>
            Todas as informações disponíveis para esta credencial
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {fields.map((field) => {
            if (!field.value && field.label !== 'Senha') return null;
            
            return (
              <div key={field.label} className="border-b border-slate-200 dark:border-slate-700 pb-3 last:border-0">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 min-w-[180px]">
                    {field.label}:
                  </span>
                  <div className="flex items-center gap-2 flex-1">
                    {field.isPassword ? (
                      <div className="flex-1 flex justify-end">
                        <SecurePasswordField
                          value={field.value || ''}
                          auditLog={true}
                          passwordId={password.id}
                          passwordService={password.service}
                          showLabel={false}
                          className="justify-end"
                        />
                      </div>
                    ) : field.label === 'Link de Acesso' && field.value ? (
                      <>
                        <a
                          href={field.value.startsWith('http') ? field.value : `http://${field.value}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-sm text-indigo-600 hover:underline dark:text-indigo-400 flex-1 text-right truncate"
                        >
                          {field.value}
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopy(field.value || '', field.label)}
                        >
                          {copied === field.label ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm text-slate-800 dark:text-slate-200 flex-1 text-right break-words">
                          {field.value || '-'}
                        </span>
                        {field.value && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleCopy(field.value || '', field.label)}
                          >
                            {copied === field.label ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Card para CFTV
// Campos: serviço, tipo, descrição, marina, usuario, senha, contas_compartilhadas_info, cloud_intelbras
function CFTVCard({ password, isVisible, onToggleVisibility, onEdit }: { password: PasswordEntry, isVisible: boolean, onToggleVisibility: () => void, onEdit: () => void }) {
  const { copied, handleCopy } = useCopyHandler(password.id, password.service);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  // Usa ícone específico de CFTV (câmera de gravação/HD)
  const CFTVIcon = Camera;

  return (
    <>
      <Card className="rounded-xl border-purple-200 dark:border-purple-800 shadow-md hover:shadow-xl transition-all duration-200">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <CFTVIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">{password.service || 'CFTV'}</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-transparent text-xs">
                    {password.tipo || 'CFTV'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                onClick={() => setShowDetailsModal(true)}
                title="Ver Detalhes"
              >
                <FileText className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                onClick={onEdit}
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
        {/* Seção: Marina e Descrição - Informações Principais */}
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-center gap-8">
            {password.marina && (
              <div className="text-center flex-1">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Marina</p>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{password.marina}</p>
              </div>
            )}
            <div className="text-center flex-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Descrição</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{password.description || 'Sem descrição'}</p>
            </div>
          </div>
        </div>

        {/* Seção: Credenciais de Acesso */}
        <div className="space-y-3">
          <div className="pb-2 border-b border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Credenciais</p>
          </div>
          <div className="space-y-2.5 pl-1">
            <CopyableField label="Usuário" value={password.username} copied={copied} onCopy={handleCopy} />
            <PasswordField password={password} isVisible={isVisible} onToggleVisibility={onToggleVisibility} copied={copied} onCopy={handleCopy} />
          </div>
        </div>

        {/* Seção: Informações Adicionais */}
        {(password.contas_compartilhadas_info || password.cloud_intelbras) && (
          <div className="space-y-3">
            <div className="pb-2 border-b border-slate-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Informações Adicionais</p>
            </div>
            <div className="space-y-2.5">
              {/* Contas Compartilhadas */}
              {password.contas_compartilhadas_info && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 block mb-1.5">Contas Compartilhadas:</span>
                  <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">{password.contas_compartilhadas_info}</p>
                </div>
              )}
              
              {/* Cloud Intelbras */}
              {password.cloud_intelbras && (
                <div className="flex items-center justify-between gap-2 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <span className="text-sm font-bold text-purple-700 dark:text-purple-300">Cloud Intelbras:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-mono font-semibold text-purple-800 dark:text-purple-200">{password.cloud_intelbras}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(password.cloud_intelbras || '', "Cloud Intelbras")}>
                      {copied === 'Cloud Intelbras' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    <DetailsModal
      password={password}
      isOpen={showDetailsModal}
      onClose={() => setShowDetailsModal(false)}
      isVisible={isVisible}
      onToggleVisibility={onToggleVisibility}
    />
    </>
  );
}

// Card para Google
// Campos: serviço, descrição, marina, tipo(padrão), usuario, senha, link de acesso, contas_compartilhadas_info (se tiver)
function GoogleCard({ password, isVisible, onToggleVisibility, onEdit }: { password: PasswordEntry, isVisible: boolean, onToggleVisibility: () => void, onEdit: () => void }) {
  const { copied, handleCopy } = useCopyHandler(password.id, password.service);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  // Usa ícone específico do Google (Chrome)
  const GoogleIcon = Chrome;

  return (
    <>
      <Card className="rounded-xl border-blue-200 dark:border-blue-800 shadow-md hover:shadow-xl transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <GoogleIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">{password.service || 'Google'}</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-transparent text-xs">
                    {password.tipo || 'Google'}
                  </Badge>
                  {password.marina && (
                    <Badge variant="outline" className="text-xs border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300">
                      {password.marina}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                onClick={() => setShowDetailsModal(true)}
                title="Ver Detalhes"
              >
                <FileText className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                onClick={onEdit}
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Descrição */}
        {password.description && (
          <div className="pb-2 border-b border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Descrição:</p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{password.description}</p>
          </div>
        )}

        <div className="space-y-2.5">
          {/* Usuario */}
          <CopyableField label="Usuário" value={password.username} copied={copied} onCopy={handleCopy} />
          
          {/* Senha */}
          <PasswordField password={password} isVisible={isVisible} onToggleVisibility={onToggleVisibility} copied={copied} onCopy={handleCopy} />
          
          {/* Acesso */}
          <AccessField url={password.url} copied={copied} onCopy={handleCopy} />
          
          {/* Contas Compartilhadas (se tiver) */}
          {password.contas_compartilhadas_info && (
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 block mb-1">Contas Compartilhadas:</span>
              <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">{password.contas_compartilhadas_info}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    <DetailsModal
      password={password}
      isOpen={showDetailsModal}
      onClose={() => setShowDetailsModal(false)}
      isVisible={isVisible}
      onToggleVisibility={onToggleVisibility}
    />
    </>
  );
}

// Card para Microsoft
// Campos: serviço, descrição, marina, tipo(padrão), usuario, senha, link de acesso, contas_compartilhadas_info
function MicrosoftCard({ password, isVisible, onToggleVisibility, onEdit }: { password: PasswordEntry, isVisible: boolean, onToggleVisibility: () => void, onEdit: () => void }) {
  const { copied, handleCopy } = useCopyHandler(password.id, password.service);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  // Usa ícone específico da Microsoft (Building2 - escritório/empresa)
  const MicrosoftIcon = Building2;

  return (
    <>
      <Card className="rounded-xl border-orange-200 dark:border-orange-800 shadow-md hover:shadow-xl transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <MicrosoftIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">{password.service || 'Microsoft'}</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-transparent text-xs">
                    {password.tipo || 'Microsoft'}
                  </Badge>
                  {password.marina && (
                    <Badge variant="outline" className="text-xs border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300">
                      {password.marina}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                onClick={() => setShowDetailsModal(true)}
                title="Ver Detalhes"
              >
                <FileText className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                onClick={onEdit}
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Descrição */}
        {password.description && (
          <div className="pb-2 border-b border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Descrição:</p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{password.description}</p>
          </div>
        )}

        <div className="space-y-2.5">
          {/* Usuario */}
          <CopyableField label="Usuário" value={password.username} copied={copied} onCopy={handleCopy} />
          
          {/* Senha */}
          <PasswordField password={password} isVisible={isVisible} onToggleVisibility={onToggleVisibility} copied={copied} onCopy={handleCopy} />
          
          {/* Acesso */}
          <AccessField url={password.url} copied={copied} onCopy={handleCopy} />
          
          {/* Contas Compartilhadas */}
          {password.contas_compartilhadas_info && (
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 block mb-1">Contas Compartilhadas:</span>
              <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">{password.contas_compartilhadas_info}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    <DetailsModal
      password={password}
      isOpen={showDetailsModal}
      onClose={() => setShowDetailsModal(false)}
      isVisible={isVisible}
      onToggleVisibility={onToggleVisibility}
    />
    </>
  );
}

// Card para Rede
// Campos: serviço, descrição, marina, tipo(padrão), usuario, senha, link de acesso, contas_compartilhadas_info (se tiver), winbox (se tiver), ssh (se tiver), www (se tiver)
function RedeCard({ password, isVisible, onToggleVisibility, onEdit }: { password: PasswordEntry, isVisible: boolean, onToggleVisibility: () => void, onEdit: () => void }) {
  const { copied, handleCopy } = useCopyHandler(password.id, password.service);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  // Usa ícone específico de Rede (Router)
  const RedeIcon = Router;

  return (
    <>
      <Card className="rounded-xl border-green-200 dark:border-green-800 shadow-md hover:shadow-xl transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <RedeIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">{password.service || 'Rede'}</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-transparent text-xs">
                    {password.tipo || 'Rede'}
                  </Badge>
                  {password.marina && (
                    <Badge variant="outline" className="text-xs border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300">
                      {password.marina}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                onClick={() => setShowDetailsModal(true)}
                title="Ver Detalhes"
              >
                <FileText className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                onClick={onEdit}
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Descrição */}
        {password.description && (
          <div className="pb-2 border-b border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Descrição:</p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{password.description}</p>
          </div>
        )}

        <div className="space-y-2.5">
          {/* Usuario */}
          <CopyableField label="Usuário" value={password.username} copied={copied} onCopy={handleCopy} />
          
          {/* Senha */}
          <PasswordField password={password} isVisible={isVisible} onToggleVisibility={onToggleVisibility} copied={copied} onCopy={handleCopy} />
          
          {/* Acesso */}
          <AccessField url={password.url} copied={copied} onCopy={handleCopy} />
          
          {/* Contas Compartilhadas (se tiver) */}
          {password.contas_compartilhadas_info && (
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 block mb-1">Contas Compartilhadas:</span>
              <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">{password.contas_compartilhadas_info}</p>
            </div>
          )}
          
          {/* Winbox (se tiver) */}
          {password.winbox && (
            <div className="flex items-center justify-between gap-2 p-2.5 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <span className="text-xs font-semibold text-green-700 dark:text-green-300">Winbox:</span>
              <div className="flex items-center gap-1">
                <span className="text-xs font-mono text-green-800 dark:text-green-200">{password.winbox}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(password.winbox || '', "Winbox")}>
                  {copied === 'Winbox' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </div>
          )}
          
          {/* SSH (se tiver) */}
          {password.ssh && (
            <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">SSH:</span>
              <div className="flex items-center gap-1">
                <span className="text-xs font-mono text-slate-800 dark:text-slate-200">{password.ssh}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(password.ssh || '', "SSH")}>
                  {copied === 'SSH' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </div>
          )}
          
          {/* WWW (se tiver) */}
          {password.www && (
            <div className="flex items-center justify-between gap-2 p-2.5 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
              <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-300">WWW:</span>
              <div className="flex items-center gap-1">
                <a 
                  href={password.www.startsWith('http') ? password.www : `http://${password.www}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-cyan-600 hover:underline truncate max-w-[150px] dark:text-cyan-400"
                >
                  {password.www}
                </a>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(password.www || '', "WWW")}>
                  {copied === 'WWW' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    <DetailsModal
      password={password}
      isOpen={showDetailsModal}
      onClose={() => setShowDetailsModal(false)}
      isVisible={isVisible}
      onToggleVisibility={onToggleVisibility}
    />
    </>
  );
}

// Card para Servidor
// Campos: serviço, descrição, marina, tipo(padrão), usuario, senha, link de acesso, contas_compartilhadas_info (se tiver), winbox (se tiver), ssh (se tiver), www (se tiver)
function ServidorCard({ password, isVisible, onToggleVisibility, onEdit }: { password: PasswordEntry, isVisible: boolean, onToggleVisibility: () => void, onEdit: () => void }) {
  const { copied, handleCopy } = useCopyHandler(password.id, password.service);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  // Usa ícone específico de Servidor (HardDrive)
  const ServidorIcon = HardDrive;

  return (
    <>
      <Card className="rounded-xl border-teal-200 dark:border-teal-800 shadow-md hover:shadow-xl transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <ServidorIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">{password.service || 'Servidor'}</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-transparent text-xs">
                    {password.tipo || 'Servidor'}
                  </Badge>
                  {password.marina && (
                    <Badge variant="outline" className="text-xs border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300">
                      {password.marina}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                onClick={() => setShowDetailsModal(true)}
                title="Ver Detalhes"
              >
                <FileText className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                onClick={onEdit}
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Descrição */}
        {password.description && (
          <div className="pb-2 border-b border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Descrição:</p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{password.description}</p>
          </div>
        )}

        <div className="space-y-2.5">
          {/* Usuario */}
          <CopyableField label="Usuário" value={password.username} copied={copied} onCopy={handleCopy} />
          
          {/* Senha */}
          <PasswordField password={password} isVisible={isVisible} onToggleVisibility={onToggleVisibility} copied={copied} onCopy={handleCopy} />
          
          {/* Acesso */}
          <AccessField url={password.url} copied={copied} onCopy={handleCopy} />
          
          {/* Contas Compartilhadas (se tiver) */}
          {password.contas_compartilhadas_info && (
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 block mb-1">Contas Compartilhadas:</span>
              <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">{password.contas_compartilhadas_info}</p>
            </div>
          )}
          
          {/* Winbox (se tiver) */}
          {password.winbox && (
            <div className="flex items-center justify-between gap-2 p-2.5 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <span className="text-xs font-semibold text-green-700 dark:text-green-300">Winbox:</span>
              <div className="flex items-center gap-1">
                <span className="text-xs font-mono text-green-800 dark:text-green-200">{password.winbox}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(password.winbox || '', "Winbox")}>
                  {copied === 'Winbox' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </div>
          )}
          
          {/* SSH (se tiver) */}
          {password.ssh && (
            <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">SSH:</span>
              <div className="flex items-center gap-1">
                <span className="text-xs font-mono text-slate-800 dark:text-slate-200">{password.ssh}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(password.ssh || '', "SSH")}>
                  {copied === 'SSH' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </div>
          )}
          
          {/* WWW (se tiver) */}
          {password.www && (
            <div className="flex items-center justify-between gap-2 p-2.5 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
              <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-300">WWW:</span>
              <div className="flex items-center gap-1">
                <a 
                  href={password.www.startsWith('http') ? password.www : `http://${password.www}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-cyan-600 hover:underline truncate max-w-[150px] dark:text-cyan-400"
                >
                  {password.www}
                </a>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(password.www || '', "WWW")}>
                  {copied === 'WWW' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    <DetailsModal
      password={password}
      isOpen={showDetailsModal}
      onClose={() => setShowDetailsModal(false)}
      isVisible={isVisible}
      onToggleVisibility={onToggleVisibility}
    />
    </>
  );
}

// Card para Provedor
// Campos: serviço, descrição, marina, tipo(padrão), usuario, senha, link de acesso
function ProvedorCard({ password, isVisible, onToggleVisibility, onEdit }: { password: PasswordEntry, isVisible: boolean, onToggleVisibility: () => void, onEdit: () => void }) {
  const { copied, handleCopy } = useCopyHandler(password.id, password.service);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  // Usa ícone específico de Provedor (Server)
  const ProvedorIcon = Server;

  return (
    <>
      <Card className="rounded-xl border-indigo-200 dark:border-indigo-800 shadow-md hover:shadow-xl transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <ProvedorIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">{password.service || 'Provedor'}</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-transparent text-xs">
                    {password.tipo || 'Provedor'}
                  </Badge>
                  {password.marina && (
                    <Badge variant="outline" className="text-xs border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300">
                      {password.marina}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                onClick={() => setShowDetailsModal(true)}
                title="Ver Detalhes"
              >
                <FileText className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                onClick={onEdit}
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Descrição */}
        {password.description && (
          <div className="pb-2 border-b border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Descrição:</p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{password.description}</p>
          </div>
        )}

        <div className="space-y-2.5">
          {/* Usuario */}
          <CopyableField label="Usuário" value={password.username} copied={copied} onCopy={handleCopy} />
          
          {/* Senha */}
          <PasswordField password={password} isVisible={isVisible} onToggleVisibility={onToggleVisibility} copied={copied} onCopy={handleCopy} />
          
          {/* Acesso */}
          <AccessField url={password.url} copied={copied} onCopy={handleCopy} />
        </div>
      </CardContent>
    </Card>
    <DetailsModal
      password={password}
      isOpen={showDetailsModal}
      onClose={() => setShowDetailsModal(false)}
      isVisible={isVisible}
      onToggleVisibility={onToggleVisibility}
    />
    </>
  );
}

// Card para Intelbras
// Campos: serviço, descrição, marina, tipo(padrão), usuario, senha, link de acesso, contas_compartilhadas_info (se tiver)
function IntelbrasCard({ password, isVisible, onToggleVisibility, onEdit }: { password: PasswordEntry, isVisible: boolean, onToggleVisibility: () => void, onEdit: () => void }) {
  const { copied, handleCopy } = useCopyHandler(password.id, password.service);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  // Usa ícone específico da Intelbras (LockKeyhole - controle de acesso/tranca)
  const IntelbrasIcon = LockKeyhole;

  return (
    <>
      <Card className="rounded-xl border-violet-200 dark:border-violet-800 shadow-md hover:shadow-xl transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <IntelbrasIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">{password.service || 'Intelbras'}</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-transparent text-xs">
                    {password.tipo || 'Intelbras'}
                  </Badge>
                  {password.marina && (
                    <Badge variant="outline" className="text-xs border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300">
                      {password.marina}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                onClick={() => setShowDetailsModal(true)}
                title="Ver Detalhes"
              >
                <FileText className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                onClick={onEdit}
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Descrição */}
        {password.description && (
          <div className="pb-2 border-b border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Descrição:</p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{password.description}</p>
          </div>
        )}

        <div className="space-y-2.5">
          {/* Usuario */}
          <CopyableField label="Usuário" value={password.username} copied={copied} onCopy={handleCopy} />
          
          {/* Senha */}
          <PasswordField password={password} isVisible={isVisible} onToggleVisibility={onToggleVisibility} copied={copied} onCopy={handleCopy} />
          
          {/* Acesso */}
          <AccessField url={password.url} copied={copied} onCopy={handleCopy} />
          
          {/* Contas Compartilhadas (se tiver) */}
          {password.contas_compartilhadas_info && (
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 block mb-1">Contas Compartilhadas:</span>
              <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">{password.contas_compartilhadas_info}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    <DetailsModal
      password={password}
      isOpen={showDetailsModal}
      onClose={() => setShowDetailsModal(false)}
      isVisible={isVisible}
      onToggleVisibility={onToggleVisibility}
    />
    </>
  );
}

// Card para Acesso Web
// Campos: serviço, descrição, marina, tipo(padrão), usuario, senha, link de acesso, contas_compartilhadas_info
function AcessoWebCard({ password, isVisible, onToggleVisibility, onEdit }: { password: PasswordEntry, isVisible: boolean, onToggleVisibility: () => void, onEdit: () => void }) {
  const { copied, handleCopy } = useCopyHandler(password.id, password.service);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  // Usa ícone específico de Acesso Web (Globe - internet/web)
  const AcessoWebIcon = Globe;

  return (
    <>
      <Card className="rounded-xl border-cyan-200 dark:border-cyan-800 shadow-md hover:shadow-xl transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <AcessoWebIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">{password.service || 'Acesso Web'}</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border-transparent text-xs">
                    {password.tipo || 'Acesso Web'}
                  </Badge>
                  {password.marina && (
                    <Badge variant="outline" className="text-xs border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300">
                      {password.marina}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                onClick={() => setShowDetailsModal(true)}
                title="Ver Detalhes"
              >
                <FileText className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                onClick={onEdit}
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Descrição */}
        {password.description && (
          <div className="pb-2 border-b border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Descrição:</p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{password.description}</p>
          </div>
        )}

        <div className="space-y-2.5">
          {/* Usuario */}
          <CopyableField label="Usuário" value={password.username} copied={copied} onCopy={handleCopy} />
          
          {/* Senha */}
          <PasswordField password={password} isVisible={isVisible} onToggleVisibility={onToggleVisibility} copied={copied} onCopy={handleCopy} />
          
          {/* Acesso */}
          <AccessField url={password.url} copied={copied} onCopy={handleCopy} />
          
          {/* Contas Compartilhadas */}
          {password.contas_compartilhadas_info && (
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 block mb-1">Contas Compartilhadas:</span>
              <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">{password.contas_compartilhadas_info}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    <DetailsModal
      password={password}
      isOpen={showDetailsModal}
      onClose={() => setShowDetailsModal(false)}
      isVisible={isVisible}
      onToggleVisibility={onToggleVisibility}
    />
    </>
  );
}

// Card genérico (Outros)
function ModernCard({ 
  password, 
  isVisible, 
  onToggleVisibility,
  onEdit
}: { 
  password: PasswordEntry, 
  isVisible: boolean, 
  onToggleVisibility: () => void,
  onEdit: () => void
}) {
  const { copied, handleCopy } = useCopyHandler(password.id, password.service);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const Icon = password.icon;

  return (
    <>
      <Card className="rounded-xl border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-11 h-11 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">{password.service}</CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{password.tipo || password.category || 'Outros'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-transparent">
                {password.tipo || password.category || 'Outros'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                onClick={() => setShowDetailsModal(true)}
                title="Ver Detalhes"
              >
                <FileText className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                onClick={onEdit}
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      <CardContent className="space-y-4">
        {/* Descrição e Marina - responsivo ao tamanho do card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Descrição:</p>
            <p className="text-base text-slate-700 dark:text-slate-300">{password.description || 'Sem descrição'}</p>
          </div>
          {password.marina && (
            <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Marina:</span>
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 mt-1">
                {password.marina}
              </Badge>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {/* Usuario */}
          <CopyableField label="Login" value={password.username} copied={copied} onCopy={handleCopy} />
          
          {/* Senha */}
          <PasswordField password={password} isVisible={isVisible} onToggleVisibility={onToggleVisibility} copied={copied} onCopy={handleCopy} />
          
          {/* Acesso */}
          <AccessField url={password.url} copied={copied} onCopy={handleCopy} />
        </div>
      </CardContent>
    </Card>
    <DetailsModal
      password={password}
      isOpen={showDetailsModal}
      onClose={() => setShowDetailsModal(false)}
      isVisible={isVisible}
      onToggleVisibility={onToggleVisibility}
    />
    </>
  );
}

// Componente Wrapper que escolhe o card correto baseado no tipo
function PasswordCard({ 
  password, 
  isVisible, 
  onToggleVisibility,
  onEdit
}: { 
  password: PasswordEntry, 
  isVisible: boolean, 
  onToggleVisibility: () => void,
  onEdit: () => void
}) {
  const cardType = getCardType(password);

  switch (cardType) {
    case 'cftv':
      return <CFTVCard password={password} isVisible={isVisible} onToggleVisibility={onToggleVisibility} onEdit={onEdit} />;
    case 'google':
      return <GoogleCard password={password} isVisible={isVisible} onToggleVisibility={onToggleVisibility} onEdit={onEdit} />;
    case 'microsoft':
      return <MicrosoftCard password={password} isVisible={isVisible} onToggleVisibility={onToggleVisibility} onEdit={onEdit} />;
    case 'rede':
      return <RedeCard password={password} isVisible={isVisible} onToggleVisibility={onToggleVisibility} onEdit={onEdit} />;
    case 'servidor':
      return <ServidorCard password={password} isVisible={isVisible} onToggleVisibility={onToggleVisibility} onEdit={onEdit} />;
    case 'provedor':
      return <ProvedorCard password={password} isVisible={isVisible} onToggleVisibility={onToggleVisibility} onEdit={onEdit} />;
    case 'intelbras':
      return <IntelbrasCard password={password} isVisible={isVisible} onToggleVisibility={onToggleVisibility} onEdit={onEdit} />;
    case 'acesso web':
      return <AcessoWebCard password={password} isVisible={isVisible} onToggleVisibility={onToggleVisibility} onEdit={onEdit} />;
    default:
      return <ModernCard password={password} isVisible={isVisible} onToggleVisibility={onToggleVisibility} onEdit={onEdit} />;
  }
}

// --- Componente Principal Senhas ---

// ++ Tipos de Entrada ++
const entryTypes = [
  { id: 'provedor', label: 'Provedor', icon: Server },
  { id: 'cftv', label: 'CFTV', icon: Network },
  { id: 'acesso web', label: 'Acesso Web', icon: Globe },
  { id: 'maquina cartao', label: 'Máquina de Cartão', icon: CreditCard },
  { id: 'intelbras', label: 'Intelbras', icon: Wifi },
  { id: 'outros', label: 'Outros', icon: Plus },
];

const accountTypes = [
  { id: 'google', label: 'Conta Google', icon: Chrome },
  { id: 'microsoft', label: 'Conta Microsoft', icon: Building2 },
];

// ++ Lista de Marinas válidas ++
const marinasList = [
  'Búzios',
  'Glória',
  'Itacuruça',
  'Verolme',
  'Piratas',
  'Ribeira',
  'Bracuhy JL',
  'Piccola',
  'Refúgio Piratas',
  'Boa Vista',
];

// ++ Nossas novas abas de filtro ++
const tabCategories = [
  "Todos",
  "CFTV",
  "Google",
  "Microsoft",
  "Rede",
  "Servidor",
  "Intelbras",
  "Acesso Web",
  "Provedores",
];

// ++ Mapeamento de ícones para cada categoria ++
const tabIcons: Record<string, typeof Grid3x3> = {
  "Todos": Grid3x3,
  "CFTV": Video,
  "Google": Chrome,
  "Microsoft": Building2,
  "Rede": Router,
  "Servidor": HardDrive,
  "Intelbras": Wifi,
  "Acesso Web": Globe,
  "Provedores": Server,
};

// ++ Mapeamento de aba para tipo representativo (para cores) ++
const tabToTipoMap: Record<string, string> = {
  "Todos": "todos",
  "CFTV": "cftv",
  "Google": "conta google",
  "Microsoft": "conta microsoft",
  "Rede": "rede",
  "Servidor": "servidor",
  "Intelbras": "intelbras",
  "Acesso Web": "acesso web",
  "Provedores": "provedor",
};

// ++ Mapeamento de cores fixas dos cards (mesmas cores usadas nos badges dos cards) ++
const tabColorClasses: Record<string, string> = {
  "Todos": "bg-slate-50 dark:bg-slate-950/20 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800",
  "CFTV": "bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  "Google": "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  "Microsoft": "bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  "Rede": "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
  "Servidor": "bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800",
  "Intelbras": "bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  "Acesso Web": "bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
  "Provedores": "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
};

// ++ Lista fixa de tipos (sem repetir as abas principais) ++
const allTypes = [
  "outros"
];

// ++ Mapeamento de ícones para os tipos ++
const typeIcons: Record<string, typeof Grid3x3> = {
  "outros": Grid3x3,
};

// ++ Interface para problemas encontrados ++
interface PasswordProblem {
  id: string;
  service: string;
  missingFields: string[];
}

// ++ Função para verificar problemas nos cards ++
function checkPasswordProblems(passwords: PasswordEntry[]): PasswordProblem[] {
  const problems: PasswordProblem[] = [];
  
  passwords.forEach((password) => {
    // Ignora cards com status "sim"
    if (password.status && password.status.toLowerCase() === 'sim') {
      return;
    }
    
    const missingFields: string[] = [];
    
    // Verifica se o serviço está vazio ou sem valor
    if (!password.service || password.service.trim() === '') {
      missingFields.push('Serviço');
    }
    
    // Verifica se o utilizador está faltando
    if (!password.username || password.username.trim() === '' || password.username === 'N/A') {
      missingFields.push('Utilizador');
    }
    
    // Verifica se a senha está faltando
    if (!password.password || password.password.trim() === '') {
      missingFields.push('Senha');
    }
    
    // Se houver algum problema, adiciona à lista
    if (missingFields.length > 0) {
      problems.push({
        id: password.id,
        service: password.service || 'Sem nome',
        missingFields: missingFields
      });
    }
  });
  
  return problems;
}

// ++ Função para identificar a categoria do serviço ++
function getServiceCategory(password: PasswordEntry): string {
  // Primeiro verifica se tem o campo tipo na tabela
  if (password.tipo) {
    const tipoLower = password.tipo.toLowerCase();
    // Mapeia os tipos da tabela para as abas
    if (tipoLower.includes('cftv')) return 'CFTV';
    if (tipoLower.includes('google')) return 'Google';
    if (tipoLower.includes('microsoft')) return 'Microsoft';
    if (tipoLower.includes('rede') || tipoLower.includes('router')) return 'Rede';
    if (tipoLower.includes('servidor')) return 'Servidor';
    if (tipoLower.includes('intelbras')) return 'Intelbras';
    if (tipoLower.includes('acesso web') || tipoLower.includes('acesso web')) return 'Acesso Web';
    if (tipoLower.includes('provedor')) return 'Provedores';
  }

  const service = (password.service || '').toLowerCase();
  const description = (password.description || '').toLowerCase();
  const provider = password.provider?.toLowerCase() || '';

  // 1. Verifica pelo provider primeiro
  if (provider === 'google') return 'Google';
  if (provider === 'microsoft') return 'Microsoft';
  if (provider === 'provedores') return 'Provedores';
  if (provider === 'routerboard') return 'Rede';

  // 2. Verifica por palavras-chave no nome do serviço e descrição
  const searchText = `${service} ${description}`;

  // CFTV
  if (searchText.includes('cftv') || searchText.includes('nvr') || searchText.includes('câmera')) {
    return 'CFTV';
  }

  // Google
  if (searchText.includes('google') || searchText.includes('gmail') || searchText.includes('g suite') || searchText.includes('workspace')) {
    return 'Google';
  }

  // Microsoft
  if (searchText.includes('microsoft') || searchText.includes('outlook') || searchText.includes('office 365') || searchText.includes('azure') || searchText.includes('onedrive') || searchText.includes('sharepoint')) {
    return 'Microsoft';
  }

  // Servidor
  if (searchText.includes('servidor') || searchText.includes('server')) {
    return 'Servidor';
  }

  // Intelbras
  if (searchText.includes('intelbras') || searchText.includes('cloud intelbras')) {
    return 'Intelbras';
  }

  // Acesso Web
  if (searchText.includes('acesso web') || (searchText.includes('web') && !searchText.includes('acesso web'))) {
    return 'Acesso Web';
  }

  // Provedores
  if (searchText.includes('provedor') && !searchText.includes('roteador provedor')) {
    return 'Provedores';
  }

  // Rede - palavras-chave específicas
  if (
    searchText.includes('roteador') ||
    searchText.includes('router') ||
    searchText.includes('access point') ||
    searchText.includes('accesspoint') ||
    searchText.includes('ap ') ||
    searchText.includes(' wifi') ||
    searchText.includes('wifi ') ||
    searchText.includes('mikrotik') ||
    searchText.includes('roteador provedor') ||
    searchText.includes('load balance') ||
    searchText.includes('loadbalance') ||
    searchText.includes('winbox') ||
    searchText.includes('switch') ||
    searchText.includes('firewall')
  ) {
    return 'Rede';
  }

  // Geral - tudo que não se encaixa nas categorias acima
  return 'Geral';
}

export default function Senhas() {
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // ++ Estado da ABA ATIVA (substitui o categoryFilter) ++
  const [activeTab, setActiveTab] = useState("Todos"); 
  // (O categoryFilter foi removido)

  // ++ Novos estados para os dropdowns dinâmicos ++
  const [subCategoryFilter, setSubCategoryFilter] = useState("todas");
  const [serviceFilter, setServiceFilter] = useState("todos");
  
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [showProblemsMenu, setShowProblemsMenu] = useState(false);
  const [showTypeSelectorModal, setShowTypeSelectorModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showAllOptions, setShowAllOptions] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">(() => {
    if (typeof window === "undefined") return "table";
    const stored = window.localStorage.getItem("senhas_view_mode");
    return stored === "cards" || stored === "table" ? stored : "table";
  }); // Modo de visualização: cards ou planilha, sincronizado com localStorage
  const [sortColumn, setSortColumn] = useState<string | null>(null); // Coluna atual para ordenação
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc"); // Direção da ordenação
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window === "undefined") return 14;
    try {
      const stored = window.localStorage.getItem("senhas_font_size");
      if (stored) {
        const size = parseInt(stored, 10);
        if (!isNaN(size) && size >= 10 && size <= 24) {
          return size;
        }
      }
    } catch {
      // ignore
    }
    return 14;
  }); // Tamanho da fonte em pixels (padrão 14px = text-sm)
  const [showSearchField, setShowSearchField] = useState(false); // Controla visibilidade do campo de busca
  const [showProblemsModal, setShowProblemsModal] = useState(false); // Controla o modal de cards com problema
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    service: '',
    username: '',
    password: '',
    description: '',
    url: '',
    marina: '',
    local: '',
    contas_compartilhadas_info: '',
    winbox: '',
    www: '',
    ssh: '',
    cloud_intelbras: '',
    link_rtsp: '',
    tipo: '',
    status: '',
    provider: null as "google" | "microsoft" | "routerboard" | "provedores" | "nvr" | null,
  });

  // Carregar senhas do Supabase
  useEffect(() => {
    loadPasswords();
  }, []);

  // Listener para Ctrl+F e F3 para abrir campo de busca
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F ou F3
      if ((e.ctrlKey && e.key === 'f') || e.key === 'F3') {
        e.preventDefault();
        setShowSearchField(true);
        // Foca no campo de busca após um pequeno delay para garantir que ele está renderizado
        setTimeout(() => {
          const searchInput = document.querySelector('input[type="text"][placeholder*="Buscar"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        }, 100);
      }
      // ESC para fechar o campo se estiver vazio
      if (e.key === 'Escape' && !searchTerm && showSearchField) {
        setShowSearchField(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [searchTerm, showSearchField]);

  // Foca no campo quando ele é aberto
  useEffect(() => {
    if (showSearchField) {
      setTimeout(() => {
        const searchInput = document.querySelector('input[type="text"][placeholder*="Buscar"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }, 50);
    }
  }, [showSearchField]);

  // Mantém o campo aberto se houver texto
  useEffect(() => {
    if (searchTerm && !showSearchField) {
      setShowSearchField(true);
    }
  }, [searchTerm]);

  // Verifica problemas nos cards
  const passwordProblems = checkPasswordProblems(passwords);

  // Função para gerar cor consistente baseada em uma string
  const getColorForValue = (value: string, type: 'tipo' | 'marina'): string => {
    if (!value) return 'slate';
    
    // Paletas de cores diferentes para tipo e marina
    const tipoColors = [
      'blue', 'green', 'purple', 'orange', 'red', 'indigo', 
      'pink', 'teal', 'cyan', 'amber', 'violet', 'emerald'
    ];
    
    const marinaColors = [
      'blue', 'emerald', 'violet', 'rose', 'sky', 'lime',
      'fuchsia', 'indigo', 'amber', 'teal', 'pink', 'cyan'
    ];
    
    const colors = type === 'tipo' ? tipoColors : marinaColors;
    
    // Hash simples para gerar índice consistente
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = value.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Função para obter classes de cor Tailwind
  const getColorClasses = (value: string, type: 'tipo' | 'marina'): string => {
    if (!value) return 'bg-slate-50 dark:bg-slate-950/20 text-slate-700 dark:text-slate-300';
    
    const color = getColorForValue(value, type);
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      green: 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
      purple: 'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      orange: 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
      red: 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
      indigo: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      pink: 'bg-pink-50 dark:bg-pink-950/20 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800',
      teal: 'bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
      cyan: 'bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
      amber: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      violet: 'bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800',
      emerald: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      rose: 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      sky: 'bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      lime: 'bg-lime-50 dark:bg-lime-950/20 text-lime-700 dark:text-lime-300 border-lime-200 dark:border-lime-800',
      fuchsia: 'bg-fuchsia-50 dark:bg-fuchsia-950/20 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800',
      slate: 'bg-slate-50 dark:bg-slate-950/20 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800',
    };
    
    return colorMap[color] || colorMap.slate;
  };

  const loadPasswords = async () => {
    try {
      setLoading(true);
      // logger.info('SENHAS', 'Carregando senhas...'); // EM DESENVOLVIMENTO
      const data = await fetchPasswords();
      setPasswords(data);
      
      if (data.length === 0) {
        // logger.warning('SENHAS', 'Nenhuma senha encontrada na tabela', {
        //   possiveisCausas: [
        //     'A tabela está vazia',
        //     'O nome da tabela está incorreto em src/lib/passwordsConfig.ts',
        //     'Os campos não estão mapeados corretamente'
        //   ]
        // }); // EM DESENVOLVIMENTO
      } else {
        // logger.success('SENHAS', `${data.length} senha(s) carregada(s) com sucesso`); // EM DESENVOLVIMENTO
      }
    } catch (error: any) {
      // logger.error('SENHAS', 'Erro ao carregar senhas', {
      //   erro: error?.message || error,
      // }, error?.stack); // EM DESENVOLVIMENTO
      
      // Mensagens de erro mais específicas
      if (error?.message?.includes('não encontrada') || error?.message?.includes('does not exist')) {
        toast.error(
          'Funções RPC não encontradas. Execute o script docs/sql/passwords_rpc_functions.sql no Supabase.',
          { duration: 5000 }
        );
      } else if (error?.message?.includes('permission denied') || error?.message?.includes('políticas RLS')) {
        toast.error(
          'Permissão negada. Verifique as políticas RLS e permissões das funções RPC no Supabase.',
          { duration: 5000 }
        );
      } else {
        toast.error(
          'Erro ao carregar senhas. Verifique sua conexão com o Supabase e as configurações.',
          { duration: 5000 }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ++ LÓGICA DE FILTRO ATUALIZADA ++

  // 1. Filtra primeiro pela ABA ATIVA (Categoria Principal)
  // Usa a função getServiceCategory para identificar corretamente a categoria
  const passwordsInTab = passwords.filter((password) => {
    if (activeTab === "Todos") return true;
    const serviceCategory = getServiceCategory(password);
    return serviceCategory === activeTab;
  });

  // 2. Usa a lista fixa de tipos
  const subCategories = ["todas", ...allTypes];
  const services = ["todos", ...Array.from(new Set(passwordsInTab.map((p) => p.service)))];

  // Expõe lista de serviços para o header global (Layout) montar o dropdown
  useEffect(() => {
    try {
      const event = new CustomEvent("senhas:servicesUpdated", { detail: services });
      window.dispatchEvent(event);
    } catch {
      // ignore
    }
  }, [services]);

  // Escuta alterações de busca e serviço vindas do header global (Layout)
  useEffect(() => {
    const handleSearchChange = (e: Event) => {
      const custom = e as CustomEvent<string>;
      setSearchTerm(custom.detail ?? "");
    };

    const handleServiceChange = (e: Event) => {
      const custom = e as CustomEvent<string>;
      setServiceFilter(custom.detail ?? "todos");
    };

    window.addEventListener("senhas:setSearch", handleSearchChange);
    window.addEventListener("senhas:setService", handleServiceChange);

    return () => {
      window.removeEventListener("senhas:setSearch", handleSearchChange);
      window.removeEventListener("senhas:setService", handleServiceChange);
    };
  }, []);

  // 3. Filtra a lista da aba pelos filtros restantes (busca, subcategoria, serviço)
  let filteredPasswords = passwordsInTab.filter((password) => {
    const matchesSearch =
      !searchTerm ||
      password.service?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      password.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      password.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // O filtro de subcategoria (tipo) só se aplica se houver tipos
    const passwordTipo = password.tipo?.toLowerCase() || '';
    const matchesSubCategory = 
      subCategoryFilter === "todas" || 
      passwordTipo === subCategoryFilter.toLowerCase();
      
    const matchesService = serviceFilter === "todos" || password.service === serviceFilter;
    
    return matchesSearch && matchesSubCategory && matchesService;
  });

  // 4. Aplica ordenação se houver coluna selecionada
  if (sortColumn) {
    filteredPasswords = [...filteredPasswords].sort((a, b) => {
      let aValue: string = '';
      let bValue: string = '';

      switch (sortColumn) {
        case 'tipo':
          aValue = (a.tipo || '').toLowerCase();
          bValue = (b.tipo || '').toLowerCase();
          break;
        case 'marina':
          aValue = (a.marina || '').toLowerCase();
          bValue = (b.marina || '').toLowerCase();
          break;
        case 'service':
          aValue = (a.service || '').toLowerCase();
          bValue = (b.service || '').toLowerCase();
          break;
        case 'description':
          aValue = (a.description || '').toLowerCase();
          bValue = (b.description || '').toLowerCase();
          break;
        case 'username':
          aValue = (a.username || '').toLowerCase();
          bValue = (b.username || '').toLowerCase();
          break;
        case 'password':
          aValue = (a.password || '').toLowerCase();
          bValue = (b.password || '').toLowerCase();
          break;
        case 'url':
          aValue = (a.url || '').toLowerCase();
          bValue = (b.url || '').toLowerCase();
          break;
        case 'local':
          aValue = (a.local || '').toLowerCase();
          bValue = (b.local || '').toLowerCase();
          break;
        case 'contas_compartilhadas':
          aValue = (a.contas_compartilhadas_info || '').toLowerCase();
          bValue = (b.contas_compartilhadas_info || '').toLowerCase();
          break;
        case 'winbox':
          aValue = (a.winbox || '').toLowerCase();
          bValue = (b.winbox || '').toLowerCase();
          break;
        case 'www':
          aValue = (a.www || '').toLowerCase();
          bValue = (b.www || '').toLowerCase();
          break;
        case 'ssh':
          aValue = (a.ssh || '').toLowerCase();
          bValue = (b.ssh || '').toLowerCase();
          break;
        case 'cloud_intelbras':
          aValue = (a.cloud_intelbras || '').toLowerCase();
          bValue = (b.cloud_intelbras || '').toLowerCase();
          break;
        case 'link_rtsp':
          aValue = (a.link_rtsp || '').toLowerCase();
          bValue = (b.link_rtsp || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Função para lidar com a ordenação
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Se já está ordenando por esta coluna, inverte a direção
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Se é uma nova coluna, começa com ascendente
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // ++ FIM DA LÓGICA DE FILTRO ATUALIZADA ++

  // Esta função agora controla a visibilidade para todos os cards
  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => {
      const newSet = new Set(prev);
      const isBecomingVisible = !newSet.has(id);
      
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
        
        // Registrar auditoria quando senha for visualizada
        const password = passwords.find(p => p.id === id);
        if (password && isBecomingVisible) {
          logAction(
            AuditAction.PASSWORD_VIEWED,
            id,
            `Senha visualizada: ${password.service || 'Sem nome'}`,
            { service: password.service, category: password.category }
          ).catch(err => console.warn('Erro ao registrar auditoria:', err));
        }
      }
      return newSet;
    });
  };

  // Função para resetar o formulário
  const resetForm = () => {
    setFormData({
      service: '',
      username: '',
      password: '',
      description: '',
      url: '',
      marina: '',
      local: '',
      contas_compartilhadas_info: '',
      winbox: '',
      www: '',
      ssh: '',
      cloud_intelbras: '',
      link_rtsp: '',
      tipo: '',
      status: '',
      provider: null,
    });
    setSelectedType(null);
    setShowAllOptions(false);
  };

  // Função para resetar apenas os dados do formulário (sem limpar o tipo)
  const resetFormData = () => {
    setFormData({
      service: '',
      username: '',
      password: '',
      description: '',
      url: '',
      marina: '',
      local: '',
      contas_compartilhadas_info: '',
      winbox: '',
      www: '',
      ssh: '',
      cloud_intelbras: '',
      link_rtsp: '',
      tipo: '',
      status: '',
      provider: null,
    });
    setShowAllOptions(false);
  };

  // Função para lidar com a seleção de tipo
  const handleTypeSelect = (type: string) => {
    // Primeiro reseta os dados do formulário (mas mantém o tipo)
    resetFormData();
    
    // Define o tipo selecionado
    setSelectedType(type);

    // Pré-preenche campos com base no tipo
    if (type === 'google') {
      setFormData(prev => ({ ...prev, service: 'Google', provider: 'google' }));
    } else if (type === 'microsoft') {
      setFormData(prev => ({ ...prev, service: 'Microsoft', provider: 'microsoft' }));
    } else if (type === 'cftv') {
      setFormData(prev => ({ ...prev, service: 'CFTV' }));
    } else if (type === 'provedor') {
      setFormData(prev => ({ ...prev, provider: 'provedores' }));
    }

    // Fecha o modal de seleção e abre o modal de formulário
    setShowTypeSelectorModal(false);
    setShowFormModal(true);
  };

  // Função para lidar com o submit do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação - Serviço e Descrição são obrigatórios
    if (!formData.service.trim()) {
      toast.error('O campo Serviço é obrigatório');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('O campo Descrição é obrigatório');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Cria a senha - usa o tipo selecionado como serviço se não houver serviço preenchido
      const serviceValue = formData.service.trim() || selectedType || 'Outros';
      
      // Deriva a categoria automaticamente baseado no serviço e descrição
      const category = getServiceCategory({
        id: '',
        service: serviceValue,
        username: formData.username,
        password: formData.password,
        category: '',
        description: formData.description,
        icon: Grid3x3,
        url: formData.url,
        provider: formData.provider,
      });
      
      const newPassword = {
        service: serviceValue,
        username: formData.username.trim() || null,
        password: formData.password.trim() || null,
        description: formData.description.trim() || null,
        url: formData.url.trim() || null,
        // category, icon e provider são derivados/calculados, não são salvos na tabela
        marina: formData.marina.trim() || null,
        local: formData.local.trim() || null,
        contas_compartilhadas_info: formData.contas_compartilhadas_info.trim() || null,
        winbox: formData.winbox.trim() || null,
        www: formData.www.trim() || null,
        ssh: formData.ssh.trim() || null,
        cloud_intelbras: formData.cloud_intelbras.trim() || null,
        link_rtsp: formData.link_rtsp.trim() || null,
        tipo: formData.tipo.trim() || null,
        status: formData.status.trim() || null,
      };

      // Log detalhado antes de salvar - EM DESENVOLVIMENTO
      // logger.info('SENHAS', 'Adicionando nova senha', {
      //   tipo: selectedType,
      //   categoria: category,
      //   dados: {
      //     ...newPassword,
      //     password: newPassword.password ? '***' : null, // Não loga a senha real
      //   },
      // });

      const createdPassword = await createPassword(newPassword);

      // Log de sucesso - EM DESENVOLVIMENTO
      // logger.success('SENHAS', 'Senha adicionada com sucesso!', {
      //   id: createdPassword.id,
      //   service: createdPassword.service,
      //   tipo: createdPassword.tipo || category,
      // });

      toast.success('Senha adicionada com sucesso!');
      setShowFormModal(false);
      resetForm();
      loadPasswords(); // Recarrega a lista
    } catch (error: any) {
      // Log detalhado de erro - EM DESENVOLVIMENTO
      // logger.error('SENHAS', 'Erro ao adicionar senha', {
      //   erro: error?.message || error,
      //   tipo: selectedType,
      //   dadosTentados: {
      //     service: formData.service,
      //     tipo: formData.tipo,
      //     marina: formData.marina,
      //   },
      // }, error?.stack);
      toast.error(error?.message || 'Erro ao adicionar senha. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para abrir modal de edição
  const handleEdit = (password: PasswordEntry) => {
    setEditingPassword(password);
    setFormData({
      service: password.service || '',
      username: password.username || '',
      password: password.password || '',
      description: password.description || '',
      url: password.url || '',
      marina: password.marina || '',
      local: password.local || '',
      contas_compartilhadas_info: password.contas_compartilhadas_info || '',
      winbox: password.winbox || '',
      www: password.www || '',
      ssh: password.ssh || '',
      cloud_intelbras: password.cloud_intelbras || '',
      link_rtsp: password.link_rtsp || '',
      tipo: password.tipo || '',
      status: password.status || '',
      provider: password.provider || null,
    });
    setShowAllOptions(true); // Mostra todos os campos ao editar
    setShowEditModal(true);
  };

  // Função para salvar edição
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingPassword) return;

    // Validação - Serviço e Descrição são obrigatórios
    if (!formData.service.trim()) {
      toast.error('O campo Serviço é obrigatório');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('O campo Descrição é obrigatório');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const updatedPassword = {
        service: formData.service.trim() || null,
        username: formData.username.trim() || null,
        password: formData.password.trim() || null,
        description: formData.description.trim() || null,
        url: formData.url.trim() || null,
        marina: formData.marina.trim() || null,
        local: formData.local.trim() || null,
        contas_compartilhadas_info: formData.contas_compartilhadas_info.trim() || null,
        winbox: formData.winbox.trim() || null,
        www: formData.www.trim() || null,
        ssh: formData.ssh.trim() || null,
        cloud_intelbras: formData.cloud_intelbras.trim() || null,
        link_rtsp: formData.link_rtsp.trim() || null,
        tipo: formData.tipo.trim() || null,
        status: formData.status.trim() || null,
      };

      await updatePassword(editingPassword.id, updatedPassword);
      
      toast.success('Senha atualizada com sucesso!');
      setShowEditModal(false);
      setEditingPassword(null);
      resetForm();
      loadPasswords(); // Recarrega a lista
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao atualizar senha. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Removida a função getCategoryColor, pois o novo card tem cores fixas

  // Função para exportar CSV
  const handleExportCSV = () => {
    try {
      // Define os cabeçalhos do CSV
      const headers = [
        'ID',
        'Serviço',
        'Usuário',
        'Senha',
        'Categoria',
        'Descrição',
        'URL',
        'Marina',
        'Local',
        'Tipo',
        'Provider',
        'Contas Compartilhadas',
        'Winbox',
        'WWW',
        'SSH',
        'Cloud Intelbras',
        'Link RTSP',
        'Criado em',
        'Atualizado em'
      ];

      // Converte os dados para CSV
      const csvRows = [headers.join(',')];

      passwords.forEach((password) => {
        const row = [
          password.id || '',
          `"${(password.service || '').replace(/"/g, '""')}"`,
          `"${(password.username || '').replace(/"/g, '""')}"`,
          `"${(password.password || '').replace(/"/g, '""')}"`,
          `"${(password.category || '').replace(/"/g, '""')}"`,
          `"${(password.description || '').replace(/"/g, '""')}"`,
          `"${(password.url || '').replace(/"/g, '""')}"`,
          `"${(password.marina || '').replace(/"/g, '""')}"`,
          `"${(password.local || '').replace(/"/g, '""')}"`,
          `"${(password.tipo || '').replace(/"/g, '""')}"`,
          `"${(password.provider || '').replace(/"/g, '""')}"`,
          `"${(password.contas_compartilhadas_info || '').replace(/"/g, '""')}"`,
          `"${(password.winbox || '').replace(/"/g, '""')}"`,
          `"${(password.www || '').replace(/"/g, '""')}"`,
          `"${(password.ssh || '').replace(/"/g, '""')}"`,
          `"${(password.cloud_intelbras || '').replace(/"/g, '""')}"`,
          `"${(password.link_rtsp || '').replace(/"/g, '""')}"`,
          '',
          ''
        ];
        csvRows.push(row.join(','));
      });

      // Cria o conteúdo CSV
      const csvContent = csvRows.join('\n');
      
      // Cria um Blob e faz o download
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `senhas_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Registrar auditoria de exportação
      logAction(
        AuditAction.PASSWORD_EXPORTED,
        'export-csv-' + Date.now(),
        `Exportação de ${passwords.length} senhas para CSV`,
        { total_records: passwords.length, format: 'CSV' }
      ).catch(err => console.warn('Erro ao registrar auditoria:', err));
      
      toast.success('CSV exportado com sucesso!');
    } catch (error: any) {
      toast.error(`Erro ao exportar CSV: ${error?.message || 'Erro desconhecido'}`);
    }
  };

  // Lógica de exibição condicional dos campos
  const typeLabel = selectedType === 'cftv' ? 'Numeração' : 'Descrição (Observação)';
  const typePlaceholder = selectedType === 'cftv' ? 'Ex: NVR 01' : 'Descrição ou observações...';

  // Se "Mostrar todas as opções" estiver ativado, mostra TODOS os campos da tabela
  // Caso contrário, mostra apenas os campos específicos do tipo selecionado
  
  // Campos específicos por tipo:
  // - provedor: serviço, descrição, marina, usuário, senha, link de acesso
  // - CFTV: marina, descrição (numeração), usuário, senha, cloud_intelbras, link de acesso (SEM serviço)
  // - Outros: todas as colunas (todos opcionais exceto serviço)
  // - google/microsoft: serviço, descrição, usuário, senha, url
  // - acesso web: serviço, descrição, marina, usuário, senha, link de acesso
  // - maquina cartao: serviço, descrição, marina, usuário, senha, link de acesso
  // - intelbras: serviço, descrição, marina, usuário, senha, link de acesso

  // Declara as variáveis de exibição com valores padrão
  let showService: boolean = false;
  let showDescription: boolean = false;
  let showMarina: boolean = false;
  let showUser: boolean = false;
  let showPass: boolean = false;
  let showUrl: boolean = false;
  let showCloudIntelbras: boolean = false;
  let showProvider: boolean = false;
  
  // Variáveis para campos adicionais (só aparecem quando "Mostrar todas as opções" está ativo)
  let showLocal: boolean = false;
  let showContasCompartilhadas: boolean = false;
  let showWinbox: boolean = false;
  let showWww: boolean = false;
  let showSsh: boolean = false;
  let showLinkRtsp: boolean = false;
  let showTipo: boolean = false;

  // Se "Mostrar todas as opções" estiver ativado, mostra TODOS os campos
  if (showAllOptions) {
    showService = true;
    showDescription = true;
    showMarina = true;
    showUser = true;
    showPass = true;
    showUrl = true;
    showCloudIntelbras = true;
    showProvider = true;
    showLocal = true;
    showContasCompartilhadas = true;
    showWinbox = true;
    showWww = true;
    showSsh = true;
    showLinkRtsp = true;
    showTipo = true;
  } else if (selectedType) {
    // Mostra apenas os campos específicos do tipo selecionado
    switch (selectedType) {
      case 'provedor':
        showService = true;
        showDescription = true;
        showMarina = true;
        showUser = true;
        showPass = true;
        showUrl = true;
        showCloudIntelbras = false;
        showProvider = false;
        break;
      case 'cftv':
        showService = false; // CFTV não tem serviço
        showDescription = true;
        showMarina = true;
        showUser = true;
        showPass = true;
        showUrl = true;
        showCloudIntelbras = true;
        showProvider = false;
        break;
      case 'outros':
        // Outros mostra todos os campos
        showService = true;
        showDescription = true;
        showMarina = true;
        showUser = true;
        showPass = true;
        showUrl = true;
        showCloudIntelbras = true;
        showProvider = true;
        break;
      case 'google':
      case 'microsoft':
        showService = true;
        showDescription = true;
        showMarina = false;
        showUser = true;
        showPass = true;
        showUrl = true;
        showCloudIntelbras = false;
        showProvider = false;
        break;
      case 'acesso web':
      case 'maquina cartao':
      case 'intelbras':
        showService = true;
        showDescription = true;
        showMarina = true;
        showUser = true;
        showPass = true;
        showUrl = true;
        showCloudIntelbras = false;
        showProvider = false;
        break;
    }
  }

  const { setOpenMobile, isMobile } = useSidebar();
  const [isPortrait, setIsPortrait] = useState(false);
  // Começa ignorando o aviso para não bloquear o acesso à planilha no modo retrato
  const [ignoreOrientationWarning, setIgnoreOrientationWarning] = useState(true);

  // Detectar orientação e controlar sidebar (igual ao ControleNVR)
  // Sincroniza viewMode com localStorage e com o header global (eventos customizados)
  useEffect(() => {
    try {
      window.localStorage.setItem("senhas_view_mode", viewMode);
    } catch {
      // ignore
    }

    // Notifica o header/layout que o modo mudou
    const event = new CustomEvent("senhas:viewModeChanged", { detail: viewMode });
    window.dispatchEvent(event);
  }, [viewMode]);

  // Sincroniza fontSize com localStorage e com o header global
  useEffect(() => {
    try {
      window.localStorage.setItem("senhas_font_size", fontSize.toString());
    } catch {
      // ignore
    }

    // Notifica o header/layout que o tamanho da fonte mudou
    const event = new CustomEvent("senhas:fontSizeChanged", { detail: fontSize });
    window.dispatchEvent(event);
  }, [fontSize]);

  useEffect(() => {
    const handleSetViewMode = (e: Event) => {
      const custom = e as CustomEvent;
      const mode = custom.detail;
      if (mode === "cards" || mode === "table") {
        setViewMode(mode);
      }
    };

    const handleSetFontSize = (e: Event) => {
      const custom = e as CustomEvent;
      const size = custom.detail;
      if (typeof size === 'number' && size >= 10 && size <= 24) {
        setFontSize(size);
      }
    };

    window.addEventListener("senhas:setViewMode", handleSetViewMode);
    window.addEventListener("senhas:setFontSize", handleSetFontSize);
    return () => {
      window.removeEventListener("senhas:setViewMode", handleSetViewMode);
      window.removeEventListener("senhas:setFontSize", handleSetFontSize);
    };
  }, []);

  useEffect(() => {
    const checkOrientation = () => {
      const isMobileDevice = window.innerWidth < 768;
      const isPortraitMode = window.innerHeight > window.innerWidth;
      const isLandscape = isMobileDevice && !isPortraitMode;

      setIsPortrait(isMobileDevice && isPortraitMode);

      if (isMobileDevice && isLandscape && isMobile) {
        setOpenMobile(false);
      }
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, [isMobile, setOpenMobile]);

  return (
    <div className={cn(
      "flex flex-col h-full relative",
      viewMode === "table" ? "h-[calc(100vh-3.5rem)] overflow-hidden w-full" : "min-h-[calc(100vh-3.5rem)]"
    )}>
      {/* Aviso de orientação para mobile em modo retrato */}
      {isPortrait && !ignoreOrientationWarning && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border-2 border-primary rounded-lg p-6 max-w-md text-center shadow-2xl">
            <div className="mb-4">
              <LockKeyhole className="w-12 h-12 mx-auto text-primary mb-2" />
              <h2 className="text-xl font-bold text-foreground mb-2">
                Gire seu dispositivo
              </h2>
              <p className="text-sm text-muted-foreground">
                Para consultar melhor todas as colunas de senhas, gire seu dispositivo para o modo horizontal (landscape).
              </p>
            </div>
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                className="px-4"
                onClick={() => setIgnoreOrientationWarning(true)}
              >
                Acessar mesmo assim
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Botão de Cards com Problema - apenas quando necessário */}
      {viewMode === "cards" && passwordProblems.length > 0 && (
        <div className={cn(
          "flex-shrink-0 border-b bg-background/95 backdrop-blur-sm",
          "px-2 md:px-4 py-2"
        )}>
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <Button 
              onClick={() => setShowProblemsModal(true)} 
              className="gap-1 sm:gap-2 bg-orange-500 hover:bg-orange-600 text-white border-orange-600 text-xs sm:text-sm justify-center" 
              size="sm"
              variant="outline"
            >
              <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Cards com problema</span>
              <span className="sm:hidden">Problemas</span>
              <span className="ml-1">({passwordProblems.length})</span>
            </Button>
          </div>
        </div>
      )}

      {/* Conteúdo - Scroll apenas em modo cards, fixo em modo planilha */}
      <div className={cn(
        viewMode === "table" ? "flex-1 overflow-hidden flex flex-col min-h-0 relative w-full" : "flex-1 overflow-y-auto overflow-x-hidden"
      )}>
        <div className={cn(
          viewMode === "table" ? "flex-1 flex flex-col min-h-0 h-full w-full" : "space-y-6"
        )}>

          {/* ++ NOVAS ABAS DE FILTRO ++ - Ocultas no modo planilha e em mobile */}
          {/* ++ FIM DAS NOVAS ABAS ++ */}

          {/* ++ Submenu de Problemas ++ - Oculto no modo planilha */}
          {passwordProblems.length > 0 && viewMode === "cards" && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <button
              onClick={() => setShowProblemsMenu(!showProblemsMenu)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <CardTitle className="text-lg font-semibold text-amber-900 dark:text-amber-200">
                  {passwordProblems.length} {passwordProblems.length === 1 ? 'card com problema encontrado' : 'cards com problemas encontrados'}
                </CardTitle>
              </div>
              {showProblemsMenu ? (
                <ChevronUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              )}
            </button>
          </CardHeader>
          {showProblemsMenu && (
            <CardContent className="pt-0">
              <div className="space-y-3">
                {passwordProblems.map((problem) => (
                  <div
                    key={problem.id}
                    className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                          {problem.service}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          Campos faltando: <span className="font-semibold text-amber-600 dark:text-amber-400">{problem.missingFields.join(', ')}</span>
                        </p>
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          ID: <span className="font-bold">{problem.id}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
          </Card>
          )}


      {/* Password Cards ou Planilha */}
      {loading ? (
        <Card className={cn(
          "border-dashed",
          viewMode === "table" ? "m-0 rounded-none border-x-0" : ""
        )}>
          <CardContent className={cn(
            "p-12 text-center",
            viewMode === "table" ? "p-6" : ""
          )}>
            <Loader2 className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Carregando senhas...
            </h3>
            <p className="text-muted-foreground">
              Aguarde enquanto buscamos suas credenciais no Supabase.
            </p>
          </CardContent>
        </Card>
      ) : filteredPasswords.length > 0 ? (
        viewMode === "cards" ? (
          // Visualização em Cards
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 p-4">
            {filteredPasswords.map((password) => (
              <PasswordCard
                key={password.id}
                password={password}
                isVisible={visiblePasswords.has(password.id)}
                onToggleVisibility={() => togglePasswordVisibility(password.id)}
                onEdit={() => handleEdit(password)}
              />
            ))}
          </div>
        ) : (
          // Visualização em Planilha - Ocupa toda a altura disponível
          <div className="flex flex-col flex-1 min-h-0 h-full w-full bg-white dark:bg-slate-900">
            {/* Filtros integrados na planilha */}
            <div className="flex-shrink-0 border-b border-border bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4 pt-2 bg-background/95 backdrop-blur-sm relative z-0">
              {/* Abas e Filtros */}
              <div className="flex flex-col gap-2 w-full">
                {/* Nav colorido (abas) - aparece apenas em desktop e nunca em modo mobile */}
                {!isMobile && (
                  <div className="hidden md:block border-b border-border bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-2 pt-2 w-full">
                    <div className="flex flex-col items-center gap-3">
                      {/* Nav com abas e tipos */}
                      <nav className="-mb-px flex flex-wrap gap-x-2 gap-y-2 justify-center w-full" aria-label="Tabs">
                        {tabCategories.map((tab) => {
                          const Icon = tabIcons[tab];
                          const isActive = activeTab === tab;
                          // Usa as mesmas cores fixas dos cards
                          const colorClasses = tabColorClasses[tab] || tabColorClasses["Todos"];
                          return (
                            <button
                              key={tab}
                              onClick={() => {
                                setActiveTab(tab);
                                setSubCategoryFilter("todas"); 
                                setServiceFilter("todos");
                              }}
                              className={cn(
                                "whitespace-nowrap py-2 px-3 border-b-2 font-semibold text-sm flex items-center gap-2 transition-all duration-200 rounded-t-lg",
                                isActive
                                  ? cn("border-b-2 shadow-sm", colorClasses)
                                  : cn("border-transparent", colorClasses, "hover:opacity-80")
                              )}
                            >
                              {Icon && <Icon className={cn("w-4 h-4 transition-transform", isActive && "scale-110")} />}
                              <span>{tab}</span>
                            </button>
                          );
                        })}
                        {/* Botões de Tipo dentro do nav */}
                        {allTypes.map((tipo) => {
                          const Icon = typeIcons[tipo];
                          const isActive = subCategoryFilter === tipo;
                          const displayName = tipo.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                          const colorClasses = getColorClasses(tipo, 'tipo');
                          return (
                            <button
                              key={tipo}
                              onClick={() => setSubCategoryFilter(tipo)}
                              className={cn(
                                "whitespace-nowrap py-2 px-3 border-b-2 font-semibold text-sm flex items-center gap-2 transition-all duration-200 rounded-t-lg",
                                isActive
                                  ? cn("border-b-2 shadow-sm", colorClasses)
                                  : cn("border-transparent", colorClasses, "hover:opacity-80")
                              )}
                            >
                              {Icon && <Icon className={cn("w-4 h-4 transition-transform", isActive && "scale-110")} />}
                              <span>{displayName}</span>
                            </button>
                          );
                        })}
                      </nav>
                    </div>
                  </div>
                )}

                {/* Filtros foram movidos para o header global da página (acima da planilha) */}
              </div>
            </div>

            <div 
              className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar h-full w-full relative" 
              style={{ 
                scrollbarWidth: 'auto',
                scrollbarColor: 'rgb(148 163 184) rgb(241 245 249)',
                WebkitOverflowScrolling: 'touch',
                position: 'relative',
                boxSizing: 'border-box',
                isolation: 'isolate'
              }}
            >
              <style>{`
                .custom-scrollbar {
                  scrollbar-width: auto !important;
                  scrollbar-color: rgb(148 163 184) rgb(241 245 249) !important;
                  overflow-x: scroll !important;
                  overflow-y: scroll !important;
                }
                .custom-scrollbar::-webkit-scrollbar {
                  width: 16px !important;
                  height: 16px !important;
                  display: block !important;
                  -webkit-appearance: none !important;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: rgb(241 245 249) !important;
                  border-radius: 8px !important;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background-color: rgb(148 163 184) !important;
                  border-radius: 8px !important;
                  border: 3px solid rgb(241 245 249) !important;
                  min-height: 30px !important;
                  min-width: 30px !important;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background-color: rgb(100 116 139) !important;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:active {
                  background-color: rgb(71 85 105) !important;
                }
                .dark .custom-scrollbar {
                  scrollbar-color: rgb(71 85 105) rgb(30 41 59) !important;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-track {
                  background: rgb(30 41 59) !important;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                  background-color: rgb(71 85 105) !important;
                  border-color: rgb(30 41 59) !important;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background-color: rgb(100 116 139) !important;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb:active {
                  background-color: rgb(148 163 184) !important;
                }
                .custom-scrollbar::-webkit-scrollbar-corner {
                  background: rgb(241 245 249) !important;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-corner {
                  background: rgb(30 41 59) !important;
                }
              `}</style>
              <div style={{ width: `${2200 * (fontSize / 14)}px`, minWidth: `${2200 * (fontSize / 14)}px`, display: 'block', flexShrink: 0, position: 'relative' }}>
                <table className="w-full caption-bottom text-sm" style={{ width: `${2200 * (fontSize / 14)}px`, minWidth: `${2200 * (fontSize / 14)}px`, tableLayout: 'auto' }}>
                <TableHeader className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 shadow-md" style={{ position: 'sticky', top: 0, fontSize: `${fontSize}px` }}>
                  <TableRow className="bg-slate-100 dark:bg-slate-800 border-b-2">
                    <TableHead className="font-semibold text-center whitespace-nowrap min-w-[80px] bg-slate-100 dark:bg-slate-800" style={{ fontSize: `${fontSize}px` }}>Ações</TableHead>
                    <TableHead 
                      className="font-semibold whitespace-nowrap min-w-[100px] text-center pl-4 pr-2 py-1 bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => handleSort('tipo')}
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Tipo
                        {sortColumn === 'tipo' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-50" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold whitespace-nowrap min-w-[100px] text-center pl-2 pr-4 py-1 bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => handleSort('marina')}
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Marina
                        {sortColumn === 'marina' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-50" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold whitespace-nowrap min-w-[120px] py-1 bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => handleSort('service')}
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      <div className="flex items-center gap-1">
                        Serviço
                        {sortColumn === 'service' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-50" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold whitespace-nowrap min-w-[200px] py-1 bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => handleSort('description')}
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      <div className="flex items-center gap-1">
                        Descrição
                        {sortColumn === 'description' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-50" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold whitespace-nowrap min-w-[150px] py-1 bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => handleSort('username')}
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      <div className="flex items-center gap-1">
                        Usuário
                        {sortColumn === 'username' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-50" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold whitespace-nowrap min-w-[120px] py-1 bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => handleSort('password')}
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      <div className="flex items-center gap-1">
                        Senha
                        {sortColumn === 'password' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-50" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold whitespace-nowrap min-w-[150px] py-1 bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => handleSort('url')}
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      <div className="flex items-center gap-1">
                        Link de Acesso
                        {sortColumn === 'url' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-50" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold whitespace-nowrap min-w-[100px] py-1 bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => handleSort('local')}
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      <div className="flex items-center gap-1">
                        Local
                        {sortColumn === 'local' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-50" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold whitespace-nowrap min-w-[150px] py-1 bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => handleSort('contas_compartilhadas')}
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      <div className="flex items-center gap-1">
                        Contas Compartilhadas
                        {sortColumn === 'contas_compartilhadas' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-50" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold whitespace-nowrap min-w-[100px] py-1 bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => handleSort('winbox')}
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      <div className="flex items-center gap-1">
                        Winbox
                        {sortColumn === 'winbox' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-50" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold whitespace-nowrap min-w-[150px] py-1 bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => handleSort('www')}
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      <div className="flex items-center gap-1">
                        WWW
                        {sortColumn === 'www' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-50" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold whitespace-nowrap min-w-[100px] py-1 bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => handleSort('ssh')}
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      <div className="flex items-center gap-1">
                        SSH
                        {sortColumn === 'ssh' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-50" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold whitespace-nowrap min-w-[130px] py-1 bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => handleSort('cloud_intelbras')}
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      <div className="flex items-center gap-1">
                        Cloud Intelbras
                        {sortColumn === 'cloud_intelbras' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-50" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold whitespace-nowrap min-w-[150px] py-1 bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => handleSort('link_rtsp')}
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      <div className="flex items-center gap-1">
                        Link RTSP
                        {sortColumn === 'link_rtsp' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-50" />
                        )}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody style={{ fontSize: `${fontSize}px` }}>
                  {filteredPasswords.map((password, index) => {
                    const isVisible = visiblePasswords.has(password.id);
                    
                    return (
                      <TableRow 
                        key={password.id}
                        className={cn(
                          "border-b border-slate-200 dark:border-slate-700",
                          index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-800/50",
                          "hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        )}
                        style={{ fontSize: `${fontSize}px` }}
                      >
                        {/* Ações */}
                        <TableCell className="py-3 px-4 text-center" style={{ fontSize: `${fontSize}px` }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(password)}
                            className="gap-1 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TableCell>
                        {/* 1. Tipo */}
                        <TableCell className="py-3 pl-4 pr-2 text-center" style={{ fontSize: `${fontSize}px` }}>
                          {password.tipo ? (
                            <Badge variant="outline" className={cn("text-sm font-medium border", getColorClasses(password.tipo, 'tipo'))} style={{ fontSize: `${fontSize}px` }}>
                              {password.tipo}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-sm" style={{ fontSize: `${fontSize}px` }}>-</span>
                          )}
                        </TableCell>
                        {/* 2. Marina */}
                        <TableCell className="py-3 pl-2 pr-4 text-center" style={{ fontSize: `${fontSize}px` }}>
                          {password.marina ? (
                            <Badge variant="outline" className={cn("text-sm font-medium border", getColorClasses(password.marina, 'marina'))} style={{ fontSize: `${fontSize}px` }}>
                              {password.marina}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-sm" style={{ fontSize: `${fontSize}px` }}>-</span>
                          )}
                        </TableCell>
                        {/* 3. Serviço */}
                        <TableCell className="py-3 px-4" style={{ fontSize: `${fontSize}px` }}>
                          <span className="text-sm font-medium" style={{ fontSize: `${fontSize}px` }}>{password.service || '-'}</span>
                        </TableCell>
                        {/* 4. Descrição */}
                        <TableCell className="py-3 px-4 max-w-[200px] break-words whitespace-normal" style={{ fontSize: `${fontSize}px`, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                          <span className="text-sm" style={{ fontSize: `${fontSize}px` }}>{password.description || '-'}</span>
                        </TableCell>
                        {/* 5. Usuário */}
                        <TableCell className="py-3 px-4" style={{ fontSize: `${fontSize}px` }}>
                          {password.username ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-sm text-slate-900 dark:text-slate-100" style={{ fontSize: `${fontSize}px` }}>{password.username}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-slate-200 dark:hover:bg-slate-700"
                                onClick={() => {
                                  navigator.clipboard.writeText(password.username);
                                  toast.success('Usuário copiado!');
                                }}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm" style={{ fontSize: `${fontSize}px` }}>-</span>
                          )}
                        </TableCell>
                        {/* 6. Senha */}
                        <TableCell className="py-3 px-4" style={{ fontSize: `${fontSize}px` }}>
                          {password.password ? (
                            <SecurePasswordField
                              value={password.password}
                              auditLog={true}
                              passwordId={password.id}
                              passwordService={password.service}
                              showLabel={false}
                              className="justify-start"
                            />
                          ) : (
                            <span className="text-slate-400 text-sm" style={{ fontSize: `${fontSize}px` }}>-</span>
                          )}
                        </TableCell>
                        {/* 7. Link de Acesso */}
                        <TableCell className="py-3 px-4 max-w-[180px]" style={{ fontSize: `${fontSize}px` }}>
                          {password.url ? (
                            <div className="flex items-center gap-1.5">
                              <a
                                href={password.url.startsWith('http') ? password.url : `http://${password.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline truncate dark:text-blue-400 font-mono"
                                style={{ fontSize: `${fontSize}px` }}
                              >
                                {password.url}
                              </a>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-slate-200 dark:hover:bg-slate-700"
                                onClick={() => {
                                  navigator.clipboard.writeText(password.url || '');
                                  toast.success('URL copiada!');
                                }}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm" style={{ fontSize: `${fontSize}px` }}>-</span>
                          )}
                        </TableCell>
                        {/* 8. Local */}
                        <TableCell className="py-3 px-4" style={{ fontSize: `${fontSize}px` }}>
                          {password.local ? (
                            <span className="text-sm text-slate-700 dark:text-slate-300" style={{ fontSize: `${fontSize}px` }}>{password.local}</span>
                          ) : (
                            <span className="text-slate-400 text-sm" style={{ fontSize: `${fontSize}px` }}>-</span>
                          )}
                        </TableCell>
                        {/* 9. Contas Compartilhadas */}
                        <TableCell className="py-3 px-4 max-w-[200px]" style={{ fontSize: `${fontSize}px` }}>
                          {password.contas_compartilhadas_info ? (
                            <span className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2" title={password.contas_compartilhadas_info} style={{ fontSize: `${fontSize}px` }}>
                              {password.contas_compartilhadas_info}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-sm" style={{ fontSize: `${fontSize}px` }}>-</span>
                          )}
                        </TableCell>
                        {/* 10. Winbox */}
                        <TableCell className="py-3 px-4" style={{ fontSize: `${fontSize}px` }}>
                          {password.winbox ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-sm text-slate-900 dark:text-slate-100" style={{ fontSize: `${fontSize}px` }}>{password.winbox}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-slate-200 dark:hover:bg-slate-700"
                                onClick={() => {
                                  navigator.clipboard.writeText(password.winbox || '');
                                  toast.success('Winbox copiado!');
                                }}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm" style={{ fontSize: `${fontSize}px` }}>-</span>
                          )}
                        </TableCell>
                        {/* 11. WWW */}
                        <TableCell className="py-3 px-4 max-w-[180px]" style={{ fontSize: `${fontSize}px` }}>
                          {password.www ? (
                            <div className="flex items-center gap-1.5">
                              <a
                                href={password.www.startsWith('http') ? password.www : `http://${password.www}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline truncate dark:text-blue-400 font-mono"
                                style={{ fontSize: `${fontSize}px` }}
                              >
                                {password.www}
                              </a>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-slate-200 dark:hover:bg-slate-700"
                                onClick={() => {
                                  navigator.clipboard.writeText(password.www || '');
                                  toast.success('WWW copiado!');
                                }}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm" style={{ fontSize: `${fontSize}px` }}>-</span>
                          )}
                        </TableCell>
                        {/* 12. SSH */}
                        <TableCell className="py-3 px-4" style={{ fontSize: `${fontSize}px` }}>
                          {password.ssh ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-sm text-slate-900 dark:text-slate-100" style={{ fontSize: `${fontSize}px` }}>{password.ssh}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-slate-200 dark:hover:bg-slate-700"
                                onClick={() => {
                                  navigator.clipboard.writeText(password.ssh || '');
                                  toast.success('SSH copiado!');
                                }}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm" style={{ fontSize: `${fontSize}px` }}>-</span>
                          )}
                        </TableCell>
                        {/* 13. Cloud Intelbras */}
                        <TableCell className="py-3 px-4" style={{ fontSize: `${fontSize}px` }}>
                          {password.cloud_intelbras ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-sm text-slate-900 dark:text-slate-100" style={{ fontSize: `${fontSize}px` }}>{password.cloud_intelbras}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-slate-200 dark:hover:bg-slate-700"
                                onClick={() => {
                                  navigator.clipboard.writeText(password.cloud_intelbras || '');
                                  toast.success('Cloud Intelbras copiado!');
                                }}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm" style={{ fontSize: `${fontSize}px` }}>-</span>
                          )}
                        </TableCell>
                        {/* 14. Link RTSP */}
                        <TableCell className="py-3 px-4 max-w-[180px]" style={{ fontSize: `${fontSize}px` }}>
                          {password.link_rtsp ? (
                            <div className="flex items-center gap-1.5">
                              <a
                                href={password.link_rtsp.startsWith('rtsp://') ? password.link_rtsp : password.link_rtsp.startsWith('http') ? password.link_rtsp : `rtsp://${password.link_rtsp}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline truncate dark:text-blue-400 font-mono"
                                style={{ fontSize: `${fontSize}px` }}
                              >
                                {password.link_rtsp}
                              </a>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-slate-200 dark:hover:bg-slate-700"
                                onClick={() => {
                                  navigator.clipboard.writeText(password.link_rtsp || '');
                                  toast.success('Link RTSP copiado!');
                                }}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm" style={{ fontSize: `${fontSize}px` }}>-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </table>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className={cn(
          "text-center",
          viewMode === "table" ? "py-12 flex items-center justify-center h-full" : "py-12"
        )}>
          <p className="text-muted-foreground">Nenhuma senha corresponde aos filtros aplicados.</p>
        </div>
      )}

        </div>
      </div>

      {/* --- NOVO MODAL: SELETOR DE TIPO --- */}
      <Dialog open={showTypeSelectorModal} onOpenChange={setShowTypeSelectorModal}>
        <DialogContent className="w-[95vw] sm:w-full max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Adicionar Nova Senha
            </DialogTitle>
            <DialogDescription>
              Selecione o tipo de registro que deseja adicionar.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Tipos Principais */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {entryTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.id}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center gap-2 text-base"
                    onClick={() => handleTypeSelect(type.id)}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{type.label}</span>
                  </Button>
                );
              })}
            </div>

            {/* Tipo "Conta" com Sub-menu */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between text-base h-14 px-4">
                  <span className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Conta (Google / Microsoft)
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="py-2 px-4 space-y-2 bg-muted/50 rounded-b-md">
                {accountTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Button
                      key={type.id}
                      variant="ghost"
                      className="w-full justify-start gap-2 text-base"
                      onClick={() => handleTypeSelect(type.id)}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{type.label}</span>
                    </Button>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </DialogContent>
      </Dialog>
      {/* --- FIM DO NOVO MODAL --- */}

      {/* Modal de Formulário */}
      <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 capitalize">
              <Plus className="w-5 h-5" />
              Adicionar: {selectedType || 'Nova Senha'}
            </DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para adicionar uma nova senha à tabela.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* --- BOTÃO 'TODAS OPÇÕES' --- */}
            <div className="flex items-center justify-end space-x-2 pb-4 border-b">
              <Label htmlFor="all-options" className="text-sm font-medium">
                Mostrar todas as opções
              </Label>
              <Switch id="all-options" checked={showAllOptions} onCheckedChange={setShowAllOptions} />
            </div>

            {/* Serviço - Obrigatório */}
            {showService && (
              <div className="space-y-2">
                <Label htmlFor="service">
                  Serviço <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="service"
                  type="text"
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  placeholder="Ex: Gmail, Outlook, Router..."
                />
              </div>
            )}

            {/* Marina - aparece primeiro para CFTV */}
            {showMarina && (
              <div className="space-y-2">
                <Label htmlFor="marina">Marina</Label>
                <select
                  id="marina"
                  value={formData.marina}
                  onChange={(e) => setFormData({ ...formData, marina: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Selecione uma marina...</option>
                  {marinasList.map((marina) => (
                    <option key={marina} value={marina}>
                      {marina}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Descrição - Obrigatório */}
            {showDescription && (
              <div className="space-y-2">
                <Label htmlFor="description">
                  {typeLabel} <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={typePlaceholder}
                  rows={3}
                />
              </div>
            )}

            {/* Utilizador */}
            {showUser && (
              <div className="space-y-2">
                <Label htmlFor="username">Utilizador</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Email, usuário ou login..."
                />
              </div>
            )}

            {/* Senha */}
            {showPass && (
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Senha de acesso..."
                />
              </div>
            )}

            {/* Cloud Intelbras - aparece antes de URL para CFTV */}
            {showCloudIntelbras && (
              <div className="space-y-2">
                <Label htmlFor="cloud_intelbras">Cloud Intelbras</Label>
                <Input
                  id="cloud_intelbras"
                  value={formData.cloud_intelbras}
                  onChange={(e) => setFormData({ ...formData, cloud_intelbras: e.target.value })}
                  placeholder="ID ou e-mail do cloud..."
                />
              </div>
            )}

            {/* URL */}
            {showUrl && (
              <div className="space-y-2">
                <Label htmlFor="url">URL de Acesso</Label>
                <Input
                  id="url"
                  type="text"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://exemplo.com ou exemplo.com"
                />
              </div>
            )}

            {/* Provedor */}
            {showProvider && (
              <div className="space-y-2">
                <Label htmlFor="provider">Provedor (Opcional)</Label>
                <select
                  id="provider"
                  value={formData.provider || ''}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value || null as any })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                >
                  <option value="">Nenhum</option>
                  <option value="google">Google</option>
                  <option value="microsoft">Microsoft</option>
                  <option value="provedores">Provedores</option>
                  <option value="routerboard">Routerboard</option>
                  <option value="nvr">NVR</option>
                </select>
              </div>
            )}

            {/* Campos adicionais - só aparecem quando "Mostrar todas as opções" está ativo */}
            {showLocal && (
              <div className="space-y-2">
                <Label htmlFor="local">Local</Label>
                <Input
                  id="local"
                  value={formData.local}
                  onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                  placeholder="Local..."
                />
              </div>
            )}

            {showContasCompartilhadas && (
              <div className="space-y-2">
                <Label htmlFor="contas_compartilhadas_info">Contas Compartilhadas Info</Label>
                <Textarea
                  id="contas_compartilhadas_info"
                  value={formData.contas_compartilhadas_info}
                  onChange={(e) => setFormData({ ...formData, contas_compartilhadas_info: e.target.value })}
                  placeholder="Informações sobre contas compartilhadas..."
                  rows={3}
                />
              </div>
            )}

            {showWinbox && (
              <div className="space-y-2">
                <Label htmlFor="winbox">Winbox</Label>
                <Input
                  id="winbox"
                  value={formData.winbox}
                  onChange={(e) => setFormData({ ...formData, winbox: e.target.value })}
                  placeholder="Winbox..."
                />
              </div>
            )}

            {showWww && (
              <div className="space-y-2">
                <Label htmlFor="www">WWW</Label>
                <Input
                  id="www"
                  type="text"
                  value={formData.www}
                  onChange={(e) => setFormData({ ...formData, www: e.target.value })}
                  placeholder="https://exemplo.com"
                />
              </div>
            )}

            {showSsh && (
              <div className="space-y-2">
                <Label htmlFor="ssh">SSH</Label>
                <Input
                  id="ssh"
                  value={formData.ssh}
                  onChange={(e) => setFormData({ ...formData, ssh: e.target.value })}
                  placeholder="SSH..."
                />
              </div>
            )}

            {showLinkRtsp && (
              <div className="space-y-2">
                <Label htmlFor="link_rtsp">Link RTSP</Label>
                <Input
                  id="link_rtsp"
                  type="text"
                  value={formData.link_rtsp}
                  onChange={(e) => setFormData({ ...formData, link_rtsp: e.target.value })}
                  placeholder="rtsp://exemplo.com"
                />
              </div>
            )}

            {showTipo && (
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Input
                  id="tipo"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  placeholder="Tipo..."
                />
              </div>
            )}

            {/* Status - Sempre visível quando showAllOptions está ativo */}
            {showAllOptions && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Selecione...</option>
                  <option value="sim">Sim</option>
                  <option value="não">Não</option>
                </select>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowFormModal(false);
                  resetForm();
                }}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5" />
              Editar Senha
            </DialogTitle>
            <DialogDescription>
              Edite os campos abaixo para atualizar a senha.
            </DialogDescription>
          </DialogHeader>
          
          {/* Botões fixos no topo */}
          <div className="sticky top-0 z-0 bg-background border-b px-6 py-4 flex items-center justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setEditingPassword(null);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="edit-status-top" className="text-sm font-medium whitespace-nowrap">
                  Status:
                </Label>
                <select
                  id="edit-status-top"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Selecione...</option>
                  <option value="sim">Sim</option>
                  <option value="não">Não</option>
                </select>
              </div>
              <Button type="submit" form="edit-form" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  <>
                    <Pencil className="w-4 h-4 mr-2" />
                    Atualizar
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Formulário com scroll */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <form id="edit-form" onSubmit={handleUpdate} className="space-y-4">
            {/* Marina */}
            <div className="space-y-2">
              <Label htmlFor="edit-marina">Marina</Label>
              <select
                id="edit-marina"
                value={formData.marina}
                onChange={(e) => setFormData({ ...formData, marina: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Selecione uma marina...</option>
                {marinasList.map((marina) => (
                  <option key={marina} value={marina}>
                    {marina}
                  </option>
                ))}
              </select>
            </div>

            {/* Local */}
            <div className="space-y-2">
              <Label htmlFor="edit-local">Local</Label>
              <Input
                id="edit-local"
                type="text"
                value={formData.local}
                onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                placeholder="Local..."
              />
            </div>

            {/* Serviço */}
            <div className="space-y-2">
              <Label htmlFor="edit-service">
                Serviço <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-service"
                type="text"
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                placeholder="Ex: Gmail, Outlook, Router..."
              />
            </div>

            {/* Descrição - Obrigatório */}
            <div className="space-y-2">
              <Label htmlFor="edit-description">
                Descrição <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição ou observações..."
                rows={3}
              />
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="edit-tipo">Tipo</Label>
              <Input
                id="edit-tipo"
                type="text"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                placeholder="Tipo..."
              />
            </div>

            {/* Utilizador */}
            <div className="space-y-2">
              <Label htmlFor="edit-username">Utilizador</Label>
              <Input
                id="edit-username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Email, usuário ou login..."
              />
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <Label htmlFor="edit-password">Senha</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Senha de acesso..."
              />
            </div>

            {/* Acesso (URL) */}
            <div className="space-y-2">
              <Label htmlFor="edit-url">Acesso</Label>
              <Input
                id="edit-url"
                type="text"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://exemplo.com ou exemplo.com"
              />
            </div>

            {/* Contas Compartilhadas Info */}
            <div className="space-y-2">
              <Label htmlFor="edit-contas_compartilhadas_info">Contas Compartilhadas Info</Label>
              <Textarea
                id="edit-contas_compartilhadas_info"
                value={formData.contas_compartilhadas_info}
                onChange={(e) => setFormData({ ...formData, contas_compartilhadas_info: e.target.value })}
                placeholder="Informações sobre contas compartilhadas..."
                rows={3}
              />
            </div>

            {/* Cloud Intelbras */}
            <div className="space-y-2">
              <Label htmlFor="edit-cloud_intelbras">Cloud Intelbras</Label>
              <Input
                id="edit-cloud_intelbras"
                type="text"
                value={formData.cloud_intelbras}
                onChange={(e) => setFormData({ ...formData, cloud_intelbras: e.target.value })}
                placeholder="ID ou e-mail do cloud..."
              />
            </div>

            {/* Winbox */}
            <div className="space-y-2">
              <Label htmlFor="edit-winbox">Winbox</Label>
              <Input
                id="edit-winbox"
                type="text"
                value={formData.winbox}
                onChange={(e) => setFormData({ ...formData, winbox: e.target.value })}
                placeholder="Winbox..."
              />
            </div>

            {/* WWW */}
            <div className="space-y-2">
              <Label htmlFor="edit-www">WWW</Label>
              <Input
                id="edit-www"
                type="text"
                value={formData.www}
                onChange={(e) => setFormData({ ...formData, www: e.target.value })}
                placeholder="https://exemplo.com"
              />
            </div>

            {/* SSH */}
            <div className="space-y-2">
              <Label htmlFor="edit-ssh">SSH</Label>
              <Input
                id="edit-ssh"
                type="text"
                value={formData.ssh}
                onChange={(e) => setFormData({ ...formData, ssh: e.target.value })}
                placeholder="SSH..."
              />
            </div>

            {/* Link RTSP */}
            <div className="space-y-2">
              <Label htmlFor="edit-link_rtsp">Link RTSP</Label>
              <Input
                id="edit-link_rtsp"
                type="text"
                value={formData.link_rtsp}
                onChange={(e) => setFormData({ ...formData, link_rtsp: e.target.value })}
                placeholder="rtsp://exemplo.com"
              />
            </div>
          </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Cards com Problema */}
      <Dialog open={showProblemsModal} onOpenChange={setShowProblemsModal}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Cards com Problema ({passwordProblems.length})
            </DialogTitle>
            <DialogDescription>
              Lista de cards que possuem campos obrigatórios faltando. Você pode editar diretamente aqui.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
              {passwordProblems.map((problem) => {
                const password = passwords.find(p => p.id === problem.id);
                if (!password) return null;
                
                const isVisible = visiblePasswords.has(password.id);
                const hasProblem = problem.missingFields.length > 0;
                
                return (
                  <div 
                    key={password.id} 
                    className="relative"
                  >
                    {hasProblem && (
                      <div className="absolute top-2 right-2 z-10">
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {problem.missingFields.length} campo(s) faltando
                        </Badge>
                      </div>
                    )}
                    <PasswordCard
                      password={password}
                      isVisible={isVisible}
                      onToggleVisibility={() => togglePasswordVisibility(password.id)}
                      onEdit={() => {
                        handleEdit(password);
                        setShowProblemsModal(false);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="mt-4 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setShowProblemsModal(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}