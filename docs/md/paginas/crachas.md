# Crachás (`/crachas`)

Ferramenta interna para gerar crachás personalizados (layout padrão, JL Bracuhy e Brigadista), permitindo upload, recorte e download da arte final em PNG.

---

## Contexto e proteções

- Guardas: `ProtectedRoute`, `PasswordTemporaryGuard`, `PagePermissionGuard`.
- Permissões: admins definem quem acessa via `user_profiles.page_permissions`.
- Entrada no menu: item “Crachás” (`IdCard` na sidebar) conforme `navigation.config.ts`.
- Conexões:
  - Configurações pode pôr a rota em manutenção (Supabase `pagesMaintenance`).
  - Logs/Auditoria podem registrar uso da ferramenta caso haja instrumentação futura (atualmente não loga).

---

## Stack principal

- **React Hooks**: `useState`, `useRef`, `useEffect`.
- **Bibliotecas externas**:
  - `cropperjs` (recorte de fotos).
  - `html2canvas` (renderização do preview para PNG).
- **UI components**: Cards, Inputs, RadioGroup, Badge, Dialog, Alert (shadcn).
- **Feedback**: `toast` (`@/components/ui/use-toast`) sinaliza sucesso/erros.

---

## Fluxo do usuário

1. Escolhe o layout (Padrão, JL Bracuhy, Brigadista) via `RadioGroup`.
2. Preenche nome e matrícula (obrigatórios). Layout pode usar outros campos se adicionados no futuro.
3. Faz upload da foto:
   - Abre modal (`Dialog`) com imagem carregada.
   - `Cropper` aplica aspect ratio específico (3:4 ou 1:1 para Brigadista).
4. Ajusta/recorta:
   - Botões “Ajustar Foto” / “Trocar Foto”.
   - Zoom usando `Cropper` (icones `ZoomIn`, `ZoomOut` no modal).
5. Visualiza preview renderizado com o layout escolhido.
6. Baixa PNG via `html2canvas` (escala 3 para maior definição).

---

## Interações com Supabase

Embora a página não realize chamadas direto ao Supabase, ela depende de:
- **Autenticação** via AuthContext (para passar pelos guards).
- **Armazenamento de assets**: URLs de layouts/imagens estão hospedadas em buckets do Supabase Storage (`https://qtryp...supabase.co/...`).
- **Configurações**: determine quem acessa e se a página está ativa.

Possíveis extensões:
- Persistir o crachá em Supabase Storage.
- Registrar auditoria quando o download é feito.

---

## Estrutura do componente

```28:386:src/pages/Crachas.tsx
export default function Crachas() {
  const [layout, setLayout] = useState("padrao");
  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  ...
  useEffect(() => {
    if (!showCropDialog || !originalImage || !imageLoaded) { ... }
    const cropper = new Cropper(imageRef.current, {
      aspectRatio: layout === "brigadista" ? 1 / 1 : 3 / 4,
      dragMode: 'move',
      autoCropArea: 1,
      ...
    });
    cropperRef.current = cropper;
    return () => cropperRef.current?.destroy();
  }, [showCropDialog, originalImage, imageLoaded, layout]);
```

- Hooks de estado controlam layout, dados textuais e fotos.
- `useEffect` inicializa/destrói `Cropper` baseado no modal.
- `handleFotoChange` lê arquivo via FileReader e exibe modal.
- `handleCropConfirm` salva resultado `toDataURL` no estado `croppedImage`.

---

## Download do crachá

```177:210:src/pages/Crachas.tsx
const handleBaixar = () => {
  if (!nome.trim() || !matricula.trim() || !croppedImage) {
    toast({ title: "Campos em falta", ... });
    return;
  }
  html2canvas(crachaPreviewRef.current, { scale: 3, useCORS: true, backgroundColor: null })
    .then((canvas) => {
      const link = document.createElement("a");
      link.download = `cracha_${nome.replace(/\s+/g, "_").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: "Sucesso!", ... });
    })
    .catch(() => toast({ title: "Erro na Geração", ... }));
};
```

- Garante que os campos essenciais estejam preenchidos antes de gerar.
- `useCORS: true` permite carregar as imagens hospedadas no Supabase Storage sem violar CORS.
- `backgroundColor: null` mantém transparência (para layouts com recortes).

---

## Layouts suportados

```42:47:src/pages/Crachas.tsx
const layouts = {
  padrao: "https://.../layout_geral.png",
  jl:     "https://.../layout_jl.png",
  brigadista: "https://.../layout_brigadista.png",
};
```

- `getLayoutImage()` retorna a URL de acordo com seleção.
- Layout Brigadista muda aspect ratio e aplica recorte circular no preview (`cn(..., isBrigadista && "rounded-full")`).

---

## UX e responsividade

- Formularios e preview divididos em duas colunas em desktops (`grid lg:grid-cols-2`).
- Alertas orientam o usuário (ex.: “Campos em falta”, “Erro ao processar imagem”).
- Botões “Limpar” resetam todos os campos e estado do arquivo.
- Modal de crop possui instruções de zoom e ícones de feedback.

---

## Integrações futuras sugeridas

- **Sincronização** com banco de dados (registrar quem gerou qual crachá).
- **Templates dinâmicos** vindos de Supabase (permitindo novos layouts sem alterar o código).
- **Assinatura digital**: adicionar QR code ou campo para assinatura da TI.
- **Permissões granulares**: permitir apenas certos grupos (ex.: RH) à rota `/crachas`.

---

## Arquivos relacionados

- `src/pages/Crachas.tsx` – componente principal.
- `src/components/ui/use-toast.ts` – feedback de UI.
- `public/` – recebe o build que inclui scripts de Cropper / html2canvas.

