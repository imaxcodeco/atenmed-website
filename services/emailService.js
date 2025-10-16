const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    async initializeTransporter() {
        try {
            this.transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.EMAIL_PORT) || 587,
                secure: false, // true para 465, false para outras portas
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            // Verificar conexão
            await this.transporter.verify();
            logger.info('📧 Serviço de email configurado com sucesso');
        } catch (error) {
            logger.error('Erro ao configurar serviço de email:', error);
        }
    }

    async sendEmail(options) {
        try {
            if (!this.transporter) {
                throw new Error('Transporter não configurado');
            }

            const mailOptions = {
                from: process.env.EMAIL_FROM || 'AtenMed <contato@atenmed.com.br>',
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text
            };

            if (options.cc) mailOptions.cc = options.cc;
            if (options.bcc) mailOptions.bcc = options.bcc;
            if (options.attachments) mailOptions.attachments = options.attachments;

            const result = await this.transporter.sendMail(mailOptions);
            
            logger.info('Email enviado com sucesso:', {
                to: options.to,
                subject: options.subject,
                messageId: result.messageId
            });

            return result;
        } catch (error) {
            logger.error('Erro ao enviar email:', error);
            throw error;
        }
    }

    // Template para confirmação de lead
    async sendLeadConfirmation(leadData) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Confirmação de Demonstração - AtenMed</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #45a7b1, #184354); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; background: #45a7b1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Demonstração Agendada!</h1>
                        <p>Olá ${leadData.nome}, obrigado pelo seu interesse na AtenMed!</p>
                    </div>
                    <div class="content">
                        <h2>Próximos Passos:</h2>
                        <ul>
                            <li>✅ Nossa equipe entrará em contato em até 2 horas úteis</li>
                            <li>📞 Ligaremos para o telefone: ${leadData.telefone}</li>
                            <li>📧 Também enviaremos informações por email</li>
                            <li>🎯 Prepararemos uma demonstração personalizada para sua especialidade: ${leadData.especialidade}</li>
                        </ul>
                        
                        <h3>O que você pode esperar:</h3>
                        <p>• Demonstração prática das nossas soluções<br>
                        • Análise personalizada das necessidades da sua clínica<br>
                        • Proposta comercial adaptada ao seu perfil<br>
                        • Suporte completo na implementação</p>
                        
                        <p><strong>Enquanto isso, que tal conhecer mais sobre nossos serviços?</strong></p>
                        <a href="https://atenmed.com.br/servicos" class="button">Ver Nossos Serviços</a>
                    </div>
                    <div class="footer">
                        <p>AtenMed - Organização Inteligente para Consultórios</p>
                        <p>📧 contato@atenmed.com.br | 📱 (11) 99999-9999</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.sendEmail({
            to: leadData.email,
            subject: '🎉 Demonstração Agendada - AtenMed',
            html: html,
            text: `Olá ${leadData.nome}, obrigado pelo seu interesse na AtenMed! Nossa equipe entrará em contato em até 2 horas úteis.`
        });
    }

    // Template para notificação interna de novo lead
    async sendNewLeadNotification(leadData) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Novo Lead - AtenMed</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #45a7b1; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
                    .lead-info { background: white; padding: 15px; border-radius: 5px; margin: 10px 0; }
                    .urgent { border-left: 4px solid #e74c3c; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🆕 Novo Lead Recebido</h1>
                    </div>
                    <div class="content">
                        <div class="lead-info">
                            <h3>Informações do Lead:</h3>
                            <p><strong>Nome:</strong> ${leadData.nome}</p>
                            <p><strong>Email:</strong> ${leadData.email}</p>
                            <p><strong>Telefone:</strong> ${leadData.telefone}</p>
                            <p><strong>Especialidade:</strong> ${leadData.especialidade}</p>
                            <p><strong>Interesse:</strong> ${leadData.interesse ? leadData.interesse.join(', ') : 'Não especificado'}</p>
                            <p><strong>Data:</strong> ${new Date(leadData.createdAt).toLocaleString('pt-BR')}</p>
                        </div>
                        
                        <p><strong>Ação Requerida:</strong> Entre em contato com o lead o mais rápido possível.</p>
                        
                        <p>📞 <strong>Telefone:</strong> ${leadData.telefone}<br>
                        📧 <strong>Email:</strong> ${leadData.email}</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.sendEmail({
            to: process.env.EMAIL_USER,
            subject: `🆕 Novo Lead: ${leadData.nome} - ${leadData.especialidade}`,
            html: html
        });
    }

    // Template para resposta a contato
    async sendContactResponse(contactData, response) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Resposta - AtenMed</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #45a7b1, #184354); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .response { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #45a7b1; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📧 Resposta ao seu contato</h1>
                        <p>Olá ${contactData.nome}, obrigado por entrar em contato conosco!</p>
                    </div>
                    <div class="content">
                        <div class="response">
                            <h3>Nossa Resposta:</h3>
                            <p>${response.conteudo}</p>
                        </div>
                        
                        <p>Se você tiver mais dúvidas, não hesite em nos contatar novamente.</p>
                        
                        <p><strong>Equipe AtenMed</strong><br>
                        📧 contato@atenmed.com.br<br>
                        📱 (11) 99999-9999</p>
                    </div>
                    <div class="footer">
                        <p>AtenMed - Organização Inteligente para Consultórios</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.sendEmail({
            to: contactData.email,
            subject: `Re: ${contactData.assunto} - AtenMed`,
            html: html
        });
    }

    // Template para notificação de contato urgente
    async sendUrgentContactNotification(contactData) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Contato Urgente - AtenMed</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #e74c3c; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
                    .urgent { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 10px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🚨 CONTATO URGENTE</h1>
                    </div>
                    <div class="content">
                        <div class="urgent">
                            <h3>⚠️ ATENÇÃO: Contato de alta prioridade recebido!</h3>
                        </div>
                        
                        <h3>Informações do Contato:</h3>
                        <p><strong>Nome:</strong> ${contactData.nome}</p>
                        <p><strong>Email:</strong> ${contactData.email}</p>
                        <p><strong>Telefone:</strong> ${contactData.telefone}</p>
                        <p><strong>Assunto:</strong> ${contactData.assunto}</p>
                        <p><strong>Mensagem:</strong> ${contactData.mensagem}</p>
                        <p><strong>Prioridade:</strong> ${contactData.prioridade}</p>
                        <p><strong>Data:</strong> ${new Date(contactData.createdAt).toLocaleString('pt-BR')}</p>
                        
                        <p><strong>🚨 AÇÃO IMEDIATA REQUERIDA!</strong></p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.sendEmail({
            to: process.env.EMAIL_USER,
            subject: `🚨 URGENTE: ${contactData.assunto} - ${contactData.nome}`,
            html: html
        });
    }

    // Template para relatório semanal
    async sendWeeklyReport(reportData) {
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Relatório Semanal - AtenMed</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #45a7b1, #184354); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .stats { display: flex; justify-content: space-around; margin: 20px 0; }
                    .stat { text-align: center; background: white; padding: 20px; border-radius: 10px; margin: 10px; }
                    .stat-number { font-size: 2em; font-weight: bold; color: #45a7b1; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📊 Relatório Semanal</h1>
                        <p>Período: ${reportData.periodo.inicio} a ${reportData.periodo.fim}</p>
                    </div>
                    <div class="content">
                        <div class="stats">
                            <div class="stat">
                                <div class="stat-number">${reportData.leads.total}</div>
                                <div>Novos Leads</div>
                            </div>
                            <div class="stat">
                                <div class="stat-number">${reportData.contatos.total}</div>
                                <div>Contatos</div>
                            </div>
                            <div class="stat">
                                <div class="stat-number">${reportData.leads.taxaConversao}%</div>
                                <div>Taxa de Conversão</div>
                            </div>
                        </div>
                        
                        <h3>📈 Resumo de Performance:</h3>
                        <ul>
                            <li>Leads convertidos: ${reportData.leads.convertidos}</li>
                            <li>Contatos respondidos: ${reportData.contatos.respondidos}</li>
                            <li>Tempo médio de resposta: ${reportData.contatos.tempoMedioResposta}h</li>
                        </ul>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.sendEmail({
            to: process.env.EMAIL_USER,
            subject: `📊 Relatório Semanal - ${new Date().toLocaleDateString('pt-BR')}`,
            html: html
        });
    }
}

module.exports = new EmailService();

