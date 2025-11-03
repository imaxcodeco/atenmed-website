/**
 * Serviço de Email - AWS SES
 * Gerencia envio de emails transacionais
 */

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Configuração do transporter
let transporter = null;

/**
 * Inicializar transporter
 */
function initializeTransporter() {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    logger.warn('⚠️  Email não configurado. Variáveis EMAIL_HOST e EMAIL_USER são necessárias.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // false para STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  logger.info('✅ Email transporter inicializado (AWS SES)');
  return transporter;
}

/**
 * Enviar email genérico
 */
async function sendEmail({ to, subject, text, html }) {
  try {
    if (!transporter) {
      transporter = initializeTransporter();
      if (!transporter) {
        throw new Error('Email não configurado');
      }
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'AtenMed <contato@atenmed.com.br>',
      to,
      subject,
      text,
      html,
    });

    logger.info(`📧 Email enviado: ${info.messageId} para ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`❌ Erro ao enviar email: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Email de boas-vindas
 */
async function sendWelcomeEmail(user) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4ca5b2; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .button { display: inline-block; background: #4ca5b2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { background: #083e51; color: white; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏥 Bem-vindo à AtenMed!</h1>
            </div>
            <div class="content">
                <h2>Olá, ${user.name}!</h2>
                <p>Estamos felizes em ter você conosco. Sua conta foi criada com sucesso!</p>
                <p>Com a AtenMed, você pode:</p>
                <ul>
                    <li>✅ Automatizar atendimentos via WhatsApp</li>
                    <li>✅ Gerenciar agendamentos inteligentes</li>
                    <li>✅ Acompanhar métricas e relatórios</li>
                </ul>
                <a href="https://atenmed.com.br/apps/admin/dashboard.html" class="button">Acessar Dashboard</a>
                <p><strong>Suas credenciais:</strong></p>
                <p>Email: ${user.email}</p>
                <p>⚠️ Por segurança, altere sua senha no primeiro acesso.</p>
            </div>
            <div class="footer">
                <p>AtenMed - Organização inteligente para consultórios modernos</p>
                <p>© ${new Date().getFullYear()} AtenMed. Todos os direitos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    `;

  return sendEmail({
    to: user.email,
    subject: '🏥 Bem-vindo à AtenMed!',
    html,
  });
}

/**
 * Email de boas-vindas para novo proprietário de clínica
 */
async function sendClinicOwnerWelcomeEmail({ clinic, user, password, publicUrl }) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f8fafc; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { background: #4ca5b2; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .credentials-box { background: #f0f9ff; border: 2px solid #4ca5b2; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .credentials-label { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 5px; }
            .credentials-value { font-size: 18px; color: #1e293b; font-weight: 600; font-family: monospace; }
            .button { display: inline-block; background: #4ca5b2; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; margin: 15px 0; font-weight: 600; }
            .button:hover { background: #3d8791; }
            .url-box { background: #f1f5f9; border-left: 4px solid #4ca5b2; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .url-box a { color: #4ca5b2; word-break: break-all; }
            .footer { background: #1e293b; color: white; padding: 20px; text-align: center; font-size: 12px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 14px; }
            .info-row { margin: 10px 0; padding: 10px; background: #f8fafc; border-radius: 4px; }
            .info-label { font-weight: 600; color: #475569; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; font-size: 28px;">🏥 Bem-vindo à AtenMed!</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.95;">Sua clínica está pronta!</p>
            </div>
            <div class="content">
                <h2 style="color: #1e293b; margin-top: 0;">Olá, ${user.nome || 'Proprietário'}!</h2>
                
                <p>Sua clínica <strong>${clinic.name}</strong> foi criada com sucesso na plataforma AtenMed! 🎉</p>
                
                <div class="warning">
                    <strong>⚠️ IMPORTANTE:</strong> Guarde esta mensagem com suas credenciais de acesso. 
                    Recomendamos alterar a senha após o primeiro login.
                </div>

                <div class="credentials-box">
                    <div style="margin-bottom: 15px;">
                        <div class="credentials-label">Email de Login</div>
                        <div class="credentials-value">${user.email}</div>
                    </div>
                    <div>
                        <div class="credentials-label">Senha Temporária</div>
                        <div class="credentials-value">${password}</div>
                    </div>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://atenmed.com.br/portal" class="button">🚀 Acessar Meu Portal</a>
                </div>

                <div class="url-box">
                    <strong style="color: #1e293b;">🌐 Sua Página Pública:</strong><br>
                    <a href="${publicUrl}" target="_blank">${publicUrl}</a>
                    <p style="margin: 10px 0 0 0; color: #64748b; font-size: 14px;">
                        Seus pacientes poderão agendar consultas através desta página.
                    </p>
                </div>

                <h3 style="color: #1e293b; margin-top: 30px;">📋 O que você pode fazer agora:</h3>
                <ul style="line-height: 2;">
                    <li>✅ Personalizar cores e logo da sua clínica</li>
                    <li>✅ Adicionar médicos e especialidades</li>
                    <li>✅ Configurar horários de funcionamento</li>
                    <li>✅ Visualizar agendamentos em tempo real</li>
                    <li>✅ Configurar automações do WhatsApp</li>
                </ul>

                <div style="background: #e0f2fe; border-left: 4px solid #0ea5e9; padding: 15px; margin: 30px 0; border-radius: 4px;">
                    <strong style="color: #0c4a6e;">💡 Precisa de ajuda?</strong>
                    <p style="margin: 10px 0 0 0; color: #0c4a6e;">
                        Nossa equipe está pronta para ajudar você a configurar tudo. Entre em contato:<br>
                        📧 <a href="mailto:suporte@atenmed.com.br" style="color: #0ea5e9;">suporte@atenmed.com.br</a>
                    </p>
                </div>
            </div>
            <div class="footer">
                <p style="margin: 0;">AtenMed - Organização inteligente para consultórios modernos</p>
                <p style="margin: 5px 0 0 0; opacity: 0.8;">© ${new Date().getFullYear()} AtenMed. Todos os direitos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    `;

  const text = `
Bem-vindo à AtenMed!

Olá, ${user.nome || 'Proprietário'}!

Sua clínica ${clinic.name} foi criada com sucesso!

CREDENCIAIS DE ACESSO:
- Email: ${user.email}
- Senha: ${password}
- Portal: https://atenmed.com.br/portal

PÁGINA PÚBLICA:
${publicUrl}

⚠️ IMPORTANTE: Guarde estas credenciais com segurança e altere a senha após o primeiro acesso.

Para suporte, entre em contato: suporte@atenmed.com.br

Atenciosamente,
Equipe AtenMed
    `;

  return sendEmail({
    to: user.email,
    subject: `🏥 Bem-vindo à AtenMed! Sua clínica ${clinic.name} está pronta!`,
    text,
    html,
  });
}

/**
 * Email de novo contato
 */
async function sendContactNotification(contact) {
  // Badge de prioridade
  const priorityColors = {
    baixa: '#10b981',
    media: '#f59e0b',
    alta: '#ef4444',
    urgente: '#dc2626',
  };
  const priorityColor = priorityColors[contact.prioridade] || '#6b7280';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f3f4f6; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #4ca5b2, #083e51); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .info-row { display: flex; padding: 12px 15px; margin: 8px 0; background: #f9fafb; border-left: 4px solid #4ca5b2; border-radius: 4px; }
            .info-label { font-weight: bold; color: #374151; min-width: 120px; }
            .info-value { color: #1f2937; flex: 1; }
            .message-box { background: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .priority-badge { display: inline-block; background: ${priorityColor}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
            .button { display: inline-block; background: #4ca5b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; font-size: 24px;">📧 Novo Contato Recebido</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Formulário do Site AtenMed</p>
            </div>
            <div class="content">
                <div style="text-align: center; margin-bottom: 20px;">
                    <span class="priority-badge">Prioridade: ${contact.prioridade}</span>
                </div>
                
                <h3 style="color: #083e51; margin-bottom: 20px;">📋 Informações do Contato</h3>
                
                <div class="info-row">
                    <div class="info-label">👤 Nome:</div>
                    <div class="info-value">${contact.name}</div>
                </div>
                
                <div class="info-row">
                    <div class="info-label">📧 Email:</div>
                    <div class="info-value"><a href="mailto:${contact.email}" style="color: #4ca5b2; text-decoration: none;">${contact.email}</a></div>
                </div>
                
                <div class="info-row">
                    <div class="info-label">📱 Telefone:</div>
                    <div class="info-value"><a href="tel:${contact.phone}" style="color: #4ca5b2; text-decoration: none;">${contact.phone || 'Não informado'}</a></div>
                </div>
                
                ${
                  contact.empresa
                    ? `
                <div class="info-row">
                    <div class="info-label">🏢 Empresa:</div>
                    <div class="info-value">${contact.empresa}</div>
                </div>
                `
                    : ''
                }
                
                <div class="info-row">
                    <div class="info-label">🏷️ Categoria:</div>
                    <div class="info-value" style="text-transform: capitalize;">${contact.categoria}</div>
                </div>
                
                <div class="info-row">
                    <div class="info-label">📌 Assunto:</div>
                    <div class="info-value"><strong>${contact.subject}</strong></div>
                </div>
                
                <div class="info-row">
                    <div class="info-label">📅 Data:</div>
                    <div class="info-value">${new Date(contact.createdAt).toLocaleString('pt-BR', {
                      dateStyle: 'long',
                      timeStyle: 'short',
                    })}</div>
                </div>
                
                <h3 style="color: #083e51; margin: 30px 0 15px 0;">💬 Mensagem</h3>
                <div class="message-box">
                    <p style="margin: 0; white-space: pre-wrap;">${contact.message}</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://atenmed.com.br/apps/admin/dashboard.html" class="button">📊 Ver na Dashboard</a>
                </div>
                
                <p style="margin-top: 30px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; font-size: 14px;">
                    <strong>⚡ Ação recomendada:</strong> Responda este contato nas próximas 24 horas para maximizar conversão!
                </p>
            </div>
            <div class="footer">
                <p style="margin: 0;">🤖 Este email foi gerado automaticamente pelo sistema AtenMed</p>
                <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} AtenMed. Todos os direitos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    `;

  return sendEmail({
    to: 'contato@atenmed.com.br',
    subject: `📧 Novo Contato: ${contact.name} - ${contact.subject}`,
    html,
  });
}

/**
 * Email de confirmação de agendamento
 */
async function sendAppointmentConfirmation(appointment) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4ca5b2, #083e51); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .appointment-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #4ca5b2; border-radius: 5px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
            .button-cancel { background: #ef4444; }
            .footer { background: #083e51; color: white; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Consulta Confirmada!</h1>
            </div>
            <div class="content">
                <p>Olá, <strong>${appointment.patientName}</strong>!</p>
                <p>Sua consulta foi confirmada com sucesso:</p>
                <div class="appointment-box">
                    <h3>📋 Detalhes da Consulta</h3>
                    <p><strong>📅 Data:</strong> ${new Date(appointment.date).toLocaleDateString('pt-BR')}</p>
                    <p><strong>🕐 Horário:</strong> ${appointment.time}</p>
                    <p><strong>👨‍⚕️ Médico:</strong> ${appointment.doctorName || 'A confirmar'}</p>
                    <p><strong>📍 Local:</strong> ${appointment.clinic || 'A confirmar'}</p>
                </div>
                <p>⚠️ <strong>Importante:</strong> Chegue com 15 minutos de antecedência.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://atenmed.com.br" class="button">Gerenciar Consulta</a>
                </div>
            </div>
            <div class="footer">
                <p>AtenMed - Organização inteligente para consultórios modernos</p>
                <p>© ${new Date().getFullYear()} AtenMed. Todos os direitos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    `;

  return sendEmail({
    to: appointment.patientEmail,
    subject: '✅ Consulta Confirmada - AtenMed',
    html,
  });
}

/**
 * Testar configuração de email
 */
async function testEmailConfiguration() {
  try {
    if (!transporter) {
      transporter = initializeTransporter();
      if (!transporter) {
        return { success: false, error: 'Email não configurado' };
      }
    }

    // Verificar conexão
    await transporter.verify();
    logger.info('✅ Configuração de email verificada com sucesso');

    // Enviar email de teste
    const result = await sendEmail({
      to: process.env.EMAIL_FROM || 'contato@atenmed.com.br',
      subject: '🧪 Teste de Configuração - AtenMed',
      html: `
                <h2>✅ Email Configurado com Sucesso!</h2>
                <p>Este é um email de teste do sistema AtenMed.</p>
                <p>Data/Hora: ${new Date().toLocaleString('pt-BR')}</p>
                <p>Servidor: ${process.env.EMAIL_HOST}</p>
            `,
    });

    return { success: true, ...result };
  } catch (error) {
    logger.error(`❌ Erro ao testar email: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Enviar email de confirmação para o lead recém cadastrado
 */
async function sendLeadConfirmation(lead) {
  const html = `
    <h2>Olá, ${lead.nome}!</h2>
    <p>Obrigado por entrar em contato com a AtenMed. Nossa equipe retornará em breve ✨</p>
    <p><strong>Resumo do seu pedido:</strong></p>
    <ul>
        <li>Email: ${lead.email}</li>
        <li>Telefone: ${lead.telefone}</li>
        <li>Especialidade: ${lead.especialidade || 'Não informada'}</li>
    </ul>
    <p>Enquanto isso, conheça mais sobre nossa solução em <a href="https://atenmed.com.br">atenmed.com.br</a>.</p>
    `;

  return sendEmail({
    to: lead.email,
    subject: '✅ Recebemos sua solicitação – AtenMed',
    html,
  });
}

/**
 * Notificar equipe interna sobre novo lead
 */
async function sendNewLeadNotification(lead) {
  const html = `
    <h2>Novo Lead no Site</h2>
    <ul>
        <li>Nome: ${lead.nome}</li>
        <li>Email: ${lead.email}</li>
        <li>Telefone: ${lead.telefone}</li>
        <li>Especialidade: ${lead.especialidade || 'Não informada'}</li>
        <li>Origem: ${lead.origem}</li>
        <li>Interesse: ${lead.interesse}</li>
    </ul>
    <a href="https://atenmed.com.br/apps/admin/dashboard.html">Ver na dashboard</a>
    `;

  return sendEmail({
    to: 'contato@atenmed.com.br',
    subject: `📢 Novo Lead – ${lead.nome}`,
    html,
  });
}

/**
 * Email de lembrete de fatura
 */
async function sendInvoiceReminder(invoice) {
  const daysUntilDue = Math.ceil((new Date(invoice.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysUntilDue < 0;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${isOverdue ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #f59e0b, #d97706)'}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .invoice-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #4ca5b2; border-radius: 5px; }
            .button { display: inline-block; background: #4ca5b2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { background: #083e51; color: white; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
            .alert { background: ${isOverdue ? '#fee2e2' : '#fef3c7'}; border-left: 4px solid ${isOverdue ? '#ef4444' : '#f59e0b'}; padding: 15px; margin: 20px 0; border-radius: 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${isOverdue ? '⚠️ Fatura Vencida' : '💰 Lembrete de Fatura'}</h1>
            </div>
            <div class="content">
                <p>Olá, <strong>${invoice.clinicName || 'Cliente'}</strong>!</p>
                ${
                  isOverdue
                    ? `<div class="alert">
                        <p><strong>⚠️ ATENÇÃO:</strong> Sua fatura está vencida há ${Math.abs(daysUntilDue)} dia(s).</p>
                        <p>É importante regularizar o pagamento para evitar suspensão dos serviços.</p>
                    </div>`
                    : `<p>Faltam <strong>${daysUntilDue} dia(s)</strong> para o vencimento da sua fatura.</p>`
                }
                <div class="invoice-box">
                    <h3>📋 Detalhes da Fatura</h3>
                    <p><strong>📄 Número:</strong> ${invoice.invoiceNumber || invoice._id}</p>
                    <p><strong>💰 Valor:</strong> R$ ${invoice.amount.toFixed(2)}</p>
                    <p><strong>📅 Vencimento:</strong> ${new Date(invoice.dueDate).toLocaleDateString('pt-BR')}</p>
                    <p><strong>📊 Status:</strong> ${invoice.status}</p>
                    ${invoice.description ? `<p><strong>📝 Descrição:</strong> ${invoice.description}</p>` : ''}
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://atenmed.com.br/portal" class="button">Ver Fatura Completa</a>
                </div>
                <p style="font-size: 12px; color: #6b7280; margin-top: 30px;">
                    Em caso de dúvidas, entre em contato conosco através do email contato@atenmed.com.br
                </p>
            </div>
            <div class="footer">
                <p>AtenMed - Organização inteligente para consultórios modernos</p>
                <p>© ${new Date().getFullYear()} AtenMed. Todos os direitos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    `;

  return sendEmail({
    to: invoice.clinicEmail || invoice.email,
    subject: isOverdue
      ? `⚠️ Fatura Vencida - R$ ${invoice.amount.toFixed(2)} - AtenMed`
      : `💰 Lembrete de Fatura - Vence em ${daysUntilDue} dia(s) - AtenMed`,
    html,
  });
}

/**
 * Email de notificação de inadimplência
 */
async function sendOverdueNotification(invoice, daysOverdue) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .alert-box { background: #fee2e2; border: 2px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .invoice-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444; border-radius: 5px; }
            .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { background: #083e51; color: white; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⚠️ Notificação de Inadimplência</h1>
            </div>
            <div class="content">
                <p>Olá, <strong>${invoice.clinicName || 'Cliente'}</strong>!</p>
                <div class="alert-box">
                    <h2 style="margin-top: 0; color: #dc2626;">⚠️ ATENÇÃO URGENTE</h2>
                    <p>Sua fatura está vencida há <strong>${daysOverdue} dia(s)</strong>.</p>
                    <p>Se o pagamento não for regularizado, os serviços podem ser suspensos.</p>
                </div>
                <div class="invoice-box">
                    <h3>📋 Detalhes da Fatura</h3>
                    <p><strong>📄 Número:</strong> ${invoice.invoiceNumber || invoice._id}</p>
                    <p><strong>💰 Valor:</strong> R$ ${invoice.amount.toFixed(2)}</p>
                    <p><strong>📅 Vencimento:</strong> ${new Date(invoice.dueDate).toLocaleDateString('pt-BR')}</p>
                    <p><strong>📊 Dias em atraso:</strong> ${daysOverdue}</p>
                </div>
                <p><strong>Como regularizar:</strong></p>
                <ol>
                    <li>Acesse o portal da clínica</li>
                    <li>Visualize a fatura pendente</li>
                    <li>Efetue o pagamento através dos métodos disponíveis</li>
                </ol>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://atenmed.com.br/portal" class="button">Acessar Portal e Pagar</a>
                </div>
                <p style="font-size: 12px; color: #6b7280; margin-top: 30px;">
                    Em caso de dúvidas ou problemas com o pagamento, entre em contato:<br>
                    📧 Email: contato@atenmed.com.br<br>
                    📱 WhatsApp: (22) 99284-2996
                </p>
            </div>
            <div class="footer">
                <p>AtenMed - Organização inteligente para consultórios modernos</p>
                <p>© ${new Date().getFullYear()} AtenMed. Todos os direitos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    `;

  return sendEmail({
    to: invoice.clinicEmail || invoice.email,
    subject: `⚠️ URGENTE: Fatura Vencida há ${daysOverdue} dia(s) - AtenMed`,
    html,
  });
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendClinicOwnerWelcomeEmail,
  sendContactNotification,
  sendAppointmentConfirmation,
  testEmailConfiguration,
  sendLeadConfirmation,
  sendNewLeadNotification,
  sendInvoiceReminder,
  sendOverdueNotification,
};
