# Controle de HDs (`/controle-hds`)

Também chamado internamente de “Evolução HDs”, este painel monitora slots de NVR que estão vazios ou com HD abaixo do padrão (>=12 TB). Acompanha progresso, custo estimado e fornece ferramentas rápidas para planejar compras ou substituições.

---

## Proteções e contexto

- **Guards**: `ProtectedRoute`, `PasswordTemporaryGuard`, `PagePermissionGuard`.
- **Permissões**: configuradas em `user_profiles.page_permissions`.
- **Sidebar**: item “Controle de HDs” (`HardDrive`).
- **Dados base**: usa o mesmo `NVRContext` de Controle NVR para obter NVRs e slots.
- **Integrações**:
  - Configurações (pode ocultar/manter rota).
  - Audit Logs (quando backend registra updates de slots).
  - Dashboard de Segurança (Security Test) monitora se dados sensíveis (preço do HD) estão protegidos.

---

## Stack principal

- `useNVR()` + `useSidebar()` como no Controle NVR.
- Hooks próprios para filtros/ordenadores (`searchTerm`, `marinaFilter`, `ownerFilter`, `modelFilter`, `sortField`, `sortDirection`).
- Estado de preço (`hdPrice`) persistido via Supabase (tabela de configuração).
- `toast` para feedback, `Dialog`/`Card`/`Table` da UI kit.
- Escuta eventos personalizados (`hd:setSearch`) para integrar com campo de busca global.

---

## Funções principais

### Filtragem de slots com ação

```178:210:src/pages/ControleHD.tsx
const nvrsNeedingAction = nvrs.filter((nvr) =>
  (nvr.slots || []).some(
    (slot) =>
      slot.status === "empty" ||
      (slot.status !== "inactive" && slot.hdSize > 0 && slot.hdSize < 12)
  )
);

const filteredAndSortedNVRs = [...nvrsNeedingAction]
  .filter((nvr) => { ... filtros por texto/marina/owner/modelo ... })
  .sort((a, b) => { ... });
```

- Apenas NVRs com slots vazios ou com HD < 12 TB aparecem.
- Slots inativos (“inactive”) são ignorados.
- Permite atacar apenas os pontos que precisam de atenção.

### KPIs

```212:270:src/pages/ControleHD.tsx
const calculateKPIs = () => {
  let totalSlotsInSystem = 0;
  let totalSlotsNeedingAction = 0;
  let purchasedCount = 0;
  let emptySlotsCount = 0;
  let slotsWithHD12Plus = 0;
  let slotsWithHDLessThan12 = 0;

  nvrs.forEach((nvr) => {
    (nvr.slots || []).forEach((slot) => {
      if (slot.status === "inactive") return;
      totalSlotsInSystem++;
      const isEmpty = slot.status === "empty";
      const isUndersized = !isEmpty && slot.hdSize < 12;
      if (isEmpty) emptySlotsCount++;
      if (!isEmpty && slot.hdSize >= 12) slotsWithHD12Plus++;
      if (!isEmpty && slot.hdSize > 0 && slot.hdSize < 12) slotsWithHDLessThan12++;
      if (isEmpty || isUndersized) {
        totalSlotsNeedingAction++;
        if (slot.purchased) purchasedCount++;
      }
    });
  });

  const pendingSlotsCount = totalSlotsNeedingAction - purchasedCount;
  const progress = totalSlotsInSystem > 0
    ? ((totalSlotsValid + purchasedCount) / totalSlotsInSystem) * 100
    : 0;
  const estimatedCost = pendingSlotsCount * hdPrice;

  return { progress, emptySlots: pendingSlotsCount, cost: estimatedCost, ... };
};
```

- Calcula progresso (slots válidos + comprados) vs total.
- Estima custo com base no preço médio do HD (`hdPrice`).
- KPIs exibem slots vazios, slots <12TB, total de ações pendentes, etc.

### Preço do HD

```150:163:src/pages/ControleHD.tsx
useEffect(() => {
  const loadHDPrice = async () => {
    try {
      const price = await fetchHDPrice();
      setHdPrice(price);
    } catch (error) {
      console.error('Erro ao carregar preço do HD:', error);
    }
  };
  loadHDPrice();
}, []);

const handlePriceChange = (value: string) => {
  const price = parseFloat(value) || 0;
  setHdPrice(price);
  if (priceSaveTimerRef.current) clearTimeout(priceSaveTimerRef.current);
  priceSaveTimerRef.current = window.setTimeout(async () => {
    await saveHDPrice(price);
    toast.success("Preço do HD salvo!");
  }, 1000);
};
```

- Preço carregado do Supabase ao montar.
- `saveHDPrice` persiste com debounce de 1s para evitar excesso de chamadas.
- Esse preço alimenta o cálculo de custo nos KPIs e relatórios.

### Exportação XLSX

```324:373:src/pages/ControleHD.tsx
const handleExport = () => {
  if (typeof window === "undefined" || !(window as any).XLSX) {
    toast.error("Biblioteca XLSX não encontrada...");
    return;
  }
  const dataToExport = nvrs.flatMap((nvr) =>
    (nvr.slots || [])
      .map((slot, index) => {
        const isEmpty = slot.status === "empty";
        const isUndersized = slot.status !== "inactive" && !isEmpty && slot.hdSize < 12;
        if (!isEmpty && !isUndersized) return null;
        return {
          Responsável: nvr.owner,
          "Marina / Numeração": `${nvr.marina} / ${nvr.name}`,
          Modelo: nvr.model,
          Slot: index + 1,
          "Status Atual": isEmpty ? "Vazio" : `${slot.hdSize} TB`,
          Ação: isEmpty ? "Comprar" : "Substituir",
          Comprado: slot.purchased ? "Sim" : "Não",
        };
      })
      .filter(Boolean)
  );
  ...
  XLSX.writeFile(workbook, `relatorio_evolucao_hds_${new Date().toISOString().slice(0, 10)}.xlsx`);
  toast.success("Relatório exportado com sucesso!");
};
```

- Usa `window.XLSX` (biblioteca deve estar disponível globalmente).
- Exporta somente slots que exigem compra/substituição.
- Gera relatório nomeado com data atual.

---

## UX e responsividade

- Layout similar ao Controle NVR, com:
  - Cards de KPI no topo.
  - Tabela detalhada com slots pendentes e ações rápidas (botões para marcar `purchased`).
- `createSlotButton` cria botões com classes dinamicamente coloridas para cada slot.
- Orientação mobile: mesmo hook que fecha sidebar quando necessário.
- Evento `hd:setSearch`: header global pode disparar busca que a tela consome para sincronizar.

---

## Interações com outros módulos

| Módulo          | Relação                                                                 |
|-----------------|--------------------------------------------------------------------------|
| Controle NVR    | Fonte dos dados de NVR/slots; updates feitos lá refletem aqui e vice-versa. |
| Configurações   | Define acesso e manutenção; também pode ajustar permissões para times específicos. |
| Audit Logs      | Deve registrar mudanças de slots/preço para rastreabilidade (quando implementado). |
| Security Test   | Testes garantem que dados (como preço) não fiquem expostos em localStorage/DOM indevido. |

---

## Pontos de atenção

- **Sincronização**: slots marcados como `purchased` aqui devem ser tratados no Controle NVR para refletir substituições concluídas.
- **Biblioteca XLSX**: garantir carregamento (ex.: via script em `index.html`) antes de usar export.
- **Preço do HD**: guardar histórico poderia ajudar em análises futuras (atualmente só valor atual é salvo).
- **Performance**: para grande quantidade de NVRs, considerar paginação ou carregamento incremental.
- **Segurança**: dados não são extremamente sensíveis, mas `hdPrice` pode ser corporativo; manter rota protegida.

---

## Arquivos relacionados

- `src/pages/ControleHD.tsx` (Evolução HDs).
- `src/contexts/NVRContext.tsx` (dados compartilhados).
- `src/lib/nvrConfigService.ts` (`fetchHDPrice`/`saveHDPrice`).

