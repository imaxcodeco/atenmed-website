/**
 * Script para popular o banco com dados de exemplo
 * Execute: node scripts/seed-all.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schemas inline
const clientSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    clinic: String,
    specialty: String,
    applications: [String],
    subscription: String,
    status: String,
    createdAt: { type: Date, default: Date.now }
});

const leadSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    clinic: String,
    specialty: String,
    interest: String,
    source: String,
    status: String,
    createdAt: { type: Date, default: Date.now }
});

const contactSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    message: String,
    status: String,
    createdAt: { type: Date, default: Date.now }
});

const Client = mongoose.model('Client', clientSchema);
const Lead = mongoose.model('Lead', leadSchema);
const Contact = mongoose.model('Contact', contactSchema);

// Dados de exemplo
const sampleClients = [
    {
        name: 'Dr. Carlos Mendes',
        email: 'carlos.mendes@clinicacoracaosaudavel.com.br',
        phone: '(11) 98765-4321',
        clinic: 'Clínica Coração Saudável',
        specialty: 'Cardiologia',
        applications: ['whatsapp', 'calendar', 'website'],
        subscription: 'premium',
        status: 'active'
    },
    {
        name: 'Dra. Ana Silva',
        email: 'ana.silva@sorrisoperfeito.com.br',
        phone: '(11) 97654-3210',
        clinic: 'Clínica Sorriso Perfeito',
        specialty: 'Odontologia',
        applications: ['whatsapp', 'calendar'],
        subscription: 'pro',
        status: 'active'
    },
    {
        name: 'Dr. Roberto Santos',
        email: 'roberto.santos@ortopediavida.com.br',
        phone: '(11) 96543-2109',
        clinic: 'Ortopedia Vida',
        specialty: 'Ortopedia',
        applications: ['whatsapp'],
        subscription: 'basic',
        status: 'active'
    }
];

const sampleLeads = [
    {
        name: 'Dra. Mariana Costa',
        email: 'mariana.costa@example.com',
        phone: '(11) 95432-1098',
        clinic: 'Clínica Dermatologia Avançada',
        specialty: 'Dermatologia',
        interest: 'whatsapp,calendar,website',
        source: 'google',
        status: 'new'
    },
    {
        name: 'Dr. Paulo Oliveira',
        email: 'paulo.oliveira@example.com',
        phone: '(11) 94321-0987',
        clinic: 'Consultório Dr. Paulo',
        specialty: 'Pediatria',
        interest: 'whatsapp,calendar',
        source: 'facebook',
        status: 'contacted'
    },
    {
        name: 'Dra. Juliana Almeida',
        email: 'juliana.almeida@example.com',
        phone: '(11) 93210-9876',
        clinic: 'Ginecologia Feminina',
        specialty: 'Ginecologia',
        interest: 'whatsapp',
        source: 'instagram',
        status: 'new'
    }
];

const sampleContacts = [
    {
        name: 'Fernando Lima',
        email: 'fernando.lima@example.com',
        phone: '(11) 92109-8765',
        message: 'Gostaria de saber mais sobre os planos e preços da AtenMed.',
        status: 'pending'
    },
    {
        name: 'Patricia Rodrigues',
        email: 'patricia.rodrigues@example.com',
        phone: '(11) 91098-7654',
        message: 'Preciso de uma demonstração do sistema de agendamento inteligente.',
        status: 'pending'
    }
];

async function seedDatabase() {
    try {
        console.log('🔌 Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado ao MongoDB\n');

        // Limpar dados existentes (opcional)
        console.log('🗑️  Limpando dados antigos...');
        await Client.deleteMany({});
        await Lead.deleteMany({});
        await Contact.deleteMany({});
        console.log('✅ Dados antigos removidos\n');

        // Inserir clientes
        console.log('👥 Inserindo clientes...');
        const clients = await Client.insertMany(sampleClients);
        console.log(`✅ ${clients.length} clientes criados\n`);

        // Inserir leads
        console.log('🎯 Inserindo leads...');
        const leads = await Lead.insertMany(sampleLeads);
        console.log(`✅ ${leads.length} leads criados\n`);

        // Inserir contatos
        console.log('📧 Inserindo contatos...');
        const contacts = await Contact.insertMany(sampleContacts);
        console.log(`✅ ${contacts.length} contatos criados\n`);

        // Resumo
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 RESUMO DO SEED');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`👥 Clientes: ${clients.length}`);
        console.log(`🎯 Leads: ${leads.length}`);
        console.log(`📧 Contatos: ${contacts.length}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('✅ Seed concluído com sucesso!\n');
        console.log('🌐 Acesse a dashboard para visualizar:');
        console.log('   https://atenmed.com.br/apps/admin/dashboard.html\n');

    } catch (error) {
        console.error('❌ Erro ao fazer seed:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Conexão fechada');
        process.exit(0);
    }
}

// Executar
seedDatabase();

