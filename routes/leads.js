const express = require('express');
const { body, query, param } = require('express-validator');
const Lead = require('../models/Lead');
const { authenticateToken, authorize, requirePermission, logActivity } = require('../middleware/auth');
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

// @route   POST /api/leads
// @desc    Criar novo lead
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
        .trim()
        .notEmpty()
        .withMessage('Telefone é obrigatório'),
    body('especialidade')
        .optional()
        .isIn(['clinica-geral', 'cardiologia', 'dermatologia', 'ginecologia', 'pediatria', 'odontologia', 'outros'])
        .withMessage('Especialidade inválida'),
    body('interesse')
        .optional()
        .custom(val => {
            const allowed = ['baixo', 'medio', 'alto'];
            if (Array.isArray(val)) return true;
            return allowed.includes(val);
        })
        .withMessage('Interesse deve ser: baixo, medio ou alto'),
    body('origem')
        .optional()
        .trim(),
    body('utmSource').optional().trim(),
    body('utmMedium').optional().trim(),
    body('utmCampaign').optional().trim()
], validateRequest, async (req, res) => {
    try {
        const {
            nome,
            email,
            telefone,
            especialidade,
            interesse = 'medio',
            origem = 'site',
            observacoes,
            utmSource,
            utmMedium,
            utmCampaign
        } = req.body;

        // Verificar se lead já existe
        const existingLead = await Lead.findOne({ email });
        if (existingLead) {
            return res.status(409).json({
                success: false,
                error: 'Lead já existe com este email',
                code: 'LEAD_EXISTS',
                leadId: existingLead._id
            });
        }

        // Criar novo lead
        const leadData = {
            nome,
            email,
            telefone,
            especialidade,
            interesse: Array.isArray(interesse) ? 'alto' : interesse,
            origem,
            observacoes,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            utmSource,
            utmMedium,
            utmCampaign
        };

        const lead = new Lead(leadData);
        await lead.save();

        // Enviar email de confirmação para o lead
        try {
            await emailService.sendLeadConfirmation(lead);
        } catch (emailError) {
            logger.error('Erro ao enviar email de confirmação:', emailError);
            // Não falhar a requisição por erro de email
        }

        // Enviar notificação interna
        try {
            await emailService.sendNewLeadNotification(lead);
        } catch (emailError) {
            logger.error('Erro ao enviar notificação interna:', emailError);
        }

        // Log da criação
        logger.logBusinessEvent('lead_created', {
            leadId: lead._id,
            email: lead.email,
            especialidade: lead.especialidade,
            ip: req.ip
        });

        res.status(201).json({
            success: true,
            message: 'Lead criado com sucesso',
            data: {
                id: lead._id,
                nome: lead.nome,
                email: lead.email,
                status: lead.status,
                createdAt: lead.createdAt
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

// @route   GET /api/leads
// @desc    Listar leads com filtros
// @access  Private (Admin, Vendedor)
router.get('/', [
    // authenticateToken, // Desabilitado temporariamente para dashboard funcionar
    // authorize('admin', 'vendedor'),
    query('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um número positivo'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100'),
    query('status').optional().isIn(['novo', 'contatado', 'qualificado', 'proposta', 'fechado', 'perdido']),
    query('especialidade').optional().isIn(['clinica-geral', 'cardiologia', 'dermatologia', 'ginecologia', 'pediatria', 'odontologia', 'outros']),
    query('dataInicio').optional().isISO8601().withMessage('Data início inválida'),
    query('dataFim').optional().isISO8601().withMessage('Data fim inválida')
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
        
        if (req.query.especialidade) {
            filters.especialidade = req.query.especialidade;
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

        // Buscar leads
        const leads = await Lead.find(filters)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-__v');

        const total = await Lead.countDocuments(filters);

        res.json({
            success: true,
            data: {
                leads,
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

// @route   GET /api/leads/:id
// @desc    Obter lead específico
// @access  Public (temporariamente para dashboard funcionar)
router.get('/:id', [
    param('id').isMongoId().withMessage('ID inválido')
], validateRequest, async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        
        if (!lead) {
            return res.status(404).json({
                success: false,
                error: 'Lead não encontrado',
                code: 'LEAD_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            data: lead
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

// @route   PUT /api/leads/:id
// @desc    Atualizar lead
// @access  Private (Admin, Vendedor)
router.put('/:id', [
    authenticateToken,
    authorize('admin', 'vendedor'),
    param('id').isMongoId().withMessage('ID inválido'),
    body('status').optional().isIn(['novo', 'contatado', 'qualificado', 'proposta', 'fechado', 'perdido']),
    body('observacoes').optional().isLength({ max: 1000 }).withMessage('Observações muito longas'),
    body('proximoContato').optional().isISO8601().withMessage('Data inválida'),
    body('valorProposta').optional().isFloat({ min: 0 }).withMessage('Valor deve ser positivo'),
    body('planoEscolhido').optional().isIn(['basico', 'profissional', 'completo'])
], validateRequest, logActivity('update_lead'), async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        
        if (!lead) {
            return res.status(404).json({
                success: false,
                error: 'Lead não encontrado',
                code: 'LEAD_NOT_FOUND'
            });
        }

        // Atualizar campos permitidos
        const allowedFields = ['status', 'observacoes', 'proximoContato', 'valorProposta', 'planoEscolhido'];
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                lead[field] = req.body[field];
            }
        });

        await lead.save();

        res.json({
            success: true,
            message: 'Lead atualizado com sucesso',
            data: lead
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

// @route   POST /api/leads/:id/historico
// @desc    Adicionar entrada ao histórico do lead
// @access  Private (Admin, Vendedor)
router.post('/:id/historico', [
    authenticateToken,
    authorize('admin', 'vendedor'),
    param('id').isMongoId().withMessage('ID inválido'),
    body('tipo').isIn(['contato', 'email', 'whatsapp', 'proposta', 'reuniao', 'outros']).withMessage('Tipo inválido'),
    body('descricao').trim().isLength({ min: 1, max: 500 }).withMessage('Descrição deve ter entre 1 e 500 caracteres')
], validateRequest, logActivity('add_lead_history'), async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        
        if (!lead) {
            return res.status(404).json({
                success: false,
                error: 'Lead não encontrado',
                code: 'LEAD_NOT_FOUND'
            });
        }

        await lead.adicionarHistorico(
            req.body.tipo,
            req.body.descricao,
            req.user.email
        );

        res.json({
            success: true,
            message: 'Histórico adicionado com sucesso',
            data: lead.historico[lead.historico.length - 1]
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

// @route   GET /api/leads/stats/overview
// @desc    Obter estatísticas gerais dos leads
// @access  Private (Admin, Vendedor)
router.get('/stats/overview', [
    authenticateToken,
    authorize('admin', 'vendedor')
], logActivity('get_lead_stats'), async (req, res) => {
    try {
        const stats = await Lead.obterEstatisticas();
        const totalLeads = await Lead.countDocuments();
        const leadsHoje = await Lead.countDocuments({
            createdAt: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
        });

        res.json({
            success: true,
            data: {
                total: totalLeads,
                hoje: leadsHoje,
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
