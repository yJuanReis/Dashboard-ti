# Documentação da Estilização da Barra Lateral

Esta pasta contém toda a documentação sobre a estilização e composição da barra lateral (sidebar) do projeto.

## Estrutura dos Arquivos

### 01-variaveis-css-sidebar.md
Contém todas as variáveis CSS relacionadas à sidebar, tanto para modo claro quanto escuro, e como são utilizadas no Tailwind.

### 02-componentes-sidebar.md
Documentação completa de todos os componentes que compõem a sidebar, suas funções, propriedades e classes padrão.

### 03-estilos-appsidebar.md
Estilos específicos do componente `AppSidebar`, incluindo header, navegação, footer e modais.

### 04-classes-tailwind-utilizadas.md
Lista completa de todas as classes Tailwind utilizadas na sidebar, organizadas por categoria.

### 05-estrutura-completa.md
Estrutura hierárquica completa da sidebar, estados (expandida/colapsada), modais e responsividade.

### 06-gradientes-e-cores.md
Documentação detalhada de todos os gradientes, cores específicas, opacidades e estados visuais.

## Componentes Principais

### AppSidebar
- **Localização**: `src/components/AppSidebar.tsx`
- **Função**: Componente principal da barra lateral com navegação, perfil do usuário e configurações

### Sidebar (shadcn/ui)
- **Localização**: `src/components/ui/sidebar.tsx`
- **Função**: Componente base da sidebar do shadcn/ui com toda a lógica de colapso e responsividade

## Características Principais

### Dimensões
- **Expandida**: 240px (w-60)
- **Colapsada**: 56px (w-14)
- **Mobile**: 288px (18rem)

### Cores Principais
- **Background**: Branco (claro) / Quase preto azulado (escuro)
- **Primária**: Azul vibrante (`217 91% 60%` claro / `217 91% 65%` escuro)
- **Accent**: Cinza azulado claro para hover/ativo

### Funcionalidades
- Navegação com 11 itens principais
- Sistema de permissões para filtrar itens
- Badges de manutenção dinâmicos
- Perfil do usuário com avatar e informações
- Modais de notificações e configurações
- Toggle de tema
- Responsivo (mobile/desktop)
- Colapsável com animações suaves

## Uso das Variáveis CSS

Todas as cores da sidebar são definidas através de variáveis CSS no arquivo `src/index.css`:

```css
--sidebar-background
--sidebar-foreground
--sidebar-primary
--sidebar-primary-foreground
--sidebar-accent
--sidebar-accent-foreground
--sidebar-border
--sidebar-ring
```

Essas variáveis são utilizadas através das classes Tailwind:
- `bg-sidebar`
- `text-sidebar-foreground`
- `bg-sidebar-accent`
- `border-sidebar-border`
- etc.

## Estados da Sidebar

1. **Expandida**: Mostra todos os textos, labels e informações completas
2. **Colapsada**: Mostra apenas ícones, com tooltips no hover
3. **Mobile**: Converte em drawer (Sheet) que abre/fecha lateralmente

## Navegação

A sidebar contém os seguintes itens de navegação:
1. Início
2. Senhas
3. Crachás
4. Assinaturas
5. Controle NVR
6. Controle de HDs
7. Termo de Responsabilidade
8. Gestão de Rede
9. Servidores
10. Chamados
11. Configurações (apenas admin)

## Modais Integrados

### Modal de Notificações
- Toggle de notificações por email
- Toggle de alertas do sistema
- Botão para limpar cache

### Modal de Configurações
- Edição de nome de exibição
- Alteração de senha (com validação de força)
- Envio de email de reset de senha

## Responsividade

- **Desktop**: Sidebar fixa na lateral, colapsável
- **Mobile**: Sidebar convertida em drawer com overlay
- **Transições**: Animações suaves de 200ms entre estados

## Acessibilidade

- Atalho de teclado: `Ctrl/Cmd + B` para toggle
- Suporte a screen readers
- Anéis de foco visíveis
- Estados de hover e ativo bem definidos



