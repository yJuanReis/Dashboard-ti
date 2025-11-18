# 🔒 Guia de Segurança e Pentest

Este guia contém informações sobre segurança do sistema e como executar testes de penetração.

## ⚠️ AVISO IMPORTANTE

**Execute testes de segurança apenas em ambientes de desenvolvimento/teste!**
Não execute testes de penetração em produção sem autorização explícita.

## 🛡️ Medidas de Segurança Implementadas

### 1. Autenticação
- ✅ Login validado no Supabase (não no frontend)
- ✅ Tokens JWT com expiração
- ✅ Sessões gerenciadas pelo Supabase
- ✅ Proteção contra brute force (rate limiting do Supabase)

### 2. Autorização
- ✅ Rotas protegidas com `ProtectedRoute`
- ✅ Verificação de sessão antes de acessar dados
- ✅ Row Level Security (RLS) no Supabase

### 3. Validação de Inputs
- ✅ Validação básica no frontend
- ✅ Validação no backend (Supabase)
- ⚠️ **MELHORIA NECESSÁRIA**: Sanitização de HTML/XSS

### 4. Proteção de Dados
- ✅ Variáveis de ambiente para secrets
- ✅ Chaves não expostas no código
- ⚠️ **MELHORIA NECESSÁRIA**: Criptografia de dados sensíveis no localStorage

## 🧪 Como Executar Testes de Segurança

### Método 1: Página de Testes (Recomendado)

1. Acesse a página de testes de segurança (adicione a rota no App.tsx):
   ```tsx
   <Route path="/security-test" element={<SecurityTest />} />
   ```

2. Clique em "Executar Testes"

3. Revise os resultados e corrija vulnerabilidades encontradas

### Método 2: Console do Navegador

1. Abra o DevTools (F12)
2. Vá para a aba Console
3. Execute:
   ```javascript
   window.runSecurityTests()
   ```

### Método 3: Script Manual

Execute os testes individualmente no console:

```javascript
// Teste de autenticação
const { data } = await supabase.auth.getSession();
console.log('Sessão:', data.session);

// Teste de XSS
document.querySelector('input').value = '<script>alert("XSS")</script>';

// Teste de validação
const emailInput = document.querySelector('input[type="email"]');
emailInput.value = "'; DROP TABLE users; --";
console.log('Validação:', emailInput.checkValidity());
```

## 🔍 Testes Realizados

### 1. Exposição de Secrets
- **O que testa**: Verifica se chaves API, tokens ou senhas estão expostas no código
- **Como corrigir**: Use variáveis de ambiente, nunca hardcode secrets

### 2. Proteção XSS
- **O que testa**: Verifica se inputs são vulneráveis a Cross-Site Scripting
- **Como corrigir**: Sempre sanitize dados do usuário antes de renderizar

### 3. Autenticação
- **O que testa**: Valida tokens JWT e expiração de sessões
- **Como corrigir**: Configure renovação automática de tokens

### 4. Autorização
- **O que testa**: Verifica se rotas protegidas estão realmente protegidas
- **Como corrigir**: Garanta que todas as rotas sensíveis usem `ProtectedRoute`

### 5. Validação de Inputs
- **O que testa**: Testa se formulários rejeitam dados maliciosos
- **Como corrigir**: Adicione validação rigorosa e sanitização

### 6. Security Headers
- **O que testa**: Verifica headers HTTP de segurança
- **Como corrigir**: Configure headers no servidor (CSP, X-Frame-Options, etc.)

### 7. Rate Limiting
- **O que testa**: Verifica proteção contra brute force
- **Como corrigir**: Configure rate limiting no Supabase Dashboard

### 8. LocalStorage Security
- **O que testa**: Verifica se dados sensíveis estão no storage
- **Como corrigir**: Não armazene senhas ou tokens não criptografados

## 🚨 Vulnerabilidades Comuns e Soluções

### 1. XSS (Cross-Site Scripting)

**Problema**: Dados do usuário renderizados sem sanitização

**Solução**:
```typescript
import DOMPurify from 'dompurify';

// Sanitizar antes de renderizar
const safeHtml = DOMPurify.sanitize(userInput);
```

### 2. CSRF (Cross-Site Request Forgery)

**Problema**: Requisições podem ser feitas de sites externos

**Solução**: O Supabase já protege contra CSRF, mas você pode adicionar:
- Tokens CSRF
- SameSite cookies
- Verificação de origem

### 3. SQL Injection

**Status**: ✅ **PROTEGIDO** - O Supabase usa prepared statements

**Nota**: Não é possível fazer SQL injection através do Supabase client.

### 4. Exposição de Dados Sensíveis

**Problema**: Dados sensíveis no localStorage ou código fonte

**Solução**:
- Use variáveis de ambiente
- Não armazene senhas
- Criptografe dados sensíveis se necessário

### 5. Autenticação Fraca

**Problema**: Senhas fracas ou sem validação

**Solução**:
```typescript
// Adicione validação de senha forte
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
if (!passwordRegex.test(password)) {
  throw new Error('Senha deve ter pelo menos 8 caracteres, incluindo maiúsculas, minúsculas, números e símbolos');
}
```

## 📋 Checklist de Segurança

Antes de colocar em produção, verifique:

- [ ] Todas as rotas sensíveis estão protegidas
- [ ] Variáveis de ambiente configuradas (não hardcoded)
- [ ] Rate limiting configurado no Supabase
- [ ] RLS (Row Level Security) habilitado nas tabelas
- [ ] Headers de segurança configurados no servidor
- [ ] Validação de inputs em todos os formulários
- [ ] Sanitização de dados do usuário
- [ ] Logs de segurança configurados
- [ ] Backup e recuperação de dados
- [ ] Plano de resposta a incidentes

## 🔧 Melhorias Recomendadas

### 1. Adicionar Sanitização de HTML

```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

```typescript
import DOMPurify from 'dompurify';

function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [] 
  });
}
```

### 2. Adicionar Content Security Policy

Configure no servidor ou no `index.html`:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline' https://*.supabase.co; style-src 'self' 'unsafe-inline';">
```

### 3. Configurar Headers de Segurança

No servidor (Vite preview ou produção):

```javascript
// vite.config.ts
export default {
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    }
  }
}
```

### 4. Adicionar Logging de Segurança

```typescript
import { saveLog } from '@/lib/logsService';

// Log tentativas de login falhadas
if (error) {
  await saveLog({
    nivel: 'warning',
    modulo: 'AUTH',
    mensagem: 'Tentativa de login falhada',
    dados: { email, timestamp: new Date() },
  });
}
```

## 📚 Recursos Adicionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/auth/security)
- [React Security Best Practices](https://reactjs.org/docs/dom-elements.html#security)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

## 🆘 Em Caso de Incidente

1. **Isole o sistema**: Desative funcionalidades afetadas
2. **Analise logs**: Verifique logs de segurança
3. **Notifique usuários**: Se dados foram comprometidos
4. **Corrija vulnerabilidades**: Aplique patches
5. **Monitore**: Aumente monitoramento por 48h

## 📞 Contato

Em caso de vulnerabilidades críticas encontradas, entre em contato com a equipe de segurança.

---

**Última atualização**: 2024
**Versão**: 1.0


