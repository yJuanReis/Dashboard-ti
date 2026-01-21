import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// Tentativa de correção de imports:
// Se '../lib' falhar, pode ser que o ambiente espere '@/' ou outra estrutura.
// Mantendo '../lib' pois é o correto fisicamente (src/pages -> src/lib).
import { fetchNVRs } from "../lib/nvrService";
import { fetchRamais, type Ramal } from "../lib/ramaisService";
import { fetchImpressoras, type Impressora } from "../lib/impressorasService";



import {
  Phone,
  Printer,
  Loader2,
  Database,
  Activity,
  Video,
  FileText,
  HardDrive,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Server,
  ArrowRight,
  X,
  ChevronDown,
  HelpCircle
} from "lucide-react";

// --- MOCKS E UTILITÁRIOS (Para substituir dependências externas) ---

const logger = {
  error: (msg: string, err: any) => console.error(msg, err),
  info: (msg: string) => console.log(msg),
};

const toast = {
  success: (msg: string) => console.log(`Toast Success: ${msg}`), // Fallback simples
  error: (msg: string) => console.error(`Toast Error: ${msg}`),
};

// useNavigate vem de react-router-dom

// Formatador de data simplificado (substitui date-fns)
const formatDistanceToNow = (date: string | Date) => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return "há menos de um minuto";
  if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} minutos`;
  if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)} horas`;
  return `há ${Math.floor(diffInSeconds / 86400)} dias`;
};

// --- TYPES ---

// Ramal and Impressora types are imported from the service modules

interface NVR {
  id: string;
  status: string;
  nome: string;
}

interface HD {
  id: string;
  modelo: string;
  localizacao: string;
  capacidade_total: string;
  percentual_uso?: number;
  status?: string;
}

interface Log {
  id: string;
  action: string;
  details: string;
  created_at: string;
  user_email?: string;
  profiles?: { email: string; avatar_url?: string };
}

// (Ramais and Impressoras services are imported from lib)

// Cliente Supabase Mockado
const mockSupabase = {
  from: (table: string) => ({
    select: async (query?: string, options?: any) => {
      // Pequeno delay para simular rede
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (table === 'nvrs') {
        return { data: Array(15).fill(null).map((_, i) => ({ status: i < 12 ? 'online' : 'offline' })) };
      }
      if (table === 'controle_hds') {
        return { 
          data: [
            { id: '1', modelo: 'Seagate SkyHawk', localizacao: 'SVR-CAM-01', capacidade_total: '4TB', percentual_uso: 92 },
            { id: '2', modelo: 'WD Purple', localizacao: 'SVR-CAM-02', capacidade_total: '8TB', percentual_uso: 45 },
            { id: '3', modelo: 'Kingston SSD', localizacao: 'SVR-MAIN', capacidade_total: '500GB', percentual_uso: 78 },
          ] 
        };
      }
      if (table === 'solicitacoes') {
        if (options && options.count) return { count: 5 }; // Mock de contagem
        return { count: 5 };
      }
      if (table === 'audit_logs') {
        return { 
          data: [
            { id: '1', action: 'Login', details: 'Usuário admin logou via IP 192.168.1.10', created_at: new Date().toISOString(), user_email: 'admin@brmarinas.com' },
            { id: '2', action: 'Update', details: 'Atualização de firmware NVR-04', created_at: new Date(Date.now() - 3600000).toISOString(), user_email: 'tecnico@brmarinas.com' },
            { id: '3', action: 'Delete', details: 'Remoção de log antigo', created_at: new Date(Date.now() - 7200000).toISOString(), user_email: 'sistema@brmarinas.com' },
          ] 
        };
      }
      return { data: [] };
    },
    in: async () => ({ count: 5 }) // Mock para .in() chain
  })
};

// --- COMPONENTES UI SIMPLIFICADOS (Substituindo shadcn/ui) ---

const Card = ({ className, children, onClick }: any) => (
  <div onClick={onClick} className={`bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
    {children}
  </div>
);
const CardHeader = ({ className, children }: any) => <div className={`p-6 pb-2 ${className}`}>{children}</div>;
const CardTitle = ({ className, children }: any) => <h3 className={`font-semibold text-lg ${className}`}>{children}</h3>;
const CardContent = ({ className, children }: any) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;
const CardDescription = ({ children }: any) => <p className="text-sm text-slate-500 dark:text-slate-400">{children}</p>;

const Button = ({ variant, size, className, children, onClick }: any) => {
  const baseStyle = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  const variants: any = {
    ghost: "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50",
    default: "bg-slate-900 text-white hover:bg-slate-900/90 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90",
    primary: "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700",
  };
  const sizes: any = {
    default: "h-9 px-4 py-2",
    sm: "h-8 rounded-md px-3 text-xs",
    icon: "h-9 w-9",
  };
  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant || 'default']} ${sizes[size || 'default']} ${className}`}>
      {children}
    </button>
  );
};

const ScrollArea = ({ className, children }: any) => (
  <div className={`overflow-auto ${className}`}>{children}</div>
);

const Avatar = ({ className, children }: any) => (
  <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}>{children}</div>
);
const AvatarImage = ({ src }: any) => src ? <img src={src} className="aspect-square h-full w-full" /> : null;
const AvatarFallback = ({ children, className }: any) => (
  <div className={`flex h-full w-full items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 ${className}`}>{children}</div>
);

// Componente SectionCard
const SectionCard = ({ title, icon, count, onClick, className = "" }: any) => (
  <div 
    onClick={onClick}
    className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer flex flex-col justify-between h-[110px] ${className}`}
  >
    <div className="flex justify-between items-start">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</span>
      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-900 dark:text-slate-100">
        {icon}
      </div>
    </div>
    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{count}</div>
  </div>
);

// Componente SimpleModal (Para conteúdo geral)
const SimpleModal = ({ open, onOpenChange, title, children }: any) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white dark:bg-slate-950 w-full max-w-4xl rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={() => onOpenChange(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

// Componente AlertModal (Novo componente para substituir window.confirm)
const AlertModal = ({ open, onOpenChange, title, description, onConfirm }: any) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-950 w-full max-w-sm rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 transform transition-all animate-in zoom-in-95 scale-100">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                <HelpCircle className="h-6 w-6" />
             </div>
             <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">{title}</h2>
             </div>
          </div>
          
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed ml-1">
            {description}
          </p>
          
          <div className="flex justify-end gap-3 mt-2">
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button 
              variant="primary"
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
            >
              Confirmar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente Accordion Simplificado
const Accordion = ({ children, type, className }: any) => <div className={className}>{children}</div>;
const AccordionItem = ({ children, className }: any) => <div className={`mb-2 ${className}`}>{children}</div>;
// Hack para fazer o Accordion funcionar localmente sem Context
const SelfContainedAccordionItem = ({ title, children, count }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border rounded-lg px-4 bg-slate-50 dark:bg-slate-900/50 mb-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-3 hover:no-underline focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-base text-slate-900 dark:text-slate-100">{title}</span>
          <span className="text-slate-500 text-sm font-normal">
            ({count} {count === 1 ? 'item' : 'itens'})
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="pb-4 animate-in slide-in-from-top-2 fade-in">{children}</div>}
    </div>
  );
};


// --- COMPONENTE PRINCIPAL ---

export default function Home() {
  const navigate = useNavigate();
  const supabase = mockSupabase; // Usando o mock

  // Estados Originais
  const [ramais, setRamais] = useState<Ramal[]>([]);
  const [loadingRamais, setLoadingRamais] = useState(true);
  const [impressoras, setImpressoras] = useState<Impressora[]>([]);
  const [loadingImpressoras, setLoadingImpressoras] = useState(true);
  
  // Estados dos Modais de Conteúdo
  const [openRamais, setOpenRamais] = useState(false);
  const [openImpressoras, setOpenImpressoras] = useState(false);
  const [openNVRs, setOpenNVRs] = useState(false);
  const [openStorageModal, setOpenStorageModal] = useState(false);

  // Estado do Modal de Alerta/Confirmação
  const [alertState, setAlertState] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  // Novos Estados (Dashboard)
  const [nvrStats, setNvrStats] = useState({ online: 0, offline: 0, total: 0 });
  const [criticalHDs, setCriticalHDs] = useState<HD[]>([]);
  const [criticalNVRs, setCriticalNVRs] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [recentLogs, setRecentLogs] = useState<Log[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);



  useEffect(() => {
    loadRamais();
    loadImpressoras();
    fetchDashboardData();
  }, []);

  const loadRamais = async () => {
    try {
      setLoadingRamais(true);
      const data = await fetchRamais();
      setRamais(data);
    } catch (error) {
      logger.error("Erro ao carregar ramais:", error);
    } finally {
      setLoadingRamais(false);
    }
  };

  const loadImpressoras = async () => {
    try {
      setLoadingImpressoras(true);
      const data = await fetchImpressoras();
      setImpressoras(data);
    } catch (error) {
      logger.error("Erro ao carregar impressoras:", error);
    } finally {
      setLoadingImpressoras(false);
    }
  };

  const fetchDashboardData = async () => {
    setLoadingDashboard(true);
    try {
      // 1. Buscar Status dos NVRs
      const { data: nvrs } = await supabase.from('nvrs').select('status');
      if (nvrs) {
        const online = nvrs.filter((n: any) => n.status?.toLowerCase() === 'online').length;
        const total = nvrs.length;
        const offline = total - online;
        setNvrStats({ online, offline, total });
      }

      // 2. Buscar HDs Críticos
      const { data: hds } = await supabase.from('controle_hds').select('*');
      if (hds) {
        const sortedHDs = hds.map((hd: any) => ({
          ...hd,
          percentual_uso: hd.percentual_uso || Math.floor(Math.random() * 100) 
        })).sort((a: any, b: any) => (b.percentual_uso || 0) - (a.percentual_uso || 0))
          .slice(0, 3);
        setCriticalHDs(sortedHDs);
      }



      // 4. Buscar Últimos Logs
      const { data: logs } = await supabase.from('audit_logs').select('*');
      if (logs) setRecentLogs(logs as Log[]);

      // 5. Buscar NVRs e filtrar slots menores que 12TB
      try {
        const nvrsData = await fetchNVRs();
        const SLOT_THRESHOLD = 12; // TB
        const MIN_SLOTS_UNDER = 2; // mostrar apenas NVRs com >= 2 slots abaixo do threshold

        const filtered = (nvrsData || []).map((nvr: any) => {
          const lowSlots = (nvr.slots || [])
            .map((s: any, idx: number) => ({ index: idx + 1, hdSize: Number(s.hdSize || 0), status: s.status }))
            .filter((s: any) => s.hdSize > 0 && s.hdSize < SLOT_THRESHOLD);
          return { nvr, lowSlots, problemCount: lowSlots.length };
        }).filter((x: any) => x.problemCount >= MIN_SLOTS_UNDER)
          .sort((a: any, b: any) => b.problemCount - a.problemCount); // Ordenar por quantidade de problemas (decrescente)

        setCriticalNVRs(filtered);
      } catch (err) {
        console.error('Erro ao buscar NVRs para armazenamento crítico:', err);
      }



    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Funções Auxiliares
  const parseRamais = (ramaisString?: string): string[] =>
    !ramaisString ? [] : ramaisString.split(/[,;\s\/]+/).filter((r) => r.trim().length > 0);

  const groupImpressorasByMarina = (impressoras: Impressora[]): Record<string, Impressora[]> =>
    impressoras.reduce((acc, imp) => {
      const marina = imp.marina || "Sem marina";
      if (!acc[marina]) acc[marina] = [];
      acc[marina].push(imp);
      return acc;
    }, {} as Record<string, Impressora[]>);

  const extractMarinaFromRamal = (ramal: Ramal): string => {
    if (ramal.marina && ramal.marina.trim()) {
      return ramal.marina;
    }
    return "Verolme"; // Fallback simples
  };

  const groupRamaisByMarina = (ramais: Ramal[]): Record<string, Ramal[]> =>
    ramais.reduce((acc, ramal) => {
      const marina = extractMarinaFromRamal(ramal);
      if (!acc[marina]) acc[marina] = [];
      acc[marina].push(ramal);
      return acc;
    }, {} as Record<string, Ramal[]>);

  const handleCopyIP = (ip: string, local: string) => {
    toast.success(`IP ${ip} copiado! (${local})`);
  };

  const getHDSizeClass = (size: number) => {
    if (!size || size <= 0) return "bg-gray-500";
    if (size <= 3) return "bg-red-500";
    if (size <= 4) return "bg-orange-500";
    if (size <= 6) return "bg-yellow-600";
    if (size <= 12) return "bg-yellow-400";
    if (size <= 14) return "bg-lime-500";
    if (size >= 18) return "bg-cyan-500";
    return "bg-gray-500";
  };

  const getSlotStatusClass = (status: string, hdSize: number) => {
    const baseClass = getHDSizeClass(hdSize);
    return status === "inactive" ? `${baseClass} opacity-50` : baseClass;
  };

  // Nova função para visualização completa dos slots
  const getCompleteSlotStatus = (hdSize: number, status: string) => {
    if (!hdSize || hdSize <= 0) return "bg-gray-400 border-gray-600"; // Slot vazio
    if (hdSize >= 14) return "bg-green-500 border-green-700"; // Adequado
    if (hdSize >= 6) return "bg-yellow-500 border-yellow-700"; // Atenção
    return "bg-red-500 border-red-700"; // Crítico
  };

  const getNVRUpgradeStatus = (slots: any[]) => {
    if (!slots || slots.length === 0) return { status: "Sem dados", color: "bg-gray-500", progress: 0 };

    const totalSlots = slots.length;
    const adequateSlots = slots.filter(s => s.hdSize >= 14).length;
    const purchasedSlots = slots.filter(s => s.purchased === true).length;
    const progress = (adequateSlots / totalSlots) * 100;

    // Lógica baseada no status de compra
    if (progress === 100) return { status: "Pronto", color: "bg-green-500", progress };
    if (purchasedSlots > 0) return { status: "Em progresso", color: "bg-yellow-500", progress };
    return { status: "Precisa upgrade", color: "bg-red-500", progress };
  };

  // --- FUNÇÃO PARA ABRIR O MODAL DE CONFIRMAÇÃO ---
  const showAlert = (title: string, description: string, onConfirm: () => void) => {
    setAlertState({
        open: true,
        title,
        description,
        onConfirm
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans p-4 relative overflow-hidden transition-colors duration-500">
      
      {/* --- CONFIGURAÇÃO DO BACKGROUND ANIMADO --- */}
      <style>{`
        .aurora-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          background: linear-gradient(
            45deg,
            #e0f2fe,
            #eef2ff,
            #f0fdf4
          );
          background-size: 400% 400%;
          animation: aurora 15s ease infinite;
        }
        
        .dark .aurora-background {
          background: linear-gradient(
            45deg,
            #0f172a,
            #1e1b4b,
            #172554
          );
        }

        @keyframes aurora {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      
      {/* Elemento do Background */}
      <div className="aurora-background"></div>

      <main className="max-w-10xl mx-auto px-3 md:px-4 lg:px-6 py-4 md:py-6 lg:py-8 relative z-10">
        {/* -------- TOP GRID (CARDS RESUMIDOS) -------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <SectionCard
            title="Ramais"
            icon={<Phone className="w-4 h-4" />}
            count={ramais.length}
            onClick={() => setOpenRamais(true)}
          />

          <SectionCard
            title="Impressoras"
            icon={<Printer className="w-4 h-4" />}
            count={impressoras.length}
            onClick={() => setOpenImpressoras(true)}
          />





          <SectionCard
            title="Termos de Responsabilidade"
            icon={<FileText className="w-4 h-4" />}
            onClick={() => {
              showAlert(
                "Termos de Responsabilidade",
                "Deseja ser redirecionado para a página de termos de responsabilidade?",
                () => navigate('/termos')
              );
            }}
            count="> Preencher termos 📝"
          />

        </div>

        {/* -------- ÁREAS DE CONTEÚDO PRINCIPAL -------- */}
        <div className="grid grid-cols-1 gap-6">



          {/* Status de Upgrade de HDs */}
          <Card className="shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Server className="h-5 w-5 text-orange-600" />
                  Status de Upgrade de HDs
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenStorageModal(true)}
                  className="text-xs hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 dark:hover:bg-orange-900/20 dark:hover:border-orange-600 dark:hover:text-orange-400 transition-all"
                >
                  <Server className="w-3 h-3 mr-1" />
                  Ver Todos
                </Button>
              </div>
              <CardDescription>Visão completa de todos os slots de cada NVR</CardDescription>
            </CardHeader>
            <CardContent>
              {criticalNVRs.length === 0 && !loadingDashboard ? (
                <div className="text-center py-6 text-slate-400 text-sm">
                  Nenhum NVR com dados de armazenamento disponíveis.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {criticalNVRs.slice(0, 4).map((item: any) => {
                    // Usar todos os slots do NVR, não só os problemáticos
                    const allSlots = item.nvr.slots || [];
                    const upgradeStatus = getNVRUpgradeStatus(allSlots);
                    const adequateCount = allSlots.filter((s: any) => s.hdSize >= 14).length;
                    const totalSlots = allSlots.length;

                    return (
                      <div
                        key={item.nvr.id}
                        className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-white dark:bg-slate-900/50 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all"
                        onClick={() => navigate(`/controle-hds?nvr=${item.nvr.id}`)}
                      >
                        {/* Cabeçalho do NVR */}
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                              {item.nvr.marina} / {item.nvr.name}
                            </div>
                            <div className="text-xs text-slate-500">{item.nvr.model || 'Modelo não informado'}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`px-2 py-1 rounded-full text-xs font-medium text-white ${upgradeStatus.color}`}>
                              {upgradeStatus.status}
                            </div>
                            <div className="text-xs text-slate-500">
                              {adequateCount}/{totalSlots}
                            </div>
                          </div>
                        </div>

                        {/* Barra de progresso */}
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-4">
                          <div
                            className={`h-2 rounded-full transition-all ${upgradeStatus.color.replace('bg-', 'bg-')}`}
                            style={{ width: `${upgradeStatus.progress}%` }}
                          ></div>
                        </div>

                        {/* Slots centralizados e responsivos */}
                        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                          {allSlots.map((slot: any, index: number) => (
                            <div key={index} className="flex items-center gap-1">
                              <span className="text-[9px] font-medium text-slate-500">#{index + 1}</span>
                              <div
                                className={`w-6 h-6 rounded flex items-center justify-center text-white text-[9px] font-bold border ${getCompleteSlotStatus(slot.hdSize, slot.status)} ${slot.status === 'inactive' ? 'opacity-50' : ''}`}
                              >
                                {slot.hdSize > 0 ? `${slot.hdSize}TB` : '-'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>




        </div>

        {/* -------- MODAL RAMAIS -------- */}
        <SimpleModal
          open={openRamais}
          onOpenChange={setOpenRamais}
          title="Lista de Ramais"
        >
          {loadingRamais ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (() => {
            const marinasOrdenadas = Object.entries(groupRamaisByMarina(ramais));
            
            return (
              <div className="space-y-3">
                {marinasOrdenadas.map(([marina, itens]) => (
                  <SelfContainedAccordionItem key={marina} title={marina} count={itens.length}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 px-2">
                      {itens.map((ramal) => {
                        const ramaisList = parseRamais(ramal.ramais);
                        return (
                          <div key={ramal.id} className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
                            <div className="text-xs font-semibold text-center truncate text-slate-700 dark:text-slate-300 mb-1">{ramal.nome_local}</div>
                            <div className="flex flex-wrap justify-center gap-1.5">
                              {ramaisList.map((n, i) => (
                                <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 rounded text-[11px] font-mono font-medium">
                                  {n}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </SelfContainedAccordionItem>
                ))}
              </div>
            );
          })()}
        </SimpleModal>

        {/* -------- MODAL TODOS OS NVRs -------- */}
        <SimpleModal
          open={openStorageModal}
          onOpenChange={setOpenStorageModal}
          title="Todos os NVRs - Status de Upgrade de HDs"
        >
          <style>{`
            .smooth-scroll {
              scroll-behavior: smooth;
              scrollbar-width: thin;
              scrollbar-color: rgb(203 213 225) transparent;
            }
            .smooth-scroll::-webkit-scrollbar {
              width: 6px;
            }
            .smooth-scroll::-webkit-scrollbar-track {
              background: transparent;
            }
            .smooth-scroll::-webkit-scrollbar-thumb {
              background: rgb(203 213 225);
              border-radius: 3px;
            }
            .smooth-scroll::-webkit-scrollbar-thumb:hover {
              background: rgb(148 163 184);
            }
          `}</style>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto smooth-scroll">
            {(() => {
              // Buscar todos os NVRs para mostrar no modal
              const [allNVRs, setAllNVRs] = useState<any[]>([]);

              useEffect(() => {
                const fetchAllNVRs = async () => {
                  try {
                    const nvrsData = await fetchNVRs();
                    setAllNVRs(nvrsData || []);
                  } catch (error) {
                    console.error('Erro ao buscar todos os NVRs:', error);
                  }
                };
                if (openStorageModal) fetchAllNVRs();
              }, [openStorageModal]);

              return allNVRs.length === 0 ? (
                <div className="text-center py-10 flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                  <span className="text-slate-400">Carregando NVRs...</span>
                </div>
              ) : (
                allNVRs.map((nvr: any) => {
                  const allSlots = nvr.slots || [];
                  const upgradeStatus = getNVRUpgradeStatus(allSlots);
                  const adequateCount = allSlots.filter((s: any) => s.hdSize >= 14).length;
                  const totalSlots = allSlots.length;

                  return (
                    <div key={nvr.id} className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-white dark:bg-slate-900/50 shadow-sm">
                      {/* Cabeçalho do NVR */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                            {nvr.marina} / {nvr.name}
                          </div>
                          <div className="text-xs text-slate-500">{nvr.model || 'Modelo não informado'}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium text-white ${upgradeStatus.color}`}>
                            {upgradeStatus.status}
                          </div>
                          <div className="text-xs text-slate-500">
                            {adequateCount}/{totalSlots}
                          </div>
                        </div>
                      </div>

                      {/* Barra de progresso */}
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-4">
                        <div
                          className={`h-2 rounded-full transition-all ${upgradeStatus.color.replace('bg-', 'bg-')}`}
                          style={{ width: `${upgradeStatus.progress}%` }}
                        ></div>
                      </div>

                      {/* Slots com nova estética */}
                      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                        {allSlots.map((slot: any, index: number) => (
                          <div key={index} className="flex items-center gap-1">
                            <span className="text-[9px] font-medium text-slate-500">#{index + 1}</span>
                            <div
                              className={`w-6 h-6 rounded flex items-center justify-center text-white text-[9px] font-bold border ${getCompleteSlotStatus(slot.hdSize, slot.status)} ${slot.status === 'inactive' ? 'opacity-50' : ''}`}
                            >
                              {slot.hdSize > 0 ? `${slot.hdSize}TB` : '-'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              );
            })()}
          </div>
        </SimpleModal>

        {/* -------- MODAL IMPRESSORAS -------- */}
        <SimpleModal
          open={openImpressoras}
          onOpenChange={setOpenImpressoras}
          title="Lista de Impressoras"
        >
          {loadingImpressoras ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (() => {
            const marinasOrdenadas = Object.entries(groupImpressorasByMarina(impressoras));

            return (
              <div className="space-y-3">
                {marinasOrdenadas.map(([marina, itens]) => (
                  <SelfContainedAccordionItem key={marina} title={marina} count={itens.length}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-2">
                      {itens.map((imp) => (
                        <div
                          key={imp.id}
                          className={`p-3 border rounded-lg bg-white dark:bg-slate-900 transition-all ${
                              imp.ip 
                              ? "cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md hover:bg-purple-50/50 dark:hover:bg-purple-900/20" 
                              : "opacity-75"
                          }`}
                          onClick={() => imp.ip && handleCopyIP(imp.ip, imp.local || "Impressora")}
                        >
                          <div className="text-xs font-bold text-center truncate mb-2 text-slate-700 dark:text-slate-300">{imp.local}</div>
                          {imp.ip ? (
                            <div className="text-center px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200 rounded text-[11px] font-mono tracking-wide">
                              {imp.ip}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 text-center mt-1 italic border border-dashed border-slate-300 rounded px-2 py-0.5">Sem IP</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </SelfContainedAccordionItem>
                ))}
              </div>
            );
          })()}
        </SimpleModal>
        
        <div className="py-8 text-center">
          <p className="text-sm text-slate-400 opacity-60 hover:opacity-100 transition-opacity">
            Sistema desenvolvido pela equipe de TI - BR Marinas
          </p>
        </div>
      </main>

      {/* --- MODAL DE ALERTA GLOBAL --- */}
      <AlertModal 
        open={alertState.open}
        onOpenChange={(isOpen: boolean) => setAlertState(prev => ({ ...prev, open: isOpen }))}
        title={alertState.title}
        description={alertState.description}
        onConfirm={alertState.onConfirm}
      />

    </div>
  );
}