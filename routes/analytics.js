const express = require('express');
const { authenticateToken, authorize } = require('../middleware/auth');
const Lead = require('../models/Lead');
const Client = require('../models/Client');
const Contact = require('../models/Contact');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/analytics/leads-monthly
// @desc    Obter leads por mês (últimos 6 meses)
// @access  Admin
router.get('/leads-monthly', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const leads = await Lead.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        // Formatar dados para Chart.js
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const labels = leads.map(item => months[item._id.month - 1]);
        const values = leads.map(item => item.count);

        res.json({
            success: true,
            data: {
                labels,
                values
            }
        });
    } catch (error) {
        logger.error('Erro ao buscar leads mensais:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar dados de leads'
        });
    }
});

// @route   GET /api/analytics/conversion-rate
// @desc    Obter taxa de conversão
// @access  Admin
router.get('/conversion-rate', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const totalLeads = await Lead.countDocuments();
        const convertedLeads = await Lead.countDocuments({ status: 'convertido' });
        const inProgressLeads = await Lead.countDocuments({ status: 'em_contato' });
        const lostLeads = await Lead.countDocuments({ status: 'perdido' });

        const convertedPercentage = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
        const inProgressPercentage = totalLeads > 0 ? Math.round((inProgressLeads / totalLeads) * 100) : 0;
        const lostPercentage = totalLeads > 0 ? Math.round((lostLeads / totalLeads) * 100) : 0;

        res.json({
            success: true,
            data: {
                labels: ['Convertidos', 'Em processo', 'Perdidos'],
                values: [convertedPercentage, inProgressPercentage, lostPercentage]
            }
        });
    } catch (error) {
        logger.error('Erro ao calcular taxa de conversão:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao calcular taxa de conversão'
        });
    }
});

// @route   GET /api/analytics/lead-sources
// @desc    Obter origem dos leads
// @access  Admin
router.get('/lead-sources', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const sources = await Lead.aggregate([
            {
                $group: {
                    _id: '$origem',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        const labels = sources.map(item => {
            const origemMap = {
                'site': 'Site',
                'whatsapp': 'WhatsApp',
                'indicacao': 'Indicação',
                'redes_sociais': 'Redes Sociais',
                'outros': 'Outros'
            };
            return origemMap[item._id] || item._id;
        });
        const values = sources.map(item => item.count);

        res.json({
            success: true,
            data: {
                labels,
                values
            }
        });
    } catch (error) {
        logger.error('Erro ao buscar origem dos leads:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar origem dos leads'
        });
    }
});

// @route   GET /api/analytics/revenue-monthly
// @desc    Obter receita mensal (últimos 6 meses)
// @access  Admin
router.get('/revenue-monthly', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Como não temos modelo de receita, vamos calcular baseado em clientes convertidos
        // Você pode ajustar isso conforme seu modelo de negócio
        const clients = await Client.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        // Simular receita (ajuste o valor conforme seu ticket médio)
        const averageTicket = 1500; // R$ 1.500 por cliente

        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const labels = clients.map(item => months[item._id.month - 1]);
        const values = clients.map(item => item.count * averageTicket);

        res.json({
            success: true,
            data: {
                labels,
                values
            }
        });
    } catch (error) {
        logger.error('Erro ao buscar receita mensal:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar receita mensal'
        });
    }
});

// @route   GET /api/analytics/summary
// @desc    Obter resumo de analytics
// @access  Admin
router.get('/summary', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const [
            totalLeads,
            totalClients,
            totalContacts,
            leadsThisMonth,
            clientsThisMonth,
            conversionRate
        ] = await Promise.all([
            Lead.countDocuments(),
            Client.countDocuments(),
            Contact.countDocuments(),
            Lead.countDocuments({
                createdAt: {
                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
            }),
            Client.countDocuments({
                createdAt: {
                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
            }),
            Lead.countDocuments({ status: 'convertido' })
        ]);

        const rate = totalLeads > 0 ? ((conversionRate / totalLeads) * 100).toFixed(1) : 0;

        res.json({
            success: true,
            data: {
                totalLeads,
                totalClients,
                totalContacts,
                leadsThisMonth,
                clientsThisMonth,
                conversionRate: rate
            }
        });
    } catch (error) {
        logger.error('Erro ao buscar resumo de analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar resumo'
        });
    }
});

module.exports = router;
