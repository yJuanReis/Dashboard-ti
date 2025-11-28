// Arquivo de versão gerado automaticamente pelo script generate-version.js
// Este arquivo é atualizado antes de cada build

import versionData from './version.json';

export interface VersionInfo {
  version: string;
  commitCount: number;
  commitHash: string;
  commitDate: string;
  buildDate: string;
}

export const version: VersionInfo = versionData as VersionInfo;

// Versão pública genérica (para usuários não-admin)
// Não expõe informações sensíveis como commit hash
export const PUBLIC_VERSION = '1.0.0';

// Versão interna detalhada (apenas para admins)
// Contém todas as informações incluindo commit hash
export const INTERNAL_VERSION = `${version.version} (${version.commitHash})`;

// Função helper para obter a versão formatada (pública)
// Retorna versão genérica sem informações sensíveis
export const getVersionString = (): string => {
  return PUBLIC_VERSION;
};

// Função helper para obter a versão interna (apenas admin)
// Retorna versão completa com commit hash
export const getInternalVersionString = (): string => {
  return INTERNAL_VERSION;
};

// Função helper para obter informações completas da versão
export const getVersionInfo = (): VersionInfo => {
  return version;
};

