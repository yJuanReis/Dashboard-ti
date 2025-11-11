import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Assinaturas from "./pages/Assinaturas";
import BaseConhecimento from "./pages/BaseConhecimento";
import Chamados from "./pages/Chamados";
import Configuracoes from "./pages/Configuracoes";
import ControleNVR from "./pages/ControleNVR";
import Crachas from "./pages/Crachas";
import EvolucaoHDs from "./pages/EvolucaoHDs";
import FluxoStepper from "./pages/FluxoStepper";
import Servidores from "./pages/Servidores";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/assinaturas" element={<Assinaturas />} />
          <Route path="/base-conhecimento" element={<BaseConhecimento />} />
          <Route path="/chamados" element={<Chamados />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/controle-nvr" element={<ControleNVR />} />
          <Route path="/crachas" element={<Crachas />} />
          <Route path="/evolucao-hds" element={<EvolucaoHDs />} />
          <Route path="/fluxo-stepper" element={<FluxoStepper />} />
          <Route path="/servidores" element={<Servidores />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
