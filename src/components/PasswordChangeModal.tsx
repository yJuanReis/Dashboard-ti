import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import zxcvbn from "zxcvbn";
import { useAuth } from "@/contexts/AuthContext";

interface PasswordChangeModalProps {
  open: boolean;
  userEmail: string;
  userId: string;
  onSuccess: () => void;
}

export function PasswordChangeModal({
  open,
  userEmail,
  userId,
  onSuccess,
}: PasswordChangeModalProps) {
  const { checkPasswordTemporary } = useAuth();
  const [nome, setNome] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calcular força da senha
  const forcaSenha = novaSenha ? zxcvbn(novaSenha).score : 0;
  const strengths = [
    { score: 0, label: "Muito fraca", color: "text-red-600", bgColor: "bg-red-500" },
    { score: 1, label: "Fraca", color: "text-orange-600", bgColor: "bg-orange-500" },
    { score: 2, label: "Média", color: "text-yellow-600", bgColor: "bg-yellow-500" },
    { score: 3, label: "Forte", color: "text-blue-600", bgColor: "bg-blue-500" },
    { score: 4, label: "Excelente", color: "text-green-600", bgColor: "bg-green-500" },
  ];
  const strength = strengths[forcaSenha] || strengths[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações
    if (!nome.trim()) {
      setError("Por favor, preencha seu nome");
      return;
    }

    if (!novaSenha) {
      setError("Por favor, insira uma nova senha");
      return;
    }

    if (novaSenha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);

    try {
      // 1. Atualizar senha e nome nos metadados do Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: novaSenha,
        data: {
          nome: nome.trim(),
          name: nome.trim(), // Também salvar como 'name' para compatibilidade
        },
      });

      if (updateError) {
        console.error("Erro ao atualizar senha:", updateError);
        setError("Não foi possível atualizar a senha. Tente novamente.");
        setLoading(false);
        return;
      }

      // 2. Atualizar nome e remover flag de senha temporária no user_profiles
      console.log("PasswordChangeModal: Tentando atualizar perfil - userId:", userId, "nome:", nome.trim());
      const { data: updateData, error: profileError } = await supabase
        .from("user_profiles")
        .update({
          nome: nome.trim(),
          password_temporary: false,
        })
        .eq("user_id", userId)
        .select(); // Adicionar select para verificar se atualizou

      if (profileError) {
        console.error("ERRO CRÍTICO ao atualizar perfil:", {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
        });
        setError("Não foi possível atualizar seu perfil. Tente novamente.");
        setLoading(false);
        return;
      }

      if (!updateData || updateData.length === 0) {
        console.error("ERRO: Nenhum registro foi atualizado no banco de dados");
        setError("Erro: Não foi possível atualizar o perfil. Verifique se você tem permissão.");
        setLoading(false);
        return;
      }

      console.log("PasswordChangeModal: Perfil atualizado com sucesso:", updateData);
      console.log("PasswordChangeModal: Verificando se password_temporary foi atualizado para false...");
      
      // Verificar se realmente foi atualizado
      const { data: verifyData, error: verifyError } = await supabase
        .from("user_profiles")
        .select("password_temporary, nome")
        .eq("user_id", userId)
        .single();

      if (verifyError) {
        console.error("Erro ao verificar atualização:", verifyError);
      } else {
        console.log("PasswordChangeModal: Dados verificados no banco:", verifyData);
        if (verifyData.password_temporary === true) {
          console.error("ERRO: password_temporary ainda está TRUE após atualização!");
          setError("Não foi possível concluir a atualização da senha. Tente novamente.");
          setLoading(false);
          return;
        }
      }

      // 3. Recarregar a sessão para atualizar os metadados do usuário no AuthContext
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Forçar atualização da sessão para que o AuthContext pegue o novo nome
        await supabase.auth.refreshSession();
      }

      // Atualizar o estado no contexto após atualizar o banco
      console.log("PasswordChangeModal: Atualizando estado do contexto após mudança de senha");
      // Aguardar um pouco para garantir que o banco foi atualizado
      await new Promise(resolve => setTimeout(resolve, 500));
      // Verificar novamente para atualizar o estado no contexto
      await checkPasswordTemporary();

      toast.success("Senha alterada e nome atualizado com sucesso!");
      // Aguardar um pouco mais antes de chamar onSuccess para garantir que o estado foi atualizado
      setTimeout(() => {
        onSuccess();
      }, 300);
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      setError("Erro ao alterar senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Limpar campos quando o modal fechar
  useEffect(() => {
    if (!open) {
      setNome("");
      setNovaSenha("");
      setConfirmarSenha("");
      setError(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-[500px]" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        hideCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Alteração de Senha Obrigatória
          </DialogTitle>
          <DialogDescription>
            Você está usando uma senha temporária. Por favor, altere sua senha e informe seu nome para continuar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              type="text"
              placeholder="Seu nome completo"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                setError(null);
              }}
              disabled={loading}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="novaSenha">Nova Senha *</Label>
            <div className="relative">
              <Input
                id="novaSenha"
                type={showNovaSenha ? "text" : "password"}
                placeholder="Digite sua nova senha"
                value={novaSenha}
                onChange={(e) => {
                  setNovaSenha(e.target.value);
                  setError(null);
                }}
                disabled={loading}
                required
                minLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNovaSenha(!showNovaSenha)}
                disabled={loading}
              >
                {showNovaSenha ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {novaSenha && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={strength.color}>{strength.label}</span>
                  <span className="text-muted-foreground">{novaSenha.length} caracteres</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${strength.bgColor}`}
                    style={{ width: `${((forcaSenha + 1) / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmarSenha">Confirmar Nova Senha *</Label>
            <div className="relative">
              <Input
                id="confirmarSenha"
                type={showConfirmarSenha ? "text" : "password"}
                placeholder="Confirme sua nova senha"
                value={confirmarSenha}
                onChange={(e) => {
                  setConfirmarSenha(e.target.value);
                  setError(null);
                }}
                disabled={loading}
                required
                minLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                disabled={loading}
              >
                {showConfirmarSenha ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {confirmarSenha && novaSenha !== confirmarSenha && (
              <p className="text-xs text-red-600">As senhas não coincidem</p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="submit"
              disabled={loading || !nome.trim() || !novaSenha || !confirmarSenha || novaSenha !== confirmarSenha}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar e Continuar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

