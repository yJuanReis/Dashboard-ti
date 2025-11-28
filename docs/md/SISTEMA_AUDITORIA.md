# Sistema de Auditoria Completo

Este documento descreve o sistema de auditoria implementado no dashboard, incluindo todos os eventos rastreados, como acessar os logs e como configurar políticas de retenção.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Eventos Auditados](#eventos-auditados)
3. [Estrutura dos Logs](#estrutura-dos-logs)
4. [Dashboard de Auditoria](#dashboard-de-auditoria)
5. [Alertas de Segurança](#alertas-de-segurança)
6. [Políticas RLS](#políticas-rls)
7. [Retenção de Logs](#retenção-de-logs)
8. [Como Usar](#como-usar)

## 🔍 Visão Geral

O sistema de auditoria registra todas as ações importantes realizadas no sistema, incluindo:

- ✅ Visualizações e cópias de senhas
- ✅ Login e logout de usuários
- ✅ Operações administrativas (criar/editar/deletar usuários)
- ✅ Mudanças de permissões e roles
- ✅ Exportações de dados
- ✅ Atividades suspeitas

### Características Principais

- **Logs Imutáveis**: Uma vez criados, os logs não podem ser modificados ou deletados
- **Append-Only**: Somente inserção de novos logs é permitida
- **Contexto Rico**: Cada log inclui IP, user agent, dispositivo, timestamp
- **Alertas Automáticos**: Detecção de atividades suspeitas
- **Exportação**: Exportação de logs para CSV para análise externa
- **Retenção Configurável**: Políticas de retenção de 1 ano (customizável)

## 📊 Eventos Auditados

### Senhas

```typescript
PASSWORD_CREATED     // Senha criada
PASSWORD_VIEWED      // Senha visualizada (olho clicado)
PASSWORD_COPIED      // Senha copiada para clipboard
PASSWORD_UPDATED     // Senha atualizada
PASSWORD_DELETED     // Senha excluída
PASSWORD_EXPORTED    // Senhas exportadas para CSV
```

### Usuários

```typescript
USER_LOGIN               // Login bem-sucedido
USER_LOGOUT              // Logout
USER_LOGIN_FAILED        // Tentativa de login falhada
USER_CREATED             // Novo usuário criado (por admin)
USER_UPDATED             // Usuário atualizado
USER_DELETED             // Usuário removido
USER_ROLE_CHANGED        // Role alterada (user ↔ admin)
USER_PERMISSIONS_CHANGED // Permissões de páginas alteradas
```

### Sessões

```typescript
SESSION_EXPIRED   // Sessão expirada
SESSION_TIMEOUT   // Sessão timeout
```

### Segurança

```typescript
RATE_LIMIT_EXCEEDED  // Limite de requisições excedido
SUSPICIOUS_ACTIVITY  // Atividade suspeita detectada
```

## 📝 Estrutura dos Logs

Cada log de auditoria contém:

```typescript
{
  id: string;                     // UUID do log
  action_type: 'CREATE'|'UPDATE'|'DELETE'; // Tipo genérico
  action: AuditAction;            // Ação específica (ex: PASSWORD_VIEWED)
  table_name: string;             // Tabela afetada
  record_id: string;              // ID do registro afetado
  user_id: string;                // UUID do usuário
  user_email: string;             // Email do usuário
  user_name: string;              // Nome do usuário
  old_data?: object;              // Dados antes da alteração
  new_data?: object;              // Dados após a alteração
  changed_fields?: string[];      // Campos alterados
  description: string;            // Descrição legível
  ip_address: string;             // IP do usuário
  user_agent: string;             // User agent do navegador
  device: 'Desktop'|'Mobile'|'Tablet'; // Tipo de dispositivo
  location?: string;              // Localização (se disponível)
  created_at: string;             // Timestamp ISO8601
}
```

### Campos Sensíveis

Os seguintes campos são automaticamente redact (ocultados) nos logs:

- `password`
- `senha`
- `token`
- `secret`
- `api_key`
- `apikey`

Estes aparecem como `***REDACTED***` nos logs.

## 🎛️ Dashboard de Auditoria

Acessível apenas para **administradores** em:

```
/audit-logs
```

### Recursos do Dashboard

1. **Visualização de Logs**
   - Tabela paginada com todos os logs
   - 50 registros por página
   - Detalhes completos em modal

2. **Filtros Avançados**
   - Por ID de usuário
   - Por tipo de ação (CREATE/UPDATE/DELETE)
   - Por tabela
   - Por intervalo de datas

3. **Exportação**
   - Exportar logs filtrados para CSV
   - Inclui todos os campos relevantes

4. **Alertas de Segurança**
   - Exibição de alertas no topo do dashboard
   - Códigos de cor por severidade (baixa/média/alta)

### Capturas de Tela

```
┌─────────────────────────────────────────────────┐
│ Logs de Auditoria                    🔄 📥 Export│
├─────────────────────────────────────────────────┤
│ 🚨 Alertas de Segurança                         │
│   ⚠️ 5 tentativas de login falhadas (ALTA)     │
├─────────────────────────────────────────────────┤
│ 🔍 Filtros                                       │
│   Usuário: [_______] Ação: [Todas ▼]           │
│   Data Início: [________] Data Fim: [________]  │
├─────────────────────────────────────────────────┤
│ Data/Hora │ Usuário │ Ação │ Tabela │ Desc...  │
│ 28/11 15:30│ João    │ VIEW │ passwords│...     │
│ 28/11 15:29│ Maria   │ LOGIN│ users    │...     │
│ ...                                              │
└─────────────────────────────────────────────────┘
```

## 🚨 Alertas de Segurança

O sistema detecta automaticamente atividades suspeitas:

### 1. Múltiplos Logins Falhados

- **Condição**: ≥5 falhas nas últimas 24h
- **Severidade**: Alta
- **Ação**: Alerta no dashboard + possível bloqueio de conta

### 2. Acessos de Múltiplos IPs

- **Condição**: >2 IPs diferentes na última hora
- **Severidade**: Média
- **Ação**: Alerta no dashboard

### 3. Exclusão em Massa

- **Condição**: ≥10 registros deletados em 5 minutos
- **Severidade**: Alta
- **Ação**: Alerta no dashboard

### 4. Mudanças de Permissões Críticas

- **Condição**: Mudança de role para admin
- **Severidade**: Média/Alta
- **Ação**: Log específico + alerta

## 🔒 Políticas RLS

As políticas de Row Level Security garantem a integridade dos logs:

### Política 1: INSERT (Permitido)

```sql
-- Qualquer usuário autenticado pode inserir logs
CREATE POLICY "Usuários autenticados podem inserir logs"
  ON audit_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
```

### Política 2: UPDATE (Bloqueado)

```sql
-- Ninguém pode atualizar logs
CREATE POLICY "Logs são imutáveis - sem UPDATE"
  ON audit_logs FOR UPDATE TO authenticated
  USING (false);
```

### Política 3: DELETE (Bloqueado)

```sql
-- Ninguém pode deletar logs
CREATE POLICY "Logs são imutáveis - sem DELETE"
  ON audit_logs FOR DELETE TO authenticated
  USING (false);
```

### Política 4: SELECT (Apenas Admins)

```sql
-- Apenas admins podem ler logs
CREATE POLICY "Apenas admins podem ler logs"
  ON audit_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

## ⏰ Retenção de Logs

### Política Padrão: 1 Ano

Logs com mais de 1 ano (365 dias) são automaticamente deletados.

### Configuração

Execute o script `sql/audit_logs_retention_policy.sql` no Supabase SQL Editor para:

1. Criar funções de limpeza
2. Configurar job agendado (requer `pg_cron`)
3. Criar view de estatísticas

### Funções Disponíveis

#### Limpeza Automática (1 ano)

```sql
SELECT cleanup_old_audit_logs();
```

#### Limpeza Customizada

```sql
-- Remover logs com mais de 180 dias
SELECT cleanup_audit_logs_by_retention(180);
```

#### Arquivamento (Alternativa)

```sql
-- Mover logs antigos para tabela de arquivo
SELECT archive_old_audit_logs();
```

### Monitoramento

Use a view de estatísticas para monitorar:

```sql
SELECT * FROM audit_logs_retention_stats;
```

Retorna:
- Total de logs
- Logs por período (7d, 30d, 90d, 1 ano)
- Logs candidatos à exclusão
- Log mais antigo e mais recente
- Tamanho da tabela

### Job Agendado (Opcional)

Se `pg_cron` estiver habilitado:

```sql
-- Executar limpeza todo dia às 2h AM
SELECT cron.schedule(
  'cleanup-old-audit-logs',
  '0 2 * * *',
  $$SELECT cleanup_old_audit_logs();$$
);
```

## 📚 Como Usar

### 1. Configuração Inicial

Execute os scripts SQL no Supabase:

```bash
# 1. Criar tabela (se ainda não existir)
sql/create_audit_logs_table.sql

# 2. Configurar RLS
sql/audit_logs_rls_policies.sql

# 3. Configurar retenção
sql/audit_logs_retention_policy.sql
```

### 2. Acessando o Dashboard

Como **administrador**:

1. Faça login no dashboard
2. Navegue para `/audit-logs`
3. Use os filtros para buscar logs específicos
4. Clique em um log para ver detalhes completos
5. Exporte para CSV se necessário

### 3. Registro Manual de Auditoria

No código, use:

```typescript
import { logAction, AuditAction } from '@/lib/auditService';

// Registrar ação específica
await logAction(
  AuditAction.PASSWORD_VIEWED,
  passwordId,
  `Senha visualizada: ${password.service}`,
  { service: password.service, category: password.category }
);

// Registrar com CREATE/UPDATE/DELETE genérico
await logCreate('passwords', passwordId, newData);
await logUpdate('passwords', passwordId, oldData, newData);
await logDelete('passwords', passwordId, oldData);
```

### 4. Verificar Atividades Suspeitas

```typescript
import { checkSuspiciousActivity } from '@/lib/auditService';

const result = await checkSuspiciousActivity(userId);
if (result.hasAlerts) {
  // Exibir alertas ao admin
  console.log(result.alerts);
}
```

### 5. Exportar Logs

```typescript
import { exportLogsToCSV } from '@/lib/auditService';

// Exportar últimos 30 dias
const csv = await exportLogsToCSV({
  start_date: new Date(Date.now() - 30*24*60*60*1000).toISOString()
});

// Baixar arquivo
const blob = new Blob([csv], { type: 'text/csv' });
// ... criar link e download
```

## 🔐 Segurança e Compliance

### LGPD / GDPR

O sistema de auditoria ajuda com compliance:

- ✅ Rastreabilidade de acesso a dados pessoais
- ✅ Registro de quem acessou/modificou dados
- ✅ Retenção configurável conforme política da empresa
- ✅ Exportação para auditorias externas

### Boas Práticas

1. **Revisar logs regularmente** (semanalmente)
2. **Investigar alertas de segurança** imediatamente
3. **Exportar logs mensalmente** para backup externo
4. **Manter retenção mínima de 1 ano** (ou conforme legislação)
5. **Limitar acesso ao dashboard** apenas para admins

### Auditoria de Auditores

Lembre-se: Os próprios admins também são auditados! Todas as ações no dashboard de auditoria são registradas.

## 🛠️ Troubleshooting

### Logs não aparecem no dashboard

1. Verificar RLS: `SELECT * FROM audit_logs;` (como admin)
2. Verificar se usuário tem role 'admin' na tabela `user_profiles`
3. Verificar console do navegador por erros

### Job de limpeza não funciona

1. Verificar se `pg_cron` está habilitado
2. Verificar jobs: `SELECT * FROM cron.job;`
3. Ver log de execuções: `SELECT * FROM cron.job_run_details;`

### Performance lenta

1. Verificar índices: `\d audit_logs` no psql
2. Executar `VACUUM ANALYZE audit_logs;`
3. Considerar arquivamento de logs antigos

## 📞 Suporte

Para questões sobre o sistema de auditoria, consulte:

- Este documento
- `src/lib/auditService.ts` (código fonte)
- `CHECKLIST_SEGURANCA.md` (item 11)

---

**Última atualização**: 28 de Novembro de 2024
**Versão**: 1.0.0

