# Security Test (`/security-test`)

Painel para rodar a suíte de testes de segurança (pentest automatizado) implementada em `src/lib/securityTests.ts`. Accesso restrito e controlado para evitar uso indevido fora do fluxo de Configurações.

---

## Proteções e acesso

- **Guards**:
  - `ProtectedRoute` (sessão Supabase).
  - `PasswordTemporaryGuard`.
  - `PagePermissionGuard`.
- **Gate adicional**:
  - Ao abrir `/configuracoes`, o botão “Executar Testes” seta `sessionStorage.securityTestFromConfig = "true"` e redireciona.
  - Se o usuário tenta entrar diretamente sem esse flag, a página redireciona de volta para `/configuracoes`.

```15:25:src/pages/SecurityTest.tsx
useEffect(() => {
  const fromConfig = sessionStorage.getItem('securityTestFromConfig');
  if (!fromConfig) {
    navigate('/configuracoes', { replace: true });
  } else {
    sessionStorage.removeItem('securityTestFromConfig');
  }
}, [navigate]);
```

- Garante que somente admins vindos da tela de Configurações executem os testes, evitando acesso acidental em produção.

---

## Execução dos testes

```27:39:src/pages/SecurityTest.tsx
const handleRunTests = async () => {
  setIsRunning(true);
  setHasRun(false);
  try {
    const testResults = await runSecurityTests();
    setResults(testResults);
    setHasRun(true);
  } catch (error) {
    console.error("Erro ao executar testes:", error);
  } finally {
    setIsRunning(false);
  }
};
```

- `runSecurityTests()` (em `src/lib/securityTests.ts`) executa cada verificação (auth, headers, rate limit, etc.).
- Resultados são arrays de `SecurityTestResult` com `name`, `status`, `severity`, `message`, `recommendations`.
- Ao finalizar, `hasRun` ativa a renderização dos cards de métricas e categorias.
- `downloadSecurityReport(results)` gera arquivo `.txt` com o consolidado (opcional).

---

## Layout e métricas

- Header com botão voltar para Configurações e título “Testes de Segurança (Pentest)”.
- Botões:
  - “Executar Testes” (principal).
  - “Baixar Relatório TXT” (aparece após execução).
- KPIs:
  - Quantidade de testes que passaram, avisos, falhas e críticos.
  - Score percentual (passados / total).
- Resultados por categoria:
  - Map `categoryMap` agrupa testes (auth, data, injection, network, access, code, env).
  - Cada card exibe contagem de passes/avisos/falhas e lista os resultados detalhados (com recomendações).
- Se o usuário ainda não rodou os testes, a página mostra uma lista dos testes disponíveis (preview).

---

## Integrações com Supabase e demais módulos

- `runSecurityTests()` valida:
  - Exposição de secrets em `supabase` config.
  - Proteção de rotas (`ProtectedRoute`, `PagePermissionGuard`).
  - Headers de segurança (via fetch).
  - Rate limiting do Supabase.
  - Persistência/localStorage (verifica se dados sensíveis estão guardados).
- Ao falhar, sinaliza quais páginas/serviços precisam de ajustes (ex.: Configurações, Senhas, Termos).
- Fica acessível apenas para admins (relevante para auditorias internas).
- `SecurityTest.tsx` não grava logs por si só, mas recomendamos documentar resultados em `audit_logs` ou documentações internas.

---

## Possíveis evoluções

1. Persistir histórico de execuções (data, quem rodou, resultados) em Supabase.
2. Permitir envio automático do relatório por e-mail ou anexo em issue tracker.
3. Adicionar testes customizados para módulos novos (Termos, Controle NVR, etc.).
4. Expor toggles para rodar apenas subset de testes (ex.: apenas network).

---

## Arquivos relacionados

- `src/pages/SecurityTest.tsx` – UI e controle de fluxo.
- `src/lib/securityTests.ts` – conjunto de testes automatizados.
- `src/lib/securityUtils.ts`, `SECURITY_GUIDE.md`, `PENTEST_MANUAL.md`, `PENTEST_SUMMARY.md` – documentação complementar.

