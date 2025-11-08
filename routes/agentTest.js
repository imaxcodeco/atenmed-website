/**
 * AtenMed - Agent Test Routes
 * Rotas para testar agentes antes de ativar
 */

const express = require('express');
const router = express.Router();
const agentService = require('../services/agentService');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// ===== MIDDLEWARE =====
router.use(authenticateToken);

// ===== TESTAR AGENTE =====
/**
 * @route   POST /api/agents/:id/test
 * @desc    Testar agente com mensagem
 * @access  Private
 */
router.post('/:id/test', async (req, res) => {
    try {
        const { message, conversationHistory = [] } = req.body;
        const { id } = req.params;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Mensagem é obrigatória'
            });
        }
        
        const Agent = require('../models/Agent');
        const agent = await Agent.findOne({
            _id: id,
            clinic: req.clinicId
        });
        
        if (!agent) {
            return res.status(404).json({
                success: false,
                error: 'Agente não encontrado'
            });
        }
        
        // Processar mensagem (sem salvar conversa)
        const response = await agentService.processMessage(agent, message, {
            conversationId: null,
            userId: 'test_user',
            channel: 'test',
            clinicId: req.clinicId,
            conversationHistory: conversationHistory
        });
        
        res.json({
            success: true,
            response: response.text,
            intent: response.intent,
            actions: response.actions || []
        });
        
    } catch (error) {
        logger.error('Erro ao testar agente:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao testar agente'
        });
    }
});

module.exports = router;

