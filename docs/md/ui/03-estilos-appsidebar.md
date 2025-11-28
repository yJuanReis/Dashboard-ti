# Estilos Específicos do AppSidebar

## Header (Cabeçalho)

### Logo e Título
```tsx
// Logo Container
<div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-blue-500/20">
  <Waves className="w-5 h-5 text-white" />
</div>

// Título
<h2 className="font-bold text-sidebar-foreground text-base tracking-tight">BR Marinas</h2>
```

**Características**:
- Gradiente azul: `from-blue-500 via-blue-600 to-cyan-500`
- Bordas arredondadas: `rounded-xl`
- Sombra: `shadow-lg`
- Anel: `ring-2 ring-blue-500/20`
- Ícone Waves (lucide-react)

### Bordas do Header
```tsx
<SidebarHeader className="border-b border-sidebar-border p-4">
```

## Navegação

### Label do Grupo
```tsx
<SidebarGroupLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
  {!isCollapsed && "Navegação"}
</SidebarGroupLabel>
```

**Características**:
- Texto muito pequeno: `text-[10px]`
- Maiúsculas: `uppercase`
- Espaçamento de letras: `tracking-wider`
- Cor: `text-muted-foreground`

### Itens de Menu
```tsx
<SidebarMenuButton asChild className="h-8 text-sm mb-0.5">
  <NavLink 
    to={item.url}
    className="transition-all duration-200 hover:bg-sidebar-accent text-sidebar-foreground flex items-center gap-2 px-2 py-1.5 rounded-md group"
    activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
  >
    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
    {!isCollapsed && (
      <>
        <span className="font-medium text-xs truncate flex-1">
          {item.title}
        </span>
        {item.badge && (
          <Badge 
            variant="outline" 
            className={`${getBadgeClasses(item.badge.variant)} text-[10px] px-1.5 py-0 h-4 shadow`}
          >
            {item.badge.text}
          </Badge>
        )}
      </>
    )}
  </NavLink>
</SidebarMenuButton>
```

**Características**:
- Altura: `h-8`
- Texto: `text-sm` (container), `text-xs` (span)
- Transição: `transition-all duration-200`
- Hover: `hover:bg-sidebar-accent`
- Estado ativo: `bg-sidebar-accent text-sidebar-primary font-semibold`
- Ícones: `w-3.5 h-3.5`
- Espaçamento: `gap-2`, `px-2 py-1.5`
- Bordas: `rounded-md`

### Badges de Manutenção
```tsx
// Variante Azul
bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30

// Variante Amarela
bg-warning/10 text-warning border-warning/20 dark:bg-warning/20 dark:text-warning dark:border-warning/30

// Variante Cinza
bg-muted text-muted-foreground border-border
```

**Características**:
- Tamanho: `text-[10px] px-1.5 py-0 h-4`
- Sombra: `shadow`
- Suporte a modo escuro com opacidades diferentes

## Footer (Rodapé)

### Perfil do Usuário (Expandido)
```tsx
<div className="flex items-center gap-2">
  <button className="flex items-center gap-2 flex-1 min-w-0 hover:bg-sidebar-accent rounded-md p-1 -ml-1 transition-colors">
    <div className="w-7 h-7 bg-gradient-to-br from-primary/20 to-primary/30 rounded-full flex items-center justify-center flex-shrink-0">
      <span className="text-primary font-semibold text-[10px]">
        {displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
      </span>
    </div>
    <div className="flex-1 min-w-0 text-left">
      <p className="font-semibold text-sidebar-foreground text-xs truncate">{displayName}</p>
      <p className="text-[10px] text-muted-foreground truncate">{user?.email || "admin@brmarinas.com"}</p>
    </div>
  </button>
</div>
```

**Características**:
- Avatar circular com gradiente: `bg-gradient-to-br from-primary/20 to-primary/30`
- Iniciais do nome em maiúsculas
- Nome: `text-xs font-semibold`
- Email: `text-[10px] text-muted-foreground`
- Truncate para textos longos

### Perfil do Usuário (Colapsado)
```tsx
<button className="w-7 h-7 bg-gradient-to-br from-primary/20 to-primary/30 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity">
  <span className="text-primary font-semibold text-[10px]">
    {displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
  </span>
</button>
```

### Botões de Ação
```tsx
// Botão de Notificações
<Button 
  variant="ghost" 
  size="icon" 
  className="h-7 w-7 flex-shrink-0"
>
  <Bell className="w-3.5 h-3.5 text-muted-foreground" />
</Button>

// Botão de Logout
<Button
  variant="ghost"
  size="sm"
  className="flex-1 justify-start text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent min-w-0"
>
  <LogOut className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
  <span className="truncate">Sair</span>
</Button>
```

**Características**:
- Ícones: `w-3.5 h-3.5`
- Tamanho consistente: `h-7 w-7`
- Cores: `text-muted-foreground` com hover para `text-sidebar-foreground`

### Toggle de Tema
```tsx
// Expandido
<div className="flex-shrink-0 scale-90 origin-center">
  <ThemeToggle />
</div>

// Colapsado
<div className="scale-75">
  <ThemeToggle />
</div>
```

## Estados Responsivos

### Largura da Sidebar
```tsx
<Sidebar className={isCollapsed ? "w-14" : "w-60"} collapsible="icon">
```

- Expandida: `w-60` (240px / 15rem)
- Colapsada: `w-14` (56px / 3.5rem)

### Bordas do Footer
```tsx
<SidebarFooter className="border-t border-sidebar-border p-3">
```

## Modais

### Modal de Notificações
- Largura máxima: `max-w-md`
- Background: `bg-muted` para seções
- Toggles customizados com animação

### Modal de Configurações
- Largura máxima: `max-w-2xl`
- Altura máxima: `max-h-[90vh]`
- Scroll: `overflow-y-auto`
- Espaçamento: `space-y-6 pt-4`



