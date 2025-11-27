# Variáveis CSS da Sidebar

## Modo Claro (Light Mode)

```css
--sidebar-background: 0 0% 100%; /* Branco puro */
--sidebar-foreground: 222 47% 11%; /* Azul-escuro profundo - texto */
--sidebar-primary: 217 91% 60%; /* Azul vibrante profissional */
--sidebar-primary-foreground: 0 0% 100%; /* Branco */
--sidebar-accent: 210 40% 96%; /* Cinza azulado muito claro */
--sidebar-accent-foreground: 222 47% 11%; /* Azul-escuro profundo */
--sidebar-border: 214 32% 91%; /* Cinza claro para bordas */
--sidebar-ring: 217 91% 60%; /* Azul primário para anéis de foco */
```

## Modo Escuro (Dark Mode)

```css
--sidebar-background: 217 33% 8%; /* Quase preto azulado */
--sidebar-foreground: 210 40% 98%; /* Branco quase puro - texto */
--sidebar-primary: 217 91% 65%; /* Azul vibrante e claro */
--sidebar-primary-foreground: 222 47% 4%; /* Quase preto */
--sidebar-accent: 217 33% 17%; /* Cinza-azulado médio */
--sidebar-accent-foreground: 210 40% 98%; /* Branco quase puro */
--sidebar-border: 217 33% 20%; /* Cinza-azulado com contraste */
--sidebar-ring: 217 91% 65%; /* Azul primário do tema escuro */
```

## Uso no Tailwind

As variáveis são usadas através das classes Tailwind:
- `bg-sidebar` → `background-color: hsl(var(--sidebar-background))`
- `text-sidebar-foreground` → `color: hsl(var(--sidebar-foreground))`
- `bg-sidebar-accent` → `background-color: hsl(var(--sidebar-accent))`
- `border-sidebar-border` → `border-color: hsl(var(--sidebar-border))`
- `ring-sidebar-ring` → `ring-color: hsl(var(--sidebar-ring))`



