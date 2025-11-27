# Estrutura Completa da Sidebar

## Hierarquia de Componentes

```
SidebarProvider
└── Sidebar (w-60 expandida / w-14 colapsada)
    ├── SidebarHeader (border-b border-sidebar-border p-4)
    │   ├── Logo Container (w-10 h-10, gradiente azul)
    │   │   └── Ícone Waves (w-5 h-5 text-white)
    │   └── Título "BR Marinas" (font-bold text-base)
    │
    ├── SidebarContent (p-2)
    │   └── SidebarGroup (p-2)
    │       ├── SidebarGroupLabel (text-[10px] uppercase)
    │       │   └── "Navegação" (apenas quando expandida)
    │       │
    │       └── SidebarGroupContent
    │           └── SidebarMenu (gap-1)
    │               └── SidebarMenuItem (múltiplos)
    │                   └── SidebarMenuButton (h-8 text-sm)
    │                       └── NavLink
    │                           ├── Ícone (w-3.5 h-3.5)
    │                           ├── Título (text-xs font-medium)
    │                           └── Badge (opcional, text-[10px] h-4)
    │
    └── SidebarFooter (border-t border-sidebar-border p-3)
        ├── Perfil do Usuário
        │   ├── Avatar (w-7 h-7, gradiente, iniciais)
        │   ├── Nome (text-xs font-semibold)
        │   └── Email (text-[10px] text-muted-foreground)
        │
        ├── Botão Notificações (h-7 w-7, ícone Bell)
        │
        ├── Botão Logout (flex-1, ícone LogOut)
        │
        └── ThemeToggle (scale-90 ou scale-75)
```

## Estados da Sidebar

### Expandida (w-60)
- Largura: 240px (15rem)
- Todos os textos visíveis
- Labels de grupo visíveis
- Badges visíveis
- Perfil completo com nome e email

### Colapsada (w-14)
- Largura: 56px (3.5rem)
- Apenas ícones visíveis
- Labels ocultos (opacity-0)
- Badges ocultos
- Perfil apenas com avatar
- Tooltips aparecem no hover

## Modais Integrados

### Modal de Notificações
- Abre ao clicar no ícone Bell
- Contém:
  - Toggle de notificações por email
  - Toggle de alertas do sistema
  - Botão para limpar cache

### Modal de Configurações
- Abre ao clicar no perfil do usuário
- Contém:
  - Campo para editar nome de exibição
  - Seção de alteração de senha
    - Campo senha atual
    - Campo nova senha (com medidor de força)
    - Campo confirmar senha
    - Botão de reset por email

## Navegação

### Itens de Navegação Base
1. Início (LayoutDashboard) - /home
2. Senhas (Key) - /senhas
3. Crachás (IdCard) - /crachas
4. Assinaturas (Mail) - /assinaturas
5. Controle NVR (Video) - /controle-nvr
6. Controle de HDs (HardDrive) - /Controle-hds
7. Termo de Responsabilidade (FileText) - /termos
8. Gestão de Rede (Network) - /gestaorede
9. Servidores (Server) - /servidores
10. Chamados (Wrench) - /chamados
11. Configurações (Settings) - /configuracoes (apenas admin)

### Filtragem
- Itens são filtrados por permissões do usuário
- Configurações só aparece para admins
- Badges de manutenção são adicionados dinamicamente

## Responsividade

### Desktop
- Sidebar fixa na lateral esquerda
- Pode ser expandida ou colapsada
- Transições suaves entre estados

### Mobile
- Sidebar convertida em Sheet (drawer)
- Abre/fecha com animação
- Largura: 18rem (288px)
- Overlay escuro quando aberta

## Interações

### Hover
- Itens de menu: `hover:bg-sidebar-accent`
- Botões: mudança de cor e opacidade
- Cards de perfil: `hover:opacity-80`

### Ativo
- Item de menu ativo: `bg-sidebar-accent text-sidebar-primary font-semibold`
- Detectado via `isActive(item.url)` comparando com `location.pathname`

### Transições
- Duração padrão: 200ms
- Tipo: `ease-linear` ou `ease-out`
- Propriedades: `all`, `colors`, `width`, `height`, `padding`

## Acessibilidade

### Atalhos de Teclado
- `Ctrl/Cmd + B`: Toggle da sidebar

### Screen Readers
- `sr-only` em elementos visuais apenas
- `aria-label` em botões sem texto
- `title` attributes em botões de ação

### Foco
- Anéis de foco: `ring-sidebar-ring`
- Visibilidade garantida em todos os elementos interativos



