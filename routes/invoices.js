const express = require('express');
const { body, query, param } = require('express-validator');
const Invoice = require('../models/Invoice');
const Clinic = require('../models/Clinic');
const { authenticateToken, authorize, logActivity } = require('../middleware/auth');
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

/**
 * @route   POST /api/invoices
 * @desc    Criar nova fatura
 * @access  Private (Admin)
 */
router.post('/', [
    authenticateToken,
    authorize('admin'),
    body('clinic').isMongoId().withMessage('ID da clínica inválido'),
    body('referenceMonth').isISO8601().withMessage('Mês de referência inválido'),
    body('plan').isIn(['free', 'basic', 'pro', 'enterprise']).withMessage('Plano inválido'),
    body('amount').isFloat({ min: 0 }).withMessage('Valor deve ser positivo'),
    body('dueDate').isISO8601().withMessage('Data de vencimento inválida'),
    body('discount').optional().isFloat({ min: 0 }).withMessage('Desconto deve ser positivo'),
    body('notes').optional().trim()
], validateRequest, logActivity('create_invoice'), async (req, res) => {
    try {
        const {
            clinic,
            referenceMonth,
            plan,
            amount,
            dueDate,
            discount = 0,
            notes,
            paymentMethod,
            metadata
        } = req.body;

        // Verificar se clínica existe
        const clinicDoc = await Clinic.findById(clinic);
        if (!clinicDoc) {
            return res.status(404).json({
                success: false,
                error: 'Clínica não encontrada'
            });
        }

        // Verificar se já existe fatura para este mês
        const existingInvoice = await Invoice.findOne({
            clinic,
            referenceMonth: new Date(referenceMonth)
        });

        if (existingInvoice) {
            return res.status(400).json({
                success: false,
                error: 'Já existe fatura para este período',
                invoiceId: existingInvoice._id
            });
        }

        // Criar fatura
        const invoice = new Invoice({
            clinic,
            referenceMonth: new Date(referenceMonth),
            plan,
            amount,
            discount,
            dueDate: new Date(dueDate),
            notes,
            paymentMethod,
            metadata,
            status: 'pendente'
        });

        await invoice.save();

        logger.info(`Fatura criada: ${invoice.invoiceNumber} - ${clinicDoc.name}`);

        res.status(201).json({
            success: true,
            message: 'Fatura criada com sucesso',
            data: invoice
        });

    } catch (error) {
        logger.error('Erro ao criar fatura:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao criar fatura'
        });
    }
});

/**
 * @route   GET /api/invoices
 * @desc    Listar faturas com filtros
 * @access  Private (Admin ou Clinic Owner)
 */
router.get('/', [
    authenticateToken,
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('clinic').optional().isMongoId(),
    query('status').optional().isIn(['pendente', 'pago', 'vencido', 'cancelado']),
    query('plan').optional().isIn(['free', 'basic', 'pro', 'enterprise'])
], validateRequest, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Construir filtros
        const filters = {};
        
        if (req.query.clinic) {
            filters.clinic = req.query.clinic;
        }
        
        if (req.query.status) {
            filters.status = req.query.status;
        }
        
        if (req.query.plan) {
            filters.plan = req.query.plan;
        }

        // Buscar faturas
        const invoices = await Invoice.find(filters)
            .populate('clinic', 'name slug contact')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Invoice.countDocuments(filters);

        res.json({
            success: true,
            data: {
                invoices,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        logger.error('Erro ao listar faturas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao listar faturas'
        });
    }
});

/**
 * @route   GET /api/invoices/:id
 * @desc    Obter fatura específica
 * @access  Private
 */
router.get('/:id', [
    authenticateToken,
    param('id').isMongoId().withMessage('ID inválido')
], validateRequest, async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('clinic', 'name slug contact address');
        
        if (!invoice) {
            return res.status(404).json({
                success: false,
                error: 'Fatura não encontrada'
            });
        }

        res.json({
            success: true,
            data: invoice
        });

    } catch (error) {
        logger.error('Erro ao buscar fatura:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar fatura'
        });
    }
});

/**
 * @route   PATCH /api/invoices/:id/paid
 * @desc    Marcar fatura como paga
 * @access  Private (Admin)
 */
router.patch('/:id/paid', [
    authenticateToken,
    authorize('admin'),
    param('id').isMongoId().withMessage('ID inválido'),
    body('paymentMethod').optional().isIn(['boleto', 'pix', 'transferencia', 'cartao', 'outros']),
    body('paymentReference').optional().trim()
], validateRequest, logActivity('mark_invoice_paid'), async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        
        if (!invoice) {
            return res.status(404).json({
                success: false,
                error: 'Fatura não encontrada'
            });
        }

        if (invoice.status === 'pago') {
            return res.status(400).json({
                success: false,
                error: 'Fatura já está marcada como paga'
            });
        }

        await invoice.markAsPaid(req.body.paymentMethod, req.body.paymentReference);

        logger.info(`Fatura paga: ${invoice.invoiceNumber}`);

        res.json({
            success: true,
            message: 'Fatura marcada como paga',
            data: invoice
        });

    } catch (error) {
        logger.error('Erro ao marcar fatura como paga:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao atualizar fatura'
        });
    }
});

/**
 * @route   PATCH /api/invoices/:id/cancel
 * @desc    Cancelar fatura
 * @access  Private (Admin)
 */
router.patch('/:id/cancel', [
    authenticateToken,
    authorize('admin'),
    param('id').isMongoId().withMessage('ID inválido'),
    body('reason').optional().trim()
], validateRequest, logActivity('cancel_invoice'), async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        
        if (!invoice) {
            return res.status(404).json({
                success: false,
                error: 'Fatura não encontrada'
            });
        }

        if (invoice.status === 'pago') {
            return res.status(400).json({
                success: false,
                error: 'Não é possível cancelar fatura já paga'
            });
        }

        invoice.status = 'cancelado';
        if (req.body.reason) {
            invoice.notes = (invoice.notes ? invoice.notes + '\n\n' : '') + 
                            `CANCELADO: ${req.body.reason}`;
        }
        await invoice.save();

        logger.info(`Fatura cancelada: ${invoice.invoiceNumber}`);

        res.json({
            success: true,
            message: 'Fatura cancelada',
            data: invoice
        });

    } catch (error) {
        logger.error('Erro ao cancelar fatura:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao cancelar fatura'
        });
    }
});

/**
 * @route   GET /api/invoices/stats/overview
 * @desc    Estatísticas gerais de faturas
 * @access  Private (Admin)
 */
router.get('/stats/overview', [
    authenticateToken,
    authorize('admin')
], async (req, res) => {
    try {
        const stats = await Invoice.getStats();
        
        // Total pendente
        const pendingInvoices = await Invoice.find({ status: 'pendente' });
        const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        
        // Total pago este mês
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);
        
        const paidThisMonth = await Invoice.find({
            status: 'pago',
            paidDate: { $gte: thisMonth }
        });
        const totalPaidThisMonth = paidThisMonth.reduce((sum, inv) => sum + inv.totalAmount, 0);
        
        // Faturas vencidas
        const overdueInvoices = await Invoice.find({
            status: 'vencido',
            dueDate: { $lt: new Date() }
        });
        
        res.json({
            success: true,
            data: {
                byStatus: stats,
                totalPending,
                totalPaidThisMonth,
                overdueCount: overdueInvoices.length,
                overdueAmount: overdueInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
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

/**
 * @route   GET /api/invoices/overdue/:days
 * @desc    Listar faturas vencidas há X dias
 * @access  Private (Admin)
 */
router.get('/overdue/:days', [
    authenticateToken,
    authorize('admin'),
    param('days').isInt({ min: 0 }).withMessage('Dias deve ser número positivo')
], validateRequest, async (req, res) => {
    try {
        const days = parseInt(req.params.days);
        const invoices = await Invoice.findOverdue(days)
            .populate('clinic', 'name contact');

        res.json({
            success: true,
            data: {
                days,
                count: invoices.length,
                invoices
            }
        });

    } catch (error) {
        logger.error('Erro ao buscar faturas vencidas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar faturas vencidas'
        });
    }
});

/**
 * @route   GET /api/invoices/due-soon/:days
 * @desc    Listar faturas a vencer nos próximos X dias
 * @access  Private (Admin)
 */
router.get('/due-soon/:days', [
    authenticateToken,
    authorize('admin'),
    param('days').isInt({ min: 1 }).withMessage('Dias deve ser número positivo')
], validateRequest, async (req, res) => {
    try {
        const days = parseInt(req.params.days);
        const invoices = await Invoice.findDueSoon(days)
            .populate('clinic', 'name contact');

        res.json({
            success: true,
            data: {
                days,
                count: invoices.length,
                invoices
            }
        });

    } catch (error) {
        logger.error('Erro ao buscar faturas a vencer:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar faturas'
        });
    }
});

module.exports = router;

