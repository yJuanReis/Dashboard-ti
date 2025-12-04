# 📧 Automação de Despesas - Cron Job Vercel

## 📋 Visão Geral

Este documento descreve a configuração do cron job automático que envia relatórios de despesas T.I. por email todo dia 10 de cada mês às 09:00 AM.

## 🏗️ Estrutura

- **API Route**: `api/cron/despesas/index.ts`
- **Configuração Cron**: `vercel.json`
- **Agendamento**: Todo dia 10 às 09:00 AM (horário UTC)

## ⚙️ Variáveis de Ambiente Necessárias

Configure as seguintes variáveis no painel da Vercel (Settings > Environment Variables):

### 🔐 Supabase
- `SUPABASE_URL`: URL do seu projeto Supabase
- `SUPABASE_KEY`: Chave de serviço (service_role key) do Supabase
  - ⚠️ **Importante**: Use a `service_role` key, não a `anon` key, pois o cron precisa acessar o banco sem autenticação de usuário

### 📧 Email (Gmail)
- `EMAIL_USER`: Email remetente (ex: `seuemail@gmail.com`)
- `EMAIL_PASS`: Senha de aplicativo do Gmail
  - 📝 **Como obter**: 
    1. Acesse sua conta Google
    2. Vá em Segurança > Verificação em duas etapas
    3. Em "Senhas de app", gere uma nova senha de aplicativo
    4. Use essa senha aqui (não use sua senha normal do Gmail)
- `EMAIL_TO`: Email de destino para receber os relatórios

### 🔒 Segurança
- `CRON_SECRET`: Senha forte aleatória para proteger o endpoint
  - 📝 **Como gerar**: Use um gerador de senhas ou execute:
    ```bash
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    ```
  - ⚠️ **Importante**: Esta senha será usada automaticamente pelo Vercel Cron na autenticação

## 📊 Estrutura da Tabela `despesas_ti`

A tabela deve conter as seguintes colunas:

### Colunas Obrigatórias:
- `id`: Identificador único
- `fornecedor`: Nome do fornecedor
- `desc_servico`: Descrição do serviço
- `tipo_despesa`: Tipo da despesa (`'Recorrente'` ou `'Esporadico'`)
- `valor_medio`: Valor médio/mensal da despesa

### Colunas Mensais (para despesas esporádicas):
- `jan`, `fev`, `mar`, `abr`, `mai`, `jun`
- `jul`, `ago`, `set`, `out_`, `nov`, `dez`

**Nota**: O mês de outubro usa `out_` (com underscore) para evitar conflitos com palavras reservadas.

## 🔄 Como Funciona

1. **Agendamento**: O Vercel Cron executa automaticamente no dia 10 de cada mês às 09:00 UTC
2. **Autenticação**: O cron envia um header `Authorization: Bearer {CRON_SECRET}` para autenticar
3. **Busca de Dados**:
   - Busca todas as despesas com `tipo_despesa = 'Recorrente'`
   - Busca despesas esporádicas do mês atual (onde a coluna do mês > 0)
4. **Geração do Relatório**: Monta um HTML com:
   - Lista de despesas recorrentes
   - Lista de despesas esporádicas do mês
   - Total estimado
5. **Envio de Email**: Envia o relatório para o email configurado em `EMAIL_TO`

## 🧪 Teste Manual

Para testar manualmente, você pode fazer uma requisição GET para o endpoint:

```bash
curl -X GET https://seu-dominio.vercel.app/api/cron/despesas \
  -H "Authorization: Bearer SEU_CRON_SECRET"
```

Ou usando o Vercel CLI:

```bash
vercel dev
# Em outro terminal:
curl -X GET http://localhost:3000/api/cron/despesas \
  -H "Authorization: Bearer SEU_CRON_SECRET"
```

## 📝 Notas Importantes

### Vercel Gratuito
- ✅ Suporta cron jobs
- ✅ Limite: Até 2 cron jobs por conta
- ✅ Limite: 1 execução por dia por cron job
- ⚠️ **Importante**: A execução pode ocorrer em qualquer momento dentro da hora especificada
  - Exemplo: Se agendado para `0 9 10 * *` (09:00), pode executar entre 09:00 e 09:59
- ✅ Perfeito para este caso de uso (1x por mês)

### Supabase Gratuito
- ✅ Suporta todas as operações necessárias
- ✅ Limite de requisições: 50.000/mês
- ✅ Este cron usa apenas algumas requisições por mês
- ⚠️ **Atenção**: O banco pode ser pausado após 1 semana de inatividade
  - Como este cron roda apenas 1x por mês, considere criar um cron adicional para manter o banco ativo
  - Sugestão: Criar um cron que faz uma query simples diária (ex: `SELECT 1`)

### Gmail
- ✅ Gratuito
- ⚠️ Requer senha de aplicativo (não use senha normal)
- ⚠️ Limite de 500 emails/dia (mais que suficiente para este caso)

## 🐛 Troubleshooting

### Erro: "Unauthorized"
- Verifique se `CRON_SECRET` está configurado corretamente
- Verifique se o header de autorização está sendo enviado

### Erro: "Variáveis de email não configuradas"
- Verifique se `EMAIL_USER`, `EMAIL_PASS` e `EMAIL_TO` estão configuradas
- Certifique-se de usar senha de aplicativo do Gmail, não a senha normal

### Erro: "Variáveis SUPABASE_URL e SUPABASE_KEY não configuradas"
- Verifique se as variáveis estão configuradas no Vercel
- Use a `service_role` key, não a `anon` key

### Email não está sendo enviado
- Verifique os logs do Vercel
- Teste manualmente o endpoint
- Verifique se a senha de aplicativo do Gmail está correta

## 📚 Referências

- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

