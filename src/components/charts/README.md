# Componentes de Gráficos

## HorizontalBarChart

Componente React moderno para exibir gráficos de barras horizontais usando Recharts.

### Características

- ✅ Layout horizontal (vertical bars)
- ✅ Barras com cantos arredondados
- ✅ Gradiente suave (azul → roxo)
- ✅ Tooltip estilizado e minimalista
- ✅ Suporte a tema dark/light
- ✅ Valores exibidos à direita de cada barra
- ✅ Totalmente responsivo
- ✅ TypeScript com tipagem completa

### Uso

```tsx
import { HorizontalBarChart } from "@/components/charts/HorizontalBarChart";

const data = [
  { empresa: "VEROLME", valor: 70369 },
  { empresa: "JL BRACUHY", valor: 50873 },
  { empresa: "PIRATAS", valor: 32983 },
];

<HorizontalBarChart
  data={data}
  title="Top 5 Empresas"
  showLegend={true}
  maxBars={5}
/>
```

### Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `data` | `HorizontalBarChartData[]` | **obrigatório** | Array de dados com empresa e valor |
| `title` | `string` | `undefined` | Título do gráfico |
| `showLegend` | `boolean` | `false` | Mostrar legenda |
| `className` | `string` | `undefined` | Classes CSS adicionais |
| `maxBars` | `number` | `5` | Número máximo de barras |

### Estrutura de Dados

```typescript
interface HorizontalBarChartData {
  empresa: string;
  valor: number;
}
```

## Sugestões de Melhorias Futuras

### 1. Animações
- Adicionar animação de entrada das barras
- Transições suaves ao atualizar dados
- Efeito de hover mais elaborado

### 2. Interatividade
- Clique na barra para ver detalhes
- Filtros por período
- Exportar gráfico como imagem

### 3. Visualizações Adicionais
- Comparação entre períodos
- Gráfico de linha para evolução temporal
- Gráfico de pizza para distribuição percentual

### 4. Personalização
- Seleção de cores customizadas
- Diferentes tipos de gradiente
- Tamanhos de gráfico variáveis

### 5. Performance
- Virtualização para grandes datasets
- Lazy loading de dados
- Memoização de cálculos

### 6. Acessibilidade
- Suporte a leitores de tela
- Navegação por teclado
- Alto contraste

### 7. Analytics
- Tracking de interações
- Métricas de uso
- Heatmaps de cliques

## Exemplo de Evolução

### Gráfico Comparativo (Antes vs Depois)
```tsx
<HorizontalBarChart
  data={dataAtual}
  comparisonData={dataAnterior}
  showComparison={true}
/>
```

### Gráfico com Filtros
```tsx
<HorizontalBarChart
  data={data}
  filters={[
    { label: "Último mês", value: "month" },
    { label: "Último ano", value: "year" },
  ]}
  onFilterChange={(filter) => updateData(filter)}
/>
```

### Gráfico Interativo
```tsx
<HorizontalBarChart
  data={data}
  onBarClick={(empresa) => {
    // Navegar para detalhes da empresa
    navigate(`/empresas/${empresa}`);
  }}
  clickable={true}
/>
```

