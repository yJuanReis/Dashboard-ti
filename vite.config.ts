import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

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
      "Content-Security-Policy": "default-src 'self' blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://*.supabase.in https://api.ipify.org https://api.ip.sb https://ipapi.co wss://*.supabase.co wss://*.supabase.in; frame-src 'self' blob:;",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    },
  },
  plugins: [
    react(),
    ...(mode === 'analyze' ? [visualizer({ filename: 'dist/bundle-analysis.html', open: true })] : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // 👇 CONFIGURAÇÃO DE BUILD OTIMIZADA PARA PERFORMANCE
  build: {
    // Aumenta o limite do aviso para 1000kb
    chunkSizeWarningLimit: 1000,
    // Habilita minificação e compressão
    minify: 'esbuild',
    sourcemap: false, // Desabilita sourcemaps em produção para reduzir tamanho
    rollupOptions: {
      output: {
        // Otimiza chunks para melhor cache
        manualChunks(id) {
          // Agrupa bibliotecas grandes separadamente
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@radix-ui') || id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            if (id.includes('@supabase') || id.includes('@tanstack')) {
              return 'data-vendor';
            }
            return 'vendor';
          }
        },
        // Nomes de arquivos otimizados
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Habilita compressão automática
    reportCompressedSize: false, // Desabilita relatório para builds mais rápidos
  },
}));