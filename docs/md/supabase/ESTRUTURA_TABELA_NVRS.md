# 📋 Estrutura da Tabela NVRs no Banco de Dados

## Tabela: `nvrs`

### Colunas Disponíveis:

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| `id` | UUID | ✅ Sim (PK) | Identificador único do NVR (gerado automaticamente) |
| `marina` | TEXT | ✅ Sim | Nome da marina onde o NVR está localizado |
| `name` | TEXT | ✅ Sim | Nome do NVR |
| `model` | TEXT | ✅ Sim | Modelo do NVR |
| `owner` | TEXT | ✅ Sim | Proprietário/Responsável pelo NVR |
| `cameras` | INTEGER | ❌ Não | Número de câmeras conectadas (padrão: 0) |
| `notes` | TEXT | ❌ Não | Observações/Notas sobre o NVR |
| `slots` | JSONB | ❌ Não | Array de slots de HD (padrão: `[]`) |
| `created_at` | TIMESTAMPTZ | ✅ Sim | Data de criação (gerado automaticamente) |
| `updated_at` | TIMESTAMPTZ | ✅ Sim | Data da última atualização (atualizado automaticamente) |

### Estrutura do Campo `slots` (JSONB):

O campo `slots` é um array JSON que armazena informações sobre os slots de HD do NVR:

```json
[
  {
    "status": "active" | "empty" | "inactive",
    "hdSize": 0 | número (tamanho em TB),
    "purchased": true | false
  }
]
```

**Exemplo:**
```json
[
  {
    "status": "active",
    "hdSize": 14,
    "purchased": false
  },
  {
    "status": "empty",
    "hdSize": 0,
    "purchased": false
  }
]
```

### Índices Criados:

- `idx_nvrs_marina` - Índice na coluna `marina`
- `idx_nvrs_owner` - Índice na coluna `owner`
- `idx_nvrs_model` - Índice na coluna `model`

### Triggers:

- `update_nvrs_updated_at` - Atualiza automaticamente o campo `updated_at` quando o registro é modificado

### Observações:

- O campo `id` é gerado automaticamente como UUID
- Os campos `created_at` e `updated_at` são gerenciados automaticamente pelo banco
- O campo `slots` é um JSONB que permite armazenar arrays complexos de dados
- Todos os campos obrigatórios devem ser preenchidos ao criar um novo NVR

