const express = require('express');
const { body, query, param } = require('express-validator');
const Client = require('../models/Client');
const { validationResult } = require('express-validator');
const { authenticateToken, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Middleware de validação
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Dados inválidos',
            errors: errors.array()
        });
    }
    next();
};

// @route   POST /api/clients
// @desc    Criar novo cliente e ativar aplicações
// @access  Private (Admin)
router.post('/', [
    authenticateToken,
    authorize('admin'),
    body('name')
        .trim()
        .notEmpty().withMessage('Nome é obrigatório')
        .isLength({ min: 2, max: 200 }).withMessage('Nome deve ter entre 2 e 200 caracteres'),
    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Email inválido')
        .normalizeEmail(),
    body('whatsapp')
        .trim()
        .notEmpty().withMessage('WhatsApp é obrigatório')
        .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Formato de WhatsApp inválido (use +5511999999999)'),
    body('businessType')
        .optional()
        .isIn(['clinica', 'consultorio', 'hospital', 'laboratorio', 'farmacia', 'outros']),
    body('applications')
        .notEmpty().withMessage('Selecione pelo menos uma aplicação')
        .isIn(['automacao', 'agendamento', 'both']).withMessage('Aplicação inválida'),
    body('plan')
        .optional()
        .isIn(['basico', 'profissional', 'empresarial', 'personalizado']),
    body('googleCalendarId')
        .optional()
        .trim()
        .notEmpty().withMessage('ID do calendário não pode ser vazio')
], validateRequest, async (req, res) => {
    try {
        const { name, email, whatsapp, businessType, applications, plan, notes, googleCalendarId } = req.body;
        
        // Verificar se já existe cliente com este WhatsApp
        const existingClient = await Client.findOne({ whatsapp });
        if (existingClient) {
            return res.status(400).json({
                success: false,
                error: 'Já existe um cliente cadastrado com este número de WhatsApp'
            });
        }
        
        // Criar novo cliente
        const client = new Client({
            name,
            email,
            whatsapp,
            businessType: businessType || 'consultorio',
            plan: plan || 'basico',
            notes,
            status: 'ativo'
        });
        
        // Ativar aplicações selecionadas
        if (applications === 'automacao') {
            client.applications.automacaoAtendimento = true;
        } else if (applications === 'agendamento') {
            client.applications.agendamentoInteligente = true;
            
            // Salvar Google Calendar ID se fornecido
            if (googleCalendarId) {
                client.config.agendamento.googleCalendarId = googleCalendarId;
            }
        } else if (applications === 'both') {
            client.applications.automacaoAtendimento = true;
            client.applications.agendamentoInteligente = true;
            
            // Salvar Google Calendar ID se fornecido
            if (googleCalendarId) {
                client.config.agendamento.googleCalendarId = googleCalendarId;
            }
        }
        
        await client.save();
        
        logger.info(`Novo cliente criado: ${client.name} (${client.whatsapp})`);
        
        // Auto-configurar aplicações (simulado por enquanto)
        const configuredApps = [];
        if (client.applications.automacaoAtendimento) {
            configuredApps.push('Automação de Atendimento');
        }
        if (client.applications.agendamentoInteligente) {
            configuredApps.push('Agendamento Inteligente');
        }
        
        res.status(201).json({
            success: true,
            message: `Cliente criado com sucesso! Aplicações configuradas: ${configuredApps.join(', ')}`,
            data: client,
            configuredApplications: configuredApps
        });
        
    } catch (error) {
        logger.error('Erro ao criar cliente:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Já existe um cliente com este WhatsApp'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Erro ao criar cliente'
        });
    }
});

// @route   GET /api/clients
// @desc    Listar todos os clientes
// @access  Private (Admin)
router.get('/', [
    authenticateToken,
    authorize('admin'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['ativo', 'inativo', 'suspenso', 'teste']),
    query('plan').optional().isIn(['basico', 'profissional', 'empresarial', 'personalizado'])
], validateRequest, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.plan) filter.plan = req.query.plan;
        
        const clients = await Client.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('accountManager', 'nome email');
        
        const total = await Client.countDocuments(filter);
        
        res.json({
            success: true,
            data: clients,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        logger.error('Erro ao listar clientes:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao listar clientes'
        });
    }
});

// @route   GET /api/clients/:id
// @desc    Buscar cliente por ID
// @access  Private (Admin)
router.get('/:id', [
    authenticateToken,
    authorize('admin'),
    param('id').isMongoId().withMessage('ID inválido')
], validateRequest, async (req, res) => {
    try {
        const client = await Client.findById(req.params.id)
            .populate('accountManager', 'nome email');
        
        if (!client) {
            return res.status(404).json({
                success: false,
                error: 'Cliente não encontrado'
            });
        }
        
        res.json({
            success: true,
            data: client
        });
        
    } catch (error) {
        logger.error('Erro ao buscar cliente:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar cliente'
        });
    }
});

// @route   PUT /api/clients/:id
// @desc    Atualizar cliente
// @access  Private (Admin)
router.put('/:id', [
    authenticateToken,
    authorize('admin'),
    param('id').isMongoId().withMessage('ID inválido'),
    body('name').optional().trim().isLength({ min: 2, max: 200 }),
    body('email').optional().trim().isEmail().normalizeEmail(),
    body('status').optional().isIn(['ativo', 'inativo', 'suspenso', 'teste']),
    body('plan').optional().isIn(['basico', 'profissional', 'empresarial', 'personalizado'])
], validateRequest, async (req, res) => {
    try {
        const updates = req.body;
        const client = await Client.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );
        
        if (!client) {
            return res.status(404).json({
                success: false,
                error: 'Cliente não encontrado'
            });
        }
        
        logger.info(`Cliente atualizado: ${client.name}`);
        
        res.json({
            success: true,
            message: 'Cliente atualizado com sucesso',
            data: client
        });
        
    } catch (error) {
        logger.error('Erro ao atualizar cliente:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao atualizar cliente'
        });
    }
});

// @route   PUT /api/clients/:id/applications
// @desc    Atualizar aplicações do cliente
// @access  Private (Admin)
router.put('/:id/applications', [
    authenticateToken,
    authorize('admin'),
    param('id').isMongoId().withMessage('ID inválido'),
    body('automacaoAtendimento').optional().isBoolean(),
    body('agendamentoInteligente').optional().isBoolean()
], validateRequest, async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        
        if (!client) {
            return res.status(404).json({
                success: false,
                error: 'Cliente não encontrado'
            });
        }
        
        if (req.body.automacaoAtendimento !== undefined) {
            client.applications.automacaoAtendimento = req.body.automacaoAtendimento;
        }
        if (req.body.agendamentoInteligente !== undefined) {
            client.applications.agendamentoInteligente = req.body.agendamentoInteligente;
        }
        
        await client.save();
        
        logger.info(`Aplicações atualizadas para cliente: ${client.name}`);
        
        res.json({
            success: true,
            message: 'Aplicações atualizadas com sucesso',
            data: client
        });
        
    } catch (error) {
        logger.error('Erro ao atualizar aplicações:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao atualizar aplicações'
        });
    }
});

// @route   DELETE /api/clients/:id
// @desc    Deletar cliente (soft delete - muda status para inativo)
// @access  Private (Admin)
router.delete('/:id', [
    authenticateToken,
    authorize('admin'),
    param('id').isMongoId().withMessage('ID inválido')
], validateRequest, async (req, res) => {
    try {
        const client = await Client.findByIdAndUpdate(
            req.params.id,
            { status: 'inativo' },
            { new: true }
        );
        
        if (!client) {
            return res.status(404).json({
                success: false,
                error: 'Cliente não encontrado'
            });
        }
        
        logger.info(`Cliente desativado: ${client.name}`);
        
        res.json({
            success: true,
            message: 'Cliente desativado com sucesso',
            data: client
        });
        
    } catch (error) {
        logger.error('Erro ao desativar cliente:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao desativar cliente'
        });
    }
});

// @route   GET /api/clients/stats/summary
// @desc    Obter estatísticas gerais de clientes
// @access  Private (Admin)
router.get('/stats/summary', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const total = await Client.countDocuments();
        const ativos = await Client.countDocuments({ status: 'ativo' });
        const comAutomacao = await Client.countDocuments({ 
            'applications.automacaoAtendimento': true,
            status: 'ativo'
        });
        const comAgendamento = await Client.countDocuments({ 
            'applications.agendamentoInteligente': true,
            status: 'ativo'
        });
        
        res.json({
            success: true,
            data: {
                total,
                ativos,
                inativos: total - ativos,
                comAutomacao,
                comAgendamento,
                comAmbas: await Client.countDocuments({
                    'applications.automacaoAtendimento': true,
                    'applications.agendamentoInteligente': true,
                    status: 'ativo'
                })
            }
        });
        
    } catch (error) {
        logger.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar estatísticas'
        });
    }
});

module.exports = router;

