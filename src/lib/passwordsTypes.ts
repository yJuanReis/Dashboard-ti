/**
 * =====================================================
 * PASSWORDS TYPES - DEFINIÇÕES DE TIPOS
 * =====================================================
 * 
 * Este arquivo contém apenas definições de tipos TypeScript
 * para as senhas, sem expor a estrutura do banco de dados.
 * 
 * A estrutura real do banco e o mapeamento de campos estão
 * protegidos no backend via funções RPC do Supabase.
 * 
 * SEGURANÇA:
 * ✅ Não expõe nomes de tabelas
 * ✅ Não expõe mapeamento de campos
 * ✅ Não expõe estrutura do banco
 * =====================================================
 */

import type { LucideIcon } from 'lucide-react';

/**
 * Dados que vêm do banco de dados (via RPC)
 * Esta é a estrutura retornada pelas funções RPC
 */
export interface PasswordEntryDB {
  id: string;
  servico: string;
  usuario: string | null;
  senha: string | null;
  descricao: string | null;
  link_de_acesso: string | null;
  marina: string | null;
  local: string | null;
  contas_compartilhadas_info: string | null;
  winbox: string | null;
  www: string | null;
  ssh: string | null;
  cloud_intelbras: string | null;
  link_rtsp: string | null;
  tipo: string | null;
  status: string | null;
  created_at?: string;
}

/**
 * Interface normalizada para uso nos componentes
 * Esta é a estrutura que os componentes React utilizam
 */
export interface PasswordEntry {
  id: string;
  service: string;
  username: string;
  password: string;
  category: string;
  description: string;
  icon: LucideIcon;
  url?: string;
  provider?: "google" | "microsoft" | "routerboard" | "provedores" | "nvr" | null;
  marina?: string;
  local?: string;
  contas_compartilhadas_info?: string;
  winbox?: string;
  www?: string;
  ssh?: string;
  cloud_intelbras?: string;
  link_rtsp?: string;
  tipo?: string;
  status?: string;
}

/**
 * Categorias disponíveis para as senhas
 */
export const PASSWORD_CATEGORIES = [
  'Email',
  'Servidores',
  'Redes',
  'Outros',
] as const;

export type PasswordCategory = typeof PASSWORD_CATEGORIES[number];

/**
 * Provedores disponíveis
 */
export const PASSWORD_PROVIDERS = [
  'google',
  'microsoft',
  'routerboard',
  'provedores',
  'nvr',
] as const;

export type PasswordProvider = typeof PASSWORD_PROVIDERS[number];

