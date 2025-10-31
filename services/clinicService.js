/**
 * AtenMed - Clinic Service
 * Serviço centralizado para criação e gerenciamento de clínicas
 */

const Clinic = require('../models/Clinic');
const logger = require('../utils/logger');

/**
 * Gerar slug único a partir do nome da clínica
 * @param {string} name - Nome da clínica
 * @param {string} existingSlug - Slug opcional já fornecido
 * @returns {Promise<string>} Slug único
 */
async function generateUniqueSlug(name, existingSlug = null) {
    let baseSlug = existingSlug || name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
    
    let finalSlug = baseSlug;
    let counter = 1;
    
    // Garantir que slug seja único
    while (await Clinic.findOne({ slug: finalSlug })) {
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
    }
    
    return finalSlug;
}

/**
 * Criar nova clínica
 * @param {Object} clinicData - Dados da clínica
 * @param {Object} options - Opções adicionais
 * @returns {Promise<Object>} Clínica criada
 */
async function createClinic(clinicData, options = {}) {
    try {
        // Validações básicas
        if (!clinicData.name) {
            throw new Error('Nome da clínica é obrigatório');
        }
        
        // Gerar slug se não fornecido
        if (!clinicData.slug) {
            clinicData.slug = await generateUniqueSlug(clinicData.name);
        } else {
            // Se slug fornecido, garantir que seja único
            clinicData.slug = await generateUniqueSlug(clinicData.name, clinicData.slug);
        }
        
        // Valores padrão
        if (clinicData.active === undefined) clinicData.active = true;
        if (clinicData.isActive === undefined) clinicData.isActive = true;
        
        // Subscription padrão se não fornecido
        if (!clinicData.subscription) {
            clinicData.subscription = {
                plan: clinicData.plan || 'basic',
                status: 'active',
                startDate: new Date(),
                autoRenew: true
            };
        }
        
        // Features padrão se não fornecido
        if (!clinicData.features) {
            const plan = clinicData.subscription?.plan || clinicData.plan || 'basic';
            clinicData.features = {
                onlineBooking: true,
                whatsappBot: plan !== 'free',
                telemedicine: plan === 'pro' || plan === 'enterprise',
                electronicRecords: false
            };
        }
        
        // Branding padrão se não fornecido
        if (!clinicData.branding) {
            clinicData.branding = {
                primaryColor: '#45a7b1',
                secondaryColor: '#184354',
                accentColor: '#6dd5ed'
            };
        }
        
        // Working hours padrão se não fornecido
        if (!clinicData.workingHours || !clinicData.workingHours.start) {
            clinicData.workingHours = {
                start: 8,
                end: 18,
                formatted: 'Seg-Sex: 8h às 18h'
            };
        }
        
        // Criar clínica
        const clinic = new Clinic(clinicData);
        await clinic.save();
        
        // Log
        logger.info(`✅ Clínica criada: ${clinic.name} (${clinic._id})`);
        logger.info(`🌐 Página pública disponível em: /clinica/${clinic.slug}`);
        
        // Preparar dados de retorno
        const baseUrl = process.env.APP_URL || 'https://atenmed.com.br';
        
        return {
            clinic,
            publicUrl: `/clinica/${clinic.slug}`,
            fullPublicUrl: `${baseUrl}/clinica/${clinic.slug}`
        };
        
    } catch (error) {
        logger.error('Erro ao criar clínica:', error);
        throw error;
    }
}

/**
 * Validar dados da clínica antes de criar
 * @param {Object} clinicData - Dados da clínica
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateClinicData(clinicData) {
    const errors = [];
    
    if (!clinicData.name || clinicData.name.trim().length < 3) {
        errors.push('Nome da clínica deve ter pelo menos 3 caracteres');
    }
    
    if (clinicData.contact?.email) {
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(clinicData.contact.email)) {
            errors.push('Email inválido');
        }
    }
    
    if (clinicData.subscription?.plan) {
        const validPlans = ['free', 'basic', 'pro', 'enterprise'];
        if (!validPlans.includes(clinicData.subscription.plan)) {
            errors.push(`Plano deve ser um dos: ${validPlans.join(', ')}`);
        }
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

module.exports = {
    createClinic,
    generateUniqueSlug,
    validateClinicData
};

