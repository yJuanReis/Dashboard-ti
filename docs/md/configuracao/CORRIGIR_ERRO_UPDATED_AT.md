# 🔧 Correção do Erro: "record 'new' has no field 'updated_at'"

## 📋 Problema

Ao tentar atualizar um usuário na página de Configurações, você está recebendo o erro:

```
Erro ao atualizar dados básicos: {
  code: '42703',
  message: 'record "new" has no field "updated_at"'
}
```

Este erro ocorre porque o trigger `update_updated_at_column()` está tentando acessar o campo `updated_at`, mas esse campo não existe na tabela `user_profiles` ou não está disponível no contexto do trigger.

## ✅ Solução

Execute o script SQL `tutorial/sql/fix_updated_at_trigger.sql` no SQL Editor do Supabase Dashboard.

### Passo a Passo:

1. **Acesse o Supabase Dashboard**
   - Vá para o seu projeto no Supabase
   - Clique em "SQL Editor" no menu lateral

2. **Execute o Script de Correção**
   - Abra o arquivo `tutorial/sql/fix_updated_at_trigger.sql`
   - Copie todo o conteúdo
   - Cole no SQL Editor do Supabase
   - Clique em "Run" ou pressione `Ctrl+Enter`

3. **Verifique se Funcionou**
   - O script irá:
     - Verificar se o campo `updated_at` existe
     - Adicionar o campo se não existir
     - Corrigir a função do trigger
     - Recriar o trigger

4. **Teste na Aplicação**
   - Volte para a aplicação
   - Tente editar um usuário novamente
   - O erro não deve mais aparecer

## 🔍 O que o Script Faz

1. **Verifica e Adiciona o Campo `updated_at`**
   - Se o campo não existir na tabela, ele será adicionado automaticamente

2. **Corrige a Função do Trigger**
   - Recria a função `update_updated_at_column()` de forma correta

3. **Recria o Trigger**
   - Remove o trigger antigo e cria um novo, garantindo que está funcionando corretamente

## 📝 Notas Importantes

- Este script é seguro e não apaga dados existentes
- Ele apenas adiciona o campo se não existir e corrige o trigger
- Você pode executá-lo quantas vezes quiser sem problemas

## 🐛 Se o Erro Persistir

Se após executar o script o erro ainda ocorrer:

1. Verifique se o campo `updated_at` foi criado:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles' 
AND column_name = 'updated_at';
```

2. Verifique se o trigger existe:
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'user_profiles'
AND trigger_name = 'update_user_profiles_updated_at';
```

3. Se necessário, entre em contato com o suporte ou verifique os logs do Supabase para mais detalhes.

