# Classes Tailwind Utilizadas na Sidebar

## Cores e Backgrounds

### Backgrounds
- `bg-sidebar` - Background principal da sidebar
- `bg-sidebar-accent` - Background de hover/ativo
- `bg-sidebar-primary` - Background primário
- `bg-gradient-to-br` - Gradiente diagonal (bottom-right)
- `bg-muted` - Background neutro
- `bg-background` - Background padrão do tema

### Textos
- `text-sidebar-foreground` - Texto principal da sidebar
- `text-sidebar-primary` - Texto com cor primária
- `text-sidebar-accent-foreground` - Texto sobre accent
- `text-muted-foreground` - Texto secundário
- `text-primary` - Texto primário
- `text-foreground` - Texto padrão do tema

### Bordas
- `border-sidebar-border` - Borda padrão da sidebar
- `border-b` - Borda inferior
- `border-t` - Borda superior
- `border-r` - Borda direita
- `border-l` - Borda esquerda

## Espaçamento

### Padding
- `p-2` - Padding pequeno (0.5rem)
- `p-3` - Padding médio (0.75rem)
- `p-4` - Padding grande (1rem)
- `px-2` - Padding horizontal pequeno
- `py-1.5` - Padding vertical médio-pequeno
- `px-1.5` - Padding horizontal muito pequeno
- `py-0` - Sem padding vertical

### Margin
- `mb-0.5` - Margin bottom muito pequeno
- `-ml-1` - Margin left negativo
- `gap-2` - Espaçamento entre itens (0.5rem)
- `gap-3` - Espaçamento entre itens (0.75rem)

## Dimensões

### Largura
- `w-60` - Largura expandida (15rem / 240px)
- `w-14` - Largura colapsada (3.5rem / 56px)
- `w-10` - Largura média (2.5rem / 40px)
- `w-7` - Largura pequena (1.75rem / 28px)
- `w-full` - Largura completa
- `w-auto` - Largura automática
- `min-w-0` - Largura mínima zero

### Altura
- `h-8` - Altura padrão (2rem / 32px)
- `h-7` - Altura pequena (1.75rem / 28px)
- `h-4` - Altura muito pequena (1rem / 16px)
- `h-full` - Altura completa
- `h-svh` - Altura da viewport (small viewport height)

### Tamanhos de Ícones
- `w-5 h-5` - Ícone médio (1.25rem)
- `w-3.5 h-3.5` - Ícone pequeno (0.875rem)
- `w-4 h-4` - Ícone pequeno-médio (1rem)
- `size-4` - Tamanho quadrado (1rem)

## Tipografia

### Tamanhos
- `text-base` - Tamanho base (1rem)
- `text-sm` - Tamanho pequeno (0.875rem)
- `text-xs` - Tamanho extra pequeno (0.75rem)
- `text-[10px]` - Tamanho customizado muito pequeno

### Peso
- `font-bold` - Negrito
- `font-semibold` - Semi-negrito
- `font-medium` - Médio

### Transformação
- `uppercase` - Maiúsculas
- `truncate` - Truncar texto com ellipsis

### Espaçamento de Letras
- `tracking-tight` - Espaçamento apertado
- `tracking-wider` - Espaçamento largo

## Layout

### Display
- `flex` - Display flex
- `flex-col` - Direção coluna
- `flex-1` - Flex grow 1
- `flex-shrink-0` - Não encolher
- `hidden` - Oculto
- `block` - Display block

### Alinhamento
- `items-center` - Alinhar itens ao centro
- `justify-center` - Justificar ao centro
- `justify-start` - Justificar ao início
- `text-left` - Texto à esquerda
- `text-center` - Texto centralizado

### Posicionamento
- `relative` - Posição relativa
- `absolute` - Posição absoluta
- `fixed` - Posição fixa
- `inset-y-0` - Top e bottom 0
- `left-0` - Esquerda 0
- `right-0` - Direita 0

## Efeitos Visuais

### Bordas
- `rounded-md` - Bordas arredondadas médias
- `rounded-xl` - Bordas arredondadas grandes
- `rounded-full` - Bordas completamente arredondadas

### Sombras
- `shadow` - Sombra padrão
- `shadow-lg` - Sombra grande

### Anéis (Ring)
- `ring-2` - Anel de 2px
- `ring-sidebar-ring` - Cor do anel
- `ring-blue-500/20` - Anel azul com opacidade

### Opacidade
- `opacity-0` - Transparente
- `opacity-50` - Semi-transparente
- `opacity-80` - Quase opaco

### Escala
- `scale-90` - Escala 90%
- `scale-75` - Escala 75%

## Transições e Animações

### Transições
- `transition-all` - Transição em todas as propriedades
- `transition-colors` - Transição de cores
- `duration-200` - Duração 200ms
- `ease-linear` - Curva linear
- `ease-out` - Curva ease-out

### Estados de Hover
- `hover:bg-sidebar-accent` - Background no hover
- `hover:text-sidebar-foreground` - Texto no hover
- `hover:opacity-80` - Opacidade no hover

### Estados Ativos
- `active:bg-sidebar-accent` - Background quando ativo
- `data-active=true` - Atributo data para estado ativo

## Estados Responsivos

### Modo Colapsado
- `group-data-[collapsible=icon]:overflow-hidden` - Ocultar overflow quando colapsado
- `group-data-[collapsible=icon]:opacity-0` - Ocultar quando colapsado
- `group-data-[collapsible=icon]:!size-8` - Tamanho fixo quando colapsado
- `group-data-[collapsible=icon]:!p-2` - Padding fixo quando colapsado
- `group-data-[collapsible=icon]:hidden` - Ocultar completamente quando colapsado

### Modo Mobile
- `md:block` - Mostrar apenas em desktop
- `sm:flex` - Flex apenas em telas pequenas e acima

## Utilitários

### Overflow
- `overflow-auto` - Scroll automático
- `overflow-hidden` - Ocultar overflow
- `truncate` - Truncar texto

### Cursor
- `cursor-pointer` - Cursor de ponteiro
- `cursor-w-resize` - Cursor de redimensionar oeste
- `cursor-e-resize` - Cursor de redimensionar leste

### Seleção
- `select-none` - Não selecionável

### Z-index
- `z-10` - Z-index 10
- `z-20` - Z-index 20



