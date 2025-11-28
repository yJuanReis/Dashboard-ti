import { supabase } from "./supabaseClient";
import { logger } from "@/lib/logger";
import { logCreate, logUpdate } from "./auditService";

export type MaintenanceStatus = "avaliar" | "dev" | "manutencao";
export type BadgeVariant = "yellow" | "gray" | "blue";

export interface PageMaintenanceConfig {
  id: string;
  page_path: string;
  status: MaintenanceStatus;
  badge_text: string;
  badge_variant: BadgeVariant;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Busca todas as páginas em manutenção do banco de dados
 */
export async function getPagesInMaintenance(): Promise<PageMaintenanceConfig[]> {
  try {
    const { data, error } = await supabase
      .from("pages_maintenance")
      .select("*")
      .eq("is_active", true)
      .order("page_path", { ascending: true });

    if (error) {
      logger.error("Erro ao buscar páginas em manutenção:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error("Erro ao buscar páginas em manutenção:", error);
    return [];
  }
}

/**
 * Busca todas as páginas (ativas e inativas) para gerenciamento
 */
export async function getAllPagesMaintenance(): Promise<PageMaintenanceConfig[]> {
  try {
    const { data, error } = await supabase
      .from("pages_maintenance")
      .select("*")
      .order("page_path", { ascending: true });

    if (error) {
      logger.error("Erro ao buscar todas as páginas:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error("Erro ao buscar todas as páginas:", error);
    return [];
  }
}

/**
 * Retorna os paths das páginas que devem estar ocultas por padrão
 * (páginas em manutenção ativas)
 */
export async function getPagesHiddenByDefault(): Promise<string[]> {
  const pages = await getPagesInMaintenance();
  return pages.map(page => page.page_path);
}

/**
 * Verifica se uma página está em manutenção
 */
export async function isPageInMaintenance(path: string): Promise<boolean> {
  const pages = await getPagesInMaintenance();
  return pages.some(page => page.page_path === path);
}

/**
 * Retorna a configuração de manutenção de uma página
 */
export async function getPageMaintenanceConfig(path: string): Promise<PageMaintenanceConfig | null> {
  const pages = await getPagesInMaintenance();
  return pages.find(page => page.page_path === path) || null;
}

/**
 * Atualiza o status de uma página em manutenção
 */
export async function updatePageMaintenance(
  pagePath: string,
  isActive: boolean,
  status?: MaintenanceStatus,
  badgeText?: string,
  badgeVariant?: BadgeVariant
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar se a página já existe
    const { data: existing } = await supabase
      .from("pages_maintenance")
      .select("id")
      .eq("page_path", pagePath)
      .single();

    if (existing) {
      // Busca dados antigos antes de atualizar (para o log de auditoria)
      const { data: oldData } = await supabase
        .from("pages_maintenance")
        .select("*")
        .eq("page_path", pagePath)
        .single();

      // Atualizar página existente
      const updateData: any = { is_active: isActive };
      if (status) updateData.status = status;
      if (badgeText) updateData.badge_text = badgeText;
      if (badgeVariant) updateData.badge_variant = badgeVariant;

      const { data: newData, error } = await supabase
        .from("pages_maintenance")
        .update(updateData)
        .eq("page_path", pagePath)
        .select()
        .single();

      if (error) {
        logger.error("Erro ao atualizar página:", error);
        return { success: false, error: error.message };
      }

      // Registra log de auditoria
      if (oldData && newData) {
        await logUpdate(
          'pages_maintenance',
          existing.id,
          oldData as Record<string, any>,
          newData as Record<string, any>,
          `Atualizou manutenção da página: ${pagePath}`
        ).catch(err => logger.warn('Erro ao registrar log de auditoria:', err));
      }
    } else if (isActive) {
      // Criar nova entrada se estiver ativando
      const newPageData = {
        page_path: pagePath,
        status: status || "avaliar",
        badge_text: badgeText || "Avaliar",
        badge_variant: badgeVariant || "yellow",
        is_active: true,
      };

      const { data: createdData, error } = await supabase
        .from("pages_maintenance")
        .insert(newPageData)
        .select()
        .single();

      if (error) {
        logger.error("Erro ao criar página:", error);
        return { success: false, error: error.message };
      }

      // Registra log de auditoria
      if (createdData) {
        await logCreate(
          'pages_maintenance',
          createdData.id,
          createdData as Record<string, any>,
          `Criou manutenção para página: ${pagePath}`
        ).catch(err => logger.warn('Erro ao registrar log de auditoria:', err));
      }
    }

    return { success: true };
  } catch (error: any) {
    logger.error("Erro ao atualizar página em manutenção:", error);
    return { success: false, error: error.message || "Erro desconhecido" };
  }
}

