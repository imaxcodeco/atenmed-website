const express = require('express');
const { body, query, param } = require('express-validator');
const Waitlist = require('../models/Waitlist');
const waitlistService = require('../services/waitlistService');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validationResult } = require('express-validator');
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

// @route   POST /api/waitlist
// @desc    Adicionar à fila de espera
// @access  Public (para WhatsApp/Site)
router.post('/', [
    body('patientName').trim().isLength({ min: 2 }).withMessage('Nome inválido'),
    body('patientPhone').matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/).withMessage('Telefone inválido'),
    body('patientEmail').optional().isEmail().withMessage('Email inválido'),
    body('specialtyId').isMongoId().withMessage('ID de especialidade inválido'),
    body('clinicId').isMongoId().withMessage('ID de clínica inválido'),
    body('doctorId').optional().isMongoId().withMessage('ID de médico inválido'),
    body('priority').optional().isIn(['baixa', 'normal', 'alta', 'urgente']),
    body('preferredPeriod').optional().isIn(['manha', 'tarde', 'noite', 'qualquer'])
], validateRequest, async (req, res) => {
    try {
        const entry = await waitlistService.addToWaitlist(req.body);

        res.status(201).json({
            success: true,
            message: 'Você foi adicionado à lista de espera! 📋',
            data: {
                id: entry._id,
                patient: entry.patient,
                specialty: entry.specialty,
                position: entry.position,
                status: entry.status,
                message: 'Avisaremos assim que uma vaga ficar disponível!'
            }
        });

    } catch (error) {
        logger.error('Erro ao adicionar à fila:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao adicionar à fila de espera'
        });
    }
});

// @route   GET /api/waitlist
// @desc    Listar fila de espera
// @access  Private (Admin, Recepcionista)
router.get('/', [
    authenticateToken,
    authorize('admin', 'recepcionista'),
    query('status').optional().isIn(['ativa', 'notificada', 'agendada', 'expirada', 'cancelada']),
    query('specialty').optional().isMongoId(),
    query('doctor').optional().isMongoId(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
], validateRequest, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filters = {};
        if (req.query.status) filters.status = req.query.status;
        if (req.query.specialty) filters.specialty = req.query.specialty;
        if (req.query.doctor) filters.doctor = req.query.doctor;

        const waitlist = await Waitlist.find(filters)
            .populate('doctor', 'name')
            .populate('specialty', 'name')
            .populate('clinic', 'name')
            .sort({ priority: -1, createdAt: 1 })
            .skip(skip)
            .limit(limit);

        const total = await Waitlist.countDocuments(filters);

        res.json({
            success: true,
            data: {
                waitlist,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        logger.error('Erro ao listar fila:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao listar fila de espera'
        });
    }
});

// @route   GET /api/waitlist/:id
// @desc    Obter entrada específica da fila
// @access  Public (paciente pode consultar sua posição)
router.get('/:id', [
    param('id').isMongoId()
], validateRequest, async (req, res) => {
    try {
        const entry = await Waitlist.findById(req.params.id)
            .populate('doctor', 'name')
            .populate('specialty', 'name')
            .populate('clinic', 'name address');

        if (!entry) {
            return res.status(404).json({
                success: false,
                error: 'Entrada não encontrada'
            });
        }

        res.json({
            success: true,
            data: {
                id: entry._id,
                patient: entry.patient,
                doctor: entry.doctor,
                specialty: entry.specialty,
                clinic: entry.clinic,
                position: entry.position,
                status: entry.status,
                priority: entry.priority,
                waitTime: entry.waitTime,
                createdAt: entry.createdAt,
                expiresAt: entry.expiresAt
            }
        });

    } catch (error) {
        logger.error('Erro ao buscar entrada da fila:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar entrada'
        });
    }
});

// @route   PUT /api/waitlist/:id/cancel
// @desc    Cancelar entrada da fila
// @access  Public
router.put('/:id/cancel', [
    param('id').isMongoId(),
    body('reason').optional().trim()
], validateRequest, async (req, res) => {
    try {
        const entry = await Waitlist.findById(req.params.id);

        if (!entry) {
            return res.status(404).json({
                success: false,
                error: 'Entrada não encontrada'
            });
        }

        if (entry.status === 'cancelada') {
            return res.json({
                success: true,
                message: 'Entrada já estava cancelada'
            });
        }

        await entry.cancel(req.body.reason || 'Cancelado pelo paciente');

        logger.info(`🚫 Entrada da fila cancelada - ${entry._id}`);

        res.json({
            success: true,
            message: 'Você foi removido da lista de espera',
            data: entry
        });

    } catch (error) {
        logger.error('Erro ao cancelar entrada da fila:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao cancelar'
        });
    }
});

// @route   POST /api/waitlist/:id/notify
// @desc    Enviar notificação manual
// @access  Private (Admin)
router.post('/:id/notify', [
    authenticateToken,
    authorize('admin', 'recepcionista'),
    param('id').isMongoId()
], validateRequest, async (req, res) => {
    try {
        const entry = await Waitlist.findById(req.params.id)
            .populate('doctor', 'name')
            .populate('specialty', 'name')
            .populate('clinic', 'name');

        if (!entry) {
            return res.status(404).json({
                success: false,
                error: 'Entrada não encontrada'
            });
        }

        await waitlistService.sendNotification(entry, req.body.slotInfo);

        res.json({
            success: true,
            message: 'Notificação enviada'
        });

    } catch (error) {
        logger.error('Erro ao enviar notificação:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao enviar notificação'
        });
    }
});

// @route   PUT /api/waitlist/:id/priority
// @desc    Atualizar prioridade
// @access  Private (Admin)
router.put('/:id/priority', [
    authenticateToken,
    authorize('admin'),
    param('id').isMongoId(),
    body('priority').isIn(['baixa', 'normal', 'alta', 'urgente'])
], validateRequest, async (req, res) => {
    try {
        const entry = await Waitlist.findByIdAndUpdate(
            req.params.id,
            { 
                priority: req.body.priority,
                urgencyReason: req.body.reason
            },
            { new: true }
        );

        if (!entry) {
            return res.status(404).json({
                success: false,
                error: 'Entrada não encontrada'
            });
        }

        // Atualizar posições
        await Waitlist.updatePositions(entry.specialty, entry.doctor);

        res.json({
            success: true,
            message: 'Prioridade atualizada',
            data: entry
        });

    } catch (error) {
        logger.error('Erro ao atualizar prioridade:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao atualizar prioridade'
        });
    }
});

// @route   GET /api/waitlist/stats/overview
// @desc    Estatísticas da fila de espera
// @access  Private (Admin)
router.get('/stats/overview', [
    authenticateToken,
    authorize('admin')
], async (req, res) => {
    try {
        const stats = await waitlistService.getStats();

        res.json({
            success: true,
            data: stats
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

