# Instruções para Configurar o Serviço de IP

## 📋 Resumo

Este documento explica como configurar o serviço melhorado de obtenção de IP no sistema.

## ✅ Implementações Concluídas

### 1. Função RPC no Supabase (`get_client_ip`)

**Arquivo:** `docs/sql/get_client_ip_function.sql`

Esta função extrai o IP do cliente dos headers da requisição HTTP, suportando múltiplos headers comuns:
- `x-forwarded-for` (usado pelo Vercel e outros proxies)
- `x-real-ip` (usado pelo nginx)
- `cf-connecting-ip` (usado pelo Cloudflare)
- `true-client-ip` (usado por alguns CDNs)

### 2. Serviço no Frontend (`ipService.ts`)

**Arquivo:** `src/lib/ipService.ts`

Implementa uma estratégia robusta de obtenção de IP:

#### Ordem de Tentativas:
1. **Backend (Supabase RPC)** - Tenta obter do backend primeiro
2. **api.ipify.org** - Serviço confiável e rápido
3. **api.ip.sb** - Alternativa com boa disponibilidade
4. **ipapi.co** - Terceira opção de fallback

#### Recursos:
- ✅ Cache durante a sessão (variável `cachedIP`)
- ✅ Validação de IP (IPv4 e IPv6)
- ✅ Timeout de 5 segundos por serviço
- ✅ Logging detalhado para debug
- ✅ Retorna 'unknown' se nenhum método funcionar

#### Funções Disponíveis:

```typescript
// Obtém o IP (usa cache se disponível)
const ip = await getUserIP();

// Limpa o cache de IP
clearIPCache();

// Obtém o IP sem usar cache (força nova busca)
const freshIP = await getUserIPFresh();
```

### 3. Atualizações nos Arquivos

#### `src/lib/auditService.ts`
- ✅ Removida função local `getUserIP()`
- ✅ Importa `getUserIP` de `ipService.ts`

#### `src/pages/Configuracoes.tsx`
- ✅ Removida função local `getUserIP()`
- ✅ Importa `getUserIP` de `ipService.ts`
- ✅ Todas as chamadas agora usam o novo serviço

#### `src/hooks/use-logout.ts`
- ✅ Importa `clearIPCache` de `ipService.ts`
- ✅ Limpa o cache de IP ao fazer logout

#### `vite.config.ts`
- ✅ Adicionado `https://api.ip.sb` ao CSP
- ✅ Adicionado `https://ipapi.co` ao CSP

## 🔧 Configuração Necessária

### Passo 1: Executar SQL no Supabase

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Abra o arquivo `docs/sql/get_client_ip_function.sql`
4. Copie todo o conteúdo do arquivo
5. Cole no SQL Editor
6. Clique em **RUN** para executar

### Passo 2: Verificar Permissões

A função já inclui a permissão para usuários autenticados:

```sql
GRANT EXECUTE ON FUNCTION get_client_ip() TO authenticated;
```

### Passo 3: Testar a Função

Execute no SQL Editor para testar:

```sql
SELECT get_client_ip();
```

**Resultado esperado:**
- Se executado via API/HTTP: retorna o IP do cliente
- Se executado diretamente no SQL Editor: pode retornar `NULL` (normal, pois não há headers HTTP)

## 🧪 Testes

### Teste Local

1. Execute a aplicação localmente:
   ```bash
   npm run dev
   ```

2. Abra o console do navegador (F12)

3. Execute:
   ```javascript
   // No console do navegador (se tiver acesso ao módulo)
   // Ou verifique os logs no console ao fazer login
   ```

4. Verifique os logs para ver qual método obteve o IP:
   - `IP obtido do backend: xxx.xxx.xxx.xxx`
   - `IP obtido de serviço externo: xxx.xxx.xxx.xxx`

### Teste em Produção (Vercel)

1. Faça o deploy no Vercel

2. Acesse a aplicação

3. Verifique os logs do navegador

4. O header `x-forwarded-for` deve ser capturado pelo backend

## 🔍 Debug

### Ver Logs do Serviço

O serviço usa o logger do sistema. Para ver os logs:

1. Abra o console do navegador (F12)
2. Filtre por "IP" ou "ipService"
3. Verifique as mensagens:
   - `Tentando obter IP do backend...`
   - `IP obtido do backend: xxx`
   - `Tentando obter IP de serviços externos...`
   - `IP obtido de [serviço]: xxx`

### Problemas Comuns

#### 1. Backend não retorna IP

**Sintoma:** Logs mostram "Tentando obter IP de serviços externos..." logo após tentar o backend

**Possíveis causas:**
- Função RPC não foi executada no Supabase
- Função RPC não tem permissões corretas
- Headers HTTP não disponíveis

**Solução:**
- Verifique se executou o SQL no Supabase
- Teste a função diretamente no SQL Editor
- Verifique os logs do Supabase Functions

#### 2. Serviços externos falham

**Sintoma:** IP retorna 'unknown'

**Possíveis causas:**
- Problemas de rede/firewall
- CSP bloqueando conexões
- Todos os serviços indisponíveis

**Solução:**
- Verifique o CSP no `vite.config.ts`
- Teste cada serviço manualmente:
  - https://api.ipify.org?format=json
  - https://api.ip.sb/jsonip
  - https://ipapi.co/json/

#### 3. Cache não limpa ao fazer logout

**Sintoma:** IP continua o mesmo após trocar de rede

**Solução:**
- Verifique se `clearIPCache()` está sendo chamado no `use-logout.ts`
- Force limpeza manual com `getUserIPFresh()`

## 📊 Monitoramento

### Métricas Importantes

1. **Taxa de sucesso do backend**
   - Quantas vezes o backend retorna o IP com sucesso
   - Meta: > 90% em produção

2. **Taxa de sucesso total**
   - Quantas vezes conseguimos obter um IP (backend ou fallback)
   - Meta: > 99%

3. **Tempo de resposta**
   - Tempo médio para obter o IP
   - Meta: < 1 segundo (com cache), < 3 segundos (sem cache)

### Logs de Auditoria

Todos os IPs obtidos são registrados nos logs de auditoria:
- Tabela: `audit_logs`
- Campo: `ip_address`

Para verificar:

```sql
SELECT 
  ip_address, 
  COUNT(*) as count,
  MIN(created_at) as first_seen,
  MAX(created_at) as last_seen
FROM audit_logs
WHERE ip_address IS NOT NULL
GROUP BY ip_address
ORDER BY count DESC;
```

## 🚀 Próximos Passos

1. ✅ Executar SQL no Supabase
2. ✅ Testar localmente
3. ✅ Deploy para produção
4. ✅ Monitorar logs por 1 semana
5. ✅ Ajustar timeout/serviços conforme necessário
6. ✅ Considerar adicionar mais serviços de fallback se necessário

## 📝 Notas Adicionais

- O cache de IP é apenas em memória (não persiste entre recargas da página)
- O cache é limpo automaticamente ao fazer logout
- A função RPC é SECURITY DEFINER (executa com privilégios do criador)
- Todos os dados sensíveis são sanitizados antes de ir para os logs

