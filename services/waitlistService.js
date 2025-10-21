const cron = require('node-cron');
const Waitlist = require('../models/Waitlist');
const Appointment = require('../models/Appointment');
const logger = require('../utils/logger');
const emailService = require('./emailService');

/**
 * Serviço de Fila de Espera
 * Gerencia lista de espera e notifica pacientes quando horários ficam disponíveis
 */
class WaitlistService {
    constructor() {
        this.isRunning = false;
        this.job = null;
    }

    /**
     * Iniciar serviço
     */
    start() {
        if (this.isRunning) {
            logger.warn('Waitlist Service já está rodando');
            return;
        }

        logger.info('📋 Iniciando Waitlist Service...');

        // Executar a cada hora
        this.job = cron.schedule('0 * * * *', async () => {
            await this.processWaitlist();
            await this.cleanupExpired();
        });

        this.isRunning = true;
        logger.info('✅ Waitlist Service iniciado - executando a cada hora');
    }

    /**
     * Parar serviço
     */
    stop() {
        if (this.job) {
            this.job.stop();
            this.isRunning = false;
            logger.info('🛑 Waitlist Service parado');
        }
    }

    /**
     * Processar fila de espera
     */
    async processWaitlist() {
        try {
            logger.info('🔍 Processando fila de espera...');

            // Buscar cancelamentos recentes (últimas 2 horas)
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
            
            const recentCancellations = await Appointment.find({
                status: 'cancelado',
                canceledAt: { $gte: twoHoursAgo }
            }).populate('doctor specialty clinic');

            logger.info(`📊 ${recentCancellations.length} cancelamentos recentes encontrados`);

            for (const cancellation of recentCancellations) {
                await this.notifyWaitlist(cancellation);
            }

            // Atualizar posições na fila
            await Waitlist.updatePositions();

            logger.info('✅ Processamento da fila concluído');

        } catch (error) {
            logger.error('❌ Erro ao processar fila de espera:', error);
        }
    }

    /**
     * Notificar pessoas da fila quando horário fica disponível
     */
    async notifyWaitlist(cancellation) {
        try {
            const { doctor, specialty, clinic, scheduledDate, scheduledTime } = cancellation;

            // Buscar próximos da fila que correspondem
            const candidates = await Waitlist.getNext({
                specialty: specialty._id,
                $or: [
                    { doctor: doctor._id },
                    { doctor: { $exists: false } } // Aceita qualquer médico
                ]
            }, 5); // Notificar até 5 pessoas

            logger.info(`📢 ${candidates.length} candidatos encontrados para vaga liberada`);

            for (const candidate of candidates) {
                // Verificar se já foi notificado recentemente (evitar spam)
                if (candidate.lastNotificationAt) {
                    const hoursSinceLastNotification = 
                        (new Date() - candidate.lastNotificationAt) / (1000 * 60 * 60);
                    
                    if (hoursSinceLastNotification < 24) {
                        logger.info(`⏳ Candidato ${candidate._id} foi notificado há ${hoursSinceLastNotification.toFixed(1)}h, pulando...`);
                        continue;
                    }
                }

                // Enviar notificação
                await this.sendNotification(candidate, {
                    doctor: doctor.name,
                    specialty: specialty.name,
                    clinic: clinic.name,
                    date: scheduledDate.toLocaleDateString('pt-BR'),
                    time: scheduledTime
                });

                // Marcar como notificado
                await candidate.markAsNotified();

                logger.info(`✅ Notificação enviada para ${candidate.patient.name}`);

                // Limitar notificações para não sobrecarregar
                await this.sleep(2000); // 2 segundos entre notificações
            }

        } catch (error) {
            logger.error('Erro ao notificar fila de espera:', error);
        }
    }

    /**
     * Enviar notificação de vaga disponível
     */
    async sendNotification(waitlistEntry, slotInfo) {
        try {
            const message = this.generateNotificationMessage(waitlistEntry, slotInfo);

            // Enviar email
            if (waitlistEntry.patient.email) {
                await this.sendEmailNotification(waitlistEntry, message);
            }

            // Enviar WhatsApp
            if (waitlistEntry.patient.phone) {
                await this.sendWhatsAppNotification(waitlistEntry, message);
            }

            return true;

        } catch (error) {
            logger.error('Erro ao enviar notificação:', error);
            return false;
        }
    }

    /**
     * Gerar mensagem de notificação
     */
    generateNotificationMessage(waitlistEntry, slotInfo = null) {
        const name = waitlistEntry.patient.name;
        const specialty = waitlistEntry.specialty?.name || 'Consulta';

        if (slotInfo) {
            // Notificação de vaga específica
            return {
                subject: '🎉 Vaga Disponível!',
                text: `
Olá ${name}! 🎉

Temos uma ótima notícia! Uma vaga ficou disponível:

📅 Data: ${slotInfo.date}
🕐 Horário: ${slotInfo.time}
👨‍⚕️ Médico: ${slotInfo.doctor}
🏥 Especialidade: ${slotInfo.specialty}
📍 Local: ${slotInfo.clinic}

⚡ Esta vaga pode ser preenchida rapidamente!

Para AGENDAR, responda: QUERO
Para ver outras opções: OUTRAS

Aguardamos seu retorno!

---
AtenMed - Fila de Espera
                `.trim(),
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #10b981;">🎉 Vaga Disponível!</h2>
                        <p>Olá <strong>${name}</strong>!</p>
                        <p>Temos uma ótima notícia! Uma vaga ficou disponível:</p>
                        
                        <div style="background: #f0fdf4; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #10b981;">
                            <p style="margin: 10px 0;"><strong>📅 Data:</strong> ${slotInfo.date}</p>
                            <p style="margin: 10px 0;"><strong>🕐 Horário:</strong> ${slotInfo.time}</p>
                            <p style="margin: 10px 0;"><strong>👨‍⚕️ Médico:</strong> ${slotInfo.doctor}</p>
                            <p style="margin: 10px 0;"><strong>🏥 Especialidade:</strong> ${slotInfo.specialty}</p>
                            <p style="margin: 10px 0;"><strong>📍 Local:</strong> ${slotInfo.clinic}</p>
                        </div>
                        
                        <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p style="margin: 0;"><strong>⚡ Atenção:</strong> Esta vaga pode ser preenchida rapidamente!</p>
                        </div>
                        
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.APP_URL || 'http://localhost:3000'}/agendar-vaga/${waitlistEntry._id}" 
                               style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                ✅ Quero Esta Vaga
                            </a>
                        </p>
                        
                        <p style="color: #64748b; font-size: 12px; text-align: center;">
                            AtenMed - Sistema de Fila de Espera
                        </p>
                    </div>
                `
            };
        } else {
            // Notificação genérica
            return {
                subject: '📋 Você está na fila de espera',
                text: `
Olá ${name}!

Você está na lista de espera para ${specialty}.

Te avisaremos assim que surgirem vagas disponíveis!

Posição na fila: ${waitlistEntry.position || 'Verificando...'}

---
AtenMed
                `.trim()
            };
        }
    }

    /**
     * Enviar notificação por email
     */
    async sendEmailNotification(waitlistEntry, message) {
        try {
            await emailService.sendEmail({
                to: waitlistEntry.patient.email,
                subject: message.subject,
                text: message.text,
                html: message.html
            });

            logger.info(`✅ Email de fila de espera enviado para ${waitlistEntry.patient.email}`);
            return true;

        } catch (error) {
            logger.error('Erro ao enviar email de fila:', error);
            return false;
        }
    }

    /**
     * Enviar notificação por WhatsApp
     * @todo Implementar quando WhatsApp Business API estiver configurado
     */
    async sendWhatsAppNotification(waitlistEntry, message) {
        try {
            logger.info(`📱 WhatsApp fila de espera para ${waitlistEntry.patient.phone}`);
            
            // TODO: Integrar com WhatsApp Business API
            // const whatsappService = require('./whatsappService');
            // await whatsappService.sendMessage(waitlistEntry.patient.phone, message.text);
            
            return true;

        } catch (error) {
            logger.error('Erro ao enviar WhatsApp:', error);
            return false;
        }
    }

    /**
     * Adicionar à fila de espera
     */
    async addToWaitlist(data) {
        try {
            const waitlistEntry = new Waitlist({
                patient: {
                    name: data.patientName,
                    email: data.patientEmail,
                    phone: data.patientPhone
                },
                doctor: data.doctorId,
                specialty: data.specialtyId,
                clinic: data.clinicId,
                preferredDates: data.preferredDates,
                preferredTimes: data.preferredTimes,
                preferredPeriod: data.preferredPeriod,
                priority: data.priority || 'normal',
                urgencyReason: data.urgencyReason,
                notes: data.notes,
                source: data.source || 'whatsapp'
            });

            await waitlistEntry.save();

            // Atualizar posições
            await Waitlist.updatePositions(data.specialtyId, data.doctorId);

            logger.info(`✅ Paciente ${data.patientName} adicionado à fila de espera`);

            // Enviar confirmação
            await this.sendNotification(
                await Waitlist.findById(waitlistEntry._id).populate('specialty'),
                null
            );

            return waitlistEntry;

        } catch (error) {
            logger.error('Erro ao adicionar à fila:', error);
            throw error;
        }
    }

    /**
     * Converter entrada da fila em agendamento
     */
    async convertToAppointment(waitlistId, appointmentData) {
        try {
            const waitlistEntry = await Waitlist.findById(waitlistId);

            if (!waitlistEntry) {
                throw new Error('Entrada da fila não encontrada');
            }

            if (waitlistEntry.status !== 'ativa' && waitlistEntry.status !== 'notificada') {
                throw new Error('Entrada da fila não está ativa');
            }

            // Criar agendamento (usar a rota existente de appointments)
            const Appointment = require('../models/Appointment');
            const appointment = new Appointment({
                ...appointmentData,
                patient: waitlistEntry.patient,
                source: 'waitlist'
            });

            await appointment.save();

            // Atualizar entrada da fila
            await waitlistEntry.convertToAppointment(appointment._id);

            logger.info(`✅ Entrada da fila ${waitlistId} convertida em agendamento ${appointment._id}`);

            return appointment;

        } catch (error) {
            logger.error('Erro ao converter fila em agendamento:', error);
            throw error;
        }
    }

    /**
     * Limpar entradas expiradas
     */
    async cleanupExpired() {
        try {
            const count = await Waitlist.cleanupExpired();
            
            if (count > 0) {
                logger.info(`🧹 ${count} entradas expiradas removidas da fila`);
            }

            return count;

        } catch (error) {
            logger.error('Erro ao limpar fila:', error);
            return 0;
        }
    }

    /**
     * Obter estatísticas da fila
     */
    async getStats(filters = {}) {
        try {
            return await Waitlist.getStats(filters);
        } catch (error) {
            logger.error('Erro ao obter estatísticas da fila:', error);
            throw error;
        }
    }

    /**
     * Helper: sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Criar instância singleton
const waitlistService = new WaitlistService();

module.exports = waitlistService;

