# Not Found (`*`)

Página 404 padrão exibida quando o usuário navega para uma rota inexistente. Simples, porém importante para UX e logging de erros de navegação.

---

## Funcionalidade

```1:24:src/pages/NotFound.tsx
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
```

- Usa `useLocation` para obter a rota inexistente e logar no console (útil em desenvolvimento e debugging).
- Layout simples: título “404”, mensagem e link para `/` (Home).
- Estilização com classes Tailwind (`bg-muted`, `text-primary`, etc.).

---

## Integração com roteamento

- Configurada como rota coringa dentro de `App.tsx`:

```55:74:src/App.tsx
<Routes>
  ...
  <Route path="/audit-logs" element={<AdminOnlyRoute><AuditLogs /></AdminOnlyRoute>} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

- Aparece apenas dentro do contexto protegido (após autenticação). Se o usuário não estiver logado, o guard padrão redireciona para `/login` antes de chegar aqui.
- Ajuda a capturar erros de digitação ou links quebrados dentro da área autenticada.

---

## Possíveis melhorias

- Exibir link/button para pagina anterior `window.history.back()`.
- Registrar o evento em `audit_logs` ou serviço de observabilidade para rastrear tentativa de acesso a rotas inválidas.
- Personalizar mensagem baseando-se na role do usuário (ex.: admins com sugestão de criar rota).
- Incluir ilustracão/brand para comunicação mais amigável.

---

## Arquivos relacionados

- `src/pages/NotFound.tsx`
- `src/App.tsx` (definição da rota `*`)

