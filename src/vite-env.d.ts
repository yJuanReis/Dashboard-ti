/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_ANON_KEY: string
    // Você pode adicionar outras variáveis VITE_ aqui no futuro
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }