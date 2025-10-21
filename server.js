const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const path = require('path');
require('dotenv').config();

// Importar configurações
const connectDB = require('./config/database');
const logger = require('./utils/logger');

// Importar rotas
const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');
const contactRoutes = require('./routes/contact');
const serviceRoutes = require('./routes/services');
const adminRoutes = require('./routes/admin');
const appointmentRoutes = require('./routes/appointments');
const confirmationRoutes = require('./routes/confirmations');
const waitlistRoutes = require('./routes/waitlist');
const analyticsRoutes = require('./routes/analytics');
const whatsappRoutes = require('./routes/whatsapp');
const clientRoutes = require('./routes/clients');

// Importar middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Importar serviços
const googleCalendarService = require('./services/googleCalendarService');
const reminderService = require('./services/reminderService');
const waitlistService = require('./services/waitlistService');
const whatsappService = require('./services/whatsappService');

const app = express();
const PORT = process.env.PORT || 3000;

// Conectar ao banco de dados
connectDB();

// Inicializar Google Calendar Service
googleCalendarService.initialize();

// Inicializar WhatsApp Service
whatsappService.initialize();
logger.info('📱 WhatsApp Business Service inicializado');

// Inicializar Reminder Service
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_REMINDERS === 'true') {
    reminderService.start();
    logger.info('🔔 Reminder Service habilitado');
}

// Inicializar Waitlist Service
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_WAITLIST === 'true') {
    waitlistService.start();
    logger.info('📋 Waitlist Service habilitado');
}

// Middleware de segurança
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            connectSrc: ["'self'"]
        }
    }
}));

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN?.split(',') || [
        'https://atenmed.com.br',
        'https://www.atenmed.com.br',
        'http://localhost:3000', // Para desenvolvimento local
        'http://localhost:8000'  // Para desenvolvimento local
    ],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Trust proxy - necessário para AWS/Nginx (express-rate-limit precisa disso)
app.set('trust proxy', true);

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limite de 100 requests por IP
    message: {
        error: 'Muitas requisições deste IP, tente novamente em 15 minutos.',
        retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', limiter);

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitização de dados
app.use(mongoSanitize());
app.use((req, res, next) => {
    if (req.body) {
        req.body = JSON.parse(xss(JSON.stringify(req.body)));
    }
    next();
});

// Compressão
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', {
        stream: { write: message => logger.info(message.trim()) }
    }));
}

// Servir arquivos estáticos do site principal
app.use('/site', express.static(path.join(__dirname, 'site')));

// Servir arquivos estáticos das aplicações
app.use('/apps/whatsapp', express.static(path.join(__dirname, 'applications/whatsapp-automation')));
app.use('/apps/cost-monitoring', express.static(path.join(__dirname, 'applications/cost-monitoring')));
app.use('/apps/admin', express.static(path.join(__dirname, 'applications/admin-dashboard')));
app.use('/apps/agendamento', express.static(path.join(__dirname, 'applications/smart-scheduling')));
app.use('/apps/analytics', express.static(path.join(__dirname, 'applications/analytics-dashboard')));

// Assets do site principal (compatibilidade)
app.use('/assets', express.static(path.join(__dirname, 'site/assets')));

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/confirmations', confirmationRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/clients', clientRoutes);

// Rotas de autenticação do Google Calendar
app.get('/api/auth/google', (req, res) => {
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

app.get('/api/auth/google/callback', async (req, res) => {
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

app.get('/api/auth/google/status', (req, res) => {
    res.json({
        success: true,
        authenticated: googleCalendarService.isAuthenticated()
    });
});

// Listar calendários disponíveis
app.get('/api/google/calendars', async (req, res) => {
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

// Rotas específicas para aplicações
app.get('/whatsapp', (req, res) => {
    res.sendFile(path.join(__dirname, 'applications/whatsapp-automation/whatsapp-admin.html'));
});

app.get('/whatsapp-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'applications/whatsapp-test/index.html'));
});

app.get('/cost-monitoring', (req, res) => {
    res.sendFile(path.join(__dirname, 'applications/cost-monitoring/cost-monitoring.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'applications/admin-dashboard/dashboard.html'));
});

app.get('/agendamento', (req, res) => {
    res.sendFile(path.join(__dirname, 'applications/smart-scheduling/index.html'));
});

app.get('/analytics', (req, res) => {
    res.sendFile(path.join(__dirname, 'applications/analytics-dashboard/index.html'));
});

// Rotas para páginas do site principal (com e sem .html)
app.get(['/sobre', '/sobre.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'site/sobre.html'));
});

app.get(['/servicos', '/servicos.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'site/servicos.html'));
});

app.get(['/login', '/login.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'site/login.html'));
});

app.get(['/index', '/index.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'site/index.html'));
});

// Rota para servir o site principal (catch-all deve vir por último)
app.get('*', (req, res) => {
    // Se for uma rota da API, retornar 404
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint não encontrado' });
    }
    
    // Se for rota de aplicação, redirecionar
    if (req.path.startsWith('/apps/')) {
        return res.status(404).json({ error: 'Aplicação não encontrada' });
    }
    
    // Servir o index.html do site principal
    res.sendFile(path.join(__dirname, 'site/index.html'));
});

// Middleware de erro 404
app.use(notFound);

// Middleware de tratamento de erros
app.use(errorHandler);

// Iniciar servidor
const server = app.listen(PORT, () => {
    logger.info(`🚀 Servidor AtenMed rodando na porta ${PORT}`);
    logger.info(`📊 Ambiente: ${process.env.NODE_ENV}`);
    logger.info(`🌐 Health check: http://localhost:${PORT}/health`);
    logger.info(`📱 Frontend: http://localhost:${PORT}`);
    logger.info(`🔗 API: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM recebido, encerrando servidor graciosamente...');
    server.close(() => {
        logger.info('Servidor encerrado');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT recebido, encerrando servidor graciosamente...');
    server.close(() => {
        logger.info('Servidor encerrado');
        process.exit(0);
    });
});

module.exports = app;

