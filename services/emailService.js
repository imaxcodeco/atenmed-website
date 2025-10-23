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
            pass: process.env.EMAIL_PASS
        }
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
            html
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
            .header { background: linear-gradient(135deg, #4ca5b2, #083e51); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
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
        html
    });
}

/**
 * Email de novo contato
 */
async function sendContactNotification(contact) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            .header { background: #4ca5b2; color: white; padding: 20px; text-align: center; }
            .content { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .info { background: #f0f0f0; padding: 15px; margin: 10px 0; border-left: 4px solid #4ca5b2; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>📧 Novo Contato Recebido</h2>
            </div>
            <div class="content">
                <h3>Informações do Contato:</h3>
                <div class="info">
                    <p><strong>Nome:</strong> ${contact.name}</p>
                    <p><strong>Email:</strong> ${contact.email}</p>
                    <p><strong>Telefone:</strong> ${contact.phone || 'Não informado'}</p>
                    <p><strong>Mensagem:</strong></p>
                    <p>${contact.message}</p>
                    <p><strong>Data:</strong> ${new Date(contact.createdAt).toLocaleString('pt-BR')}</p>
                </div>
                <p>Responda o mais breve possível!</p>
            </div>
        </div>
    </body>
    </html>
    `;

    return sendEmail({
        to: 'contato@atenmed.com.br',
        subject: `📧 Novo Contato: ${contact.name}`,
        html
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
        html
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
            `
        });

        return { success: true, ...result };
    } catch (error) {
        logger.error(`❌ Erro ao testar email: ${error.message}`);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendEmail,
    sendWelcomeEmail,
    sendContactNotification,
    sendAppointmentConfirmation,
    testEmailConfiguration
};
