# Chamados (`/chamados`)

Página demonstrativa para um sistema de tickets interno. Atualmente usa dados mockados, mas já expõe filtros, cards de estatísticas e uma lista de chamados com status, prioridade e ações.

---

## Proteções e contexto

- **Guards**: `ProtectedRoute`, `PasswordTemporaryGuard`, `PagePermissionGuard`.
- **Permissões**: configuradas via `user_profiles.page_permissions`.
- **Sidebar**: item “Chamados” (`Wrench`).
- **Status**: interface marcada como “Site em Desenvolvimento” (badge amarela) indicando que os dados ainda são dummy.
- **Integrações planejadas**:
  - Conexão com APIs de helpdesk/ITSM (Supabase, Jira, Freshdesk etc.).
  - Integração com Audit Logs quando chamados forem criados/atualizados via painel.
  - Relacionamento com outros módulos (ex.: abrir chamado a partir de alertas de Servidores ou Controle HD).

---

## Estrutura atual

```1:256:src/pages/Chamados.tsx
const mockChamados = [
  { id: 1, titulo: "Impressora não imprime", prioridade: "alta", status: "aberto", solicitante: "Maria Silva", data: "2024-01-15" },
  ...
];

export default function Chamados() {
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const chamadosFiltrados = filtroStatus === "todos"
    ? mockChamados
    : mockChamados.filter(c => c.status === filtroStatus);

  const getPrioridadeColor = (prioridade) => { ... };
  const getStatusInfo = (status) => ({ icon, label, color });
  const abertosCount = mockChamados.filter(c => c.status === "aberto").length;
  ...

  return (
    <div className="min-h-screen bg-background p-3 md:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex ...">
          <Link to={createPageUrl("Home")}>
            <Button variant="outline" size="icon">...</Button>
          </Link>
          <div>
            <h1>Site em Desenvolvimento</h1>
            <Badge className="bg-yellow-100 ...">Em Desenvolvimento</Badge>
            <p>Desenvolvimento</p>
          </div>
          <Button className="gap-2 ...">
            <Plus /> Novo Chamado
          </Button>
        </div>

        {/* Stats */}
        <div className="grid ...">
          <Card> Total Chamados </Card>
          <Card> Abertos </Card>
          <Card> Em Andamento </Card>
          <Card> Resolvidos </Card>
        </div>

        {/* Filter by status */}
        <Card>
          <CardContent>
            <Button onClick={() => setFiltroStatus("todos")}>Todos</Button>
            <Button onClick={() => setFiltroStatus("aberto")}>Abertos</Button>
            ...
          </CardContent>
        </Card>

        {/* Tickets List */}
        <div className="grid gap-4">
          {chamadosFiltrados.map((chamado) => {
            const statusInfo = getStatusInfo(chamado.status);
            ...
            return (
              <Card key={chamado.id}>
                <CardHeader>
                  <CardTitle>#{chamado.id} - {chamado.titulo}</CardTitle>
                  <Badge className={statusInfo.color}>...</Badge>
                  <Badge className={getPrioridadeColor(chamado.prioridade)}>...</Badge>
                </CardHeader>
                <CardContent>
                  <div>
                    <div>Solicitante, Data</div>
                    <Button variant="outline">Ver Detalhes</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- **Filtros**: botões “Todos”, “Abertos”, “Em Andamento”, “Resolvidos”.
- **Stats cards**: total de chamados, abertos, em andamento, resolvidos.
- **Lista**: cada card mostra título, descrição, badges de status/prioridade, solicitante, data e botão “Ver Detalhes”.
- **Botão “Novo Chamado”** (ainda sem ação): destinado a abrir modal/formulário quando implementado.

---

## Interação com Supabase

No estado atual, não há chamadas. Futuro esperado:
- Criar tabela `tickets`/`support_requests` (Supabase) para armazenar chamados.
- Integrar com `audit_logs` para rastrear alterações.
- Lidar com permissões (ex.: só admins podem mudar status).
- Integrar com notificações/logs (ex.: enviar e-mail ou push).

---

## Evoluções sugeridas

- Implementar backend real (CRUD) usando Supabase.
- Adicionar filtro por prioridade, solicitante, período.
- Modal detalhado ao clicar em “Ver Detalhes”.
- Ações rápidas (mudar status, atribuir responsável).
- Integração com outras telas para criação rápida (ex.: alertas em Servidores ou Segurança abrindo chamados).

---

## Arquivos relacionados

- `src/pages/Chamados.tsx` – layout atual com mock data.

