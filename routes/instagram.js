/**
 * AtenMed - Instagram Routes
 * Rotas para integração com Instagram
 */

const express = require('express');
const router = express.Router();
const instagramService = require('../services/instagramService');
const agentService = require('../services/agentService');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// ===== WEBHOOK VERIFICATION =====
/**
 * @route   GET /api/instagram/webhook
 * @desc    Verificação do webhook do Instagram
 * @access  Public
 */
router.get('/webhook', (req, res) => {
    try {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        
        const result = instagramService.verifyWebhook(mode, token, challenge);
        
        if (result) {
            return res.status(200).send(result);
        }
        
        return res.sendStatus(403);
        
    } catch (error) {
        logger.error('Erro na verificação do webhook Instagram:', error);
        res.sendStatus(500);
    }
});

// ===== WEBHOOK PARA MENSAGENS =====
/**
 * @route   POST /api/instagram/webhook
 * @desc    Receber mensagens do Instagram
 * @access  Public
 */
router.post('/webhook', express.json(), async (req, res) => {
    try {
        const data = instagramService.processWebhook(req.body);
        
        if (!data) {
            return res.sendStatus(200); // Instagram espera 200 mesmo sem processar
        }
        
        // Buscar agente que tem Instagram habilitado
        const Agent = require('../models/Agent');
        const agent = await Agent.findOne({
            'channels.instagram.enabled': true,
            active: true,
            status: 'active'
        });
        
        if (!agent) {
            logger.warn('Nenhum agente ativo com Instagram encontrado');
            return res.sendStatus(200);
        }
        
        // Processar mensagem através do agente
        const response = await agentService.processMessage(agent, data.message, {
            conversationId: null,
            userId: data.senderId,
            channel: 'instagram',
            clinicId: agent.clinic,
            userName: 'Usuário Instagram'
        });
        
        // Enviar resposta
        if (response && response.text) {
            await instagramService.sendMessage(data.senderId, response.text, agent._id);
        }
        
        res.sendStatus(200);
        
    } catch (error) {
        logger.error('Erro ao processar webhook Instagram:', error);
        res.sendStatus(200); // Sempre retornar 200 para Instagram
    }
});

// ===== CONFIGURAR INSTAGRAM (PRIVADO) =====
/**
 * @route   POST /api/instagram/connect
 * @desc    Configurar conexão Instagram
 * @access  Private
 */
router.post('/connect', authenticateToken, async (req, res) => {
    try {
        const { agentId, pageId, accessToken } = req.body;
        
        const Agent = require('../models/Agent');
        const agent = await Agent.findOne({
            _id: agentId,
            clinic: req.clinicId
        });
        
        if (!agent) {
            return res.status(404).json({
                success: false,
                error: 'Agente não encontrado'
            });
        }
        
        agent.channels.instagram.enabled = true;
        agent.channels.instagram.pageId = pageId;
        agent.channels.instagram.accessToken = accessToken;
        
        await agent.save();
        
        res.json({
            success: true,
            message: 'Instagram configurado com sucesso',
            agent
        });
        
    } catch (error) {
        logger.error('Erro ao configurar Instagram:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao configurar Instagram'
        });
    }
});

module.exports = router;

