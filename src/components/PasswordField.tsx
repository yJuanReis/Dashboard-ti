/**
 * Componente Seguro de Visualização de Senhas
 * 
 * Características de segurança:
 * - Senha oculta por padrão
 * - Auto-oculta após 30 segundos
 * - Botão de copiar que não exibe a senha
 * - Registro de auditoria quando visualizada
 */

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { logAction, AuditAction } from "@/lib/auditService";
import { cn } from "@/lib/utils";

interface PasswordFieldProps {
  value: string;
  onCopy?: () => void;
  auditLog?: boolean;
  passwordId?: string;
  passwordService?: string;
  className?: string;
  label?: string;
  showLabel?: boolean;
}

export function PasswordField({
  value,
  onCopy,
  auditLog = false,
  passwordId,
  passwordService,
  className = "",
  label = "Senha",
  showLabel = true,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showTimer, setShowTimer] = useState<NodeJS.Timeout | null>(null);
  const [copied, setCopied] = useState(false);

  // Auto-ocultar após 30 segundos quando a senha for exibida
  useEffect(() => {
    if (isVisible) {
      // Limpa timer anterior se existir
      if (showTimer) {
        clearTimeout(showTimer);
      }

      const timer = setTimeout(() => {
        setIsVisible(false);
        setShowTimer(null);
      }, 30000); // 30 segundos

      setShowTimer(timer);

      // Registra visualização em auditoria
      if (auditLog && passwordId) {
        logPasswordView().catch((err) => {
          console.warn("Erro ao registrar auditoria de visualização:", err);
        });
      }

      return () => {
        clearTimeout(timer);
      };
    } else {
      // Limpa timer quando a senha é ocultada manualmente
      if (showTimer) {
        clearTimeout(showTimer);
        setShowTimer(null);
      }
    }
  }, [isVisible, auditLog, passwordId]);

  // Função para registrar visualização em auditoria
  const logPasswordView = async () => {
    if (!passwordId) return;

    try {
      await logAction(
        AuditAction.PASSWORD_VIEWED,
        passwordId,
        `Visualizou senha de ${passwordService || "registro desconhecido"}`,
        {
          service: passwordService,
          action: "password_viewed",
        }
      );
    } catch (error) {
      console.warn("Erro ao registrar visualização de senha:", error);
    }
  };

  // Função para copiar senha sem exibi-la
  const handleCopy = async () => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      toast.success("Senha copiada!");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Chama callback opcional
      if (onCopy) {
        onCopy();
      }

      // Registra auditoria se necessário
      if (auditLog && passwordId) {
        await logAction(
          AuditAction.PASSWORD_COPIED,
          passwordId,
          `Copiou senha de ${passwordService || "registro desconhecido"}`,
          {
            service: passwordService,
            action: "password_copied",
          }
        );
      }
    } catch (error) {
      toast.error("Erro ao copiar senha");
      console.error("Erro ao copiar senha:", error);
    }
  };

  // Função para alternar visibilidade
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  if (!value) return null;

  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      {showLabel && (
        <span className="text-base font-medium text-slate-500 dark:text-slate-400">
          {label}:
        </span>
      )}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-md pr-1">
        <span className="text-base font-mono font-medium text-slate-800 dark:text-slate-200 px-2 py-0.5">
          {isVisible ? value : "••••••••"}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700"
          onClick={toggleVisibility}
          title={isVisible ? "Ocultar senha" : "Mostrar senha"}
        >
          {isVisible ? (
            <EyeOff className="w-3.5 h-3.5" />
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700"
          onClick={handleCopy}
          title="Copiar senha"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}

