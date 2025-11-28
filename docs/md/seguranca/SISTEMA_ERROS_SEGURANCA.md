# Sistema de Erros com Segurança

## Visão Geral

Este documento descreve o sistema de gerenciamento de erros implementado para melhorar a segurança da aplicação, incluindo:

- ✅ **Sistema de erro com níveis** (user/technical/security)
- ✅ **Mensagens específicas mas seguras**
- ✅ **Timing protection** para prevenir timing attacks
- ✅ **Rate limiting** e controle de tentativas
- ✅ **CAPTCHA** após múltiplas tentativas falhadas
- ✅ **Testes automatizados** de erro e timing

---

## Arquitetura

### 1. Error Service (`src/lib/errorService.ts`)

Serviço central para gerenciamento de erros com recursos de segurança:

```typescript
type ErrorLevel = 'user' | 'technical' | 'security';

interface AppError {
  userMessage: string;      // Mensagem segura para o usuário
  technicalMessage: string; // Mensagem técnica para logs
  code: string;            // Código único do erro
  level: ErrorLevel;       // Nível de gravidade
  timestamp?: number;      // Timestamp da ocorrência
}
```

### 2. Catálogo de Erros

#### Erros de Autenticação

| Código | Nível | Descrição |
|--------|-------|-----------|
| AUTH001 | user | Credenciais inválidas |
| AUTH002 | security | Conta bloqueada |
| AUTH003 | user | Sessão expirada |
| AUTH004 | user | Email não verificado |
| AUTH005 | user | Senha muito fraca |
| AUTH006 | user | Email inválido |
| AUTH007 | security | CAPTCHA necessário |
| AUTH008 | security | CAPTCHA falhou |
| AUTH009 | security | Rate limit excedido |
| AUTH010 | technical | Erro de rede |
| AUTH999 | technical | Erro desconhecido |

#### Erros de Validação

| Código | Nível | Descrição |
|--------|-------|-----------|
| VAL001 | user | Campo obrigatório |
| VAL002 | user | Formato inválido |
| VAL003 | user | Tamanho mínimo |
| VAL004 | user | Tamanho máximo |

---

## Recursos de Segurança

### 1. Timing Protection

Previne **timing attacks** garantindo que operações de sucesso e falha tenham duração similar:

```typescript
// Wrapper automático com proteção
const result = await withTimingProtection(async () => {
  return await performSensitiveOperation();
});
```

**Configurações:**
- Tempo mínimo: 1000ms (1 segundo)
- Delay aleatório: 0-500ms
- Aplicado automaticamente em: login, validação de senha, etc.

### 2. Rate Limiting

Controla tentativas de login por email:

```typescript
// Registrar tentativa falhada
recordLoginAttempt(email);

// Verificar se está bloqueado
if (isLocked(email)) {
  const minutes = getLockoutTimeRemaining(email);
  // Bloquear por X minutos
}

// Verificar se precisa CAPTCHA
if (shouldRequireCaptcha(email)) {
  // Exigir CAPTCHA
}
```

**Limites:**
- 3 tentativas = CAPTCHA obrigatório
- Bloqueio de 5 minutos após limite
- Limpeza automática de tentativas antigas

### 3. CAPTCHA Integrado

Google reCAPTCHA v2 é exigido automaticamente:

```typescript
// No AuthContext
const requiresCaptcha = (email: string) => boolean;

// No Login
if (requiresCaptcha(email)) {
  // Mostrar CAPTCHA
}

// Passar token no login
await signIn(email, password, captchaToken);
```

**Configuração:**

Adicione no `.env`:
```bash
VITE_RECAPTCHA_SITE_KEY=sua_chave_publica
```

Obtenha chaves em: https://www.google.com/recaptcha/admin

### 4. Mensagens Seguras

As mensagens para usuários **nunca** revelam detalhes técnicos:

❌ **ERRADO:**
- "Usuário não encontrado no banco de dados"
- "Token JWT expirado após 3600 segundos"
- "Query SQL falhou: syntax error"

✅ **CORRETO:**
- "Email ou senha incorretos"
- "Sua sessão expirou. Faça login novamente"
- "Ocorreu um erro. Tente novamente mais tarde"

---

## Uso

### No Componente de Login

```tsx
import { useAuth } from '@/contexts/AuthContext';

function LoginForm() {
  const { signIn, requiresCaptcha } = useAuth();
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const showCaptcha = requiresCaptcha(email);

  const handleSubmit = async () => {
    try {
      await signIn(email, password, captchaToken || undefined);
      // Sucesso
    } catch (error) {
      // Erro já tratado e exibido
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={...} />
      <input type="password" value={password} onChange={...} />
      
      {showCaptcha && (
        <ReCAPTCHA
          sitekey={RECAPTCHA_SITE_KEY}
          onChange={setCaptchaToken}
        />
      )}
      
      <button type="submit">Entrar</button>
    </form>
  );
}
```

### Criando Novos Erros

```typescript
import { createError, AUTH_ERRORS } from '@/lib/errorService';

// Erro simples
throw createError(AUTH_ERRORS.INVALID_CREDENTIALS);

// Erro com contexto (para logs)
throw createError(AUTH_ERRORS.ACCOUNT_LOCKED, {
  email: user.email,
  attempts: 5,
  timestamp: Date.now()
});
```

### Mapeando Erros Externos

```typescript
import { mapSupabaseError } from '@/lib/errorService';

try {
  await supabase.auth.signIn(...);
} catch (error) {
  const appError = mapSupabaseError(error);
  toast.error(appError.userMessage);
}
```

---

## Testes

### 1. Testes Unitários

```bash
# Executar todos os testes
npm test

# Testes específicos do errorService
npm test errorService.test.ts
```

Os testes cobrem:
- ✅ Timing protection e consistência
- ✅ Rate limiting e bloqueios
- ✅ Criação e mapeamento de erros
- ✅ Validação de mensagens seguras
- ✅ Performance e timing consistency

### 2. Validação de Timing

Script para validar que o timing está consistente:

```bash
# Executar validação manual
node src/lib/__tests__/timing-validation.ts
```

**Relatório gerado:**
```
📊 RELATÓRIO DE VALIDAÇÃO DE TIMING
======================================================================

SUCCESSFUL LOGIN
--------------------------------------------------
  Tentativas: 10
  Média: 1234.56ms
  Mínimo: 1056ms
  Máximo: 1489ms
  Desvio Padrão: 123.45ms
  Variação: 35.12%

FAILED LOGIN
--------------------------------------------------
  Tentativas: 10
  Média: 1245.32ms
  Mínimo: 1067ms
  Máximo: 1502ms
  Desvio Padrão: 128.90ms
  Variação: 34.89%

🔍 ANÁLISE DE CONSISTÊNCIA
======================================================================

  Média Login Sucesso: 1234.56ms
  Média Login Falha: 1245.32ms
  Diferença: 10.76ms (0.87%)
  ✅ EXCELENTE: Timing muito consistente (< 5% diferença)

🔒 VALIDAÇÕES DE SEGURANÇA
======================================================================

  ✅ Tempo mínimo respeitado (>= 1000ms)
  ✅ Delay aleatório funcionando corretamente
  ✅ Nenhuma operação suspeita detectada
```

### 3. Testes Manuais

#### Cenário 1: Login com Credenciais Inválidas
1. Acesse `/login`
2. Digite email e senha incorretos
3. Clique em "Entrar"
4. **Esperado:** Mensagem "Email ou senha incorretos" após ~1 segundo

#### Cenário 2: Bloqueio por Múltiplas Tentativas
1. Tente login com senha errada 3 vezes
2. **Esperado:** CAPTCHA aparece na 3ª tentativa
3. Tente novamente sem CAPTCHA
4. **Esperado:** Mensagem "Complete a verificação de segurança"

#### Cenário 3: Timing Consistency
1. Abra DevTools > Network
2. Faça login com credenciais corretas
3. Anote o tempo de resposta
4. Faça login com credenciais incorretas
5. Anote o tempo de resposta
6. **Esperado:** Tempos similares (diferença < 200ms)

---

## Métricas de Segurança

### Indicadores de Sucesso

✅ **Timing Protection:**
- Diferença entre sucesso/falha < 5%
- Tempo mínimo sempre respeitado (≥ 1000ms)
- Delay aleatório funcionando (variação > 100ms)

✅ **Rate Limiting:**
- 0 logins sem CAPTCHA após 3 tentativas
- Bloqueios aplicados corretamente
- Limpeza automática funcionando

✅ **Mensagens Seguras:**
- 0 mensagens técnicas expostas ao usuário
- 100% dos erros mapeados corretamente
- Logs técnicos preservados para debug

---

## Troubleshooting

### CAPTCHA não aparece

**Problema:** CAPTCHA não é exibido após 3 tentativas

**Solução:**
1. Verificar se `VITE_RECAPTCHA_SITE_KEY` está configurado
2. Verificar console do navegador por erros
3. Verificar se `react-google-recaptcha` está instalado

### Timing inconsistente

**Problema:** Tempos muito diferentes entre sucesso/falha

**Solução:**
1. Executar `timing-validation.ts` para análise
2. Verificar se operações assíncronas estão dentro do `withTimingProtection`
3. Revisar configurações em `errorService.ts`

### Rate limiting não funciona

**Problema:** Múltiplas tentativas não bloqueiam

**Solução:**
1. Verificar se `recordLoginAttempt` está sendo chamado
2. Verificar localStorage/cache do navegador
3. Verificar se identificador (email) está consistente

---

## Próximos Passos

### Melhorias Futuras

1. **Backend Validation**
   - Implementar rate limiting no servidor
   - Validar tokens CAPTCHA no backend
   - Sincronizar tentativas entre sessões

2. **Monitoramento**
   - Dashboard de tentativas de login
   - Alertas automáticos para ataques
   - Métricas de timing em produção

3. **User Experience**
   - Countdown visual para desbloqueio
   - Notificação por email de bloqueio
   - Opção de recuperação via 2FA

---

## Referências

- [OWASP - Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Timing Attacks](https://en.wikipedia.org/wiki/Timing_attack)
- [Google reCAPTCHA](https://www.google.com/recaptcha/about/)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

---

## Contato

Para dúvidas ou sugestões sobre o sistema de erros de segurança, consulte a documentação ou abra uma issue.

**Última atualização:** 28/11/2025
**Versão:** 1.0.0

