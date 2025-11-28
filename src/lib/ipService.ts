/**
 * Serviço de Obtenção de IP
 * 
 * Este serviço obtém o endereço IP do usuário de forma robusta:
 * 1. Tenta obter do backend (Supabase RPC) primeiro
 * 2. Fallback para múltiplos serviços externos
 * 3. Cache durante a sessão para melhor performance
 * 4. Validação de IP antes de retornar
 */

import { supabase } from './supabaseClient';
import { logger } from './logger';

// Cache do IP durante a sessão
let cachedIP: string | null = null;

/**
 * Valida se um IP é válido (IPv4 ou IPv6)
 */
function validateIP(ip: string): boolean {
  // Regex para IPv4
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  
  // Regex para IPv6
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
    return false;
  }
  
  // Validação adicional para IPv4 (cada octeto deve ser 0-255)
  if (ipv4Regex.test(ip)) {
    const octets = ip.split('.');
    return octets.every(octet => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });
  }
  
  return true;
}

/**
 * Tenta obter o IP do backend (Supabase RPC)
 */
async function getIPFromBackend(): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('get_client_ip');
    
    if (error) {
      logger.warn('Erro ao obter IP do backend:', error);
      return null;
    }
    
    if (data && typeof data === 'string' && validateIP(data)) {
      return data;
    }
    
    return null;
  } catch (error) {
    logger.warn('Exceção ao obter IP do backend:', error);
    return null;
  }
}

/**
 * Tenta obter o IP de serviços externos
 */
async function getIPFromExternalServices(): Promise<string | null> {
  // Lista de serviços de fallback (em ordem de preferência)
  const services = [
    {
      url: 'https://api.ipify.org?format=json',
      field: 'ip',
    },
    {
      url: 'https://api.ip.sb/jsonip',
      field: 'ip',
    },
    {
      url: 'https://ipapi.co/json/',
      field: 'ip',
    },
  ];
  
  // Tenta cada serviço em ordem
  for (const service of services) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout de 5s
      
      const response = await fetch(service.url, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        continue;
      }
      
      const data = await response.json();
      const ip = data[service.field] || data.ip || data.query;
      
      if (ip && typeof ip === 'string' && validateIP(ip)) {
        logger.info(`IP obtido de ${service.url}: ${ip}`);
        return ip;
      }
    } catch (error) {
      logger.warn(`Erro ao obter IP de ${service.url}:`, error);
      continue;
    }
  }
  
  return null;
}

/**
 * Obtém o IP do usuário
 * 
 * Esta função tenta obter o IP de várias fontes:
 * 1. Cache (se já foi obtido nesta sessão)
 * 2. Backend (função RPC do Supabase)
 * 3. Serviços externos (fallback)
 * 
 * @returns O endereço IP do usuário ou 'unknown' se não conseguir obter
 */
export async function getUserIP(): Promise<string> {
  // Se já temos o IP em cache, retorna
  if (cachedIP) {
    return cachedIP;
  }
  
  try {
    // Tenta obter do backend primeiro
    logger.info('Tentando obter IP do backend...');
    const backendIP = await getIPFromBackend();
    
    if (backendIP) {
      cachedIP = backendIP;
      logger.info(`IP obtido do backend: ${backendIP}`);
      return backendIP;
    }
    
    // Fallback para serviços externos
    logger.info('Tentando obter IP de serviços externos...');
    const externalIP = await getIPFromExternalServices();
    
    if (externalIP) {
      cachedIP = externalIP;
      logger.info(`IP obtido de serviço externo: ${externalIP}`);
      return externalIP;
    }
    
    // Se nenhum método funcionou, retorna 'unknown'
    logger.warn('Não foi possível obter IP do usuário');
    return 'unknown';
  } catch (error) {
    logger.error('Erro ao obter IP do usuário:', error);
    return 'unknown';
  }
}

/**
 * Limpa o cache de IP
 * Útil quando o usuário faz logout ou muda de rede
 */
export function clearIPCache(): void {
  cachedIP = null;
  logger.info('Cache de IP limpo');
}

/**
 * Obtém o IP sem usar cache
 * Útil em situações específicas onde é necessário um IP atualizado
 */
export async function getUserIPFresh(): Promise<string> {
  clearIPCache();
  return getUserIP();
}

