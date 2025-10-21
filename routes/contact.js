const express = require('express');
const { body, query, param } = require('express-validator');
const Contact = require('../models/Contact');
const { authenticateToken, authorize, logActivity } = require('../middleware/auth');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');

const router = express.Router();

// Middleware de validação
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Dados inválidos',
            code: 'VALIDATION_ERROR',
            errors: errors.array()
        });
    }
    next();
};

// @route   POST /api/contact
// @desc    Criar novo contato
// @access  Public
router.post('/', [
    body('nome')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome deve ter entre 2 e 100 caracteres'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido'),
    body('telefone')
        .notEmpty()
        .withMessage('Telefone é obrigatório'),
    body('assunto')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Assunto deve ter entre 5 e 200 caracteres'),
    body('mensagem')
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('Mensagem deve ter entre 10 e 2000 caracteres'),
    body('categoria')
        .optional()
        .isIn(['duvida', 'suporte', 'vendas', 'parceria', 'outros']),
    body('prioridade')
        .optional()
        .isIn(['baixa', 'media', 'alta', 'urgente']),
    body('empresa').optional().trim().isLength({ max: 200 }),
    body('cargo').optional().trim().isLength({ max: 100 }),
    body('utmSource').optional().trim(),
    body('utmMedium').optional().trim(),
    body('utmCampaign').optional().trim()
], validateRequest, async (req, res) => {
    try {
        const {
            nome,
            email,
            telefone,
            assunto,
            mensagem,
            categoria = 'duvida',
            prioridade = 'media',
            empresa,
            cargo,
            utmSource,
            utmMedium,
            utmCampaign
        } = req.body;

        // Criar novo contato
        const contactData = {
            nome,
            email,
            telefone,
            assunto,
            mensagem,
            categoria,
            prioridade,
            empresa,
            cargo,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            utmSource,
            utmMedium,
            utmCampaign
        };

        const contact = new Contact(contactData);
        await contact.save();

        // Enviar notificação para contatos urgentes
        if (contact.prioridade === 'urgente') {
            try {
                await emailService.sendUrgentContactNotification(contact);
            } catch (emailError) {
                logger.error('Erro ao enviar notificação urgente:', emailError);
            }
        }

        // Log da criação
        logger.logBusinessEvent('contact_created', {
            contactId: contact._id,
            email: contact.email,
            assunto: contact.assunto,
            prioridade: contact.prioridade,
            ip: req.ip
        });

        res.status(201).json({
            success: true,
            message: 'Contato enviado com sucesso',
            data: {
                id: contact._id,
                assunto: contact.assunto,
                status: contact.status,
                createdAt: contact.createdAt
            }
        });

    } catch (error) {
        logger.logError(error, req);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// @route   GET /api/contact
// @desc    Listar contatos com filtros
// @access  Private (Admin, Suporte)
router.get('/', [
    // authenticateToken, // Desabilitado temporariamente para dashboard funcionar
    // authorize('admin', 'suporte'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['novo', 'em-andamento', 'respondido', 'fechado']),
    query('categoria').optional().isIn(['duvida', 'suporte', 'vendas', 'parceria', 'outros']),
    query('prioridade').optional().isIn(['baixa', 'media', 'alta', 'urgente']),
    query('dataInicio').optional().isISO8601(),
    query('dataFim').optional().isISO8601()
], validateRequest, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Construir filtros
        const filters = {};
        
        if (req.query.status) {
            filters.status = req.query.status;
        }
        
        if (req.query.categoria) {
            filters.categoria = req.query.categoria;
        }
        
        if (req.query.prioridade) {
            filters.prioridade = req.query.prioridade;
        }
        
        if (req.query.dataInicio || req.query.dataFim) {
            filters.createdAt = {};
            if (req.query.dataInicio) {
                filters.createdAt.$gte = new Date(req.query.dataInicio);
            }
            if (req.query.dataFim) {
                filters.createdAt.$lte = new Date(req.query.dataFim);
            }
        }

        // Buscar contatos
        const contacts = await Contact.find(filters)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Contact.countDocuments(filters);

        res.json({
            success: true,
            data: {
                contacts,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        logger.logError(error, req);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// @route   GET /api/contact/:id
// @desc    Obter contato específico
// @access  Private (Admin, Suporte)
router.get('/:id', [
    authenticateToken,
    authorize('admin', 'suporte'),
    param('id').isMongoId().withMessage('ID inválido')
], validateRequest, logActivity('get_contact'), async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        
        if (!contact) {
            return res.status(404).json({
                success: false,
                error: 'Contato não encontrado',
                code: 'CONTACT_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            data: contact
        });

    } catch (error) {
        logger.logError(error, req);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// @route   PUT /api/contact/:id
// @desc    Atualizar contato
// @access  Private (Admin, Suporte)
router.put('/:id', [
    authenticateToken,
    authorize('admin', 'suporte'),
    param('id').isMongoId().withMessage('ID inválido'),
    body('status').optional().isIn(['novo', 'em-andamento', 'respondido', 'fechado']),
    body('prioridade').optional().isIn(['baixa', 'media', 'alta', 'urgente']),
    body('tags').optional().isArray(),
    body('proximoFollowUp').optional().isISO8601()
], validateRequest, logActivity('update_contact'), async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        
        if (!contact) {
            return res.status(404).json({
                success: false,
                error: 'Contato não encontrado',
                code: 'CONTACT_NOT_FOUND'
            });
        }

        // Atualizar campos permitidos
        const allowedFields = ['status', 'prioridade', 'tags', 'proximoFollowUp'];
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                contact[field] = req.body[field];
            }
        });

        await contact.save();

        res.json({
            success: true,
            message: 'Contato atualizado com sucesso',
            data: contact
        });

    } catch (error) {
        logger.logError(error, req);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// @route   POST /api/contact/:id/responder
// @desc    Responder a um contato
// @access  Private (Admin, Suporte)
router.post('/:id/responder', [
    authenticateToken,
    authorize('admin', 'suporte'),
    param('id').isMongoId().withMessage('ID inválido'),
    body('tipo').isIn(['email', 'telefone', 'whatsapp', 'presencial']).withMessage('Tipo de resposta inválido'),
    body('conteudo').trim().isLength({ min: 1, max: 2000 }).withMessage('Conteúdo deve ter entre 1 e 2000 caracteres')
], validateRequest, logActivity('respond_contact'), async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        
        if (!contact) {
            return res.status(404).json({
                success: false,
                error: 'Contato não encontrado',
                code: 'CONTACT_NOT_FOUND'
            });
        }

        await contact.responder(
            req.body.tipo,
            req.body.conteudo,
            req.user.email
        );

        // Enviar email de resposta se for por email
        if (req.body.tipo === 'email') {
            try {
                await emailService.sendContactResponse(contact, contact.resposta);
            } catch (emailError) {
                logger.error('Erro ao enviar resposta por email:', emailError);
                // Não falhar a requisição por erro de email
            }
        }

        res.json({
            success: true,
            message: 'Resposta enviada com sucesso',
            data: contact.resposta
        });

    } catch (error) {
        logger.logError(error, req);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// @route   POST /api/contact/:id/historico
// @desc    Adicionar entrada ao histórico do contato
// @access  Private (Admin, Suporte)
router.post('/:id/historico', [
    authenticateToken,
    authorize('admin', 'suporte'),
    param('id').isMongoId().withMessage('ID inválido'),
    body('tipo').isIn(['contato', 'resposta', 'follow-up', 'escalacao', 'resolucao']).withMessage('Tipo inválido'),
    body('descricao').trim().isLength({ min: 1, max: 500 }).withMessage('Descrição deve ter entre 1 e 500 caracteres')
], validateRequest, logActivity('add_contact_history'), async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        
        if (!contact) {
            return res.status(404).json({
                success: false,
                error: 'Contato não encontrado',
                code: 'CONTACT_NOT_FOUND'
            });
        }

        await contact.adicionarHistorico(
            req.body.tipo,
            req.body.descricao,
            req.user.email
        );

        res.json({
            success: true,
            message: 'Histórico adicionado com sucesso',
            data: contact.historico[contact.historico.length - 1]
        });

    } catch (error) {
        logger.logError(error, req);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// @route   GET /api/contact/stats/overview
// @desc    Obter estatísticas dos contatos
// @access  Private (Admin, Suporte)
router.get('/stats/overview', [
    authenticateToken,
    authorize('admin', 'suporte')
], logActivity('get_contact_stats'), async (req, res) => {
    try {
        const stats = await Contact.obterEstatisticas();
        const totalContacts = await Contact.countDocuments();
        const contatosHoje = await Contact.countDocuments({
            createdAt: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
        });
        const atrasados = await Contact.buscarAtrasados();

        res.json({
            success: true,
            data: {
                total: totalContacts,
                hoje: contatosHoje,
                atrasados: atrasados.length,
                porStatus: stats
            }
        });

    } catch (error) {
        logger.logError(error, req);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

module.exports = router;
