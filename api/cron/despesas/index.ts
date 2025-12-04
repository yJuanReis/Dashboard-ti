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
    const mesAtual = meses[dataHoje.getMonth()];

    // 2. Buscar Despesas Recorrentes
    const { data: recorrentes, error: err1 } = await supabase
      .from('despesas_ti')
      .select('*')
      .eq('tipo_despesa', 'Recorrente')
      .order('fornecedor');

    if (err1) {
      console.error('Erro ao buscar despesas recorrentes:', err1);
      throw err1;
    }

    // 3. Buscar Despesas Esporádicas do mês
    const { data: esporadicas, error: err2 } = await supabase
      .from('despesas_ti')
      .select('*')
      .eq('tipo_despesa', 'Esporadico')
      .gt(mesAtual, 0);

    if (err2) {
      console.error('Erro ao buscar despesas esporádicas:', err2);
      throw err2;
    }

    // 4. Montar Email (HTML)
    let totalEstimado = 0;
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
          h2 { color: #000; }
          h3 { border-bottom: 1px solid #ccc; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f4f4f4; padding: 8px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #eee; }
          .text-right { text-align: right; }
          .total { text-align: right; margin-top: 30px; font-size: 1.2em; font-weight: bold; }
          ul { list-style-type: disc; padding-left: 20px; }
        </style>
      </head>
      <body>
        <h2>📅 Lembrete de Despesas T.I. - Mês ${mesAtual.toUpperCase()}</h2>
        <h3>🔄 Recorrentes</h3>
        <table>
          <tr>
            <th>Fornecedor</th>
            <th>Serviço</th>
            <th class="text-right">Valor</th>
          </tr>
    `;

    if (recorrentes && recorrentes.length > 0) {
      recorrentes.forEach((item: any) => {
        const valor = item.valor_medio || 0;
        totalEstimado += valor;
        html += `
          <tr>
            <td>${escapeHtml(item.fornecedor || 'N/A')}</td>
            <td style="font-size: 12px;">${escapeHtml(item.desc_servico || 'N/A')}</td>
            <td class="text-right">${BRL(valor)}</td>
          </tr>
        `;
      });
    } else {
      html += `
        <tr>
          <td colspan="3" style="text-align: center; color: #999;">Nenhuma despesa recorrente encontrada</td>
        </tr>
      `;
    }

    html += `</table>`;

    if (esporadicas && esporadicas.length > 0) {
      html += `<h3 style="color: #d9534f; margin-top: 20px;">⚠️ Esporádicas Este Mês</h3><ul>`;
      esporadicas.forEach((e: any) => {
        // Tenta pegar o valor específico do mês, se não, usa a média
        const valorMes = e[mesAtual] || e.valor_medio || 0;
        totalEstimado += valorMes;
        html += `<li><b>${escapeHtml(e.fornecedor || 'N/A')}</b>: ${escapeHtml(e.desc_servico || 'N/A')} (${BRL(valorMes)})</li>`;
      });
      html += `</ul>`;
    }

    html += `
        <div class="total">Total Estimado: ${BRL(totalEstimado)}</div>
      </body>
      </html>
    `;

    // 5. Enviar Email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    await transporter.sendMail({
      from: `"Sistema Financeiro" <${emailUser}>`,
      to: emailTo,
      subject: `[Despesas T.I.] Previsão para ${mesAtual.toUpperCase()}`,
      html: html,
    });

    return response.status(200).json({ 
      success: true, 
      message: 'Email enviado com sucesso!',
      total: BRL(totalEstimado),
      recorrentes: recorrentes?.length || 0,
      esporadicas: esporadicas?.length || 0
    });

  } catch (error: any) {
    console.error('Erro ao processar cron de despesas:', error);
    return response.status(500).json({ 
      error: error.message || 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
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

