import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import { NVRProvider } from "@/contexts/NVRContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Assinaturas from "./pages/Assinaturas";
import Chamados from "./pages/Chamados";
import Configuracoes from "./pages/Configuracoes";
import ControleNVR from "./pages/ControleNVR";
import Crachas from "./pages/Crachas";
import EvolucaoHDs from "./pages/ControleHD";
import FluxoStepper from "./pages/FluxoStepper";
import Servidores from "./pages/Servidores";
import Senhas from "./pages/Senhas";
import GestaoRede from "./pages/GestaoRede";
import TesteTermos from "./pages/Termos";
import SecurityTest from "./pages/SecurityTest";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <NVRProvider>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Navigate to="/home" replace />} />
                        <Route path="/home" element={<Home />} />
                        <Route path="/assinaturas" element={<Assinaturas />} />
                        <Route path="/chamados" element={<Chamados />} />
                        <Route path="/configuracoes" element={<Configuracoes />} />
                        <Route path="/controle-nvr" element={<ControleNVR />} />
                        <Route path="/crachas" element={<Crachas />} />
                        <Route path="/Controle-hds" element={<EvolucaoHDs />} />
                        <Route path="/fluxo-stepper" element={<FluxoStepper />} />
                        <Route path="/servidores" element={<Servidores />} />
                        <Route path="/senhas" element={<Senhas />} />
                        <Route path="/gestaorede" element={<GestaoRede />} />
                        <Route path="/termos" element={<TesteTermos />} />
                        <Route path="/security-test" element={<SecurityTest />} />
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
);

export default App;
