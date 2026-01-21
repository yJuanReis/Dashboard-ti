import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PagePermissionGuard } from "@/components/PagePermissionGuard";
import { AdminOnlyRoute } from "@/components/AdminOnlyRoute";
import { PasswordTemporaryGuard } from "@/components/PasswordTemporaryGuard";
import { AuthProvider } from "@/contexts/AuthContext";
import { NVRProvider } from "@/contexts/NVRContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NavigationHistoryProvider } from "@/contexts/NavigationHistoryContext";

// Lazy load all page components for better performance
const Login = lazy(() => import("./pages/Login"));
const ResetPassword = lazy(() => import("./pages/reset-de-senha"));
const Home = lazy(() => import("./pages/Home"));
const Assinaturas = lazy(() => import("./pages/Assinaturas"));
const Chamados = lazy(() => import("./pages/Chamados"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const AuditLogs = lazy(() => import("./pages/logs"));
const ControleNVR = lazy(() => import("./pages/ControleNVR"));
const Crachas = lazy(() => import("./pages/Crachas"));
const EvolucaoHDs = lazy(() => import("./pages/ControleHD"));
const Servidores = lazy(() => import("./pages/Servidores"));
const SenhasTeste = lazy(() => import("./pages/SenhasTeste"));
const GestaoRede = lazy(() => import("./pages/GestaoRede"));
const Impressoras = lazy(() => import("./pages/Impressoras"));
const Ramais = lazy(() => import("./pages/Ramais"));

const TesteTermos = lazy(() => import("./pages/Termos"));
const SecurityTest = lazy(() => import("./pages/teste-de-segurança"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

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
              <Suspense fallback={<div>Loading...</div>}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/reset-de-senha" element={<ResetPassword />} />
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <PasswordTemporaryGuard>
                          <NVRProvider>
                            <Layout>
                              <Suspense fallback={<div>Loading page...</div>}>
                                <Routes>
                                  <Route path="/" element={<Navigate to="/home" replace />} />
                                  <Route path="/home" element={<PagePermissionGuard><Home /></PagePermissionGuard>} />
                                  <Route path="/assinaturas" element={<PagePermissionGuard><Assinaturas /></PagePermissionGuard>} />
                                  <Route path="/chamados" element={<PagePermissionGuard><Chamados /></PagePermissionGuard>} />
                                  <Route path="/configuracoes" element={<AdminOnlyRoute><Configuracoes /></AdminOnlyRoute>} />
                                  <Route path="/logs" element={<PagePermissionGuard><AuditLogs /></PagePermissionGuard>} />
                                  <Route path="/controle-nvr" element={<PagePermissionGuard><ControleNVR /></PagePermissionGuard>} />
                                  <Route path="/crachas" element={<PagePermissionGuard><Crachas /></PagePermissionGuard>} />
                                  <Route path="/controle-hds" element={<PagePermissionGuard><EvolucaoHDs /></PagePermissionGuard>} />
                                  <Route path="/servidores" element={<PagePermissionGuard><Servidores /></PagePermissionGuard>} />
                                  <Route path="/senhas" element={<PagePermissionGuard><SenhasTeste /></PagePermissionGuard>} />
                                  <Route path="/gestaorede" element={<PagePermissionGuard><GestaoRede /></PagePermissionGuard>} />
                                  <Route path="/impressoras" element={<PagePermissionGuard><Impressoras /></PagePermissionGuard>} />
                                  <Route path="/ramais" element={<PagePermissionGuard><Ramais /></PagePermissionGuard>} />

                                  <Route path="/termos" element={<PagePermissionGuard><TesteTermos /></PagePermissionGuard>} />
                                  <Route path="/teste-de-seguranca" element={<PagePermissionGuard><SecurityTest /></PagePermissionGuard>} />
                                  <Route path="*" element={<NotFound />} />
                                </Routes>
                              </Suspense>
                            </Layout>
                          </NVRProvider>
                        </PasswordTemporaryGuard>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Suspense>
            </NavigationHistoryProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;