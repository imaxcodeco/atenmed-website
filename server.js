const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { initSentry } = require('./utils/sentry');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');
require('dotenv').config();

// Validar variáveis de ambiente usando módulo centralizado
const { validateEnv, showConfigSummary } = require('./config/validate-env');
validateEnv(true); // strict mode em produção
showConfigSummary();

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
const whatsappRoutes = require('./routes/whatsappV2');
const clientRoutes = require('./routes/clients');
const clinicRoutes = require('./routes/clinics');
const invoiceRoutes = require('./routes/invoices');
const doctorRoutes = require('./routes/doctors');
const specialtyRoutes = require('./routes/specialties');
const googleCalendarRoutes = require('./routes/googleCalendar');
const testRoutes = require('./routes/test');
const queuesDashboardRoutes = require('./routes/queues-dashboard');

// Importar middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Importar serviços
const googleCalendarService = require('./services/googleCalendarService');
const reminderService = require('./services/reminderService');
const waitlistService = require('./services/waitlistService');
const whatsappService = require('./services/whatsappServiceV2');

// Importar middlewares de subscription e limites
const { checkSubscriptionStatus, checkPlanLimits } = require('./middleware/subscriptionStatus');

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializar Sentry (deve vir antes de tudo)
const sentryHandlers = initSentry(app);

// ⚠️ IMPORTANTE: Trust proxy DEVE vir ANTES de qualquer middleware que use req.ip
// Configurar trust proxy para produção (Nginx)
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1); // Confiar apenas no primeiro proxy (Nginx)
} else {
    app.set('trust proxy', false); // Desenvolvimento sem proxy
}

// Sentry request handler (deve vir logo após configurações básicas)
app.use(sentryHandlers.requestHandler);
app.use(sentryHandlers.tracingHandler);

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
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://cdnjs.cloudflare.com",
                "https://cdn.jsdelivr.net"
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "https://cdnjs.cloudflare.com",
                "https://cdn.jsdelivr.net",
                "https://ka-f.fontawesome.com",
                "data:"
            ],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            connectSrc: ["'self'"]
        }
    }
}));

// CORS configuration (usar delegate para acessar req)
const corsOptionsDelegate = (req, callback) => {
    const origin = req.header('Origin');
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
        'https://atenmed.com.br',
        'https://www.atenmed.com.br',
        ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000', 'http://localhost:8000'] : [])
    ];

    // Em desenvolvimento, permitir requests sem Origin
    if (!origin && process.env.NODE_ENV !== 'production') {
        return callback(null, { origin: true, credentials: true, optionsSuccessStatus: 200 });
    }

    // Em produção, permitir sem Origin para:
    // 1. Health check endpoint (para monitoramento)
    // 2. Páginas estáticas e recursos (GET requests)
    // 3. Webhooks conhecidos (Meta/WhatsApp)
    if (!origin && process.env.NODE_ENV === 'production') {
        // Permitir health check sem origin
        if (req.path === '/health' || req.path === '/api/health') {
            return callback(null, { origin: true, credentials: false, optionsSuccessStatus: 200 });
        }
        
        // Permitir GET requests para páginas estáticas (site principal)
        // Quando você acessa o site diretamente no navegador, pode não ter Origin
        if (req.method === 'GET' && (
            req.path === '/' || 
            req.path.startsWith('/site/') ||
            req.path.startsWith('/apps/') ||
            req.path.startsWith('/assets/') ||
            req.path.match(/\.(html|css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i)
        )) {
            return callback(null, { origin: true, credentials: false, optionsSuccessStatus: 200 });
        }
        
        const userAgent = req.get('user-agent') || '';
        const isKnownWebhook = userAgent.includes('Meta') ||
                               userAgent.includes('WhatsApp') ||
                               userAgent.includes('facebookexternalua');
        if (isKnownWebhook) {
            return callback(null, { origin: true, credentials: true, optionsSuccessStatus: 200 });
        }
        logger.warn(`⚠️ Request sem origin rejeitado em produção. Path: ${req.path}, Method: ${req.method}, User-Agent: ${userAgent}`);
        return callback(new Error('Origin required in production'));
    }

    // Com Origin: validar lista permitida
    if (origin && allowedOrigins.includes(origin)) {
        return callback(null, { origin: true, credentials: true, optionsSuccessStatus: 200 });
    }

    logger.warn(`⚠️ Origin não permitido: ${origin || 'N/A'}`);
    return callback(new Error('Not allowed by CORS'));
};
app.use(cors(corsOptionsDelegate));

// Trust proxy já configurado no topo do arquivo (linha 44)

// Rate limiting (EXCETO para webhooks do WhatsApp)
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limite de 100 requests por IP
    message: {
        error: 'Muitas requisições deste IP, tente novamente em 15 minutos.',
        retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Pular rate limiting apenas para webhooks específicos
    skip: (req) => {
        // Lista exata de endpoints que devem pular rate limit
        const skipPaths = ['/api/whatsapp/webhook'];
        return skipPaths.includes(req.path);
    }
});
app.use('/api/', limiter);

// Middleware de parsing
app.use(express.json({
    limit: '10mb',
    type: ['application/json', 'application/json; charset=utf-8', 'application/json; charset=UTF-8']
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitização de dados contra NoSQL injection
app.use(mongoSanitize());
// Nota: xss() foi removido pois estava corrompendo JSON.
// A sanitização XSS é feita pelo express-validator nas rotas.

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
app.use('/apps/clinic-page', express.static(path.join(__dirname, 'applications/clinic-page')));
app.use('/apps/crm', express.static(path.join(__dirname, 'applications/crm-pipeline')));
app.use('/apps/portal', express.static(path.join(__dirname, 'applications/clinic-portal')));

// Assets do site principal (compatibilidade)
app.use('/assets', express.static(path.join(__dirname, 'site/assets')));

// Health check
app.get('/health', (req, res) => {
    try {
        res.status(200).json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV,
            version: process.env.npm_package_version || '1.0.0'
        });
    } catch (error) {
        logger.error('Erro no health check:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            status: 'error'
        });
    }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/admin', adminRoutes);

// Rotas com verificação de subscription e limites
app.use('/api/appointments', checkSubscriptionStatus, checkPlanLimits, appointmentRoutes);
app.use('/api/confirmations', checkSubscriptionStatus, confirmationRoutes);
app.use('/api/waitlist', checkSubscriptionStatus, waitlistRoutes);
app.use('/api/analytics', analyticsRoutes);

// Rotas críticas do WhatsApp com verificação
app.use('/api/whatsapp', whatsappRoutes); // Webhook não deve ter limite, mas send sim (verificado na rota)

app.use('/api/clients', clientRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/specialties', specialtyRoutes);
app.use('/api/test', testRoutes);

// Bull Board - Dashboard de Filas
app.use('/admin', queuesDashboardRoutes);

// Rotas do Google Calendar
app.use('/api', googleCalendarRoutes);

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

app.get(['/crm', '/pipeline', '/vendas'], (req, res) => {
    res.sendFile(path.join(__dirname, 'applications/crm-pipeline/index.html'));
});

app.get(['/portal', '/minha-clinica'], (req, res) => {
    res.sendFile(path.join(__dirname, 'applications/clinic-portal/index.html'));
});

// Landing de aplicações internas
app.get('/apps', (req, res) => {
    res.sendFile(path.join(__dirname, 'applications/index.html'));
});

// Confirmação/cancelamento públicos por link
app.get('/confirmar/:id', async (req, res) => {
    try {
        const Appointment = require('./models/Appointment');
        const appt = await Appointment.findById(req.params.id);
        if (!appt) return res.status(404).send('Agendamento não encontrado');
        // Se houver token salvo, exigir match quando query.token presente
        const token = req.query.token;
        const hasToken = appt.confirmations?.patient?.confirmationToken;
        if (hasToken && token && token !== hasToken) {
            return res.status(403).send('Token inválido');
        }
        await appt.confirm('link');
        res.send('<html><body style="font-family:Arial; text-align:center; padding:40px;">✅ Presença confirmada com sucesso.</body></html>');
    } catch (e) {
        logger.error('Erro ao confirmar por link:', e);
        res.status(500).send('Erro ao confirmar');
    }
});

app.get('/cancelar/:id', async (req, res) => {
    try {
        const Appointment = require('./models/Appointment');
        const appt = await Appointment.findById(req.params.id);
        if (!appt) return res.status(404).send('Agendamento não encontrado');
        const token = req.query.token;
        const hasToken = appt.confirmations?.patient?.confirmationToken;
        if (hasToken && token && token !== hasToken) {
            return res.status(403).send('Token inválido');
        }
        await appt.cancel('patient', 'Cancelado via link');
        res.send('<html><body style="font-family:Arial; text-align:center; padding:40px;">❌ Consulta cancelada com sucesso.</body></html>');
    } catch (e) {
        logger.error('Erro ao cancelar por link:', e);
        res.status(500).send('Erro ao cancelar');
    }
});

// Rotas para páginas do site principal (com e sem .html)
app.get(['/sobre', '/sobre.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'site/sobre.html'));
});

app.get(['/servicos', '/servicos.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'site/servicos.html'));
});

app.get(['/planos', '/planos.html', '/precos', '/pricing'], (req, res) => {
    res.sendFile(path.join(__dirname, 'site/planos.html'));
});

app.get(['/login', '/login.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'site/login.html'));
});

app.get(['/index', '/index.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'site/index.html'));
});

// Páginas legais
app.get(['/termos-de-uso', '/termos', '/termos.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'site/termos-de-uso.html'));
});

app.get(['/politica-de-privacidade', '/privacidade', '/politica-de-privacidade.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'site/politica-de-privacidade.html'));
});

app.get(['/politica-de-cookies', '/cookies', '/politica-de-cookies.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'site/politica-de-cookies.html'));
});

// Página pública de clínica
app.get('/clinica/:slug', (req, res) => {
    res.sendFile(path.join(__dirname, 'applications/clinic-page/index.html'));
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

// Sentry error handler (deve vir antes do errorHandler customizado)
app.use(sentryHandlers.errorHandler);

// Middleware de tratamento de erros
app.use(errorHandler);

// Iniciar servidor
const server = app.listen(PORT, () => {
    const BASE_URL = process.env.APP_URL || (process.env.NODE_ENV === 'production' 
        ? 'https://atenmed.com.br' 
        : `http://localhost:${PORT}`);
    logger.info(`🚀 Servidor AtenMed rodando na porta ${PORT}`);
    logger.info(`📊 Ambiente: ${process.env.NODE_ENV}`);
    logger.info(`🌐 Health check: ${BASE_URL}/health`);
    logger.info(`📱 Frontend: ${BASE_URL}`);
    logger.info(`🔗 API: ${BASE_URL}/api`);
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

