/**
 * Configuração de páginas em manutenção/avaliação
 * 
 * Páginas listadas aqui:
 * - Aparecem com badge "Avaliar" na sidebar para admins
 * - Ficam automaticamente ocultas para usuários normais
 * - Não aparecem na sidebar para usuários sem permissão de admin
 */

export type MaintenanceStatus = "avaliar" | "dev" | "manutencao";

export interface PageMaintenanceConfig {
  path: string;
  status: MaintenanceStatus;
  badgeText: string;
  badgeVariant: "yellow" | "gray" | "blue";
}

/**
 * Lista de páginas em manutenção/avaliação
 * Adicione ou remova páginas desta lista para controlar automaticamente
 * quais páginas aparecem com badge e ficam ocultas para usuários
 */
export const PAGES_IN_MAINTENANCE: PageMaintenanceConfig[] = [
  {
    path: "/controle-hds",
    status: "avaliar",
    badgeText: "Avaliar",
    badgeVariant: "yellow",
  },
  {
    path: "/gestaorede",
    status: "avaliar",
    badgeText: "Avaliar",
    badgeVariant: "yellow",
  },
  {
    path: "/servidores",
    status: "avaliar",
    badgeText: "Avaliar",
    badgeVariant: "yellow",
  },
  {
    path: "/chamados",
    status: "avaliar",
    badgeText: "Avaliar",
    badgeVariant: "yellow",
  },
  {
    path: "/teste-de-seguranca",
    status: "dev",
    badgeText: "Dev",
    badgeVariant: "gray",
  },
  {
    path: "/configuracoes",
    status: "dev",
    badgeText: "Dev",
    badgeVariant: "gray",
  },
];

/**
 * Retorna os paths das páginas que devem estar ocultas por padrão
 * (páginas em manutenção/avaliação)
 * 
 * @deprecated Use getPagesHiddenByDefault() do pagesMaintenanceService
 * Mantido apenas para compatibilidade
 */
export function getPagesHiddenByDefault(): string[] {
  return PAGES_IN_MAINTENANCE.map(page => page.path);
}

/**
 * Verifica se uma página está em manutenção
 * 
 * @deprecated Use isPageInMaintenance() do pagesMaintenanceService
 * Mantido apenas para compatibilidade
 */
export function isPageInMaintenance(path: string): boolean {
  return PAGES_IN_MAINTENANCE.some(page => page.path === path);
}

/**
 * Retorna a configuração de manutenção de uma página
 * 
 * @deprecated Use getPageMaintenanceConfig() do pagesMaintenanceService
 * Mantido apenas para compatibilidade
 */
export function getPageMaintenanceConfig(path: string): PageMaintenanceConfig | undefined {
  return PAGES_IN_MAINTENANCE.find(page => page.path === path);
}

