import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile();
  
  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col w-full h-screen overflow-hidden">
          {/* Header with trigger - Responsivo */}
          <header className="h-12 md:h-14 border-b border-border bg-background/95 backdrop-blur-sm flex-shrink-0 flex items-center px-3 md:px-4 gap-2 md:gap-4 z-30">
            <SidebarTrigger className="hover:bg-secondary h-8 w-8 md:h-9 md:w-9">
              <Menu className="w-4 h-4 md:w-5 md:h-5" />
            </SidebarTrigger>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm md:text-lg font-semibold text-foreground truncate">
                Sistema de Gestão TI
              </h1>
            </div>
          </header>

          {/* Main content - Com scroll quando necessário e padding responsivo */}
          <main className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-6">
            <div className="max-w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
