import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Menu } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col w-full h-screen overflow-hidden">
          {/* Header with trigger - Fixo */}
          <header className="h-14 border-b border-border bg-background/95 backdrop-blur-sm flex-shrink-0 flex items-center px-4 gap-4 z-30">
            <SidebarTrigger className="hover:bg-secondary">
              <Menu className="w-5 h-5" />
            </SidebarTrigger>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-foreground">Sistema de Gestão TI</h1>
            </div>
          </header>

          {/* Main content - Sem overflow, cada página gerencia seu próprio scroll */}
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
