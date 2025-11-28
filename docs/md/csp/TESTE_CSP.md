# Guia de Teste de Content Security Policy

## Como Testar CSP em Desenvolvimento

### 1. Iniciar a Aplicação

```bash
npm run dev
```

### 2. Abrir DevTools

1. Pressione `F12` ou clique com botão direito > Inspecionar
2. Vá para a aba **Console**
3. Deixe o console aberto enquanto navega pela aplicação

### 3. Navegar pela Aplicação

Visite todas as páginas e funcionalidades:

- [ ] Página inicial (Dashboard)
- [ ] Login/Logout
- [ ] Página de Senhas
- [ ] Página de Configurações
- [ ] Todos os modais
- [ ] Todos os formulários
- [ ] Funcionalidades de upload (se houver)
- [ ] Gráficos e visualizações

### 4. Procurar Violações de CSP

No console, procure por mensagens como:

```
[Report Only] Refused to execute inline script because it violates the following Content Security Policy directive: "script-src 'self'..."
```

```
[Report Only] Refused to load the stylesheet because it violates the following Content Security Policy directive: "style-src 'self'..."
```

### 5. Documentar Violações

Para cada violação encontrada, anote:

#### Template de Relatório:
```
Data: ___/___/___
Página: _____________
Tipo: [ ] script-src [ ] style-src [ ] img-src [ ] connect-src [ ] outro
Descrição: _____________________________________________
Arquivo: _______________
Linha: ___
Urgência: [ ] Alta [ ] Média [ ] Baixa
```

### 6. Exemplos de Violações Comuns

#### Violação de script-src:
```
Refused to execute inline script because it violates CSP directive: "script-src 'self'"
Causa: <script>alert('test')</script> inline na página
Solução: Mover para arquivo .js externo
```

#### Violação de style-src:
```
Refused to apply inline style because it violates CSP directive: "style-src 'self'"
Causa: <div style="color: red">...</div>
Solução: Mover para arquivo .css ou CSS module
```

#### Violação de connect-src:
```
Refused to connect to 'https://example.com' because it violates CSP directive: "connect-src 'self'"
Causa: fetch('https://example.com/api')
Solução: Adicionar https://example.com ao connect-src
```

## Teste Automatizado de CSP

### Script de Teste no Console:

Execute no console do navegador para verificar recursos carregados:

```javascript
// Verificar todos os scripts carregados
console.log('Scripts:', Array.from(document.scripts).map(s => s.src || 'inline'));

// Verificar todos os estilos
console.log('Styles:', Array.from(document.styleSheets).map(s => s.href || 'inline'));

// Verificar todas as imagens
console.log('Images:', Array.from(document.images).map(img => img.src));

// Verificar fontes
console.log('Fonts:', Array.from(document.fonts).map(f => f.family));
```

### Verificar Event Handlers Inline:

```javascript
// Procurar elementos com event handlers inline
const elementsWithInlineHandlers = [];
const allElements = document.querySelectorAll('*');

allElements.forEach(el => {
  const attrs = el.getAttributeNames();
  const eventAttrs = attrs.filter(attr => attr.startsWith('on'));
  if (eventAttrs.length > 0) {
    elementsWithInlineHandlers.push({
      element: el.tagName,
      handlers: eventAttrs,
      location: el.outerHTML.substring(0, 100)
    });
  }
});

console.log('Elementos com handlers inline:', elementsWithInlineHandlers);
```

## Checklist de Teste Completo

### Funcionalidades Críticas:

- [ ] **Autenticação**
  - [ ] Login funciona
  - [ ] Logout funciona
  - [ ] Renovação de sessão funciona
  - [ ] Redirecionamento após login funciona

- [ ] **Formulários**
  - [ ] Todos os inputs aceitam dados
  - [ ] Validação funciona
  - [ ] Submit funciona
  - [ ] Mensagens de erro aparecem

- [ ] **Componentes Interativos**
  - [ ] Modais abrem e fecham
  - [ ] Dropdowns funcionam
  - [ ] Tooltips aparecem
  - [ ] Botões respondem a cliques

- [ ] **Carregamento de Recursos**
  - [ ] Todas as imagens carregam
  - [ ] Todas as fontes carregam
  - [ ] Ícones aparecem corretamente
  - [ ] CSS aplicado corretamente

- [ ] **Comunicação com API**
  - [ ] Requisições GET funcionam
  - [ ] Requisições POST funcionam
  - [ ] Requisições PUT/PATCH funcionam
  - [ ] Requisições DELETE funcionam
  - [ ] WebSocket funciona (se aplicável)

- [ ] **Bibliotecas de Terceiros**
  - [ ] React DevTools funciona
  - [ ] Supabase conexão funciona
  - [ ] Outras bibliotecas funcionam

### Testes por Navegador:

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (se possível)

## Análise de Resultados

### Priorização de Violações:

#### 🔴 Alta Prioridade:
- Bloqueia funcionalidades críticas
- Impede autenticação
- Quebra formulários principais

#### 🟡 Média Prioridade:
- Afeta UX mas não quebra funcionalidade
- Recursos visuais não críticos
- Componentes secundários

#### 🟢 Baixa Prioridade:
- Warnings apenas
- Recursos não utilizados
- Problemas cosméticos

## Próximos Passos

Após completar os testes:

1. **Compilar Relatório:**
   - Listar todas as violações encontradas
   - Categorizar por tipo e prioridade
   - Estimar esforço de correção

2. **Planejar Correções:**
   - Começar por violações de alta prioridade
   - Agrupar correções similares
   - Definir cronograma

3. **Implementar Correções:**
   - Seguir o [CSP_ROADMAP.md](./CSP_ROADMAP.md)
   - Testar cada correção individualmente
   - Atualizar documentação

4. **Re-testar:**
   - Executar todos os testes novamente
   - Verificar se violações foram resolvidas
   - Garantir que nenhuma funcionalidade quebrou

## Ferramentas Úteis

### CSP Evaluator:
```
https://csp-evaluator.withgoogle.com/
```
Cole sua política CSP e veja sugestões de melhoria.

### Browser Extensions:
- **CSP Validator** (Chrome/Edge)
- **Laboratory** (Firefox)

### Linha de Comando:
```bash
# Buscar scripts inline no código
grep -r "<script>" src/

# Buscar event handlers inline
grep -r "onClick" src/
grep -r "onLoad" src/

# Buscar estilos inline
grep -r 'style=' src/

# Buscar uso de eval
grep -r "eval(" src/
grep -r "new Function" src/
```

## Notas Importantes

⚠️ **Lembre-se:**
- CSP em modo Report-Only NÃO bloqueia nada
- Violações são apenas reportadas no console
- Você DEVE ver as violações para corrigi-las antes de ativar CSP
- Sem violações por 1 semana = pronto para ativar CSP

💡 **Dica:**
- Teste em horários diferentes
- Teste com diferentes dados
- Teste cenários de erro
- Teste com internet lenta

