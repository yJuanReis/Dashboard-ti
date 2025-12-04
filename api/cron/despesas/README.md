# 🔄 Cron Job de Despesas

Este endpoint é acionado automaticamente pelo Vercel Cron todo dia 10 às 09:00 AM (UTC).

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

## 📋 Resposta de Sucesso

```json
{
  "success": true,
  "message": "Email enviado com sucesso!",
  "total": "R$ 1.234,56",
  "recorrentes": 5,
  "esporadicas": 2
}
```

## ❌ Resposta de Erro

```json
{
  "error": "Mensagem de erro"
}
```

## 📝 Logs

Os logs podem ser visualizados no painel da Vercel em:
- **Deployments** > Selecione o deployment > **Functions** > `/api/cron/despesas`

