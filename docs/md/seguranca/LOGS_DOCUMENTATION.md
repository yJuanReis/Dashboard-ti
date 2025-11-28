# 📋 Documentação do Sistema de Logs

## 📌 Visão Geral

Este documento explica como foi implementado o sistema de logs para o dashboard. O sistema permite salvar logs de operações no Supabase e visualizá-los na página de Configurações.

**Status Atual:** ⚠️ **EM DESENVOLVIMENTO** - Funcionalidade desabilitada temporariamente, mas código preservado para reativação futura.

---

## 🏗️ Arquitetura do Sistema

### Estrutura de Arquivos

```
src/
├── lib/
│   ├── logsService.ts          # Serviço principal de logs
│   └── supabaseClient.ts       # Cliente Supabase (já existente)
├── pages/
│   ├── Senhas.tsx              # Exemplo de integração (comentado)
│   └── Configuracoes.tsx       # Visualizador de logs (comentado)
└── supabase_logs_table.sql     # Script SQL para criar tabela
```

---

## 📦 Componentes do Sistema

### 1. **logsService.ts** - Serviço Principal

Localização: `src/lib/logsService.ts`

Este arquivo contém toda a lógica de salvamento e busca de logs.

#### Interface LogEntry

```typescript
interface LogEntry {
  id?: string;
  nivel: 'info' | 'success' | 'warning' | 'error';
  modulo: string;              // Ex: 'SENHAS', 'SUPABASE'
  mensagem: string;            // Mensagem do log
  dados?: Record<string, any>; // Dados adicionais em JSON
  timestamp?: string;          // Data/hora ISO
  usuario?: string;            // ID do usuário (opcional)
  stack?: string;              // Stack trace para erros
}
```

#### Funções Principais

##### `saveLog(entry: LogEntry)`
Salva um log no Supabase. Se falhar, apenas loga no console (não quebra a aplicação).

```typescript
await saveLog({
  nivel: 'info',
  modulo: 'SENHAS',
  mensagem: 'Carregando senhas...',
  dados: { count: 10 }
});
```

##### `logger` - Helper Object
Objeto com métodos convenientes para cada nível de log:

```typescript
// Info
logger.info('SENHAS', 'Carregando senhas...', { count: 10 });

// Success
logger.success('SENHAS', 'Senha adicionada!', { id: '123' });

// Warning
logger.warning('SENHAS', 'Tabela vazia', { causa: '...' });

// Error
logger.error('SENHAS', 'Erro ao salvar', { erro: '...' }, stackTrace);
```

**Características:**
- Automaticamente salva no Supabase
- Também mostra no console do navegador
- Não quebra a aplicação se falhar ao salvar
- Mascara senhas automaticamente (substitui por `***`)

##### `fetchLogs(options?)`
Busca logs do Supabase com filtros opcionais.

```typescript
// Buscar todos os logs
const logs = await fetchLogs();

// Buscar logs de um módulo específico
const senhasLogs = await fetchLogs({ modulo: 'SENHAS' });

// Buscar apenas erros
const errors = await fetchLogs({ 
  nivel: 'error', 
  limite: 50 
});

// Buscar com ordenação
const recentLogs = await fetchLogs({
  ordenarPor: 'timestamp',
  ordem: 'desc',
  limite: 100
});
```

---

### 2. **Tabela no Supabase**

Localização: `supabase_logs_table.sql`

#### Estrutura da Tabela

```sql
CREATE TABLE logs (
  id UUID PRIMARY KEY,
  nivel VARCHAR(20) NOT NULL,      -- 'info', 'success', 'warning', 'error'
  modulo VARCHAR(50) NOT NULL,     -- 'SENHAS', 'SUPABASE', etc.
  mensagem TEXT NOT NULL,
  dados JSONB,                      -- Dados adicionais em JSON
  timestamp TIMESTAMPTZ NOT NULL,
  usuario VARCHAR(255),             -- ID do usuário (opcional)
  stack TEXT,                       -- Stack trace para erros
  created_at TIMESTAMPTZ
);
```

#### Índices para Performance

```sql
CREATE INDEX idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX idx_logs_modulo ON logs(modulo);
CREATE INDEX idx_logs_nivel ON logs(nivel);
CREATE INDEX idx_logs_modulo_nivel ON logs(modulo, nivel);
```

#### Políticas RLS (Row Level Security)

As políticas permitem inserção e leitura para usuários autenticados. Ajuste conforme necessário.

---

## 🔌 Como Integrar nos Componentes

### Passo 1: Importar o Logger

```typescript
import { logger } from "@/lib/logsService";
```

### Passo 2: Usar nos Pontos de Interesse

#### Exemplo: Ao Adicionar uma Senha

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    // Log antes da operação
    logger.info('SENHAS', 'Adicionando nova senha', {
      tipo: selectedType,
      dados: {
        service: formData.service,
        // password é automaticamente mascarado
      }
    });

    // Executa a operação
    const result = await createPassword(formData);

    // Log de sucesso
    logger.success('SENHAS', 'Senha adicionada com sucesso!', {
      id: result.id,
      service: result.service
    });

  } catch (error: any) {
    // Log de erro
    logger.error('SENHAS', 'Erro ao adicionar senha', {
      erro: error?.message,
      tipo: selectedType
    }, error?.stack);
    
    toast.error('Erro ao adicionar senha');
  }
};
```

#### Exemplo: Ao Carregar Dados

```typescript
const loadData = async () => {
  try {
    setLoading(true);
    logger.info('SENHAS', 'Carregando senhas...');
    
    const data = await fetchPasswords();
    setPasswords(data);
    
    if (data.length === 0) {
      logger.warning('SENHAS', 'Nenhuma senha encontrada', {
        possiveisCausas: ['Tabela vazia', 'Erro de mapeamento']
      });
    } else {
      logger.success('SENHAS', `${data.length} senha(s) carregada(s)`);
    }
    
  } catch (error: any) {
    logger.error('SENHAS', 'Erro ao carregar senhas', {
      erro: error?.message
    }, error?.stack);
  } finally {
    setLoading(false);
  }
};
```

#### Exemplo: Em Operações do Supabase

```typescript
// No passwordsService.ts ou similar
export async function createPassword(entry: PasswordEntry) {
  try {
    // Log antes de inserir
    const logEntry = { ...mappedEntry };
    if (logEntry.password) {
      logEntry.password = '***'; // Mascara senha
    }
    
    logger.info('SUPABASE', 'Inserindo registro', {
      tabela: 'passwords',
      dados: logEntry
    });

    const { data, error } = await supabase
      .from('passwords')
      .insert(mappedEntry)
      .select()
      .single();

    if (error) {
      logger.error('SUPABASE', 'Erro ao inserir', {
        tabela: 'passwords',
        erro: error.message,
        codigo: error.code
      });
      throw error;
    }

    logger.success('SUPABASE', 'Registro inserido', {
      id: data.id,
      tabela: 'passwords'
    });

    return data;
  } catch (error) {
    logger.error('SUPABASE', 'Erro ao criar senha', {
      erro: error
    });
    throw error;
  }
}
```

---

## 🎨 Visualizador de Logs

### Localização
`src/pages/Configuracoes.tsx`

### Funcionalidades Implementadas

1. **Card Expansível**
   - Botão para mostrar/ocultar
   - Interface limpa e organizada

2. **Filtros**
   - Busca por texto (mensagem, módulo, dados)
   - Filtro por módulo (dropdown)
   - Filtro por nível (info, success, warning, error)

3. **Tabela de Logs**
   - Colunas: Nível, Módulo, Mensagem, Data/Hora, Ações
   - Badges coloridos por nível
   - Scroll vertical (máx. 600px)
   - Cabeçalho fixo

4. **Detalhes Expandíveis**
   - "Ver detalhes": mostra dados JSON formatados
   - "Ver stack trace": mostra stack trace de erros

5. **Ações**
   - Botão de copiar log (JSON completo)
   - Botão de atualizar com loading

### Como Implementar

```typescript
import { fetchLogs, type LogEntry } from "@/lib/logsService";

// Estados
const [logs, setLogs] = useState<LogEntry[]>([]);
const [loadingLogs, setLoadingLogs] = useState(false);
const [filtroModulo, setFiltroModulo] = useState<string>("");
const [filtroNivel, setFiltroNivel] = useState<LogEntry['nivel'] | "">("");
const [buscaLogs, setBuscaLogs] = useState("");

// Carregar logs
const carregarLogs = async () => {
  try {
    setLoadingLogs(true);
    const logsData = await fetchLogs({
      modulo: filtroModulo || undefined,
      nivel: filtroNivel || undefined,
      limite: 100,
      ordenarPor: 'timestamp',
      ordem: 'desc',
    });
    setLogs(logsData);
  } catch (error) {
    console.error('Erro ao carregar logs:', error);
    toast.error('Erro ao carregar logs');
  } finally {
    setLoadingLogs(false);
  }
};

// Filtrar logs pela busca
const logsFiltrados = logs.filter(log => {
  if (!buscaLogs) return true;
  const busca = buscaLogs.toLowerCase();
  return (
    log.mensagem.toLowerCase().includes(busca) ||
    log.modulo.toLowerCase().includes(busca) ||
    JSON.stringify(log.dados || {}).toLowerCase().includes(busca)
  );
});
```

---

## 🚀 Como Reativar o Sistema

### Passo 1: Criar a Tabela no Supabase

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Execute o conteúdo do arquivo `supabase_logs_table.sql`
4. Verifique se a tabela foi criada corretamente

### Passo 2: Reativar os Imports

#### Em `src/pages/Senhas.tsx`:
```typescript
// Descomentar esta linha:
import { logger } from "@/lib/logsService";
```

#### Em `src/lib/passwordsService.ts`:
```typescript
// Descomentar esta linha:
import { logger } from './logsService';
```

#### Em `src/pages/Configuracoes.tsx`:
```typescript
// Descomentar estas linhas:
import { fetchLogs, type LogEntry } from "@/lib/logsService";
import { FileText, RefreshCw, Search, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { useEffect } from "react";
```

### Passo 3: Reativar as Chamadas de Logger

Procure por comentários `// EM DESENVOLVIMENTO` e descomente:

1. **Em `Senhas.tsx`:**
   - Descomentar chamadas de `logger.info()`, `logger.success()`, `logger.error()`
   - Descomentar estados relacionados a logs

2. **Em `passwordsService.ts`:**
   - Descomentar chamadas de `logger` no `createPassword()`

3. **Em `Configuracoes.tsx`:**
   - Descomentar estados de logs
   - Descomentar funções (`carregarLogs`, `handleCopyLog`, etc.)
   - Descomentar o card do visualizador

### Passo 4: Testar

1. Adicione uma senha na página de Senhas
2. Verifique o console do navegador (deve aparecer logs)
3. Verifique o Supabase (deve ter registros na tabela `logs`)
4. Acesse Configurações e abra o visualizador de logs
5. Verifique se os logs aparecem corretamente

---

## 📝 Convenções de Uso

### Níveis de Log

- **`info`**: Informações gerais, operações normais
- **`success`**: Operações concluídas com sucesso
- **`warning`**: Avisos, situações que merecem atenção
- **`error`**: Erros que precisam ser investigados

### Módulos

Use nomes consistentes em MAIÚSCULAS:
- `SENHAS` - Para operações de senhas
- `SUPABASE` - Para operações diretas no banco
- `USUARIOS` - Para operações de usuários
- `CONFIGURACOES` - Para operações de configurações

### Mensagens

- Seja claro e descritivo
- Use português (ou inglês, mas seja consistente)
- Inclua contexto relevante nos `dados`

### Dados Sensíveis

- **NUNCA** logue senhas reais
- Use `***` ou `null` para senhas
- Cuidado com tokens, API keys, etc.

---

## 🔒 Segurança

### Boas Práticas

1. **Senhas nunca são logadas**
   - O sistema automaticamente mascara senhas
   - Sempre verifique antes de logar dados sensíveis

2. **Políticas RLS**
   - Ajuste as políticas RLS conforme necessário
   - Considere restringir acesso a logs de erro apenas para admins

3. **Limpeza de Logs**
   - Considere implementar uma rotina para limpar logs antigos
   - Logs podem crescer rapidamente

### Exemplo de Política RLS Restritiva

```sql
-- Apenas admins podem ver logs de erro
CREATE POLICY "Apenas admins veem erros"
  ON logs
  FOR SELECT
  TO authenticated
  USING (
    nivel != 'error' OR 
    (SELECT role FROM usuarios WHERE id = auth.uid()) = 'admin'
  );
```

---

## 🐛 Troubleshooting

### Logs não estão sendo salvos

1. Verifique se a tabela `logs` existe no Supabase
2. Verifique as políticas RLS (podem estar bloqueando)
3. Verifique o console do navegador para erros
4. Verifique se o `logsService.ts` está importado corretamente

### Visualizador não carrega logs

1. Verifique se `fetchLogs()` está sendo chamado
2. Verifique se há erros no console
3. Verifique se os filtros não estão muito restritivos
4. Teste buscar todos os logs sem filtros

### Performance lenta

1. Adicione limites nas buscas (`limite: 100`)
2. Use índices adequados (já criados no SQL)
3. Considere paginação para muitos logs
4. Limpe logs antigos periodicamente

---

## 📚 Exemplos Completos

### Exemplo 1: Logging em Operação CRUD Completa

```typescript
// Criar
logger.info('SENHAS', 'Iniciando criação de senha', { tipo: 'cftv' });
const created = await createPassword(data);
logger.success('SENHAS', 'Senha criada', { id: created.id });

// Atualizar
logger.info('SENHAS', 'Atualizando senha', { id: '123' });
const updated = await updatePassword('123', data);
logger.success('SENHAS', 'Senha atualizada', { id: '123' });

// Deletar
logger.info('SENHAS', 'Deletando senha', { id: '123' });
await deletePassword('123');
logger.success('SENHAS', 'Senha deletada', { id: '123' });
```

### Exemplo 2: Logging com Contexto Rico

```typescript
logger.info('SENHAS', 'Processamento em lote iniciado', {
  total: 100,
  tipo: 'importacao',
  usuario: currentUser.id,
  timestamp: new Date().toISOString()
});

// Durante o processamento
for (let i = 0; i < items.length; i++) {
  try {
    await processItem(items[i]);
    logger.info('SENHAS', `Item ${i + 1}/${items.length} processado`, {
      itemId: items[i].id,
      progresso: ((i + 1) / items.length) * 100
    });
  } catch (error) {
    logger.error('SENHAS', `Erro ao processar item ${i + 1}`, {
      itemId: items[i].id,
      erro: error.message
    }, error.stack);
  }
}

logger.success('SENHAS', 'Processamento em lote concluído', {
  total: items.length,
  sucessos: items.length - errors.length,
  erros: errors.length
});
```

---

## 🎯 Próximos Passos (Melhorias Futuras)

1. **Paginação**
   - Implementar paginação no visualizador
   - Carregar logs em lotes

2. **Exportação**
   - Botão para exportar logs em CSV/JSON
   - Filtros para exportação

3. **Alertas**
   - Notificações para erros críticos
   - Dashboard de métricas de logs

4. **Limpeza Automática**
   - Job para limpar logs antigos
   - Configuração de retenção

5. **Análise**
   - Gráficos de erros por módulo
   - Tendências de uso

---

## 📞 Suporte

Se tiver dúvidas sobre a implementação:

1. Revise este documento
2. Verifique os comentários no código (marcados com `// EM DESENVOLVIMENTO`)
3. Teste com logs simples primeiro
4. Verifique o console do navegador para erros

---

**Última atualização:** Dezembro 2024  
**Status:** ⚠️ Em Desenvolvimento - Pronto para reativação


