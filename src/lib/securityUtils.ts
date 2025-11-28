/**
 * Utilitários de Segurança
 * Funções para sanitização e validação de dados
 */

import { sanitizeText, sanitizeUserInput } from './sanitize';

/**
 * Sanitiza uma string removendo tags HTML e caracteres perigosos
 * Usa DOMPurify para proteção robusta contra XSS
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return sanitizeText(input).trim();
}

/**
 * Valida email
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
}

/**
 * Valida senha forte
 * Requisitos: mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 símbolo
 */
export function isStrongPassword(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }
  
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);
  
  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumber &&
    hasSpecialChar
  );
}

/**
 * Valida senha básica (mínimo 6 caracteres)
 */
export function isValidPassword(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }
  
  return password.length >= 6;
}

/**
 * Escapa caracteres especiais para prevenir XSS
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Valida se uma string contém apenas caracteres alfanuméricos e espaços
 */
export function isAlphanumeric(text: string, allowSpaces: boolean = true): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  const pattern = allowSpaces ? /^[a-zA-Z0-9\s]+$/ : /^[a-zA-Z0-9]+$/;
  return pattern.test(text);
}

/**
 * Valida se uma string é um UUID válido
 */
export function isValidUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Limita o tamanho de uma string
 */
export function limitString(text: string, maxLength: number): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + '...';
}

/**
 * Remove caracteres de controle e caracteres invisíveis
 */
export function removeControlCharacters(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  // Remove caracteres de controle (0x00-0x1F) exceto \n, \r, \t
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Valida URL
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitiza URL removendo javascript: e outros protocolos perigosos
 * Usa DOMPurify para proteção adicional
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  const { sanitizeURL } = require('./sanitize');
  
  // Remove protocolos perigosos
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = url.toLowerCase().trim();
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return '#';
    }
  }
  
  // Valida se é uma URL válida
  if (isValidUrl(url)) {
    return sanitizeURL(url);
  }
  
  return '#';
}

/**
 * Gera um token CSRF simples (para uso em formulários)
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Valida token CSRF
 */
export function validateCSRFToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) {
    return false;
  }
  
  return token === storedToken;
}


