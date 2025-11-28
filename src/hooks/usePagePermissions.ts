import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { normalizeRoutePath } from "@/lib/pathUtils";
import { logger } from "@/lib/logger";

export function usePagePermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [role, setRole] = useState<string>("user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      if (!user) {
        setPermissions([]);
        setRole("user");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("role, page_permissions")
          .eq("user_id", user.id)
          .single();

        if (error) {
          logger.error("Erro ao carregar permissões:", error);
          // Fallback: verificar user_metadata
          const fallbackRole = user.user_metadata?.role || "user";
          logger.log("Usando fallback role do user_metadata:", fallbackRole);
          setPermissions([]);
          setRole(fallbackRole);
          setLoading(false);
          return;
        }

        const userRole = data?.role || user.user_metadata?.role || "user";
        logger.log("Role carregado:", { role: userRole, fromDB: data?.role, fromMetadata: user.user_metadata?.role });
        setRole(userRole);
        // Se for admin, não precisa verificar permissões
        if (data?.role === "admin") {
          setPermissions([]); // Array vazio = acesso a todas (para admins)
        } else if (data?.page_permissions === null || data?.page_permissions === undefined) {
          // Se nunca foi definido, acesso total
          setPermissions([]);
        } else {
          // Se foi definido (mesmo que vazio), usar o valor normalizado
          const normalizedPerms = (data.page_permissions || []).map(normalizeRoutePath);
          setPermissions(normalizedPerms);
        }
      } catch (error) {
        logger.error("Erro ao carregar permissões:", error);
        setPermissions([]);
        setRole("user");
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [user]);

  const hasPermission = useCallback((path: string): boolean => {
    // Admins têm acesso a todas as páginas
    if (role === "admin") return true;
    
    // Normalizar path para comparação (garantir que começa com /)
    const normalizedPath = normalizeRoutePath(path);
    
    // Se permissions está vazio, significa acesso total
    if (permissions.length === 0) {
      return true;
    }
    
    // Se há permissões definidas, verificar se está no array
    const hasAccess = permissions.some(perm => normalizeRoutePath(perm) === normalizedPath);
    
    return hasAccess;
  }, [role, permissions]);

  return { permissions, role, hasPermission, loading };
}

