/**
 * Script para criar usuário administrador
 * Execute: node scripts/create-admin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Importar modelo User real
const User = require('../models/User');

async function createAdmin() {
    try {
        console.log('🔌 Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado ao MongoDB\n');

        // Verificar se já existe admin
        const existingAdmin = await User.findOne({ email: 'admin@atenmed.com.br' });
        
        if (existingAdmin) {
            console.log('⚠️  Usuário admin já existe!');
            console.log('📧 Email:', existingAdmin.email);
            console.log('👤 Nome:', existingAdmin.nome);
            console.log('🔑 Role:', existingAdmin.role);
            console.log('\n💡 Deletando usuário antigo para recriar...');
            await User.deleteOne({ email: 'admin@atenmed.com.br' });
            console.log('✅ Usuário antigo deletado');
        }

        // Criar admin (a senha será hasheada automaticamente pelo pre-save hook)
        const admin = await User.create({
            nome: 'Administrador',
            email: 'admin@atenmed.com.br',
            senha: 'admin123',
            role: 'admin',
            ativo: true
        });

        console.log('✅ Usuário administrador criado com sucesso!\n');
        console.log('📋 Credenciais de Acesso:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email: admin@atenmed.com.br');
        console.log('🔑 Senha: admin123');
        console.log('👤 Nome: Administrador');
        console.log('🎯 Role: admin');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('🌐 Acesse: https://atenmed.com.br/site/login.html');
        console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!\n');

    } catch (error) {
        console.error('❌ Erro ao criar admin:', error.message);
        if (error.code === 11000) {
            console.log('\n💡 Já existe um usuário com este email');
        }
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Conexão fechada');
        process.exit(0);
    }
}

// Executar
createAdmin();

