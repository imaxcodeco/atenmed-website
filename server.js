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

// Importar middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();
const PORT = process.env.PORT || 3000;

// Conectar ao banco de dados
connectDB();

// Middleware de segurança
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"],
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

// Rotas específicas para aplicações
app.get('/whatsapp', (req, res) => {
    res.sendFile(path.join(__dirname, 'applications/whatsapp-automation/whatsapp-admin.html'));
});

app.get('/cost-monitoring', (req, res) => {
    res.sendFile(path.join(__dirname, 'applications/cost-monitoring/cost-monitoring.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'applications/admin-dashboard/dashboard.html'));
});

// Rota para servir o site principal
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

