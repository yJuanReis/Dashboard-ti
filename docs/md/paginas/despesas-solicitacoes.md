# 📊 Sistema de Despesas e Solicitações - Documentação Completa

## 📋 Visão Geral

O sistema de Despesas e Solicitações é composto por duas páginas principais que trabalham em conjunto para gerenciar o fluxo completo de solicitações de compra (SCs) da área de TI.

### 🏗️ Arquitetura do Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Despesas        │    │ Solicitações    │    │ Lembretes       │
│ Recorrentes     │◄──►│ (SCs)          │◄──►│ Mensais         │
│                 │    │                 │    │ (Email)         │
│ • Checklist     │    │ • Criação       │    │                 │
│ • Status        │    │ • Aprovação     │    │ • Dia 10        │
│ • Automação     │    │ • Controle      │    │ • Pendências    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📈 1. Página de Despesas Recorrentes

### 🎯 Objetivo
Gerenciar despesas que se repetem mensalmente, como assinaturas de software, hospedagem, manutenção, etc.

### 📊 Funcionalidades Principais

#### 1.1 Checklist Mensal
- **Visualização:** Tabela com todas as despesas recorrentes ativas
- **Status:** Cada despesa pode estar "Pendente" ou "Lançada"
- **Ações:** Botão para marcar como "Lançada" quando a SC é criada

#### 1.2 Estrutura da Tabela `despesas_recorrentes`
```sql
CREATE TABLE despesas_recorrentes (
  id SERIAL PRIMARY KEY,
  apelido VARCHAR(255) NOT NULL,           -- Nome da despesa
  match_texto TEXT,                        -- Texto para matching automático
  match_empresa VARCHAR(255),              -- Empresa/fornecedor
  match_fornecedor VARCHAR(255),           -- Fornecedor alternativo
  dia_vencimento INTEGER,                  -- Dia do vencimento
  ativo BOOLEAN DEFAULT true,              -- Se está ativa
  descricao_padrao TEXT,                   -- Descrição padrão
  valor_estimado DECIMAL(10,2),            -- Valor aproximado
  status_mes_atual VARCHAR(20) DEFAULT 'PENDENTE', -- Status atual
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 1.3 Status do Mês Atual
- **PENDENTE:** SC ainda não foi criada (vermelho)
- **LANCADO:** SC já foi criada (verde)

#### 1.4 Automação
- **Reset Automático:** Todo dia 1, todas as despesas voltam para "PENDENTE"
- **Matching Automático:** Quando uma solicitação é criada, o sistema tenta identificar qual despesa recorrente corresponde

## 📝 2. Página de Solicitações (SCs)

### 🎯 Objetivo
Gerenciar o ciclo completo de solicitações de compra, desde a criação até a aprovação.

### 📊 Funcionalidades Principais

#### 2.1 Criação de SCs
- **Formulário Completo:** Todos os campos necessários para uma SC
- **Matching Inteligente:** Sistema identifica automaticamente despesas recorrentes
- **Validação:** Campos obrigatórios e regras de negócio

#### 2.2 Status das Solicitações
```
RASCUNHO → APROVAÇÃO → APROVADA → FINALIZADA
   ↓         ↓           ↓           ↓
 Cancelada  Reprovada   Reprovada   Cancelada
```

#### 2.3 Estrutura da Tabela `solicitacoes_ti`
```sql
CREATE TABLE solicitacoes_ti (
  id SERIAL PRIMARY KEY,
  numero_sc VARCHAR(50),                    -- Número da SC
  status VARCHAR(20) DEFAULT 'RASCUNHO',    -- Status atual
  prioridade VARCHAR(10) DEFAULT 'MEDIA',   -- URGENTE/ALTA/MEDIA/BAIXA

  -- Dados da Solicitação
  servico VARCHAR(255),                     -- Serviço/produto
  descricao TEXT,                           -- Descrição detalhada
  quantidade INTEGER DEFAULT 1,             -- Quantidade
  valor_unitario DECIMAL(10,2),             -- Valor unitário
  valor_total DECIMAL(10,2),                -- Valor total
  empresa VARCHAR(255),                     -- Empresa solicitante
  centro_custo VARCHAR(255),                -- Centro de custo

  -- Informações do Solicitante
  solicitante_nome VARCHAR(255),            -- Nome do solicitante
  solicitante_email VARCHAR(255),           -- Email do solicitante
  solicitante_telefone VARCHAR(50),         -- Telefone

  -- Aprovações
  aprovacao_gestor BOOLEAN DEFAULT false,   -- Aprovação do gestor
  aprovacao_diretoria BOOLEAN DEFAULT false,-- Aprovação da diretoria
  comentarios_aprovacao TEXT,               -- Comentários das aprovações

  -- Controle de Prazos
  data_solicitacao TIMESTAMP DEFAULT NOW(), -- Quando foi criada
  data_aprovacao TIMESTAMP,                 -- Quando foi aprovada
  data_finalizacao TIMESTAMP,               -- Quando foi finalizada
  prazo_desejado DATE,                      -- Prazo desejado

  -- Metadados
  created_by UUID REFERENCES auth.users(id),-- Quem criou
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2.4 Matching Automático
Quando uma SC é criada, o sistema:

1. **Compara o serviço** com `match_texto` das despesas recorrentes
2. **Verifica a empresa** com `match_empresa`
3. **Se encontra match**, marca automaticamente a despesa como "LANÇADA"
4. **Previne lembretes desnecessários** para SCs já criadas

## 🔄 3. Integração Entre os Sistemas

### 🎯 Fluxo Completo

```
1. DIA 1 DO MÊS
   ↓
   ┌─────────────────────────────────────┐
   │ Todas despesas → "PENDENTE"         │
   └─────────────────────────────────────┘
   ↓
2. DIA 10 DO MÊS
   ↓
   ┌─────────────────────────────────────┐
   │ Email automático com pendências     │
   └─────────────────────────────────────┘
   ↓
3. CRIAR SC NO SISTEMA
   ↓
   ┌─────────────────────────────────────┐
   │ Sistema identifica despesa          │
   │ → Status muda para "LANÇADA"        │
   └─────────────────────────────────────┘
   ↓
4. PRÓXIMO MÊS
   ↓
   ↩️ Reset automático no dia 1
```

### 📧 Sistema de Lembretes

#### 3.1 Cron Job Automático
- **Execução:** Todo dia 10 de cada mês às 9:00
- **Endpoint:** `/api/cron/despesas`
- **Autenticação:** Bearer token (CRON_SECRET)

#### 3.2 Conteúdo do Email
- **Destinatário:** Configurado em variável de ambiente
- **Assunto:** "SCs Pendentes - [mês] de [ano]"
- **Conteúdo:**
  - Lista de despesas pendentes em cards
  - Cada card: Serviço, Descrição, Empresa
  - Layout responsivo (3 colunas desktop, 1 mobile)
  - Link para acessar o sistema

#### 3.3 Template HTML
- **Compatibilidade:** Funciona em Gmail, Outlook, etc.
- **Design:** Profissional com gradiente azul
- **Logo:** Favicon da empresa no cabeçalho
- **Responsivo:** Adapta para dispositivos móveis

## 👥 4. Perfis de Usuário e Permissões

### 🎯 Tipos de Usuário

#### 4.1 Administrador
- **Acesso Total:** Todas as funcionalidades
- **Gerenciamento:** Usuários, permissões, configurações
- **Relatórios:** Acesso a todos os dados
- **Testes:** Botão para testar lembretes

#### 4.2 Usuário Comum
- **Criação:** SCs para seu setor
- **Acompanhamento:** Status das próprias SCs
- **Checklist:** Visualizar e marcar despesas recorrentes

### 🔐 Controle de Acesso

#### 4.3 Tabela `user_profiles`
```sql
CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email VARCHAR(255),
  nome VARCHAR(255),
  role VARCHAR(20) DEFAULT 'user',           -- 'admin' ou 'user'
  page_permissions JSONB,                    -- Páginas permitidas
  password_temporary BOOLEAN DEFAULT false,  -- Se senha é temporária
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4.4 Controle por Página
- **Páginas Escondidas:** Podem ser configuradas por admin
- **Permissões Granulares:** Controle fino por funcionalidade
- **Badge de Aviso:** Páginas em desenvolvimento/avaliação

## 📊 5. Relatórios e Monitoramento

### 🎯 Métricas Principais

#### 5.1 Despesas Recorrentes
- **Total Ativo:** Quantidade de despesas ativas
- **Taxa de Lançamento:** % de despesas já lançadas no mês
- **Histórico:** Evolução mensal dos lançamentos

#### 5.2 Solicitações
- **Tempo Médio:** Desde criação até finalização
- **Taxa de Aprovação:** % de SCs aprovadas
- **Volume por Setor:** Análise por empresa/centro de custo

#### 5.3 Lembretes
- **Envio Automático:** Logs de execução do cron
- **Taxa de Abertura:** Métricas de email (se disponível)
- **Efetividade:** Redução no tempo de criação de SCs

## 🔧 6. Configuração e Manutenção

### 🎯 Variáveis de Ambiente Necessárias

```bash
# Frontend
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Backend/API
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJ...
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=senha-app-gmail
EMAIL_TO=email-destino@brmarinas.com.br
CRON_SECRET=token-seguro-para-cron
```

### 📋 Cron Job no Vercel

```json
{
  "crons": [
    {
      "path": "/api/cron/despesas",
      "schedule": "0 9 10 * *"
    }
  ]
}
```

### 🔄 Reset Mensal Automático

```json
{
  "crons": [
    {
      "path": "/api/cron/reset-despesas",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

## 🚀 7. Próximas Melhorias

### 🎯 Funcionalidades Planejadas

#### 7.1 Dashboard Executivo
- **Visão Geral:** Status de todas as SCs
- **Métricas:** KPIs importantes para gestão
- **Alertas:** Notificações importantes

#### 7.2 Integração com ERP
- **Sincronização:** Status automático das SCs
- **Dados Reais:** Valores e prazos do sistema financeiro
- **Aprovações:** Workflow integrado

#### 7.3 Notificações Avançadas
- **WhatsApp:** Lembretes por WhatsApp
- **Slack/Teams:** Integração com ferramentas de comunicação
- **Personalização:** Regras específicas por tipo de despesa

#### 7.4 Análise Preditiva
- **Tendências:** Previsão de necessidades futuras
- **Alertas Proativos:** Antes do vencimento
- **Otimização:** Sugestões de consolidação de compras

## 📞 8. Suporte e Manutenção

### 🎯 Contato para Suporte
- **Email:** ti@brmarinas.com.br
- **Sistema:** Dashboard TI - Configurações > Suporte

### 📚 Documentação Técnica
- **API:** `/docs/api-despesas.md`
- **Frontend:** `/docs/frontend-solicitacoes.md`
- **Banco:** `/docs/banco-dados.md`

---

**📅 Última Atualização:** Dezembro 2025
**🔧 Versão do Sistema:** 1.7.06
**👨‍💻 Desenvolvido por:** Equipe de TI BR Marinas
