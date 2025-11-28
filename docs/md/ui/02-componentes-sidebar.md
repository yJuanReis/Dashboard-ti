# Componentes da Sidebar

## Estrutura Principal

### 1. SidebarProvider
- **Função**: Context provider que gerencia o estado da sidebar
- **Localização**: `src/components/ui/sidebar.tsx`
- **Propriedades**:
  - `defaultOpen`: boolean (padrão: true)
  - `open`: boolean (controlado externamente)
  - `onOpenChange`: função callback

### 2. Sidebar
- **Função**: Container principal da sidebar
- **Propriedades**:
  - `side`: "left" | "right" (padrão: "left")
  - `variant`: "sidebar" | "floating" | "inset" (padrão: "sidebar")
  - `collapsible`: "offcanvas" | "icon" | "none" (padrão: "offcanvas")
- **Larguras**:
  - Expandida: `16rem` (256px)
  - Mobile: `18rem` (288px)
  - Ícone (colapsada): `3rem` (48px)

### 3. SidebarHeader
- **Função**: Cabeçalho da sidebar
- **Classes padrão**: `flex flex-col gap-2 p-2`
- **Uso no AppSidebar**: Contém logo e título "BR Marinas"

### 4. SidebarContent
- **Função**: Área de conteúdo rolável
- **Classes padrão**: `flex min-h-0 flex-1 flex-col gap-2 overflow-auto`
- **Comportamento colapsado**: `group-data-[collapsible=icon]:overflow-hidden`

### 5. SidebarFooter
- **Função**: Rodapé da sidebar
- **Classes padrão**: `flex flex-col gap-2 p-2`
- **Uso no AppSidebar**: Contém perfil do usuário, notificações, logout e toggle de tema

## Componentes de Navegação

### 6. SidebarGroup
- **Função**: Agrupa itens de navegação
- **Classes padrão**: `relative flex w-full min-w-0 flex-col p-2`

### 7. SidebarGroupLabel
- **Função**: Rótulo do grupo (ex: "Navegação")
- **Classes padrão**: `flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70`
- **Comportamento colapsado**: `group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0`

### 8. SidebarGroupContent
- **Função**: Container do conteúdo do grupo
- **Classes padrão**: `w-full text-sm`

### 9. SidebarMenu
- **Função**: Lista de itens do menu
- **Classes padrão**: `flex w-full min-w-0 flex-col gap-1`

### 10. SidebarMenuItem
- **Função**: Item individual do menu
- **Classes padrão**: `group/menu-item relative`

### 11. SidebarMenuButton
- **Função**: Botão clicável do item do menu
- **Variantes**:
  - `default`: hover com accent
  - `outline`: com borda e sombra
- **Tamanhos**:
  - `default`: h-8 text-sm
  - `sm`: h-7 text-xs
  - `lg`: h-12 text-sm
- **Estados**:
  - `data-active=true`: item ativo
  - `data-state=open`: submenu aberto
  - Colapsado: `group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2`

## Componentes Auxiliares

### 12. SidebarTrigger
- **Função**: Botão para abrir/fechar sidebar
- **Classes**: `h-7 w-7` com ícone PanelLeft

### 13. SidebarRail
- **Função**: Área clicável para redimensionar/toggle
- **Posição**: Absoluta, borda da sidebar

### 14. SidebarSeparator
- **Função**: Separador visual
- **Classes**: `mx-2 w-auto bg-sidebar-border`

### 15. SidebarInput
- **Função**: Campo de input estilizado para sidebar
- **Classes**: `h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring`



