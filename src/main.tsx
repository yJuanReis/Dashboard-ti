import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/testNVRConnection"; // Disponibiliza testNVRConnection no console
import "./lib/sanitize"; // Carrega DOMPurify e funções de sanitização
import { disableConsoleInProduction } from "./lib/disableConsoleInProduction";

// Desabilitar console.log em produção para usuários não-admin
disableConsoleInProduction();

createRoot(document.getElementById("root")!).render(<App />);
