/**
 * Health Check Routes
 * Endpoints para monitoramento do sistema
 */

const express = require('express');
const mongoose = require('mongoose');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Health check básico (rápido)
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();
        
        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: Math.floor(uptime),
            uptimeFormatted: formatUptime(uptime),
            environment: process.env.NODE_ENV || 'development',
            version: process.env.npm_package_version || '1.0.0',
            memory: {
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
                rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB'
            },
            node: process.version
        });
    } catch (error) {
        logger.error('Erro no health check:', error);
        res.status(500).json({
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route   GET /api/health/detailed
 * @desc    Health check detalhado (verifica serviços)
 * @access  Public
 */
router.get('/detailed', async (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        checks: {},
        summary: {
            total: 0,
            passed: 0,
            failed: 0
        }
    };

    // 1. Verificar MongoDB
    try {
        const dbState = mongoose.connection.readyState;
        const dbStatus = {
            connected: dbState === 1,
            state: getDbStateName(dbState),
            database: mongoose.connection.db?.databaseName || 'unknown'
        };
        
        health.checks.database = dbStatus;
        health.summary.total++;
        
        if (dbStatus.connected) {
            health.summary.passed++;
        } else {
            health.summary.failed++;
            health.status = 'degraded';
        }
    } catch (error) {
        health.checks.database = {
            connected: false,
            error: error.message
        };
        health.summary.failed++;
        health.status = 'unhealthy';
    }

    // 2. Verificar Email (configuração)
    try {
        const emailConfigured = !!(process.env.EMAIL_HOST && process.env.EMAIL_USER);
        health.checks.email = {
            configured: emailConfigured,
            host: process.env.EMAIL_HOST || 'not configured',
            from: process.env.EMAIL_FROM || 'not configured'
        };
        
        health.summary.total++;
        
        if (emailConfigured) {
            health.summary.passed++;
        } else {
            health.summary.failed++;
            if (health.status === 'healthy') health.status = 'degraded';
        }
    } catch (error) {
        health.checks.email = {
            configured: false,
            error: error.message
        };
        health.summary.failed++;
    }

    // 3. Verificar WhatsApp (configuração)
    try {
        const whatsappConfigured = !!(
            process.env.WHATSAPP_TOKEN && 
            process.env.WHATSAPP_PHONE_ID
        );
        health.checks.whatsapp = {
            configured: whatsappConfigured,
            phoneId: process.env.WHATSAPP_PHONE_ID ? 'configured' : 'not configured'
        };
        
        health.summary.total++;
        
        if (whatsappConfigured) {
            health.summary.passed++;
        } else {
            health.summary.failed++;
            if (health.status === 'healthy') health.status = 'degraded';
        }
    } catch (error) {
        health.checks.whatsapp = {
            configured: false,
            error: error.message
        };
        health.summary.failed++;
    }

    // 4. Verificar Google Calendar (configuração)
    try {
        const googleCalendarConfigured = !!(
            process.env.GOOGLE_CLIENT_ID && 
            process.env.GOOGLE_CLIENT_SECRET
        );
        health.checks.googleCalendar = {
            configured: googleCalendarConfigured
        };
        
        health.summary.total++;
        
        if (googleCalendarConfigured) {
            health.summary.passed++;
        } else {
            // Não é crítico, apenas degraded
            if (health.status === 'healthy') health.status = 'degraded';
        }
    } catch (error) {
        health.checks.googleCalendar = {
            configured: false,
            error: error.message
        };
    }

    // 5. Informações do sistema
    health.system = {
        uptime: Math.floor(process.uptime()),
        uptimeFormatted: formatUptime(process.uptime()),
        memory: {
            heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
            heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
            rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB'
        },
        node: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'development'
    };

    // Status HTTP baseado no health
    const httpStatus = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;

    res.status(httpStatus).json(health);
});

/**
 * @route   GET /api/health/ready
 * @desc    Readiness check (para Kubernetes/Docker)
 * @access  Public
 */
router.get('/ready', async (req, res) => {
    try {
        // Verificar se banco está conectado (requisito mínimo)
        const dbReady = mongoose.connection.readyState === 1;
        
        if (dbReady) {
            res.status(200).json({
                ready: true,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(503).json({
                ready: false,
                reason: 'Database not connected',
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        res.status(503).json({
            ready: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route   GET /api/health/live
 * @desc    Liveness check (para Kubernetes/Docker)
 * @access  Public
 */
router.get('/live', (req, res) => {
    // Sempre retorna OK se o servidor está rodando
    res.status(200).json({
        alive: true,
        timestamp: new Date().toISOString()
    });
});

// Funções auxiliares
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

function getDbStateName(state) {
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };
    return states[state] || 'unknown';
}

module.exports = router;

