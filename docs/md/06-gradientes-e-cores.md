# Gradientes e Cores Específicas

## Gradiente do Logo

### Código
```tsx
bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500
```

### Valores HSL
- **from-blue-500**: `217 91% 60%` (Azul vibrante)
- **via-blue-600**: `217 91% 52%` (Azul mais escuro)
- **to-cyan-500**: `198 93% 60%` (Ciano vibrante)

### Aplicação
- Container do logo: `w-10 h-10`
- Bordas: `rounded-xl`
- Sombra: `shadow-lg`
- Anel: `ring-2 ring-blue-500/20` (20% de opacidade)

## Gradiente do Avatar do Usuário

### Código
```tsx
bg-gradient-to-br from-primary/20 to-primary/30
```

### Valores HSL (Modo Claro)
- **from-primary/20**: `217 91% 60%` com 20% de opacidade
- **to-primary/30**: `217 91% 60%` com 30% de opacidade

### Valores HSL (Modo Escuro)
- **from-primary/20**: `217 91% 65%` com 20% de opacidade
- **to-primary/30**: `217 91% 65%` com 30% de opacidade

### Aplicação
- Container: `w-7 h-7 rounded-full`
- Texto: `text-primary font-semibold text-[10px]`
- Iniciais do nome em maiúsculas

## Cores dos Badges

### Badge Azul (Primary)
```tsx
bg-primary/10 text-primary border-primary/20
dark:bg-primary/20 dark:text-primary dark:border-primary/30
```
- Background claro: 10% opacidade
- Background escuro: 20% opacidade
- Borda claro: 20% opacidade
- Borda escuro: 30% opacidade

### Badge Amarelo (Warning)
```tsx
bg-warning/10 text-warning border-warning/20
dark:bg-warning/20 dark:text-warning dark:border-warning/30
```
- **Warning claro**: `38 92% 50%` (Âmbar/laranja vibrante)
- **Warning escuro**: `38 92% 60%` (Âmbar vibrante e claro)

### Badge Cinza (Muted)
```tsx
bg-muted text-muted-foreground border-border
```
- **Muted claro**: `210 40% 96%` (Cinza azulado muito claro)
- **Muted escuro**: `217 33% 17%` (Cinza-azulado médio)
- **Muted-foreground claro**: `215 16% 40%`
- **Muted-foreground escuro**: `215 20% 70%`

## Cores de Estado

### Hover
- Background: `bg-sidebar-accent`
  - Claro: `210 40% 96%`
  - Escuro: `217 33% 17%`
- Texto: `text-sidebar-accent-foreground`
  - Claro: `222 47% 11%`
  - Escuro: `210 40% 98%`

### Ativo
- Background: `bg-sidebar-accent` (mesmo do hover)
- Texto: `text-sidebar-primary`
  - Claro: `217 91% 60%`
  - Escuro: `217 91% 65%`
- Peso: `font-semibold`

### Desabilitado
- Opacidade: `opacity-50`
- Cursor: `pointer-events-none`

## Cores de Borda

### Bordas Principais
- **Sidebar border claro**: `214 32% 91%` (Cinza claro)
- **Sidebar border escuro**: `217 33% 20%` (Cinza-azulado com contraste)

### Aplicação
- Header: `border-b border-sidebar-border`
- Footer: `border-t border-sidebar-border`
- Separadores: `bg-sidebar-border`

## Cores de Texto

### Hierarquia de Texto
1. **Primário**: `text-sidebar-foreground`
   - Claro: `222 47% 11%` (Azul-escuro profundo)
   - Escuro: `210 40% 98%` (Branco quase puro)

2. **Secundário**: `text-muted-foreground`
   - Claro: `215 16% 40%` (Texto cinza mais escuro)
   - Escuro: `215 20% 70%` (Texto cinza claro)

3. **Destaque**: `text-sidebar-primary`
   - Claro: `217 91% 60%` (Azul vibrante)
   - Escuro: `217 91% 65%` (Azul brilhante)

### Tamanhos de Texto
- Título principal: `text-base` (1rem)
- Labels de grupo: `text-[10px]` (0.625rem)
- Itens de menu: `text-xs` (0.75rem)
- Email/descrições: `text-[10px]` (0.625rem)

## Opacidades Utilizadas

### Backgrounds com Opacidade
- `/10`: 10% de opacidade (badges claros)
- `/20`: 20% de opacidade (badges escuros, anéis)
- `/30`: 30% de opacidade (bordas de badges escuros)

### Estados de Opacidade
- `opacity-0`: Completamente transparente (oculto)
- `opacity-50`: Semi-transparente (desabilitado)
- `opacity-80`: Quase opaco (hover em alguns elementos)

## Anéis de Foco

### Código
```tsx
ring-2 ring-sidebar-ring focus-visible:ring-2
```

### Valores
- **Sidebar ring claro**: `217 91% 60%` (Azul primário)
- **Sidebar ring escuro**: `217 91% 65%` (Azul primário escuro)
- Largura: `2px` (`ring-2`)

### Aplicação
- Botões interativos
- Inputs
- Links focáveis
- Elementos com `focus-visible:ring-2`



