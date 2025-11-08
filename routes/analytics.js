/**
 * AtenMed - Analytics Routes
 * Rotas para métricas e analytics dos agentes
 */

const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// ===== MIDDLEWARE =====
router.use(authenticateToken);

// ===== MÉTRICAS GERAIS =====
/**
 * @route   GET /api/analytics/metrics
 * @desc    Obter métricas gerais
 * @access  Private
 */
router.get('/metrics', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const now = new Date();
        const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 dias atrás
        
        const metrics = await analyticsService.getGeneralMetrics(
            req.clinicId,
            startDate || defaultStartDate,
            endDate || now
        );
        
        res.json({
            success: true,
            metrics
        });
        
    } catch (error) {
        logger.error('Erro ao obter métricas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao obter métricas'
        });
    }
});

// ===== MÉTRICAS POR DIA =====
/**
 * @route   GET /api/analytics/daily
 * @desc    Obter métricas por dia
 * @access  Private
 */
router.get('/daily', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const now = new Date();
        const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const dailyMetrics = await analyticsService.getDailyMetrics(
            req.clinicId,
            startDate || defaultStartDate,
            endDate || now
        );
        
        res.json({
            success: true,
            data: dailyMetrics
        });
        
    } catch (error) {
        logger.error('Erro ao obter métricas diárias:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao obter métricas diárias'
        });
    }
});

// ===== MÉTRICAS POR AGENTE =====
/**
 * @route   GET /api/analytics/agents
 * @desc    Obter métricas por agente
 * @access  Private
 */
router.get('/agents', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const now = new Date();
        const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const agentMetrics = await analyticsService.getAgentMetrics(
            req.clinicId,
            startDate || defaultStartDate,
            endDate || now
        );
        
        res.json({
            success: true,
            agents: agentMetrics
        });
        
    } catch (error) {
        logger.error('Erro ao obter métricas por agente:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao obter métricas por agente'
        });
    }
});

// ===== MÉTRICAS POR CANAL =====
/**
 * @route   GET /api/analytics/channels
 * @desc    Obter métricas por canal
 * @access  Private
 */
router.get('/channels', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const now = new Date();
        const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const channelMetrics = await analyticsService.getChannelMetrics(
            req.clinicId,
            startDate || defaultStartDate,
            endDate || now
        );
        
        res.json({
            success: true,
            channels: channelMetrics
        });
        
    } catch (error) {
        logger.error('Erro ao obter métricas por canal:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao obter métricas por canal'
        });
    }
});

// ===== TENDÊNCIAS =====
/**
 * @route   GET /api/analytics/trends
 * @desc    Obter tendências
 * @access  Private
 */
router.get('/trends', async (req, res) => {
    try {
        const { days = 30 } = req.query;
        
        const trends = await analyticsService.getTrends(req.clinicId, parseInt(days));
        
        res.json({
            success: true,
            trends
        });
        
    } catch (error) {
        logger.error('Erro ao obter tendências:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao obter tendências'
        });
    }
});

// ===== MÉTRICAS HORÁRIAS =====
/**
 * @route   GET /api/analytics/hourly
 * @desc    Obter métricas por hora do dia
 * @access  Private
 */
router.get('/hourly', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const now = new Date();
        const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const hourlyMetrics = await analyticsService.getHourlyMetrics(
            req.clinicId,
            startDate || defaultStartDate,
            endDate || now
        );
        
        res.json({
            success: true,
            data: hourlyMetrics
        });
        
    } catch (error) {
        logger.error('Erro ao obter métricas horárias:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao obter métricas horárias'
        });
    }
});

// ===== MÉTRICAS DE SATISFAÇÃO =====
/**
 * @route   GET /api/analytics/satisfaction
 * @desc    Obter métricas detalhadas de satisfação
 * @access  Private
 */
router.get('/satisfaction', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const now = new Date();
        const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const satisfactionMetrics = await analyticsService.getSatisfactionMetrics(
            req.clinicId,
            startDate || defaultStartDate,
            endDate || now
        );
        
        res.json({
            success: true,
            metrics: satisfactionMetrics
        });
        
    } catch (error) {
        logger.error('Erro ao obter métricas de satisfação:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao obter métricas de satisfação'
        });
    }
});

// ===== MÉTRICAS DE INTENÇÕES =====
/**
 * @route   GET /api/analytics/intents
 * @desc    Obter métricas de intenções detectadas
 * @access  Private
 */
router.get('/intents', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const now = new Date();
        const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const intentMetrics = await analyticsService.getIntentMetrics(
            req.clinicId,
            startDate || defaultStartDate,
            endDate || now
        );
        
        res.json({
            success: true,
            intents: intentMetrics
        });
        
    } catch (error) {
        logger.error('Erro ao obter métricas de intenções:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao obter métricas de intenções'
        });
    }
});

// ===== MÉTRICAS DE TEMPO DE RESPOSTA =====
/**
 * @route   GET /api/analytics/response-time
 * @desc    Obter métricas detalhadas de tempo de resposta
 * @access  Private
 */
router.get('/response-time', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const now = new Date();
        const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const responseTimeMetrics = await analyticsService.getResponseTimeMetrics(
            req.clinicId,
            startDate || defaultStartDate,
            endDate || now
        );
        
        res.json({
            success: true,
            metrics: responseTimeMetrics
        });
        
    } catch (error) {
        logger.error('Erro ao obter métricas de tempo de resposta:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao obter métricas de tempo de resposta'
        });
    }
});

module.exports = router;
