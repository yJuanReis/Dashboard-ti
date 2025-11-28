import DOMPurify from 'dompurify';

/**
 * Sanitiza HTML permitindo apenas tags e atributos seguros
 * Para uso em campos que precisam suportar formatação básica
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOW_DATA_ATTR: false
  });
}

/**
 * Sanitiza texto removendo todas as tags HTML
 * Para uso em campos de texto simples
 */
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}

/**
 * Sanitiza URL para prevenir javascript: e data: URIs
 */
export function sanitizeURL(url: string): string {
  const sanitized = DOMPurify.sanitize(url, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
  
  // Verifica se é uma URL segura
  if (sanitized.startsWith('javascript:') || 
      sanitized.startsWith('data:') ||
      sanitized.startsWith('vbscript:')) {
    return '';
  }
  
  return sanitized;
}

/**
 * Sanitiza input de usuário com configurações estritas
 * Remove scripts, eventos e tags perigosas
 */
export function sanitizeUserInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    ALLOW_DATA_ATTR: false,
    SAFE_FOR_TEMPLATES: true
  });
}
