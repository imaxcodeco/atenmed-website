/**
 * Script para popular o banco de dados com dados de exemplo
 * para o sistema de Agendamento Inteligente
 * 
 * USO: node scripts/seed-scheduling.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Clinic = require('../models/Clinic');
const Specialty = require('../models/Specialty');
const Doctor = require('../models/Doctor');

const logger = {
    info: (msg) => console.log(`ℹ️  ${msg}`),
    success: (msg) => console.log(`✅ ${msg}`),
    error: (msg) => console.error(`❌ ${msg}`),
    warn: (msg) => console.warn(`⚠️  ${msg}`)
};

async function seedDatabase() {
    try {
        logger.info('Iniciando seed do banco de dados...');
        
        // Conectar ao MongoDB
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/atenmed';
        await mongoose.connect(mongoURI);
        logger.success('Conectado ao MongoDB');
        
        // Limpar dados existentes (CUIDADO EM PRODUÇÃO!)
        logger.warn('Removendo dados existentes...');
        await Clinic.deleteMany({});
        await Specialty.deleteMany({});
        await Doctor.deleteMany({});
        logger.success('Dados existentes removidos');
        
        // ===== CRIAR CLÍNICAS =====
        logger.info('Criando clínicas...');
        
        const clinicCoracaoSaudavel = await Clinic.create({
            name: 'Clínica Coração Saudável',
            description: 'Clínica especializada em cardiologia e clínica geral',
            address: {
                street: 'Av. Paulista',
                number: '1000',
                complement: 'Conjunto 501',
                neighborhood: 'Bela Vista',
                city: 'São Paulo',
                state: 'SP',
                zipCode: '01310-100'
            },
            contact: {
                phone: '(11) 3000-0000',
                email: 'contato@coracaosaudavel.com.br',
                whatsapp: '(11) 99999-9999'
            },
            workingHours: { start: 8, end: 18 },
            slotDuration: 60,
            active: true,
            settings: {
                allowWeekends: false,
                autoConfirmAppointments: true,
                sendEmailNotifications: true,
                sendWhatsAppNotifications: true
            }
        });
        
        const clinicaSorrisoPerfeito = await Clinic.create({
            name: 'Clínica Sorriso Perfeito',
            description: 'Clínica odontológica completa',
            address: {
                street: 'Rua Augusta',
                number: '2500',
                neighborhood: 'Consolação',
                city: 'São Paulo',
                state: 'SP',
                zipCode: '01413-000'
            },
            contact: {
                phone: '(11) 3100-0000',
                email: 'contato@sorrisoperfeito.com.br',
                whatsapp: '(11) 98888-8888'
            },
            workingHours: { start: 9, end: 19 },
            slotDuration: 60,
            active: true
        });
        
        logger.success(`Clínicas criadas: ${clinicCoracaoSaudavel.name}, ${clinicaSorrisoPerfeito.name}`);
        
        // ===== CRIAR ESPECIALIDADES =====
        logger.info('Criando especialidades...');
        
        const cardiologia = await Specialty.create({
            name: 'Cardiologia',
            clinic: clinicCoracaoSaudavel._id,
            description: 'Especialidade médica que cuida do coração e sistema cardiovascular',
            color: '#e74c3c',
            icon: '❤️',
            active: true,
            defaultDuration: 60,
            requiresPreparation: true,
            preparationInstructions: 'Trazer exames anteriores de coração (se houver). Evitar cafeína 3 horas antes.'
        });
        
        const clinicaGeral = await Specialty.create({
            name: 'Clínica Geral',
            clinic: clinicCoracaoSaudavel._id,
            description: 'Atendimento médico geral e preventivo',
            color: '#45a7b1',
            icon: '🏥',
            active: true,
            defaultDuration: 45
        });
        
        const odontologia = await Specialty.create({
            name: 'Odontologia',
            clinic: clinicaSorrisoPerfeito._id,
            description: 'Cuidados com saúde bucal',
            color: '#2ecc71',
            icon: '🦷',
            active: true,
            defaultDuration: 60
        });
        
        const ortodontia = await Specialty.create({
            name: 'Ortodontia',
            clinic: clinicaSorrisoPerfeito._id,
            description: 'Correção de posicionamento dental com aparelhos',
            color: '#3498db',
            icon: '😁',
            active: true,
            defaultDuration: 45
        });
        
        logger.success(`Especialidades criadas: ${cardiologia.name}, ${clinicaGeral.name}, ${odontologia.name}, ${ortodontia.name}`);
        
        // ===== CRIAR MÉDICOS =====
        logger.info('Criando médicos...');
        
        logger.warn(`
        
⚠️  IMPORTANTE: Configure os IDs dos Google Calendars!

Para cada médico abaixo, você precisa:
1. Criar um calendário no Google Calendar
2. Copiar o ID do calendário (ex: abc123@group.calendar.google.com)
3. Substituir 'CONFIGURE_GOOGLE_CALENDAR_ID' pelo ID real

Exemplo:
googleCalendarId: 'drjoao@gmail.com' 
ou
googleCalendarId: 'abc123xyz@group.calendar.google.com'

        `);
        
        const drJoaoSilva = await Doctor.create({
            name: 'Dr. João Silva',
            email: 'joao.silva@coracaosaudavel.com.br',
            phone: '(11) 98888-8888',
            crm: {
                number: '123456',
                state: 'SP'
            },
            specialties: [cardiologia._id],
            clinic: clinicCoracaoSaudavel._id,
            googleCalendarId: 'CONFIGURE_GOOGLE_CALENDAR_ID_DR_JOAO', // ⚠️ CONFIGURAR
            googleCalendarEmail: 'drjoao.calendario@gmail.com', // ⚠️ CONFIGURAR
            workingDays: [1, 2, 3, 4, 5], // Segunda a Sexta
            workingHours: { start: 9, end: 17 },
            slotDuration: 60,
            active: true,
            acceptsNewPatients: true,
            bio: 'Cardiologista com 15 anos de experiência. Especialista em hipertensão e arritmias.',
            languages: ['Português', 'Inglês'],
            notifications: {
                email: true,
                whatsapp: true
            }
        });
        
        const draMariaOliveira = await Doctor.create({
            name: 'Dra. Maria Oliveira',
            email: 'maria.oliveira@coracaosaudavel.com.br',
            phone: '(11) 97777-7777',
            crm: {
                number: '234567',
                state: 'SP'
            },
            specialties: [clinicaGeral._id],
            clinic: clinicCoracaoSaudavel._id,
            googleCalendarId: 'CONFIGURE_GOOGLE_CALENDAR_ID_DRA_MARIA', // ⚠️ CONFIGURAR
            googleCalendarEmail: 'dramaria.calendario@gmail.com', // ⚠️ CONFIGURAR
            workingDays: [1, 2, 3, 4, 5],
            workingHours: { start: 8, end: 18 },
            slotDuration: 45,
            active: true,
            acceptsNewPatients: true,
            bio: 'Médica generalista com foco em medicina preventiva e saúde da família.',
            notifications: {
                email: true,
                whatsapp: true
            }
        });
        
        const drPedroSantos = await Doctor.create({
            name: 'Dr. Pedro Santos',
            email: 'pedro.santos@sorrisoperfeito.com.br',
            phone: '(11) 96666-6666',
            crm: {
                number: '345678',
                state: 'SP'
            },
            specialties: [odontologia._id, ortodontia._id],
            clinic: clinicaSorrisoPerfeito._id,
            googleCalendarId: 'CONFIGURE_GOOGLE_CALENDAR_ID_DR_PEDRO', // ⚠️ CONFIGURAR
            googleCalendarEmail: 'drpedro.calendario@gmail.com', // ⚠️ CONFIGURAR
            workingDays: [1, 2, 3, 4, 5],
            workingHours: { start: 9, end: 19 },
            slotDuration: 60,
            active: true,
            acceptsNewPatients: true,
            bio: 'Dentista com especialização em ortodontia. 10 anos de experiência em aparelhos ortodônticos.',
            notifications: {
                email: true,
                whatsapp: false
            }
        });
        
        logger.success(`Médicos criados: ${drJoaoSilva.name}, ${draMariaOliveira.name}, ${drPedroSantos.name}`);
        
        // ===== RESUMO =====
        logger.success('\n✅ Seed concluído com sucesso!\n');
        
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📊 RESUMO DO BANCO DE DADOS');
        console.log('═══════════════════════════════════════════════════════════\n');
        
        console.log('🏢 CLÍNICAS:');
        console.log(`   - ${clinicCoracaoSaudavel.name} (ID: ${clinicCoracaoSaudavel._id})`);
        console.log(`   - ${clinicaSorrisoPerfeito.name} (ID: ${clinicaSorrisoPerfeito._id})\n`);
        
        console.log('🏥 ESPECIALIDADES:');
        console.log(`   - ${cardiologia.name} (ID: ${cardiologia._id})`);
        console.log(`   - ${clinicaGeral.name} (ID: ${clinicaGeral._id})`);
        console.log(`   - ${odontologia.name} (ID: ${odontologia._id})`);
        console.log(`   - ${ortodontia.name} (ID: ${ortodontia._id})\n`);
        
        console.log('👨‍⚕️ MÉDICOS:');
        console.log(`   - ${drJoaoSilva.name} - ${cardiologia.name}`);
        console.log(`     ID: ${drJoaoSilva._id}`);
        console.log(`     Google Calendar: ${drJoaoSilva.googleCalendarId} ⚠️  CONFIGURAR`);
        console.log('');
        console.log(`   - ${draMariaOliveira.name} - ${clinicaGeral.name}`);
        console.log(`     ID: ${draMariaOliveira._id}`);
        console.log(`     Google Calendar: ${draMariaOliveira.googleCalendarId} ⚠️  CONFIGURAR`);
        console.log('');
        console.log(`   - ${drPedroSantos.name} - ${odontologia.name}, ${ortodontia.name}`);
        console.log(`     ID: ${drPedroSantos._id}`);
        console.log(`     Google Calendar: ${drPedroSantos.googleCalendarId} ⚠️  CONFIGURAR\n`);
        
        console.log('═══════════════════════════════════════════════════════════');
        console.log('⚠️  PRÓXIMOS PASSOS:');
        console.log('═══════════════════════════════════════════════════════════\n');
        console.log('1. Configure os Google Calendar IDs para cada médico:');
        console.log('   - Acesse o MongoDB');
        console.log('   - Atualize o campo googleCalendarId de cada médico');
        console.log('   - Exemplo: db.doctors.updateOne(');
        console.log('       { _id: ObjectId("...") },');
        console.log('       { $set: { googleCalendarId: "drjoao@gmail.com" } }');
        console.log('     )\n');
        console.log('2. Autentique o sistema com Google Calendar:');
        console.log('   - Acesse: http://localhost:3000/agendamento');
        console.log('   - Vá na aba "Google Calendar"');
        console.log('   - Clique em "Autenticar com Google"\n');
        console.log('3. Teste o agendamento:');
        console.log('   - Via API ou interface administrativa\n');
        console.log('═══════════════════════════════════════════════════════════\n');
        
    } catch (error) {
        logger.error(`Erro ao popular banco de dados: ${error.message}`);
        console.error(error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        logger.info('Desconectado do MongoDB');
        process.exit(0);
    }
}

// Executar seed
seedDatabase();

