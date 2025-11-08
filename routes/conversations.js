/**
 * AtenMed - Conversations Routes
 * Rotas para gerenciar conversas dos agentes
 */

const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Agent = require('../models/Agent');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// ===== MIDDLEWARE =====
router.use(authenticateToken);

// ===== LISTAR CONVERSAS =====
/**
 * @route   GET /api/conversations
 * @desc    Listar conversas com filtros
 * @access  Private
 */
router.get('/', async (req, res) => {
    try {
        const { 
            agentId, 
            status, 
            channel, 
            search, 
            startDate, 
            endDate,
            page = 1,
            limit = 20,
            sort = '-lastMessageAt'
        } = req.query;
        
        // Construir query
        let query = { clinic: req.clinicId };
        
        if (agentId) {
            query.agent = agentId;
        }
        
        if (status) {
            query.status = status;
        }
        
        if (channel) {
            query.channel = channel;
        }
        
        if (startDate || endDate) {
            query.lastMessageAt = {};
            if (startDate) {
                query.lastMessageAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.lastMessageAt.$lte = new Date(endDate);
            }
        }
        
        // Busca por texto
        if (search) {
            query.$or = [
                { userName: { $regex: search, $options: 'i' } },
                { userPhone: { $regex: search, $options: 'i' } },
                { userEmail: { $regex: search, $options: 'i' } },
                { 'messages.content': { $regex: search, $options: 'i' } }
            ];
        }
        
        // Paginação
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Buscar conversas
        const conversations = await Conversation.find(query)
            .populate('agent', 'name description')
            .populate('leadId', 'name email phone status')
            .sort(sort)
            .limit(parseInt(limit))
            .skip(skip);
        
        // Total
        const total = await Conversation.countDocuments(query);
        
        res.json({
            success: true,
            conversations,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
        
    } catch (error) {
        logger.error('Erro ao listar conversas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao listar conversas'
        });
    }
});

// ===== OBTER CONVERSA =====
/**
 * @route   GET /api/conversations/:id
 * @desc    Obter detalhes de uma conversa
 * @access  Private
 */
router.get('/:id', async (req, res) => {
    try {
        const conversation = await Conversation.findOne({
            _id: req.params.id,
            clinic: req.clinicId
        })
        .populate('agent', 'name description personality')
        .populate('leadId')
        .populate('handedOffTo', 'nome email');
        
        if (!conversation) {
            return res.status(404).json({
                success: false,
                error: 'Conversa não encontrada'
            });
        }
        
        res.json({
            success: true,
            conversation
        });
        
    } catch (error) {
        logger.error('Erro ao obter conversa:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao obter conversa'
        });
    }
});

// ===== TRANSFERIR PARA HUMANO =====
/**
 * @route   POST /api/conversations/:id/handoff
 * @desc    Transferir conversa para atendimento humano
 * @access  Private
 */
router.post('/:id/handoff', async (req, res) => {
    try {
        const { userId, message } = req.body;
        
        const conversation = await Conversation.findOne({
            _id: req.params.id,
            clinic: req.clinicId
        });
        
        if (!conversation) {
            return res.status(404).json({
                success: false,
                error: 'Conversa não encontrada'
            });
        }
        
        await conversation.handOff(userId || req.user._id);
        
        // Adicionar mensagem de transferência
        if (message) {
            conversation.messages.push({
                role: 'system',
                content: message,
                timestamp: new Date()
            });
            await conversation.save();
        }
        
        res.json({
            success: true,
            message: 'Conversa transferida para atendimento humano',
            conversation
        });
        
    } catch (error) {
        logger.error('Erro ao transferir conversa:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao transferir conversa'
        });
    }
});

// ===== ADICIONAR ANOTAÇÃO =====
/**
 * @route   POST /api/conversations/:id/notes
 * @desc    Adicionar anotação à conversa
 * @access  Private
 */
router.post('/:id/notes', async (req, res) => {
    try {
        const { note } = req.body;
        
        if (!note) {
            return res.status(400).json({
                success: false,
                error: 'Anotação é obrigatória'
            });
        }
        
        const conversation = await Conversation.findOne({
            _id: req.params.id,
            clinic: req.clinicId
        });
        
        if (!conversation) {
            return res.status(404).json({
                success: false,
                error: 'Conversa não encontrada'
            });
        }
        
        // Adicionar anotação como mensagem do sistema
        conversation.messages.push({
            role: 'system',
            content: `[ANOTAÇÃO] ${note}`,
            metadata: {
                type: 'note',
                createdBy: req.user._id,
                createdAt: new Date()
            },
            timestamp: new Date()
        });
        
        await conversation.save();
        
        res.json({
            success: true,
            message: 'Anotação adicionada com sucesso',
            conversation
        });
        
    } catch (error) {
        logger.error('Erro ao adicionar anotação:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao adicionar anotação'
        });
    }
});

// ===== ADICIONAR TAG =====
/**
 * @route   POST /api/conversations/:id/tags
 * @desc    Adicionar tag à conversa
 * @access  Private
 */
router.post('/:id/tags', async (req, res) => {
    try {
        const { tag } = req.body;
        
        if (!tag) {
            return res.status(400).json({
                success: false,
                error: 'Tag é obrigatória'
            });
        }
        
        const conversation = await Conversation.findOne({
            _id: req.params.id,
            clinic: req.clinicId
        });
        
        if (!conversation) {
            return res.status(404).json({
                success: false,
                error: 'Conversa não encontrada'
            });
        }
        
        // Adicionar tags ao modelo (precisa adicionar campo tags)
        if (!conversation.tags) {
            conversation.tags = [];
        }
        
        if (!conversation.tags.includes(tag)) {
            conversation.tags.push(tag);
            await conversation.save();
        }
        
        res.json({
            success: true,
            message: 'Tag adicionada com sucesso',
            conversation
        });
        
    } catch (error) {
        logger.error('Erro ao adicionar tag:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao adicionar tag'
        });
    }
});

// ===== ARQUIVAR CONVERSA =====
/**
 * @route   POST /api/conversations/:id/archive
 * @desc    Arquivar conversa
 * @access  Private
 */
router.post('/:id/archive', async (req, res) => {
    try {
        const conversation = await Conversation.findOne({
            _id: req.params.id,
            clinic: req.clinicId
        });
        
        if (!conversation) {
            return res.status(404).json({
                success: false,
                error: 'Conversa não encontrada'
            });
        }
        
        conversation.status = 'archived';
        await conversation.save();
        
        res.json({
            success: true,
            message: 'Conversa arquivada com sucesso',
            conversation
        });
        
    } catch (error) {
        logger.error('Erro ao arquivar conversa:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao arquivar conversa'
        });
    }
});

// ===== EXPORTAR CONVERSA =====
/**
 * @route   GET /api/conversations/:id/export
 * @desc    Exportar conversa (JSON ou TXT)
 * @access  Private
 */
router.get('/:id/export', async (req, res) => {
    try {
        const { format = 'json' } = req.query;
        
        const conversation = await Conversation.findOne({
            _id: req.params.id,
            clinic: req.clinicId
        })
        .populate('agent', 'name')
        .populate('leadId');
        
        if (!conversation) {
            return res.status(404).json({
                success: false,
                error: 'Conversa não encontrada'
            });
        }
        
        if (format === 'txt') {
            // Formato texto
            let text = `CONVERSA #${conversation._id}\n`;
            text += `Agente: ${conversation.agent?.name || 'N/A'}\n`;
            text += `Canal: ${conversation.channel}\n`;
            text += `Status: ${conversation.status}\n`;
            text += `Data: ${conversation.firstMessageAt}\n`;
            text += `\n--- MENSAGENS ---\n\n`;
            
            conversation.messages.forEach(msg => {
                const role = msg.role === 'user' ? 'Usuário' : 
                           msg.role === 'assistant' ? 'Agente' : 'Sistema';
                text += `[${role}] ${msg.content}\n`;
                text += `Data: ${msg.timestamp}\n\n`;
            });
            
            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Content-Disposition', `attachment; filename=conversa-${conversation._id}.txt`);
            return res.send(text);
        }
        
        // Formato JSON
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=conversa-${conversation._id}.json`);
        res.json(conversation);
        
    } catch (error) {
        logger.error('Erro ao exportar conversa:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao exportar conversa'
        });
    }
});

// ===== ESTATÍSTICAS DE CONVERSAS =====
/**
 * @route   GET /api/conversations/stats
 * @desc    Obter estatísticas de conversas
 * @access  Private
 */
router.get('/stats/overview', async (req, res) => {
    try {
        const { startDate, endDate, agentId } = req.query;
        
        let query = { clinic: req.clinicId };
        
        if (agentId) {
            query.agent = agentId;
        }
        
        if (startDate || endDate) {
            query.lastMessageAt = {};
            if (startDate) query.lastMessageAt.$gte = new Date(startDate);
            if (endDate) query.lastMessageAt.$lte = new Date(endDate);
        }
        
        const stats = await Conversation.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    active: {
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                    },
                    completed: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    abandoned: {
                        $sum: { $cond: [{ $eq: ['$status', 'abandoned'] }, 1, 0] }
                    },
                    handedOff: {
                        $sum: { $cond: [{ $eq: ['$status', 'handed_off'] }, 1, 0] }
                    },
                    totalMessages: {
                        $sum: { $size: '$messages' }
                    },
                    avgMessages: {
                        $avg: { $size: '$messages' }
                    },
                    leadsGenerated: {
                        $sum: { $cond: [{ $eq: ['$leadGenerated', true] }, 1, 0] }
                    }
                }
            }
        ]);
        
        res.json({
            success: true,
            stats: stats[0] || {
                total: 0,
                active: 0,
                completed: 0,
                abandoned: 0,
                handedOff: 0,
                totalMessages: 0,
                avgMessages: 0,
                leadsGenerated: 0
            }
        });
        
    } catch (error) {
        logger.error('Erro ao obter estatísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao obter estatísticas'
        });
    }
});

module.exports = router;

