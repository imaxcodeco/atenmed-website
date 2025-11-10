/**
 * AtenMed - Evolution API WhatsApp Routes
 * Rotas para webhook e gerenciamento da Evolution API
 */

const express = require('express');
const router = express.Router();
const whatsappEvolutionService = require('../services/whatsappEvolutionService');
const { authenticateToken, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

// ===== WEBHOOK =====

/**
 * @route   POST /api/whatsapp-evolution/webhook
 * @desc    Receber webhooks da Evolution API
 * @access  Public
 */
router.post('/webhook', express.json(), async (req, res) => {
    try {
        await whatsappEvolutionService.processWebhook(req.body);
        res.status(200).json({ success: true });
    } catch (error) {
        logger.error('Erro ao processar webhook Evolution API:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== GERENCIAMENTO DE INSTÂNCIA =====

/**
 * @route   GET /api/whatsapp-evolution/status
 * @desc    Obter status da instância
 * @access  Private
 */
router.get('/status', authenticateToken, async (req, res) => {
    try {
        const status = await whatsappEvolutionService.getInstanceStatus();
        res.json({
            success: true,
            status
        });
    } catch (error) {
        logger.error('Erro ao obter status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/whatsapp-evolution/qrcode
 * @desc    Obter QR Code para conectar
 * @access  Private
 */
router.get('/qrcode', authenticateToken, async (req, res) => {
    try {
        const qrcode = await whatsappEvolutionService.getQRCode();
        res.json({
            success: true,
            qrcode
        });
    } catch (error) {
        logger.error('Erro ao obter QR Code:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   POST /api/whatsapp-evolution/disconnect
 * @desc    Desconectar instância
 * @access  Private (Admin only)
 */
router.post('/disconnect', authenticateToken, authorize(['admin']), async (req, res) => {
    try {
        const result = await whatsappEvolutionService.disconnectInstance();
        res.json({
            success: result
        });
    } catch (error) {
        logger.error('Erro ao desconectar:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== ENVIAR MENSAGEM =====

/**
 * @route   POST /api/whatsapp-evolution/send
 * @desc    Enviar mensagem via Evolution API
 * @access  Private
 */
router.post('/send', authenticateToken, async (req, res) => {
    try {
        const { to, text } = req.body;

        if (!to || !text) {
            return res.status(400).json({
                success: false,
                error: 'Número e mensagem são obrigatórios'
            });
        }

        const result = await whatsappEvolutionService.sendMessage(to, text);
        res.json({
            success: true,
            result
        });
    } catch (error) {
        logger.error('Erro ao enviar mensagem:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;

