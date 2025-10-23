/**
 * Rotas de Teste
 * Para testar funcionalidades em desenvolvimento
 */

const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const logger = require('../utils/logger');
const { authenticateToken, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/test/email
 * @desc    Testar configuração de email
 * @access  Private/Admin
 */
router.get('/email', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        logger.info('🧪 Testando configuração de email...');

        const result = await emailService.testEmailConfiguration();

        if (result.success) {
            res.json({
                success: true,
                message: '✅ Email configurado e funcionando!',
                details: {
                    messageId: result.messageId,
                    host: process.env.EMAIL_HOST,
                    from: process.env.EMAIL_FROM
                }
            });
        } else {
            res.status(500).json({
                success: false,
                message: '❌ Falha ao enviar email de teste',
                error: result.error
            });
        }
    } catch (error) {
        logger.error(`❌ Erro no teste de email: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Erro ao testar email',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/test/email/send
 * @desc    Enviar email de teste personalizado
 * @access  Private/Admin
 */
router.post('/email/send', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const { to, subject, message } = req.body;

        if (!to || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Campos obrigatórios: to, subject, message'
            });
        }

        const result = await emailService.sendEmail({
            to,
            subject,
            html: `
                <h2>${subject}</h2>
                <p>${message}</p>
                <hr>
                <p><small>Email de teste enviado via AtenMed</small></p>
            `
        });

        if (result.success) {
            res.json({
                success: true,
                message: '✅ Email enviado com sucesso!',
                messageId: result.messageId
            });
        } else {
            res.status(500).json({
                success: false,
                message: '❌ Falha ao enviar email',
                error: result.error
            });
        }
    } catch (error) {
        logger.error(`❌ Erro ao enviar email: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Erro ao enviar email',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/test/config
 * @desc    Verificar configurações do sistema
 * @access  Private/Admin
 */
router.get('/config', authenticateToken, authorize('admin'), (req, res) => {
    res.json({
        success: true,
        environment: process.env.NODE_ENV,
        config: {
            mongodb: process.env.MONGODB_URI ? '✅ Configurado' : '❌ Não configurado',
            email: process.env.EMAIL_HOST ? '✅ Configurado' : '❌ Não configurado',
            whatsapp: process.env.WHATSAPP_TOKEN ? '✅ Configurado' : '❌ Não configurado',
            googleCalendar: process.env.GOOGLE_CLIENT_ID ? '✅ Configurado' : '❌ Não configurado',
            jwt: process.env.JWT_SECRET ? '✅ Configurado' : '❌ Não configurado'
        }
    });
});

/**
 * @route   GET /api/test/health
 * @desc    Health check detalhado
 * @access  Public
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: '1.0.0'
    });
});

module.exports = router;

