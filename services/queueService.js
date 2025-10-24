const Bull = require('bull');
const logger = require('../utils/logger');

// Configuração do Redis
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
};

// Criar filas
const emailQueue = Bull('email-queue', {
    redis: redisConfig,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
    },
});

const notificationQueue = Bull('notification-queue', {
    redis: redisConfig,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
    },
});

const reminderQueue = Bull('reminder-queue', {
    redis: redisConfig,
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
    },
});

// Processar fila de emails
emailQueue.process(async (job) => {
    const { type, data } = job.data;
    logger.info(`📧 Processando email: ${type}`, { jobId: job.id });

    try {
        const emailService = require('./emailService');

        switch (type) {
            case 'contact-notification':
                await emailService.sendContactNotification(data);
                break;
            case 'lead-confirmation':
                await emailService.sendLeadConfirmation(data);
                break;
            case 'new-lead-notification':
                await emailService.sendNewLeadNotification(data);
                break;
            case 'appointment-confirmation':
                await emailService.sendAppointmentConfirmation(data);
                break;
            case 'appointment-reminder':
                await emailService.sendAppointmentReminder(data);
                break;
            default:
                logger.warn(`Tipo de email desconhecido: ${type}`);
        }

        logger.info(`✅ Email enviado com sucesso: ${type}`, { jobId: job.id });
        return { success: true, type };
    } catch (error) {
        logger.error(`❌ Erro ao enviar email: ${type}`, { error: error.message, jobId: job.id });
        throw error;
    }
});

// Processar fila de notificações WhatsApp
notificationQueue.process(async (job) => {
    const { type, data } = job.data;
    logger.info(`💬 Processando notificação WhatsApp: ${type}`, { jobId: job.id });

    try {
        const whatsappService = require('./whatsappService');

        switch (type) {
            case 'appointment-reminder':
                await whatsappService.sendAppointmentReminder(data);
                break;
            case 'confirmation':
                await whatsappService.sendConfirmation(data);
                break;
            default:
                logger.warn(`Tipo de notificação desconhecido: ${type}`);
        }

        logger.info(`✅ Notificação WhatsApp enviada: ${type}`, { jobId: job.id });
        return { success: true, type };
    } catch (error) {
        logger.error(`❌ Erro ao enviar notificação WhatsApp: ${type}`, { error: error.message, jobId: job.id });
        throw error;
    }
});

// Processar fila de lembretes
reminderQueue.process(async (job) => {
    const { type, data } = job.data;
    logger.info(`⏰ Processando lembrete: ${type}`, { jobId: job.id });

    try {
        const reminderService = require('./reminderService');
        await reminderService.processReminder(data);

        logger.info(`✅ Lembrete processado: ${type}`, { jobId: job.id });
        return { success: true, type };
    } catch (error) {
        logger.error(`❌ Erro ao processar lembrete: ${type}`, { error: error.message, jobId: job.id });
        throw error;
    }
});

// Event listeners para monitoramento
emailQueue.on('completed', (job, result) => {
    logger.info(`✅ Job de email completado: ${job.id}`, { result });
});

emailQueue.on('failed', (job, err) => {
    logger.error(`❌ Job de email falhou: ${job.id}`, { error: err.message });
});

notificationQueue.on('completed', (job, result) => {
    logger.info(`✅ Job de notificação completado: ${job.id}`, { result });
});

notificationQueue.on('failed', (job, err) => {
    logger.error(`❌ Job de notificação falhou: ${job.id}`, { error: err.message });
});

reminderQueue.on('completed', (job, result) => {
    logger.info(`✅ Job de lembrete completado: ${job.id}`, { result });
});

reminderQueue.on('failed', (job, err) => {
    logger.error(`❌ Job de lembrete falhou: ${job.id}`, { error: err.message });
});

// Funções auxiliares para adicionar jobs
const addEmailJob = async (type, data, options = {}) => {
    try {
        const job = await emailQueue.add({ type, data }, options);
        logger.info(`📧 Email job adicionado: ${type}`, { jobId: job.id });
        return job;
    } catch (error) {
        logger.error(`❌ Erro ao adicionar email job: ${type}`, { error: error.message });
        throw error;
    }
};

const addNotificationJob = async (type, data, options = {}) => {
    try {
        const job = await notificationQueue.add({ type, data }, options);
        logger.info(`💬 Notification job adicionado: ${type}`, { jobId: job.id });
        return job;
    } catch (error) {
        logger.error(`❌ Erro ao adicionar notification job: ${type}`, { error: error.message });
        throw error;
    }
};

const addReminderJob = async (type, data, delay) => {
    try {
        const job = await reminderQueue.add({ type, data }, { delay });
        logger.info(`⏰ Reminder job agendado: ${type}`, { jobId: job.id, delay });
        return job;
    } catch (error) {
        logger.error(`❌ Erro ao agendar reminder job: ${type}`, { error: error.message });
        throw error;
    }
};

// Função para obter estatísticas das filas
const getQueueStats = async () => {
    try {
        const [emailStats, notificationStats, reminderStats] = await Promise.all([
            emailQueue.getJobCounts(),
            notificationQueue.getJobCounts(),
            reminderQueue.getJobCounts(),
        ]);

        return {
            email: emailStats,
            notification: notificationStats,
            reminder: reminderStats,
        };
    } catch (error) {
        logger.error('Erro ao obter estatísticas das filas', { error: error.message });
        return null;
    }
};

// Graceful shutdown
const closeQueues = async () => {
    logger.info('🔄 Fechando filas...');
    await Promise.all([
        emailQueue.close(),
        notificationQueue.close(),
        reminderQueue.close(),
    ]);
    logger.info('✅ Filas fechadas com sucesso');
};

module.exports = {
    emailQueue,
    notificationQueue,
    reminderQueue,
    addEmailJob,
    addNotificationJob,
    addReminderJob,
    getQueueStats,
    closeQueues,
};

