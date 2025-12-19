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
    title: "Senhas",
    url: "/senhas",
    icon: Key,
  },
  {
    title: "Crachás",
    url: "/crachas",
    icon: IdCard,
  },
  {
    title: "Assinaturas",
    url: "/assinaturas",
    icon: Mail,
  },
  {
    title: "Controle NVR",
    url: "/controle-nvr",
    icon: Video,
  },
  {
    title: "Controle de HDs",
    url: "/controle-hds",
    icon: HardDrive,
  },
  {
    title: "Termo de Responsabilidade",
    url: "/termos",
    icon: FileText,
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
    title: "Chamados",
    url: "/chamados",
    icon: Wrench,
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
    title: "Solicitações",
    url: "/solicitacoes",
    icon: ShoppingCart,
  },
  {
    title: "Despesas",
    url: "/despesas-recorrentes",
    icon: DollarSign,
  },
  {
    title: "Logs",
    url: "/logs",
    icon: ClipboardList,
  },

 {    title: "Pentest",
    url: "/teste-de-seguranca",
    icon: ShieldCheck,
  },


  {
    title: "Configurações",
    url: "/configuracoes",
    icon: Settings,
    roles: ["admin"],
  },
];
