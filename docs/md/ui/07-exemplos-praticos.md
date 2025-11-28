# Exemplos Práticos de Uso

## Exemplo 1: Estrutura Básica da Sidebar

```tsx
<Sidebar className={isCollapsed ? "w-14" : "w-60"} collapsible="icon">
  <SidebarHeader className="border-b border-sidebar-border p-4">
    {/* Logo e título */}
  </SidebarHeader>
  
  <SidebarContent className="p-2">
    <SidebarGroup className="p-2">
      <SidebarGroupLabel>Navegação</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {/* Itens de menu */}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  </SidebarContent>
  
  <SidebarFooter className="border-t border-sidebar-border p-3">
    {/* Perfil e ações */}
  </SidebarFooter>
</Sidebar>
```

## Exemplo 2: Item de Menu com Badge

```tsx
<SidebarMenuItem>
  <SidebarMenuButton asChild className="h-8 text-sm mb-0.5">
    <NavLink 
      to="/configuracoes"
      className="transition-all duration-200 hover:bg-sidebar-accent text-sidebar-foreground flex items-center gap-2 px-2 py-1.5 rounded-md group"
      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
    >
      <Settings className="w-3.5 h-3.5 flex-shrink-0" />
      {!isCollapsed && (
        <>
          <span className="font-medium text-xs truncate flex-1">
            Configurações
          </span>
          <Badge 
            variant="outline" 
            className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0 h-4 shadow"
          >
            Novo
          </Badge>
        </>
      )}
    </NavLink>
  </SidebarMenuButton>
</SidebarMenuItem>
```

## Exemplo 3: Logo com Gradiente

```tsx
<div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-blue-500/20">
  <Waves className="w-5 h-5 text-white" />
</div>
```

## Exemplo 4: Avatar do Usuário

```tsx
{/* Expandido */}
<div className="flex items-center gap-2">
  <div className="w-7 h-7 bg-gradient-to-br from-primary/20 to-primary/30 rounded-full flex items-center justify-center flex-shrink-0">
    <span className="text-primary font-semibold text-[10px]">
      {displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
    </span>
  </div>
  <div className="flex-1 min-w-0 text-left">
    <p className="font-semibold text-sidebar-foreground text-xs truncate">
      {displayName}
    </p>
    <p className="text-[10px] text-muted-foreground truncate">
      {user?.email}
    </p>
  </div>
</div>

{/* Colapsado */}
<div className="w-7 h-7 bg-gradient-to-br from-primary/20 to-primary/30 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity">
  <span className="text-primary font-semibold text-[10px]">
    {displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
  </span>
</div>
```

## Exemplo 5: Badge de Manutenção

```tsx
// Função para obter classes do badge
const getBadgeClasses = (variant: "blue" | "gray" | "yellow") => {
  switch (variant) {
    case "blue":
      return "bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30";
    case "yellow":
      return "bg-warning/10 text-warning border-warning/20 dark:bg-warning/20 dark:text-warning dark:border-warning/30";
    case "gray":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

// Uso
<Badge 
  variant="outline" 
  className={`${getBadgeClasses("blue")} text-[10px] px-1.5 py-0 h-4 shadow`}
>
  Em Manutenção
</Badge>
```

## Exemplo 6: Botão de Ação no Footer

```tsx
{/* Botão de Notificações */}
<Button 
  variant="ghost" 
  size="icon" 
  className="h-7 w-7 flex-shrink-0"
  onClick={() => setNotificationsModalOpen(true)}
  title="Notificações"
>
  <Bell className="w-3.5 h-3.5 text-muted-foreground" />
</Button>

{/* Botão de Logout */}
<Button
  variant="ghost"
  size="sm"
  onClick={handleLogout}
  className="flex-1 justify-start text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent min-w-0"
>
  <LogOut className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
  <span className="truncate">Sair</span>
</Button>
```

## Exemplo 7: Label de Grupo

```tsx
<SidebarGroupLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
  {!isCollapsed && "Navegação"}
</SidebarGroupLabel>
```

## Exemplo 8: Estado Ativo do Item

```tsx
const isActive = (path: string) => {
  return location.pathname === path;
};

// Uso no NavLink
<NavLink 
  to={item.url}
  className={cn(
    "transition-all duration-200 hover:bg-sidebar-accent text-sidebar-foreground flex items-center gap-2 px-2 py-1.5 rounded-md group",
    isActive(item.url) && "bg-sidebar-accent text-sidebar-primary font-semibold"
  )}
>
  {/* Conteúdo */}
</NavLink>
```

## Exemplo 9: Responsividade com Estado Colapsado

```tsx
const { state } = useSidebar();
const isCollapsed = state === "collapsed";

// Renderização condicional
{!isCollapsed && (
  <span className="font-medium text-xs truncate flex-1">
    {item.title}
  </span>
)}

// Classes condicionais
<Sidebar className={isCollapsed ? "w-14" : "w-60"} collapsible="icon">
```

## Exemplo 10: Transições Suaves

```tsx
// Transição em todos os elementos
className="transition-all duration-200"

// Transição apenas de cores
className="transition-colors"

// Transição de opacidade
className="hover:opacity-80 transition-opacity"

// Transição de largura/altura
className="transition-[width,height,padding] duration-200 ease-linear"
```

## Exemplo 11: Customização de Cores

```tsx
// Usando variáveis CSS
<div className="bg-sidebar text-sidebar-foreground border-sidebar-border">
  {/* Conteúdo */}
</div>

// Usando cores diretas do tema
<div className="bg-primary/10 text-primary border-primary/20">
  {/* Badge */}
</div>

// Suporte a modo escuro
<div className="bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary">
  {/* Conteúdo */}
</div>
```

## Exemplo 12: Estrutura Completa com Provider

```tsx
<SidebarProvider defaultOpen={true}>
  <div className="flex min-h-svh w-full">
    <AppSidebar />
    <SidebarInset>
      <SidebarTrigger />
      {/* Conteúdo principal */}
    </SidebarInset>
  </div>
</SidebarProvider>
```

## Dicas de Uso

### 1. Sempre use as variáveis CSS da sidebar
```tsx
// ✅ Correto
className="bg-sidebar-accent text-sidebar-foreground"

// ❌ Evitar
className="bg-gray-100 text-gray-900"
```

### 2. Use truncate para textos longos
```tsx
<span className="truncate">{longText}</span>
```

### 3. Mantenha tamanhos consistentes
- Ícones: `w-3.5 h-3.5` ou `w-5 h-5`
- Botões: `h-7 w-7` ou `h-8`
- Texto: `text-xs` ou `text-[10px]`

### 4. Use flex-shrink-0 em elementos que não devem encolher
```tsx
<Icon className="w-3.5 h-3.5 flex-shrink-0" />
```

### 5. Sempre considere o estado colapsado
```tsx
{!isCollapsed && <TextContent />}
```



