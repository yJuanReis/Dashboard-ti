import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/testNVRConnection"; // Disponibiliza testNVRConnection no console
import "./lib/sanitize"; // Carrega DOMPurify e funções de sanitização
import { disableConsoleInProduction } from "./lib/disableConsoleInProduction";
import { logger } from "@/lib/logger";

// Forçar HTTPS em produção
if (import.meta.env.PROD && window.location.protocol !== 'https:') {
  window.location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
}

// Desabilitar console.log em produção para usuários não-admin
disableConsoleInProduction();

createRoot(document.getElementById("root")!).render(<App />);
