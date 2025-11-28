import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
// import { useEffect } from "react"; // EM DESENVOLVIMENTO (para logs)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Settings, User, Moon, Sun, Bell, UserPlus, Trash2, Lock, Mail, Eye, EyeOff, RefreshCw, LogOut, X, ShieldAlert, ShieldCheck, AlertCircle, Edit, Check, XCircle, Shield, Database, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// ScrollArea removido conforme solicitado
// import { fetchLogs, type LogEntry } from "@/lib/logsService"; // EM DESENVOLVIMENTO
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLogout } from "@/hooks/use-logout";
import { supabase } from "@/lib/supabaseClient";
import { updateUserPasswordByAdmin, deleteUserByAdmin } from "@/lib/adminService";
import { logUpdate, logAction, AuditAction } from "@/lib/auditService";
import { logger } from "@/lib/logger";
import { normalizeRoutePath } from "@/lib/pathUtils";
import { sanitizeText } from "@/lib/sanitize";
import { getUserIP } from "@/lib/ipService";
import zxcvbn from "zxcvbn";
import { 
  getAllPagesMaintenance, 
  updatePageMaintenance,
  getPagesHiddenByDefault as getPagesHiddenByDefaultService,
  type PageMaintenanceConfig as PageMaintenanceConfigService 
} from "@/lib/pagesMaintenanceService";
import { getInternalVersionString, getVersionInfo } from "@/lib/version";

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
  { path: '/controle-hds', nome: 'Controle de HDs', icon: '💾' }, // Nota: case-sensitive
  { path: '/impressoras', nome: 'Impressoras', icon: '🖨️' },
  { path: '/ramais', nome: 'Ramais', icon: '📞' },
  { path: '/termos', nome: 'Termo de Responsabilidade', icon: '📄' },
  { path: '/gestaorede', nome: 'Gestão de Rede', icon: '🌐' },
  { path: '/servidores', nome: 'Servidores', icon: '🖥️' },
  { path: '/chamados', nome: 'Chamados', icon: '🔧' },
  { path: '/teste-de-seguranca', nome: 'Teste de Segurança', icon: '🔒' },
  { path: '/configuracoes', nome: 'Configurações', icon: '⚙️' },
  { path: '/logs', nome: 'Logs', icon: '📋' },
];

// Páginas que são exclusivas para administradores (não aparecem nas permissões de usuários normais)
const PAGINAS_ADMIN_ONLY = ['/configuracoes', '/logs'];

// Função auxiliar para obter páginas disponíveis para usuários não-admin (exclui páginas admin-only)
const getPaginasParaUsuarios = () => {
  return PAGINAS_DISPONIVEIS.filter(p => !PAGINAS_ADMIN_ONLY.includes(p.path));
};

// Páginas que devem estar ocultas por padrão são gerenciadas em src/config/pagesMaintenance.ts
// Use getPagesHiddenByDefault() para obter a lista atualizada automaticamente

// Tipos para força da senha
type PasswordStrength = {
  score: number; // 0-4
  label: string;
  color: string;
  bgColor: string;
};

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
      logger.error("Erro ao registrar log de segurança:", error);
      // Não bloqueia o fluxo se o log falhar
    }
  } catch (error) {
    logger.error("Erro ao registrar log de segurança:", error);
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

// Componente Glider para tabs de role
function RoleTabs({
  role,
  onRoleChange,
  roleTabRefs,
}: {
  role: "admin" | "user";
  onRoleChange: (role: "admin" | "user") => void;
  roleTabRefs: React.MutableRefObject<Map<string, HTMLLabelElement>>;
}) {
  const [gliderStyle, setGliderStyle] = useState({ width: 0, transform: "translateX(0)" });

  useEffect(() => {
    const timer = setTimeout(() => {
      const activeKey = role;
      const activeLabel = roleTabRefs.current.get(activeKey);

      if (activeLabel) {
        const container = activeLabel.parentElement;
        if (container) {
          let translateX = 0;

          // Ordem: user primeiro, depois admin
          const order = ["user", "admin"];
          
          // Calcula a posição X somando as larguras de todos os elementos anteriores
          for (const key of order) {
            if (key === activeKey) break;
            const label = roleTabRefs.current.get(key);
            if (label) {
              translateX += label.offsetWidth;
            }
          }

          const width = activeLabel.offsetWidth;
          setGliderStyle({
            width: width,
            transform: `translateX(${translateX}px)`,
          });
        }
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [role, roleTabRefs]);

  return (
    <div className="relative inline-flex items-center bg-card shadow-sm rounded-full p-1.5 border border-border">
      <input
        type="radio"
        id="role-user"
        name="role-tabs"
        className="hidden"
        checked={role === "user"}
        onChange={() => onRoleChange("user")}
      />
      <label
        ref={(el) => {
          if (el) roleTabRefs.current.set("user", el);
        }}
        htmlFor="role-user"
        className={`relative z-10 flex items-center justify-center h-7 px-4 text-xs font-medium rounded-full cursor-pointer transition-colors ${
          role === "user"
            ? "text-primary"
            : "text-muted-foreground"
        }`}
      >
        Usuário
      </label>
      <input
        type="radio"
        id="role-admin"
        name="role-tabs"
        className="hidden"
        checked={role === "admin"}
        onChange={() => onRoleChange("admin")}
      />
      <label
        ref={(el) => {
          if (el) roleTabRefs.current.set("admin", el);
        }}
        htmlFor="role-admin"
        className={`relative z-10 flex items-center justify-center h-7 px-4 text-xs font-medium rounded-full cursor-pointer transition-colors ${
          role === "admin"
            ? "text-primary"
            : "text-muted-foreground"
        }`}
      >
        Administrador
      </label>
      <span
        className="absolute left-1.5 top-1.5 h-7 bg-primary/20 rounded-full transition-all duration-250 ease-out z-0"
        style={{
          width: `${gliderStyle.width}px`,
          transform: gliderStyle.transform,
        }}
      />
    </div>
  );
}

export default function Configuracoes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const logout = useLogout();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [novoUsuario, setNovoUsuario] = useState({ email: "", role: "user" as "admin" | "user" });
  const [permissoesPaginasNovoUsuario, setPermissoesPaginasNovoUsuario] = useState<string[]>([]);
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
  const roleTabRefs = useRef<Map<string, HTMLLabelElement>>(new Map());
  
  
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
  
  // Estados para modal de confirmação de email
  const [modalConfirmacaoEmail, setModalConfirmacaoEmail] = useState(false);
  
  // Estado para modal de confirmação de exclusão
  const [modalConfirmacaoExclusao, setModalConfirmacaoExclusao] = useState(false);
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState<Usuario | null>(null);
  
  // Estado para modal de confirmação de criação/atualização de usuário
  const [modalConfirmacaoCriacao, setModalConfirmacaoCriacao] = useState(false);
  const [nomeConfirmacao, setNomeConfirmacao] = useState("");
  const [senhaConfirmacao, setSenhaConfirmacao] = useState("");
  const [showSenhaConfirmacao, setShowSenhaConfirmacao] = useState(false);
  
  // Estados para prevenção de brute force
  const [tentativasErradas, setTentativasErradas] = useState(0);
  const [bloqueadoAté, setBloqueadoAté] = useState<Date | null>(null);
  
  // Estados para gerenciamento de páginas em manutenção
  const [pagesMaintenance, setPagesMaintenance] = useState<PageMaintenanceConfigService[]>([]);
  const [loadingPagesMaintenance, setLoadingPagesMaintenance] = useState(false);
  const [pagesMaintenanceExpanded, setPagesMaintenanceExpanded] = useState(false);
  
  // Estado para controlar expansão do card de perfil
  const [perfilExpanded, setPerfilExpanded] = useState(false);
  
  // Estado para controlar se o modal de editar nome está aberto
  const [editingNome, setEditingNome] = useState(false);


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
        logger.error("Erro ao verificar permissões:", err);
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
      logger.error("Erro ao alterar senha:", error);
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

  // Handler para validar e enviar email de redefinição
  const handleEnviarEmailRedefinicao = useCallback(async () => {
    if (!user?.email) {
      toast.error("Email não encontrado");
      return;
    }

    // Validar nome
    if (!nomeConfirmacao.trim()) {
      toast.error("Por favor, preencha seu nome");
      return;
    }

    // Verificar se o nome corresponde ao nome do usuário
    const nomeUsuario = currentUser?.nome || "";
    if (nomeConfirmacao.trim().toLowerCase() !== nomeUsuario.toLowerCase()) {
      toast.error("Nome incorreto. Por favor, verifique seu nome.");
      return;
    }

    // Validar senha
    if (!senhaConfirmacao) {
      toast.error("Por favor, preencha sua senha");
      return;
    }

    setLoadingEmail(true);

    try {
      // Verificar se a senha está correta
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: senhaConfirmacao,
      });

      if (signInError) {
        toast.error("Senha incorreta. Por favor, verifique sua senha.");
        setLoadingEmail(false);
        return;
      }

      // Se a senha está correta, enviar email de redefinição
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-de-senha`,
      });

      if (error) {
        toast.error("Erro ao enviar email: " + error.message);
        setLoadingEmail(false);
        return;
      }

      toast.success("Email de redefinição de senha enviado com sucesso!");
      setModalConfirmacaoEmail(false);
      setNomeConfirmacao("");
      setSenhaConfirmacao("");
    } catch (error) {
      logger.error("Erro ao enviar email:", error);
      toast.error("Erro ao enviar email. Tente novamente.");
    } finally {
      setLoadingEmail(false);
    }
  }, [user, nomeConfirmacao, senhaConfirmacao, currentUser]);

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
          logger.error("Erro ao carregar usuários:", profilesError);
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
          
          // Log para debug (só aparece para admins em produção)
          logger.log("Usuário carregado do banco:", {
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
      logger.error("Erro ao carregar usuários:", error);
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

  // Função para recarregar página com limpeza de cache
  const handleRecarregarPagina = useCallback(() => {
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

      // Recarregar a página
      window.location.reload();
    } catch (error) {
      logger.error("Erro ao recarregar página:", error);
      toast.error("Erro ao recarregar página. Tente novamente.");
    }
  }, []);

  // Função para carregar páginas em manutenção
  const carregarPagesMaintenance = useCallback(async () => {
    if (realRole !== 'admin') return;
    
    setLoadingPagesMaintenance(true);
    try {
      const pages = await getAllPagesMaintenance();
      logger.log('[Configuracoes] Páginas carregadas do banco:', pages.map(p => ({ path: p.page_path, is_active: p.is_active })));
      setPagesMaintenance(pages);
      
      // Verificar se há páginas no banco que não estão em PAGINAS_DISPONIVEIS
      const pathsNoBanco = pages.map(p => p.page_path);
      const normalizedDisponiveis = PAGINAS_DISPONIVEIS.map(p => normalizeRoutePath(p.path));
      const pathsNaoEncontrados = pathsNoBanco.filter(path => {
        const normalizedPath = normalizeRoutePath(path);
        return !normalizedDisponiveis.includes(normalizedPath);
      });
      if (pathsNaoEncontrados.length > 0) {
        logger.warn('[Configuracoes] Páginas no banco que não estão em PAGINAS_DISPONIVEIS:', pathsNaoEncontrados);
      }
    } catch (error) {
      logger.error("Erro ao carregar páginas em manutenção:", error);
      toast.error("Erro ao carregar páginas em manutenção");
    } finally {
      setLoadingPagesMaintenance(false);
    }
  }, [realRole]);

  // Carregar páginas ao montar (apenas para admin)
  useEffect(() => {
    if (realRole === 'admin') {
      carregarPagesMaintenance();
    }
  }, [realRole, carregarPagesMaintenance]);

  // Função para alternar status de uma página
  const handleTogglePageMaintenance = useCallback(async (pagePath: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    
    setLoadingPagesMaintenance(true);
    try {
      const result = await updatePageMaintenance(pagePath, newStatus);
      
      if (result.success) {
        toast.success(
          newStatus 
            ? "Página marcada como 'em avaliação'. Badge aparecerá na sidebar e página ficará oculta por padrão."
            : "Página removida de 'em avaliação'. Badge será removido da sidebar."
        );
        // Recarregar lista
        await carregarPagesMaintenance();
        // Pequeno delay para garantir que o banco foi atualizado
        await new Promise(resolve => setTimeout(resolve, 100));
        // Notificar outros componentes sobre a mudança
        logger.log('[Configuracoes] Disparando evento pagesMaintenanceChanged para página:', pagePath, 'status:', newStatus);
        window.dispatchEvent(new CustomEvent('pagesMaintenanceChanged', { 
          detail: { pagePath, isActive: newStatus } 
        }));
      } else {
        toast.error(result.error || "Erro ao atualizar página");
      }
    } catch (error: any) {
      logger.error("Erro ao atualizar página:", error);
      toast.error("Erro ao atualizar página: " + (error.message || "Erro desconhecido"));
    } finally {
      setLoadingPagesMaintenance(false);
    }
  }, [carregarPagesMaintenance]);

  // Função para terminar sessão
  const handleTerminarSessao = useCallback(async () => {
    await logout();
  }, [logout]);

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
          // Busca dados antigos antes de atualizar (para o log de auditoria)
          const { data: oldProfileData } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();

          const { data: updatedProfileData, error: updateError } = await supabase
            .from("user_profiles")
            .update({ nome: sanitizeText(nomeExibicao.trim()) })
            .eq("user_id", user.id)
            .select()
            .single();

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
              // Não registrar log se a tabela não existir
            } else if (oldProfileData && updatedProfileData) {
              // Registra log de auditoria
              await logUpdate(
                'user_profiles',
                user.id,
                oldProfileData as Record<string, any>,
                updatedProfileData as Record<string, any>,
                `Atualizou nome de exibição: ${nomeExibicao.trim()}`
              ).catch(err => logger.warn('Erro ao registrar log de auditoria:', err));
            }
            
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
      logger.error("Erro ao salvar nome:", error);
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
    setNovoUsuario({ email: "", role: "user" });
    setPermissoesPaginasNovoUsuario([]);
  }, []);

  // Estados para o visualizador de logs - EM DESENVOLVIMENTO
  // const [logs, setLogs] = useState<LogEntry[]>([]);
  // const [loadingLogs, setLoadingLogs] = useState(false);
  // const [filtroModulo, setFiltroModulo] = useState<string>("");
  // const [filtroNivel, setFiltroNivel] = useState<LogEntry['nivel'] | "">("");
  // const [buscaLogs, setBuscaLogs] = useState("");
  // const [mostrarLogs, setMostrarLogs] = useState(false);
  // const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  // Função para abrir modal de confirmação antes de criar/atualizar usuário
  const handleEnviarResetPassword = useCallback(() => {
    if (!novoUsuario.email) {
      setStatusMessage("Preencha o email");
      toast.error("Preencha o email");
      return;
    }
    setModalConfirmacaoCriacao(true);
  }, [novoUsuario.email]);

  // Função para criar usuário e enviar email de reset password (executada após confirmação)
  const handleConfirmarCriacaoUsuario = useCallback(async () => {
    logger.log('🚀 [Configuracoes] handleConfirmarCriacaoUsuario chamado');
    
    if (!novoUsuario.email) {
      setStatusMessage("Preencha o email");
      toast.error("Preencha o email");
      setModalConfirmacaoCriacao(false);
      return;
    }

    logger.log('📝 [Configuracoes] Criando/atualizando usuário:', novoUsuario.email);
    
    // Fechar modal de confirmação
    setModalConfirmacaoCriacao(false);
    
    // Adicionar estado de loading
    setLoadingUsuarios(true);
    setStatusMessage("Processando...");

    try {
      const emailLower = novoUsuario.email.toLowerCase().trim();
      const senhaTemporariaPadrao = '12345a.';
      
      // 1. Verificar se o usuário já existe
      const { data: existingProfile, error: profileError } = await supabase
        .from("user_profiles")
        .select("user_id, email, role")
        .eq("email", emailLower)
        .maybeSingle();

      let userId: string;
      let isNewUser = false;

      if (existingProfile) {
        // Usuário já existe, usar o ID existente
        userId = existingProfile.user_id;
        logger.log("Usuário existente encontrado:", userId);
      } else {
        // Usuário não existe, criar novo diretamente no banco
        isNewUser = true;
        logger.log("Criando novo usuário...");
        
        // 2. Definir senha padrão para novo usuário
        const novaSenha = senhaTemporariaPadrao;
        logger.log("Senha padrão atribuída para novo usuário (não será exibida)");

        // 3. Criar usuário diretamente no banco usando função RPC
        const { data: createResult, error: createError } = await supabase.rpc(
          'create_user_direct',
          {
            user_email: emailLower,
            user_password: novaSenha,
            user_role: novoUsuario.role || 'user',
            is_temporary: true
          }
        );

        if (createError) {
          setStatusMessage("Erro ao criar usuário: " + createError.message);
          toast.error("Erro ao criar usuário: " + createError.message);
          setLoadingUsuarios(false);
          return;
        }

        if (!createResult || !createResult.success) {
          const errorMsg = createResult?.message || "Erro desconhecido ao criar usuário";
          setStatusMessage("Erro ao criar usuário: " + errorMsg);
          toast.error("Erro ao criar usuário: " + errorMsg);
          setLoadingUsuarios(false);
          return;
        }

        userId = createResult.user_id;
        logger.log("Usuário criado com sucesso:", userId);
      }

      // 5. Se usuário já existia, atualizar senha e perfil
      if (!isNewUser) {
        // Definir nova senha padrão para usuário existente
        const novaSenha = senhaTemporariaPadrao;
        logger.log("Senha padrão atribuída para usuário existente (não será exibida)");

        // Atualizar senha do usuário usando função admin
        try {
          await updateUserPasswordByAdmin(
            userId,
            novaSenha,
            emailLower,
            emailLower
          );
        } catch (passwordError: any) {
          setStatusMessage("Erro ao atualizar senha: " + passwordError.message);
          toast.error("Erro ao atualizar senha: " + passwordError.message);
          setLoadingUsuarios(false);
          return;
        }

        // Atualizar perfil: role e password_temporary
        // Busca dados antigos antes de atualizar (para o log de auditoria)
        const { data: oldProfileData } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", userId)
          .single();

        const { data: updatedProfileData, error: updateProfileError } = await supabase
          .from("user_profiles")
          .update({
            role: novoUsuario.role,
            password_temporary: true, // Marcar como senha temporária
          })
          .eq("user_id", userId)
          .select()
          .single();

        if (updateProfileError) {
          logger.warn("Erro ao atualizar perfil:", updateProfileError);
          // Não bloquear se falhar, pois a senha já foi atualizada
        } else if (oldProfileData && updatedProfileData) {
          // Registra log de auditoria
          await logUpdate(
            'user_profiles',
            userId,
            oldProfileData as Record<string, any>,
            updatedProfileData as Record<string, any>,
            `Atualizou perfil do usuário: ${emailLower} (role: ${novoUsuario.role})`
          ).catch(err => logger.warn('Erro ao registrar log de auditoria:', err));
        }
      }

      // Salvar permissões de páginas (apenas para usuários não-admin)
      if (novoUsuario.role !== "admin") {
        // Lógica de permissões (similar ao modal de edição):
        // permissoesPaginasNovoUsuario armazena as páginas OCULTAS (marcadas)
        // No banco, page_permissions armazena as páginas VISÍVEIS
        let permissoesFinais: string[] | null = null;
        if (permissoesPaginasNovoUsuario.length === 0) {
          // Se nenhuma página está marcada (oculta), todas são visíveis = salvar null (acesso total)
          permissoesFinais = null;
        } else {
          // Se algumas páginas estão marcadas (ocultas), calcular as visíveis (todas menos as ocultas)
          // Excluir páginas admin-only das permissões de usuários normais
          const paginasVisiveis = getPaginasParaUsuarios()
            .map(p => p.path)
            .filter(path => !permissoesPaginasNovoUsuario.includes(path));
          permissoesFinais = paginasVisiveis;
        }

        // Salvar permissões usando RPC (mais confiável para arrays)
        let permissoesParaSalvar: string[] = [];
        if (permissoesFinais !== null && Array.isArray(permissoesFinais)) {
          permissoesParaSalvar = permissoesFinais;
        }

        // Tentar usar RPC primeiro (se a função existir)
        const { error: rpcError } = await supabase.rpc('update_user_page_permissions', {
          target_user_id: userId,
          new_permissions: permissoesParaSalvar
        });

        if (rpcError) {
          // Se RPC falhar, tentar update direto
          logger.warn("RPC não disponível, usando update direto:", rpcError);
          
          // Busca dados antigos antes de atualizar (para o log de auditoria)
          const { data: oldPermData } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", userId)
            .single();

          const { data: updatedPermData, error: directUpdateError } = await supabase
            .from("user_profiles")
            .update({ page_permissions: permissoesParaSalvar })
            .eq("user_id", userId)
            .select()
            .single();

          if (directUpdateError) {
            logger.error("Erro ao salvar permissões:", directUpdateError);
            // Não bloquear se falhar, apenas avisar
            toast.warning("Permissões podem não ter sido salvas corretamente. Tente novamente.");
          } else if (oldPermData && updatedPermData) {
            // Registra log de auditoria
            await logUpdate(
              'user_profiles',
              userId,
              oldPermData as Record<string, any>,
              updatedPermData as Record<string, any>,
              `Atualizou permissões de páginas do usuário: ${emailLower}`
            ).catch(err => logger.warn('Erro ao registrar log de auditoria:', err));
          }
        } else {
          // RPC foi bem-sucedido - buscar dados atualizados para log
          const { data: updatedPermData } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", userId)
            .single();
          
          if (updatedPermData) {
            // Buscar dados antigos para comparação
            const { data: oldPermData } = await supabase
              .from("user_profiles")
              .select("*")
              .eq("user_id", userId)
              .single();
            
            // Registra log de auditoria (mesmo que via RPC, registramos a mudança)
            if (oldPermData) {
              await logUpdate(
                'user_profiles',
                userId,
                oldPermData as Record<string, any>,
                updatedPermData as Record<string, any>,
                `Atualizou permissões de páginas do usuário via RPC: ${emailLower}`
              ).catch(err => logger.warn('Erro ao registrar log de auditoria:', err));
            }
          }
        }
      } else {
        // Se for admin, garantir que não tenha permissões (null)
        // Busca dados antigos antes de atualizar (para o log de auditoria)
        const { data: oldAdminPermData } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", userId)
          .single();

        const { error: adminPermError } = await supabase.rpc('update_user_page_permissions', {
          target_user_id: userId,
          new_permissions: []
        });
        
        if (adminPermError) {
          // Se RPC falhar, tentar update direto
          const { data: updatedAdminPermData } = await supabase
            .from("user_profiles")
            .update({ page_permissions: [] })
            .eq("user_id", userId)
            .select()
            .single();
          
          if (oldAdminPermData && updatedAdminPermData) {
            // Registra log de auditoria
            await logUpdate(
              'user_profiles',
              userId,
              oldAdminPermData as Record<string, any>,
              updatedAdminPermData as Record<string, any>,
              `Removeu permissões de páginas do admin: ${emailLower}`
            ).catch(err => logger.warn('Erro ao registrar log de auditoria:', err));
          }
        } else if (oldAdminPermData) {
          // RPC foi bem-sucedido - buscar dados atualizados para log
          const { data: updatedAdminPermData } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", userId)
            .single();
          
          if (updatedAdminPermData) {
            // Registra log de auditoria
            await logUpdate(
              'user_profiles',
              userId,
              oldAdminPermData as Record<string, any>,
              updatedAdminPermData as Record<string, any>,
              `Removeu permissões de páginas do admin via RPC: ${emailLower}`
            ).catch(err => logger.warn('Erro ao registrar log de auditoria:', err));
          }
        }
      }

      // 6. Não enviar email de reset - o usuário fará login e o modal aparecerá automaticamente
      // O usuário receberá instruções para fazer login e o modal de troca de senha aparecerá na Home

      // Sucesso!
      setStatusMessage(
        isNewUser
          ? `Usuário criado com sucesso! O usuário ${emailLower} pode fazer login agora. Uma senha temporária foi gerada e o modal de troca de senha aparecerá automaticamente após o login.`
          : `Senha temporária atualizada para ${emailLower}. O usuário pode fazer login e o modal de troca de senha aparecerá automaticamente.`
      );
      toast.success(
        isNewUser
          ? `Usuário criado! O usuário pode fazer login e será solicitado a trocar a senha.`
          : `Senha temporária atualizada! O usuário pode fazer login e será solicitado a trocar a senha.`
      );
      
      // Auditoria
      if (isNewUser) {
        await logAction(
          AuditAction.USER_CREATED,
          userId,
          `Novo usuário criado: ${emailLower}`,
          { email: emailLower, role: novoUsuario.role, admin_id: user!.id }
        );
      }
      
      // Enviar email de confirmação de signup via Supabase
      try {
        logger.log('📧 [EMAIL] Iniciando envio de email de confirmação para:', emailLower);
        
        const redirectTo = `${window.location.origin}`;
        logger.log('📧 [EMAIL] RedirectTo configurado:', redirectTo);
        
        // Usar resend para enviar email de confirmação de signup
        const { data, error } = await supabase.auth.resend({
          type: 'signup',
          email: emailLower,
          options: {
            emailRedirectTo: redirectTo,
          }
        });

        logger.log('📧 [EMAIL] Resposta completa do resend:', { 
          hasData: !!data, 
          hasError: !!error,
          errorCode: error?.code,
          errorMessage: error?.message 
        });

        if (error) {
          logger.error('❌ [EMAIL] Erro detalhado:', {
            code: error.code,
            message: error.message,
            status: error.status,
            error: error
          });
          toast.error('Erro ao enviar email: ' + error.message);
        } else {
          logger.log('✅ [EMAIL] Email de confirmação enviado com sucesso');
          
          // Confirmar email automaticamente para permitir login imediato
          try {
            const { data: confirmResult, error: confirmError } = await supabase.rpc(
              'confirm_user_email',
              { user_email: emailLower }
            );

            if (confirmError) {
              logger.warn('⚠️ [EMAIL] Erro ao confirmar email automaticamente:', confirmError);
              // Não bloquear o fluxo, apenas avisar
            } else if (confirmResult?.success) {
              logger.log('✅ [EMAIL] Email confirmado automaticamente - usuário pode fazer login');
            }
          } catch (confirmErr) {
            logger.warn('⚠️ [EMAIL] Erro ao confirmar email:', confirmErr);
            // Não bloquear o fluxo
          }
          
          toast.success('✅ Email de confirmação enviado! Usuário pode fazer login com a senha: 12345a.');
        }
      } catch (emailError: any) {
        logger.error('❌ [EMAIL] Exceção ao enviar email:', {
          message: emailError.message,
          stack: emailError.stack,
          error: emailError
        });
        toast.error('Não foi possível enviar o email. Erro: ' + (emailError.message || 'Desconhecido'));
      }

      // Limpar campos após sucesso
      setNovoUsuario({ email: "", role: "user" });
      setPermissoesPaginasNovoUsuario([]);
      setTimeout(() => setStatusMessage(""), 5000);
      setLoadingUsuarios(false);

      // Recarregar lista de usuários
      carregarUsuarios();
    } catch (error: any) {
      logger.error("Erro ao processar usuário:", error);
      
      // Tratamento específico para timeout
      if (error.message && (error.message.includes("Timeout") || error.message.includes("504"))) {
        setStatusMessage("O servidor demorou muito para responder. Tente novamente em alguns instantes.");
        toast.error("Timeout: O servidor demorou muito para responder. Tente novamente.");
      } else {
        setStatusMessage("Erro: " + (error.message || "Erro desconhecido"));
        toast.error("Erro ao processar usuário: " + (error.message || "Erro desconhecido"));
      }
      setLoadingUsuarios(false);
    }
  }, [novoUsuario, permissoesPaginasNovoUsuario, carregarUsuarios, user]);

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
      await updateUserPasswordByAdmin(
        usuarioParaEditar.user_id, 
        novaSenhaAdmin,
        usuarioParaEditar.email,
        usuarioParaEditar.nome
      );

      toast.success(`Senha de ${usuarioParaEditar.nome || usuarioParaEditar.email} alterada com sucesso.`);
      setModalSenhaOpen(false);
      setNovaSenhaAdmin("");
      
      // Auditoria
      await logAction(
        AuditAction.USER_UPDATED,
        usuarioParaEditar.user_id,
        `Senha alterada por admin para ${usuarioParaEditar.email}`,
        { email: usuarioParaEditar.email, admin_id: user!.id }
      );
      
      // Log
      const ip = await getUserIP();
      await registrarLogSeguranca(user!.id, "admin_change_password", ip, `Changed password for ${usuarioParaEditar.email}`);

    } catch (error: any) {
      toast.error("Erro ao alterar senha: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Função para abrir modal de confirmação de exclusão
  const abrirModalConfirmacaoExclusao = (usuario: Usuario) => {
    setUsuarioParaExcluir(usuario);
    setModalConfirmacaoExclusao(true);
  };

  // Função para confirmar e executar exclusão
  const handleConfirmarExclusao = useCallback(async () => {
    if (!usuarioParaExcluir) return;
    
    // Não permitir deletar o próprio usuário
    if (usuarioParaExcluir.user_id === user?.id) {
      toast.error("Você não pode remover seu próprio usuário");
      setModalConfirmacaoExclusao(false);
      setUsuarioParaExcluir(null);
      return;
    }

    setLoading(true);
    setModalConfirmacaoExclusao(false);
    
    try {
      // Usa o serviço admin que valida permissões e remove o usuário
      await deleteUserByAdmin(
        usuarioParaExcluir.user_id,
        usuarioParaExcluir.email,
        usuarioParaExcluir.nome
      );

      toast.success("Utilizador removido do sistema.");
      
      // Auditoria
      await logAction(
        AuditAction.USER_DELETED,
        usuarioParaExcluir.user_id,
        `Usuário ${usuarioParaExcluir.email} removido por admin`,
        { email: usuarioParaExcluir.email, nome: usuarioParaExcluir.nome, admin_id: user!.id }
      );
      
      // Log
      const ip = await getUserIP();
      await registrarLogSeguranca(user!.id, "admin_delete_user", ip, `Deleted user ${usuarioParaExcluir.user_id}`);
      
      // Recarregar lista de usuários
      carregarUsuarios();
      
      // Limpar estado
      setUsuarioParaExcluir(null);
    } catch (error: any) {
      logger.error("Erro ao remover usuário:", error);
      toast.error("Erro ao remover usuário: " + (error.message || "Erro desconhecido"));
      setUsuarioParaExcluir(null);
    } finally {
      setLoading(false);
    }
  }, [usuarioParaExcluir, user, carregarUsuarios]);

  // Função para abrir modal de edição de usuário (Admin)
  const abrirModalEditarUsuario = async (usuario: Usuario) => {
    logger.log("Abrindo modal de edição:", {
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
    // Lógica invertida: no modal, armazenamos as páginas OCULTAS (marcadas)
    // Por padrão, apenas páginas em desenvolvimento/avaliação ficam ocultas
    // Se page_permissions for null/undefined, usar páginas ocultas por padrão
    // Se tiver valores (páginas visíveis), calcular quais estão ocultas (todas menos as visíveis)
    // Para usuários não-admin, excluir páginas admin-only das permissões
    const paginasParaUsuarios = usuario.role === "admin" ? PAGINAS_DISPONIVEIS : getPaginasParaUsuarios();
    let paginasOcultas: string[] = [];
    if (usuario.page_permissions && Array.isArray(usuario.page_permissions)) {
      // Páginas ocultas = todas as páginas menos as que estão em page_permissions (visíveis)
      const normalizedPermissions = new Set(
        usuario.page_permissions.map(normalizeRoutePath)
      );
      paginasOcultas = paginasParaUsuarios
        .map(p => p.path)
        .filter(path => !normalizedPermissions.has(normalizeRoutePath(path)));
    } else {
      // Se page_permissions é null, usar apenas as páginas ocultas por padrão (em desenvolvimento/avaliação)
      // A lista é gerenciada automaticamente no banco de dados
      const hiddenPages = await getPagesHiddenByDefaultService();
      const normalizedHiddenPages = new Set(hiddenPages.map(normalizeRoutePath));
      paginasOcultas = paginasParaUsuarios
        .map(p => p.path)
        .filter(path => normalizedHiddenPages.has(normalizeRoutePath(path)));
    }
    logger.log("Permissões iniciais no modal (páginas ocultas):", paginasOcultas);
    setPermissoesPaginas(paginasOcultas);
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
      // Lógica de permissões (INVERTIDA):
      // No modal, permissoesPaginas armazena as páginas OCULTAS (marcadas)
      // No banco, page_permissions armazena as páginas VISÍVEIS
      // - Admin: não precisa de permissões (salvar null)
      // - User com nenhuma página marcada (oculta): salvar null (todas visíveis - acesso total)
      // - User com algumas páginas marcadas (ocultas): salvar array com as páginas VISÍVEIS (todas menos as ocultas)
      let permissoesFinais: string[] | null = null;
      if (editarRole === "admin") {
        permissoesFinais = null; // Admin não precisa de permissões
      } else if (permissoesPaginas.length === 0) {
        // Se nenhuma página está marcada (oculta), todas são visíveis = salvar null (acesso total)
        permissoesFinais = null;
      } else {
        // Se algumas páginas estão marcadas (ocultas), calcular as visíveis (todas menos as ocultas)
        // Excluir páginas admin-only das permissões de usuários normais
        const paginasVisiveis = getPaginasParaUsuarios()
          .map(p => p.path)
          .filter(path => !permissoesPaginas.includes(path));
        permissoesFinais = paginasVisiveis;
      }
      
      // Busca dados antigos antes de atualizar (para o log de auditoria)
      const { data: oldUserData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", usuarioEditando.user_id)
        .single();

      // Log para debug (só aparece para admins em produção)
      logger.log("Salvando permissões:", {
        usuario: usuarioEditando.email,
        role: editarRole,
        permissoesSelecionadas: permissoesPaginas,
        permissoesFinais,
        tipo: typeof permissoesFinais
      });
      
      // Preparar objeto de update (sem page_permissions por enquanto)
      const updateData: any = {
        nome: sanitizeText(editarNome.trim()),
        email: sanitizeText(editarEmail.trim()),
        role: editarRole,
      };
      
      // Atualizar dados básicos primeiro
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update(updateData)
        .eq("user_id", usuarioEditando.user_id);

      if (updateError) {
        logger.error("Erro ao atualizar dados básicos:", updateError);
        
        // Mensagem específica para erro de updated_at
        if (updateError.code === '42703' && updateError.message?.includes('updated_at')) {
          toast.error(
            "Erro: Campo 'updated_at' não encontrado na tabela. " +
            "Execute o script SQL 'fix_updated_at_trigger.sql' no Supabase Dashboard."
          );
          throw updateError;
        }
        
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
        logger.warn("RPC não disponível, usando update direto:", rpcError);
        
        // Busca dados antigos antes de atualizar (para o log de auditoria)
        const { data: oldPermDataModal } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", usuarioEditando.user_id)
          .single();

        const { data: updatedPermDataModal, error: directUpdateError } = await supabase
          .from("user_profiles")
          .update({ page_permissions: permissoesParaSalvar })
          .eq("user_id", usuarioEditando.user_id)
          .select()
          .single();
        
        if (directUpdateError) {
          logger.error("Erro ao atualizar permissões:", directUpdateError);
          // Não bloquear se falhar, apenas avisar
          toast.warning("Permissões podem não ter sido salvas corretamente. Tente novamente.");
        } else if (oldPermDataModal && updatedPermDataModal) {
          // Registra log de auditoria
          await logUpdate(
            'user_profiles',
            usuarioEditando.user_id,
            oldPermDataModal as Record<string, any>,
            updatedPermDataModal as Record<string, any>,
            `Atualizou permissões de páginas do usuário (modal edição): ${editarEmail}`
          ).catch(err => logger.warn('Erro ao registrar log de auditoria:', err));
        }
      } else {
        // RPC foi bem-sucedido - buscar dados atualizados para log
        const { data: updatedPermDataModal } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", usuarioEditando.user_id)
          .single();
        
        if (oldUserData && updatedPermDataModal) {
          // Registra log de auditoria (mesmo que via RPC, registramos a mudança)
          await logUpdate(
            'user_profiles',
            usuarioEditando.user_id,
            oldUserData as Record<string, any>,
            updatedPermDataModal as Record<string, any>,
            `Atualizou permissões de páginas do usuário via RPC (modal edição): ${editarEmail}`
          ).catch(err => logger.warn('Erro ao registrar log de auditoria:', err));
        }
      }
      
      // Verificar o que foi realmente salvo no banco
      const { data: usuarioAtualizado, error: verifyError } = await supabase
        .from("user_profiles")
        .select("page_permissions")
        .eq("user_id", usuarioEditando.user_id)
        .single();
      
      if (!verifyError && usuarioAtualizado) {
        logger.log("Verificação após salvar - o que está no banco:", {
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
        const normalizedSavedPermissions = Array.isArray(usuarioAtualizado.page_permissions)
          ? usuarioAtualizado.page_permissions.map(normalizeRoutePath)
          : [];
        const normalizedExpectedPermissions = permissoesParaSalvar.map(normalizeRoutePath);
        const salvouCorretamente = normalizedSavedPermissions.length === normalizedExpectedPermissions.length &&
          normalizedExpectedPermissions.every(p => normalizedSavedPermissions.includes(p));
        
        if (!salvouCorretamente && permissoesParaSalvar.length > 0) {
          logger.error("⚠️ PERMISSÕES NÃO FORAM SALVAS CORRETAMENTE!");
          toast.error("Erro ao salvar permissões. Verifique o console para mais detalhes.");
        }
      } else if (verifyError) {
        logger.error("Erro ao verificar permissões salvas:", verifyError);
      }

      // Atualizar email no auth.users via Admin API (se mudou)
      // NOTA: Funcionalidade temporariamente desabilitada por questões de segurança
      // O email é atualizado no user_profiles, mas pode precisar ser atualizado
      // manualmente no auth.users através do Supabase Dashboard se necessário
      if (editarEmail !== usuarioEditando.email) {
        logger.info("Email atualizado no perfil. Para atualizar no auth.users, use o Supabase Dashboard.");
        // Para implementar: criar uma função RPC segura no backend para atualizar email
      }

      // Busca dados atualizados para o log
      const { data: newUserData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", usuarioEditando.user_id)
        .single();

      // Registra log de auditoria
      if (oldUserData && newUserData) {
        await logUpdate(
          'user_profiles',
          usuarioEditando.user_id,
          oldUserData as Record<string, any>,
          newUserData as Record<string, any>,
          `Atualizou dados do usuário "${editarEmail}"`
        ).catch(err => logger.warn('Erro ao registrar log de auditoria:', err));
      }

      toast.success("Utilizador atualizado com sucesso!");
      
      // Log
      const ip = await getUserIP();
      await registrarLogSeguranca(user!.id, "admin_edit_user", ip, `Edited user ${usuarioEditando.user_id}`);
      
      setModalEditarUsuarioOpen(false);
      carregarUsuarios();
    } catch (error: any) {
      logger.error("Erro ao atualizar usuário:", error);
      
      // Mensagem específica para erro de updated_at
      if (error.code === '42703' && error.message?.includes('updated_at')) {
        toast.error(
          "Erro: Campo 'updated_at' não encontrado. " +
          "Execute o script 'fix_updated_at_trigger.sql' no Supabase Dashboard para corrigir."
        );
      } else {
        toast.error("Erro ao atualizar usuário: " + (error.message || "Erro desconhecido"));
      }
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
      <div className="max-w-7xl mx-auto">

      <div className="grid lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card único com Perfil e Alterar Senha */}
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="border-b">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setPerfilExpanded(!perfilExpanded)}
              >
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <CardTitle>Perfil</CardTitle>
                  <Badge className={realRole === 'admin' ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20" : "bg-success/10 text-success border-success/30"}>
                    {realRole === 'admin' ? 'Administrador' : 'Ativo'}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPerfilExpanded(!perfilExpanded);
                  }}
                >
                  {perfilExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </CardHeader>
            {perfilExpanded && (
            <CardContent className="space-y-8">
              {/* Seção Perfil */}
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white text-lg sm:text-2xl font-bold shadow-lg ring-4 ring-background flex-shrink-0">
                    {currentUser.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg sm:text-xl text-foreground truncate">{currentUser.nome}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{currentUser.email}</p>
                    </div>
                    {!editingNome ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingNome(true)}
                          className="w-full sm:w-auto"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Mudar Nome</span>
                          <span className="sm:hidden">Editar</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                        <Input
                          type="text"
                          placeholder="O seu nome completo"
                          value={nomeExibicao}
                          onChange={(e) => setNomeExibicao(e.target.value)}
                          disabled={loadingNome}
                          autoComplete="off"
                          className="w-full sm:w-48"
                        />
                        <div className="flex gap-2">
                          <Button 
                            onClick={async () => {
                              await handleSalvarNome();
                              setEditingNome(false);
                            }}
                            disabled={loadingNome || !nomeExibicao.trim()}
                            size="sm"
                            className="flex-1 sm:flex-initial"
                          >
                            {loadingNome ? "A guardar..." : "Guardar"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingNome(false);
                              setNomeExibicao(currentUser.nome);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
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
                        onClick={() => setModalConfirmacaoEmail(true)}
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
            </CardContent>
            )}
          </Card>

          {/* User Management Card (Only for Admin) */}
          {realRole === 'admin' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5" />
                  Controle de Usuários
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-4">Criar ou Atualizar Usuário</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Adicione um novo usuário ou atualize a senha temporária de um usuário existente. <br /><br />Uma senha aleatória e segura será gerada automaticamente. <br />O usuário deve fazer login e o modal de troca de senha aparecerá automaticamente na Home.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                    <Input
                      type="email"
                      placeholder="E-mail do utilizador"
                      value={novoUsuario.email}
                      onChange={(e) => setNovoUsuario({...novoUsuario, email: e.target.value})}
                      autoComplete="off"
                      disabled={loadingUsuarios}
                      className="md:col-span-1"
                    />
                    <Select
                      value={novoUsuario.role}
                      onValueChange={(value: "admin" | "user") => {
                        setNovoUsuario({...novoUsuario, role: value});
                        // Limpar permissões se mudar para admin
                        if (value === "admin") {
                          setPermissoesPaginasNovoUsuario([]);
                        }
                      }}
                      disabled={loadingUsuarios}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo de utilizador" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuário</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleEnviarResetPassword}
                      className="md:col-span-1"
                      disabled={loadingUsuarios}
                    >
                      {loadingUsuarios ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          <span className="hidden sm:inline">Enviando...</span>
                          <span className="sm:hidden">...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">{novoUsuario.email ? "Criar/Atualizar Usuário" : "Criar Usuário"}</span>
                          <span className="sm:hidden">Criar</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Seleção de Páginas (apenas para usuários não-admin) */}
                  {novoUsuario.role === "user" && (
                    <div className="border-t pt-4 mt-4">
                      <Label className="text-base font-semibold mb-3 block">
                        Páginas que o usuário poderá ver
                      </Label>
                      <p className="text-xs text-muted-foreground mb-4">
                        Por padrão, todas as páginas estarão visíveis. Clique nas páginas para ocultá-las.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-2 border rounded-md custom-scrollbar">
                        {getPaginasParaUsuarios().map((pagina) => {
                          const estaOculta = permissoesPaginasNovoUsuario.includes(pagina.path);
                          
                          return (
                            <div
                              key={pagina.path}
                              className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                estaOculta
                                  ? "border-red-500 bg-red-50 hover:border-red-600 hover:bg-red-100"
                                  : "border-green-500 bg-green-50 hover:border-green-600 hover:bg-green-100"
                              }`}
                              onClick={() => {
                                setPermissoesPaginasNovoUsuario(prev => {
                                  if (prev.includes(pagina.path)) {
                                    return prev.filter(p => p !== pagina.path);
                                  } else {
                                    return [...prev, pagina.path];
                                  }
                                });
                              }}
                              title={estaOculta ? "Clique para tornar esta página visível" : "Clique para ocultar esta página"}
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-lg">{pagina.icon}</span>
                                <span className={`font-medium ${
                                  estaOculta ? "text-red-700" : "text-green-700"
                                }`}>
                                  {pagina.nome}
                                </span>
                              </div>
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                estaOculta
                                  ? "border-red-500 bg-red-500"
                                  : "border-green-500 bg-green-500"
                              }`}>
                                {estaOculta ? (
                                  <X className="w-3 h-3 text-white" />
                                ) : (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {permissoesPaginasNovoUsuario.length} página{permissoesPaginasNovoUsuario.length !== 1 ? 's' : ''} oculta{permissoesPaginasNovoUsuario.length !== 1 ? 's' : ''} • {getPaginasParaUsuarios().length - permissoesPaginasNovoUsuario.length} visível{getPaginasParaUsuarios().length - permissoesPaginasNovoUsuario.length !== 1 ? 's' : ''}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const totalPaginas = getPaginasParaUsuarios().length;
                            if (permissoesPaginasNovoUsuario.length === totalPaginas) {
                              // Todas estão ocultas, tornar todas visíveis
                              setPermissoesPaginasNovoUsuario([]);
                            } else {
                              // Algumas ou nenhuma está oculta, ocultar todas (apenas páginas para usuários)
                              setPermissoesPaginasNovoUsuario(getPaginasParaUsuarios().map(p => p.path));
                            }
                          }}
                          type="button"
                        >
                          {permissoesPaginasNovoUsuario.length === getPaginasParaUsuarios().length ? "Tornar Todas Visíveis" : "Ocultar Todas"}
                        </Button>
                      </div>
                    </div>
                  )}
                  {statusMessage && (
                    <p className={`text-sm mt-2 ${statusMessage.includes("Erro") || statusMessage.includes("não encontrado") ? "text-red-600" : "text-green-600"}`}>
                      {statusMessage}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-foreground">Utilizadores Registados</h4>
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
                    <div className="text-center py-8 text-muted-foreground">
                      Carregando usuários...
                    </div>
                  ) : usuarios.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado.
                    </div>
                  ) : (
                    // Modificação solicitada: Substituição do ScrollArea por div nativa e ajuste no header
                    <div className="max-h-[500px] w-full overflow-y-auto border rounded-md custom-scrollbar">
                      {/* Desktop Table */}
                      <div className="hidden md:block">
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
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {/* Mobile Cards */}
                      <div className="md:hidden space-y-3 p-3">
                        {usuarios.map((usuario) => (
                          <Card key={usuario.id} className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">
                                    {usuario.nome || usuario.email.split('@')[0] || 'Sem nome'}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">{usuario.email}</p>
                                </div>
                                <Badge variant="outline" className="ml-2 flex-shrink-0">
                                  {usuario.role === 'admin' ? 'Admin' : 'User'}
                                </Badge>
                              </div>
                              {usuario.user_id !== user?.id && (
                                <div className="flex gap-2 pt-2 border-t">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => abrirModalEditarUsuario(usuario)}
                                    className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => abrirModalSenha(usuario)}
                                    className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    <Lock className="w-4 h-4 mr-2" />
                                    Senha
                                  </Button>
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pages Maintenance Card */}
          {realRole === 'admin' && (
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="border-b">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setPagesMaintenanceExpanded(!pagesMaintenanceExpanded)}
                >
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Settings className="w-5 h-5 text-muted-foreground" />
                      Gerenciar Páginas em Manutenção
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-2">
                      Controle quais páginas aparecem com badge "Avaliar" na sidebar.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPagesMaintenanceExpanded(!pagesMaintenanceExpanded);
                    }}
                  >
                    {pagesMaintenanceExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              {pagesMaintenanceExpanded && (
              <CardContent className="space-y-4 pt-6">
                {loadingPagesMaintenance ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Carregando páginas...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PAGINAS_DISPONIVEIS.map((pagina) => {
                      // Normalizar paths para comparação (case-insensitive)
                      const normalizedPaginaPath = pagina.path.toLowerCase().trim();
                      const maintenanceConfig = pagesMaintenance.find(p => {
                        const normalizedDbPath = p.page_path.toLowerCase().trim();
                        return normalizedDbPath === normalizedPaginaPath;
                      });
                      const isInMaintenance = maintenanceConfig?.is_active ?? false;
                      
                      // Log para debug
                      if (maintenanceConfig) {
                        logger.log(`[Configuracoes] Página ${pagina.path} encontrada no banco:`, {
                          path: maintenanceConfig.page_path,
                          is_active: maintenanceConfig.is_active,
                          badge_text: maintenanceConfig.badge_text
                        });
                      }
                      
                      return (
                        <div
                          key={pagina.path}
                          className={`group flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                            isInMaintenance
                              ? "bg-yellow-50/50 border-yellow-200 hover:border-yellow-300 hover:bg-yellow-50"
                              : "bg-muted border-border hover:border-primary/30 hover:bg-accent"
                          }`}
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-all ${
                              isInMaintenance
                                ? "bg-warning/20"
                                : "bg-muted"
                            }`}>
                              {pagina.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className={`font-semibold text-sm ${
                                  isInMaintenance ? "text-warning-foreground" : "text-foreground"
                                }`}>
                                  {pagina.nome}
                                </h4>
                                {isInMaintenance && (
                                  <Badge 
                                    variant="outline" 
                                    className="text-[10px] px-2 py-0.5 h-5 bg-yellow-100 text-yellow-700 border-yellow-300 font-medium"
                                  >
                                    {maintenanceConfig?.badge_text || "Avaliar"}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground font-mono">{pagina.path}</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={isInMaintenance}
                              onChange={() => handleTogglePageMaintenance(pagina.path, isInMaintenance)}
                              disabled={loadingPagesMaintenance}
                            />
                            <div className={`w-12 h-6 rounded-full peer transition-all duration-300 ${
                              isInMaintenance 
                                ? "bg-warning shadow-md shadow-warning/30" 
                                : "bg-muted border border-border"
                            } peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-warning peer-checked:after:translate-x-full peer-checked:after:border-warning-foreground after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-warning-foreground after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm`}></div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
                

                
              </CardContent>
              )}
            </Card>
          )}

          {/* Password Card */}
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
                <span className="text-muted-foreground">Versão:</span>
                <span className="font-semibold text-foreground font-mono text-xs">{getInternalVersionString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Commits:</span>
                <span className="font-mono">{getVersionInfo().commitCount}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Build:</span>
                <span className="font-mono text-xs">{new Date(getVersionInfo().buildDate).toLocaleDateString('pt-BR')}</span>
              </div>
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

          {/* Notifications Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notificações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground text-sm">Notificações por E-mail</h4>
                  <p className="text-xs text-muted-foreground">Receba atualizações importantes por e-mail</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-2">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-muted border border-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-primary-foreground after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-primary-foreground after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground text-sm">Alertas do Sistema</h4>
                  <p className="text-xs text-muted-foreground">Notificações sobre atualizações e manutenções</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-2">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-muted border border-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-primary-foreground after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-primary-foreground after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="pt-2 border-t">
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-sm"
                  onClick={handleRecarregarPagina}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recarregar página
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security Test & Logs Card */}
          {realRole === 'admin' && (
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  Testes de Segurança
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Button
                    onClick={() => {
                      sessionStorage.setItem('securityTestFromConfig', 'true');
                      navigate('/teste-de-seguranca');
                    }}
                    className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Ir para Testes de Segurança
                  </Button>
                </div>
                <div className="pt-4 border-t">
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-muted-foreground" />
                    Logs do Sistema
                  </CardTitle>
                </div>
                <div className="pt-2 border-t">
                  <Button
                    onClick={() => navigate('/logs')}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Ver Logs do Sistema
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

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


      {/* MODAL DE EDIÇÃO DE USUÁRIO (ADMIN) */}
      {modalEditarUsuarioOpen && usuarioEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
          <Card className="w-[95vw] sm:w-full max-w-5xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <CardTitle className="text-lg">Editar <strong>{usuarioEditando.nome || usuarioEditando.email}</strong></CardTitle>
              <div className="flex justify-center">
                  <RoleTabs 
                    role={editarRole} 
                    onRoleChange={setEditarRole}
                    roleTabRefs={roleTabRefs}
                  />
                </div>

              <Button variant="ghost" size="icon" onClick={() => setModalEditarUsuarioOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 overflow-y-auto flex-1 custom-scrollbar">


              {/* Informações Básicas */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editarNome">Nome de Exibição</Label>
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

              </div>

              {/* Permissões de Páginas */}
              <div className="border-t pt-4">
                <Label className="text-base font-semibold mb-3 block">
                  Permissões de Acesso às Páginas
                </Label>
                <p className="text-xs text-muted-foreground mb-4">
                  Por padrão, apenas páginas em desenvolvimento ou avaliação ficam <strong>ocultas</strong>. Clique nas páginas para alternar entre visível e oculto.
                </p>
                
                {editarRole === "admin" ? (
                  <div className="p-3 bg-purple-50 text-purple-700 rounded-md text-sm">
                    ⚠️ Administradores têm acesso a todas as páginas automaticamente.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-2 border rounded-md custom-scrollbar">
                    {getPaginasParaUsuarios().map((pagina) => {
                      const estaOculta = permissoesPaginas.includes(pagina.path);
                      
                      return (
                        <div
                          key={pagina.path}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            estaOculta
                              ? "border-red-500 bg-red-50 hover:border-red-600 hover:bg-red-100"
                              : "border-green-500 bg-green-50 hover:border-green-600 hover:bg-green-100"
                          }`}
                          onClick={() => togglePermissaoPagina(pagina.path)}
                          title={estaOculta ? "Clique para tornar esta página visível" : "Clique para ocultar esta página"}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-lg">{pagina.icon}</span>
                            <span className={`font-medium ${
                              estaOculta ? "text-red-700" : "text-green-700"
                            }`}>
                              {pagina.nome}
                            </span>
                          </div>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            estaOculta
                              ? "border-red-500 bg-red-500"
                              : "border-green-500 bg-green-500"
                          }`}>
                            {estaOculta ? (
                              <X className="w-3 h-3 text-white" />
                            ) : (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {permissoesPaginas.length} página{permissoesPaginas.length !== 1 ? 's' : ''} oculta{permissoesPaginas.length !== 1 ? 's' : ''} • {getPaginasParaUsuarios().length - permissoesPaginas.length} visível{getPaginasParaUsuarios().length - permissoesPaginas.length !== 1 ? 's' : ''}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const totalPaginas = getPaginasParaUsuarios().length;
                      if (permissoesPaginas.length === totalPaginas) {
                        // Todas estão ocultas, tornar todas visíveis
                        setPermissoesPaginas([]);
                      } else {
                        // Algumas ou nenhuma está oculta, ocultar todas (apenas páginas para usuários)
                        setPermissoesPaginas(getPaginasParaUsuarios().map(p => p.path));
                      }
                    }}
                    disabled={editarRole === "admin"}
                  >
                    {permissoesPaginas.length === getPaginasParaUsuarios().length ? "Tornar Todas Visíveis" : "Ocultar Todas"}
                  </Button>
                </div>
              </div>

            </CardContent>
            <div className="sticky bottom-0 bg-background border-t p-4 flex justify-between items-center gap-2">
              <Button 
                variant="destructive" 
                onClick={() => {
                  setModalEditarUsuarioOpen(false);
                  abrirModalConfirmacaoExclusao(usuarioEditando);
                }}
                disabled={loading || usuarioEditando.user_id === user?.id}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Excluir Usuário
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setModalEditarUsuarioOpen(false)} disabled={loading}>
                  Cancelar
                </Button>
                <Button onClick={handleSalvarEdicaoUsuario} disabled={loading}>
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL DE ALTERAÇÃO DE SENHA (ADMIN) */}
      {modalSenhaOpen && usuarioParaEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
          <Card className="w-[95vw] sm:w-full max-w-md flex flex-col animate-in fade-in zoom-in duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <CardTitle className="text-lg">Alterar Senha de <strong>{usuarioParaEditar.nome || usuarioParaEditar.email}</strong></CardTitle>

              <Button variant="ghost" size="icon" onClick={() => setModalSenhaOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 overflow-y-auto flex-1 custom-scrollbar">

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
            </CardContent>
            <div className="sticky bottom-0 bg-background border-t p-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModalSenhaOpen(false)} disabled={loading}>Cancelar</Button>
              <Button onClick={handleAdminChangePassword} disabled={loading}>
                {loading ? "Salvando..." : "Confirmar Alteração"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Confirmação para Enviar Email */}
      <Dialog open={modalConfirmacaoEmail} onOpenChange={setModalConfirmacaoEmail}>
        <DialogContent className="w-[95vw] sm:w-full max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Identidade</DialogTitle>
            <DialogDescription>
              Para enviar o email de redefinição de senha, por favor confirme sua identidade preenchendo seu nome e senha.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome-confirmacao">Nome</Label>
              <Input
                id="nome-confirmacao"
                type="text"
                placeholder="Digite seu nome"
                value={nomeConfirmacao}
                onChange={(e) => setNomeConfirmacao(e.target.value)}
                disabled={loadingEmail}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha-confirmacao">Senha</Label>
              <div className="relative">
                <Input
                  id="senha-confirmacao"
                  type={showSenhaConfirmacao ? "text" : "password"}
                  placeholder="Digite sua senha atual"
                  value={senhaConfirmacao}
                  onChange={(e) => setSenhaConfirmacao(e.target.value)}
                  disabled={loadingEmail}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowSenhaConfirmacao(!showSenhaConfirmacao)}
                  disabled={loadingEmail}
                >
                  {showSenhaConfirmacao ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setModalConfirmacaoEmail(false);
                setNomeConfirmacao("");
                setSenhaConfirmacao("");
              }}
              disabled={loadingEmail}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEnviarEmailRedefinicao}
              disabled={loadingEmail || !nomeConfirmacao.trim() || !senhaConfirmacao}
            >
              {loadingEmail ? "A enviar..." : "Enviar Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={modalConfirmacaoExclusao} onOpenChange={setModalConfirmacaoExclusao}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o utilizador <strong>{usuarioParaExcluir?.nome || usuarioParaExcluir?.email}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUsuarioParaExcluir(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarExclusao}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Confirmação de Criação/Atualização de Usuário */}
      <Dialog open={modalConfirmacaoCriacao} onOpenChange={setModalConfirmacaoCriacao}>
        <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle>Confirmar Criação/Atualização de Usuário</DialogTitle>
            <DialogDescription>
              Por favor, confirme as informações antes de criar ou atualizar o usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Email */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Email</Label>
              <div className="p-3 bg-muted rounded-md">
                <span className="text-sm">{novoUsuario.email || "Não informado"}</span>
              </div>
            </div>

            {/* Tipo de Usuário */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Tipo de Usuário</Label>
              <div className="p-3 bg-muted rounded-md">
                <Badge variant={novoUsuario.role === "admin" ? "default" : "outline"} className="text-sm">
                  {novoUsuario.role === "admin" ? "Administrador" : "Usuário"}
                </Badge>
              </div>
            </div>

            {/* Permissões de Páginas */}
            {novoUsuario.role === "user" ? (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Permissões de Páginas</Label>
                <div className="p-3 bg-muted rounded-md space-y-2">
                  {(() => {
                    const paginasParaUsuarios = getPaginasParaUsuarios();
                    const paginasVisiveis = paginasParaUsuarios.filter(
                      p => !permissoesPaginasNovoUsuario.includes(p.path)
                    );
                    const paginasOcultas = permissoesPaginasNovoUsuario.map(
                      path => paginasParaUsuarios.find(p => p.path === path)
                    ).filter(Boolean);

                    return (
                      <>
                        {paginasVisiveis.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-green-700 mb-2">
                              Páginas Visíveis ({paginasVisiveis.length}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {paginasVisiveis.map((pagina) => (
                                <Badge key={pagina.path} variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                  <span className="mr-1">{pagina.icon}</span>
                                  {pagina.nome}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {paginasOcultas.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-red-700 mb-2">
                              Páginas Ocultas ({paginasOcultas.length}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {paginasOcultas.map((pagina) => (
                                <Badge key={pagina!.path} variant="outline" className="bg-red-50 text-red-700 border-red-300">
                                  <span className="mr-1">{pagina!.icon}</span>
                                  {pagina!.nome}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {paginasVisiveis.length === 0 && paginasOcultas.length === 0 && (
                          <p className="text-xs text-muted-foreground">Nenhuma página configurada</p>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Permissões de Páginas</Label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">
                    Administradores têm acesso a todas as páginas automaticamente.
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalConfirmacaoCriacao(false)}
              disabled={loadingUsuarios}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarCriacaoUsuario}
              disabled={loadingUsuarios}
            >
              {loadingUsuarios ? "Processando..." : "Confirmar e Criar/Atualizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
