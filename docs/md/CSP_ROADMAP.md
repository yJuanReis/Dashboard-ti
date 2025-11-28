# Roadmap de Content Security Policy (CSP)

## Status Atual

✅ **Implementado:**
- CSP em modo `Report-Only` para monitoramento
- Headers de segurança adicionais (X-Frame-Options, X-Content-Type-Options, etc.)

## Configuração Atual

O arquivo `vercel.json` está configurado com CSP em modo de relatório, permitindo monitorar violações sem bloquear funcionalidades.

### CSP Atual:
```
default-src 'self'; 
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; 
style-src 'self' 'unsafe-inline'; 
img-src 'self' data: https:; 
font-src 'self' data:; 
connect-src 'self' https://*.supabase.co https://api.ipify.org; 
frame-ancestors 'none'; 
base-uri 'self'; 
form-action 'self'
```

## Fase 1: Monitoramento (Atual)

### Objetivos:
- [x] Ativar CSP em modo Report-Only
- [ ] Monitorar violações por 1-2 semanas
- [ ] Documentar todas as violações encontradas
- [ ] Identificar scripts e estilos inline que precisam ser movidos

### Como Monitorar:

1. **No Console do Navegador:**
   - Abrir DevTools (F12)
   - Aba Console
   - Filtrar por "Content Security Policy"
   - Anotar todas as violações

2. **Violações Comuns a Procurar:**
   - Scripts inline (`<script>código</script>`)
   - Estilos inline (`style="..."`)
   - Event handlers inline (`onclick="..."`)
   - `eval()` ou `Function()` em JavaScript
   - CDNs ou recursos externos não listados

## Fase 2: Migração de Inline Scripts

### Tarefas:

- [ ] **Identificar todos os scripts inline**
  ```bash
  # Buscar scripts inline no código
  grep -r "<script>" src/
  grep -r "onClick=" src/
  grep -r "onLoad=" src/
  ```

- [ ] **Mover scripts inline para arquivos externos**
  - Criar arquivo separado para cada script
  - Importar via `<script src="...">`
  - Testar funcionalidade após migração

- [ ] **Remover event handlers inline**
  ```javascript
  // ❌ Evitar:
  <button onClick="doSomething()">Click</button>
  
  // ✅ Usar:
  <button id="myBtn">Click</button>
  <script src="handlers.js"></script>
  // Em handlers.js:
  document.getElementById('myBtn').addEventListener('click', doSomething);
  ```

- [ ] **Implementar nonces para scripts necessários**
  ```typescript
  // Gerar nonce no servidor
  const nonce = crypto.randomBytes(16).toString('base64');
  
  // Adicionar ao script
  <script nonce={nonce}>...</script>
  
  // Adicionar ao CSP
  script-src 'self' 'nonce-${nonce}'
  ```

## Fase 3: Migração de Inline Styles

### Tarefas:

- [ ] **Identificar estilos inline**
  ```bash
  grep -r "style=" src/
  ```

- [ ] **Mover para CSS modules ou styled-components**
  ```typescript
  // ❌ Evitar:
  <div style={{ color: 'red', fontSize: '14px' }}>Text</div>
  
  // ✅ Usar CSS Module:
  import styles from './Component.module.css';
  <div className={styles.redText}>Text</div>
  
  // ✅ Ou styled-components:
  const RedText = styled.div`
    color: red;
    font-size: 14px;
  `;
  ```

- [ ] **Consolidar estilos em arquivos CSS**
  - Criar arquivos CSS para estilos comuns
  - Usar classes utilitárias
  - Implementar CSS-in-JS com nonces se necessário

## Fase 4: Eliminar unsafe-eval

### Problemas Comuns:

- [ ] **Identificar uso de eval()**
  ```bash
  grep -r "eval(" src/
  grep -r "new Function" src/
  ```

- [ ] **Alternativas ao eval():**
  ```javascript
  // ❌ Evitar:
  eval('var x = 10');
  
  // ✅ Usar:
  const x = 10;
  
  // ❌ Evitar:
  new Function('return 2 + 2')();
  
  // ✅ Usar:
  const add = (a, b) => a + b;
  add(2, 2);
  ```

- [ ] **Verificar bibliotecas de terceiros**
  - Algumas bibliotecas usam eval()
  - Considerar alternativas ou versões mais recentes
  - Documentar bibliotecas que exigem unsafe-eval

## Fase 5: Refinar Diretivas

### Tarefas:

- [ ] **Restringir img-src**
  ```
  # Atual: img-src 'self' data: https:
  # Meta: img-src 'self' data: https://specific-cdn.com https://another-cdn.com
  ```

- [ ] **Restringir connect-src**
  - Listar URLs exatas em vez de wildcards
  - Exemplo: `https://projeto.supabase.co` em vez de `https://*.supabase.co`

- [ ] **Adicionar object-src e media-src**
  ```
  object-src 'none';
  media-src 'self';
  ```

## Fase 6: Ativar CSP em Produção

### Pré-requisitos:
- [ ] Monitoramento completo sem violações por 1 semana
- [ ] Todos os inline scripts removidos ou com nonces
- [ ] Todos os inline styles removidos ou com nonces
- [ ] unsafe-eval removido ou documentado como necessário

### Ativação:

1. **Alterar em vercel.json:**
   ```json
   {
     "key": "Content-Security-Policy",
     "value": "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self'; img-src 'self' data: https://specific-cdn.com; font-src 'self' data:; connect-src 'self' https://projeto.supabase.co https://api.ipify.org; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'"
   }
   ```

2. **Manter Report-Only em paralelo** (opcional):
   - Manter ambos os headers para continuar monitorando

3. **Testar em staging primeiro**
   - Deploy em ambiente de teste
   - Testar todas as funcionalidades
   - Verificar console por erros

4. **Deploy em produção**
   - Monitorar logs e métricas
   - Estar pronto para rollback se necessário

## Endpoint de Monitoramento CSP (Opcional)

### Criar endpoint para receber reports:

```typescript
// src/api/csp-report.ts (se usando API routes)
export async function POST(request: Request) {
  try {
    const report = await request.json();
    
    // Log da violação
    console.error('CSP Violation:', {
      timestamp: new Date().toISOString(),
      ...report
    });
    
    // Opcional: Salvar no banco de dados
    // await saveCSPReport(report);
    
    return new Response('Report received', { status: 204 });
  } catch (error) {
    console.error('Error processing CSP report:', error);
    return new Response('Error', { status: 500 });
  }
}
```

### Atualizar CSP com report-uri:
```
Content-Security-Policy-Report-Only: ...; report-uri /api/csp-report
```

## Checklist de Verificação Final

Antes de ativar CSP em produção:

- [ ] Todas as páginas testadas manualmente
- [ ] Formulários funcionando
- [ ] Autenticação funcionando
- [ ] Upload de arquivos funcionando
- [ ] Modais e componentes dinâmicos funcionando
- [ ] Gráficos e visualizações funcionando
- [ ] Sem violações no console por 1 semana
- [ ] Performance não impactada negativamente
- [ ] Documentação atualizada

## Recursos Úteis

- [CSP Evaluator](https://csp-evaluator.withgoogle.com/) - Valida sua política CSP
- [MDN CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)

## Notas Importantes

⚠️ **Atenção:**
- Sempre teste em desenvolvimento e staging antes de produção
- Mantenha backups das configurações anteriores
- Documente todas as exceções necessárias
- Considere impacto em bibliotecas de terceiros
- Monitore métricas de erro após ativação

💡 **Dica:**
- Use o modo Report-Only por tempo suficiente
- Implemente mudanças gradualmente
- Priorize segurança, mas não quebre funcionalidades
- Considere criar diferentes políticas para diferentes partes da aplicação

