/**
 * AtenMed - WhatsApp Business API Routes
 * Webhook endpoints para integração com WhatsApp
 */

const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');
const logger = require('../utils/logger');

// ===== WEBHOOK VERIFICATION =====

/**
 * @route   GET /api/whatsapp/webhook
 * @desc    Verificação do webhook do WhatsApp Business API
 * @access  Public (verificado por token)
 */
router.get('/webhook', (req, res) => {
    try {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        logger.info('📱 Tentativa de verificação de webhook WhatsApp');

        const result = whatsappService.verifyWebhook(mode, token, challenge);

        if (result) {
            logger.info('✅ Webhook verificado com sucesso');
            return res.status(200).send(result);
        }

        logger.warn('❌ Falha na verificação do webhook');
        return res.sendStatus(403);

    } catch (error) {
        logger.error('Erro na verificação do webhook:', error);
        res.sendStatus(500);
    }
});

// ===== WEBHOOK PARA MENSAGENS =====

/**
 * @route   POST /api/whatsapp/webhook
 * @desc    Receber mensagens do WhatsApp Business API
 * @access  Public (verificado pela Meta)
 */
router.post('/webhook', async (req, res) => {
    try {
        const body = req.body;

        // Verificar se é uma notificação do WhatsApp
        if (body.object !== 'whatsapp_business_account') {
            return res.sendStatus(404);
        }

        // Responder imediatamente (webhook deve responder em menos de 20s)
        res.sendStatus(200);

        // Processar mensagens
        for (const entry of body.entry) {
            for (const change of entry.changes) {
                if (change.value.messages) {
                    for (const message of change.value.messages) {
                        // Processar mensagem de forma assíncrona
                        whatsappService.handleIncomingMessage(message)
                            .catch(err => logger.error('Erro ao processar mensagem:', err));
                    }
                }

                // Processar status de mensagens enviadas
                if (change.value.statuses) {
                    for (const status of change.value.statuses) {
                        logger.info(`📬 Status de mensagem: ${status.id} - ${status.status}`);
                    }
                }
            }
        }

    } catch (error) {
        logger.error('Erro ao processar webhook:', error);
        res.sendStatus(500);
    }
});

// ===== ENVIAR MENSAGEM MANUAL =====

/**
 * @route   POST /api/whatsapp/send
 * @desc    Enviar mensagem manual (para testes ou admin)
 * @access  Admin
 */
router.post('/send', async (req, res) => {
    try {
        const { to, message } = req.body;

        if (!to || !message) {
            return res.status(400).json({
                success: false,
                message: 'Telefone e mensagem são obrigatórios'
            });
        }

        const result = await whatsappService.sendMessage(to, message);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        logger.error('Erro ao enviar mensagem:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao enviar mensagem',
            error: error.message
        });
    }
});

// ===== ESTATÍSTICAS =====

/**
 * @route   GET /api/whatsapp/stats
 * @desc    Retorna estatísticas de mensagens WhatsApp
 * @access  Admin
 */
router.get('/stats', async (req, res) => {
    try {
        const Appointment = require('../models/Appointment');

        const whatsappAppointments = await Appointment.countDocuments({
            source: 'whatsapp'
        });

        const whatsappConfirmed = await Appointment.countDocuments({
            source: 'whatsapp',
            'confirmations.patient.method': 'whatsapp'
        });

        res.json({
            success: true,
            data: {
                totalAppointments: whatsappAppointments,
                confirmedViaWhatsApp: whatsappConfirmed,
                confirmationRate: whatsappAppointments > 0 
                    ? ((whatsappConfirmed / whatsappAppointments) * 100).toFixed(1)
                    : 0
            }
        });

    } catch (error) {
        logger.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar estatísticas',
            error: error.message
        });
    }
});

// ===== HEALTH CHECK =====

/**
 * @route   GET /api/whatsapp/health
 * @desc    Verificar status da integração WhatsApp
 * @access  Public
 */
router.get('/health', (req, res) => {
    const isConfigured = !!(
        process.env.WHATSAPP_API_URL &&
        process.env.WHATSAPP_PHONE_ID &&
        process.env.WHATSAPP_TOKEN
    );
    
    const aiService = require('../services/aiService');
    const aiStats = aiService.getStats();

    res.json({
        success: true,
        status: isConfigured ? 'configured' : 'not_configured',
        message: isConfigured 
            ? 'WhatsApp Business API está configurado'
            : 'WhatsApp Business API não está configurado',
        ai: {
            enabled: aiStats.enabled,
            provider: aiStats.provider,
            successRate: aiStats.successRate
        }
    });
});

// ===== AI STATS =====

/**
 * @route   GET /api/whatsapp/ai-stats
 * @desc    Estatísticas da IA conversacional
 * @access  Admin
 */
router.get('/ai-stats', (req, res) => {
    const aiService = require('../services/aiService');
    const stats = aiService.getStats();
    
    res.json({
        success: true,
        data: stats
    });
});

module.exports = router;

