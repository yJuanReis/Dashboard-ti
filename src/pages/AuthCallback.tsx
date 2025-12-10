import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Página de callback para OAuth
 * Esta página é carregada no popup após o login com Google
 * Ela fecha o popup automaticamente após processar a autenticação
 */
export default function AuthCallback() {
  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Aguardar um pouco para o Supabase processar a sessão
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verificar se há sessão
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Login bem-sucedido - notificar a janela principal e fechar
          if (window.opener) {
            // Enviar mensagem para a janela principal
            window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', session: true }, window.location.origin);
          }
          
          // Fechar o popup
          window.close();
        } else {
          // Sem sessão - login falhou ou foi cancelado
          if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR' }, window.location.origin);
          }
          window.close();
        }
      } catch (error) {
        console.error('Erro ao processar callback:', error);
        if (window.opener) {
          window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR' }, window.location.origin);
        }
        window.close();
      }
    };

    handleCallback();
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <p>Processando login...</p>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          Esta janela será fechada automaticamente.
        </p>
      </div>
    </div>
  );
}

