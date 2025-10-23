/**
 * AtenMed - WhatsApp Business API Routes
 * Webhook endpoints para integração com WhatsApp
 */

const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');
const { authenticateToken, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

// ===== WEBHOOK VERIFICATION =====

/**
 * @route   GET /api/whatsapp/webhook
 * @desc    Verificação do webhook do WhatsApp Business API
 * @access  Public (verificado por token)
 */
router.get('/webhook', (req, res) => {
    try {
        // Parse URL diretamente para ignorar sanitização
        const url = require('url');
        const parsed = url.parse(req.originalUrl, true);
        const qs = parsed.query;
        const hub = qs.hub || {};

        const mode = qs['hub.mode'] || hub.mode || qs.mode;
        const token = qs['hub.verify_token'] || hub.verify_token || qs.token;
        const challenge = qs['hub.challenge'] || hub.challenge || qs.challenge;

        // LOG DETALHADO PARA DEBUG
        logger.info('📱 Tentativa de verificação de webhook WhatsApp');
        logger.info(`   Mode: ${mode}`);
        logger.info(`   Token recebido: ${token}`);
        logger.info(`   Token esperado: ${process.env.WHATSAPP_VERIFY_TOKEN}`);
        logger.info(`   Challenge: ${challenge}`);

        const result = whatsappService.verifyWebhook(mode, token, challenge);

        if (result) {
            logger.info('✅ Webhook verificado com sucesso');
            logger.info(`   Retornando challenge: ${result}`);
            return res.status(200).send(result);
        }

        logger.warn('❌ Falha na verificação do webhook');
        logger.warn(`   Mode: ${mode}, Token match: ${token === process.env.WHATSAPP_VERIFY_TOKEN}`);
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

// ===== DEBUG WEBHOOK =====

/**
 * @route   GET /api/whatsapp/debug-webhook
 * @desc    Debug do webhook - mostra configuração atual
 * @access  Private (Admin only)
 */
router.get('/debug-webhook', authenticateToken, authorize('admin'), (req, res) => {
    res.json({
        success: true,
        debug: {
            env_token: process.env.WHATSAPP_VERIFY_TOKEN || 'NÃO CONFIGURADO',
            env_token_length: (process.env.WHATSAPP_VERIFY_TOKEN || '').length,
            env_phone_id: process.env.WHATSAPP_PHONE_ID ? 'Configurado' : 'NÃO configurado',
            env_token_wpp: process.env.WHATSAPP_TOKEN ? 'Configurado' : 'NÃO configurado'
        }
    });
});

// ===== STATUS DA CONEXÃO =====

/**
 * @route   GET /api/whatsapp/status
 * @desc    Verificar status da conexão WhatsApp
 * @access  Private (Admin only)
 */
router.get('/status', authenticateToken, authorize('admin'), (req, res) => {
    try {
        const configured = !!(process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_TOKEN);
        
        res.json({
            success: true,
            configured,
            message: configured ? 
                'WhatsApp configurado e pronto' : 
                'WhatsApp não configurado. Adicione WHATSAPP_PHONE_ID e WHATSAPP_TOKEN'
        });
    } catch (error) {
        logger.error('Erro ao verificar status:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao verificar status'
        });
    }
});

// ===== CONFIGURAÇÃO =====

/**
 * @route   GET /api/whatsapp/config
 * @desc    Verificar configuração atual
 * @access  Private (Admin only)
 */
router.get('/config', authenticateToken, authorize('admin'), (req, res) => {
    try {
        const phoneId = process.env.WHATSAPP_PHONE_ID;
        const token = process.env.WHATSAPP_TOKEN;
        const apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
        
        const configured = !!(phoneId && token);
        
        res.json({
            success: true,
            configured,
            phoneId: phoneId ? `${phoneId.substring(0, 6)}...` : null,
            apiUrl: apiUrl,
            hasToken: !!token
        });
    } catch (error) {
        logger.error('Erro ao verificar configuração:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao verificar configuração'
        });
    }
});

// ===== ENVIAR MENSAGEM DE TESTE =====

/**
 * @route   POST /api/whatsapp/send-test
 * @desc    Enviar mensagem de teste
 * @access  Private (Admin only)
 */
router.post('/send-test', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const { phone, message } = req.body;
        
        if (!phone || !message) {
            return res.status(400).json({
                success: false,
                error: 'Telefone e mensagem são obrigatórios'
            });
        }
        
        // Verificar se está configurado
        if (!process.env.WHATSAPP_PHONE_ID || !process.env.WHATSAPP_TOKEN) {
            return res.status(503).json({
                success: false,
                error: 'WhatsApp não configurado. Configure WHATSAPP_PHONE_ID e WHATSAPP_TOKEN nas variáveis de ambiente.'
            });
        }
        
        // Remover caracteres não numéricos e validar formato
        const cleanPhone = phone.replace(/\D/g, '');
        
        logger.info(`📤 Enviando mensagem de teste para ${phone}`);
        
        const result = await whatsappService.sendMessage(cleanPhone, message);
        
        logger.info(`✅ Mensagem de teste enviada para ${phone}`);
        
        res.json({
            success: true,
            message: 'Mensagem enviada com sucesso',
            messageId: result?.messageId,
            phone: phone
        });
        
    } catch (error) {
        logger.error('Erro ao enviar mensagem de teste:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro ao enviar mensagem'
        });
    }
});

module.exports = router;

