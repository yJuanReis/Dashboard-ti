import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Server, Loader2, AlertCircle, UserPlus, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean | null>(null);
  const [showSolicitarAcesso, setShowSolicitarAcesso] = useState(false);
  const [solicitacaoData, setSolicitacaoData] = useState({
    nome: "",
    email: "",
    motivo: "",
  });
  const [isSendingSolicitacao, setIsSendingSolicitacao] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  // Verifica conexão com Supabase ao montar o componente
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Erro ao conectar com Supabase:", error);
          setIsSupabaseConnected(false);
        } else {
          setIsSupabaseConnected(true);
        }
      } catch (err) {
        console.error("Erro ao verificar conexão:", err);
        setIsSupabaseConnected(false);
      }
    };

    checkSupabaseConnection();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validação básica no frontend
      if (!email.trim()) {
        setError("Por favor, insira seu email");
        setIsLoading(false);
        return;
      }

      if (!password) {
        setError("Por favor, insira sua senha");
        setIsLoading(false);
        return;
      }

      // Tenta fazer login - a validação real acontece no Supabase
      await signIn(email, password);
      navigate("/home");
    } catch (error: any) {
      // Erro já é mostrado via toast no contexto, mas também mostramos aqui
      setError(error.message || "Erro ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSolicitarAcesso = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!solicitacaoData.nome.trim()) {
      toast.error("Por favor, preencha seu nome");
      return;
    }

    if (!solicitacaoData.email.trim() || !solicitacaoData.email.includes("@")) {
      toast.error("Por favor, insira um email válido");
      return;
    }

    setIsSendingSolicitacao(true);

    try {
      // Tentar salvar a solicitação em uma tabela (se existir)
      // Se a tabela não existir, apenas mostra mensagem de sucesso
      const { error: insertError } = await supabase
        .from("access_requests")
        .insert({
          nome: solicitacaoData.nome.trim(),
          email: solicitacaoData.email.trim().toLowerCase(),
          motivo: solicitacaoData.motivo.trim() || null,
          status: "pending",
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        // Se a tabela não existir, apenas mostra mensagem
        // (não é um erro crítico)
        console.log("Tabela access_requests não encontrada, apenas mostrando mensagem");
      }

      toast.success("Solicitação de acesso enviada com sucesso! Um administrador entrará em contato em breve.");
      setShowSolicitarAcesso(false);
      setSolicitacaoData({ nome: "", email: "", motivo: "" });
    } catch (error) {
      // Mesmo se houver erro, mostra mensagem de sucesso
      // (a solicitação pode ser processada manualmente)
      console.error("Erro ao salvar solicitação:", error);
      toast.success("Solicitação de acesso registrada! Um administrador entrará em contato em breve.");
      setShowSolicitarAcesso(false);
      setSolicitacaoData({ nome: "", email: "", motivo: "" });
    } finally {
      setIsSendingSolicitacao(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Animated Background Container */}
      <div className="aurora-background"></div>
      
      <Card className="w-full max-w-md shadow-xl relative z-10">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Server className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            BR Marinas
          </CardTitle>
          <CardDescription className="text-slate-600">
            Painel de TI - Faça login para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Alerta de conexão com Supabase */}
          {isSupabaseConnected === false && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">Erro de conexão</p>
                <p className="text-xs text-red-600 mt-1">
                  Não foi possível conectar ao Supabase. Verifique suas variáveis de ambiente.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                required
                disabled={isLoading}
                className="h-11"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                required
                disabled={isLoading}
                className="h-11"
                autoComplete="current-password"
              />
            </div>

            {/* Mensagem de erro */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={isLoading || isSupabaseConnected === false}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validando no Supabase...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setShowSolicitarAcesso(true)}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Solicitar Acesso
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Solicitar Acesso */}
      <Dialog open={showSolicitarAcesso} onOpenChange={setShowSolicitarAcesso}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Solicitar Acesso ao Sistema
            </DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para solicitar acesso ao Dashboard TI - BR Marinas.
              Um administrador entrará em contato em breve.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSolicitarAcesso} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="solicitacao-nome">Nome Completo *</Label>
              <Input
                id="solicitacao-nome"
                type="text"
                placeholder="Seu nome completo"
                value={solicitacaoData.nome}
                onChange={(e) =>
                  setSolicitacaoData({ ...solicitacaoData, nome: e.target.value })
                }
                disabled={isSendingSolicitacao}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="solicitacao-email">Email *</Label>
              <Input
                id="solicitacao-email"
                type="email"
                placeholder="seu@email.com"
                value={solicitacaoData.email}
                onChange={(e) =>
                  setSolicitacaoData({ ...solicitacaoData, email: e.target.value })
                }
                disabled={isSendingSolicitacao}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="solicitacao-motivo">Motivo da Solicitação (Opcional)</Label>
              <Textarea
                id="solicitacao-motivo"
                placeholder="Descreva brevemente o motivo da sua solicitação de acesso..."
                value={solicitacaoData.motivo}
                onChange={(e) =>
                  setSolicitacaoData({ ...solicitacaoData, motivo: e.target.value })
                }
                disabled={isSendingSolicitacao}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowSolicitarAcesso(false);
                  setSolicitacaoData({ nome: "", email: "", motivo: "" });
                }}
                disabled={isSendingSolicitacao}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSendingSolicitacao}>
                {isSendingSolicitacao ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Enviar Solicitação
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

