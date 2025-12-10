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
    const diaHoje = dataHoje.getDate();
    const mesAtual = meses[dataHoje.getMonth()];
    const nomeMes = dataHoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    // Verificar se é dia 10 - se não for, não enviar email
    if (diaHoje !== 10) {
      return response.status(200).json({ 
        success: true, 
        message: `Não é dia 10. Email será enviado apenas no dia 10 de cada mês. Hoje é dia ${diaHoje}.`,
        skipped: true
      });
    }

    console.log(`📧 É dia 10! Enviando email com SCs pendentes para ${nomeMes}...`);

    // Buscar apenas despesas recorrentes PENDENTES (não marcadas)
    // Pendentes = valor do mês atual é null, undefined ou 0
    const { data: pendentes, error: errPendentes } = await supabase
      .from('despesas_ti')
      .select('*')
      .eq('tipo_despesa', 'Recorrente')
      .or(`${mesAtual}.is.null,${mesAtual}.eq.0`)
      .order('fornecedor');

    if (errPendentes) {
      console.error('Erro ao buscar despesas pendentes:', errPendentes);
      // Fallback: buscar todas e filtrar manualmente
      const { data: todasRecorrentes, error: errTodas } = await supabase
        .from('despesas_ti')
        .select('*')
        .eq('tipo_despesa', 'Recorrente')
        .order('fornecedor');

      if (errTodas) {
        throw errTodas;
      }

      // Filtrar manualmente as pendentes
      const pendentesFiltradas = (todasRecorrentes || []).filter((item: any) => {
        const valor = item[mesAtual];
        return valor === null || valor === undefined || valor === 0;
      });

      return await enviarEmailPendentes(pendentesFiltradas, mesAtual, nomeMes, emailUser, emailPass, emailTo, response);
    }

    return await enviarEmailPendentes(pendentes || [], mesAtual, nomeMes, emailUser, emailPass, emailTo, response);

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
  let totalPendente = 0;
  
  // Montar HTML do email
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        h2 { color: #d9534f; }
        h3 { border-bottom: 2px solid #d9534f; padding-bottom: 5px; color: #d9534f; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f8d7da; padding: 10px; text-align: left; font-weight: bold; }
        td { padding: 10px; border-bottom: 1px solid #eee; }
        .text-right { text-align: right; }
        .empresa { background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .alerta { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .total { text-align: right; margin-top: 30px; font-size: 1.3em; font-weight: bold; color: #d9534f; }
        .sem-pendentes { text-align: center; padding: 40px; color: #28a745; font-size: 1.2em; }
      </style>
    </head>
    <body>
      <h2>⚠️ Alerta: SCs Pendentes - ${nomeMes}</h2>
      <div class="alerta">
        <strong>📋 Atenção!</strong><br>
        As seguintes Solicitações de Compra (SCs) ainda <strong>NÃO foram lançadas</strong> este mês.
        Por favor, verifique o checklist e crie as SCs necessárias.
      </div>
  `;

  if (pendentes && pendentes.length > 0) {
    html += `
      <h3>📋 SCs Pendentes (${pendentes.length})</h3>
      <table>
        <tr>
          <th>Fornecedor</th>
          <th>Empresa</th>
          <th>Serviço</th>
          <th class="text-right">Valor Médio</th>
        </tr>
    `;

    pendentes.forEach((item: any) => {
      const valor = item.valor_medio || 0;
      totalPendente += valor;
      const empresa = item.empresa ? `<span class="empresa">${escapeHtml(item.empresa)}</span>` : '<span style="color: #999;">-</span>';
      
      html += `
        <tr>
          <td><strong>${escapeHtml(item.fornecedor || 'N/A')}</strong></td>
          <td>${empresa}</td>
          <td style="font-size: 12px;">${escapeHtml(item.desc_servico || 'N/A')}</td>
          <td class="text-right"><strong>${BRL(valor)}</strong></td>
        </tr>
      `;
    });

    html += `</table>`;
    html += `<div class="total">💰 Total Pendente: ${BRL(totalPendente)}</div>`;
  } else {
    html += `
      <div class="sem-pendentes">
        ✅ <strong>Parabéns!</strong><br>
        Todas as SCs do mês já foram lançadas!
      </div>
    `;
  }

  html += `
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #666; font-size: 12px;">
        Este é um email automático enviado no dia 10 de cada mês.<br>
        Para acessar o checklist, entre no sistema e vá em "Solicitações" > "Despesas T.I."
      </p>
    </body>
    </html>
  `;

  // Enviar Email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  await transporter.sendMail({
    from: `"Sistema Financeiro - Dashboard TI" <${emailUser}>`,
    to: emailTo,
    subject: `⚠️ [Dashboard TI] SCs Pendentes - ${nomeMes}`,
    html: html,
  });

  return response.status(200).json({ 
    success: true, 
    message: 'Email com SCs pendentes enviado com sucesso!',
    totalPendente: BRL(totalPendente),
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

