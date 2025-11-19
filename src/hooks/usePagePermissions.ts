import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";

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
          console.error("Erro ao carregar permissões:", error);
          // Fallback: verificar user_metadata
          const fallbackRole = user.user_metadata?.role || "user";
          console.log("Usando fallback role do user_metadata:", fallbackRole);
          setPermissions([]);
          setRole(fallbackRole);
          setLoading(false);
          return;
        }

        const userRole = data?.role || user.user_metadata?.role || "user";
        console.log("Role carregado:", { role: userRole, fromDB: data?.role, fromMetadata: user.user_metadata?.role });
        setRole(userRole);
        // Se for admin, não precisa verificar permissões
        if (data?.role === "admin") {
          setPermissions([]); // Array vazio = acesso a todas (para admins)
        } else if (data?.page_permissions === null || data?.page_permissions === undefined) {
          // Se nunca foi definido, acesso total
          setPermissions([]);
        } else {
          // Se foi definido (mesmo que vazio), usar o valor
          setPermissions(data.page_permissions || []);
        }
      } catch (error) {
        console.error("Erro ao carregar permissões:", error);
        setPermissions([]);
        setRole("user");
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [user]);

  const hasPermission = (path: string): boolean => {
    if (role === "admin") return true;
    // Se permissions está vazio mas foi carregado do banco, significa que não há permissões
    // Mas se nunca foi definido (null), deveria ter acesso total
    // Por enquanto, vamos verificar se está no array
    // Se o array tem valores, verificar se está incluído
    // Se o array está vazio, significa que o admin removeu todas = sem acesso
    // Mas isso é complicado de detectar aqui, então vamos confiar no PagePermissionGuard
    // Para o sidebar, vamos permitir se estiver no array ou se o array estiver vazio (comportamento padrão)
    // Na verdade, se o array está vazio aqui, significa que não há restrições OU que todas foram removidas
    // Vamos usar uma lógica mais simples: se não está no array e o array tem valores, bloquear
    if (permissions.length === 0) {
      // Array vazio pode significar "sem restrições" ou "todas removidas"
      // Para o sidebar, vamos mostrar todas as páginas se o array estiver vazio
      // O PagePermissionGuard vai fazer a verificação real
      return true; // Mostrar no sidebar, mas o PagePermissionGuard vai bloquear se necessário
    }
    return permissions.includes(path);
  };

  return { permissions, role, hasPermission, loading };
}

