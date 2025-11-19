import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/testNVRConnection"; // Disponibiliza testNVRConnection no console
import "./lib/sanitize"; // Carrega DOMPurify e funções de sanitização

createRoot(document.getElementById("root")!).render(<App />);
