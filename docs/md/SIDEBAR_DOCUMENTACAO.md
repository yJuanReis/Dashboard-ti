## Documentação da Sidebar (Desktop e Mobile)

### Visão Geral

A sidebar do sistema foi construída sobre um componente genérico (`src/components/ui/sidebar.tsx`) e um componente de aplicação (`src/components/AppSidebar.tsx`), envolvendo tudo dentro de um provedor de contexto (`SidebarProvider`) no `Layout`.

Ela oferece:
- Funcionamento diferente em **desktop** (fixa/colapsável) e **mobile** (drawer/modal lateral).
- Controle centralizado de estado (aberta/fechada, colapsada, mobile x desktop).
- Integração com autenticação, permissões, badges de manutenção e modais de configurações.

---

## 1. Onde a Sidebar é Usada

### 1.1. `Layout` (estrutura principal)

- Arquivo: `src/components/Layout.tsx`
- Responsável por:
  - Criar o **contexto da sidebar** com `SidebarProvider`.
  - Inserir o componente `AppSidebar`.
  - Renderizar o cabeçalho com o botão que abre/fecha a sidebar.
  - Renderizar o conteúdo principal (`children`).

Pontos-chave:
- Usa `useIsMobile()` para detectar se é mobile.
- Define `defaultOpen` da sidebar com base no dispositivo:
  - Desktop: começa **aberta**.
  - Mobile: começa **fechada**.

---

## 2. Detecção de Mobile

### 2.1. Hook `useIsMobile`

- Arquivo: `src/hooks/use-mobile.tsx`
- Lógica:
  - Breakpoint base: **768px**.
  - `isMobile = window.innerWidth < 768`.
  - Usa `window.matchMedia` para reagir ao `resize`.
  - Retorna sempre um booleano (`!!isMobile`).

Uso principal:
- No `Layout`, para decidir se `defaultOpen` da sidebar será `true` (desktop) ou `false` (mobile).
- Dentro de `SidebarProvider`, para decidir se o comportamento será de **sidebar fixa** ou **drawer mobile**.

---

## 3. Infraestrutura da Sidebar (`ui/sidebar.tsx`)

### 3.1. Constantes importantes

- `SIDEBAR_COOKIE_NAME = "sidebar:state"`  
- `SIDEBAR_COOKIE_MAX_AGE = 7 dias`
- `SIDEBAR_WIDTH = "16rem"` → largura base da sidebar no desktop.
- `SIDEBAR_WIDTH_MOBILE = "18rem"` → largura do drawer no mobile.
- `SIDEBAR_WIDTH_ICON = "3rem"` → largura quando colapsada em modo ícone (desktop).
- `SIDEBAR_KEYBOARD_SHORTCUT = "b"` → atalho de teclado.

### 3.2. Contexto da Sidebar

O `SidebarContext` expõe:

- **`state`**: `"expanded"` ou `"collapsed"` (só desktop).
- **`open`**: booleano (aberta/fechada no desktop).
- **`setOpen`**: função para alterar `open`.
- **`openMobile`**: booleano (aberta/fechada no mobile).
- **`setOpenMobile`**: função para alterar `openMobile`.
- **`isMobile`**: booleano (resultado de `useIsMobile`).
- **`toggleSidebar()`**: alterna o estado:
  - Em mobile: mexe em `openMobile`.
  - Em desktop: mexe em `open`.

### 3.3. `SidebarProvider`

Funções principais:
- Gerencia:
  - Estado **controlado ou não** (`openProp` / `setOpenProp` ou estado interno).
  - `open` e `openMobile`.
  - Cálculo de `state = open ? "expanded" : "collapsed"`.
- Persistência:
  - Sempre que `setOpen` muda, grava um cookie `sidebar:state=<true|false>`.
- Atalhos de teclado:
  - `Ctrl + B` ou `Cmd + B` → chama `toggleSidebar()`.

Também define estilos globais via CSS custom properties:
- `--sidebar-width` (largura base).
- `--sidebar-width-icon` (icone colapsado).

### 3.4. Componente `Sidebar` (comportamento desktop x mobile)

#### 3.4.1. `collapsible="none"`

- Não colapsa, não vira drawer, é apenas um container fixo com largura `--sidebar-width`.

#### 3.4.2. Modo **Mobile**

- Se `isMobile` é `true`:
  - Renderiza um `Sheet` (`drawer`) lateral com `SheetContent`.
  - `open={openMobile}` e `onOpenChange={setOpenMobile}`.
  - `--sidebar-width` é sobrescrita por `SIDEBAR_WIDTH_MOBILE` (`18rem`).
  - Mostra o mesmo conteúdo da sidebar dentro do drawer.
  - Tem overlay escuro e animação de abertura/fechamento (do próprio `Sheet`).

#### 3.4.3. Modo **Desktop**

- Estrutura:
  - Um wrapper com:
    - `div` que cria o **espaço/gap** lateral (`h-svh`, `w-[--sidebar-width]`, transição suave de width).
    - `div` fixo com a sidebar real (`fixed inset-y-0`, `w-[--sidebar-width]`).
- Suporte a:
  - `variant` (`sidebar`, `floating`, `inset`).
  - `collapsible="icon"`: reduz a sidebar à largura de ícones (`--sidebar-width-icon`).
  - `collapsible="offcanvas"`: move a sidebar para fora da tela.

### 3.5. `SidebarTrigger`

- Botão que abre/fecha a sidebar.

Comportamento:
- Ao clicar:
  - Chama `toggleSidebar()` do contexto.
- Em desktop:
  - Expande/colapsa a sidebar.
- Em mobile:
  - Abre/fecha o drawer (`openMobile`).

É usado no cabeçalho do `Layout`, com ícone `Menu`.

---

## 4. Componente de Aplicação: `AppSidebar`

### 4.1. Arquivo e contexto

- Arquivo: `src/components/AppSidebar.tsx`
- Usa:
  - `useSidebar()` para ler `state`, `setOpenMobile`, `isMobile`.
  - `useLocation`, `useNavigate` (React Router).
  - `useAuth` (usuario atual, `signOut`).
  - `usePagePermissions` (permissões e role).
  - `ThemeToggle` (modo claro/escuro).
  - Supabase (`supabase`), `toast`, `zxcvbn`, `getPagesInMaintenance`.

### 4.2. Estados internos principais

- **Mobile / colapsado**:
  - `state` do contexto → `isCollapsed = state === "collapsed"`.
  - `isMobile`, `setOpenMobile` para controlar drawer.

- **Modais**:
  - `notificationsModalOpen` (modal de notificações).
  - `settingsModalOpen` (modal de configurações/conta).

- **Perfil e nome**:
  - `nomeExibicao`, `loadingNome`.

- **Senha e segurança**:
  - `senhaAtual`, `novaSenha`, `confirmarSenha`.
  - `showSenhaAtual`, `showNovaSenha`, `showConfirmarSenha`.
  - `loading`, `mensagemSucesso`.
  - Proteção brute force:
    - `tentativasErradas`.
    - `bloqueadoAté` (Date | null).

- **Páginas em manutenção**:
  - `pagesMaintenance` (objeto com path → badgeText / badgeVariant).
  - `maintenanceUpdateTrigger` para forçar recomputação.

- **Notificações**:
  - `emailNotifications`, `systemAlerts`.

### 4.3. Efeitos importantes

- **Fechar sidebar no mobile quando a rota muda**:
  - `useEffect` que observa `location.pathname`.
  - Se `isMobile` é `true`, chama `setOpenMobile(false)`.

- **Sincronizar nome de exibição com `user.user_metadata`**.
- **Carregar e escutar mudanças de páginas em manutenção**:
  - Chama `getPagesInMaintenance()`.
  - Escuta evento `pagesMaintenanceChanged` (via `window.addEventListener`).
  - Recarrega a lista periodicamente (a cada 30s).

### 4.4. Itens de navegação

- Base: `baseNavigationItems` (array constante) com campos:
  - `title`, `url`, `icon`.
- Páginas:
  1. Início → `/home` (LayoutDashboard)
  2. Senhas → `/senhas` (Key)
  3. Crachás → `/crachas` (IdCard)
  4. Assinaturas → `/assinaturas` (Mail)
  5. Controle NVR → `/controle-nvr` (Video)
  6. Controle de HDs → `/Controle-hds` (HardDrive)
  7. Termo de Responsabilidade → `/termos` (FileText)
  8. Gestão de Rede → `/gestaorede` (Network)
  9. Servidores → `/servidores` (Server)
  10. Chamados → `/chamados` (Wrench)
  11. Configurações → `/configuracoes` (Settings, só admin).

#### 4.4.1. Badges de manutenção

- `navigationItems` é calculado com `useMemo`:
  - Pega `pagesMaintenance` (objeto carregado do banco).
  - Para cada item base:
    - Compara `item.url` com `page_path`.
    - Se tiver configuração ativa, adiciona `badge` ao item:
      - `badge.text` (texto exibido).
      - `badge.variant` (`"blue" | "gray" | "yellow"`, com classes específicas).

#### 4.4.2. Filtragem por permissão

- `filteredNavigationItems`:
  - Se `item.url === "/configuracoes"`:
    - Só mostra se `role === "admin"`.
  - Para outros itens:
    - Usa `hasPermission(item.url)`.

---

## 5. Layout Visual da Sidebar

### 5.1. Cabeçalho (`SidebarHeader`)

- Quando **expandida**:
  - Logo quadrada (10x10) com gradiente azul.
  - Ícone `Waves`.
  - Título “BR Marinas” (font-bold).
- Quando **colapsada**:
  - Apenas o ícone dentro do quadrado, centralizado.

### 5.2. Conteúdo (`SidebarContent` + `SidebarGroup`)

- `SidebarGroupLabel`:
  - Mostra “Navegação” quando não está colapsada.
- Menu (`SidebarMenu`):
  - Cada item é um `SidebarMenuItem` com `SidebarMenuButton` abrangendo:
    - `NavLink` do React Router personalizado.
    - Ícone do item.
    - Título.
    - Badge (se existir).

#### 5.2.1. Comportamento ao clicar nos links (especialmente no mobile)

- Para cada `NavLink`:
  - Em `onClick`, se `isMobile` é `true`, chama `setOpenMobile(false)`.
  - Isso faz o drawer fechar ao navegar para qualquer página.

### 5.3. Rodapé (`SidebarFooter`)

- Quando **expandida**:
  - Botão grande de perfil com:
    - Avatar (iniciais do usuário, gradiente).
    - Nome (`displayName` calculado).
    - Email (`user.email`).
    - Clica → abre modal de configurações.
  - Botão de notificações (ícone `Bell`) → abre modal de notificações.
  - Botão de Logout (`LogOut`) → chama `signOut()` e navega para `/login`.
  - `ThemeToggle` (switch de modo claro/escuro).

- Quando **colapsada**:
  - Apenas:
    - Avatar (abre configurações).
    - Botão `Bell`.
    - Botão `LogOut`.
    - `ThemeToggle` reduzido.

---

## 6. Modais Integrados à Sidebar

### 6.1. Modal de Notificações

- Controlado por: `notificationsModalOpen`.
- Conteúdo:
  - Toggle “Notificações por E-mail”.
  - Toggle “Alertas do Sistema”.
  - Botão “Limpar Cache”:
    - Limpa `localStorage` (exceto `supabase.auth.token`).
    - Limpa `sessionStorage`.
    - Limpa caches do `caches` API (se existir).

### 6.2. Modal de Configurações (Perfil/Senha)

- Controlado por: `settingsModalOpen`.
- Seções:

#### 6.2.1. Nome de exibição

- Input com `nomeExibicao`.
- Botão “Guardar”:
  - Atualiza `user_metadata` no Supabase (`nome` e `name`).
  - Tenta atualizar também tabela `user_profiles` (se existir).
  - Faz refresh da sessão do Supabase.

#### 6.2.2. Alterar senha

- Campos:
  - Senha atual.
  - Nova senha (com medidor de força baseado em `zxcvbn`).
  - Confirmar nova senha.
- Regras:
  - Campos obrigatórios.
  - Nova senha com comprimento mínimo.
  - Nova senha diferente da atual.
  - Nova senha com força mínima (score ≥ 2).
  - Nova senha = confirmação.
- Proteção contra brute force:
  - Tentativas incorretas vão somando.
  - 3 tentativas erradas:
    - Bloqueio de 30 segundos (`bloqueadoAté`).
    - Mensagens com contagem regressiva (`tempoRestante`).
- Fluxo:
  - Verifica senha atual via `signInWithPassword`.
  - Se correto:
    - Reseta tentativas.
    - Atualiza senha com `supabase.auth.updateUser`.
    - Mostra mensagem de sucesso.
- Botão adicional:
  - “Enviar Email de Reset de Senha”:
    - Chama `supabase.auth.resetPasswordForEmail`.
    - Redireciona para `/reset-password` após clique no link de e-mail.

---

## 7. Responsividade e CSS Global Relacionado

### 7.1. Cores e temas (modo claro/escuro)

- Arquivo: `src/index.css`
- Define variáveis CSS (`--background`, `--foreground`, `--sidebar-background`, `--sidebar-foreground`, etc.).
- `body` aplica `bg-background` e `text-foreground`.
- Modo escuro altera todas as variáveis, incluindo:
  - `--sidebar-background` e `--sidebar-border`.

### 7.2. Ajustes gerais para mobile

- Breakpoints:
  - Muitas regras específicas para `max-width: 1024px`, `max-width: 768px` e `max-width: 640px`.
- Exemplos:
  - `.page-header` some em telas menores que 640px.
  - `.table-responsive` vs `.table-mobile` para tabelas adaptativas.
  - Em mobile:
    - `button`, `a`, `[role="button"]` ganham `min-height` e `min-width` de 44px para melhor usabilidade touch.
    - Scroll suave (`-webkit-overflow-scrolling: touch`).

Esses estilos não mudam diretamente a sidebar, mas ajudam em como o **conteúdo ao lado da sidebar** se comporta em telas pequenas.

---

## 8. Comportamento Específico no Mobile

Resumo do fluxo no mobile:

- `useIsMobile()` detecta largura < 768px → `isMobile = true`.
- `Layout` cria `SidebarProvider` com `defaultOpen={!isMobile}` → sidebar começa fechada.
- `Sidebar` detecta `isMobile` e:
  - Renderiza um `Sheet` lateral (`drawer`).
  - Controlado por `openMobile`/`setOpenMobile`.
- `SidebarTrigger` (ícone de menu no header):
  - Chama `toggleSidebar()`.
  - Em mobile, abre/fecha o drawer.
- `AppSidebar`:
  - Usa `useEffect` para:
    - Fechar a sidebar sempre que `location.pathname` muda (mudança de rota).
  - Em cada `NavLink`, no `onClick`:
    - Se `isMobile` → `setOpenMobile(false)` para fechar o menu após o clique.

Resultado:
- A sidebar se comporta como um **menu lateral “hambúrguer” moderno**, com:
  - Overlay escuro, animação de entrada/saída.
  - Fechamento automático após navegação.
  - Largura fixa de `18rem`, independente do tamanho da tela.

---

## 9. Pontos Bons para Futuras Funcionalidades

Com base na estrutura atual, você pode pensar em adicionar:

- **Itens exclusivos para mobile**:
  - Ex.: “Atalhos Rápidos”, “Dashboard Resumido”.
  - Condicionando o render pelo `isMobile` no `AppSidebar`.

- **Mudança da largura ou posição no mobile**:
  - Alterar `SIDEBAR_WIDTH_MOBILE` em `ui/sidebar.tsx`.
  - Ajustar `side="left"` para `right` se quiser abrir do outro lado.

- **Seções diferentes conforme o dispositivo**:
  - Mais grupos (`SidebarGroup`) no desktop.
  - Versão reduzida no mobile com menos itens (exemplo: só os mais usados).

- **Animações e feedbacks**:
  - Icone de fechar (`X`) no topo da sidebar mobile.
  - Barra de progresso, notificações específicas, etc, dentro do conteúdo do drawer.

Esse documento resume a arquitetura atual, comportamento em desktop e mobile, e os principais pontos de extensão para novas funcionalidades.


