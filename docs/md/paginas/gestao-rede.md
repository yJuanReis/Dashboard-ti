# Gestão de Rede (`/gestaorede`)

Página placeholder dedicada ao monitoramento e controle da infraestrutura de rede. Atualmente exibe cards estáticos comunicando que a funcionalidade está “em desenvolvimento”.

---

## Proteções e contexto

- **Guards**: `ProtectedRoute`, `PasswordTemporaryGuard`, `PagePermissionGuard`.
- **Permissões**: gerenciadas via `user_profiles.page_permissions`.
- **Sidebar**: item “Gestão de Rede” (`Network`).
- **Status atual**: componente mínimo com cards e mensagem “Funcionalidade em breve”.
- **Integrações futuras esperadas**:
  - Consumo de métricas de rede (status, dispositivos ativos, alertas) via APIs internas/Supabase.
  - Relacionamento com Segurança/Logs para exibir eventos críticos (queda de link, VLAN, etc.).

---

## Estrutura do componente

```1:67:src/pages/GestaoRede.tsx
export default function GestaoRede() {
  return (
    <div className="p-3 md:p-4 lg:p-6 space-y-4 md:space-y-6">
      <div>
        <h1>Gestão de Rede</h1>
        <p>Monitoramento e controle da infraestrutura de rede</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <Card>
          <CardHeader>
            <CardTitle>Status da Rede</CardTitle>
            <Network className="..." />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Online</div>
            <Badge>Operacional</Badge>
          </CardContent>
        </Card>
        <Card> ... Dispositivos Ativos (45) ... </Card>
        <Card> ... Alertas (2) ... </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Em Desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Network className="..." />
            <p>Esta funcionalidade estará disponível em breve.</p>
            <p>Planejado: topologia, monitoramento de banda, gestão de VLANs, etc.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- **Layout**: título + subtítulo, cards com dados mock (status “Online”, 45 dispositivos, 2 alertas) e card final informando o roadmap.
- **Estilização**: classes Tailwind simples (grid, badges).
- **Nenhuma dependência externa** além de componentes UI (`Card`, `Badge`) e ícones lucide.

---

## Supabase e integrações

Atualmente não consome Supabase, mas os guards e permissões já dependem do AuthContext. Futuramente pode:
- Gravar e buscar métricas em tabelas como `network_devices`, `network_alerts`.
- Integrar com `audit_logs` quando alterações de configuração ocorrerem.
- Trabalhar com `SecurityTest` para validar se dados de rede são exibidos com segurança (sem expor credenciais/SNMP).

---

## Próximos passos sugeridos

1. **KPIs dinâmicos**: conectar cards a dados reais (uptime, dispositivos ativos, alertas).
2. **Topologia**: visualizar mapa/diagrama das conexões (potential via canvas/diagram libs).
3. **Gerenciamento de VLANs/Subnets**: CRUD integrado com Supabase.
4. **Alertas em tempo real**: WebSockets ou polling para incidentes de rede.
5. **Integração com Chamados**: permitir abrir chamados diretamente quando alertas aparecem.

---

## Arquivos relacionados

- `src/pages/GestaoRede.tsx` – componente placeholder.

