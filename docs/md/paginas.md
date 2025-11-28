# Documentação das Páginas

Cada página mora em `src/pages` e é carregada dentro do `Layout` protegido por:

- `ProtectedRoute`: exige sessão Supabase válida.
- `PasswordTemporaryGuard`: obriga troca de senha se `password_temporary` estiver `true`.
- `PagePermissionGuard`: valida se a rota está listada em `user_profiles.page_permissions`.
- `AdminOnlyRoute`: camada extra usada em telas administrativas.

### Visão rápida

| Página                | Rota               | Guarda principal           | Status atual            |
|-----------------------|--------------------|----------------------------|-------------------------|
| Login                 | `/login`           | Público                    | Em uso                  |
| Reset Password        | `/reset-password`  | Público                    | Em uso                  |
| Home                  | `/home`            | PagePermissionGuard        | Placeholder visual      |
| Senhas                | `/senhas`          | PagePermissionGuard        | Em produção             |
| Crachás               | `/crachas`         | PagePermissionGuard        | Em produção             |
| Assinaturas           | `/assinaturas`     | PagePermissionGuard        | Em produção             |
| Termos                | `/termos`          | PagePermissionGuard        | Em produção             |
| Controle NVR          | `/controle-nvr`    | PagePermissionGuard        | Em produção             |
| Controle de HDs       | `/controle-hds`    | PagePermissionGuard        | Em produção             |
| Servidores            | `/servidores`      | PagePermissionGuard        | Em desenvolvimento      |
| Gestão de Rede        | `/gestaorede`      | PagePermissionGuard        | Em desenvolvimento      |
| Chamados              | `/chamados`        | PagePermissionGuard        | Em desenvolvimento      |
| Impressoras           | `/impressoras`     | PagePermissionGuard        | Em produção             |
| Ramais                | `/ramais`          | PagePermissionGuard        | Em produção             |
| Configurações         | `/configuracoes`   | AdminOnlyRoute             | Em produção             |
| Audit Logs            | `/audit-logs`      | AdminOnlyRoute             | Em produção             |
| Security Test         | `/security-test`   | PagePermissionGuard (+flag)| Em produção             |
| Not Found             | `*`                | Público                    | Em uso                  |
| Index (fallback)      | _não roteado_      | —                          | Placeholder             |

---

## Login (`/login`)
- **Arquivo**: `src/pages/Login.tsx`
- **Objetivo**: autenticar usuários via Supabase Auth e iniciar a sessão no contexto.
- **Principais pontos**:
  - Verifica conectividade com Supabase (`supabase.auth.getSession`) e exibe alerta se indisponível.
  - Formulário com validações básicas, feedback visual (`toast`, loader) e botão para modal de recuperação.
  - Modal "Recuperar Senha" usa `supabase.auth.resetPasswordForEmail` e redireciona para `/reset-password`.
- **Dependências**: `useAuth().signIn`, `supabase`, `sonner`, `react-router-dom`.

## Reset Password (`/reset-password`)
- **Arquivo**: `src/pages/ResetPassword.tsx`
- **Objetivo**: fluxo guiado para redefinir senha após link de recuperação.
- **Destaques**:
  - Detecta tokens `access_token` no hash e força login caso o link não seja válido.
  - Integra com `useAuth` para saber se a senha atual é temporária e exibe `PasswordChangeModal`.
  - Valida nome informado, força mínima de senha e sincroniza `user_profiles.password_temporary`.
  - Usa `supabase.auth.updateUser` + `supabase.from("user_profiles")` para persistir mudanças.

## Home (`/home`)
- **Arquivo**: `src/pages/Home.tsx`
- **Status**: layout placeholder com fundo animado e cinco áreas de conteúdo marcadas como "EM DESENVOLVIMENTO".
- **Quando atualizar**: substituir placeholders por KPIs ou atalhos reais. Fundo animado mora em `index.css` (`aurora-background`).

## Senhas (`/senhas`)
- **Arquivo**: `src/pages/Senhas.tsx`
- **Responsabilidade**: painel completo de cofres (cards ou planilha) alimentado pela tabela `passwords`.
- **Principais recursos**:
  - Consumo de `fetchPasswords`, `createPassword`, `updatePassword` (`src/lib/passwordsService`).
  - Dois modos de visualização (`cards` e `table`) sincronizados via `localStorage` e eventos customizados.
  - Filtros por marina, tipo, status, busca textual, além de tabs por categoria.
  - Cards ricos com ações de copiar, ocultar/mostrar senha, modal de detalhes e alerta de campos faltantes.
  - Editor dinâmico: campos exibidos mudam conforme `selectedType` ou "Mostrar todas as opções".
  - Orientação forçada para horizontal em mobile (overlay com `LockKeyhole`).
  - Exportação CSV (`exportarCSV`) e botão dedicado a problemas de preenchimento.
  - Integrações com `useSidebar` (fecha sidebar no landscape), `toast`, `Dialog`, `Table`.

## Crachás (`/crachas`)
- **Arquivo**: `src/pages/Crachas.tsx`
- **Uso**: gerar crachás personalizados (layout Padrão, JL Bracuhy e Brigadista).
- **Stack**:
  - Upload + recorte via `cropperjs` (aspect ratio diferente para Brigadista).
  - Preview em tempo real e geração de PNG com `html2canvas`.
  - Formulário simples (nome, matrícula) e reset completo (`handleLimpar`).
  - Toasts (`use-toast`) informam erros de carga, sucesso em recortes ou downloads.

## Assinaturas (`/assinaturas`)
- **Arquivo**: `src/pages/Assinaturas.tsx`
- **Função**: criador de assinaturas de e-mail BR Marinas.
- **Recursos**:
  - Seleção entre layouts (BR Marinas vs BR Marinas JL) com radios.
  - Preview construído com tabelas inline, alimentado por inputs de contato.
  - Botão "Baixar PNG" dispara `html2canvas` para gerar assinatura em alta resolução.
  - Botão "Limpar Campos" reseta o formulário; `toast` valida campos obrigatórios.

## Termos (`/termos`)
- **Arquivo**: `src/pages/Termos.tsx`
- **Proposta**: preencher termos de responsabilidade (computadores ou celulares) e gerar PDF personalizado.
- **Diferenciais**:
  - Tabs com glider responsivo alternam entre modelos "Computadores", "Celulares" e "Em breve".
  - Carrega templates de PDF de `/public/termos/...` com cache busting forçado.
  - Usa `pdf-lib` (`PDFDocument`, `StandardFonts`) para escrever dados no template e gerar preview/download.
  - Campos extras para celulares (chip, IMEI, plano) e lógica "Marcar como N/A".
  - Links rápidos para políticas e pastas no Google Drive.

## Controle NVR (`/controle-nvr`)
- **Arquivo**: `src/pages/ControleNVR.tsx`
- **Objetivo**: inventário completo de NVRs e slots.
- **Principais blocos**:
  - Consome `NVRContext` (lista, adicionar, editar, excluir, atualizar slots).
  - Filtros por marina, proprietário, modelo, busca textual e ordenação clicável.
  - Modal de criação/edição com validações (não permite mesma marina+numeração).
  - Editor visual de slots: long press abre `SlotMenu` com tamanhos e estados (vazio, ativo, inativo).
  - Alert dialogs para exclusão, updates em massa e orientação (fecha sidebar em landscape mobile).

## Controle de HDs (`/controle-hds`)
- **Arquivo**: `src/pages/ControleHD.tsx` (componente `EvolucaoHDs`)
- **Meta**: acompanhar slots de NVRs que precisam de discos >12 TB e planejar compras.
- **Features**:
  - Reaproveita `NVRContext` para filtrar somente slots vazios ou com HD insuficiente.
  - KPIs (slots em ação, custo estimado, progresso), filtros (marina, owner, modelo) e ordenação.
  - Ajuste do preço de HD persistido no Supabase (`fetchHDPrice` / `saveHDPrice`) com debounce.
  - Botão para exportar relatório XLSX (`window.XLSX`), além de toggles para marcar `purchased`.
  - Mesma lógica de orientação/integração com header via eventos customizados.

## Servidores (`/servidores`)
- **Arquivo**: `src/pages/Servidores.tsx`
- **Status**: dashboard demonstrativo com dados mockados (`mockServidores`).
- **Componentes**:
  - Cards escuros com totais (online, atenção, uptime).
  - Lista mostrando cada servidor com CPU/Memória/Disco (barra de progresso) e botão “Ver Métricas”.
  - Ideal para evoluir para integrações reais de telemetria.

## Gestão de Rede (`/gestaorede`)
- **Arquivo**: `src/pages/GestaoRede.tsx`
- **Status**: placeholder que exibe cards simples (status, dispositivos ativos, alertas) e um card “Em desenvolvimento”.
- **Próximos passos**: substituir cards por métricas reais (topologia, VLANs, banda).

## Chamados (`/chamados`)
- **Arquivo**: `src/pages/Chamados.tsx`
- **Status**: protótipo com `mockChamados`.
- **Funcionalidades prontas**:
  - Headline "Site em desenvolvimento" com badge.
  - Cards de estatísticas e filtro por status (Todos/Abertos/Em andamento/Resolvidos).
  - Lista detalha cada chamado com prioridade, solicitante e botão "Ver Detalhes".

## Impressoras (`/impressoras`)
- **Arquivo**: `src/pages/Impressoras.tsx`
- **Responsabilidade**: gerenciamento completo de impressoras (inventário, modelo, série, IP, marina, local).
- **Principais recursos**:
  - Consumo de `fetchImpressoras`, `createImpressora`, `updateImpressora`, `deleteImpressora` (`src/lib/impressorasService`).
  - Busca textual e filtro por marina (dropdown com opções pré-definidas).
  - Ordenação clicável em todas as colunas (marina, local, modelo, número de série, IP).
  - Badges coloridos por modelo de impressora (ECOSYS, EPSON, SHARP, etc.).
  - Tabela responsiva com informações completas (marina, local, modelo, série, IP, observação).
  - CRUD completo via dialogs modais com validações.
  - Todas as operações registradas em `audit_logs`.
- **Documentação detalhada**: ver [`docs/md/paginas/impressoras.md`](./paginas/impressoras.md).

## Ramais (`/ramais`)
- **Arquivo**: `src/pages/Ramais.tsx`
- **Responsabilidade**: gerenciamento de ramais telefônicos (nome/local e números de ramais).
- **Principais recursos**:
  - Consumo de `fetchRamais`, `createRamal`, `updateRamal`, `deleteRamal` (`src/lib/ramaisService`).
  - Busca textual por nome/local ou números de ramais.
  - Ordenação clicável por nome/local ou ramais.
  - Suporte a múltiplos ramais por registro (ex: "200/225/227", "246 / 244").
  - Tabela simplificada com duas colunas principais (Nome/Local e Ramais).
  - CRUD completo via dialogs modais.
  - Todas as operações registradas em `audit_logs`.
- **⚠️ Nota importante**: A estrutura da tabela `ramais` será modificada futuramente. Ver documentação detalhada para mais informações.
- **Documentação detalhada**: ver [`docs/md/paginas/ramais.md`](./paginas/ramais.md).

## Configurações (`/configuracoes`)
- **Arquivo**: `src/pages/Configuracoes.tsx`
- **Acesso**: somente admins (rota protegida e menu exclusivo).
- **Principais módulos**:
  1. **Perfil do usuário**: alterar nome exibido, ver role real (busca em `user_profiles`), loader otimista.
  2. **Troca de senha**: validação com `zxcvbn`, bloqueio temporário após tentativas erradas, registro em `user_security_logs` e `toast`.
  3. **E-mail de redefinição**: modal que exige confirmar nome+senha antes de disparar `resetPasswordForEmail`.
  4. **Gestão de usuários**: lista de `user_profiles`, permite criar, editar (nome/email/role), resetar senha de terceiros (`updateUserPasswordByAdmin`), excluir (`deleteUserByAdmin`) e definir permissões de páginas (`page_permissions`).
  5. **Páginas em manutenção**: leitura/escrita via `pagesMaintenanceService`, cards expansíveis com toggles e comentários.
  6. **Ferramentas de segurança**: link para Security Test (seta `sessionStorage.securityTestFromConfig`) e atalho para Audit Logs.
  7. **Informações de versão**: usa `getVersionString`/`getVersionInfo` para mostrar commit/build.
- **Outros detalhes**:
  - Integração intensa com Supabase (`user_profiles`, `auth`, `user_security_logs`).
  - Usa `logger` para depuração, `toast` para feedback e múltiplos dialogs (`Dialog`, `AlertDialog`).

## Audit Logs (`/audit-logs`)
- **Arquivo**: `src/pages/AuditLogs.tsx`
- **Uso**: monitorar alterações registradas por `audit_logs` no Supabase.
- **Funcionalidades**:
  - Busca remota (`fetchAuditLogs`) com filtros por ação, tabela e texto; paginação local (50 itens/página).
  - Tabela com badges de ação (CREATE/UPDATE/DELETE), identificação de usuário, IP e descrição.
  - Modal de detalhes mostrando `old_data`, `new_data`, campos alterados e metadata.
  - Botão para copiar payload JSON e indicadores de quantidade total.

## Security Test (`/security-test`)
- **Arquivo**: `src/pages/SecurityTest.tsx`
- **Fluxo**:
  - Só prossegue se `sessionStorage.securityTestFromConfig` estiver definido (setado ao clicar em “Executar testes” na Configuração); caso contrário, redireciona de volta.
  - Executa `runSecurityTests()` (biblioteca em `src/lib/securityTests.ts`) e exibe resultados agregados por categoria (auth, data, injection, etc.).
  - Mostra KPIs (passou/falhou/avisos/críticos), score percentual e cards detalhando recomendações.
  - Permite baixar relatório `.txt` (`downloadSecurityReport`).

## Servidor de Arquivos / Termos Públicos
- **Arquivos estáticos**: PDFs usados em Termos ficam em `public/termos/...` e podem ser atualizados sem rebuild.
- **Robots**: `public/robots.txt` está configurado como `Disallow: /` para evitar indexação do dashboard.

## Not Found (`*`)
- **Arquivo**: `src/pages/NotFound.tsx`
- **Descrição**: página 404 simples, loga erro no console com a rota acessada e oferece link para `/`.

## Index (fallback não roteado)
- **Arquivo**: `src/pages/Index.tsx`
- **Observação**: componente gerado pelo template Vite ("Welcome to Your Blank App"). Não é usado nas rotas atuais; pode ser removido ou reutilizado no futuro.

---

### Complementos úteis
- **Guia de navegação**: `src/config/navigation.config.ts` descreve títulos/ícones usados na sidebar.
- **Guarda de permissões**: `PagePermissionGuard` verifica `user_profiles.page_permissions`; mantenha o array sincronizado ao criar novas rotas.
- **Contextos globais**:
  - `AuthContext` fornece `user`, `signIn`, `passwordTemporary`.
  - `NVRContext` abastece Controle NVR/HD.
  - `NavigationHistoryContext` registra últimos acessos (usado no layout).

Use este documento como ponto de partida ao evoluir páginas ou ao orientar novos contribuidores sobre onde cada funcionalidade vive e quais serviços ela consome.

