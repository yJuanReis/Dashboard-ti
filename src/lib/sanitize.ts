import DOMPurify from 'dompurify';

/**
 * Sanitiza HTML para prevenir ataques XSS
 * @param dirty - String HTML potencialmente perigosa
 * @returns String HTML sanitizada e segura
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'class'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitiza HTML permitindo mais tags (para conteúdo rico)
 * @param dirty - String HTML potencialmente perigosa
 * @returns String HTML sanitizada e segura
 */
export function sanitizeRichHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 
      'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
      'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'class', 'src', 'alt', 'width', 'height'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Remove completamente todas as tags HTML
 * @param dirty - String com HTML
 * @returns String sem nenhuma tag HTML
 */
export function stripHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}

// Adicionar DOMPurify ao window para detecção nos testes de segurança
if (typeof window !== 'undefined') {
  (window as any).DOMPurify = DOMPurify;
}

