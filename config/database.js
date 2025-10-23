const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
    try {
        // Validar MongoDB URI em produção
        if (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI) {
            logger.error('❌ MONGODB_URI é obrigatório em produção');
            process.exit(1);
        }
        
        // Para desenvolvimento, usar local se não configurado
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/atenmed';
        
        // Avisar em desenvolvimento se não estiver configurado
        if (!process.env.MONGODB_URI && process.env.NODE_ENV !== 'production') {
            logger.warn('⚠️ MongoDB não configurado - usando local mongodb://localhost:27017/atenmed');
        }
        
        const options = {
            // useNewUrlParser e useUnifiedTopology removidos - deprecated desde Node.js Driver 4.0.0
            maxPoolSize: 10, // Manter até 10 conexões no pool
            serverSelectionTimeoutMS: 5000, // Manter tentando por 5 segundos
            socketTimeoutMS: 45000, // Fechar sockets após 45 segundos de inatividade
            bufferCommands: false, // Desabilitar mongoose buffering
        };

        const conn = await mongoose.connect(mongoURI, options);

        logger.info(`🗄️  MongoDB conectado: ${conn.connection.host}`);
        
        // Event listeners para monitoramento
        mongoose.connection.on('connected', () => {
            logger.info('Mongoose conectado ao MongoDB');
        });

        mongoose.connection.on('error', (err) => {
            logger.error('Erro na conexão MongoDB:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('Mongoose desconectado do MongoDB');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            logger.info('Conexão MongoDB fechada devido ao encerramento da aplicação');
            process.exit(0);
        });

    } catch (error) {
        logger.error('Erro ao conectar com MongoDB:', error);
        
        // Em produção, falhar imediatamente se não conseguir conectar
        if (process.env.NODE_ENV === 'production') {
            logger.error('❌ Falha crítica: não foi possível conectar ao MongoDB em produção');
            process.exit(1);
        }
        
        // Em desenvolvimento, apenas avisar e continuar
        logger.warn('⚠️ Continuando sem banco de dados - algumas funcionalidades podem não funcionar');
    }
};

module.exports = connectDB;

