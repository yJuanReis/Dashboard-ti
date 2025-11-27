import { ReactNode, useEffect, useState, useCallback } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { normalizeRoutePath } from "@/lib/pathUtils";

interface PagePermissionGuardProps {
  children: ReactNode;
}

export function PagePermissionGuard({ children }: PagePermissionGuardProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkPermission = useCallback(async () => {
    if (!user) {
      setHasPermission(false);
      setLoading(false);
      return;
    }

    try {
      const currentPath = location.pathname;
      
      // Verificar role e permissões do usuário
      const { data, error } = await supabase
        .from("user_profiles")
        .select("role, page_permissions")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Erro ao verificar permissões:", error);
        // Se não encontrar perfil, permitir acesso (fail-open para não bloquear usuários legítimos)
        setHasPermission(true);
        setLoading(false);
        return;
      }

      // Administradores têm acesso a todas as páginas
      if (data?.role === "admin") {
        setHasPermission(true);
        setLoading(false);
        return;
      }

      // Obter permissões
      // Lógica simplificada:
      // - NULL/undefined/array vazio = acesso total (comportamento padrão)
      // - Array com valores = só essas páginas são permitidas
      const permissions = data?.page_permissions;
      
      // Se nunca foi definido (null/undefined) OU array vazio, permitir acesso total
      if (permissions === null || permissions === undefined || (Array.isArray(permissions) && permissions.length === 0)) {
        setHasPermission(true);
        setLoading(false);
        return;
      }
      
      // Se há valores no array, verificar se a rota atual está nas permissões
      const normalizedPermissions = Array.isArray(permissions)
        ? permissions.map(normalizeRoutePath)
        : [];
      const hasAccess = normalizedPermissions.includes(normalizeRoutePath(currentPath));
      
      setHasPermission(hasAccess);
    } catch (error) {
      console.error("Erro ao verificar permissões:", error);
      // Em caso de erro, permitir acesso (fail-open para não bloquear usuários legítimos)
      setHasPermission(true);
    } finally {
      setLoading(false);
    }
  }, [user, location.pathname]);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-slate-50 p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="w-5 h-5" />
              Acesso Negado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-700">
              Você não tem permissão para acessar esta página.
            </p>
            <p className="text-sm text-slate-600">
              Entre em contato com um administrador para solicitar acesso.
            </p>
            <div className="pt-4">
              <a
                href="/home"
                className="text-blue-600 hover:text-blue-700 underline text-sm"
              >
                Voltar para o início
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

