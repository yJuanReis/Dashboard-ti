import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, isUnauthorizedDomain } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Redirecionar para login se domínio não autorizado (com mensagem de erro)
  if (isUnauthorizedDomain) {
    // Limpar localStorage e redirecionar
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase.auth.token');
    }
    return <Navigate to="/login?error=unauthorized_domain" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <div data-protected-route="true">{children}</div>;
}


