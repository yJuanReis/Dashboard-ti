# 🔄 Cron Job de Despesas - Alertas de SCs Pendentes

Este endpoint é acionado automaticamente pelo Vercel Cron **todo dia 10 às 09:00 AM (UTC)**.

## 🎯 Funcionalidade

- **Dia 10 de cada mês**: Envia email automático com lista de SCs (Solicitações de Compra) que ainda **NÃO foram lançadas** no mês atual
- **Outros dias**: Retorna mensagem informando que o email só é enviado no dia 10

## 📍 Endpoint

```
GET /api/cron/despesas
```

## 🔐 Autenticação

O endpoint requer autenticação via header:

```
Authorization: Bearer {CRON_SECRET}
```

O Vercel Cron envia automaticamente este header quando executa o job.

## 🧪 Teste Manual

Para testar manualmente (desenvolvimento local):

```bash
# 1. Inicie o servidor de desenvolvimento
vercel dev

# 2. Em outro terminal, faça a requisição
curl -X GET http://localhost:3000/api/cron/despesas \
  -H "Authorization: Bearer SEU_CRON_SECRET"
```

Para testar em produção:

```bash
curl -X GET https://seu-dominio.vercel.app/api/cron/despesas \
  -H "Authorization: Bearer SEU_CRON_SECRET"
```

## 📋 Resposta de Sucesso (Dia 10)

```json
{
  "success": true,
  "message": "Email com SCs pendentes enviado com sucesso!",
  "totalPendente": "R$ 1.234,56",
  "quantidadePendentes": 5,
  "mes": "janeiro de 2024"
}
```

## 📋 Resposta quando não é dia 10

```json
{
  "success": true,
  "message": "Não é dia 10. Email será enviado apenas no dia 10 de cada mês. Hoje é dia 15.",
  "skipped": true
}
```

## ❌ Resposta de Erro

```json
{
  "error": "Mensagem de erro"
}
```

## 📧 Conteúdo do Email

O email enviado no dia 10 contém:
- Lista de todas as SCs pendentes (não marcadas no checklist)
- Fornecedor, empresa, serviço e valor de cada despesa pendente
- Total estimado das SCs pendentes
- Link para acessar o checklist no sistema

## 📝 Logs

Os logs podem ser visualizados no painel da Vercel em:
- **Deployments** > Selecione o deployment > **Functions** > `/api/cron/despesas`

## ⚙️ Configuração no Vercel

No arquivo `vercel.json`, configure o cron job para executar todo dia 10:

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

Isso executa às 09:00 UTC do dia 10 de cada mês.

