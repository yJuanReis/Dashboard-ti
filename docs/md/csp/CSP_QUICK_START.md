# 🚀 CSP - Guia de Início Rápido

## ✅ Status: CSP Implementado em Modo Monitoramento

---

## 📋 O Que Fazer AGORA

### 1️⃣ Testar Imediatamente (5 minutos)

```bash
# Iniciar aplicação
npm run dev
```

1. Abrir navegador em `http://localhost:5173`
2. Pressionar `F12` (abrir DevTools)
3. Ir para aba **Console**
4. Navegar pela aplicação normalmente
5. Procurar mensagens com `[Report Only]`

### 2️⃣ Se Aparecer Violações

**Exemplo de violação:**
```
[Report Only] Refused to execute inline script because it violates the following Content Security Policy directive: "script-src 'self'"
```

**O que fazer:**
1. ✍️ Anotar a mensagem completa
2. ✍️ Anotar qual página você estava
3. ✍️ Anotar o que estava fazendo
4. 📖 Consultar `docs/md/TESTE_CSP.md` para mais detalhes

### 3️⃣ Se NÃO Aparecer Violações

🎉 **Ótimo!** Continue usando normalmente e verificando periodicamente.

---

## 📅 Cronograma Sugerido

| Período | O Que Fazer | Tempo |
|---------|-------------|-------|
| **Dia 1** | Teste inicial completo | 30min |
| **Semana 1** | Usar normalmente, verificar console diariamente | 5min/dia |
| **Semana 2** | Usar normalmente, verificar console diariamente | 5min/dia |
| **Fim Semana 2** | Análise completa das violações encontradas | 1h |
| **Após Análise** | Seguir para correções (se necessário) | Varia |

---

## 🎯 Páginas Importantes para Testar

### Checklist de Teste Inicial:

- [ ] **Página Inicial/Dashboard**
  - Abrir
  - Verificar console
  - Interagir com componentes

- [ ] **Login/Logout**
  - Fazer login
  - Verificar console
  - Fazer logout
  - Verificar console

- [ ] **Página de Senhas**
  - Abrir página
  - Verificar console
  - Criar/editar/deletar senha
  - Verificar console após cada ação

- [ ] **Página de Configurações**
  - Abrir página
  - Verificar console
  - Alterar configurações
  - Verificar console

- [ ] **Modais e Popups**
  - Abrir cada modal
  - Verificar console
  - Interagir com formulários
  - Verificar console

---

## 🔍 Como Identificar Violações

### No Console, procure por:

```
[Report Only] Refused to...
```

### Tipos Comuns:

1. **Script Inline:**
   ```
   Refused to execute inline script
   ```

2. **Style Inline:**
   ```
   Refused to apply inline style
   ```

3. **Conexão Bloqueada:**
   ```
   Refused to connect to 'https://...'
   ```

4. **Imagem Bloqueada:**
   ```
   Refused to load the image
   ```

---

## 📊 Script de Teste Automático

Cole no console do navegador:

```javascript
// Script de verificação rápida
console.log('=== CSP QUICK CHECK ===');

// 1. Scripts
const scripts = Array.from(document.scripts);
const inlineScripts = scripts.filter(s => !s.src);
console.log(`📜 Scripts: ${scripts.length} total, ${inlineScripts.length} inline`);

// 2. Estilos
const styles = Array.from(document.styleSheets);
const inlineStyles = styles.filter(s => !s.href);
console.log(`🎨 Styles: ${styles.length} total, ${inlineStyles.length} inline`);

// 3. Event Handlers
let handlersCount = 0;
document.querySelectorAll('*').forEach(el => {
  const handlers = el.getAttributeNames().filter(a => a.startsWith('on'));
  handlersCount += handlers.length;
});
console.log(`⚡ Event Handlers Inline: ${handlersCount}`);

// 4. Estilos inline nos elementos
const elementsWithStyle = document.querySelectorAll('[style]');
console.log(`💅 Elementos com style="": ${elementsWithStyle.length}`);

console.log('=== FIM DO CHECK ===');
console.log('⚠️ Números altos podem indicar trabalho necessário nas próximas fases');
```

---

## 📚 Documentação Completa

Se precisar de mais detalhes:

| Documento | Para Que Serve |
|-----------|----------------|
| `CSP_IMPLEMENTADO.md` | Resumo do que foi feito |
| `CSP_ROADMAP.md` | Plano completo de 6 fases |
| `TESTE_CSP.md` | Guia detalhado de testes |
| `CSP_QUICK_START.md` | Este arquivo (início rápido) |

---

## ⚡ Ações Rápidas

### Se Tudo Funciona Bem (sem violações):

```bash
# Após 1-2 semanas, ativar CSP
# 1. Editar vercel.json
# 2. Trocar "Content-Security-Policy-Report-Only" por "Content-Security-Policy"
# 3. Fazer deploy
```

### Se Encontrar Violações:

```bash
# 1. Documentar todas as violações
# 2. Consultar docs/md/CSP_ROADMAP.md
# 3. Seguir fases 2-5 conforme necessário
# 4. Re-testar
# 5. Quando sem violações, ativar CSP
```

---

## 🆘 Troubleshooting Rápido

### "Não vejo nenhuma mensagem de violação"

✅ **Isso é BOM!** Significa:
- Aplicação já está compatível com CSP
- Pode ativar CSP após 1-2 semanas de monitoramento

### "Vejo muitas violações"

⚠️ **Normal na primeira vez!** Significa:
- Precisa fazer ajustes antes de ativar CSP
- Seguir roadmap fase por fase
- Não se preocupe, é gradual

### "Aplicação parou de funcionar"

🤔 **Isso NÃO deveria acontecer** porque CSP está em Report-Only
- Verificar se não tem outro erro não relacionado a CSP
- Verificar console por outros erros
- CSP em Report-Only NÃO bloqueia nada

### "Quero ativar CSP agora"

⚠️ **NÃO RECOMENDADO** sem monitoramento, mas se quiser:
```json
// Em vercel.json, trocar:
"Content-Security-Policy-Report-Only" → "Content-Security-Policy"
```

**Risco:** Pode quebrar funcionalidades se houver violações não detectadas

---

## ✅ Checklist Minimalista

Versão super resumida:

- [ ] Executar aplicação em dev
- [ ] Abrir DevTools (F12) → Console
- [ ] Usar aplicação normalmente por 1-2 semanas
- [ ] Verificar console diariamente (5min)
- [ ] Anotar qualquer mensagem `[Report Only]`
- [ ] Se sem violações por 2 semanas → Ativar CSP
- [ ] Se com violações → Seguir CSP_ROADMAP.md

---

## 📞 Próximos Passos

1. **AGORA:** Fazer teste inicial (30min)
2. **Esta Semana:** Monitorar diariamente (5min/dia)
3. **Próxima Semana:** Continuar monitorando
4. **Daqui 2 Semanas:** Decidir próxima fase

---

**🎯 Objetivo Principal:** Encontrar problemas ANTES de ativar CSP

**⏱️ Tempo Estimado:** 5 minutos por dia + 30min inicial

**💡 Dica:** Quanto mais você usar a aplicação neste período, melhor!

---

**Boa sorte! 🚀**

