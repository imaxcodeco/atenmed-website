const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Conectar ao MongoDB
async function connectDB() {
    try {
        // Usar MongoDB Atlas (cloud) ou local
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/atenmed';
        
        if (process.env.MONGODB_URI) {
            await mongoose.connect(mongoURI);
            console.log('🗄️ MongoDB Atlas conectado com sucesso!');
        } else {
            console.log('⚠️ MongoDB não configurado - usando modo desenvolvimento');
        }
    } catch (error) {
        console.log('⚠️ MongoDB não disponível - continuando sem banco de dados');
    }
}

// Conectar ao banco
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
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:8000', 'http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
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

// Compressão
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname)));

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
        database: 'Not connected (development mode)'
    });
});

// API Routes básicas (com banco de dados)
app.get('/api/leads', async (req, res) => {
    try {
        if (mongoose.connection.readyState === 1) {
            const Lead = require('./models/Lead');
            const leads = await Lead.find().sort({ createdAt: -1 }).limit(50);
            res.json({
                success: true,
                data: leads
            });
        } else {
            // Fallback para modo desenvolvimento
            res.json({
                success: true,
                data: []
            });
        }
    } catch (error) {
        console.error('Erro ao buscar leads:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

app.get('/api/services', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: 1,
                nome: 'Automação WhatsApp',
                descricao: 'Sistema completo de automação para WhatsApp Business',
                preco: 'R$ 97/mês',
                features: ['Respostas automáticas', 'Agendamento', 'Integração CRM']
            },
            {
                id: 2,
                nome: 'Agendamento Inteligente',
                descricao: 'Sistema de agendamento com IA',
                preco: 'R$ 147/mês',
                features: ['IA para otimização', 'Lembretes automáticos', 'Integração calendário']
            },
            {
                id: 3,
                nome: 'Criação de Sites',
                descricao: 'Sites profissionais para consultórios',
                preco: 'R$ 297/mês',
                features: ['Design responsivo', 'SEO otimizado', 'Integração WhatsApp']
            }
        ]
    });
});

// Rota para criar lead (com banco de dados)
app.post('/api/leads', async (req, res) => {
    const { nome, email, telefone, especialidade, interesse } = req.body;
    
    // Validação básica
    if (!nome || !email || !telefone || !especialidade) {
        return res.status(400).json({
            success: false,
            error: 'Dados obrigatórios: nome, email, telefone, especialidade'
        });
    }
    
    try {
        // Se MongoDB estiver disponível, salvar no banco
        if (mongoose.connection.readyState === 1) {
            const Lead = require('./models/Lead');
            const lead = new Lead({
                nome,
                email,
                telefone,
                especialidade,
                interesse: interesse || [],
                status: 'novo'
            });
            
            await lead.save();
            console.log('🎯 Novo lead salvo no banco:', lead);
            
            res.status(201).json({
                success: true,
                message: 'Lead criado com sucesso!',
                data: lead
            });
        } else {
            // Fallback para modo desenvolvimento
            const lead = {
                id: Date.now(),
                nome,
                email,
                telefone,
                especialidade,
                interesse: interesse || [],
                status: 'novo',
                createdAt: new Date().toISOString()
            };
            
            console.log('🎯 Novo lead recebido (modo desenvolvimento):', lead);
            
            res.status(201).json({
                success: true,
                message: 'Lead criado com sucesso!',
                data: lead
            });
        }
    } catch (error) {
        console.error('Erro ao criar lead:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Rota para criar contato (mock)
app.post('/api/contact', (req, res) => {
    const { nome, email, telefone, assunto, mensagem, categoria, prioridade } = req.body;
    
    // Validação básica
    if (!nome || !email || !assunto || !mensagem) {
        return res.status(400).json({
            success: false,
            error: 'Dados obrigatórios: nome, email, assunto, mensagem'
        });
    }
    
    // Simular criação de contato
    const contact = {
        id: Date.now(),
        nome,
        email,
        telefone,
        assunto,
        mensagem,
        categoria: categoria || 'duvida',
        prioridade: prioridade || 'media',
        status: 'novo',
        createdAt: new Date().toISOString()
    };
    
    console.log('📧 Novo contato recebido:', contact);
    
    res.status(201).json({
        success: true,
        message: 'Contato enviado com sucesso!',
        data: contact
    });
});

// Rota para servir o frontend
app.get('*', (req, res) => {
    // Se for uma rota da API, retornar 404
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint não encontrado' });
    }
    
    // Servir o index.html do frontend
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor AtenMed (Desenvolvimento) rodando na porta ${PORT}`);
    console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
    console.log(`⚠️  Modo desenvolvimento - sem banco de dados`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM recebido, encerrando servidor graciosamente...');
    server.close(() => {
        console.log('Servidor encerrado');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT recebido, encerrando servidor graciosamente...');
    server.close(() => {
        console.log('Servidor encerrado');
        process.exit(0);
    });
});

module.exports = app;
