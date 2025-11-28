# Ramais (`/ramais`)

Página de gerenciamento de ramais telefônicos da empresa. Permite visualizar, criar, editar e excluir registros de ramais com informações de nome/local e números de ramais.

---

## Proteções e contexto

- **Guards**: `ProtectedRoute`, `PasswordTemporaryGuard`, `PagePermissionGuard`.
- **Permissões**: configuradas via `user_profiles.page_permissions`.
- **Sidebar**: item "Ramais" (`Phone`).
- **Status**: Em produção.

---

## Estrutura atual

```1:350:src/pages/Ramais.tsx
export default function Ramais() {
  const [ramais, setRamais] = useState<Ramal[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("nome_local");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  ...
  
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Filtros */}
      <div className="flex-shrink-0 border-b ...">
        <Search />
        <Button onClick={() => handleOpenDialog()}>Novo Ramal</Button>
      </div>
      
      {/* Tabela */}
      <Table>
        <TableHeader>
          <TableHead onClick={() => handleSort("nome_local")}>Nome/Local</TableHead>
          <TableHead onClick={() => handleSort("ramais")}>Ramais</TableHead>
          <TableHead>Ações</TableHead>
        </TableHeader>
        <TableBody>
          {filteredAndSortedRamais.map((ramal) => (
            <TableRow>
              <TableCell>{ramal.nome_local}</TableCell>
              <TableCell className="font-mono">{ramal.ramais}</TableCell>
              <TableCell>
                <Button onClick={() => handleOpenDialog(ramal)}>Editar</Button>
                <Button onClick={() => handleDelete(ramal.id)}>Excluir</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

- **Busca**: campo de texto que filtra por nome/local ou números de ramais.
- **Ordenação**: colunas clicáveis para ordenar por nome/local ou ramais (ascendente/descendente).
- **CRUD completo**: criar, editar e excluir ramais via dialogs.
- **Formato de ramais**: suporta um único ramal (ex: "220") ou múltiplos separados por `/` ou espaço (ex: "200/225/227", "246 / 244").

---

## Interação com Supabase

### Tabela `ramais`

**⚠️ IMPORTANTE: A estrutura da tabela será modificada futuramente. Esta documentação reflete a estrutura atual.**

Estrutura atual:
- `id` (string, PK)
- `nome_local` (string, nullable) - Nome ou localização do ramal
- `ramais` (string, nullable) - Números de ramais (pode conter múltiplos valores separados por `/` ou espaço)
- `created_at` (timestamp)

**Nota sobre mudanças futuras**: A estrutura da tabela `ramais` está planejada para ser alterada. Quando isso acontecer, será necessário atualizar:
- `src/lib/ramaisService.ts` (interfaces `RamalDB` e `Ramal`, funções de conversão)
- `src/pages/Ramais.tsx` (formulários, tabela, filtros)
- Esta documentação

### Serviço

O serviço `ramaisService.ts` fornece:
- `fetchRamais()`: busca todos os ramais ordenados por `nome_local`
- `createRamal(ramal)`: cria novo ramal
- `updateRamal(id, ramal)`: atualiza ramal existente
- `deleteRamal(id)`: exclui ramal

Todas as operações são registradas em `audit_logs` automaticamente.

### RLS (Row Level Security)

A tabela `ramais` deve ter políticas RLS configuradas para permitir:
- **SELECT**: usuários autenticados podem ler
- **INSERT**: usuários autenticados podem criar
- **UPDATE**: usuários autenticados podem atualizar
- **DELETE**: usuários autenticados podem excluir

---

## Funcionalidades

### Busca e filtros

- **Busca textual**: filtra por qualquer parte do nome/local ou números de ramais
- **Ordenação**: clique nas colunas para ordenar (alterna entre asc/desc)
- **Botão "Limpar"**: aparece quando há filtros ativos

### Criação/Edição

- **Dialog modal**: formulário com dois campos:
  - **Nome/Local** (obrigatório): ex: "Luiz Silva Coord. Marina", "Recepção MV", "T.I"
  - **Ramais** (opcional): ex: "220", "246 / 244", "200/225/227"
- **Validação**: nome/local é obrigatório
- **Dica**: campo de ramais aceita múltiplos valores separados por `/` ou espaço

### Exclusão

- **Confirmação**: dialog de confirmação antes de excluir
- **Auditoria**: todas as exclusões são registradas em `audit_logs`

---

## Exemplos de dados

Baseado no CSV fornecido, exemplos de registros:

```
nome_local: "Luiz Silva Coord. Marina"
ramais: "220"

nome_local: "T.I"
ramais: "246 / 244"

nome_local: "Recepção MV"
ramais: "200/225/227"

nome_local: "Portaria"
ramais: "234"
```

---

## Arquivos relacionados

- `src/pages/Ramais.tsx` – componente principal da página
- `src/lib/ramaisService.ts` – serviço de integração com Supabase
- `docs/sql/tabelas/supabase_ramais_table.sql` – script SQL para criar a tabela
- `src/App.tsx` – rota `/ramais` configurada
- `src/config/navigation.config.ts` – item de navegação "Ramais"

---

## Próximos passos sugeridos

1. **Estrutura futura**: quando a tabela for modificada, atualizar:
   - Interfaces TypeScript em `ramaisService.ts`
   - Formulários e validações em `Ramais.tsx`
   - Esta documentação
2. **Melhorias de UX**:
   - Adicionar filtros por padrão de ramal (ex: mostrar apenas ramais que começam com "2")
   - Exportação CSV dos ramais
   - Histórico de alterações (já registrado em audit_logs, pode ser visualizado)
3. **Validações**:
   - Validar formato de números de ramais (ex: apenas números)
   - Prevenir duplicatas de nome/local
4. **Integrações**:
   - Possível integração com sistema de telefonia para verificar status dos ramais
   - Relacionamento com outras tabelas (ex: usuários, setores)

