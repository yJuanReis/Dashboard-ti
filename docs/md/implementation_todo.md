# Implementação do Novo Card "Status de Upgrade de HDs"

## Objetivo
Criar um novo card mais compacto e informativo para substituir o card de "Armazenamento Crítico"

## Tarefas
- [ ] Examinar estrutura atual do Home.tsx
- [ ] Implementar novo card "Status de Upgrade de HDs" 
- [ ] Configurar para ocupar 2 colunas (full width)
- [ ] Organizar conteúdo em 2 colunas dentro do card
- [ ] Remover legenda de cores (≥14TB, 6-13TB, etc.)
- [ ] Adicionar valores grandes aos slots
- [ ] Testar o layout
- [ ] Verificar responsividade

## Layout Proposto
```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Status de Upgrade de HDs                        │
│                                                                         │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐       │
│  │ São Paulo / NVR-CAM-01     │  │ Rio de Janeiro / NVR-CAM-02 │       │
│  │ [Em progresso] [3/8]       │  │ [Precisa upgrade] [0/4]      │       │
│  │ ███████████████████░ 37%   │  │ ░░░░░░░░░░░░░░░░░░░░ 0%      │       │
│  │ 16TB 16TB 8TB 8TB         │  │ 4TB 4TB 2TB 2TB             │       │
│  │ S1  S2  S3  S4            │  │ S1  S2  S3  S4               │       │
│  └─────────────────────────────┘  └─────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
```

## Cores dos Slots
- 🟢 Verde = Adequado (≥14TB)
- 🟡 Amarelo = Atenção (6-13TB) 
- 🔴 Vermelho = Crítico (≤5TB)
- ⚫ Cinza = Vazio/sem HD
