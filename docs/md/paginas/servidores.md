# Servidores (`/servidores`)

Dashboard em construção para monitoramento de servidores físicos/virtuais. Atualmente exibe dados mockados com foco em design e estrutura; futuramente deve integrar métricas reais (CPU, memória, disco, status).

---

## Proteções e contexto

- **Guards**: `ProtectedRoute`, `PasswordTemporaryGuard`, `PagePermissionGuard`.
- **Permissões**: configuradas via `user_profiles.page_permissions`.
- **Sidebar**: item “Servidores” (`Server`).
- **Status**: marcado como “Página em desenvolvimento” no UI (badge + texto).
- **Integrações futuras**:
  - Configurações/Audit Logs para controlar acesso e acompanhar alterações.
  - Fontes de dados (Prometheus, Supabase, APIs internas) para métricas em tempo real.

---

## Estrutura atual

```1:213:src/pages/Servidores.tsx
const mockServidores = [
  { id: 1, nome: "VM-APP-01", tipo: "Aplicação", cpu: 45, memoria: 68, disco: 52, status: "online", ip: "192.168.1.100" },
  { id: 2, nome: "SRV-DB-01", tipo: "Banco de Dados", cpu: 82, memoria: 91, disco: 78, status: "warning", ip: "192.168.1.101" },
  ...
];

const ProgressBar = ({ value, color = "blue" }) => { ... };

export default function Servidores() {
  return (
    <div className="min-h-screen bg-background p-3 md:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 ...">
          <Link to={createPageUrl("Home")}>
            <Button variant="outline" size="icon">...</Button>
          </Link>
          <div>
            <h1>Pagina em desenvolvimento</h1>
            <Badge variant="secondary">Em Desenvolvimento</Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid ...">
          <Card> <p>Total Servidores</p> <p>{mockServidores.length}</p> </Card>
          <Card> <p>Online</p> <p>2</p> </Card>
          <Card> <p>Atenção</p> <p>2</p> </Card>
          <Card> <p>Uptime Médio</p> <p>99.8%</p> </Card>
        </div>

        {/* Servers List */}
        <div className="grid gap-4">
          {mockServidores.map((servidor) => (
            <Card key={servidor.id}>
              <CardHeader> ... status + badges ... </CardHeader>
              <CardContent>
                <ProgressBar value={servidor.cpu} color="blue" />
                <ProgressBar value={servidor.memoria} color="purple" />
                <ProgressBar value={servidor.disco} color="green" />
                <Button variant="outline">Ver Métricas Detalhadas</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- **Mock data**: array `mockServidores` simula valores para CPU/memória/disco e status (online/warning).
- **ProgressBar**: componente auxiliar com classes tailwind para cores dinâmicas.
- **Layout**:
  - Header com botão “Voltar”.
  - Quatro cards de métricas resumidas.
  - Lista de servidores com badges e barras de progresso.
- **Botão “Ver Métricas Detalhadas”**: placeholder para ações futuras (ex.: abrir modal/rota com dados reais).

---

## Interação com Supabase

Atualmente não há chamadas a Supabase; tudo é mockado. Contudo, o fluxo completo ainda se beneficia de:
- Guards baseados em sessão (AuthContext).
- Configurações para definir acesso/permissões.
- Possível futura integração:
  - Tabela `servers` no Supabase com métricas agregadas.
  - Logs (`audit_logs`) para registrar mudanças (inserções, atualizações).
  - Webhooks ou cron jobs que alimentem o banco com dados de monitoramento.

---

## Próximos passos sugeridos

1. **Backend real**: integrar com fontes de telemetria (Prometheus, Zabbix, API interna) e salvar no Supabase para consumo.
2. **Alertas**: mostrar alertas críticos (ex.: CPU > 90%) e permitir ações rápidas (reiniciar serviço, abrir chamado).
3. **Filtro/busca**: adicionar filtros por tipo/status/host.
4. **Detalhes**: botão “Ver Métricas Detalhadas” pode abrir modal com gráficos ou navegar para um dashboard específico.
5. **Relação com Chamados**: quando status = warning, oferecer CTA para abrir um chamado de correção.

---

## Arquivos relacionados

- `src/pages/Servidores.tsx` – layout atual e mock data.
- `src/utils/index.ts` – `createPageUrl` usado no botão de voltar.

