const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const logger = require('../utils/logger');
require('dotenv').config();

async function initializeDatabase() {
    try {
        // Conectar ao MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/atenmed');
        logger.info('🗄️ Conectado ao MongoDB');

        // Verificar se já existe um usuário admin
        const adminExists = await User.findOne({ role: 'admin' });
        
        if (adminExists) {
            logger.info('👤 Usuário admin já existe');
            return;
        }

        // Criar usuário admin padrão
        const adminUser = new User({
            nome: 'Administrador AtenMed',
            email: 'admin@atenmed.com.br',
            senha: 'admin123', // Senha padrão - deve ser alterada
            role: 'admin',
            ativo: true,
            departamento: 'administracao',
            permissoes: [
                'leads:read',
                'leads:write',
                'leads:delete',
                'users:read',
                'users:write',
                'users:delete',
                'admin:access',
                'reports:view'
            ]
        });

        await adminUser.save();
        
        logger.info('✅ Usuário admin criado com sucesso');
        logger.info('📧 Email: admin@atenmed.com.br');
        logger.info('🔑 Senha: admin123');
        logger.warn('⚠️  IMPORTANTE: Altere a senha padrão após o primeiro login!');

        // Criar usuário vendedor de exemplo
        const vendedorUser = new User({
            nome: 'Vendedor AtenMed',
            email: 'vendas@atenmed.com.br',
            senha: 'vendas123',
            role: 'vendedor',
            ativo: true,
            departamento: 'vendas',
            permissoes: [
                'leads:read',
                'leads:write',
                'reports:view'
            ]
        });

        await vendedorUser.save();
        logger.info('✅ Usuário vendedor criado com sucesso');

        // Criar usuário de suporte
        const suporteUser = new User({
            nome: 'Suporte AtenMed',
            email: 'suporte@atenmed.com.br',
            senha: 'suporte123',
            role: 'suporte',
            ativo: true,
            departamento: 'suporte',
            permissoes: [
                'leads:read',
                'reports:view'
            ]
        });

        await suporteUser.save();
        logger.info('✅ Usuário suporte criado com sucesso');

        logger.info('🎉 Inicialização do banco de dados concluída!');
        logger.info('📋 Usuários criados:');
        logger.info('   - Admin: admin@atenmed.com.br (admin123)');
        logger.info('   - Vendas: vendas@atenmed.com.br (vendas123)');
        logger.info('   - Suporte: suporte@atenmed.com.br (suporte123)');

    } catch (error) {
        logger.error('❌ Erro ao inicializar banco de dados:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        logger.info('🔌 Conexão com MongoDB fechada');
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    initializeDatabase();
}

module.exports = initializeDatabase;










