const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
    try {
        // Para desenvolvimento, vamos usar uma string de conexão que não falhe
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/atenmed';
        
        // Se não conseguir conectar, vamos continuar sem banco por enquanto
        if (!process.env.MONGODB_URI) {
            logger.warn('⚠️ MongoDB não configurado - algumas funcionalidades podem não funcionar');
            return;
        }
        
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10, // Manter até 10 conexões no pool
            serverSelectionTimeoutMS: 5000, // Manter tentando por 5 segundos
            socketTimeoutMS: 45000, // Fechar sockets após 45 segundos de inatividade
            // bufferMaxEntries removido - não suportado na versão atual
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
        process.exit(1);
    }
};

module.exports = connectDB;

