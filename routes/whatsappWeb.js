/**
 * AtenMed - WhatsApp Web Routes (Não Oficial)
 * Rotas para integração via QR Code
 */

const express = require('express');
const router = express.Router();
const whatsappWebService = require('../services/whatsappWebService');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// ===== MIDDLEWARE =====
// Todas as rotas requerem autenticação
router.use(authenticateToken);

// ===== CONECTAR WHATSAPP (GERAR QR CODE) =====
/**
 * @route   POST /api/whatsapp-web/connect/:agentId
 * @desc    Conectar WhatsApp via QR Code
 * @access  Private
 */
router.post('/connect/:agentId', async (req, res) => {
    try {
        const { agentId } = req.params;
        const clinicId = req.clinicId;
        
        if (!clinicId) {
            return res.status(400).json({
                success: false,
                error: 'Clínica não identificada'
            });
        }
        
        // Verificar se agente existe e pertence à clínica
        const Agent = require('../models/Agent');
        const agent = await Agent.findOne({
            _id: agentId,
            clinic: clinicId
        });
        
        if (!agent) {
            return res.status(404).json({
                success: false,
                error: 'Agente não encontrado'
            });
        }
        
        // Criar cliente e obter QR Code
        const qrData = await whatsappWebService.getQRCode(agentId, clinicId);
        
        if (!qrData) {
            return res.status(500).json({
                success: false,
                error: 'Erro ao gerar QR Code'
            });
        }
        
        // Se já está conectado
        if (qrData.status === 'connected') {
            return res.json({
                success: true,
                connected: true,
                phoneNumber: qrData.phoneNumber,
                name: qrData.name
            });
        }
        
        // Retornar QR Code
        res.json({
            success: true,
            connected: false,
            qrImage: qrData.qrImage,
            qr: qrData.qr
        });
        
    } catch (error) {
        logger.error('Erro ao conectar WhatsApp:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro ao conectar WhatsApp'
        });
    }
});

// ===== VERIFICAR STATUS DA CONEXÃO =====
/**
 * @route   GET /api/whatsapp-web/status/:agentId
 * @desc    Verificar status da conexão WhatsApp
 * @access  Private
 */
router.get('/status/:agentId', async (req, res) => {
    try {
        const { agentId } = req.params;
        const clinicId = req.clinicId;
        
        const info = whatsappWebService.getConnectionInfo(agentId, clinicId);
        
        res.json({
            success: true,
            ...info
        });
        
    } catch (error) {
        logger.error('Erro ao verificar status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== OBTER QR CODE (POLLING) =====
/**
 * @route   GET /api/whatsapp-web/qr/:agentId
 * @desc    Obter QR Code atual (para polling)
 * @access  Private
 */
router.get('/qr/:agentId', async (req, res) => {
    try {
        const { agentId } = req.params;
        const clinicId = req.clinicId;
        
        const qrData = await whatsappWebService.getQRCode(agentId, clinicId);
        
        if (!qrData) {
            return res.json({
                success: false,
                status: 'generating'
            });
        }
        
        // Se conectado
        if (qrData.status === 'connected') {
            return res.json({
                success: true,
                connected: true,
                phoneNumber: qrData.phoneNumber,
                name: qrData.name
            });
        }
        
        // Retornar QR Code
        res.json({
            success: true,
            connected: false,
            qrImage: qrData.qrImage
        });
        
    } catch (error) {
        logger.error('Erro ao obter QR Code:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== DESCONECTAR WHATSAPP =====
/**
 * @route   POST /api/whatsapp-web/disconnect/:agentId
 * @desc    Desconectar WhatsApp
 * @access  Private
 */
router.post('/disconnect/:agentId', async (req, res) => {
    try {
        const { agentId } = req.params;
        const clinicId = req.clinicId;
        
        await whatsappWebService.disconnect(agentId, clinicId);
        
        res.json({
            success: true,
            message: 'WhatsApp desconectado com sucesso'
        });
        
    } catch (error) {
        logger.error('Erro ao desconectar WhatsApp:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== ENVIAR MENSAGEM DE TESTE =====
/**
 * @route   POST /api/whatsapp-web/test/:agentId
 * @desc    Enviar mensagem de teste
 * @access  Private
 */
router.post('/test/:agentId', async (req, res) => {
    try {
        const { agentId } = req.params;
        const { to, message } = req.body;
        const clinicId = req.clinicId;
        
        if (!to || !message) {
            return res.status(400).json({
                success: false,
                error: 'Número e mensagem são obrigatórios'
            });
        }
        
        const result = await whatsappWebService.sendMessage(agentId, clinicId, to, message);
        
        res.json({
            success: true,
            ...result
        });
        
    } catch (error) {
        logger.error('Erro ao enviar mensagem de teste:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;

