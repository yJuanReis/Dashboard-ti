import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";
import { clearIPCache } from "@/lib/ipService";

/**
 * Hook centralizado para logout.
 *
 * Responsável por:
 * - Chamar signOut do AuthContext
 * - Limpar cache de IP
 * - Redirecionar para /login
 */
export function useLogout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const logout = useCallback(async () => {
    try {
      await signOut();
      // Limpa o cache de IP ao fazer logout
      clearIPCache();
      navigate("/login");
    } catch (error) {
      // signOut já faz o log/toast de erro
      logger.error("Erro ao fazer logout via useLogout:", error);
    }
  }, [signOut, navigate]);

  return logout;
}


