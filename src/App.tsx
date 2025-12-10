import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PagePermissionGuard } from "@/components/PagePermissionGuard";
import { AdminOnlyRoute } from "@/components/AdminOnlyRoute";
import { PasswordTemporaryGuard } from "@/components/PasswordTemporaryGuard";
import { AuthProvider } from "@/contexts/AuthContext";
import { NVRProvider } from "@/contexts/NVRContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Login from "./pages/Login";
import ResetPassword from "./pages/reset-de-senha";
import AuthCallback from "./pages/AuthCallback";
import Home from "./pages/Home";
import Assinaturas from "./pages/Assinaturas";
import Chamados from "./pages/Chamados";
import Configuracoes from "./pages/Configuracoes";
import AuditLogs from "./pages/logs";
import ControleNVR from "./pages/ControleNVR";
import Crachas from "./pages/Crachas";
import EvolucaoHDs from "./pages/ControleHD";
import Servidores from "./pages/Servidores";
import Senhas from "./pages/Senhas";
import GestaoRede from "./pages/GestaoRede";
import Impressoras from "./pages/Impressoras";
import Ramais from "./pages/Ramais";
import Solicitacoes from "./pages/Solicitacoes";
import TesteTermos from "./pages/Termos";
import SecurityTest from "./pages/teste-de-segurança";
import NotFound from "./pages/NotFound";
import { NavigationHistoryProvider } from "@/contexts/NavigationHistoryContext";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AuthProvider>
            <NavigationHistoryProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/reset-de-senha" element={<ResetPassword />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <PasswordTemporaryGuard>
                        <NVRProvider>
                          <Layout>
                            <Routes>
                              <Route path="/" element={<Navigate to="/home" replace />} />
                              <Route path="/home" element={<PagePermissionGuard><Home /></PagePermissionGuard>} />
                              <Route path="/assinaturas" element={<PagePermissionGuard><Assinaturas /></PagePermissionGuard>} />
                              <Route path="/chamados" element={<PagePermissionGuard><Chamados /></PagePermissionGuard>} />
                              <Route path="/configuracoes" element={<AdminOnlyRoute><Configuracoes /></AdminOnlyRoute>} />
                              <Route path="/logs" element={<AdminOnlyRoute><AuditLogs /></AdminOnlyRoute>} />
                              <Route path="/controle-nvr" element={<PagePermissionGuard><ControleNVR /></PagePermissionGuard>} />
                              <Route path="/crachas" element={<PagePermissionGuard><Crachas /></PagePermissionGuard>} />
                              <Route path="/controle-hds" element={<PagePermissionGuard><EvolucaoHDs /></PagePermissionGuard>} />
                              <Route path="/servidores" element={<PagePermissionGuard><Servidores /></PagePermissionGuard>} />
                              <Route path="/senhas" element={<PagePermissionGuard><Senhas /></PagePermissionGuard>} />
                              <Route path="/gestaorede" element={<PagePermissionGuard><GestaoRede /></PagePermissionGuard>} />
                              <Route path="/impressoras" element={<PagePermissionGuard><Impressoras /></PagePermissionGuard>} />
                              <Route path="/ramais" element={<PagePermissionGuard><Ramais /></PagePermissionGuard>} />
                              <Route path="/solicitacoes" element={<PagePermissionGuard><Solicitacoes /></PagePermissionGuard>} />
                              <Route path="/termos" element={<PagePermissionGuard><TesteTermos /></PagePermissionGuard>} />
                              <Route path="/teste-de-seguranca" element={<PagePermissionGuard><SecurityTest /></PagePermissionGuard>} />
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </Layout>
                        </NVRProvider>
                      </PasswordTemporaryGuard>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </NavigationHistoryProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
