import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  fetchNVRs, 
  createNVR, 
  updateNVR as updateNVRService, 
  deleteNVR as deleteNVRService, 
  updateNVRSlot,
  subscribeToNVRs 
} from "@/lib/nvrService";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

// Interfaces
export interface Slot {
  status: "empty" | "active" | "inactive";
  hdSize: number;
  purchased?: boolean;
}

export interface NVR {
  id: string;
  marina: string;
  name: string;
  model: string;
  owner: string;
  cameras: number;
  notes?: string;
  slots: Slot[];
}

// Constantes
export const OWNER_OPTIONS = ["BR Marinas", "Tele Litorânea"];
export const NVR_MODELS: Record<string, { slots: number; maxCameras: number }> = {
  "INVD 1016": { slots: 1, maxCameras: 16 },
  "INVD 5232": { slots: 8, maxCameras: 32 },
  "NVD 3332": { slots: 4, maxCameras: 32 },
  "INVD 5132": { slots: 4, maxCameras: 32 },
  "NVD 1432": { slots: 2, maxCameras: 32 },
  "NVD 1232": { slots: 2, maxCameras: 32 },
  "MHDX 3116": { slots: 1, maxCameras: 16 },
};
export const MARINA_OPTIONS = [
  "Boa Vista",
  "Buzios",
  "Gloria",
  "JL Bracuhy",
  "Refugio Paraty",
  "Piratas",
  "Ribeira",
  "Verolme",
  "Itacuruça",
  "Piccola",
];

// Mock data inicial
const initialNVRs: NVR[] = [
  {
    id: "1",
    marina: "Boa Vista",
    name: "01",
    model: "INVD 5232",
    owner: "BR Marinas",
    cameras: 32,
    notes: "32 câmeras IP",
    slots: [
      { status: "active", hdSize: 14 },
      { status: "active", hdSize: 18 },
      { status: "active", hdSize: 6 },
      { status: "active", hdSize: 4 },
      { status: "empty", hdSize: 0 },
      { status: "empty", hdSize: 0 },
      { status: "empty", hdSize: 0 },
      { status: "empty", hdSize: 0 },
    ],
  },
  {
    id: "2",
    marina: "Buzios",
    name: "01",
    model: "NVD 3332",
    owner: "Tele Litorânea",
    cameras: 12,
    notes: "12 câmeras IP\n2 câmeras IP c/ áudio\n1 câmera analógica",
    slots: [
      { status: "active", hdSize: 4 },
      { status: "active", hdSize: 14 },
      { status: "empty", hdSize: 0 },
      { status: "inactive", hdSize: 4 },
    ],
  },
  {
    id: "3",
    marina: "Gloria",
    name: "03",
    model: "INVD 5132",
    owner: "Tele Litorânea",
    cameras: 32,
    notes: "32 câmeras IP",
    slots: [
      { status: "active", hdSize: 14 },
      { status: "active", hdSize: 6 },
      { status: "active", hdSize: 14 },
      { status: "active", hdSize: 14 },
    ],
  },
];

interface NVRContextType {
  nvrs: NVR[];
  setNvrs: (nvrs: NVR[] | ((prev: NVR[]) => NVR[])) => void;
  updateNVR: (id: string, updates: Partial<NVR>) => Promise<void>;
  addNVR: (nvr: Omit<NVR, 'id'>) => Promise<NVR>;
  deleteNVR: (id: string) => Promise<void>;
  updateSlot: (nvrId: string, slotIndex: number, slot: Slot) => Promise<void>;
  loading?: boolean;
}

const NVRContext = createContext<NVRContextType | undefined>(undefined);

export function NVRProvider({ children }: { children: ReactNode }) {
  const [nvrs, setNvrs] = useState<NVR[]>([]);
  const [loading, setLoading] = useState(true);

  // Carrega NVRs do Supabase ao montar o componente
  useEffect(() => {
    loadNVRs();

    // Configura listener em tempo real
    const unsubscribe = subscribeToNVRs((updatedNVRs) => {
      setNvrs(updatedNVRs);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadNVRs = async () => {
    try {
      setLoading(true);
      logger.log('🔄 Carregando NVRs do Supabase...');
      const data = await fetchNVRs();
      logger.log(`✅ ${data.length} NVRs carregados:`, data);
      setNvrs(data);
      if (data.length === 0) {
        logger.warn('⚠️ Nenhum NVR encontrado no banco de dados');
        toast.info('Nenhum NVR encontrado no banco de dados');
      }
    } catch (error) {
      logger.error('❌ Erro ao carregar NVRs:', error);
      toast.error('Erro ao carregar NVRs do banco de dados. Verifique o console para mais detalhes.');
    } finally {
      setLoading(false);
    }
  };

  const updateNVR = async (id: string, updates: Partial<NVR>) => {
    try {
      const updated = await updateNVRService(id, updates);
      setNvrs((prev) =>
        prev.map((nvr) => (nvr.id === id ? updated : nvr))
      );
      toast.success('NVR atualizado com sucesso');
    } catch (error) {
      logger.error('Erro ao atualizar NVR:', error);
      toast.error('Erro ao atualizar NVR');
      throw error;
    }
  };

  const addNVR = async (nvr: Omit<NVR, 'id'>) => {
    try {
      const newNVR = await createNVR(nvr);
      setNvrs((prev) => [...prev, newNVR]);
      toast.success('NVR adicionado com sucesso');
      return newNVR;
    } catch (error) {
      logger.error('Erro ao adicionar NVR:', error);
      toast.error('Erro ao adicionar NVR');
      throw error;
    }
  };

  const deleteNVR = async (id: string) => {
    try {
      await deleteNVRService(id);
      setNvrs((prev) => prev.filter((nvr) => nvr.id !== id));
      toast.success('NVR removido com sucesso');
    } catch (error) {
      logger.error('Erro ao deletar NVR:', error);
      toast.error('Erro ao remover NVR');
      throw error;
    }
  };

  const updateSlot = async (nvrId: string, slotIndex: number, slot: Slot) => {
    try {
      const updated = await updateNVRSlot(nvrId, slotIndex, slot);
      setNvrs((prev) =>
        prev.map((nvr) => (nvr.id === nvrId ? updated : nvr))
      );
    } catch (error) {
      logger.error('Erro ao atualizar slot:', error);
      toast.error('Erro ao atualizar slot');
      throw error;
    }
  };

  return (
    <NVRContext.Provider
      value={{ nvrs, setNvrs, updateNVR, addNVR, deleteNVR, updateSlot, loading }}
    >
      {children}
    </NVRContext.Provider>
  );
}

export function useNVR() {
  const context = useContext(NVRContext);
  if (context === undefined) {
    throw new Error("useNVR must be used within a NVRProvider");
  }
  return context;
}



