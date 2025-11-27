# Home (`/home`)

Landing page interna exibida após login bem-sucedido. Mesmo sendo um layout placeholder, ela participa do fluxo de navegação e integra-se aos guards e contextos globais.

---

## Papel no fluxo

- **Primeiro destino**: depois de `signIn` (Login), o usuário é redirecionado para `/home`.
- **Proteções ativas**:
  - `ProtectedRoute` (exige sessão Supabase válida via AuthContext).
  - `PasswordTemporaryGuard` (se `password_temporary` estiver `true`, abre modal forçando troca).
  - `PagePermissionGuard` (só libera se a rota estiver listada em `user_profiles.page_permissions`).
- **Navegação**:
  - Presente no `NAVIGATION_ITEMS` (`src/config/navigation.config.ts`) como “Início”.
  - `NavigationHistoryContext` registra visitas para facilitar breadcrumbs/voltar na UI.

---

## Estrutura atual

```1:94:src/pages/Home.tsx
export default function Home() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="aurora-background"></div>
      <main className="max-w-10xl mx-auto ...">
        <div className="mb-4 ... flex flex-col">
          <button className="button-animated" data-text="TI BR MARINAS">
            <span className="actual-text">TI BR MARINAS</span>
            <span aria-hidden="true" className="hover-text">TI BR MARINAS</span>
          </button>
        </div>

        <div className="home-content-areas">
          <div className="home-content-top-row">
            <div className="home-section-content ...">
              <h3>Área de Conteúdo 1</h3>
              <p>EM DESENVOLVIMENTO</p>
            </div>
            ...
          </div>
          ...
        </div>

        <div className="mt-16 text-center">
          <p>Sistema desenvolvido pela equipe de TI - BR Marinas</p>
        </div>
      </main>
    </div>
  );
}
```

- Fundo animado definido em `src/index.css` (`.aurora-background`, `.button-animated`).
- Cinco áreas de conteúdo (2 + 2 + 1) organizadas por `home-content-top-row` e `home-content-bottom-row`.
- Todas as áreas exibem placeholder “EM DESENVOLVIMENTO”.
- Rodapé confirma autoria e reforça branding.

---

## Interações com outros módulos

- **Layouts compartilhados**: usa `Layout` padrão, portanto herda AppSidebar, header, MobileBottomBar, etc.
- **Themes**: responde ao `ThemeProvider` (dark/light) e aos estilos globais (Tailwind + CSS custom).
- **NavigationHistoryContext**: o header usa esse contexto para mostrar “Últimas páginas”, incluindo Home.
- **Configurações/Páginas escondidas**: admins podem ocultar `/home` via `pagesMaintenanceService`; se estiver marcada em manutenção, `PagePermissionGuard` bloqueia e mostra fallback.

---

## Pontos com Supabase

A página em si não faz chamadas diretas, mas depende indiretamente de:

- **AuthContext** para saber se o usuário está autenticado (senão, `ProtectedRoute` redireciona para `/login`).
- **user_profiles.page_permissions**: `PagePermissionGuard` consulta Supabase (via `usePagePermissions`) para decidir se a rota pode ser acessada.
- **pages_maintenance**: caso `/home` seja marcada em manutenção no Supabase, o guard também impede acesso.

---

## Possíveis evoluções

- Substituir placeholders por KPIs (Senhas críticas, HDs pendentes, alertas de Segurança, etc.).
- Incorporar cards linkando para rotas críticas (Senhas, Controle NVR, Termos).
- Integrar dados do Supabase (por exemplo, contadores via `audit_logs`, `nvrs`, `passwords`).

---

## Arquivos relacionados

- `src/pages/Home.tsx` (componente principal).
- `src/index.css` (estilos aurora/button).
- `src/config/navigation.config.ts` (config da sidebar).
- `src/contexts/NavigationHistoryContext.tsx` (tracking de histórico).

