import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      // Security Headers - CONFIGURAÇÃO CORRIGIDA PARA PDF
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN", // Permite iframe do próprio site (necessário para o PDF)
      "X-XSS-Protection": "1; mode=block",
      // CSP Permissiva para blob: (necessário para visualizar o PDF gerado)
      "Content-Security-Policy": "default-src 'self' blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://*.supabase.in https://api.ipify.org wss://*.supabase.co wss://*.supabase.in; frame-src 'self' blob:;",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // 👇 SUA CONFIGURAÇÃO DE BUILD MANTIDA AQUI
  build: {
    // Aumenta o limite do aviso para 1000kb
    chunkSizeWarningLimit: 1000, 
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Se o arquivo vier de node_modules, cria um chunk separado
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        },
      },
    },
  },
}));