import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PasswordChangeModal } from "./PasswordChangeModal";
import { logger } from "@/lib/logger";

interface PasswordTemporaryGuardProps {
  children: React.ReactNode;
}

export function PasswordTemporaryGuard({ children }: PasswordTemporaryGuardProps) {
  const { user, passwordTemporary, checkPasswordTemporary, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const hasCheckedRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Aguardar o loading terminar antes de verificar
    if (!loading && user) {
      // Se o usuário mudou, resetar todas as flags de verificação
      if (currentUserIdRef.current !== user.id) {
        hasCheckedRef.current = false;
        passwordWasTemporaryRef.current = false;
        currentUserIdRef.current = user.id;
      }

      // Verificar apenas uma vez por usuário, ou quando passwordTemporary for null (ainda não verificado)
      if (!hasCheckedRef.current || passwordTemporary === null) {
        logger.log("PasswordTemporaryGuard: Verificando senha temporária para usuário:", user.id);
        checkPasswordTemporary();
        hasCheckedRef.current = true;
      }
    } else if (!user) {
      // Resetar quando não há usuário
      hasCheckedRef.current = false;
      passwordWasTemporaryRef.current = false;
      currentUserIdRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id]); // Verificar apenas quando loading ou user.id mudarem

  const passwordWasTemporaryRef = useRef(false);

  useEffect(() => {
    // Mostrar modal se a senha for temporária
    if (passwordTemporary === true && user && !loading) {
      // Só mostrar se ainda não foi fechado antes (evitar reabrir)
      if (!passwordWasTemporaryRef.current || !showModal) {
        logger.log("PasswordTemporaryGuard: Mostrando modal de troca de senha");
        setShowModal(true);
        passwordWasTemporaryRef.current = true;
      }
    } else if (passwordTemporary === false) {
      // Se a senha não é mais temporária, fechar o modal e marcar como resolvido
      if (showModal) {
        logger.log("PasswordTemporaryGuard: Senha não é mais temporária, fechando modal");
        setShowModal(false);
        passwordWasTemporaryRef.current = false;
      }
    }
    // Se passwordTemporary for null, não fazer nada (ainda está verificando)
  }, [passwordTemporary, user, loading, showModal]);

  const handleSuccess = () => {
    setShowModal(false);
    // Aguardar um pouco para garantir que o banco foi atualizado antes de recarregar
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (!user || loading) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <PasswordChangeModal
        open={showModal}
        userEmail={user.email || ""}
        userId={user.id}
        onSuccess={handleSuccess}
      />
    </>
  );
}

