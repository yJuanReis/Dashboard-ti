import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Formatador de Moeda
const BRL = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Função para mapear dados da tabela despesas_ti para formato compatível
function mapDespesasCompatibilidade(data: any[]): any[] {
  return data.map(item => ({
    ...item,
    servico: item.servico || item.fornecedor || '',
    descricao: item.descricao || item.desc_servico || '',
    fornecedor: item.servico || item.fornecedor || '',
    desc_servico: item.descricao || item.desc_servico || '',
  }));
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // 1. Verificação de Segurança (CRON_SECRET)
  // Impede que qualquer um acesse a URL e dispare o email
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

    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out_', 'nov', 'dez'];
    const dataHoje = new Date();
    const diaHoje = dataHoje.getDate();
    const mesAtual = meses[dataHoje.getMonth()];
    const nomeMes = dataHoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    // Verificar se é um teste (parâmetro test=true ou header x-test=true)
    const isTest = request.query.test === 'true' || request.headers['x-test'] === 'true';

    // Verificar se é dia 10 - se não for, não enviar email (exceto se for teste)
    if (diaHoje !== 10 && !isTest) {
      return response.status(200).json({
        success: true,
        message: `Não é dia 10. Email será enviado apenas no dia 10 de cada mês. Hoje é dia ${diaHoje}.`,
        skipped: true
      });
    }

    if (isTest) {
      console.log(`🧪 TESTE: Enviando email de teste mesmo não sendo dia 10 (hoje é dia ${diaHoje})`);
    }

    console.log(`📧 É dia 10! Enviando email com SCs pendentes para ${nomeMes}...`);

    // Buscar apenas despesas recorrentes PENDENTES (status_mes_atual = 'PENDENTE')
    const { data: pendentes, error: errPendentes } = await supabase
      .from('despesas_recorrentes')
      .select('*')
      .eq('status_mes_atual', 'PENDENTE')
      .eq('ativo', true)
      .order('apelido');

    if (errPendentes) {
      console.error('Erro ao buscar despesas pendentes:', errPendentes);
      throw errPendentes;
    }

    return await enviarEmailPendentes(mapDespesasCompatibilidade(pendentes || []), mesAtual, nomeMes, emailUser, emailPass, emailTo, response);

  } catch (error: any) {
    console.error('Erro ao processar cron de despesas:', error);
    return response.status(500).json({ 
      error: error.message || 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Função para enviar email com SCs pendentes
async function enviarEmailPendentes(
  pendentes: any[],
  mesAtual: string,
  nomeMes: string,
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
  <title>SCs Pendentes - ${nomeMes}</title>
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
            <td align="center" style="background: #667eea; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; color: #ffffff;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 0.5px; font-family: sans-serif;">
                <img src="https://dashboard-ti-brmarinas.vercel.app/favicon.ico" alt="Logo" style="width: 46px; height: 46px; margin-right: 10px; vertical-align: middle; border-radius: 4px;">
                Dashboard TI | BR Marinas
              </h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">SCs Pendentes - ${nomeMes}</p>
            </td>
          </tr>

          <!-- Conteúdo (Grid Simulado com Tabelas) -->
          <tr>
            <td class="mobile-padding" style="padding: 20px;">
  `;





  if (pendentes && pendentes.length > 0) {
    // Organizar os pendentes em grupos de 3 para simular linhas
    const rows = [];
    for (let i = 0; i < pendentes.length; i += 3) {
      rows.push(pendentes.slice(i, i + 3));
    }

    rows.forEach((row, rowIndex) => {
      html += `
              <!-- Linha ${rowIndex + 1} de Cards -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
      `;

      row.forEach((item: any, colIndex: number) => {
        const servico = escapeHtml(item.apelido || 'N/A');
        const descricao = escapeHtml(item.descricao_padrao || item.match_texto || 'Sem descrição');
        const empresa = escapeHtml(item.match_empresa || 'N/A');

        html += `
                  <!-- Card ${colIndex + 1} -->
                  <td class="column" width="32%" valign="top" style="vertical-align: top;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #e9ecef; border-radius: 8px; background-color: #ffffff;">
                      <tr>
                        <td style="padding: 15px;">
                          <div style="font-size: 16px; font-weight: 600; color: #495057; margin-bottom: 8px;">📦 ${servico}</div>
                          <div style="font-size: 13px; color: #6c757d; line-height: 1.4; margin-bottom: 12px; min-height: 40px;">${descricao}</div>
                          <div style="font-size: 11px; color: #007bff; background: #e7f3ff; padding: 4px 8px; border-radius: 4px; display: inline-block;">
                            <span style="height: 8px; width: 8px; background-color: #dc3545; border-radius: 50%; display: inline-block; margin-right: 4px;"></span>
                            ${empresa}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
        `;

        // Adicionar espaçador se não for o último da linha
        if (colIndex < row.length - 1) {
          html += `
                  <!-- Espaçador -->
                  <td class="column" width="2%" style="font-size: 0; line-height: 0;">&nbsp;</td>
          `;
        }
      });

      // Preencher colunas vazias se a linha não tiver 3 cards
      while (row.length < 3) {
        html += `
                  <td class="column" width="32%" style="font-size: 0; line-height: 0;">&nbsp;</td>
        `;
        if (row.length < 2) {
          html += `
                  <td class="column" width="2%" style="font-size: 0; line-height: 0;">&nbsp;</td>
          `;
        }
        row.length++;
      }

      html += `
                </tr>
      `;

      // Adicionar espaçador vertical entre linhas (exceto na última)
      if (rowIndex < rows.length - 1) {
        html += `
                <!-- Spacer Vertical entre linhas -->
                <tr><td colspan="5" height="20">&nbsp;</td></tr>
        `;
      }

      html += `
              </table>
      `;
    });
  } else {
    // Caso não haja pendentes, mostrar mensagem de sucesso
    html += `
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 40px;">
                    <div style="font-size: 18px; color: #28a745; margin-bottom: 10px;">✅ Todas as SCs já foram lançadas!</div>
                    <div style="font-size: 14px; color: #6c757d;">Parabéns! Não há pendências este mês.</div>
                  </td>
                </tr>
              </table>
    `;
  }

  html += `
            </td>
          </tr>

          <!-- Rodapé -->
          <tr>
            <td align="center" style="background-color: #f8f9fa; padding: 20px; border-top: 1px solid #e9ecef; color: #adb5bd; font-size: 11px;">
              <p style="margin: 5px 0;">Este é um lembrete automático das SCs pendentes.</p>
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
    subject: `SCs Pendentes - ${nomeMes}`,
    html: html,
  });

  return response.status(200).json({
    success: true,
    message: 'Email com SCs pendentes enviado com sucesso!',
    quantidadePendentes: pendentes?.length || 0,
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
