const express = require('express');
const { query, param, body } = require('express-validator');
const Lead = require('../models/Lead');
const Contact = require('../models/Contact');
const User = require('../models/User');
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
            code: 'VALIDATION_ERROR',
            errors: errors.array()
        });
    }
    next();
};

// @route   GET /api/admin/dashboard
// @desc    Obter dados do dashboard administrativo
// @access  Private (Admin only)
router.get('/dashboard', [
    authenticateToken,
    authorize('admin')
], logActivity('admin_dashboard'), async (req, res) => {
    try {
        // Estatísticas gerais
        const totalLeads = await Lead.countDocuments();
        const totalContacts = await Contact.countDocuments();
        const totalUsers = await User.countDocuments();

        // Leads hoje
        const leadsHoje = await Lead.countDocuments({
            createdAt: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
        });

        // Contatos hoje
        const contatosHoje = await Contact.countDocuments({
            createdAt: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
        });

        // Leads por status
        const leadsPorStatus = await Lead.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Contatos por status
        const contatosPorStatus = await Contact.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Leads por especialidade
        const leadsPorEspecialidade = await Lead.aggregate([
            {
                $group: {
                    _id: '$especialidade',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Contatos por categoria
        const contatosPorCategoria = await Contact.aggregate([
            {
                $group: {
                    _id: '$categoria',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Leads recentes
        const leadsRecentes = await Lead.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('nome email especialidade status createdAt');

        // Contatos recentes
        const contatosRecentes = await Contact.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('nome email assunto status prioridade createdAt');

        // Contatos atrasados
        const contatosAtrasados = await Contact.buscarAtrasados();

        // Estatísticas de conversão
        const leadsConvertidos = await Lead.countDocuments({ convertido: true });
        const taxaConversao = totalLeads > 0 ? (leadsConvertidos / totalLeads * 100).toFixed(2) : 0;

        res.json({
            success: true,
            data: {
                resumo: {
                    totalLeads,
                    totalContacts,
                    totalUsers,
                    leadsHoje,
                    contatosHoje,
                    taxaConversao: parseFloat(taxaConversao)
                },
                leads: {
                    porStatus: leadsPorStatus,
                    porEspecialidade: leadsPorEspecialidade,
                    recentes: leadsRecentes
                },
                contatos: {
                    porStatus: contatosPorStatus,
                    porCategoria: contatosPorCategoria,
                    recentes: contatosRecentes,
                    atrasados: contatosAtrasados.length
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

// @route   GET /api/admin/users
// @desc    Listar usuários
// @access  Private (Admin only)
router.get('/users', [
    authenticateToken,
    authorize('admin'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('role').optional().isIn(['admin', 'vendedor', 'suporte', 'viewer']),
    query('ativo').optional().isBoolean()
], validateRequest, logActivity('list_users'), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Construir filtros
        const filters = {};
        
        if (req.query.role) {
            filters.role = req.query.role;
        }
        
        if (req.query.ativo !== undefined) {
            filters.ativo = req.query.ativo === 'true';
        }

        // Buscar usuários
        const users = await User.find(filters)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-senha');

        const total = await User.countDocuments(filters);

        res.json({
            success: true,
            data: {
                users,
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

// @route   PUT /api/admin/users/:id/status
// @desc    Ativar/desativar usuário
// @access  Private (Admin only)
router.put('/users/:id/status', [
    authenticateToken,
    authorize('admin'),
    param('id').isMongoId().withMessage('ID inválido'),
    body('ativo').isBoolean().withMessage('Status deve ser booleano')
], validateRequest, logActivity('toggle_user_status'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado',
                code: 'USER_NOT_FOUND'
            });
        }

        // Não permitir desativar a si mesmo
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                error: 'Você não pode desativar sua própria conta',
                code: 'CANNOT_DEACTIVATE_SELF'
            });
        }

        user.ativo = req.body.ativo;
        await user.save();

        res.json({
            success: true,
            message: `Usuário ${req.body.ativo ? 'ativado' : 'desativado'} com sucesso`,
            data: user.obterDadosPublicos()
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

// @route   GET /api/admin/reports/leads
// @desc    Relatório de leads
// @access  Private (Admin only)
router.get('/reports/leads', [
    authenticateToken,
    authorize('admin'),
    query('dataInicio').isISO8601().withMessage('Data início inválida'),
    query('dataFim').isISO8601().withMessage('Data fim inválida')
], validateRequest, logActivity('leads_report'), async (req, res) => {
    try {
        const dataInicio = new Date(req.query.dataInicio);
        const dataFim = new Date(req.query.dataFim);

        // Ajustar data fim para incluir o dia inteiro
        dataFim.setHours(23, 59, 59, 999);

        // Leads no período
        const leads = await Lead.find({
            createdAt: {
                $gte: dataInicio,
                $lte: dataFim
            }
        }).sort({ createdAt: -1 });

        // Estatísticas por status
        const porStatus = await Lead.aggregate([
            {
                $match: {
                    createdAt: { $gte: dataInicio, $lte: dataFim }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Estatísticas por especialidade
        const porEspecialidade = await Lead.aggregate([
            {
                $match: {
                    createdAt: { $gte: dataInicio, $lte: dataFim }
                }
            },
            {
                $group: {
                    _id: '$especialidade',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Leads por dia
        const porDia = await Lead.aggregate([
            {
                $match: {
                    createdAt: { $gte: dataInicio, $lte: dataFim }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Taxa de conversão
        const totalLeads = leads.length;
        const leadsConvertidos = leads.filter(lead => lead.convertido).length;
        const taxaConversao = totalLeads > 0 ? (leadsConvertidos / totalLeads * 100).toFixed(2) : 0;

        res.json({
            success: true,
            data: {
                periodo: {
                    inicio: dataInicio,
                    fim: dataFim
                },
                resumo: {
                    total: totalLeads,
                    convertidos: leadsConvertidos,
                    taxaConversao: parseFloat(taxaConversao)
                },
                porStatus,
                porEspecialidade,
                porDia,
                leads
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

// @route   GET /api/admin/reports/contacts
// @desc    Relatório de contatos
// @access  Private (Admin only)
router.get('/reports/contacts', [
    authenticateToken,
    authorize('admin'),
    query('dataInicio').isISO8601().withMessage('Data início inválida'),
    query('dataFim').isISO8601().withMessage('Data fim inválida')
], validateRequest, logActivity('contacts_report'), async (req, res) => {
    try {
        const dataInicio = new Date(req.query.dataInicio);
        const dataFim = new Date(req.query.dataFim);

        // Ajustar data fim para incluir o dia inteiro
        dataFim.setHours(23, 59, 59, 999);

        // Contatos no período
        const contatos = await Contact.find({
            createdAt: {
                $gte: dataInicio,
                $lte: dataFim
            }
        }).sort({ createdAt: -1 });

        // Estatísticas por status
        const porStatus = await Contact.aggregate([
            {
                $match: {
                    createdAt: { $gte: dataInicio, $lte: dataFim }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Estatísticas por categoria
        const porCategoria = await Contact.aggregate([
            {
                $match: {
                    createdAt: { $gte: dataInicio, $lte: dataFim }
                }
            },
            {
                $group: {
                    _id: '$categoria',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Estatísticas por prioridade
        const porPrioridade = await Contact.aggregate([
            {
                $match: {
                    createdAt: { $gte: dataInicio, $lte: dataFim }
                }
            },
            {
                $group: {
                    _id: '$prioridade',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Contatos por dia
        const porDia = await Contact.aggregate([
            {
                $match: {
                    createdAt: { $gte: dataInicio, $lte: dataFim }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Tempo médio de resposta
        const contatosComResposta = contatos.filter(c => c.resposta && c.resposta.dataResposta);
        const tempoMedioResposta = contatosComResposta.length > 0 
            ? contatosComResposta.reduce((acc, c) => {
                const tempo = (c.resposta.dataResposta - c.createdAt) / (1000 * 60 * 60); // horas
                return acc + tempo;
            }, 0) / contatosComResposta.length
            : 0;

        res.json({
            success: true,
            data: {
                periodo: {
                    inicio: dataInicio,
                    fim: dataFim
                },
                resumo: {
                    total: contatos.length,
                    comResposta: contatosComResposta.length,
                    tempoMedioResposta: Math.round(tempoMedioResposta * 100) / 100
                },
                porStatus,
                porCategoria,
                porPrioridade,
                porDia,
                contatos
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







