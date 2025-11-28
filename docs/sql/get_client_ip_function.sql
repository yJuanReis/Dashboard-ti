-- Função RPC para obter o IP do cliente
-- Esta função tenta extrair o IP do cliente dos headers da requisição
-- 
-- O Supabase passa os headers da requisição HTTP através do setting 'request.headers'
-- Procuramos especialmente pelo header 'x-forwarded-for' que contém o IP real do cliente
-- quando a requisição passa por proxies (como o Vercel)

CREATE OR REPLACE FUNCTION get_client_ip()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  headers jsonb;
  forwarded_for text;
  real_ip text;
  client_ip text;
BEGIN
  -- Tenta obter os headers da requisição
  BEGIN
    headers := current_setting('request.headers', true)::jsonb;
  EXCEPTION WHEN OTHERS THEN
    -- Se não conseguir obter os headers, retorna null
    RETURN NULL;
  END;
  
  -- Verifica se conseguimos obter os headers
  IF headers IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Tenta obter o IP de diferentes headers (em ordem de prioridade)
  
  -- 1. X-Forwarded-For: IP real quando passa por proxies
  --    Pode conter múltiplos IPs separados por vírgula (client, proxy1, proxy2...)
  --    O primeiro é o IP real do cliente
  forwarded_for := headers->>'x-forwarded-for';
  IF forwarded_for IS NOT NULL AND forwarded_for != '' THEN
    -- Pega apenas o primeiro IP (antes da primeira vírgula)
    client_ip := split_part(forwarded_for, ',', 1);
    -- Remove espaços em branco
    client_ip := trim(client_ip);
    IF client_ip != '' THEN
      RETURN client_ip;
    END IF;
  END IF;
  
  -- 2. X-Real-IP: Usado por alguns proxies (como nginx)
  real_ip := headers->>'x-real-ip';
  IF real_ip IS NOT NULL AND real_ip != '' THEN
    RETURN trim(real_ip);
  END IF;
  
  -- 3. CF-Connecting-IP: IP fornecido pelo Cloudflare
  client_ip := headers->>'cf-connecting-ip';
  IF client_ip IS NOT NULL AND client_ip != '' THEN
    RETURN trim(client_ip);
  END IF;
  
  -- 4. True-Client-IP: Usado por alguns CDNs
  client_ip := headers->>'true-client-ip';
  IF client_ip IS NOT NULL AND client_ip != '' THEN
    RETURN trim(client_ip);
  END IF;
  
  -- Se nenhum header foi encontrado, retorna null
  RETURN NULL;
END;
$$;

-- Permite que usuários autenticados chamem esta função
GRANT EXECUTE ON FUNCTION get_client_ip() TO authenticated;

-- Comentário da função
COMMENT ON FUNCTION get_client_ip() IS 
'Retorna o endereço IP do cliente extraído dos headers da requisição HTTP. '
'Procura em vários headers comuns (X-Forwarded-For, X-Real-IP, etc.) e retorna '
'o primeiro IP válido encontrado. Retorna NULL se não conseguir determinar o IP.';

