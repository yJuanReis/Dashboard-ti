# Termos (`/termos`)

Ferramenta para preencher e gerar termos de responsabilidade (computadores/periféricos e smartphones/tablets) diretamente no navegador, com pré-visualização e download do PDF personalizado.

---

## Proteções e contexto

- **Guards**: `ProtectedRoute`, `PasswordTemporaryGuard`, `PagePermissionGuard`.
- **Permissões**: controladas via `user_profiles.page_permissions`.
- **Sidebar**: item “Termo de Responsabilidade” (`FileText`).
- **Conexões**:
  - Configurações pode marcar a rota como indisponível (manutenção).
  - Arquivos PDF base residem em `public/termos/...` e podem ser atualizados sem rebuild.
  - Logs/Auditoria (futuro) poderiam registrar geração de PDFs.

---

## Stack principal

- **React**: `useState`, `useEffect`, `useRef`, `useCallback`.
- **PDF**: `pdf-lib` (`PDFDocument`, `StandardFonts`, `rgb`) para manipular PDFs base.
- **Download/preview**: manipula `Uint8Array` e gera blob URLs para exibição.
- **UI**: Cards, Inputs, Checkbox, Tabs customizadas (“computadores”, “celulares”, “em breve”).
- **Feedback**: `toast` (`sonner`) mostra erros/sucessos.
- **Hooks auxiliares**: `useIsMobile` para adaptar layout.

---

## Fluxo geral

1. **Seleção do modelo** (Computadores/Periféricos ou Smartphones/Tablets) via tabs com glider animado.
2. **Preenchimento dos campos**:
   - Dados comuns (dia, mês, ano, equipamento, marca, etc.).
   - Campos extras para celulares (aparelho, chip, IMEI, planos).
   - Checkbox “Marcar como N/A” para preencher automaticamente valores indisponíveis.
3. **Geração do PDF**:
   - Carrega template do `public/termos/<PASTA>/<PDF>.pdf`.
   - Usa `pdf-lib` para desenhar o texto nas coordenadas adequadas, respeitando a página alvo (computadores usam página 2, celulares outros offsets).
4. **Preview**:
   - Gera `Blob` com `pdfDoc.save()` e `URL.createObjectURL` para exibir em `<iframe>` ou link de download.
   - Botão “Visualizar Termo” atualiza `previewPdfUrl`.
5. **Download**:
   - Botão “Baixar PDF” salva `pdfBytes` gerados.

---

## Carregamento sem cache

```149:226:src/pages/Termos.tsx
const loadPdf = (showToast = false, tipo = tipoModelo) => {
  if (tipo === "em_breve") return;
  if (previewPdfUrl) { URL.revokeObjectURL(previewPdfUrl); setPreviewPdfUrl(""); }
  setPdfBytes(null);

  const timestamp = Date.now();
  const random = Math.random();
  const cacheBuster = `?v=${timestamp}&t=${random}&_=${timestamp}`;

  const pdfUrl = `/termos/${config.folder}/${encodeURIComponent(config.fileName)}${cacheBuster}`;
  fetch(pdfUrl, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'If-Modified-Since': '0'
    }
  })
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => {
      const newPdfBytes = new Uint8Array(arrayBuffer);
      setPdfBytes(newPdfBytes);
      setPdfVersion(timestamp);
      if (showToast) toast.success("PDF recarregado com sucesso!");
    })
    .catch((error) => toast.error(`Erro ao carregar o template: ${error.message}`));
};
```

- Força always-fetch ao adicionar query de cache busting + headers anti-cache.
- Mantém compatibilidade com Supabase/Static hosting ao consumir PDFs via caminho relativo (`/termos/...`).
- Emite `toast` opcional quando recarrega com sucesso.

---

## Manipulação do PDF

```288:379:src/pages/Termos.tsx
const fillPdfFields = async (pdfDoc: PDFDocument, dadosParaUsar?: TermoData) => {
  const dados = dadosParaUsar || termoData;
  const pages = pdfDoc.getPages();
  const targetPage = pages[1] || pages[0];
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  if (tipoModelo === "computadores") {
    targetPage.drawText(dados.dia, { x: 160, y: height - 562, size: 10, font });
    ...
  } else if (tipoModelo === "celulares") {
    targetPage.drawText(dados.dia, { x: 388, y: height - 708, ... });
    ...
  }
  // Campos adicionais (equipamento, marca, modelo, valores, etc.)
};
```

- Calcula coordenadas específicas para cada campo e modelo.
- Usa `N/A` quando o campo estiver marcado como “não aplicável”.
- Para meses em celulares, converte números para nome por extenso (Janeiro, Fevereiro...).

### Preview e download

```504:545:src/pages/Termos.tsx
const handleGeneratePreview = async () => {
  if (!pdfBytes) { toast.error("Carregue um template primeiro."); return; }
  const pdfDoc = await PDFDocument.load(pdfBytes);
  await fillPdfFields(pdfDoc);
  const updatedPdfBytes = await pdfDoc.save();
  const blob = new Blob([updatedPdfBytes], { type: "application/pdf" });
  setPreviewPdfUrl(URL.createObjectURL(blob));
  toast.success("Pré-visualização atualizada!");
};
```

- `handleDownloadPdf` reaproveita `updatedPdfBytes` para salvar no disco.

---

## UX específica

- Tabs com glider animado (Refs e `updateGlider`): indicam claramente qual modelo está ativo.
- Campos específicos são exibidos/ocultados conforme o modelo.
- Checkbox “Marcar campos vazios como N/A” aplica `camposNA` para evitar buracos no template.
- Links rápidos para documentos no Google Drive (modelos originais/políticas).
- Layout responsivo com cards empilhados em mobile, preview em `<iframe>` fixo em desktops.
- `useIsMobile` altera layout (por exemplo, muda grid e espaçamentos).

---

## Integrações futuras sugeridas

- Gravar versões preenchidas no Supabase Storage ou base de dados (log histórico).
- Feed de auditoria (exibir na tela `Audit Logs` quem gerou termos).
- Permitir assinatura digital, QR code ou anexar arquivos extras.
- Carregar templates e coordenadas dinamicamente via Supabase (sem tocar no código).

---

## Arquivos relacionados

- `src/pages/Termos.tsx` – implementação principal.
- `public/termos/COMPUTADORES_E_PERIFERICOS/...` e `public/termos/SMARTPHONE_E_TABLET/...` – PDFs base.
- `src/hooks/use-mobile.ts` – detecta mobile para ajustes de layout.

