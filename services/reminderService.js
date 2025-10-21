const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const logger = require('../utils/logger');
const emailService = require('./emailService');

/**
 * Serviço de Lembretes Automáticos
 * Envia notificações antes das consultas via Email, WhatsApp e SMS
 */
class ReminderService {
    constructor() {
        this.scheduledJobs = new Map();
        this.isRunning = false;
    }

    /**
     * Iniciar serviço de lembretes
     */
    start() {
        if (this.isRunning) {
            logger.warn('Reminder Service já está rodando');
            return;
        }

        logger.info('🔔 Iniciando Reminder Service...');

        // Executar a cada 15 minutos
        this.job = cron.schedule('*/15 * * * *', async () => {
            await this.processReminders();
        });

        this.isRunning = true;
        logger.info('✅ Reminder Service iniciado - executando a cada 15 minutos');
    }

    /**
     * Parar serviço de lembretes
     */
    stop() {
        if (this.job) {
            this.job.stop();
            this.isRunning = false;
            logger.info('🛑 Reminder Service parado');
        }
    }

    /**
     * Processar lembretes pendentes
     */
    async processReminders() {
        try {
            logger.info('🔍 Verificando lembretes pendentes...');

            const now = new Date();
            
            // Buscar consultas que precisam de lembretes
            const appointments = await Appointment.find({
                scheduledDate: {
                    $gte: now,
                    $lte: new Date(now.getTime() + 25 * 60 * 60 * 1000) // próximas 25 horas
                },
                status: { $in: ['pendente', 'confirmado'] }
            })
            .populate('doctor', 'name phone')
            .populate('specialty', 'name')
            .populate('clinic', 'name address contact');

            logger.info(`📊 ${appointments.length} consultas encontradas para verificar`);

            for (const appointment of appointments) {
                await this.checkAndSendReminders(appointment);
            }

            logger.info('✅ Verificação de lembretes concluída');

        } catch (error) {
            logger.error('❌ Erro ao processar lembretes:', error);
        }
    }

    /**
     * Verificar e enviar lembretes para um agendamento
     */
    async checkAndSendReminders(appointment) {
        try {
            const scheduledDateTime = appointment.scheduledDateTime;
            const now = new Date();
            const hoursUntil = (scheduledDateTime - now) / (1000 * 60 * 60);

            // Verificar se já enviou lembretes
            const reminders = appointment.confirmations.reminders || [];
            const sent24h = reminders.some(r => r.type === '24h' && r.status === 'enviado');
            const sent1h = reminders.some(r => r.type === '1h' && r.status === 'enviado');

            // Lembrete 24 horas antes
            if (hoursUntil <= 24 && hoursUntil > 23 && !sent24h) {
                await this.send24HourReminder(appointment);
            }

            // Lembrete 1 hora antes
            if (hoursUntil <= 1 && hoursUntil > 0.5 && !sent1h) {
                await this.send1HourReminder(appointment);
            }

        } catch (error) {
            logger.error(`Erro ao verificar lembretes para agendamento ${appointment._id}:`, error);
        }
    }

    /**
     * Enviar lembrete 24 horas antes
     */
    async send24HourReminder(appointment) {
        try {
            logger.info(`📧 Enviando lembrete 24h - Agendamento ${appointment._id}`);

            const message = this.generate24HourMessage(appointment);
            
            // Enviar email
            if (appointment.patient.email) {
                await this.sendEmailReminder(appointment, message, '24 horas antes');
            }

            // Enviar WhatsApp (se disponível)
            if (appointment.patient.phone) {
                await this.sendWhatsAppReminder(appointment, message);
            }

            // Registrar lembrete enviado
            await appointment.addReminder('24h', 'whatsapp', 'enviado');

            logger.info(`✅ Lembrete 24h enviado - ${appointment.patient.name}`);

        } catch (error) {
            logger.error('Erro ao enviar lembrete 24h:', error);
            await appointment.addReminder('24h', 'email', 'falhou');
        }
    }

    /**
     * Enviar lembrete 1 hora antes
     */
    async send1HourReminder(appointment) {
        try {
            logger.info(`📱 Enviando lembrete 1h - Agendamento ${appointment._id}`);

            const message = this.generate1HourMessage(appointment);
            
            // Enviar WhatsApp prioritariamente
            if (appointment.patient.phone) {
                await this.sendWhatsAppReminder(appointment, message);
            }

            // Enviar SMS como fallback
            // await this.sendSMSReminder(appointment, message);

            // Registrar lembrete enviado
            await appointment.addReminder('1h', 'whatsapp', 'enviado');

            logger.info(`✅ Lembrete 1h enviado - ${appointment.patient.name}`);

        } catch (error) {
            logger.error('Erro ao enviar lembrete 1h:', error);
            await appointment.addReminder('1h', 'whatsapp', 'falhou');
        }
    }

    /**
     * Gerar mensagem de lembrete 24 horas
     */
    generate24HourMessage(appointment) {
        const date = appointment.scheduledDate.toLocaleDateString('pt-BR');
        const time = appointment.scheduledTime;
        const doctor = appointment.doctor?.name || 'Médico';
        const specialty = appointment.specialty?.name || 'Consulta';
        const clinic = appointment.clinic?.name || 'Clínica';
        const address = appointment.clinic?.address 
            ? `${appointment.clinic.address.street}, ${appointment.clinic.address.number}`
            : '';

        return {
            subject: '🔔 Lembrete: Consulta amanhã',
            text: `
Olá ${appointment.patient.name}! 👋

Este é um lembrete da sua consulta marcada para AMANHÃ:

📅 Data: ${date}
🕐 Horário: ${time}
👨‍⚕️ Médico: ${doctor}
🏥 Especialidade: ${specialty}
📍 Local: ${clinic}
${address ? `Endereço: ${address}` : ''}

⚠️ IMPORTANTE:
• Chegue com 15 minutos de antecedência
• Traga documentos e exames anteriores
• Em caso de cancelamento, avise com antecedência

✅ Para CONFIRMAR sua presença, responda: SIM
❌ Para CANCELAR, responda: CANCELAR

Até amanhã!

---
AtenMed - Organização Inteligente para Consultórios
            `.trim(),
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #45a7b1;">🔔 Lembrete de Consulta</h2>
                    <p>Olá <strong>${appointment.patient.name}</strong>! 👋</p>
                    <p>Este é um lembrete da sua consulta marcada para <strong>AMANHÃ</strong>:</p>
                    
                    <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
                        <p style="margin: 10px 0;"><strong>📅 Data:</strong> ${date}</p>
                        <p style="margin: 10px 0;"><strong>🕐 Horário:</strong> ${time}</p>
                        <p style="margin: 10px 0;"><strong>👨‍⚕️ Médico:</strong> ${doctor}</p>
                        <p style="margin: 10px 0;"><strong>🏥 Especialidade:</strong> ${specialty}</p>
                        <p style="margin: 10px 0;"><strong>📍 Local:</strong> ${clinic}</p>
                        ${address ? `<p style="margin: 10px 0;"><strong>Endereço:</strong> ${address}</p>` : ''}
                    </div>
                    
                    <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>⚠️ IMPORTANTE:</strong></p>
                        <ul>
                            <li>Chegue com 15 minutos de antecedência</li>
                            <li>Traga documentos e exames anteriores</li>
                            <li>Em caso de cancelamento, avise com antecedência</li>
                        </ul>
                    </div>
                    
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.APP_URL || 'http://localhost:3000'}/confirmar/${appointment._id}" 
                           style="background: #45a7b1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            ✅ Confirmar Presença
                        </a>
                    </p>
                    
                    <p style="color: #64748b; font-size: 12px; text-align: center;">
                        AtenMed - Organização Inteligente para Consultórios
                    </p>
                </div>
            `
        };
    }

    /**
     * Gerar mensagem de lembrete 1 hora
     */
    generate1HourMessage(appointment) {
        const time = appointment.scheduledTime;
        const doctor = appointment.doctor?.name || 'Médico';
        const clinic = appointment.clinic?.name || 'Clínica';

        return {
            subject: '⏰ Sua consulta é em 1 hora!',
            text: `
Olá ${appointment.patient.name}! ⏰

Sua consulta é DAQUI A 1 HORA:

🕐 Horário: ${time}
👨‍⚕️ Médico: ${doctor}
📍 Local: ${clinic}

Não se atrase! Até já! 😊

---
AtenMed
            `.trim()
        };
    }

    /**
     * Enviar lembrete por email
     */
    async sendEmailReminder(appointment, message, timing) {
        try {
            await emailService.sendEmail({
                to: appointment.patient.email,
                subject: message.subject,
                text: message.text,
                html: message.html
            });

            logger.info(`✅ Email de lembrete (${timing}) enviado para ${appointment.patient.email}`);
            return true;

        } catch (error) {
            logger.error('Erro ao enviar email de lembrete:', error);
            return false;
        }
    }

    /**
     * Enviar lembrete por WhatsApp
     * @todo Implementar quando WhatsApp Business API estiver configurado
     */
    async sendWhatsAppReminder(appointment, message) {
        try {
            // Placeholder para integração futura com WhatsApp Business API
            logger.info(`📱 WhatsApp lembrete para ${appointment.patient.phone}: ${message.text.substring(0, 50)}...`);
            
            // TODO: Integrar com WhatsApp Business API
            // const whatsappService = require('./whatsappService');
            // await whatsappService.sendMessage(appointment.patient.phone, message.text);
            
            return true;

        } catch (error) {
            logger.error('Erro ao enviar WhatsApp:', error);
            return false;
        }
    }

    /**
     * Enviar lembrete por SMS
     * @todo Implementar com Twilio ou similar
     */
    async sendSMSReminder(appointment, message) {
        try {
            // Placeholder para integração futura com SMS
            logger.info(`📲 SMS lembrete para ${appointment.patient.phone}`);
            
            // TODO: Integrar com Twilio
            // const twilioService = require('./twilioService');
            // await twilioService.sendSMS(appointment.patient.phone, message.text);
            
            return true;

        } catch (error) {
            logger.error('Erro ao enviar SMS:', error);
            return false;
        }
    }

    /**
     * Enviar lembrete manual para um agendamento específico
     */
    async sendManualReminder(appointmentId, type = 'custom', customMessage = null) {
        try {
            const appointment = await Appointment.findById(appointmentId)
                .populate('doctor', 'name')
                .populate('specialty', 'name')
                .populate('clinic', 'name address');

            if (!appointment) {
                throw new Error('Agendamento não encontrado');
            }

            const message = customMessage || this.generate24HourMessage(appointment);

            // Enviar por todos os canais disponíveis
            const results = {
                email: false,
                whatsapp: false,
                sms: false
            };

            if (appointment.patient.email) {
                results.email = await this.sendEmailReminder(appointment, message, 'manual');
            }

            if (appointment.patient.phone) {
                results.whatsapp = await this.sendWhatsAppReminder(appointment, message);
            }

            // Registrar envio
            await appointment.addReminder(type, 'manual', 'enviado');

            logger.info(`✅ Lembrete manual enviado - Agendamento ${appointmentId}`);
            return results;

        } catch (error) {
            logger.error('Erro ao enviar lembrete manual:', error);
            throw error;
        }
    }

    /**
     * Obter estatísticas de lembretes
     */
    async getStats(startDate, endDate) {
        try {
            const appointments = await Appointment.find({
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            });

            const stats = {
                total: appointments.length,
                with24hReminder: 0,
                with1hReminder: 0,
                confirmed: 0,
                failed: 0
            };

            appointments.forEach(appt => {
                const reminders = appt.confirmations.reminders || [];
                
                if (reminders.some(r => r.type === '24h' && r.status === 'enviado')) {
                    stats.with24hReminder++;
                }
                
                if (reminders.some(r => r.type === '1h' && r.status === 'enviado')) {
                    stats.with1hReminder++;
                }
                
                if (appt.confirmations.patient?.confirmed) {
                    stats.confirmed++;
                }
                
                if (reminders.some(r => r.status === 'falhou')) {
                    stats.failed++;
                }
            });

            stats.confirmationRate = stats.total > 0 
                ? ((stats.confirmed / stats.total) * 100).toFixed(2) + '%'
                : '0%';

            return stats;

        } catch (error) {
            logger.error('Erro ao obter estatísticas de lembretes:', error);
            throw error;
        }
    }
}

// Criar instância singleton
const reminderService = new ReminderService();

module.exports = reminderService;

