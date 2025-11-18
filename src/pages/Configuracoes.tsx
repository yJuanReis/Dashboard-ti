import React, { useState, useCallback, useEffect, useMemo } from "react";
// import { useEffect } from "react"; // EM DESENVOLVIMENTO (para logs)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Settings, User, Moon, Sun, Bell, UserPlus, Trash2, Lock, Mail, Eye, EyeOff, RefreshCw, LogOut } from "lucide-react";
// import { FileText, Search, Filter, ChevronDown, ChevronUp, Copy, Check } from "lucide-react"; // EM DESENVOLVIMENTO
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
// import { fetchLogs, type LogEntry } from "@/lib/logsService"; // EM DESENVOLVIMENTO
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import zxcvbn from "zxcvbn";

// Tipo para usuário
type Usuario = {
  id: string;
  email: string;
  nome?: string;
  role?: string;
  created_at?: string;
};

// Tipos para força da senha
type PasswordStrength = {
  score: number; // 0-4
  label: string;
  color: string;
  bgColor: string;
};

// Função para obter IP do usuário
async function getUserIP(): Promise<string> {
  try {
    const response = await fetch("https://api.ipify.org/?format=json");
    const data = await response.json();
    return data.ip || "unknown";
  } catch (error) {
    console.error("Erro ao obter IP:", error);
    return "unknown";
  }
}

// Função para registrar log de segurança
async function registrarLogSeguranca(
  userId: string,
  action: string,
  ip: string
): Promise<void> {
  try {
    const { error } = await supabase.from("user_security_logs").insert({
      user_id: userId,
      action,
      ip,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Erro ao registrar log de segurança:", error);
      // Não bloqueia o fluxo se o log falhar
    }
  } catch (error) {
    console.error("Erro ao registrar log de segurança:", error);
  }
}

// Função para calcular força da senha
function calcularForcaSenha(senha: string): PasswordStrength {
  if (!senha) {
    return { score: 0, label: "", color: "", bgColor: "" };
  }

  const result = zxcvbn(senha);
  const score = result.score;

  const strengths: PasswordStrength[] = [
    {
      score: 0,
      label: "Muito fraca",
      color: "text-red-600",
      bgColor: "bg-red-500",
    },
    {
      score: 1,
      label: "Fraca",
      color: "text-orange-600",
      bgColor: "bg-orange-500",
    },
    {
      score: 2,
      label: "Média",
      color: "text-yellow-600",
      bgColor: "bg-yellow-500",
    },
    {
      score: 3,
      label: "Forte",
      color: "text-blue-600",
      bgColor: "bg-blue-500",
    },
    {
      score: 4,
      label: "Excelente",
      color: "text-green-600",
      bgColor: "bg-green-500",
    },
  ];

  return strengths[score];
}

export default function Configuracoes() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tema, setTema] = useState("light");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [novoUsuario, setNovoUsuario] = useState({ email: "", nome: "", senha: "" });
  const [statusMessage, setStatusMessage] = useState("");
  const [nomeExibicao, setNomeExibicao] = useState(user?.user_metadata?.nome || user?.user_metadata?.name || "");
  const [loadingNome, setLoadingNome] = useState(false);
  const [tabelaProfilesExiste, setTabelaProfilesExiste] = useState<boolean | null>(null); // null = não verificado ainda
  
  // currentUser atualizado dinamicamente com base no user e nomeExibicao
  const currentUser = useMemo(() => ({
    email: user?.email || "admin@brmarinas.com", 
    role: "admin", 
    nome: nomeExibicao || user?.user_metadata?.nome || user?.user_metadata?.name || "Equipa de TI" 
  }), [user, nomeExibicao]);
  
  // Estados para senhas
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  
  // Estados para mostrar/ocultar senhas
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  
  // Estados de loading
  const [loading, setLoading] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  
  // Estados para prevenção de brute force
  const [tentativasErradas, setTentativasErradas] = useState(0);
  const [bloqueadoAté, setBloqueadoAté] = useState<Date | null>(null);

  // Calcular força da senha
  const forcaSenha = useMemo(() => calcularForcaSenha(novaSenha), [novaSenha]);

  // Verificar se está bloqueado
  const estaBloqueado = useMemo(() => {
    if (!bloqueadoAté) return false;
    return new Date() < bloqueadoAté;
  }, [bloqueadoAté]);

  // Tempo restante de bloqueio
  const tempoRestante = useMemo(() => {
    if (!bloqueadoAté || !estaBloqueado) return 0;
    const diff = bloqueadoAté.getTime() - new Date().getTime();
    return Math.ceil(diff / 1000);
  }, [bloqueadoAté, estaBloqueado]);

  // Atualizar contador de bloqueio
  useEffect(() => {
    if (!estaBloqueado) return;

    const interval = setInterval(() => {
      if (new Date() >= bloqueadoAté!) {
        setBloqueadoAté(null);
        setTentativasErradas(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [estaBloqueado, bloqueadoAté]);

  // Função para resetar tentativas (quando acertar)
  const resetarTentativas = useCallback(() => {
    setTentativasErradas(0);
    setBloqueadoAté(null);
  }, []);

  // Função para incrementar tentativas erradas
  const incrementarTentativaErrada = useCallback(() => {
    const novasTentativas = tentativasErradas + 1;
    setTentativasErradas(novasTentativas);

    if (novasTentativas >= 3) {
      const bloqueio = new Date();
      bloqueio.setSeconds(bloqueio.getSeconds() + 30);
      setBloqueadoAté(bloqueio);
      toast.error(
        `Muitas tentativas incorretas. Aguarde 30 segundos antes de tentar novamente.`
      );
    }
  }, [tentativasErradas]);

  // Handler para alterar senha
  const handleAlterarSenha = useCallback(async () => {
    // Verificar se está bloqueado
    if (estaBloqueado) {
      toast.error(
        `Aguarde ${tempoRestante} segundos antes de tentar novamente.`
      );
      return;
    }

    // Validações básicas
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    if (novaSenha.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (senhaAtual === novaSenha) {
      toast.error("A nova senha deve ser diferente da senha atual");
      return;
    }

    // Validação de força mínima (score >= 2 = média)
    if (forcaSenha.score < 2) {
      toast.error("A senha é muito fraca. Escolha uma senha mais forte.");
      return;
    }

    setLoading(true);

    try {
      // Verificar senha atual com melhor validação
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: senhaAtual,
      });

      if (signInError) {
        incrementarTentativaErrada();
        toast.error("Senha atual incorreta");
        setLoading(false);
        return;
      }

      // Resetar tentativas se acertou
      resetarTentativas();

      // Atualizar senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: novaSenha,
      });

      if (updateError) {
        toast.error("Erro ao alterar senha: " + updateError.message);
        setLoading(false);
        return;
      }

      // Registrar log de segurança
      const ip = await getUserIP();
      await registrarLogSeguranca(
        user?.id || "",
        "password_changed",
        ip
      );

      toast.success("Senha alterada com sucesso!");
      
      // Limpar campos apenas após sucesso
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      toast.error("Erro ao alterar senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [
    senhaAtual,
    novaSenha,
    confirmarSenha,
    forcaSenha,
    user,
    estaBloqueado,
    tempoRestante,
    incrementarTentativaErrada,
    resetarTentativas,
  ]);

  // Handler para enviar email de redefinição
  const handleEnviarEmailRedefinicao = useCallback(async () => {
    if (!user?.email) {
      toast.error("Email não encontrado");
      return;
    }

    setLoadingEmail(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error("Erro ao enviar email: " + error.message);
        setLoadingEmail(false);
        return;
      }

      toast.success("Email de redefinição de senha enviado com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      toast.error("Erro ao enviar email. Tente novamente.");
    } finally {
      setLoadingEmail(false);
    }
  }, [user]);

  // Função para carregar usuários do Supabase
  const carregarUsuarios = useCallback(async () => {
    // Se já sabemos que a tabela não existe, pular completamente
    if (tabelaProfilesExiste === false) {
      // Usar apenas o usuário atual como fallback
      if (user && usuarios.length === 0) {
        setUsuarios([{
          id: user.id,
          email: user.email || "",
          nome: user.user_metadata?.nome || user.user_metadata?.name || "",
          role: user.user_metadata?.role || "user",
          created_at: user.created_at,
        }]);
      }
      return;
    }

    setLoadingUsuarios(true);
    try {
      // Tentar buscar de uma tabela de perfis apenas se ainda não verificamos
      const { data: profiles, error: profilesError } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1); // Limitar para verificar se a tabela existe

      // Verificar se o erro é 404 (tabela não existe)
      if (profilesError) {
        // Verificar diferentes formas de identificar erro 404/tabela não existe
        const errorDetails = profilesError as any;
        // Verificar também na resposta HTTP se disponível
        const httpStatus = (errorDetails?.response?.status) || 
                      (errorDetails?.status) || 
                      (errorDetails?.statusCode) ||
                      (profilesError as any)?.status;
        
        const isTableNotFound = 
          profilesError.code === '42P01' || // PostgreSQL: relation does not exist
          profilesError.code === 'PGRST116' || // PostgREST: relation not found
          profilesError.code === 'PGRST205' || // PostgREST: table not found in schema cache
          profilesError.code === '42704' || // PostgreSQL: undefined object
          httpStatus === 404 || // HTTP 404
          errorDetails?.status === 404 || // HTTP 404 (alternativo)
          errorDetails?.statusCode === 404 || // HTTP 404 (alternativo)
          profilesError.message?.toLowerCase().includes('does not exist') ||
          profilesError.message?.toLowerCase().includes('could not find the table') ||
          profilesError.message?.toLowerCase().includes('relation') ||
          profilesError.message?.toLowerCase().includes('not found') ||
          profilesError.message?.toLowerCase().includes('doesn\'t exist') ||
          profilesError.message?.toLowerCase().includes('schema cache') ||
          profilesError.message?.toLowerCase().includes('404');

        if (isTableNotFound) {
          // Marcar que a tabela não existe para evitar futuras tentativas
          // Usar função de atualização de estado para garantir que seja aplicado imediatamente
          setTabelaProfilesExiste(false);
          
          // Buscar apenas o usuário atual como fallback
          if (user) {
            setUsuarios([{
              id: user.id,
              email: user.email || "",
              nome: user.user_metadata?.nome || user.user_metadata?.name || "",
              role: user.user_metadata?.role || "user",
              created_at: user.created_at,
            }]);
          }
          setLoadingUsuarios(false);
          return;
        } else {
          // Outro tipo de erro - apenas logar, não mostrar toast
          console.error("Erro ao carregar usuários:", profilesError);
          // Não fazer throw, apenas usar fallback
          if (user) {
            setUsuarios([{
              id: user.id,
              email: user.email || "",
              nome: user.user_metadata?.nome || user.user_metadata?.name || "",
              role: user.user_metadata?.role || "user",
              created_at: user.created_at,
            }]);
          }
          setLoadingUsuarios(false);
          return;
        }
      }

      // Se chegou aqui, a tabela existe
      setTabelaProfilesExiste(true);
      
      // Buscar todos os perfis agora
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (!allProfilesError && allProfiles) {
        // Se a tabela existir, usar os dados dela
        setUsuarios(allProfiles.map((p: any) => ({
          id: p.user_id || p.id,
          email: p.email,
          nome: p.nome || p.name,
          role: p.role || "user",
          created_at: p.created_at,
        })));
      } else {
        // Se não houver dados, mostrar apenas o usuário atual
        if (user) {
          setUsuarios([{
            id: user.id,
            email: user.email || "",
            nome: user.user_metadata?.nome || user.user_metadata?.name || "",
            role: user.user_metadata?.role || "user",
            created_at: user.created_at,
          }]);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      // Não mostrar toast para erros 404 (tabela não existe)
          const errorObj = error as any;
          const isTableNotFound = 
            errorObj?.code === '42P01' ||
            errorObj?.code === 'PGRST116' ||
            errorObj?.code === 'PGRST205' ||
            errorObj?.code === '42704' ||
            errorObj?.status === 404 ||
            errorObj?.statusCode === 404 ||
            errorObj?.message?.toLowerCase().includes('does not exist') ||
            errorObj?.message?.toLowerCase().includes('could not find the table') ||
            errorObj?.message?.toLowerCase().includes('relation') ||
            errorObj?.message?.toLowerCase().includes('not found') ||
            errorObj?.message?.toLowerCase().includes('doesn\'t exist') ||
            errorObj?.message?.toLowerCase().includes('schema cache');
      
      if (!isTableNotFound) {
        toast.error("Erro ao carregar usuários. Verifique se a tabela user_profiles existe.");
      }
      
      // Fallback: mostrar apenas o usuário atual
      if (user) {
        setUsuarios([{
          id: user.id,
          email: user.email || "",
          nome: user.user_metadata?.nome || user.user_metadata?.name || "",
          role: user.user_metadata?.role || "user",
          created_at: user.created_at,
        }]);
      }
    } finally {
      setLoadingUsuarios(false);
    }
  }, [user, tabelaProfilesExiste]);

  // Carregar usuários ao montar o componente
  useEffect(() => {
    // Só carregar se for admin e ainda não verificamos a tabela
    if (currentUser.role === 'admin' && tabelaProfilesExiste !== false) {
      carregarUsuarios();
    }
  }, [currentUser.role]); // Remover carregarUsuarios das dependências para evitar loops

  // Função para limpar cache
  const handleLimparCache = useCallback(() => {
    try {
      // Limpar localStorage (exceto autenticação)
      const keysToKeep = ["supabase.auth.token"]; // Manter token de autenticação
      const allKeys = Object.keys(localStorage);
      allKeys.forEach((key) => {
        if (!keysToKeep.some((keepKey) => key.includes(keepKey))) {
          localStorage.removeItem(key);
        }
      });

      // Limpar sessionStorage
      sessionStorage.clear();

      // Limpar cache do navegador (se possível)
      if ("caches" in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            caches.delete(name);
          });
        });
      }

      toast.success("Cache limpo com sucesso!");
    } catch (error) {
      console.error("Erro ao limpar cache:", error);
      toast.error("Erro ao limpar cache. Tente novamente.");
    }
  }, []);

  // Função para terminar sessão
  const handleTerminarSessao = useCallback(async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Erro ao terminar sessão:", error);
    }
  }, [signOut, navigate]);

  // Função para salvar nome de exibição
  const handleSalvarNome = useCallback(async () => {
    if (!nomeExibicao.trim()) {
      toast.error("O nome não pode estar vazio");
      return;
    }

    if (!user) {
      toast.error("Usuário não encontrado");
      return;
    }

    setLoadingNome(true);
    try {
      // Atualizar user_metadata no Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          nome: nomeExibicao.trim(),
          name: nomeExibicao.trim(), // Também salvar como 'name' para compatibilidade
        },
      });

      if (updateError) {
        toast.error("Erro ao salvar nome: " + updateError.message);
        setLoadingNome(false);
        return;
      }

      // Atualizar também na tabela user_profiles se existir
      if (tabelaProfilesExiste !== false) {
        try {
          const { error: updateError } = await supabase
            .from("user_profiles")
            .update({ nome: nomeExibicao.trim() })
            .eq("user_id", user.id);

          if (updateError) {
            const errorDetails = updateError as any;
            const isTableNotFound = 
              updateError.code === '42P01' ||
              updateError.code === 'PGRST116' ||
              updateError.code === 'PGRST205' ||
              updateError.code === '42704' ||
              errorDetails?.status === 404 ||
              errorDetails?.statusCode === 404 ||
              updateError.message?.toLowerCase().includes('does not exist') ||
              updateError.message?.toLowerCase().includes('could not find the table') ||
              updateError.message?.toLowerCase().includes('relation') ||
              updateError.message?.toLowerCase().includes('not found') ||
              updateError.message?.toLowerCase().includes('doesn\'t exist') ||
              updateError.message?.toLowerCase().includes('schema cache');
            
            if (isTableNotFound) {
              setTabelaProfilesExiste(false);
            }
          }
        } catch (profileErr) {
          const errorObj = profileErr as any;
          const isTableNotFound = 
            errorObj?.code === '42P01' ||
            errorObj?.code === 'PGRST116' ||
            errorObj?.code === 'PGRST205' ||
            errorObj?.code === '42704' ||
            errorObj?.status === 404 ||
            errorObj?.statusCode === 404 ||
            errorObj?.message?.toLowerCase().includes('does not exist') ||
            errorObj?.message?.toLowerCase().includes('could not find the table') ||
            errorObj?.message?.toLowerCase().includes('relation') ||
            errorObj?.message?.toLowerCase().includes('not found') ||
            errorObj?.message?.toLowerCase().includes('doesn\'t exist') ||
            errorObj?.message?.toLowerCase().includes('schema cache');
          
          if (isTableNotFound) {
            setTabelaProfilesExiste(false);
          }
        }
      }

      toast.success("Nome atualizado com sucesso!");
      
      // Atualizar a sessão para refletir as mudanças
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // O user será atualizado automaticamente pelo AuthContext
      }
      
      // Registrar log de segurança
      const ip = await getUserIP();
      await registrarLogSeguranca(
        user.id,
        "profile_updated",
        ip
      );
    } catch (error: any) {
      console.error("Erro ao salvar nome:", error);
      toast.error("Erro ao salvar nome. Tente novamente.");
    } finally {
      setLoadingNome(false);
    }
  }, [nomeExibicao, user]);

  // Atualizar nomeExibicao quando o user mudar
  useEffect(() => {
    if (user?.user_metadata?.nome || user?.user_metadata?.name) {
      setNomeExibicao(user.user_metadata.nome || user.user_metadata.name || "");
    }
  }, [user]);

  // Garantir que os campos de novo usuário estejam sempre vazios ao montar
  useEffect(() => {
    // Resetar campos de novo usuário quando o componente montar
    setNovoUsuario({ email: "", nome: "", senha: "" });
  }, []);

  // Estados para o visualizador de logs - EM DESENVOLVIMENTO
  // const [logs, setLogs] = useState<LogEntry[]>([]);
  // const [loadingLogs, setLoadingLogs] = useState(false);
  // const [filtroModulo, setFiltroModulo] = useState<string>("");
  // const [filtroNivel, setFiltroNivel] = useState<LogEntry['nivel'] | "">("");
  // const [buscaLogs, setBuscaLogs] = useState("");
  // const [mostrarLogs, setMostrarLogs] = useState(false);
  // const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  const handleAddUser = useCallback(async () => {
    if (!novoUsuario.email || !novoUsuario.nome || !novoUsuario.senha) {
      setStatusMessage("Preencha todos os campos");
      toast.error("Preencha todos os campos");
      return;
    }

    if (novoUsuario.senha.length < 6) {
      setStatusMessage("A senha deve ter pelo menos 6 caracteres");
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: novoUsuario.email,
        password: novoUsuario.senha,
        options: {
          data: {
            nome: novoUsuario.nome,
            role: "user",
          },
        },
      });

      if (authError) {
        setStatusMessage("Erro ao criar usuário: " + authError.message);
        toast.error("Erro ao criar usuário: " + authError.message);
        return;
      }

      if (!authData.user) {
        setStatusMessage("Erro ao criar usuário");
        toast.error("Erro ao criar usuário");
        return;
      }

      // Tentar criar perfil na tabela user_profiles (se existir)
      if (tabelaProfilesExiste !== false) {
        try {
          const { error: profileError } = await supabase
            .from("user_profiles")
            .insert({
              user_id: authData.user.id,
              email: novoUsuario.email,
              nome: novoUsuario.nome,
              role: "user",
            });

          if (profileError) {
            const errorDetails = profileError as any;
            const isTableNotFound = 
              profileError.code === '42P01' ||
              profileError.code === 'PGRST116' ||
              profileError.code === 'PGRST205' ||
              profileError.code === '42704' ||
              errorDetails?.status === 404 ||
              errorDetails?.statusCode === 404 ||
              profileError.message?.toLowerCase().includes('does not exist') ||
              profileError.message?.toLowerCase().includes('could not find the table') ||
              profileError.message?.toLowerCase().includes('relation') ||
              profileError.message?.toLowerCase().includes('not found') ||
              profileError.message?.toLowerCase().includes('doesn\'t exist') ||
              profileError.message?.toLowerCase().includes('schema cache');
            
            if (isTableNotFound) {
              setTabelaProfilesExiste(false);
              // Não mostrar erro, apenas marcar que a tabela não existe
            } else {
              console.warn("Erro ao criar perfil:", profileError);
            }
          } else {
            setTabelaProfilesExiste(true);
          }
        } catch (profileErr) {
          // Silenciar erro se a tabela não existir
          const errorObj = profileErr as any;
          const isTableNotFound = errorObj?.code === '42P01' || 
                                  errorObj?.code === 'PGRST116' ||
                                  errorObj?.message?.includes('does not exist') ||
                                  errorObj?.status === 404;
          
          if (isTableNotFound) {
            setTabelaProfilesExiste(false);
          }
        }
      }

      // Adicionar à lista local
      const newUser: Usuario = {
        id: authData.user.id,
        email: novoUsuario.email,
        nome: novoUsuario.nome,
        role: "user",
        created_at: authData.user.created_at,
      };

      setUsuarios([...usuarios, newUser]);
      // Limpar campos após sucesso
      setNovoUsuario({ email: "", nome: "", senha: "" });
      setStatusMessage("Utilizador adicionado com sucesso!");
      toast.success("Utilizador adicionado com sucesso!");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error: any) {
      console.error("Erro ao adicionar usuário:", error);
      setStatusMessage("Erro ao adicionar usuário: " + (error.message || "Erro desconhecido"));
      toast.error("Erro ao adicionar usuário: " + (error.message || "Erro desconhecido"));
    }
  }, [novoUsuario, usuarios]);

  const handleDeleteUser = useCallback(async (userId: string, userEmail: string) => {
    if (!window.confirm("Tem certeza que deseja remover este utilizador? Esta ação não pode ser desfeita.")) {
      return;
    }

    // Não permitir deletar o próprio usuário
    if (userId === user?.id) {
      toast.error("Você não pode remover seu próprio usuário");
      return;
    }

    try {
      // Nota: Para deletar usuários do Supabase Auth, normalmente precisamos de uma Edge Function
      // ou usar a API Admin. Por enquanto, vamos apenas remover da tabela de perfis
      // e marcar como inativo. Para deletar completamente, você precisará criar uma Edge Function.
      
      // Tentar remover da tabela de perfis (se existir)
      if (tabelaProfilesExiste !== false) {
        try {
          const { error: deleteError } = await supabase
            .from("user_profiles")
            .delete()
            .eq("user_id", userId);

          if (deleteError) {
            const errorDetails = deleteError as any;
            const isTableNotFound = 
              deleteError.code === '42P01' ||
              deleteError.code === 'PGRST116' ||
              deleteError.code === 'PGRST205' ||
              deleteError.code === '42704' ||
              errorDetails?.status === 404 ||
              errorDetails?.statusCode === 404 ||
              deleteError.message?.toLowerCase().includes('does not exist') ||
              deleteError.message?.toLowerCase().includes('could not find the table') ||
              deleteError.message?.toLowerCase().includes('relation') ||
              deleteError.message?.toLowerCase().includes('not found') ||
              deleteError.message?.toLowerCase().includes('doesn\'t exist') ||
              deleteError.message?.toLowerCase().includes('schema cache');
            
            if (isTableNotFound) {
              setTabelaProfilesExiste(false);
            } else {
              console.warn("Erro ao remover perfil:", deleteError);
            }
          }
        } catch (profileErr) {
          const errorObj = profileErr as any;
          const isTableNotFound = 
            errorObj?.code === '42P01' ||
            errorObj?.code === 'PGRST116' ||
            errorObj?.code === 'PGRST205' ||
            errorObj?.code === '42704' ||
            errorObj?.status === 404 ||
            errorObj?.statusCode === 404 ||
            errorObj?.message?.toLowerCase().includes('does not exist') ||
            errorObj?.message?.toLowerCase().includes('could not find the table') ||
            errorObj?.message?.toLowerCase().includes('relation') ||
            errorObj?.message?.toLowerCase().includes('not found') ||
            errorObj?.message?.toLowerCase().includes('doesn\'t exist') ||
            errorObj?.message?.toLowerCase().includes('schema cache');
          
          if (isTableNotFound) {
            setTabelaProfilesExiste(false);
          }
        }
      }

      // Remover da lista local
      setUsuarios(usuarios.filter(u => u.id !== userId));
      setStatusMessage("Utilizador removido");
      toast.success("Utilizador removido com sucesso!");
      setTimeout(() => setStatusMessage(""), 3000);

      // Nota: O usuário ainda existirá no Supabase Auth
      // Para deletar completamente, você precisa criar uma Edge Function que use a API Admin
      toast.info("Nota: Para deletar completamente do Auth, é necessário usar uma Edge Function com API Admin.");
    } catch (error: any) {
      console.error("Erro ao remover usuário:", error);
      toast.error("Erro ao remover usuário: " + (error.message || "Erro desconhecido"));
    }
  }, [usuarios, user]);

  // Funções para o visualizador de logs - EM DESENVOLVIMENTO
  /*
  const carregarLogs = async () => {
    try {
      setLoadingLogs(true);
      const logsData = await fetchLogs({
        modulo: filtroModulo || undefined,
        nivel: filtroNivel || undefined,
        limite: 100,
        ordenarPor: 'timestamp',
        ordem: 'desc',
      });
      setLogs(logsData);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      toast.error('Erro ao carregar logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (mostrarLogs) {
      carregarLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarLogs, filtroModulo, filtroNivel]);

  const handleCopyLog = (log: LogEntry) => {
    const logText = JSON.stringify({
      nivel: log.nivel,
      modulo: log.modulo,
      mensagem: log.mensagem,
      dados: log.dados,
      timestamp: log.timestamp,
    }, null, 2);
    
    navigator.clipboard.writeText(logText);
    toast.success('Log copiado!');
    setCopiedLogId(log.id || null);
    setTimeout(() => setCopiedLogId(null), 2000);
  };

  const logsFiltrados = logs.filter(log => {
    if (!buscaLogs) return true;
    const busca = buscaLogs.toLowerCase();
    return (
      log.mensagem.toLowerCase().includes(busca) ||
      log.modulo.toLowerCase().includes(busca) ||
      JSON.stringify(log.dados || {}).toLowerCase().includes(busca)
    );
  });

  const getNivelBadgeColor = (nivel: LogEntry['nivel']) => {
    switch (nivel) {
      case 'error':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'success':
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300';
      case 'info':
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  const formatarData = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };
  */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-50 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("Home")}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>
            <p className="text-slate-600">Gerencie preferências e configurações do sistema</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Perfil do Utilizador
                  </CardTitle>
                  <Badge className="bg-success/10 text-success border-success/30">Ativo</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {currentUser.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-900">{currentUser.nome}</h3>
                    <p className="text-sm text-slate-600">{currentUser.email}</p>
                    <Badge variant="outline" className="mt-2">
                      {currentUser.role === 'admin' ? 'Administrador' : 'Utilizador'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <Label htmlFor="displayName" className="text-sm font-medium text-slate-700 mb-2">Nome de exibição</Label>
                    <div className="flex gap-2">
                      <Input
                        id="displayName"
                        type="text"
                        placeholder="Seu nome completo"
                        value={nomeExibicao}
                        onChange={(e) => setNomeExibicao(e.target.value)}
                        disabled={loadingNome}
                        autoComplete="off"
                      />
                      <Button 
                        onClick={handleSalvarNome}
                        disabled={loadingNome || !nomeExibicao.trim()}
                      >
                        {loadingNome ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Este nome será usado em todo o sistema
                    </p>
                  </div>
                  
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      onClick={handleTerminarSessao}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Terminar Sessão
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Management Card (Only for Admin) */}
            {currentUser.role === 'admin' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Gestão de Utilizadores
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-4">Adicionar Novo Utilizador</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        type="email"
                        placeholder="E-mail do novo utilizador"
                        value={novoUsuario.email}
                        onChange={(e) => setNovoUsuario({...novoUsuario, email: e.target.value})}
                        autoComplete="off"
                      />
                      <Input
                        type="text"
                        placeholder="Nome completo"
                        value={novoUsuario.nome}
                        onChange={(e) => setNovoUsuario({...novoUsuario, nome: e.target.value})}
                        autoComplete="off"
                      />
                      <Input
                        type="password"
                        placeholder="Senha temporária"
                        value={novoUsuario.senha}
                        onChange={(e) => setNovoUsuario({...novoUsuario, senha: e.target.value})}
                        autoComplete="new-password"
                      />
                      <Button 
                        onClick={handleAddUser}
                        className=""
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>
                    {statusMessage && (
                      <p className="text-sm text-green-600 mt-2">{statusMessage}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-900">Utilizadores Registados</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={carregarUsuarios}
                        disabled={loadingUsuarios}
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loadingUsuarios ? 'animate-spin' : ''}`} />
                        Atualizar
                      </Button>
                    </div>
                    {loadingUsuarios ? (
                      <div className="text-center py-8 text-slate-600">
                        Carregando usuários...
                      </div>
                    ) : usuarios.length === 0 ? (
                      <div className="text-center py-8 text-slate-600">
                        Nenhum usuário encontrado.
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <ScrollArea className="h-[400px] md:h-[500px] lg:h-[600px] w-full">
                          <Table>
                            <TableHeader className="sticky top-0 bg-background z-10 border-b">
                              <TableRow>
                                <TableHead className="bg-background">Nome</TableHead>
                                <TableHead className="bg-background">Email</TableHead>
                                <TableHead className="bg-background">Role</TableHead>
                                <TableHead className="text-right bg-background">Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {usuarios.map((usuario) => (
                                <TableRow key={usuario.id}>
                                  <TableCell className="font-medium">
                                    {usuario.nome || usuario.email.split('@')[0] || 'Sem nome'}
                                  </TableCell>
                                  <TableCell>{usuario.email}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {usuario.role === 'admin' ? 'Admin' : 'User'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {usuario.id !== user?.id && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleDeleteUser(usuario.id, usuario.email)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Appearance Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Aparência
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-3">Tema</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setTema('light')}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                        tema === 'light' 
                          ? 'border-primary bg-primary/10' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Sun className={`w-5 h-5 ${tema === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="text-left">
                        <div className={`font-semibold ${tema === 'light' ? 'text-primary' : 'text-foreground'}`}>Claro</div>
                        <div className={`text-xs ${tema === 'light' ? 'text-primary/80' : 'text-muted-foreground'}`}>Tema padrão</div>
                      </div>
                    </button>
                    <button 
                      onClick={() => setTema('dark')}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                        tema === 'dark' 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Moon className={`w-5 h-5 ${tema === 'dark' ? 'text-indigo-600' : 'text-slate-600'}`} />
                      <div className="text-left">
                        <div className={`font-semibold ${tema === 'dark' ? 'text-indigo-900' : 'text-slate-900'}`}>Escuro</div>
                        <div className={`text-xs ${tema === 'dark' ? 'text-indigo-700' : 'text-slate-600'}`}>Em breve</div>
                      </div>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Password Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Alterar Senha
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {/* Campo Senha Atual */}
                  <div>
                    <Label htmlFor="senhaAtual" className="text-sm font-medium mb-2">
                      Senha Atual
                    </Label>
                    <div className="relative">
                      <Input
                        id="senhaAtual"
                        type={showSenhaAtual ? "text" : "password"}
                        placeholder="Digite sua senha atual"
                        value={senhaAtual}
                        onChange={(e) => setSenhaAtual(e.target.value)}
                        disabled={loading || estaBloqueado}
                        className="pr-10"
                        autoComplete="current-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowSenhaAtual(!showSenhaAtual)}
                        disabled={loading || estaBloqueado}
                      >
                        {showSenhaAtual ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Campo Nova Senha */}
                  <div>
                    <Label htmlFor="novaSenha" className="text-sm font-medium mb-2">
                      Nova Senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="novaSenha"
                        type={showNovaSenha ? "text" : "password"}
                        placeholder="Digite sua nova senha"
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        disabled={loading || estaBloqueado}
                        className="pr-10"
                        autoComplete="new-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowNovaSenha(!showNovaSenha)}
                        disabled={loading || estaBloqueado}
                      >
                        {showNovaSenha ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Medidor de força da senha */}
                    {novaSenha && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className={forcaSenha.color || "text-muted-foreground"}>
                            {forcaSenha.label || "Digite uma senha"}
                          </span>
                          {forcaSenha.score > 0 && (
                            <span className={forcaSenha.color}>
                              {forcaSenha.score}/4
                            </span>
                          )}
                        </div>
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              forcaSenha.bgColor || "bg-gray-300"
                            }`}
                            style={{
                              width: `${((forcaSenha.score + 1) / 5) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Campo Confirmar Senha */}
                  <div>
                    <Label htmlFor="confirmarSenha" className="text-sm font-medium mb-2">
                      Confirmar Nova Senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmarSenha"
                        type={showConfirmarSenha ? "text" : "password"}
                        placeholder="Confirme sua nova senha"
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
                        disabled={loading || estaBloqueado}
                        className="pr-10"
                        autoComplete="new-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                        disabled={loading || estaBloqueado}
                      >
                        {showConfirmarSenha ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Feedback visual de confirmação */}
                    {confirmarSenha && novaSenha && (
                      <p
                        className={`text-xs mt-1 ${
                          confirmarSenha === novaSenha
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {confirmarSenha === novaSenha
                          ? "✓ Senhas coincidem"
                          : "✗ Senhas não coincidem"}
                      </p>
                    )}
                  </div>

                  {/* Mensagem de bloqueio */}
                  {estaBloqueado && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-700">
                        ⚠️ Muitas tentativas incorretas. Aguarde{" "}
                        <span className="font-semibold">{tempoRestante}</span>{" "}
                        segundos antes de tentar novamente.
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleAlterarSenha}
                    disabled={loading || estaBloqueado || forcaSenha.score < 2}
                    className="w-full"
                  >
                    {loading ? "Alterando..." : "Alterar Senha"}
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Ou redefinir por email</Label>
                    <p className="text-sm text-slate-600">
                      Enviaremos um link de redefinição de senha para o email cadastrado:{" "}
                      <span className="font-semibold">{user?.email}</span>
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleEnviarEmailRedefinicao}
                      disabled={loadingEmail}
                      className="w-full"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      {loadingEmail ? "Enviando..." : "Enviar E-mail de Redefinição"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notificações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                  <div>
                    <h4 className="font-semibold text-slate-900">Notificações por E-mail</h4>
                    <p className="text-sm text-slate-600">Receba atualizações importantes por e-mail</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
                  <div>
                    <h4 className="font-semibold text-slate-900">Alertas do Sistema</h4>
                    <p className="text-sm text-slate-600">Notificações sobre atualizações e manutenções</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Logs Viewer Card - EM DESENVOLVIMENTO */}
            {/* 
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Visualizador de Logs
                    <Badge variant="outline" className="ml-2 text-xs">Em Desenvolvimento</Badge>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMostrarLogs(!mostrarLogs)}
                  >
                    {mostrarLogs ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-2" />
                        Ocultar
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Mostrar
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              {mostrarLogs && (
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Funcionalidade em desenvolvimento. Em breve estará disponível.
                  </p>
                </CardContent>
              )}
            </Card>
            */}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* System Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Informações do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Versão:</span>
                  <span className="font-semibold">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Último acesso:</span>
                  <span className="font-semibold">Hoje</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Ambiente:</span>
                  <Badge className="bg-orange-200 text-black-700 text-xs">Homologação</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-sm"
                  onClick={handleLimparCache}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Limpar Cache
                </Button>
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6">
                <h4 className="font-semibold text-primary mb-2">Precisa de ajuda?</h4>
                <p className="text-sm text-primary/80 mb-4">
                  Entre em contato com o suporte técnico para assistência
                </p>
                <Button variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/10">
                  Contactar Suporte
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}