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

// Função helper para obter a versão formatada
export const getVersionString = (): string => {
  return `${version.version} (${version.commitHash})`;
};

// Função helper para obter informações completas da versão
export const getVersionInfo = (): VersionInfo => {
  return version;
};

