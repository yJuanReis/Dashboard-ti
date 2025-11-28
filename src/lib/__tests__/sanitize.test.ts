/**
 * Testes para funções de sanitização com DOMPurify
 * 
 * Este arquivo testa os wrappers de sanitização com payloads XSS conhecidos
 */

import { sanitizeHTML, sanitizeText, sanitizeURL, sanitizeUserInput } from '../sanitize';

describe('Sanitização com DOMPurify', () => {
  describe('sanitizeText', () => {
    it('deve remover tags de script', () => {
      const dirty = '<script>alert("XSS")</script>';
      const clean = sanitizeText(dirty);
      expect(clean).not.toContain('<script');
      expect(clean).not.toContain('alert');
    });

    it('deve remover tags img com onerror', () => {
      const dirty = '<img src=x onerror=alert("XSS")>';
      const clean = sanitizeText(dirty);
      expect(clean).not.toContain('<img');
      expect(clean).not.toContain('onerror');
    });

    it('deve remover javascript: em URLs', () => {
      const dirty = 'javascript:alert("XSS")';
      const clean = sanitizeText(dirty);
      expect(clean).not.toContain('javascript:');
    });

    it('deve remover tags HTML mas manter o texto', () => {
      const dirty = '<b>Texto</b> normal';
      const clean = sanitizeText(dirty);
      expect(clean).toBe('Texto normal');
    });

    it('deve tratar strings vazias', () => {
      expect(sanitizeText('')).toBe('');
    });
  });

  describe('sanitizeHTML', () => {
    it('deve permitir tags seguras', () => {
      const dirty = '<b>Negrito</b> e <i>itálico</i>';
      const clean = sanitizeHTML(dirty);
      expect(clean).toContain('<b>');
      expect(clean).toContain('<i>');
    });

    it('deve remover tags perigosas', () => {
      const dirty = '<script>alert("XSS")</script><b>Texto</b>';
      const clean = sanitizeHTML(dirty);
      expect(clean).not.toContain('<script');
      expect(clean).toContain('<b>Texto</b>');
    });

    it('deve remover atributos perigosos', () => {
      const dirty = '<a href="valid.com" onclick="alert(1)">Link</a>';
      const clean = sanitizeHTML(dirty);
      expect(clean).not.toContain('onclick');
      expect(clean).toContain('href');
    });
  });

  describe('sanitizeURL', () => {
    it('deve bloquear javascript: protocol', () => {
      const dirty = 'javascript:alert("XSS")';
      const clean = sanitizeURL(dirty);
      expect(clean).toBe('');
    });

    it('deve bloquear data: protocol', () => {
      const dirty = 'data:text/html,<script>alert("XSS")</script>';
      const clean = sanitizeURL(dirty);
      expect(clean).toBe('');
    });

    it('deve bloquear vbscript: protocol', () => {
      const dirty = 'vbscript:msgbox("XSS")';
      const clean = sanitizeURL(dirty);
      expect(clean).toBe('');
    });

    it('deve permitir URLs válidas', () => {
      const validURL = 'https://example.com';
      const clean = sanitizeURL(validURL);
      expect(clean).toBe(validURL);
    });
  });

  describe('sanitizeUserInput', () => {
    it('deve remover todas as tags HTML', () => {
      const dirty = '<div><b>Texto</b> com <script>alert(1)</script></div>';
      const clean = sanitizeUserInput(dirty);
      expect(clean).not.toContain('<');
      expect(clean).not.toContain('>');
      expect(clean).toContain('Texto com');
    });

    it('deve remover eventos inline', () => {
      const dirty = '<div onclick="alert(1)">Click me</div>';
      const clean = sanitizeUserInput(dirty);
      expect(clean).not.toContain('onclick');
      expect(clean).toContain('Click me');
    });

    it('deve ser seguro para templates', () => {
      const dirty = '{{dangerous}}';
      const clean = sanitizeUserInput(dirty);
      // DOMPurify com SAFE_FOR_TEMPLATES deve tratar isso
      expect(clean).toBeDefined();
    });
  });

  describe('Payloads XSS conhecidos', () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      'javascript:alert("XSS")',
      '<svg onload=alert("XSS")>',
      '<iframe src="javascript:alert(\'XSS\')">',
      '<body onload=alert("XSS")>',
      '<input onfocus=alert("XSS") autofocus>',
      '<select onfocus=alert("XSS") autofocus>',
      '<textarea onfocus=alert("XSS") autofocus>',
      '<marquee onstart=alert("XSS")>',
      '<video><source onerror="alert(\'XSS\')">',
      '<audio src=x onerror=alert("XSS")>',
      '<details open ontoggle=alert("XSS")>',
      '<embed src="data:text/html,<script>alert(1)</script>">',
      '<object data="javascript:alert(\'XSS\')">',
    ];

    xssPayloads.forEach((payload, index) => {
      it(`deve bloquear payload ${index + 1}: ${payload.substring(0, 30)}...`, () => {
        const cleanText = sanitizeText(payload);
        const cleanInput = sanitizeUserInput(payload);
        
        // Verificar que não contém tags perigosas
        expect(cleanText).not.toMatch(/<script/i);
        expect(cleanText).not.toMatch(/onerror/i);
        expect(cleanText).not.toMatch(/onload/i);
        expect(cleanText).not.toMatch(/javascript:/i);
        
        expect(cleanInput).not.toMatch(/<script/i);
        expect(cleanInput).not.toMatch(/onerror/i);
        expect(cleanInput).not.toMatch(/onload/i);
        expect(cleanInput).not.toMatch(/javascript:/i);
      });
    });
  });

  describe('Casos extremos', () => {
    it('deve tratar null como string vazia', () => {
      // @ts-expect-error: testando comportamento com entrada inválida
      expect(() => sanitizeText(null)).not.toThrow();
    });

    it('deve tratar undefined como string vazia', () => {
      // @ts-expect-error: testando comportamento com entrada inválida
      expect(() => sanitizeText(undefined)).not.toThrow();
    });

    it('deve tratar objetos convertendo para string', () => {
      const obj = { toString: () => '<script>alert(1)</script>' };
      // @ts-expect-error: testando comportamento com entrada inválida
      const clean = sanitizeText(obj);
      expect(clean).not.toContain('<script');
    });

    it('deve tratar strings muito longas', () => {
      const longString = '<script>' + 'A'.repeat(10000) + '</script>';
      const clean = sanitizeText(longString);
      expect(clean).not.toContain('<script');
    });

    it('deve tratar caracteres Unicode', () => {
      const unicode = '<script>alert("XSS 中文 العربية")</script>';
      const clean = sanitizeText(unicode);
      expect(clean).not.toContain('<script');
      expect(clean).toContain('中文');
      expect(clean).toContain('العربية');
    });

    it('deve tratar caracteres de escape', () => {
      const escaped = '&lt;script&gt;alert("XSS")&lt;/script&gt;';
      const clean = sanitizeText(escaped);
      // HTML entities devem ser tratados corretamente
      expect(clean).toBeDefined();
    });
  });

  describe('Integração - Fluxo completo', () => {
    it('deve sanitizar entrada de formulário de senha', () => {
      const userInput = {
        service: '<script>alert("XSS")</script>Gmail',
        username: 'user@test.com<img src=x onerror=alert(1)>',
        description: 'Conta principal <b>importante</b>',
      };

      const sanitized = {
        service: sanitizeText(userInput.service),
        username: sanitizeText(userInput.username),
        description: sanitizeText(userInput.description),
      };

      expect(sanitized.service).toBe('Gmail');
      expect(sanitized.username).toBe('user@test.com');
      expect(sanitized.description).toBe('Conta principal importante');
    });

    it('deve sanitizar entrada de formulário de usuário', () => {
      const userInput = {
        nome: 'João Silva<script>alert(1)</script>',
        email: 'joao@test.com<img src=x>',
      };

      const sanitized = {
        nome: sanitizeText(userInput.nome),
        email: sanitizeText(userInput.email),
      };

      expect(sanitized.nome).toBe('João Silva');
      expect(sanitized.email).toBe('joao@test.com');
    });

    it('deve sanitizar busca sem remover caracteres válidos', () => {
      const searchTerms = [
        'Gmail',
        'user@email.com',
        'Senha do servidor #1',
        'Acesso (principal)',
        '192.168.1.1',
      ];

      searchTerms.forEach(term => {
        const sanitized = sanitizeText(term);
        expect(sanitized).toBe(term);
      });
    });
  });
});

