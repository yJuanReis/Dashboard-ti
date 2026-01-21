import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Key,
  IdCard,
  Mail,
  Video,
  HardDrive,
  FileText,
  Network,
  Server,
  Wrench,
  Printer,
  Phone,
  Settings,
  ShoppingCart,
  Shield,
  Database,
  DollarSign,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";

export type AppRole = "admin" | "user";

export type NavigationItem = {
  /** Título exibido na sidebar */
  title: string;
  /** Caminho/URL da rota (precisa bater com o react-router) */
  url: string;
  /** Ícone Lucide usado no item */
  icon: ComponentType<{ className?: string }>;
  /**
   * Quando true, o item NÃO aparece em navegação principal mobile
   * (sidebar mobile e barra inferior).
   */
  mobileHidden?: boolean;
  /**
   * Quando true, o item aparece apenas em contextos mobile.
   */
  mobileOnly?: boolean;
  /**
   * Roles que podem ver o item (undefined = todos).
   */
  roles?: AppRole[];
  /**
   * Quando true, o item aparece apenas em contextos desktop.
   */
  desktopOnly?: boolean;
};

/**
 * Fonte única de verdade para os itens de navegação.
 * Usada pela sidebar e pela navegação mobile.
 */
export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    title: "Início",
    url: "/home",
    icon: LayoutDashboard,
  },
  {
    title: "Base de Conhecimento",
    url: "/senhas",
    icon: Key,
  },
  {
    title: "Termos de Responsabilidade",
    url: "/termos",
    icon: FileText,
  },
  {
    title: "Criação de Crachás",
    url: "/crachas",
    icon: IdCard,
  },
  {
    title: "Gerador de Assinaturas",
    url: "/assinaturas",
    icon: Mail,
  },
  {
    title: "Controle NVRs",
    url: "/controle-nvr",
    icon: Video,
  },
  {
    title: "Controle HDs",
    url: "/controle-hds",
    icon: HardDrive,
  },
  {
    title: "Impressoras",
    url: "/impressoras",
    icon: Printer,
  },
  {
    title: "Ramais",
    url: "/ramais",
    icon: Phone,
  },
  {
    title: "Chamados",
    url: "/chamados",
    icon: Wrench,
  },
  {
    title: "Gestão de Rede",
    url: "/gestaorede",
    icon: Network,
  },
  {
    title: "Servidores",
    url: "/servidores",
    icon: Server,
  },
  {
    title: "Configurações",
    url: "/configuracoes",
    icon: Settings,
    roles: ["admin"],
  },
];