import {
  Mail,
  Shield,
  Server,
  Network,
  Database,
  Router,
  Wifi,
  Video,
  Cloud,
  LockKeyhole,
  type LucideIcon
} from "lucide-react";

// Exporta o tipo LucideIcon para uso em outros arquivos
export type { LucideIcon };

// Mapeamento de nomes de ícones para componentes
export const iconMap: Record<string, LucideIcon> = {
  mail: Mail,
  shield: Shield,
  server: Server,
  network: Network,
  database: Database,
  router: Router,
  wifi: Wifi,
  video: Video,
  cloud: Cloud,
  lock: LockKeyhole,
};

// Função para obter o componente de ícone a partir de uma string
export function getIcon(iconName: string | null | undefined): LucideIcon {
  if (!iconName) return Server; // Ícone padrão
  const normalizedName = iconName.toLowerCase();
  return iconMap[normalizedName] || Server;
}


