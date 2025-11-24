import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PagePermissionGuard } from "@/components/PagePermissionGuard";
import { AdminOnlyRoute } from "@/components/AdminOnlyRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import { NVRProvider } from "@/contexts/NVRContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Home from "./pages/Home";
import Assinaturas from "./pages/Assinaturas";
import Chamados from "./pages/Chamados";
import Configuracoes from "./pages/Configuracoes";
import ControleNVR from "./pages/ControleNVR";
import Crachas from "./pages/Crachas";
import EvolucaoHDs from "./pages/ControleHD";
import Servidores from "./pages/Servidores";
import Senhas from "./pages/Senhas";
import GestaoRede from "./pages/GestaoRede";
import TesteTermos from "./pages/Termos";
import SecurityTest from "./pages/SecurityTest";
import AuditLogs from "./pages/AuditLogs";
import NotFound from "./pages/NotFound";

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
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <NVRProvider>
                      <Layout>
                        <Routes>
                          <Route path="/" element={<Navigate to="/home" replace />} />
                          <Route path="/home" element={<PagePermissionGuard><Home /></PagePermissionGuard>} />
                          <Route path="/assinaturas" element={<PagePermissionGuard><Assinaturas /></PagePermissionGuard>} />
                          <Route path="/chamados" element={<PagePermissionGuard><Chamados /></PagePermissionGuard>} />
                          <Route path="/configuracoes" element={<AdminOnlyRoute><Configuracoes /></AdminOnlyRoute>} />
                          <Route path="/controle-nvr" element={<PagePermissionGuard><ControleNVR /></PagePermissionGuard>} />
                          <Route path="/crachas" element={<PagePermissionGuard><Crachas /></PagePermissionGuard>} />
                          <Route path="/Controle-hds" element={<PagePermissionGuard><EvolucaoHDs /></PagePermissionGuard>} />
                          <Route path="/servidores" element={<PagePermissionGuard><Servidores /></PagePermissionGuard>} />
                          <Route path="/senhas" element={<PagePermissionGuard><Senhas /></PagePermissionGuard>} />
                          <Route path="/gestaorede" element={<PagePermissionGuard><GestaoRede /></PagePermissionGuard>} />
                          <Route path="/termos" element={<PagePermissionGuard><TesteTermos /></PagePermissionGuard>} />
                          <Route path="/security-test" element={<PagePermissionGuard><SecurityTest /></PagePermissionGuard>} />
                          <Route path="/audit-logs" element={<AdminOnlyRoute><AuditLogs /></AdminOnlyRoute>} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Layout>
                    </NVRProvider>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
