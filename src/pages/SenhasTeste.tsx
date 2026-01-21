import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X, Eye, EyeOff, Copy, Plus, Loader2, Check, Grid3x3, Chrome, Building2, Server, Network, Info, AlertTriangle, ChevronDown, ChevronUp, CreditCard, Wifi, Shield, Globe, Video, Router, Camera, HardDrive, LockKeyhole, Pencil, Table2, LayoutGrid, ArrowUpDown, ArrowUp, ArrowDown, Type, FileText, Download, RotateCw, Trash2, Settings } from "lucide-react";
import { toast } from "sonner";
import { fetchPasswords, createPassword, updatePassword, deletePassword, type PasswordEntry } from "@/lib/passwordsService";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSidebar } from "@/components/ui/sidebar";
import { logAction, AuditAction } from "@/lib/auditService";
import { PasswordField as SecurePasswordField } from "@/components/PasswordField";

// === CONSTANTES ===
const VALID_TYPES = {
  'google': 'Google',
  'microsoft': 'Microsoft',
  'cftv': 'CFTV',
  'rede': 'Rede',
  'servidor': 'Servidor',
  'provedor': 'Provedor',
  'intelbras': 'Intelbras',
  'acesso web': 'Acesso Web',
  'maquina cartao': 'Máquina de Cartão',
  'outros': 'Outros'
} as const;

const TYPE_COLORS = {
  'google': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  'microsoft': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  'cftv': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  'rede': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
  'servidor': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  'provedor': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  'intelbras': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200 dark:border-violet-800',
  'acesso web': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
  'maquina cartao': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200 dark:border-pink-800',
  'outros': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
} as const;

const entryTypes = [
  { id: 'provedor', label: 'Provedor', icon: Server },
  { id: 'cftv', label: 'CFTV', icon: Network },
  { id: 'acesso web', label: 'Acesso Web', icon: Globe },
  { id: 'maquina cartao', label: 'Máquina de Cartão', icon: CreditCard },
  { id: 'intelbras', label: 'Intelbras', icon: Wifi },
  { id: 'rede', label: 'Rede', icon: Router },
  { id: 'servidor', label: 'Servidor', icon: HardDrive },
  { id: 'outros', label: 'Outros', icon: Plus },
];

const accountTypes = [
  { id: 'google', label: 'Conta Google', icon: Chrome },
  { id: 'microsoft', label: 'Conta MICROSOFT', icon: Building2 },
];

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

// === FUNÇÕES AUXILIARES ===
function getTypeDisplayName(type: string | null | undefined): string {
  if (!type) return 'Outros';

  const typeLower = type.toLowerCase().trim();

  if (typeLower === 'conta google') return 'Conta Google';
  if (typeLower === 'conta microsoft') return 'Conta MICROSOFT';

  const normalized = normalizeType(type);
  return normalized ? VALID_TYPES[normalized] : 'Outros';
}

function getTypeColorClasses(type: string | null | undefined): string {
  const normalized = normalizeType(type);
  return normalized ? TYPE_COLORS[normalized] : TYPE_COLORS.outros;
}

// Função para obter classes de cor para marinas
const getColorClasses = (value: string, type: 'tipo' | 'marina'): string => {
  if (!value) return 'text-slate-700 dark:text-slate-300';

  const color = getColorForValue(value, type);

  if (type === 'marina') {
    // Para marinas, apenas cor do texto, sem fundo nem borda
    const marinaColorMap = {
      blue: 'text-blue-800 dark:text-blue-200',
      green: 'text-green-800 dark:text-green-200',
      purple: 'text-purple-800 dark:text-purple-200',
      orange: 'text-orange-900 dark:text-orange-100',
      red: 'text-red-800 dark:text-red-200',
      indigo: 'text-indigo-800 dark:text-indigo-200',
      pink: 'text-pink-800 dark:text-pink-200',
      teal: 'text-teal-800 dark:text-teal-200',
      cyan: 'text-cyan-800 dark:text-cyan-200',
      amber: 'text-amber-800 dark:text-amber-200',
      violet: 'text-violet-800 dark:text-violet-200',
      emerald: 'text-emerald-800 dark:text-emerald-200',
      rose: 'text-rose-800 dark:text-rose-200',
      sky: 'text-sky-800 dark:text-sky-200',
      lime: 'text-lime-800 dark:text-lime-200',
      fuchsia: 'text-fuchsia-800 dark:text-fuchsia-200',
      slate: 'text-slate-900 dark:text-slate-100',
    };
    return marinaColorMap[color] || marinaColorMap.slate;
  }

  // Para tipos, manter o estilo original com fundo e borda
  const initialColorMap = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700',
    orange: 'bg-orange-100 dark:bg-orange-900/40 text-orange-900 dark:text-orange-100 border-orange-300 dark:border-orange-600', // Destacado
    red: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-700',
    pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200 border-pink-200 dark:border-pink-700',
    teal: 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200 border-teal-200 dark:border-teal-700',
    cyan: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200 border-cyan-200 dark:border-cyan-700',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-700',
    violet: 'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200 border-violet-200 dark:border-violet-700',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700',
    rose: 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-700',
    sky: 'bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-200 border-sky-200 dark:border-sky-700',
    lime: 'bg-lime-100 dark:bg-lime-900/30 text-lime-800 dark:text-lime-200 border-lime-200 dark:border-lime-700',
    fuchsia: 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-800 dark:text-fuchsia-200 border-fuchsia-200 dark:border-fuchsia-700',
    slate: 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600', // Destacado
  };

  return initialColorMap[color] || initialColorMap.slate;
};

// Função para gerar cor consistente baseada em uma string
const getColorForValue = (value: string, type: 'tipo' | 'marina'): string => {
  if (!value) return 'slate';

  // Paletas de cores diferentes para tipo e marina
  const tipoColors = [
    'blue', 'green', 'purple', 'orange', 'red', 'indigo',
    'pink', 'teal', 'cyan', 'amber', 'violet', 'emerald'
  ];

  const marinaColors = [
    'blue',
    'emerald',
    'violet',
    'rose',
    'sky',
    'lime',
    'fuchsia',
    'indigo',
    'amber',
    'teal',
    'pink',
    'cyan'
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

function normalizeType(type: string | null | undefined): keyof typeof TYPE_COLORS | null {
  if (!type) return null;

  const typeLower = type.toLowerCase().trim();

  if (typeLower === 'google' || typeLower === 'conta google') return 'google';
  if (typeLower === 'microsoft' || typeLower === 'conta microsoft') return 'microsoft';
  if (typeLower === 'cftv') return 'cftv';
  if (typeLower === 'rede' || typeLower === 'router') return 'rede';
  if (typeLower === 'servidor' || typeLower === 'server') return 'servidor';
  if (typeLower === 'provedor' || typeLower === 'provedores') return 'provedor';
  if (typeLower === 'intelbras') return 'intelbras';
  if (typeLower === 'acesso web' || typeLower === 'acesso-web') return 'acesso web';
  if (typeLower === 'maquina cartao' || typeLower === 'máquina cartão' || typeLower === 'maquina-cartao') return 'maquina cartao';
  if (typeLower === 'outros' || typeLower === 'outro') return 'outros';

  return null;
}

function getServiceCategory(password: PasswordEntry): string {
  if (password.tipo) {
    const normalizedType = normalizeType(password.tipo);
    if (normalizedType) {
      return VALID_TYPES[normalizedType];
    }
  }

  const service = (password.service || '').toLowerCase();
  const description = (password.description || '').toLowerCase();
  const searchText = `${service} ${description}`;

  if (searchText.includes('cftv') || searchText.includes('nvr') || searchText.includes('câmera') || searchText.includes('camera')) {
    return 'CFTV';
  }

  if (searchText.includes('google') || searchText.includes('gmail') || searchText.includes('g suite') || searchText.includes('workspace')) {
    return 'Google';
  }

  if (searchText.includes('microsoft') || searchText.includes('outlook') || searchText.includes('office') || searchText.includes('365') || searchText.includes('azure') || searchText.includes('onedrive') || searchText.includes('sharepoint')) {
    return 'Microsoft';
  }

  if (searchText.includes('servidor') || searchText.includes('server')) {
    return 'Servidor';
  }

  if (searchText.includes('intelbras') || searchText.includes('cloud intelbras')) {
    return 'Intelbras';
  }

  if (searchText.includes('acesso web') || (searchText.includes('web') && !searchText.includes('acesso web'))) {
    return 'Acesso Web';
  }

  if (searchText.includes('provedor') && !searchText.includes('roteador provedor')) {
    return 'Provedor';
  }

  if (
    searchText.includes('roteador') ||
    searchText.includes('router') ||
    searchText.includes('mikrotik') ||
    searchText.includes('tp-link') ||
    searchText.includes('d-link') ||
    searchText.includes('cisco') ||
    searchText.includes('ubiquiti') ||
    searchText.includes('access point') ||
    searchText.includes('accesspoint') ||
    searchText.includes('ap ') ||
    searchText.includes('wifi') ||
    searchText.includes('wireless') ||
    searchText.includes('switch') ||
    searchText.includes('firewall') ||
    searchText.includes('load balance') ||
    searchText.includes('loadbalance') ||
    searchText.includes('winbox') ||
    searchText.includes('vlan') ||
    searchText.includes('dhcp') ||
    searchText.includes('dns')
  ) {
    return 'Rede';
  }

  if (
    searchText.includes('máquina') ||
    searchText.includes('maquina') ||
    searchText.includes('cartão') ||
    searchText.includes('cartao') ||
    searchText.includes('crédito') ||
    searchText.includes('credito') ||
    searchText.includes('débito') ||
    searchText.includes('debito') ||
    searchText.includes('pagamento') ||
    searchText.includes('pagseguro') ||
    searchText.includes('stone') ||
    searchText.includes('cielo') ||
    searchText.includes('rede') ||
    searchText.includes('getnet') ||
    searchText.includes('bin') ||
    searchText.includes('sip') ||
    searchText.includes('pos')
  ) {
    return 'Máquina de Cartão';
  }

  return 'Outros';
}

// Função para adicionar quebras inteligentes no texto
function addSmartBreaks(text: string): string {
  if (!text) return text;
  // Adiciona quebra invisível antes de @, pontos e caracteres acentuados
  return text.replace(/([.@À-ÿ])/g, '\u200B$1');
}

function detectServiceType(serviceName: string): string | null {
  if (!serviceName || serviceName.trim() === '') return null;

  const serviceLower = serviceName.toLowerCase().trim();

  if (
    serviceLower.includes('google') ||
    serviceLower.includes('gmail') ||
    serviceLower.includes('g suite') ||
    serviceLower.includes('workspace') ||
    serviceLower.includes('drive') ||
    serviceLower.includes('docs') ||
    serviceLower.includes('sheets') ||
    serviceLower.includes('slides') ||
    serviceLower.includes('calendar') ||
    serviceLower.includes('meet') ||
    serviceLower.includes('youtube') ||
    serviceLower.includes('play store') ||
    serviceLower.includes('android') ||
    serviceLower.includes('chrome')
  ) {
    return 'google';
  }

  if (
    serviceLower.includes('microsoft') ||
    serviceLower.includes('outlook') ||
    serviceLower.includes('office') ||
    serviceLower.includes('365') ||
    serviceLower.includes('azure') ||
    serviceLower.includes('onedrive') ||
    serviceLower.includes('sharepoint') ||
    serviceLower.includes('teams') ||
    serviceLower.includes('windows') ||
    serviceLower.includes('skype') ||
    serviceLower.includes('xbox') ||
    serviceLower.includes('bing') ||
    serviceLower.includes('edge')
  ) {
    return 'microsoft';
  }

  if (
    serviceLower.includes('cftv') ||
    serviceLower.includes('nvr') ||
    serviceLower.includes('câmera') ||
    serviceLower.includes('camera') ||
    serviceLower.includes('dvr') ||
    serviceLower.includes('hikvision') ||
    serviceLower.includes('dahua') ||
    serviceLower.includes('intelbras') ||
    serviceLower.includes('vivotek') ||
    serviceLower.includes('axis') ||
    serviceLower.includes('segurança') ||
    serviceLower.includes('vigilância') ||
    serviceLower.includes('monitoramento')
  ) {
    return 'cftv';
  }

  if (
    serviceLower.includes('roteador') ||
    serviceLower.includes('router') ||
    serviceLower.includes('mikrotik') ||
    serviceLower.includes('tp-link') ||
    serviceLower.includes('d-link') ||
    serviceLower.includes('cisco') ||
    serviceLower.includes('ubiquiti') ||
    serviceLower.includes('access point') ||
    serviceLower.includes('accesspoint') ||
    serviceLower.includes('ap ') ||
    serviceLower.includes('wifi') ||
    serviceLower.includes('wireless') ||
    serviceLower.includes('switch') ||
    serviceLower.includes('firewall') ||
    serviceLower.includes('load balance') ||
    serviceLower.includes('loadbalance') ||
    serviceLower.includes('winbox') ||
    serviceLower.includes('vlan') ||
    serviceLower.includes('dhcp') ||
    serviceLower.includes('dns')
  ) {
    return 'rede';
  }

  if (
    serviceLower.includes('servidor') ||
    serviceLower.includes('server') ||
    serviceLower.includes('vmware') ||
    serviceLower.includes('virtual') ||
    serviceLower.includes('hyper-v') ||
    serviceLower.includes('proxmox') ||
    serviceLower.includes('xen') ||
    serviceLower.includes('kvm') ||
    serviceLower.includes('docker') ||
    serviceLower.includes('kubernetes') ||
    serviceLower.includes('linux') ||
    serviceLower.includes('ubuntu') ||
    serviceLower.includes('centos') ||
    serviceLower.includes('debian') ||
    serviceLower.includes('windows server') ||
    serviceLower.includes('sql server') ||
    serviceLower.includes('mysql') ||
    serviceLower.includes('postgresql') ||
    serviceLower.includes('mongodb') ||
    serviceLower.includes('redis') ||
    serviceLower.includes('nginx') ||
    serviceLower.includes('apache')
  ) {
    return 'servidor';
  }

  if (
    serviceLower.includes('provedor') ||
    serviceLower.includes('isp') ||
    serviceLower.includes('telecom') ||
    serviceLower.includes('telefonica') ||
    serviceLower.includes('oi') ||
    serviceLower.includes('vivo') ||
    serviceLower.includes('tim') ||
    serviceLower.includes('claro') ||
    serviceLower.includes('net') ||
    serviceLower.includes('embratel') ||
    serviceLower.includes('algar') ||
    serviceLower.includes('internet') ||
    serviceLower.includes('banda larga') ||
    serviceLower.includes('fibra') ||
    serviceLower.includes('adsl') ||
    serviceLower.includes('cabo')
  ) {
    return 'provedor';
  }

  if (
    serviceLower.includes('acesso web') ||
    serviceLower.includes('web') ||
    serviceLower.includes('site') ||
    serviceLower.includes('website') ||
    serviceLower.includes('portal') ||
    serviceLower.includes('plataforma') ||
    serviceLower.includes('sistema') ||
    serviceLower.includes('aplicação') ||
    serviceLower.includes('app') ||
    serviceLower.includes('dashboard') ||
    serviceLower.includes('painel') ||
    serviceLower.includes('admin') ||
    serviceLower.includes('login') ||
    serviceLower.includes('autenticação')
  ) {
    return 'acesso web';
  }

  if (
    serviceLower.includes('máquina') ||
    serviceLower.includes('maquina') ||
    serviceLower.includes('cartão') ||
    serviceLower.includes('cartao') ||
    serviceLower.includes('crédito') ||
    serviceLower.includes('credito') ||
    serviceLower.includes('débito') ||
    serviceLower.includes('debito') ||
    serviceLower.includes('pagamento') ||
    serviceLower.includes('pagseguro') ||
    serviceLower.includes('stone') ||
    serviceLower.includes('cielo') ||
    serviceLower.includes('rede') ||
    serviceLower.includes('getnet') ||
    serviceLower.includes('bin') ||
    serviceLower.includes('sip') ||
    serviceLower.includes('pos')
  ) {
    return 'maquina cartao';
  }

  if (
    serviceLower.includes('intelbras') &&
    (serviceLower.includes('acesso') ||
     serviceLower.includes('controle') ||
     serviceLower.includes('catraca') ||
     serviceLower.includes('biometria') ||
     serviceLower.includes('rfid') ||
     serviceLower.includes('proximidade'))
  ) {
    return 'intelbras';
  }

  return null;
}

// === COMPONENTES MODULARES ===

// Componente para campo copiável
function CopyableField({
  label,
  value,
  onCopy
}: {
  label: string,
  value: string | null | undefined,
  onCopy: (text: string, label: string) => void
}) {
  if (!value) return null;

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-base font-medium text-slate-500 dark:text-slate-400">{label}:</span>
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-md pr-1">
        <span className="text-base font-mono font-medium text-slate-800 dark:text-slate-200 px-2 py-0.5">{value}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700"
          onClick={() => onCopy(value, label)}
        >
          <Copy className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// Componente Card simplificado
function PasswordCard({
  password,
  onEdit
}: {
  password: PasswordEntry,
  onEdit: () => void
}) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string | undefined, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card className="rounded-xl border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl transition-all duration-200">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
              {password.service || 'Sem nome'}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={cn("text-xs font-medium border", getTypeColorClasses(password.tipo))}>
                {password.tipo ? getTypeDisplayName(password.tipo) : 'Outros'}
              </Badge>
            </div>
          </div>
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
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {password.description && (
          <div className="pb-2 border-b border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{password.description}</p>
          </div>
        )}

        <div className="space-y-2.5">
          <CopyableField label="Usuário" value={password.username} onCopy={handleCopy} />

          {password.password && (
            <SecurePasswordField
              value={password.password}
              auditLog={true}
              passwordId={password.id}
              passwordService={password.service}
              onCopy={() => handleCopy(password.password || '', "Senha")}
            />
          )}

          {password.url && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-base font-medium text-slate-500 dark:text-slate-400">Acesso:</span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-md pr-1">
                <a
                  href={password.url.startsWith('http') ? password.url : `http://${password.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-mono font-medium text-indigo-600 hover:underline truncate max-w-[180px] dark:text-indigo-400 px-2 py-0.5"
                >
                  {password.url}
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700"
                  onClick={() => handleCopy(password.url, "Acesso")}
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// === COMPONENTE PRINCIPAL ===
export default function SenhasTeste() {
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados locais para comunicação com Layout
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(75);

  // Estado para controlar se a paginação global deve ser mostrada
  const [showGlobalPagination, setShowGlobalPagination] = useState(false);

  // Estados locais para modais
  const [showTypeSelectorModal, setShowTypeSelectorModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showAllOptions, setShowAllOptions] = useState(false);

  // Form data
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

  // Carregar senhas na montagem
  useEffect(() => {
    loadPasswords();
  }, []);

  // Sincronizar com o Layout.tsx via eventos
  useEffect(() => {
    const handleSetSearch = (e: Event) => {
      const custom = e as CustomEvent<string>;
      setSearchTerm(custom.detail || "");
    };

    const handleSetViewMode = (e: Event) => {
      const custom = e as CustomEvent<"cards" | "table">;
      setViewMode(custom.detail || "table");
    };

    const handleOpenTypeSelector = (e: Event) => {
      setShowTypeSelectorModal(true);
    };

    const handleGlobalPaginationChanged = (e: Event) => {
      const custom = e as CustomEvent<number>;
      setCurrentPage(custom.detail);
    };

    window.addEventListener("senhas:setSearch", handleSetSearch);
    window.addEventListener("senhas:setViewMode", handleSetViewMode);
    window.addEventListener("senhas:openTypeSelector", handleOpenTypeSelector);
    window.addEventListener("global-pagination:pageChanged", handleGlobalPaginationChanged);

    return () => {
      window.removeEventListener("senhas:setSearch", handleSetSearch);
      window.removeEventListener("senhas:setViewMode", handleSetViewMode);
      window.removeEventListener("senhas:openTypeSelector", handleOpenTypeSelector);
      window.removeEventListener("global-pagination:pageChanged", handleGlobalPaginationChanged);
    };
  }, []);

  // Função para ordenação
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Filtrar e ordenar senhas baseado no termo de busca e ordenação
  const filteredPasswords = passwords
    .filter(password => {
      // Filtro por busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const searchableFields = [
          password.service,
          password.username,
          password.password,
          password.description,
          password.url,
          password.tipo
        ];

        return searchableFields.some(field =>
          field && typeof field === 'string' && field.toLowerCase().includes(searchLower)
        );
      }

      return true;
    })
    .sort((a, b) => {
      if (!sortColumn) return 0;

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
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Notificar Layout sobre serviços disponíveis
  useEffect(() => {
    const services = ["todos", ...Array.from(new Set(passwords.map(p => p.service).filter(Boolean)))];
    const event = new CustomEvent("senhas:servicesUpdated", { detail: services });
    window.dispatchEvent(event);
  }, [passwords]);

  // Notificar Layout sobre paginação quando dados mudarem
  useEffect(() => {
    const totalPages = Math.ceil(filteredPasswords.length / itemsPerPage);
    const event = new CustomEvent("global-pagination:update", {
      detail: {
        currentPage,
        totalPages,
        totalItems: filteredPasswords.length,
        itemsPerPage,
        visible: totalPages > 1,
      }
    });
    window.dispatchEvent(event);
  }, [filteredPasswords.length, currentPage, itemsPerPage]);

  // Calcular total de páginas
  const totalPages = Math.ceil(filteredPasswords.length / itemsPerPage);

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortColumn, sortDirection]);

  // Funções auxiliares
  const loadPasswords = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPasswords();
      setPasswords(data);
    } catch (error: any) {
      setError(error?.message || 'Erro ao carregar senhas');
      toast.error('Erro ao carregar senhas');
    } finally {
      setLoading(false);
    }
  };

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

  const handleTypeSelect = (type: string) => {
    resetFormData();

    setSelectedType(type);

    if (type === 'google') {
      setFormData(prev => ({
        ...prev,
        service: 'Google',
        tipo: 'conta google',
        provider: 'google'
      }));
    } else if (type === 'microsoft') {
      setFormData(prev => ({
        ...prev,
        service: 'Microsoft',
        tipo: 'conta microsoft',
        provider: 'microsoft'
      }));
    } else if (type === 'cftv') {
      setFormData(prev => ({ ...prev, service: 'CFTV' }));
    } else if (type === 'provedor') {
      setFormData(prev => ({ ...prev, provider: 'provedores' }));
    }

    setShowTypeSelectorModal(false);
    setShowFormModal(true);
  };

  // Lógica de exibição condicional dos campos
  const typeLabel = selectedType === 'cftv' ? 'Numeração' : 'Descrição (Observação)';
  const typePlaceholder = selectedType === 'cftv' ? 'Ex: NVR 01' : 'Descrição ou observações...';

  let showService: boolean = false;
  let showDescription: boolean = false;
  let showMarina: boolean = false;
  let showUser: boolean = false;
  let showPass: boolean = false;
  let showUrl: boolean = false;
  let showCloudIntelbras: boolean = false;
  let showProvider: boolean = false;
  let showLocal: boolean = false;
  let showContasCompartilhadas: boolean = false;
  let showWinbox: boolean = false;
  let showWww: boolean = false;
  let showSsh: boolean = false;
  let showLinkRtsp: boolean = false;
  let showTipo: boolean = false;

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
    switch (selectedType) {
      case 'provedor':
        showService = true;
        showDescription = true;
        showMarina = true;
        showUser = true;
        showPass = true;
        showUrl = true;
        break;
      case 'cftv':
        showDescription = true;
        showMarina = true;
        showUser = true;
        showPass = true;
        showUrl = true;
        showCloudIntelbras = true;
        break;
      case 'outros':
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
        showUser = true;
        showPass = true;
        showUrl = true;
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
        break;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

      const serviceValue = formData.service.trim() || selectedType || 'Outros';
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

      const createdPassword = await createPassword(newPassword);
      toast.success('Senha adicionada com sucesso!');
      setShowFormModal(false);
      resetForm();
      loadPasswords();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao adicionar senha');
    } finally {
      setIsSubmitting(false);
    }
  };

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
    setShowAllOptions(true);
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingPassword) return;

    if (!formData.service.trim() || !formData.description.trim()) {
      toast.error('Serviço e descrição são obrigatórios');
      return;
    }

    try {
      setIsSubmitting(true);

      await updatePassword(editingPassword.id, {
        service: formData.service.trim(),
        username: formData.username.trim() || null,
        password: formData.password.trim() || null,
        description: formData.description.trim(),
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
      });

      setShowEditModal(false);
      setEditingPassword(null);
      resetForm();
      loadPasswords();
      toast.success('Senha atualizada com sucesso!');
    } catch (error) {
      toast.error(error?.message || 'Erro ao atualizar senha');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingPassword) return;

    try {
      setIsSubmitting(true);
      await deletePassword(editingPassword.id);
      setShowEditModal(false);
      setEditingPassword(null);
      resetForm();
      loadPasswords();
      toast.success('Senha excluída com sucesso!');
    } catch (error) {
      toast.error(error?.message || 'Erro ao excluir senha');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Abas simplificadas
  const tabs = ["Todos", "Google", "Microsoft", "Provedor", "Acesso Web", "CFTV", "Intelbras", "Rede", "Servidor", "Máquina de Cartão", "Outros"];

  // Filtros de categoria
  const [activeTab, setActiveTab] = useState("Todos");
  const [subCategoryFilter, setSubCategoryFilter] = useState("todas");
  const [serviceFilter, setServiceFilter] = useState("todos");

  // Lista fixa de tipos (sem repetir as abas principais)
  const allTypes: string[] = [
    // Nenhum tipo adicional por enquanto
  ];

  // Mapeamento de ícones para os tipos
  const typeIcons: Record<string, typeof Grid3x3> = {
    // Nenhum tipo adicional por enquanto
  };

  // ++ Mapeamento de cores unificado (usado para badges, filtros e abas) ++
  const tabColorClasses: Record<string, string> = {
    "Todos": "bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800",
    "Google": TYPE_COLORS.google,
    "Microsoft": TYPE_COLORS.microsoft,
    "Provedor": TYPE_COLORS.provedor,
    "CFTV": TYPE_COLORS.cftv,
    "Servidor": TYPE_COLORS.servidor,
    "Intelbras": TYPE_COLORS.intelbras,
    "Rede": TYPE_COLORS.rede,
    "Acesso Web": TYPE_COLORS['acesso web'],
    "Máquina de Cartão": TYPE_COLORS['maquina cartao'],
    "Outros": TYPE_COLORS.outros,
  };





  // Filtrar senhas por aba ativa
  const passwordsInTab = passwords.filter((password) => {
    if (activeTab === "Todos") return true;
    const serviceCategory = getServiceCategory(password);
    return serviceCategory === activeTab;
  });

  // Filtrar senhas por subcategoria e serviço
  const filteredPasswordsByTab = passwordsInTab.filter((password) => {
    const passwordTipo = password.tipo?.toLowerCase() || '';
    const matchesSubCategory =
      subCategoryFilter === "todas" ||
      passwordTipo === subCategoryFilter.toLowerCase();

    const matchesService = serviceFilter === "todos" || password.service === serviceFilter;

    return matchesSubCategory && matchesService;
  });

  // Aplicar filtro de busca e ordenação
  const finalFilteredPasswords = filteredPasswordsByTab
    .filter(password => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const searchableFields = [
          password.service,
          password.username,
          password.password,
          password.description,
          password.url,
          password.tipo
        ];

        return searchableFields.some(field =>
          field && typeof field === 'string' && field.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (!sortColumn) return 0;

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
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Calcular paginação
  const paginatedTotalPages = Math.ceil(finalFilteredPasswords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedPasswords = finalFilteredPasswords.slice(startIndex, endIndex);

  // Resetar página atual quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, subCategoryFilter, serviceFilter, searchTerm, sortColumn, sortDirection]);

  return (
    <div className="flex flex-col h-full">
      {/* Filtros de Categoria */}
      <div className="border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Nav com abas */}
          <nav className="-mb-px flex flex-wrap gap-x-2 gap-y-2" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab === "Google" ? Chrome :
                           tab === "Microsoft" ? Building2 :
                           tab === "CFTV" ? Video :
                           tab === "Servidor" ? HardDrive :
                           tab === "Provedor" ? Server :
                           tab === "Intelbras" ? Wifi :
                           tab === "Rede" ? Router :
                           tab === "Acesso Web" ? Globe :
                           tab === "Máquina de Cartão" ? CreditCard :
                           tab === "Outros" ? Grid3x3 :
                           Grid3x3;
              const isActive = activeTab === tab;
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
                  <Icon className={cn("w-4 h-4 transition-transform", isActive && "scale-110")} />
                  <span>{tab}</span>
                </button>
              );
            })}
            {/* Botões de Tipo */}
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

            {/* Botão Limpar Filtro */}
            <div className="ml-4 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveTab("Todos");
                  setSubCategoryFilter("todas");
                  setServiceFilter("todos");
                }}
                className="flex items-center gap-2 text-sm"
                title="Ir para Todos"
              >
                <X className="w-4 h-4" />
                Todos
              </Button>
            </div>
          </nav>
        </div>
      </div>

      {/* Content - Agora sem header, filtros estão no Layout.tsx */}
      <div className="flex-1 overflow-y-auto p-4">


        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Carregando senhas...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        ) : filteredPasswords.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhuma senha encontrada para a busca.' : 'Nenhuma senha cadastrada.'}
              </p>
            </div>
          </div>
        ) : viewMode === "cards" ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedPasswords.map((password) => (
                <PasswordCard
                  key={password.id}
                  password={password}
                  onEdit={() => handleEdit(password)}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="bg-white dark:bg-slate-900 rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="min-w-[1200px] table-fixed">
                  <TableHeader className="bg-slate-50 dark:bg-slate-800">
                    <TableRow>
                      <TableHead className="w-20 text-center font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('tipo')}>
                        <div className="flex items-center justify-center gap-1">
                          Tipo
                          {sortColumn === 'tipo' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-24 text-center font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('marina')}>
                        <div className="flex items-center justify-center gap-1">
                          Marina
                          {sortColumn === 'marina' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-20 text-left font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('local')}>
                        <div className="flex items-center gap-1">
                          Local
                          {sortColumn === 'local' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-40 text-left font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('service')}>
                        <div className="flex items-center gap-1">
                          Serviço
                          {sortColumn === 'service' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-56 text-left font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('description')}>
                        <div className="flex items-center gap-1">
                          Descrição
                          {sortColumn === 'description' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-64 text-left font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('username')}>
                        <div className="flex items-center gap-1">
                          Usuário
                          {sortColumn === 'username' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-56 text-left font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('password')}>
                        <div className="flex items-center gap-1">
                          Senha
                          {sortColumn === 'password' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-64 text-left font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('url')}>
                        <div className="flex items-center gap-1">
                          Link de Acesso
                          {sortColumn === 'url' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-36 text-left font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('cloud_intelbras')}>
                        <div className="flex items-center gap-1">
                          Cloud Intelbras
                          {sortColumn === 'cloud_intelbras' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-40 text-left font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('contas_compartilhadas')}>
                        <div className="flex items-center gap-1">
                          Contas Compartilhadas
                          {sortColumn === 'contas_compartilhadas' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-24 text-left font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('winbox')}>
                        <div className="flex items-center gap-1">
                          Winbox
                          {sortColumn === 'winbox' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-36 text-left font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('www')}>
                        <div className="flex items-center gap-1">
                          WWW
                          {sortColumn === 'www' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-24 text-left font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('ssh')}>
                        <div className="flex items-center gap-1">
                          SSH
                          {sortColumn === 'ssh' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-40 text-left font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort('link_rtsp')}>
                        <div className="flex items-center gap-1">
                          Link RTSP
                          {sortColumn === 'link_rtsp' ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-12 text-center font-semibold">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedPasswords.map((password, index) => (
                      <TableRow
                        key={password.id}
                        className={cn(
                          "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                          index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-25 dark:bg-slate-850"
                        )}
                      >
                        <TableCell className="text-center">
                          {password.tipo ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs font-medium border",
                                getTypeColorClasses(password.tipo)
                              )}
                            >
                              {getTypeDisplayName(password.tipo)}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          {password.marina ? (
                            <Badge
                              className={cn(
                                "text-xs font-medium border-0 bg-transparent",
                                getColorClasses(password.marina, 'marina')
                              )}
                            >
                              {password.marina}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <span className="text-xs text-slate-700 dark:text-slate-300">
                            {password.local || '-'}
                          </span>
                        </TableCell>

                        <TableCell className="font-medium">
                          <span className="text-sm">{password.service || '-'}</span>
                        </TableCell>

                        <TableCell className="max-w-[300px]">
                          <span className="text-sm text-slate-700 dark:text-slate-300" title={password.description}>
                            {password.description || '-'}
                          </span>
                        </TableCell>

                        <TableCell className="max-w-[300px]">
                          {password.username ? (
                            <div className="flex flex-col gap-1">
                              <span className="font-mono text-sm text-slate-900 dark:text-slate-100 break-words" title={password.username}>
                                {addSmartBreaks(password.username)}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-slate-200 dark:hover:bg-slate-700 self-start"
                                onClick={() => {
                                  navigator.clipboard.writeText(password.username || '');
                                  toast.success('Usuário copiado!');
                                }}
                                title="Copiar usuário"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </TableCell>

                        <TableCell>
                          {password.password ? (
                            <SecurePasswordField
                              value={password.password}
                              auditLog={true}
                              passwordId={password.id}
                              passwordService={password.service}
                              showLabel={false}
                              className="justify-start"
                              vertical={true}
                            />
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </TableCell>

                        <TableCell>
                          {password.url ? (
                            <div className="flex items-center gap-2">
                              <a
                                href={password.url.startsWith('http') ? password.url : `http://${password.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline truncate max-w-[250px] dark:text-blue-400 font-mono"
                                title={password.url}
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
                                title="Copiar URL"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </TableCell>

                        <TableCell>
                          {password.cloud_intelbras ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm text-slate-900 dark:text-slate-100">
                                {password.cloud_intelbras}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-slate-200 dark:hover:bg-slate-700"
                                onClick={() => {
                                  navigator.clipboard.writeText(password.cloud_intelbras || '');
                                  toast.success('Cloud Intelbras copiado!');
                                }}
                                title="Copiar Cloud Intelbras"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </TableCell>

                        <TableCell>
                          {password.contas_compartilhadas_info ? (
                            <span className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2" title={password.contas_compartilhadas_info}>
                              {password.contas_compartilhadas_info}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </TableCell>

                        <TableCell>
                          {password.winbox ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm text-slate-900 dark:text-slate-100">
                                {password.winbox}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-slate-200 dark:hover:bg-slate-700"
                                onClick={() => {
                                  navigator.clipboard.writeText(password.winbox || '');
                                  toast.success('Winbox copiado!');
                                }}
                                title="Copiar Winbox"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </TableCell>

                        <TableCell>
                          {password.www ? (
                            <div className="flex items-center gap-2">
                              <a
                                href={password.www.startsWith('http') ? password.www : `http://${password.www}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline truncate max-w-[140px] dark:text-blue-400 font-mono"
                                title={password.www}
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
                                title="Copiar WWW"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </TableCell>

                        <TableCell>
                          {password.ssh ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm text-slate-900 dark:text-slate-100">
                                {password.ssh}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-slate-200 dark:hover:bg-slate-700"
                                onClick={() => {
                                  navigator.clipboard.writeText(password.ssh || '');
                                  toast.success('SSH copiado!');
                                }}
                                title="Copiar SSH"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </TableCell>

                        <TableCell>
                          {password.link_rtsp ? (
                            <div className="flex items-center gap-2">
                              <a
                                href={password.link_rtsp.startsWith('http') ? password.link_rtsp : `http://${password.link_rtsp}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline truncate max-w-[250px] dark:text-blue-400 font-mono"
                                title={password.link_rtsp}
                              >
                                {password.link_rtsp}
                              </a>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-slate-200 dark:hover:bg-slate-700"
                                onClick={() => {
                                  navigator.clipboard.writeText(password.link_rtsp || '');
                                  toast.success('URL copiada!');
                                }}
                                title="Copiar URL"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(password)}
                            className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}

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

        {/* Modal de Formulário */}
        <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
          <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
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
              <div className="flex items-center justify-end space-x-2 pb-4 border-b">
                <Label htmlFor="all-options" className="text-sm font-medium">
                  Mostrar todas as opções
                </Label>
                <Switch id="all-options" checked={showAllOptions} onCheckedChange={setShowAllOptions} />
              </div>

              {showService && (
                <div className="space-y-2">
                  <Label htmlFor="service">
                    Serviço <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="service"
                    type="text"
                    value={formData.service}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setFormData(prev => ({ ...prev, service: newValue }));

                      if (!selectedType) {
                        const detectedType = detectServiceType(newValue);
                        if (detectedType) {
                          setFormData(prev => ({ ...prev, tipo: detectedType }));
                        }
                      }
                    }}
                    placeholder="Ex: Gmail, Outlook, Router..."
                  />
                  {formData.service && detectServiceType(formData.service) && !selectedType && (
                    <p className="text-xs text-muted-foreground">
                      Tipo detectado automaticamente: <span className="font-medium text-blue-600">{getTypeDisplayName(detectServiceType(formData.service)!)}</span>
                    </p>
                  )}
                </div>
              )}

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
                  <select
                    id="tipo"
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="">Selecione um tipo...</option>
                    {Object.entries(VALID_TYPES).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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

        {/* Modal de Edição em Duas Colunas */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="w-[95vw] sm:w-full max-w-6xl max-h-[90vh] flex flex-col p-0" hideCloseButton={true}>


            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <form id="edit-form" onSubmit={handleUpdate} className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Coluna Esquerda - Informações Básicas e Credenciais */}
                  <div className="space-y-6">
                    {/* 🏢 Informações Básicas */}
                    <Card className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Building2 className="w-5 h-5 text-blue-600" />
                          Informações Básicas
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
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
                              className="text-base"
                            />
                          </div>

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
                              className="text-base"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-marina">Marina</Label>
                              <select
                                id="edit-marina"
                                value={formData.marina}
                                onChange={(e) => setFormData({ ...formData, marina: e.target.value })}
                                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                              >
                                <option value="">Selecione...</option>
                                {marinasList.map((marina) => (
                                  <option key={marina} value={marina}>
                                    {marina}
                                  </option>
                                ))}
                              </select>
                            </div>

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
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="edit-tipo">Tipo</Label>
                            <select
                              id="edit-tipo"
                              value={formData.tipo}
                              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                              <option value="">Selecione um tipo...</option>
                              {Object.entries(VALID_TYPES).map(([key, label]) => (
                                <option key={key} value={key}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 🔐 Credenciais */}
                    <Card className="border-l-4 border-l-green-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <LockKeyhole className="w-5 h-5 text-green-600" />
                          Credenciais
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
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
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Coluna Direita - Acesso e Configurações Técnicas */}
                  <div className="space-y-6">
                    {/* 🌐 Acesso */}
                    <Card className="border-l-4 border-l-purple-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Globe className="w-5 h-5 text-purple-600" />
                          Acesso
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-url">URL de Acesso</Label>
                            <Input
                              id="edit-url"
                              type="text"
                              value={formData.url}
                              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                              placeholder="https://exemplo.com ou exemplo.com"
                            />
                          </div>

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
                        </div>
                      </CardContent>
                    </Card>

                    {/* ⚙️ Configurações Técnicas */}
                    <Card className="border-l-4 border-l-orange-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Settings className="w-5 h-5 text-orange-600" />
                          Configurações Técnicas
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="grid grid-cols-2 gap-4">
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
                          </div>

                          <div className="grid grid-cols-2 gap-4">
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
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="edit-status">Status</Label>
                            <Input
                              id="edit-status"
                              type="text"
                              value={formData.status}
                              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                              placeholder="Ex: Ativo, Inativo, Em manutenção..."
                            />
                          </div>

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
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer com ações */}
            <div className="border-t bg-slate-50 dark:bg-slate-900 px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={isSubmitting}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        Confirmar Exclusão
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir a senha "{editingPassword?.service}"?
                        <br />
                        <strong className="text-red-600">Esta ação não pode ser desfeita.</strong>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Excluindo...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </>
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <div className="flex items-center gap-3">
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
                  <Button
                    type="submit"
                    form="edit-form"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
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
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}