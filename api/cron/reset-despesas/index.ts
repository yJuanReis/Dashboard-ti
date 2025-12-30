import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // 1. Verificação de Segurança (CRON_SECRET)
  const authHeader = request.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error('CRON_SECRET não configurado');
    return response.status(500).json({ error: 'Configuração de segurança ausente' });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Validar variáveis de ambiente necessárias
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const emailTo = process.env.EMAIL_TO;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variáveis SUPABASE_URL e SUPABASE_KEY não configuradas');
    }

    if (!emailUser || !emailPass || !emailTo) {
      throw new Error('Variáveis de email não configuradas (EMAIL_USER, EMAIL_PASS, EMAIL_TO)');
    }

    // Configurar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    const dataHoje = new Date();
    const diaHoje = dataHoje.getDate();

    // Verificar se é um teste (parâmetro test=true ou header x-test=true)
    const isTest = request.query.test === 'true' || request.headers['x-test'] === 'true';

    // Verificar se é dia 1 - se não for, não enviar email (exceto se for teste)
    if (diaHoje !== 1 && !isTest) {
      // Mesmo que não seja dia 1, executar o reset se for solicitado via parâmetro
      const forceReset = request.query.reset === 'true';
      if (!forceReset) {
        return response.status(200).json({
          success: true,
          message: `Não é dia 1. Email será enviado apenas no dia 1 de cada mês. Hoje é dia ${diaHoje}.`,
          skipped: true
        });
      }
    }

    if (isTest) {
      console.log(`��� TESTE: Enviando email de relatório mensal mesmo não sendo dia 1 (hoje é dia ${diaHoje})`);
    }

    // Calcular mês anterior para o relatório
    const mesAnterior = new Date(dataHoje);
    mesAnterior.setMonth(mesAnterior.getMonth() - 1);
    const nomeMesAnterior = mesAnterior.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    console.log(`��� É dia 1! Enviando relatório mensal do ${nomeMesAnterior}...`);

    // 1. Buscar status atual antes do reset (para relatório)
    const { data: statusAntesReset, error: errStatusAntes } = await supabase
      .from('despesas_recorrentes')
      .select('id, apelido, match_empresa, status_mes_atual')
      .eq('ativo', true);

    if (errStatusAntes) {
      console.error('Erro ao buscar status antes do reset:', errStatusAntes);
      throw errStatusAntes;
    }

    // 2. Resetar todas as despesas para PENDENTE
    console.log('��� Resetando status mensal de todas as despesas recorrentes...');
    const { error: resetError } = await supabase
      .from('despesas_recorrentes')
      .update({
        status_mes_atual: 'PENDENTE',
        updated_at: new Date().toISOString()
      })
      .eq('ativo', true);

    if (resetError) {
      console.error('❌ Erro ao resetar status mensal:', resetError);
      throw resetError;
    }

    console.log('✅ Status mensal resetado para todas as despesas recorrentes');

    // 3. Calcular estatísticas do mês anterior
    const totalDespesas = statusAntesReset?.length || 0;
    const despesasLancadas = statusAntesReset?.filter(d => d.status_mes_atual === 'LANCADO').length || 0;
    const despesasPendentes = totalDespesas - despesasLancadas;
    const taxaSucesso = totalDespesas > 0 ? ((despesasLancadas / totalDespesas) * 100) : 0;

    // 4. Identificar despesas que não foram lançadas
    const naoLancadas = statusAntesReset?.filter(d => d.status_mes_atual !== 'LANCADO') || [];

    console.log(`��� Relatório ${nomeMesAnterior}: ${despesasLancadas}/${totalDespesas} lançadas (${taxaSucesso.toFixed(1)}%)`);

    return await enviarEmailRelatorioMensal(
      naoLancadas,
      nomeMesAnterior,
      { total: totalDespesas, lancadas: despesasLancadas, taxaSucesso },
      emailUser,
      emailPass,
      emailTo,
      response
    );

  } catch (error: any) {
    console.error('Erro ao processar reset mensal:', error);
    return response.status(500).json({ 
      error: error.message || 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
// Função para enviar email com relatório mensal
async function enviarEmailRelatorioMensal(
  naoLancadas: any[],
  nomeMes: string,
  stats: { total: number; lancadas: number; taxaSucesso: number },
  emailUser: string,
  emailPass: string,
  emailTo: string,
  response: any
) {
  // Template HTML profissional usando tabelas (compatível com email)
  let html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Relatório Mensal - ${nomeMes}</title>
  <style type="text/css">
    /* Reset básico para clientes de email */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }

    /* Responsividade */
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .column { display: block !important; width: 100% !important; max-width: 100% !important; direction: ltr !important; }
      .card-spacer { height: 20px !important; }
      .mobile-padding { padding-left: 10px !important; padding-right: 10px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">

  <!-- Wrapper Principal -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8f9fa;">
    <tr>
      <td align="center" style="padding: 20px 0;">

        <!-- Container Central -->
        <table border="0" cellpadding="0" cellspacing="0" width="800" class="container" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 1px solid #e9ecef;">

          <!-- Cabeçalho -->
          <tr>
            <td align="center" style="background: ${stats.taxaSucesso === 100 ? '#28a745' : '#ffc107'}; background: ${stats.taxaSucesso === 100 ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' : 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)'}; padding: 30px 20px; color: #ffffff;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 0.5px; font-family: sans-serif;">
                <img src="https://dashboard-ti-brmarinas.vercel.app/favicon.ico" alt="Logo" style="width: 46px; height: 46px; margin-right: 10px; vertical-align: middle; border-radius: 4px;">
                Dashboard TI | BR Marinas
              </h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Relatório Mensal - ${nomeMes}</p>
            </td>
          </tr>

          <!-- Estatísticas -->
          <tr>
            <td class="mobile-padding" style="padding: 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px;">
                    ${stats.taxaSucesso === 100 ? `
                      <!-- SUCESSO TOTAL -->
                      <div style="font-size: 48px; margin-bottom: 10px;">���</div>
                      <div style="font-size: 24px; font-weight: 600; color: #28a745; margin-bottom: 10px;">META ATINGIDA!</div>
                      <div style="font-size: 18px; color: #6c757d; margin-bottom: 20px;">Todas as ${stats.total} despesas recorrentes foram lançadas</div>
                      <div style="font-size: 16px; color: #495057; background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; display: inline-block;">
                        ✅ 100% de sucesso no mês passado!
                      </div>
                    ` : `
                      <!-- PENDÊNCIAS IDENTIFICADAS -->
                      <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                      <div style="font-size: 24px; font-weight: 600; color: #856404; margin-bottom: 10px;">PENDÊNCIAS IDENTIFICADAS</div>
                      <div style="font-size: 18px; color: #6c757d; margin-bottom: 20px;">${stats.lancadas} de ${stats.total} despesas lançadas (${stats.taxaSucesso.toFixed(1)}%)</div>
                      <div style="font-size: 16px; color: #495057; background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; display: inline-block;">
                        ��� ${stats.total - stats.lancadas} despesas não foram lançadas no mês passado
                      </div>
                    `}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
`;

  // Adicionar lista de pendências se houver
  if (naoLancadas && naoLancadas.length > 0) {
    html += `
          <!-- Lista de Pendências -->
          <tr>
            <td class="mobile-padding" style="padding: 0 20px 20px 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="background: #f8f9fa; padding: 15px; font-weight: 600; color: #495057; border-bottom: 1px solid #e9ecef;">
                    ��� Despesas Não Lançadas em ${nomeMes}
                  </td>
                </tr>
    `;

    naoLancadas.forEach((item: any, index: number) => {
      const servico = escapeHtml(item.apelido || 'N/A');
      const empresa = escapeHtml(item.match_empresa || 'N/A');

      html += `
                <tr>
                  <td style="padding: 15px; border-bottom: ${index < naoLancadas.length - 1 ? '1px solid #f8f9fa' : 'none'};">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <div style="width: 8px; height: 8px; background-color: #dc3545; border-radius: 50%; flex-shrink: 0;"></div>
                      <div style="flex: 1;">
                        <div style="font-weight: 600; color: #495057; margin-bottom: 4px;">${servico}</div>
                        <div style="font-size: 11px; color: #007bff; background: #e7f3ff; padding: 2px 6px; border-radius: 3px; display: inline-block;">${empresa}</div>
                      </div>
                    </div>
                  </td>
                </tr>
      `;
    });

    html += `
              </table>
            </td>
          </tr>
    `;
  }

  html += `
          <!-- Rodapé -->
          <tr>
            <td align="center" style="background-color: #f8f9fa; padding: 20px; border-top: 1px solid #e9ecef; color: #adb5bd; font-size: 11px;">
              <p style="margin: 5px 0;">Sistema de controle automático de despesas recorrentes.</p>
              <p style="margin: 5px 0;">Todas as despesas foram resetadas para o novo mês.</p>
              <p style="margin: 5px 0;">© 2025 BR Marinas - Dashboard TI</p>
              <p style="margin: 5px 0;"><a href="https://dashboard-ti-brmarinas.vercel.app/" style="color: #007bff; text-decoration: none;">Acesse o sistema para gerenciar as despesas</a></p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;

  // Enviar Email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  await transporter.sendMail({
    from: `"Dashboard TI | BR Marinas" <${emailUser}>`,
    to: emailTo,
    subject: `Relatório Mensal - ${nomeMes}`,
    html: html,
  });

  return response.status(200).json({
    success: true,
    message: 'Relatório mensal enviado e reset realizado com sucesso!',
    stats: {
      total: stats.total,
      lancadas: stats.lancadas,
      naoLancadas: naoLancadas.length,
      taxaSucesso: stats.taxaSucesso
    },
    mes: nomeMes
  });
}

// Função auxiliar para escapar HTML e prevenir XSS
function escapeHtml(text: string): string {
  if (!text) return '';
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
