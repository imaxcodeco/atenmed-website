/**
 * AtenMed - Google Calendar Routes
 * Rotas de autenticação e integração com Google Calendar
 */

const express = require('express');
const router = express.Router();
const googleCalendarService = require('../services/googleCalendarService');
const logger = require('../utils/logger');

/**
 * @route   GET /api/auth/google
 * @desc    Iniciar autenticação OAuth com Google Calendar
 * @access  Public
 */
router.get('/auth/google', (req, res) => {
    try {
        const authUrl = googleCalendarService.getAuthUrl();
        res.redirect(authUrl);
    } catch (error) {
        logger.error('Erro ao gerar URL de autenticação:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao iniciar autenticação com Google' 
        });
    }
});

/**
 * @route   GET /api/auth/google/callback
 * @desc    Callback OAuth do Google Calendar
 * @access  Public
 */
router.get('/auth/google/callback', async (req, res) => {
    try {
        const { code } = req.query;
        
        if (!code) {
            return res.status(400).json({ 
                success: false, 
                error: 'Código de autorização não fornecido' 
            });
        }
        
        const tokens = await googleCalendarService.getTokenFromCode(code);
        logger.info('✅ Autenticação com Google Calendar bem-sucedida');
        
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Autenticação Bem-sucedida</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        display: flex; 
                        justify-content: center; 
                        align-items: center; 
                        height: 100vh; 
                        margin: 0;
                        background: linear-gradient(135deg, #45a7b1, #184354);
                    }
                    .success-box {
                        background: white;
                        padding: 3rem;
                        border-radius: 10px;
                        text-align: center;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    }
                    .success-icon {
                        font-size: 4rem;
                        margin-bottom: 1rem;
                    }
                    h1 { color: #45a7b1; margin-bottom: 1rem; }
                    p { color: #64748b; margin-bottom: 2rem; }
                    a { 
                        display: inline-block;
                        background: #45a7b1; 
                        color: white; 
                        padding: 1rem 2rem; 
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: bold;
                    }
                    a:hover { background: #184354; }
                </style>
            </head>
            <body>
                <div class="success-box">
                    <div class="success-icon">✅</div>
                    <h1>Autenticação Bem-sucedida!</h1>
                    <p>O AtenMed está agora conectado ao Google Calendar.<br>
                    Você pode fechar esta janela e voltar ao sistema.</p>
                    <a href="/agendamento">Voltar ao Sistema</a>
                </div>
            </body>
            </html>
        `);
        
    } catch (error) {
        logger.error('Erro no callback do Google:', error);
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Erro de Autenticação</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        display: flex; 
                        justify-content: center; 
                        align-items: center; 
                        height: 100vh; 
                        margin: 0;
                        background: #fee2e2;
                    }
                    .error-box {
                        background: white;
                        padding: 3rem;
                        border-radius: 10px;
                        text-align: center;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    }
                    h1 { color: #dc2626; margin-bottom: 1rem; }
                    p { color: #64748b; }
                </style>
            </head>
            <body>
                <div class="error-box">
                    <h1>❌ Erro na Autenticação</h1>
                    <p>Ocorreu um erro ao conectar com o Google Calendar.<br>
                    Por favor, tente novamente.</p>
                </div>
            </body>
            </html>
        `);
    }
});

/**
 * @route   GET /api/auth/google/status
 * @desc    Verificar status de autenticação
 * @access  Public
 */
router.get('/auth/google/status', (req, res) => {
    res.json({
        success: true,
        authenticated: googleCalendarService.isAuthenticated()
    });
});

/**
 * @route   GET /api/google/calendars
 * @desc    Listar calendários disponíveis
 * @access  Public (deveria ter auth)
 */
router.get('/calendars', async (req, res) => {
    try {
        if (!googleCalendarService.isAuthenticated()) {
            return res.status(401).json({
                success: false,
                error: 'Google Calendar não autenticado',
                needsAuth: true,
                authUrl: '/api/auth/google'
            });
        }

        const calendars = await googleCalendarService.listCalendars();
        
        res.json({
            success: true,
            data: calendars,
            total: calendars.length
        });

    } catch (error) {
        logger.error('Erro ao listar calendários:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao listar calendários do Google'
        });
    }
});

module.exports = router;

