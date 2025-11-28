# Variáveis de Ambiente

## Arquivo `.env`

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```bash
# ============================================
# CONFIGURAÇÃO DO SUPABASE
# ============================================
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# ============================================
# CONFIGURAÇÃO DO GOOGLE reCAPTCHA v2
# ============================================
# Obtenha suas chaves em: https://www.google.com/recaptcha/admin
# 
# IMPORTANTE:
# - Use reCAPTCHA v2 (não v3)
# - Adicione seus domínios na configuração
# - Para desenvolvimento local, adicione: localhost
# 
# Chave de teste (funciona apenas em localhost):
# VITE_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
#
VITE_RECAPTCHA_SITE_KEY=your-recaptcha-site-key-here

# ============================================
# CONFIGURAÇÃO DE SEGURANÇA (OPCIONAL)
# ============================================
# Tempo mínimo para operações de autenticação (ms)
# VITE_AUTH_MIN_DURATION=1000

# Máximo de delay aleatório adicional (ms)
# VITE_AUTH_MAX_RANDOM_DELAY=500

# Número de tentativas antes de exigir CAPTCHA
# VITE_AUTH_LOCKOUT_THRESHOLD=3

# Duração do bloqueio após múltiplas tentativas (ms)
# VITE_AUTH_LOCKOUT_DURATION=300000

# ============================================
# MODO DE DESENVOLVIMENTO
# ============================================
# NODE_ENV=development
```

## Variáveis Obrigatórias

### `VITE_SUPABASE_URL`
- **Descrição:** URL do seu projeto Supabase
- **Exemplo:** `https://abcdefghijklm.supabase.co`
- **Onde obter:** Dashboard do Supabase > Settings > API

### `VITE_SUPABASE_ANON_KEY`
- **Descrição:** Chave anônima pública do Supabase
- **Exemplo:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Onde obter:** Dashboard do Supabase > Settings > API

### `VITE_RECAPTCHA_SITE_KEY`
- **Descrição:** Chave pública do Google reCAPTCHA v2
- **Exemplo:** `6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
- **Onde obter:** https://www.google.com/recaptcha/admin
- **Documentação:** Ver `docs/md/CONFIGURACAO_RECAPTCHA.md`

## Variáveis Opcionais

Estas variáveis têm valores padrão e geralmente não precisam ser alteradas:

### `VITE_AUTH_MIN_DURATION`
- **Padrão:** 1000 (1 segundo)
- **Descrição:** Tempo mínimo para operações de autenticação (timing protection)

### `VITE_AUTH_MAX_RANDOM_DELAY`
- **Padrão:** 500 (500ms)
- **Descrição:** Delay aleatório máximo adicional

### `VITE_AUTH_LOCKOUT_THRESHOLD`
- **Padrão:** 3
- **Descrição:** Número de tentativas falhadas antes de exigir CAPTCHA

### `VITE_AUTH_LOCKOUT_DURATION`
- **Padrão:** 300000 (5 minutos)
- **Descrição:** Duração do bloqueio após exceder tentativas

## Segurança

⚠️ **IMPORTANTE:**

1. **NUNCA** commite o arquivo `.env` no Git
2. O arquivo `.env` está no `.gitignore`
3. **NUNCA** exponha suas chaves em código público
4. Use chaves diferentes para desenvolvimento e produção
5. Rotacione chaves periodicamente em produção

## Troubleshooting

### Erro: "Missing environment variables"

**Solução:**
1. Criar arquivo `.env` na raiz do projeto
2. Copiar template acima
3. Preencher com suas chaves
4. Reiniciar o servidor de desenvolvimento

### Variáveis não são carregadas

**Solução:**
1. Verificar se o arquivo se chama `.env` (não `.env.local` ou outro)
2. Verificar se está na raiz do projeto (mesmo nível que `package.json`)
3. Reiniciar completamente o servidor (`Ctrl+C` e `npm run dev`)
4. Verificar se as variáveis começam com `VITE_`

### CAPTCHA não funciona

**Solução:**
1. Verificar se `VITE_RECAPTCHA_SITE_KEY` está configurada
2. Verificar se a chave é válida para o domínio atual
3. Ver documentação completa em `docs/md/CONFIGURACAO_RECAPTCHA.md`

---

**Última atualização:** 28/11/2025

