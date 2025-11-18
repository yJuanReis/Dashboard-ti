import { createClient } from '@supabase/supabase-js'

// Obtém as variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validação para garantir que as variáveis foram carregadas
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não estão definidas. Verifique seu arquivo .env.local.");
}

// Cria e exporta o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)