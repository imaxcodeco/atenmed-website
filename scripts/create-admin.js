/**
 * Script para criar usuário administrador
 * Execute: node scripts/create-admin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Modelo User inline (para evitar dependências circulares)
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);

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
            console.log('👤 Nome:', existingAdmin.name);
            console.log('🔑 Role:', existingAdmin.role);
            console.log('\n💡 Para resetar a senha, delete o usuário primeiro no MongoDB Atlas');
            return;
        }

        // Hash da senha
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // Criar admin
        const admin = await User.create({
            name: 'Administrador',
            email: 'admin@atenmed.com.br',
            password: hashedPassword,
            role: 'admin',
            active: true
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

