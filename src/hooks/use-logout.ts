import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook centralizado para logout.
 *
 * Responsável por:
 * - Chamar signOut do AuthContext
 * - Redirecionar para /login
 */
export function useLogout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const logout = useCallback(async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      // signOut já faz o log/toast de erro
      console.error("Erro ao fazer logout via useLogout:", error);
    }
  }, [signOut, navigate]);

  return logout;
}


