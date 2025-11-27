# Senhas (`/senhas`)

Painel central de credenciais corporativas. Fornece visualização em cards ou planilha, filtros avançados, exportação e edição inline, tudo sincronizado com Supabase.

---

## Visão geral e proteções

- **Guards ativos**: `ProtectedRoute` + `PasswordTemporaryGuard` + `PagePermissionGuard`.
- **Permissões**: o acesso depende de `user_profiles.page_permissions` (definidas em Configurações). Administradores podem limitar a rota a grupos específicos.
- **Navegação**: item “Senhas” na sidebar (icone `Key`) em `navigation.config.ts`.
- **Dependências globais**:
  - `AuthContext` (para sessão).
  - `NavigationHistoryContext` (tracking).
  - `ThemeProvider` (dark/light).
  - `NVRContext` não é usado aqui; o módulo é independente.

---

## Supabase e serviços relacionados

```1:63:src/pages/Senhas.tsx
import { fetchPasswords, createPassword, updatePassword, type PasswordEntry } from "@/lib/passwordsService";
...
import { supabase } from "@/lib/supabaseClient"; // usado indiretamente via services
```

- **`passwordsService`** lida com CRUD na tabela `passwords` (fetch inicial, criação, update).
- **Exportação CSV** utiliza os dados em memória após `fetchPasswords`.
- **Logs/Auditoria**: criação/edição de senhas (quando habilitado no backend) alimenta `audit_logs`, visível em `/audit-logs`.
- **Integração com Configurações**:
  - A tela de Configurações pode pôr “Senhas” em modo manutenção (via `pagesMaintenance`), bloqueando o acesso.
  - Admins podem, por lá, resetar senhas de usuários que acessam esta rota, garantindo compliance.

---

## Layouts e modos de visualização

- **Cards** (default):
  - Grelha responsiva, cada card específico ao tipo (CFTV, provedores, Google, etc.).
  - Componentes especializados (`CFTVCard`, `GoogleCard`, etc.) exibem badges, campos copiáveis, toggle de senha e modais de detalhes.
  - Destaques visuais para campos faltantes e botões de edição.
- **Tabela/Planilha**:
  - Alternância através de `viewMode` (persistido em `localStorage` + eventos customizados).
  - Tabela larga com cabeçalho fixo, colunas redimensionadas via CSS e controles para tamanho de fonte.
  - Contém filtros integrados, paginação virtual e suporte a scroll horizontal.

Comportamentos comuns:
- **`useCopyHandler`** provê feedback de “copiado” para campos sensíveis.
- **`PasswordField`** expõe/oculta senha + copia para clipboard.
- **`DetailsModal`** mostra todas as colunas da linha selecionada.

---

## Filtros, abas e orientação

### Filtros principais
- Barra de busca por texto (serviço, marina, tipo, etc.).
- Selects por marina, tipo/categoria, status (ativo, problema).
- Botões “Mostrar todas as opções” libera todos os campos para edição.
- Tabs por categoria (CFTV, Provedores, Google, etc.).

### Orientação mobile

- Usa `useSidebar()` para fechar a sidebar automaticamente quando o dispositivo está em landscape, maximizando área útil.
- Detecta `window.innerWidth/innerHeight`; se estiver em modo retrato (`isPortrait`) pode exibir overlay orientando o usuário a girar o aparelho (a critério do usuário com “Acessar mesmo assim”).

### Eventos globais

- Emite `CustomEvent("senhas:viewModeChanged")` ao trocar cards/planilha para que o header/toolbar sincronize o estado.
- Escuta `senhas:setViewMode` para atualizar `viewMode` quando a ação vem de outro componente (ex.: header mobile).

---

## Exportação e alertas

### Exportar CSV

```2200:2218:src/pages/Senhas.tsx
const csvContent = csvRows.join('\n');
const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
const url = URL.createObjectURL(blob);
link.setAttribute('download', `senhas_${new Date().toISOString().split('T')[0]}.csv`);
toast.success('CSV exportado com sucesso!');
```

- Seleciona colunas visíveis, respeita modo de visualização e filtros ativos.
- Adiciona BOM (`\ufeff`) para compatibilidade com Excel.

### Cards com problemas
- Há um detector de `passwordProblems` que identifica registros incompletos (campos obrigatórios vazios).
- Em modo cards surge um card “X cards com problemas encontrados” com lista expandível de inconsistências.
- Útil para auditar cadastros e orientar equipe a completar informações.

---

## Edição e criação

- Botões “Novo” e “Editar” usam o mesmo formulário, adaptando campos conforme tipo selecionado (`selectedType`).
- **Campos condicionais**:
  - `typeLabel` e `typePlaceholder` mudam conforme categoria (CFTV = Numeração).
  - Campos extras (Winbox, SSH, RTSP, etc.) só aparecem ao marcar “Mostrar todas as opções”.
- Ao salvar:
  1. Valida localmente.
  2. Chama `createPassword` ou `updatePassword`.
  3. Atualiza local state e apresenta `toast`.
- Integração com Supabase garante que alterações apareçam em outros módulos (ex.: logs).

---

## Integração com outros módulos

| Módulo               | Relação                                                                 |
|----------------------|--------------------------------------------------------------------------|
| Configurações        | Define quem pode acessar via permissões; pode colocar página em manutenção. |
| Audit Logs           | Operações em senhas são registradas lá (proporcionando trilha de auditoria). |
| Segurança (`SecurityTest`) | Teste “Dados Sensíveis no DOM / LocalStorage” monitora se a página expõe senhas incorretamente. |
| Layout/Header        | Recebe eventos de view mode e fornece espaço para busca global.          |

---

## UX e componentes externos

- Biblioteca `lucide-react` entrega ícones contextuais (Câmera para CFTV, Cloud, Shield…).
- `sonner` para toasts e `Dialog`, `Badge`, `Card` da UI kit padrão.
- Foco intenso em responsividade: `MobileBottomBar`, overlays e ajuste de fonte garantem legibilidade.

---

## Pontos de atenção

- **Segurança**:
  - Senhas só ficam visíveis on-demand; padrão é mascarado.
  - Ao copiar, aparece feedback rápido e o campo volta a ficar seguro.
  - A exportação CSV gera arquivo com dados em texto claro — orientações de manuseio devem constar em treinamento.
- **Performance**:
  - A tela pode carregar dezenas de registros; considere paginação server-side se o volume crescer.
  - Operações intensas (export, detect problemas) trabalham sobre arrays em memória; otimizar quando houver ~milhares de entradas.
- **Dependências Supabase**:
  - Qualquer mudança de schema (ex.: novas colunas) precisa refletir tanto no `passwordsService` quanto nos componentes de cards/planilha.

---

## Arquivos relacionados

- `src/pages/Senhas.tsx` (componente completo).
- `src/lib/passwordsService.ts` (fetch/create/update + tipagem `PasswordEntry`).
- `src/components/PasswordChangeModal.tsx` (não diretamente usado aqui, mas garante que usuários com senha temporária não cheguem ao painel de senhas).
- `src/pages/SecurityTest.tsx` e `src/lib/securityTests.ts` (testes que auditam exposição de dados).

