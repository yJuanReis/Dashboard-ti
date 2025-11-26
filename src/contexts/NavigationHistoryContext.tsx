import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { LayoutDashboard, Key, IdCard, Mail, Video, HardDrive, FileText, Network, Server, Wrench, Settings } from "lucide-react";

type RecentItem = {
  path: string;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
};

type NavigationHistoryContextType = {
  recentItems: RecentItem[];
};

const NavigationHistoryContext = createContext<NavigationHistoryContextType | undefined>(undefined);

const STORAGE_KEY = "navigation_recent_paths_v1";
const MAX_RECENT_ITEMS = 5;

// Mapa simples de metadados de navegação (mantido em sincronia com navigation.config.ts)
const navigationMeta: Record<
  string,
  {
    title: string;
    icon?: React.ComponentType<{ className?: string }>;
  }
> = {
  "/home": { title: "Início", icon: LayoutDashboard },
  "/senhas": { title: "Senhas", icon: Key },
  "/crachas": { title: "Crachás", icon: IdCard },
  "/assinaturas": { title: "Assinaturas", icon: Mail },
  "/controle-nvr": { title: "Controle NVR", icon: Video },
  "/controle-hds": { title: "Controle de HDs", icon: HardDrive },
  "/termos": { title: "Termo de Responsabilidade", icon: FileText },
  "/gestaorede": { title: "Gestão de Rede", icon: Network },
  "/servidores": { title: "Servidores", icon: Server },
  "/chamados": { title: "Chamados", icon: Wrench },
  "/configuracoes": { title: "Configurações", icon: Settings },
};

const IGNORED_PATHS = new Set([
  "/login",
  "/reset-password",
  "/security-test",
]);

export function NavigationHistoryProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [recentPaths, setRecentPaths] = useState<string[]>([]);

  // Carregar histórico do localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const sanitized = parsed
          .filter((p) => typeof p === "string")
          .map((p) => p.trim())
          .filter((p) => p.startsWith("/"));

        setRecentPaths(sanitized.slice(0, MAX_RECENT_ITEMS));
      }
    } catch {
      // Ignorar erros de parsing
    }
  }, []);

  // Atualizar histórico quando a rota mudar
  useEffect(() => {
    const path = location.pathname.toLowerCase();

    if (IGNORED_PATHS.has(path)) {
      return;
    }

    setRecentPaths((prev) => {
      const withoutCurrent = prev.filter((p) => p !== path);
      const updated = [path, ...withoutCurrent].slice(0, MAX_RECENT_ITEMS);

      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignorar erros de armazenamento
      }

      return updated;
    });
  }, [location.pathname]);

  const recentItems = useMemo<RecentItem[]>(() => {
    return recentPaths.map((path) => {
      const meta = navigationMeta[path] || {
        title: path.replace("/", "") || "Início",
      };

      return {
        path,
        title: meta.title,
        icon: meta.icon,
      };
    });
  }, [recentPaths]);

  const value: NavigationHistoryContextType = {
    recentItems,
  };

  return (
    <NavigationHistoryContext.Provider value={value}>
      {children}
    </NavigationHistoryContext.Provider>
  );
}

export function useNavigationHistory() {
  const context = useContext(NavigationHistoryContext);
  if (!context) {
    throw new Error("useNavigationHistory deve ser usado dentro de um NavigationHistoryProvider");
  }
  return context;
}


