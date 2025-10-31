/**
 * Script para criar clínicas de exemplo
 * Uso: node scripts/seed-clinics.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Clinic = require('../models/Clinic');
const Doctor = require('../models/Doctor');
const Specialty = require('../models/Specialty');
const logger = require('../utils/logger');

// Conectar ao banco
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/atenmed')
    .then(() => logger.info('✅ Conectado ao MongoDB'))
    .catch(err => {
        logger.error('Erro ao conectar:', err);
        process.exit(1);
    });

// Dados de exemplo
const clinicsData = [
    {
        name: 'Clínica São Paulo',
        slug: 'clinica-sao-paulo',
        description: 'Clínica especializada em cardiologia e clínica geral, com mais de 20 anos de experiência no mercado.',
        slogan: 'Cuidando do seu coração',
        logo: '/assets/images/clinic-logos/clinica-sp.png',
        address: {
            street: 'Av. Paulista',
            number: '1000',
            complement: 'Conj. 1501',
            neighborhood: 'Bela Vista',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01310-100',
            coordinates: {
                lat: -23.561684,
                lng: -46.655981
            }
        },
        contact: {
            phone: '(11) 3000-0000',
            email: 'contato@clinicasp.com.br',
            whatsapp: '5511999990000',
            website: 'https://clinicasp.com.br'
        },
        workingHours: {
            start: 8,
            end: 18,
            formatted: 'Seg-Sex: 8h às 18h',
            monday: { start: '08:00', end: '18:00', closed: false },
            tuesday: { start: '08:00', end: '18:00', closed: false },
            wednesday: { start: '08:00', end: '18:00', closed: false },
            thursday: { start: '08:00', end: '18:00', closed: false },
            friday: { start: '08:00', end: '18:00', closed: false },
            saturday: { start: '08:00', end: '13:00', closed: false },
            sunday: { start: '00:00', end: '00:00', closed: true }
        },
        social: {
            facebook: 'https://facebook.com/clinicasp',
            instagram: 'https://instagram.com/clinicasp',
            linkedin: 'https://linkedin.com/company/clinicasp'
        },
        branding: {
            primaryColor: '#0066cc',
            secondaryColor: '#003366',
            accentColor: '#66ccff'
        },
        insurance: [
            { name: 'Unimed', active: true },
            { name: 'Bradesco Saúde', active: true },
            { name: 'SulAmérica', active: true },
            { name: 'Amil', active: true }
        ],
        amenities: ['wifi', 'estacionamento', 'acessibilidade', 'cafeteria', 'sala-espera'],
        rating: {
            average: 4.8,
            count: 156
        },
        stats: {
            totalAppointments: 1250,
            activePatients: 450,
            pageViews: 3200
        }
    },
    {
        name: 'Clínica Rio de Janeiro',
        slug: 'clinica-rio-de-janeiro',
        description: 'Centro médico completo com diversas especialidades e equipamentos de última geração.',
        slogan: 'Sua saúde em boas mãos',
        logo: '/assets/images/clinic-logos/clinica-rj.png',
        address: {
            street: 'Av. Atlântica',
            number: '500',
            complement: 'Sala 201',
            neighborhood: 'Copacabana',
            city: 'Rio de Janeiro',
            state: 'RJ',
            zipCode: '22010-000',
            coordinates: {
                lat: -22.968140,
                lng: -43.177410
            }
        },
        contact: {
            phone: '(21) 2000-0000',
            email: 'contato@clinicarj.com.br',
            whatsapp: '5521999990000',
            website: 'https://clinicarj.com.br'
        },
        workingHours: {
            start: 7,
            end: 19,
            formatted: 'Seg-Sáb: 7h às 19h',
            monday: { start: '07:00', end: '19:00', closed: false },
            tuesday: { start: '07:00', end: '19:00', closed: false },
            wednesday: { start: '07:00', end: '19:00', closed: false },
            thursday: { start: '07:00', end: '19:00', closed: false },
            friday: { start: '07:00', end: '19:00', closed: false },
            saturday: { start: '07:00', end: '14:00', closed: false },
            sunday: { start: '00:00', end: '00:00', closed: true }
        },
        social: {
            facebook: 'https://facebook.com/clinicarj',
            instagram: 'https://instagram.com/clinicarj'
        },
        branding: {
            primaryColor: '#ff6b6b',
            secondaryColor: '#c92a2a',
            accentColor: '#ff8787'
        },
        insurance: [
            { name: 'Unimed', active: true },
            { name: 'Golden Cross', active: true },
            { name: 'Porto Seguro', active: true }
        ],
        amenities: ['wifi', 'estacionamento', 'acessibilidade'],
        rating: {
            average: 4.6,
            count: 89
        },
        stats: {
            totalAppointments: 890,
            activePatients: 320,
            pageViews: 1800
        }
    },
    {
        name: 'Clínica Belo Horizonte',
        slug: 'clinica-belo-horizonte',
        description: 'Excelência em atendimento médico com foco em medicina preventiva e qualidade de vida.',
        slogan: 'Prevenção é o melhor remédio',
        logo: '/assets/images/clinic-logos/clinica-bh.png',
        address: {
            street: 'Av. Afonso Pena',
            number: '1500',
            neighborhood: 'Centro',
            city: 'Belo Horizonte',
            state: 'MG',
            zipCode: '30130-005',
            coordinates: {
                lat: -19.920840,
                lng: -43.938320
            }
        },
        contact: {
            phone: '(31) 3500-0000',
            email: 'contato@clinicabh.com.br',
            whatsapp: '5531999990000',
            website: 'https://clinicabh.com.br'
        },
        workingHours: {
            start: 8,
            end: 20,
            formatted: 'Seg-Sex: 8h às 20h',
            monday: { start: '08:00', end: '20:00', closed: false },
            tuesday: { start: '08:00', end: '20:00', closed: false },
            wednesday: { start: '08:00', end: '20:00', closed: false },
            thursday: { start: '08:00', end: '20:00', closed: false },
            friday: { start: '08:00', end: '20:00', closed: false },
            saturday: { start: '00:00', end: '00:00', closed: true },
            sunday: { start: '00:00', end: '00:00', closed: true }
        },
        social: {
            facebook: 'https://facebook.com/clinicabh',
            instagram: 'https://instagram.com/clinicabh',
            linkedin: 'https://linkedin.com/company/clinicabh',
            youtube: 'https://youtube.com/@clinicabh'
        },
        branding: {
            primaryColor: '#20c997',
            secondaryColor: '#0f5132',
            accentColor: '#51cf66'
        },
        insurance: [
            { name: 'Unimed', active: true },
            { name: 'Saúde Caixa', active: true },
            { name: 'Geap', active: true },
            { name: 'Cassi', active: true }
        ],
        amenities: ['wifi', 'estacionamento', 'acessibilidade', 'sala-espera'],
        rating: {
            average: 4.9,
            count: 201
        },
        stats: {
            totalAppointments: 1580,
            activePatients: 620,
            pageViews: 4100
        },
        subscription: {
            plan: 'pro',
            status: 'active',
            startDate: new Date('2024-01-01'),
            autoRenew: true
        }
    }
];

async function seedClinics() {
    try {
        logger.info('🌱 Iniciando seed de clínicas...');
        
        // Limpar clínicas existentes (opcional - comente se não quiser limpar)
        // await Clinic.deleteMany({});
        // logger.info('🗑️  Clínicas antigas removidas');
        
        // Inserir clínicas usando serviço centralizado
        const clinicService = require('../services/clinicService');
        const createdClinics = [];
        
        for (const clinicData of clinicsData) {
            // Verificar se já existe
            const existing = await Clinic.findOne({ slug: clinicData.slug });
            
            if (existing) {
                logger.info(`⏭️  Clínica ${clinicData.name} já existe, pulando...`);
                createdClinics.push(existing);
                continue;
            }
            
            // Usar serviço centralizado para criar
            const { clinic, fullPublicUrl } = await clinicService.createClinic(clinicData);
            logger.info(`✅ Clínica criada: ${clinic.name} (${clinic.slug})`);
            logger.info(`   URL: ${fullPublicUrl}`);
            createdClinics.push(clinic);
        }
        
        logger.info('\n📊 RESUMO:');
        logger.info(`   ${createdClinics.length} clínicas no total`);
        logger.info('\n🌐 URLs das páginas públicas:');
        
        createdClinics.forEach(clinic => {
            logger.info(`   • ${clinic.name}: http://localhost:3000/clinica/${clinic.slug}`);
        });
        
        logger.info('\n✨ Seed concluído com sucesso!');
        
        process.exit(0);
        
    } catch (error) {
        logger.error('❌ Erro no seed:', error);
        process.exit(1);
    }
}

// Executar
seedClinics();

