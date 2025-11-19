import React, { useState, useCallback, useEffect, useMemo } from "react";
// import { useEffect } from "react"; // EM DESENVOLVIMENTO (para logs)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Settings, User, Moon, Sun, Bell, UserPlus, Trash2, Lock, Mail, Eye, EyeOff, RefreshCw, LogOut, X, ShieldAlert, ShieldCheck, AlertCircle, Edit, Check, XCircle, Shield } from "lucide-react";
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
// ScrollArea removido conforme solicitado
// import { fetchLogs, type LogEntry } from "@/lib/logsService"; // EM DESENVOLVIMENTO
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { updateUserPasswordByAdmin, deleteUserByAdmin } from "@/lib/adminService";
import zxcvbn from "zxcvbn";

// Tipo para usuário
type Usuario = {
  id: string; // ID da tabela user_profiles
  user_id: string; // ID do auth.users (UUID)
  email: string;
  nome?: string;
  role?: string;
  created_at?: string;
  page_permissions?: string[]; // Array de rotas permitidas
};

// Páginas disponíveis no sistema (deve corresponder exatamente às rotas do App.tsx)
const PAGINAS_DISPONIVEIS = [
  { path: '/home', nome: 'Início', icon: '🏠' },
  { path: '/senhas', nome: 'Senhas', icon: '🔑' },
  { path: '/crachas', nome: 'Crachás', icon: '🪪' },
  { path: '/assinaturas', nome: 'Assinaturas', icon: '✉️' },
  { path: '/controle-nvr', nome: 'Controle NVR', icon: '📹' },
  { path: '/Controle-hds', nome: 'Controle de HDs', icon: '💾' }, // Nota: case-sensitive
  { path: '/termos', nome: 'Termo de Responsabilidade', icon: '📄' },
  { path: '/gestaorede', nome: 'Gestão de Rede', icon: '🌐' },
  { path: '/servidores', nome: 'Servidores', icon: '🖥️' },
  { path: '/chamados', nome: 'Chamados', icon: '🔧' },
  { path: '/security-test', nome: 'Security Test', icon: '🔒' },
  // Nota: /configuracoes não está aqui pois só admins podem acessar
];

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
  ip: string,
  details?: string
): Promise<void> {
  try {
    const { error } = await supabase.from("user_security_logs").insert({
      user_id: userId,
      action,
      ip,
      details,
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
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [novoUsuario, setNovoUsuario] = useState({ email: "", nome: "", senha: "" });
  const [statusMessage, setStatusMessage] = useState("");
  const [nomeExibicao, setNomeExibicao] = useState(user?.user_metadata?.nome || user?.user_metadata?.name || "");
  const [loadingNome, setLoadingNome] = useState(false);
  const [tabelaProfilesExiste, setTabelaProfilesExiste] = useState<boolean | null>(null); // null = não verificado ainda
  
  // Estado para role real do banco de dados
  const [realRole, setRealRole] = useState<string>("user");
  
  // Estado do Modal de Alteração de Senha de Terceiros (Admin)
  const [modalSenhaOpen, setModalSenhaOpen] = useState(false);
  const [usuarioParaEditar, setUsuarioParaEditar] = useState<Usuario | null>(null);
  const [novaSenhaAdmin, setNovaSenhaAdmin] = useState("");
  
  // Estado do Modal de Edição de Usuário (Admin)
  const [modalEditarUsuarioOpen, setModalEditarUsuarioOpen] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [editarNome, setEditarNome] = useState("");
  const [editarEmail, setEditarEmail] = useState("");
  const [editarRole, setEditarRole] = useState<"admin" | "user">("user");
  const [permissoesPaginas, setPermissoesPaginas] = useState<string[]>([]);
  
  // currentUser atualizado dinamicamente com base no user, nomeExibicao e realRole
  const currentUser = useMemo(() => ({
    email: user?.email || "", 
    role: realRole, // Usa a role real do banco de dados
    nome: nomeExibicao || user?.user_metadata?.nome || user?.user_metadata?.name || "Utilizador" 
  }), [user, nomeExibicao, realRole]);
  
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
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  
  // Estados para prevenção de brute force
  const [tentativasErradas, setTentativasErradas] = useState(0);
  const [bloqueadoAté, setBloqueadoAté] = useState<Date | null>(null);

  // Verifica a role REAL do usuário no banco de dados
  useEffect(() => {
    const checkRealRole = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        if (data && data.role) {
          setRealRole(data.role);
        } else {
          // Se não encontrar no banco, usar role dos metadados como fallback
          setRealRole(user.user_metadata?.role || "user");
        }
      } catch (err) {
        // Se a tabela não existir, usar role dos metadados como fallback
        console.error("Erro ao verificar permissões:", err);
        setRealRole(user.user_metadata?.role || "user");
      }
    };

    checkRealRole();
  }, [user]);

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
      setMensagemSucesso("Senha alterada com sucesso!");
      
      // Limpar campos apenas após sucesso
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      
      // Limpar mensagem após 5 segundos
      setTimeout(() => setMensagemSucesso(""), 5000);
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
          user_id: user.id,
          email: user.email || "",
          nome: user.user_metadata?.nome || user.user_metadata?.name || "",
          role: user.user_metadata?.role || "user",
          created_at: user.created_at,
        }]);
      }
      return;
    }

    // Só carregar se for admin
    if (realRole !== 'admin') return;

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
              user_id: user.id,
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
              user_id: user.id,
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
        const usuariosMapeados = allProfiles.map((p: any) => {
          const usuario = {
            id: p.id || p.user_id,
            user_id: p.user_id || p.id,
            email: p.email,
            nome: p.nome || p.name,
            role: p.role || "user",
            created_at: p.created_at,
            // Preservar o valor exato do banco:
            // - null = nunca foi definido (undefined no objeto)
            // - [] = foi definido como array vazio (manter como array vazio)
            // - [valores] = array com valores (manter como array)
            page_permissions: p.page_permissions === null ? undefined : (Array.isArray(p.page_permissions) ? p.page_permissions : undefined),
          };
          
          // Log para debug
          console.log("Usuário carregado do banco:", {
            email: usuario.email,
            page_permissions_bruto: p.page_permissions,
            page_permissions_processado: usuario.page_permissions,
            tipo_bruto: typeof p.page_permissions,
            tipo_processado: typeof usuario.page_permissions,
            isNull_bruto: p.page_permissions === null,
            isNull_processado: usuario.page_permissions === null || usuario.page_permissions === undefined,
            isArray_bruto: Array.isArray(p.page_permissions),
            isArray_processado: Array.isArray(usuario.page_permissions),
            length: Array.isArray(p.page_permissions) ? p.page_permissions.length : 'N/A'
          });
          
          return usuario;
        });
        
        setUsuarios(usuariosMapeados);
      } else {
        // Se não houver dados, mostrar apenas o usuário atual
        if (user) {
          setUsuarios([{
            id: user.id,
            user_id: user.id,
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
          user_id: user.id,
          email: user.email || "",
          nome: user.user_metadata?.nome || user.user_metadata?.name || "",
          role: user.user_metadata?.role || "user",
          created_at: user.created_at,
        }]);
      }
    } finally {
      setLoadingUsuarios(false);
    }
  }, [user, tabelaProfilesExiste, realRole]);

  // Carregar usuários ao montar o componente
  useEffect(() => {
    // Só carregar se for admin e ainda não verificamos a tabela
    if (realRole === 'admin' && tabelaProfilesExiste !== false) {
      carregarUsuarios();
    }
  }, [realRole]); // Remover carregarUsuarios das dependências para evitar loops

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
      
      // Recarregar a sessão para atualizar o user no AuthContext
      // Isso garante que a sidebar e outros componentes vejam a mudança imediatamente
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Forçar atualização da sessão para que o AuthContext seja notificado
        await supabase.auth.refreshSession();
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
  }, [nomeExibicao, user, tabelaProfilesExiste]);

  // Atualizar nomeExibicao quando o user mudar (sincronização com AuthContext)
  useEffect(() => {
    const novoNome = user?.user_metadata?.nome || user?.user_metadata?.name || "";
    // Atualizar apenas se o nome nos metadados for diferente do estado local
    // Isso evita loops infinitos e permite edição local
    if (novoNome) {
      setNomeExibicao(prev => prev !== novoNome ? novoNome : prev);
    }
  }, [user?.user_metadata?.nome, user?.user_metadata?.name]);

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
              // Não definir page_permissions (NULL) = acesso total por padrão
              // page_permissions: null (não definir = NULL no banco)
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
        user_id: authData.user.id,
        email: novoUsuario.email,
        nome: novoUsuario.nome,
        role: "user",
        created_at: authData.user.created_at,
        page_permissions: [], // Acesso total por padrão
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
  }, [novoUsuario, usuarios, tabelaProfilesExiste]);

  // Função para abrir modal de alteração de senha (Admin)
  const abrirModalSenha = (usuario: Usuario) => {
    setUsuarioParaEditar(usuario);
    setNovaSenhaAdmin("");
    setModalSenhaOpen(true);
  };

  // Função para alterar senha de outro usuário (Admin)
  const handleAdminChangePassword = async () => {
    if (!usuarioParaEditar || !novaSenhaAdmin) return;
    if (novaSenhaAdmin.length < 6) return toast.error("A senha deve ter min. 6 caracteres");

    setLoading(true);
    try {
      // Usa o serviço admin que valida permissões e altera a senha
      await updateUserPasswordByAdmin(usuarioParaEditar.user_id, novaSenhaAdmin);

      toast.success(`Senha de ${usuarioParaEditar.nome || usuarioParaEditar.email} alterada com sucesso.`);
      setModalSenhaOpen(false);
      setNovaSenhaAdmin("");
      
      // Log
      const ip = await getUserIP();
      await registrarLogSeguranca(user!.id, "admin_change_password", ip, `Changed password for ${usuarioParaEditar.email}`);

    } catch (error: any) {
      toast.error("Erro ao alterar senha: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = useCallback(async (usuario: Usuario) => {
    if (!window.confirm("Tem certeza que deseja remover este utilizador? Esta ação não pode ser desfeita.")) {
      return;
    }

    // Não permitir deletar o próprio usuário
    if (usuario.user_id === user?.id) {
      toast.error("Você não pode remover seu próprio usuário");
      return;
    }

    setLoading(true);
    try {
      // Usa o serviço admin que valida permissões e remove o usuário
      await deleteUserByAdmin(usuario.user_id);

      toast.success("Utilizador removido do sistema.");
      
      // Log
      const ip = await getUserIP();
      await registrarLogSeguranca(user!.id, "admin_delete_user", ip, `Deleted user ${usuario.user_id}`);
      
      // Recarregar lista de usuários
      carregarUsuarios();
    } catch (error: any) {
      console.error("Erro ao remover usuário:", error);
      toast.error("Erro ao remover usuário: " + (error.message || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  }, [usuarios, user, carregarUsuarios]);

  // Função para abrir modal de edição de usuário (Admin)
  const abrirModalEditarUsuario = (usuario: Usuario) => {
    console.log("Abrindo modal de edição:", {
      email: usuario.email,
      page_permissions: usuario.page_permissions,
      tipo: typeof usuario.page_permissions,
      isArray: Array.isArray(usuario.page_permissions),
      length: Array.isArray(usuario.page_permissions) ? usuario.page_permissions.length : 'N/A'
    });
    
    setUsuarioEditando(usuario);
    setEditarNome(usuario.nome || "");
    setEditarEmail(usuario.email || "");
    setEditarRole((usuario.role as "admin" | "user") || "user");
    // Se page_permissions for null/undefined, significa que nunca foi definido = array vazio no modal
    // Se tiver valores, usar esses valores
    const permissoesIniciais = usuario.page_permissions ?? [];
    console.log("Permissões iniciais no modal:", permissoesIniciais);
    setPermissoesPaginas(permissoesIniciais);
    setModalEditarUsuarioOpen(true);
  };

  // Função para salvar edições do usuário (Admin)
  const handleSalvarEdicaoUsuario = async () => {
    if (!usuarioEditando) return;
    if (!editarNome.trim() || !editarEmail.trim()) {
      toast.error("Nome e email são obrigatórios");
      return;
    }

    setLoading(true);
    try {
      // Lógica de permissões:
      // - Admin: não precisa de permissões (salvar null)
      // - User sem permissões selecionadas: salvar null (acesso total - comportamento padrão)
      // - User com permissões selecionadas: salvar array com os paths (só essas páginas)
      let permissoesFinais: string[] | null = null;
      if (editarRole === "admin") {
        permissoesFinais = null; // Admin não precisa de permissões
      } else if (permissoesPaginas.length === 0) {
        // Se não selecionou nenhuma página, salvar null = acesso total (comportamento padrão)
        permissoesFinais = null;
      } else {
        // Se selecionou páginas, salvar o array (só essas páginas serão permitidas)
        permissoesFinais = permissoesPaginas;
      }
      
      // Log para debug
      console.log("Salvando permissões:", {
        usuario: usuarioEditando.email,
        role: editarRole,
        permissoesSelecionadas: permissoesPaginas,
        permissoesFinais,
        tipo: typeof permissoesFinais
      });
      
      // Preparar objeto de update (sem page_permissions por enquanto)
      const updateData: any = {
        nome: editarNome.trim(),
        email: editarEmail.trim(),
        role: editarRole,
      };
      
      // Atualizar dados básicos primeiro
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update(updateData)
        .eq("user_id", usuarioEditando.user_id);

      if (updateError) {
        console.error("Erro ao atualizar dados básicos:", updateError);
        throw updateError;
      }
      
      // Atualizar permissões usando RPC (mais confiável para arrays)
      // Se for null, usar array vazio (NULL não funciona bem com arrays no Supabase)
      let permissoesParaSalvar: string[] = [];
      if (permissoesFinais !== null && Array.isArray(permissoesFinais)) {
        permissoesParaSalvar = permissoesFinais;
      }
      
      // Tentar usar RPC primeiro (se a função existir)
      const { error: rpcError } = await supabase.rpc('update_user_page_permissions', {
        target_user_id: usuarioEditando.user_id,
        new_permissions: permissoesParaSalvar
      });
      
      if (rpcError) {
        // Se RPC falhar, tentar update direto
        console.warn("RPC não disponível, usando update direto:", rpcError);
        const { error: directUpdateError } = await supabase
          .from("user_profiles")
          .update({ page_permissions: permissoesParaSalvar })
          .eq("user_id", usuarioEditando.user_id);
        
        if (directUpdateError) {
          console.error("Erro ao atualizar permissões:", directUpdateError);
          // Não bloquear se falhar, apenas avisar
          toast.warning("Permissões podem não ter sido salvas corretamente. Tente novamente.");
        }
      }
      
      // Verificar o que foi realmente salvo no banco
      const { data: usuarioAtualizado, error: verifyError } = await supabase
        .from("user_profiles")
        .select("page_permissions")
        .eq("user_id", usuarioEditando.user_id)
        .single();
      
      if (!verifyError && usuarioAtualizado) {
        console.log("Verificação após salvar - o que está no banco:", {
          email: usuarioEditando.email,
          page_permissions: usuarioAtualizado.page_permissions,
          tipo: typeof usuarioAtualizado.page_permissions,
          isArray: Array.isArray(usuarioAtualizado.page_permissions),
          length: Array.isArray(usuarioAtualizado.page_permissions) ? usuarioAtualizado.page_permissions.length : 'N/A',
          isNull: usuarioAtualizado.page_permissions === null,
          esperado: permissoesParaSalvar,
          esperado_length: permissoesParaSalvar.length
        });
        
        // Verificar se salvou corretamente
        const salvouCorretamente = Array.isArray(usuarioAtualizado.page_permissions) && 
          usuarioAtualizado.page_permissions.length === permissoesParaSalvar.length &&
          permissoesParaSalvar.every(p => usuarioAtualizado.page_permissions.includes(p));
        
        if (!salvouCorretamente && permissoesParaSalvar.length > 0) {
          console.error("⚠️ PERMISSÕES NÃO FORAM SALVAS CORRETAMENTE!");
          toast.error("Erro ao salvar permissões. Verifique o console para mais detalhes.");
        }
      } else if (verifyError) {
        console.error("Erro ao verificar permissões salvas:", verifyError);
      }

      // Atualizar email no auth.users via Admin API (se mudou)
      // NOTA: Funcionalidade temporariamente desabilitada por questões de segurança
      // O email é atualizado no user_profiles, mas pode precisar ser atualizado
      // manualmente no auth.users através do Supabase Dashboard se necessário
      if (editarEmail !== usuarioEditando.email) {
        console.info("Email atualizado no perfil. Para atualizar no auth.users, use o Supabase Dashboard.");
        // Para implementar: criar uma função RPC segura no backend para atualizar email
      }

      toast.success("Utilizador atualizado com sucesso!");
      
      // Log
      const ip = await getUserIP();
      await registrarLogSeguranca(user!.id, "admin_edit_user", ip, `Edited user ${usuarioEditando.user_id}`);
      
      setModalEditarUsuarioOpen(false);
      carregarUsuarios();
    } catch (error: any) {
      console.error("Erro ao atualizar usuário:", error);
      toast.error("Erro ao atualizar usuário: " + (error.message || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  // Função para alternar permissão de página
  const togglePermissaoPagina = (path: string) => {
    if (editarRole === "admin") return; // Admins não precisam de permissões
    setPermissoesPaginas(prev => {
      if (prev.includes(path)) {
        return prev.filter(p => p !== path);
      } else {
        return [...prev, path];
      }
    });
  };

  // Limpar permissões quando mudar para admin
  useEffect(() => {
    if (editarRole === "admin" && permissoesPaginas.length > 0) {
      setPermissoesPaginas([]);
    }
  }, [editarRole, permissoesPaginas.length]);

  return (
    <div className="min-h-screen bg-background p-6">
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
            {/* Card único com Perfil e Alterar Senha */}
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-muted-foreground" />
                    Perfil e Configurações
                  </CardTitle>
                  <Badge className={realRole === 'admin' ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20" : "bg-success/10 text-success border-success/30"}>
                    {realRole === 'admin' ? 'Administrador' : 'Ativo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Seção Perfil */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-background">
                      {currentUser.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-foreground">{currentUser.nome}</h3>
                      <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                      <Badge variant="outline" className="mt-2">
                        {currentUser.role === 'admin' ? 'Administrador' : 'Utilizador'}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Nome de Exibição */}
                  <div className="pt-4 border-t">
                    <div>
                      <Label htmlFor="displayName" className="text-sm font-medium mb-2">Nome de exibição</Label>
                      <div className="flex gap-2">
                        <Input
                          id="displayName"
                          type="text"
                          placeholder="O seu nome completo"
                          value={nomeExibicao}
                          onChange={(e) => setNomeExibicao(e.target.value)}
                          disabled={loadingNome}
                          autoComplete="off"
                        />
                        <Button 
                          onClick={handleSalvarNome}
                          disabled={loadingNome || !nomeExibicao.trim()}
                        >
                          {loadingNome ? "A guardar..." : "Guardar"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Este nome será utilizado em todo o sistema
                      </p>
                    </div>
                  </div>

                  {/* Seção Alterar Senha */}
                  <div className="space-y-6 pt-4 border-t">
                    <div className="flex items-center gap-2 pb-4 border-b">
                      <Lock className="w-5 h-5 text-muted-foreground" />
                      <h4 className="font-semibold text-lg">Alterar Senha</h4>
                    </div>
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
                            placeholder="Digite a sua senha atual"
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
                            placeholder="Digite a sua nova senha"
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
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  forcaSenha.bgColor || "bg-muted"
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
                            placeholder="Confirme a sua nova senha"
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
                        
                        {confirmarSenha && novaSenha && (
                          <p className={`text-xs mt-1 ${confirmarSenha === novaSenha ? "text-success" : "text-destructive"}`}>
                            {confirmarSenha === novaSenha ? "✓ Senhas coincidem" : "✗ Senhas não coincidem"}
                          </p>
                        )}
                      </div>
                      {estaBloqueado && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                          <p className="text-sm text-destructive">
                            Muitas tentativas incorretas. Aguarde <span className="font-semibold">{tempoRestante}</span> segundos.
                          </p>
                        </div>
                      )}
                      {mensagemSucesso && (
                        <div className="p-3 bg-success/10 border border-success/20 rounded-md flex items-start gap-2">
                          <ShieldCheck className="w-4 h-4 text-success mt-0.5" />
                          <p className="text-sm text-success">{mensagemSucesso}</p>
                        </div>
                      )}
                      <Button
                        onClick={handleAlterarSenha}
                        disabled={loading || estaBloqueado || forcaSenha.score < 2 || novaSenha !== confirmarSenha}
                        className="w-full"
                      >
                        {loading ? "A alterar..." : "Alterar Senha"}
                      </Button>
                    </div>
                    <div className="border-t pt-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Ou redefinir por email</Label>
                        <p className="text-sm text-muted-foreground">
                          Enviaremos um link para: <span className="font-semibold">{currentUser?.email}</span>
                        </p>
                        <Button
                          variant="outline"
                          onClick={handleEnviarEmailRedefinicao}
                          disabled={loadingEmail}
                          className="w-full"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          {loadingEmail ? "A enviar..." : "Enviar Email de Redefinição"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terminar Sessão no final do card */}
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                    onClick={handleTerminarSessao}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Terminar Sessão
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* User Management Card (Only for Admin) */}
            {realRole === 'admin' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5" />
                    Painel Administrativo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
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
                      // Modificação solicitada: Substituição do ScrollArea por div nativa e ajuste no header
                      <div className="max-h-[500px] w-full overflow-y-auto border rounded-md">
                        <Table>
                          <TableHeader className="sticky top-0 z-10 bg-background">
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
                                  {usuario.user_id !== user?.id && (
                                    <div className="flex justify-end gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => abrirModalEditarUsuario(usuario)}
                                        title="Editar Usuário"
                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => abrirModalSenha(usuario)}
                                        title="Alterar Senha"
                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      >
                                        <Lock className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleDeleteUser(usuario)}
                                        title="Excluir Usuário"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Test Card */}
            {realRole === 'admin' && (
              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    Testes de Segurança
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Execute testes automatizados de penetração para verificar vulnerabilidades de segurança do sistema.
                  </p>
                  <Button
                    onClick={() => {
                      sessionStorage.setItem('securityTestFromConfig', 'true');
                      navigate('/security-test');
                    }}
                    className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Executar Testes de Segurança
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Password Card */}


            {/* Logs Viewer Card - EM DESENVOLVIMENTO */}
            {/* <Card>
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
                  <span className="font-semibold">1.1.0 (Admin)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Último acesso:</span>
                  <span className="font-semibold">Hoje</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Ambiente:</span>
                  <Badge className="bg-orange-200 text-black-700 text-xs">Produção</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Notifications Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notificações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 text-sm">Notificações por E-mail</h4>
                    <p className="text-xs text-slate-600">Receba atualizações importantes por e-mail</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-2">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 text-sm">Alertas do Sistema</h4>
                    <p className="text-xs text-slate-600">Notificações sobre atualizações e manutenções</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-2">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="pt-2 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-sm"
                    onClick={handleLimparCache}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Limpar Cache
                  </Button>
                </div>
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

      {/* MODAL DE EDIÇÃO DE USUÁRIO (ADMIN) */}
      {modalEditarUsuarioOpen && usuarioEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-background z-10 border-b">
              <CardTitle className="text-lg">Editar Utilizador</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setModalEditarUsuarioOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
                Editando: <strong>{usuarioEditando.nome || usuarioEditando.email}</strong>
              </div>

              {/* Informações Básicas */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editarNome">Nome Completo</Label>
                  <Input
                    id="editarNome"
                    value={editarNome}
                    onChange={(e) => setEditarNome(e.target.value)}
                    placeholder="Nome do usuário"
                  />
                </div>

                <div>
                  <Label htmlFor="editarEmail">Email</Label>
                  <Input
                    id="editarEmail"
                    type="email"
                    value={editarEmail}
                    onChange={(e) => setEditarEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <Label htmlFor="editarRole">Tipo de Utilizador</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="user"
                        checked={editarRole === "user"}
                        onChange={() => setEditarRole("user")}
                        className="w-4 h-4"
                      />
                      <span>Utilizador</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="admin"
                        checked={editarRole === "admin"}
                        onChange={() => setEditarRole("admin")}
                        className="w-4 h-4"
                      />
                      <span>Administrador</span>
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Administradores têm acesso total ao sistema
                  </p>
                </div>
              </div>

              {/* Permissões de Páginas */}
              <div className="border-t pt-4">
                <Label className="text-base font-semibold mb-3 block">
                  Permissões de Acesso às Páginas
                </Label>
                <p className="text-xs text-muted-foreground mb-4">
                  Selecione quais páginas este usuário pode acessar. Administradores têm acesso a todas as páginas automaticamente.
                </p>
                
                {editarRole === "admin" ? (
                  <div className="p-3 bg-purple-50 text-purple-700 rounded-md text-sm">
                    ⚠️ Administradores têm acesso a todas as páginas automaticamente.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-2 border rounded-md">
                    {PAGINAS_DISPONIVEIS.map((pagina) => {
                      const temPermissao = permissoesPaginas.includes(pagina.path);
                      return (
                        <div
                          key={pagina.path}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            temPermissao
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => togglePermissaoPagina(pagina.path)}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            temPermissao ? "border-green-500 bg-green-500" : "border-gray-300"
                          }`}>
                            {temPermissao && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{pagina.icon}</span>
                              <span className={`font-medium ${temPermissao ? "text-green-700" : "text-gray-700"}`}>
                                {pagina.nome}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{pagina.path}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {permissoesPaginas.length} de {PAGINAS_DISPONIVEIS.length} páginas selecionadas
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (permissoesPaginas.length === PAGINAS_DISPONIVEIS.length) {
                        setPermissoesPaginas([]);
                      } else {
                        setPermissoesPaginas(PAGINAS_DISPONIVEIS.map(p => p.path));
                      }
                    }}
                    disabled={editarRole === "admin"}
                  >
                    {permissoesPaginas.length === PAGINAS_DISPONIVEIS.length ? "Desmarcar Todas" : "Marcar Todas"}
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setModalEditarUsuarioOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSalvarEdicaoUsuario} disabled={loading}>
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL DE ALTERAÇÃO DE SENHA (ADMIN) */}
      {modalSenhaOpen && usuarioParaEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md animate-in fade-in zoom-in duration-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Alterar Senha de Utilizador</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setModalSenhaOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
                Alterando senha para: <strong>{usuarioParaEditar.nome || usuarioParaEditar.email}</strong>
              </div>
              <div className="space-y-2">
                <Label>Nova Senha</Label>
                <Input 
                  type="text" // Admin vê a senha que está definindo
                  placeholder="Digite a nova senha"
                  value={novaSenhaAdmin}
                  onChange={e => setNovaSenhaAdmin(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Digite uma senha segura. O usuário poderá alterá-la depois.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setModalSenhaOpen(false)}>Cancelar</Button>
                <Button onClick={handleAdminChangePassword} disabled={loading}>
                  {loading ? "Salvando..." : "Confirmar Alteração"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
