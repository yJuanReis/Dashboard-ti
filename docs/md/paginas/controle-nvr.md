# Controle NVR (`/controle-nvr`)

Painel completo para inventário e manutenção de NVRs (gravadores) e seus slots de HD. Permite cadastrar, editar, excluir e atualizar o estado de cada slot, com filtros avançados e suporte a mobile.

---

## Proteções e contexto

- **Guards**: `ProtectedRoute`, `PasswordTemporaryGuard`, `PagePermissionGuard`.
- **Permissões**: definidas em `user_profiles.page_permissions`.
- **Sidebar**: item “Controle NVR” (`Video`).
- **Contexto de dados**: usa `NVRProvider`/`useNVR()` para centralizar estado e chamadas Supabase.
- **Integrações**:
  - Configurações pode ocultar a rota (manutenção).
  - Audit Logs registra operações (via backend) para auditoria.
  - Controle de HDs reaproveita as mesmas informações para slots que precisam de upgrade.

---

## Stack e serviços

- **NVRContext (`src/contexts/NVRContext.tsx`)**: provê `nvrs`, `addNVR`, `updateNVR`, `deleteNVR`, `updateSlot`, `loading`.
- **Supabase**: operações CRUD em tabelas `nvrs` e `nvr_slots` (ou equivalente).
- **UI kit**: Cards, Table, Dialog, Select, AlertDialog, Badge.
- **Hooks auxiliares**:
  - `useSidebar` para gerir sidebar em mobile.
  - `useIsLandscapeMobile` (hook custom) detecta orientação.
  - `toast` (`sonner`) para feedback.

---

## Fluxo principal

1. **Carregamento**: `useNVR()` busca NVRs no Supabase e injeta no contexto compartilhado.
2. **Filtragem/Ordenação**:
   - Busca textual (marina, numeração, modelo, owner).
   - Filtros dropdown (marina, proprietário, modelo).
   - Ordenação por coluna (`marina`, `name`, `model`, `owner`, `cameras`).
3. **Modais**:
   - Adicionar/Editar NVR: valida duplicidade (mesma marina + numeração) antes de salvar.
   - Confirmar exclusão (`AlertDialog`).
4. **Slot editor**:
   - Clicar/segurar no slot abre menu flutuante (`SlotMenu`) com tamanhos (0, 4TB, 6TB, 12TB, Inativo etc.).
   - `updateSlot` envia atualização ao backend e atualiza estado local.
5. **Mobile UX**:
   - Se dispositivo estiver em landscape, fecha sidebar para maximizar area.
   - Tabs com glider (“Todos”, proprietários) ajudam a filtrar rapidamente.

---

## Componentes-chave

```1:396:src/pages/ControleNVR.tsx
import { useNVR, NVR_MODELS, MARINA_OPTIONS, OWNER_OPTIONS, type NVR, type Slot } from "@/contexts/NVRContext";
...
const filteredAndSortedNVRs = [...nvrs]
  .filter((nvr) => { ... })
  .sort((a, b) => { ... });

const handleSave = async () => {
  if (!formData.marina || !formData.name || !formData.model || !formData.owner) {
    toast.error("Preencha todos os campos obrigatórios");
    return;
  }
  if (editingNVR) {
    // Verifica duplicidade
    await updateNVR(editingNVR.id, formData);
  } else {
    const modelConfig = NVR_MODELS[formData.model];
    const slots: Slot[] = Array.from({ length: modelConfig?.slots || 0 }, () => ({
      status: "empty",
      hdSize: 0,
      purchased: false,
    }));
    await addNVR({ ...formData, slots });
  }
};
```

- **Estrutura**:
  - `formData` guarda campos do modal (marina, número, modelo, owner, cameras, notes).
  - Ao criar, gera automaticamente os slots com base no modelo (`NVR_MODELS` define quantidade).
  - `handleDelete` + `confirmDelete` cuidam da exclusão com modal de confirmação.

### Slot menu

```70:167:src/pages/ControleNVR.tsx
function SlotMenu({ nvrId, slotIndex, slotButtonRefs, slotSizes, onSelectSize }) {
  useEffect(() => {
    const button = slotButtonRefs.current.get(`${nvrId}-${slotIndex}`);
    ...
    // Calcula posição do menu baseado na posição do slot na tela
  }, [nvrId, slotIndex, slotButtonRefs]);

  return (
    <div className="slot-editor-menu fixed ...">
      <div className="grid grid-cols-2 gap-1">
        {slotSizes.map(({ size, label }) => (
          <Button onClick={() => onSelectSize(size)}>{label}</Button>
        ))}
      </div>
    </div>
  );
}
```

- Cria menu flutuante posicionado ao lado do slot clicado.
- `slotSizes` inclui opções como `0` (vazio), `-1` (inativo), `12` (12TB) etc.
- `handleSlotUpdate` traduz o tamanho selecionado em `status` e `hdSize`, depois chama `updateSlot`.

---

## Orientação e sidebar

```197:239:src/pages/ControleNVR.tsx
useEffect(() => {
  const checkOrientation = () => {
    const isMobileDevice = window.innerWidth < 768;
    const isPortraitMode = window.innerHeight > window.innerWidth;
    const isLandscape = isMobileDevice && !isPortraitMode;
    setIsPortrait(isMobileDevice && isPortraitMode);
    if (isMobileDevice && isLandscape && isMobile) {
      setOpenMobile(false);
    }
  };
  checkOrientation();
  window.addEventListener('resize', checkOrientation);
  window.addEventListener('orientationchange', checkOrientation);
  return () => {
    window.removeEventListener('resize', checkOrientation);
    window.removeEventListener('orientationchange', checkOrientation);
  };
}, [isMobile, setOpenMobile]);
```

- Garante que no modo landscape a sidebar feche automaticamente (maximizando visualização dos slots).
- `isPortrait` pode ser usado para mostrar alertas se necessário.

---

## Integrações com outros módulos

| Módulo                  | Relação                                                                 |
|-------------------------|--------------------------------------------------------------------------|
| Controle de HDs         | Reutiliza dados de `useNVR()` para encontrar slots com HD < 12 TB.        |
| Configurações (Pages Maintenance) | Pode marcar a rota como escondida/manutenção.                 |
| Audit Logs              | Operações de criação/edição/deleção são registradas (quando backend habilita). |
| Security Test           | Testes de segurança verificam se dados sensíveis (ex.: notas) estão protegidos. |

---

## Pontos de atenção

- **Validação**: impedir duplicidade (mesma marina + numeração) para manter inventário consistente.
- **Slots inativos**: `size === -1` vira status “inactive” e mantém `hdSize` anterior.
- **Estado local vs backend**: garantir que `useNVR` trate erros de Supabase e mantenha fallback offline-friendly.
- **Performance**: para muitos NVRs, considerar paginação ou search server-side.
- **Segurança**: nenhum dado extremamente sensível, mas notas podem conter informações internas; manter guardas e logs ativos.

---

## Arquivos relacionados

- `src/pages/ControleNVR.tsx` – UI principal e handlers.
- `src/contexts/NVRContext.tsx` – estado compartilhado e chamadas Supabase.
- `src/hooks/use-mobile.tsx` / `useIsLandscapeMobile` – suporte a mobile.

