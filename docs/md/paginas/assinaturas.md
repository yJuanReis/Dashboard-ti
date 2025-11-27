# Assinaturas (`/assinaturas`)

Gerador de assinaturas de e-mail BR Marinas. Permite ao usuário preencher dados de contato, escolher layout e exportar a assinatura como PNG com alta resolução.

---

## Proteções e contexto

- **Guards**: `ProtectedRoute`, `PasswordTemporaryGuard`, `PagePermissionGuard`.
- **Permissões**: configuradas em `user_profiles.page_permissions`.
- **Sidebar**: item “Assinaturas” (ícone `Mail`), definido em `navigation.config.ts`.
- **Links com outras telas**:
  - Configurações decide quem acessa e se a rota está em manutenção.
  - Logs/Auditoria ainda não registram uso da tela (pode ser agregado futuramente).

---

## Stack principal

- **React**: `useState`, `useRef`.
- **Renderização de imagem**: `html2canvas`.
- **UI kit**: Cards, Inputs, Labels, RadioGroup, Badge (shadcn).
- **Feedback**: `toast` (`sonner`) para validar campos e informar status de download.
- **Helpers**: `createPageUrl` para link “Voltar para Home”.

---

## Fluxo do usuário

1. **Seleciona layout**: radio `BR Marinas` (default) ou `BR Marinas JL`.
2. **Preenche campos**: nome, setor/cargo, local, telefone, celular, e-mail.
3. **Visualiza preview**:
   - `AssinaturaPreview` encapsula o HTML (tabelas inline) dos layouts.
   - Logos e ícones são carregados de URLs fixas (Supabase Storage).
4. **Baixa PNG**:
   - Botão “Baixar PNG” habilita quando `nome` e `email` estão preenchidos.
   - Usa `html2canvas` com `scale: 3` e `backgroundColor: '#FFFFFF'` para excelente definição.
5. **Limpa campos** (opcional) com botão “Limpar Campos”.

---

## Interação com Supabase

A página não consulta Supabase diretamente, mas depende de:
- **Autenticação** (guards).
- **Storage**: logos e ícones referenciados via links públicos do Supabase Storage.
- **Configurações**: papel em definir acesso e manutenção da rota.

Possíveis evoluções:
- Salvar a assinatura gerada no Storage.
- Sincronizar layouts (HTML/CSS) via Supabase em vez de hardcode.
- Registrar auditoria em `audit_logs`.

---

## Estrutura e componentes chave

```25:386:src/pages/Assinaturas.tsx
export default function Assinaturas() {
  const [layout, setLayout] = useState("default");
  const [nome, setNome] = useState("");
  const [setor, setSetor] = useState("");
  const [local, setLocal] = useState("");
  const [telefone, setTelefone] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);

  const handleBaixar = () => {
    if (!nome.trim() || !email.trim()) {
      toast.error("Preencha Nome e E-mail para baixar.");
      return;
    }
    if (!previewRef.current) {
      toast.error("Erro: Não foi possível encontrar a pré-visualização.");
      return;
    }

    const originalBackgroundColor = previewRef.current.style.backgroundColor;
    previewRef.current.style.backgroundColor = '#FFFFFF';

    html2canvas(previewRef.current, { scale: 3, useCORS: true, backgroundColor: '#FFFFFF' })
      .then((canvas) => {
        const link = document.createElement("a");
        link.download = `assinatura_${nome.replace(/\s+/g, "_").toLowerCase()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        toast.success("Download ...");
        previewRef.current.style.backgroundColor = originalBackgroundColor;
      })
      .catch((err) => { ... });
  };
```

- **LayoutDefault/LayoutAlt**: componentes que retornam HTML de assinatura com logos e ícones.
- **AssinaturaPreview**: wrapper que injeta dados nos layouts e define URLs dos assets.
- **Botão “Baixar PNG”**: aciona `html2canvas`, garantindo que os campos essenciais estejam preenchidos.
- **Botão “Limpar Campos”**: reseta estado via `handleLimpar`.

---

## Experiência de uso

- `Card` de formulário e `Card` de preview lado a lado (colunas em telas grandes, empilhados em mobile).
- Badges indicam seções (“Preview”).
- Placeholders orientam preenchimento (ex.: “Seu Nome”, “BR Marinas | Glória”).
- `RadioGroup` para escolher layouts com copy clara.
- `toast` oferece feedback de sucesso ou erros (campos faltando, falha no html2canvas).
- Layout responsivo garante que o preview se mantenha dentro do cartão (`width: 330px`, `height: 120px`).

---

## Integrações futuras sugeridas

- Expansão de layouts (ex.: outras unidades ou campanhas) carregados dinamicamente.
- Inserir assinatura diretamente no clipboard (além do PNG).
- Exposição de links rápidos para tutoriais/aplicação nas ferramentas de e-mail corporativo.
- Controle granular de acesso (ex.: apenas RH/Comunicação visual).

---

## Arquivos relacionados

- `src/pages/Assinaturas.tsx` – implementação completa.
- `src/components/ui/button`, `input`, `card` – base UI.
- `src/utils/index.ts` (`createPageUrl`) – link de retorno.

