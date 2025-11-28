# Impressoras (`/impressoras`)

Página de gerenciamento de impressoras da empresa. Permite visualizar, criar, editar e excluir registros de impressoras com informações detalhadas sobre modelo, número de série, IP, marina, local e observações.

---

## Proteções e contexto

- **Guards**: `ProtectedRoute`, `PasswordTemporaryGuard`, `PagePermissionGuard`.
- **Permissões**: configuradas via `user_profiles.page_permissions`.
- **Sidebar**: item "Impressoras" (`Printer`).
- **Status**: Em produção.

---

## Estrutura atual

```1:623:src/pages/Impressoras.tsx
export default function Impressoras() {
  const [impressoras, setImpressoras] = useState<Impressora[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [marinaFilter, setMarinaFilter] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("modelo");
  ...
  
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Filtros */}
      <div className="flex-shrink-0 border-b ...">
        <Search />
        <Select value={marinaFilter} onValueChange={setMarinaFilter}>
          <SelectItem>BRACUHY</SelectItem>
          <SelectItem>BOA VISTA</SelectItem>
          ...
        </Select>
      </div>
      
      {/* Tabela */}
      <Table>
        <TableHeader>
          <TableHead onClick={() => handleSort("marina")}>Marina</TableHead>
          <TableHead onClick={() => handleSort("local")}>Local</TableHead>
          <TableHead onClick={() => handleSort("modelo")}>Modelo</TableHead>
          <TableHead onClick={() => handleSort("numero_serie")}>Nº Série</TableHead>
          <TableHead onClick={() => handleSort("ip")}>IP</TableHead>
          <TableHead>Observação</TableHead>
          <TableHead>Ações</TableHead>
        </TableHeader>
        <TableBody>
          {filteredAndSortedImpressoras.map((impressora) => (
            <TableRow>
              <TableCell>{impressora.marina}</TableCell>
              <TableCell>{impressora.local}</TableCell>
              <TableCell>
                <Badge className={getModeloColor(impressora.modelo)}>
                  {impressora.modelo}
                </Badge>
              </TableCell>
              <TableCell className="font-mono">{impressora.numero_serie}</TableCell>
              <TableCell className="font-mono">{impressora.ip}</TableCell>
              <TableCell>{impressora.observacao}</TableCell>
              <TableCell>
                <Button onClick={() => handleOpenDialog(impressora)}>Editar</Button>
                <Button onClick={() => handleDelete(impressora.id)}>Excluir</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

- **Busca**: campo de texto que filtra por qualquer campo (modelo, série, IP, marina, local, observação).
- **Filtro por marina**: dropdown com opções pré-definidas de marinas.
- **Ordenação**: todas as colunas são clicáveis para ordenar (alterna entre asc/desc).
- **Badges coloridos**: modelos de impressoras são exibidos com cores diferentes baseadas no tipo.
- **CRUD completo**: criar, editar e excluir impressoras via dialogs.

---

## Interação com Supabase

### Tabela `impressoras`

Estrutura:
- `id` (string, PK)
- `marina` (string, nullable) - Nome da marina
- `local` (string, nullable) - Localização específica (ex: "RECEPÇÃO", "Diretoria")
- `modelo` (string, nullable) - Modelo da impressora (ex: "ECOSYS M2640idw")
- `numero_serie` (string, nullable) - Número de série
- `ip` (string, nullable) - Endereço IP ou "Wi-Fi"
- `observacao` (string, nullable) - Observações adicionais
- `created_at` (timestamp)

### Serviço

O serviço `impressorasService.ts` fornece:
- `fetchImpressoras()`: busca todas as impressoras ordenadas por marina e modelo
- `createImpressora(impressora)`: cria nova impressora
- `updateImpressora(id, impressora)`: atualiza impressora existente
- `deleteImpressora(id)`: exclui impressora

Todas as operações são registradas em `audit_logs` automaticamente.

### RLS (Row Level Security)

A tabela `impressoras` deve ter políticas RLS configuradas para permitir:
- **SELECT**: usuários autenticados podem ler
- **INSERT**: usuários autenticados podem criar
- **UPDATE**: usuários autenticados podem atualizar
- **DELETE**: usuários autenticados podem excluir

---

## Funcionalidades

### Busca e filtros

- **Busca textual**: filtra por qualquer campo (modelo, série, IP, marina, local, observação)
- **Filtro por marina**: dropdown com marinas pré-definidas:
  - BRACUHY
  - BOA VISTA
  - BUZIOS
  - GLORIA
  - ITACURUÇA
  - PARATY
  - PIRATAS
  - RIBEIRA
  - VEROLME
- **Ordenação**: clique nas colunas para ordenar (alterna entre asc/desc)
- **Botão "Limpar"**: aparece quando há filtros ativos

### Criação/Edição

- **Dialog modal**: formulário com campos:
  - **Modelo** (obrigatório): ex: "ECOSYS M2640idw", "EPSON L3250"
  - **Nº Série** (opcional): número de série da impressora
  - **IP** (opcional): endereço IP ou "Wi-Fi"
  - **Marina** (opcional): seleção via dropdown
  - **Local** (opcional): ex: "RECEPÇÃO", "Diretoria"
  - **Observação** (opcional): informações adicionais
- **Validação**: modelo é obrigatório

### Exclusão

- **Confirmação**: dialog de confirmação antes de excluir
- **Auditoria**: todas as exclusões são registradas em `audit_logs`

### Badges coloridos por modelo

A função `getModeloColor()` retorna cores diferentes baseadas no modelo:

- **ECOSYS M2640**: azul
- **EPSON**: roxo
- **ECOSYS M2040**: verde
- **ECOSYS M8124**: laranja
- **ECOSYS M3655**: ciano
- **SHARP/MX-4140**: rosa
- **Outros ECOSYS**: índigo
- **Outros modelos**: âmbar

---

## Exemplos de dados

Exemplos de registros típicos:

```
marina: "BRACUHY"
local: "RECEPÇÃO"
modelo: "ECOSYS M2640idw"
numero_serie: "6149"
ip: "192.168.1.100"
observacao: "Em uso"

marina: "BOA VISTA"
local: "Diretoria"
modelo: "EPSON L3250"
ip: "Wi-Fi"
observacao: "Backup"
```

---

## Arquivos relacionados

- `src/pages/Impressoras.tsx` – componente principal da página
- `src/lib/impressorasService.ts` – serviço de integração com Supabase
- `src/App.tsx` – rota `/impressoras` configurada
- `src/config/navigation.config.ts` – item de navegação "Impressoras"

---

## Próximos passos sugeridos

1. **Melhorias de UX**:
   - Adicionar filtro por modelo de impressora
   - Exportação CSV das impressoras
   - Histórico de alterações (já registrado em audit_logs, pode ser visualizado)
2. **Validações**:
   - Validar formato de IP
   - Prevenir duplicatas de número de série
   - Validar formato de número de série
3. **Integrações**:
   - Possível integração com sistema de monitoramento de impressoras
   - Verificação de status online/offline via ping
   - Alertas quando impressora estiver offline por muito tempo
4. **Relatórios**:
   - Relatório de impressoras por marina
   - Estatísticas de uso (se houver integração com sistema de impressão)
   - Previsão de manutenção baseada em modelos/idade

