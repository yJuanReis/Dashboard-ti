# Audit Logs (`/audit-logs`)

Interface administrativa para consultar o histórico de mudanças registradas em `audit_logs`. Permite filtrar por tabela, ação, busca textual e navegar pelos registros com paginação local.

---

## Proteções e contexto

- **Guardas**: `ProtectedRoute`, `PasswordTemporaryGuard`, `AdminOnlyRoute` (somente administradores).
- **Permissões**: rota escondida de usuários comuns; menu aparece apenas para admins.
- **Integrações**:
  - Configurações: a página é linkada na seção de ferramentas (atalho “Ver logs”).
  - Supabase: consome a tabela `audit_logs` via serviço `auditService`.
  - Outras páginas: ações em Senhas, NVRs, Controle HDs, Configurações etc. devem registrar eventos que acabam listados aqui.

---

## Estrutura e principais componentes

```1:400:src/pages/AuditLogs.tsx
import { fetchAuditLogs, type AuditLog, type AuditActionType } from "@/lib/auditService";

export default function AuditLogs() {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsFilter, setLogsFilter] = useState({ table_name?: string, action_type?: AuditActionType, search?: string });
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const logsPerPage = 50;
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showLogDetails, setShowLogDetails] = useState(false);

  const carregarLogsAuditoria = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const allLogs = await fetchAuditLogs({ table_name, action_type, limit: 5000, offset: 0, order_by: 'created_at', order: 'desc' });
      let filteredLogs = allLogs;
      if (logsFilter.search) {
        const searchLower = logsFilter.search.toLowerCase();
        filteredLogs = allLogs.filter(log =>
          log.description?.toLowerCase().includes(searchLower) ||
          log.user_email?.toLowerCase().includes(searchLower) ||
          log.user_name?.toLowerCase().includes(searchLower) ||
          log.table_name?.toLowerCase().includes(searchLower) ||
          log.record_id?.toLowerCase().includes(searchLower)
        );
      }
      const total = filteredLogs.length;
      const offset = (logsPage - 1) * logsPerPage;
      const paginatedLogs = filteredLogs.slice(offset, offset + logsPerPage);
      setAuditLogs(paginatedLogs);
      setLogsTotal(total);
    } finally {
      setLoadingLogs(false);
    }
  }, [logsPage, logsFilter, logsPerPage]);

  useEffect(() => { carregarLogsAuditoria(); }, [carregarLogsAuditoria]);
```

- Busca até 5000 registros e aplica filtros/paginação no client.
- Filtros disponíveis: texto, ação (`CREATE`, `UPDATE`, `DELETE`), tabela (ex.: `passwords`, `nvrs`).
- Padrão de paginação: 50 registros por página, com botões “Anterior/Próxima”.

### Layout

- Header com botão de voltar (`createPageUrl("Configuracoes")`), título “Logs de Auditoria” e descrição.
- Card principal contém:
  - Filtros (input de busca, selects de ação/tabela, botão “Limpar”).
  - Tabela com colunas Data/Hora, Ação (badge colorida), Tabela, Usuário, Descrição, Ações.
  - Modal “Detalhes do Log” (`Card` flutuante) com `old_data`, `new_data`, campos alterados e metadados.
  - Botão para copiar detalhes (`navigator.clipboard.writeText`).
- `toast` notifica erros (ex.: falha ao carregar).

---

## Integração com Supabase (`audit_logs`)

`fetchAuditLogs` (em `src/lib/auditService.ts`) chama Supabase com filtros e ordenação. Estrutura típica de `AuditLog`:
- `action_type`: CREATE, UPDATE, DELETE.
- `table_name`: ex.: `passwords`, `nvrs`, `user_profiles`.
- `user_name`, `user_email`, `ip_address`.
- `description`, `record_id`.
- `old_data`, `new_data`, `changed_fields` (JSON).

Páginas que geram logs (ex.: Configurações, Senhas, Controle NVR) devem chamar `logUpdate`/`logInsert`/`logDelete` para alimentar a tabela. Assim, o Audit Logs serve como painel de observabilidade.

---

## Fluxos importantes

- **Filtrar**: ao digitar na busca ou alterar selects, `logsFilter` é atualizado e `logsPage` volta para 1.
- **Ver detalhes**: abre card modal com JSON formatado, permitindo inspecionar campos alterados.
- **Copiar JSON**: botão “Copiar detalhes” gera texto estruturado (action/table/record_id/old/new/changed_fields/ip).
- **Paginação**: mensagens “Mostrando X a Y de Z logs” e “Página N de M”.

---

## Boas práticas

- Busca client-side sobre 5000 registros previne múltiplas idas ao backend ao alterar filtros (mas considerar paginação server-side em bases grandes).
- `getActionBadgeColor` utiliza cores diferentes por ação (verde, azul, vermelho).
- Sanitiza e mostra `user_email`, `user_name`, `ip` sem expor dados sensíveis adicionais.
- Usa `Badge` e `Table` para leitura rápida.

---

## Possíveis melhorias

1. Paginação server-side (limit/offset) para bases acima de 5k registros.
2. Exportar logs (CSV/JSON) com filtros aplicados.
3. Filtro por data (intervalo).
4. Integração com webhooks/alertas (ex.: alertar quando ação crítica ocorre).

---

## Arquivos relacionados

- `src/pages/AuditLogs.tsx` – UI principal.
- `src/lib/auditService.ts` – fetch/log helpers.
- `src/pages/Configuracoes.tsx` – origem de diversos registros (botões de atalho).

