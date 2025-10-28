/**
 * AtenMed - Meta WhatsApp Business API Integration
 * Serviço para integração automatizada com Meta WhatsApp API
 */

const axios = require('axios');
const logger = require('../utils/logger');

// Configuração
const META_API_VERSION = 'v18.0';
const META_GRAPH_API_URL = `https://graph.facebook.com/${META_API_VERSION}`;
const WHATSAPP_BUSINESS_ACCOUNT_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN; // Token de longa duração

/**
 * Gerar instruções detalhadas para adicionar número no Meta
 */
function generateMetaInstructions(clinic) {
    const phoneNumber = clinic.contact?.whatsapp;
    const formattedPhone = formatPhoneForMeta(phoneNumber);
    
    return {
        clinic: clinic.name,
        phoneNumber: formattedPhone,
        steps: [
            {
                step: 1,
                title: 'Acessar Meta Developer Console',
                description: 'Faça login no console de desenvolvedor do Meta',
                action: 'Abrir link',
                link: 'https://developers.facebook.com/apps/',
                autoOpen: true
            },
            {
                step: 2,
                title: 'Selecionar seu App WhatsApp',
                description: 'Clique no app WhatsApp Business que você criou',
                action: 'Clicar no app'
            },
            {
                step: 3,
                title: 'Ir para Phone Numbers',
                description: 'No menu lateral, clique em: WhatsApp > Phone Numbers',
                action: 'Navegar',
                link: `https://developers.facebook.com/apps/${process.env.META_APP_ID}/whatsapp-business/wa-phone-numbers/`
            },
            {
                step: 4,
                title: 'Adicionar Número',
                description: `Clique em "Add phone number" e insira: ${formattedPhone}`,
                action: 'Adicionar número',
                copyable: formattedPhone
            },
            {
                step: 5,
                title: 'Verificar Número',
                description: 'Escolha verificação por SMS ou chamada telefônica',
                action: 'Aguardar código de verificação'
            },
            {
                step: 6,
                title: 'Configurar Webhook',
                description: 'Configure o webhook para receber mensagens',
                action: 'Copiar e colar configurações',
                config: {
                    callbackUrl: `${process.env.APP_URL || 'https://atenmed.com.br'}/api/whatsapp/webhook`,
                    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'atenmed_webhook_2025',
                    subscriptions: ['messages']
                }
            },
            {
                step: 7,
                title: 'Testar Configuração',
                description: 'Envie uma mensagem para verificar se está funcionando',
                action: 'Testar',
                testMessage: `Olá! Teste de configuração da ${clinic.name}`
            }
        ],
        estimatedTime: '5-10 minutos',
        difficulty: 'Fácil',
        automationAvailable: false
    };
}

/**
 * Formatar número de telefone para padrão Meta (+55 11 98765-4321)
 */
function formatPhoneForMeta(phoneNumber) {
    if (!phoneNumber) return '';
    
    // Remover caracteres especiais
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Se não tem código do país, adicionar +55 (Brasil)
    let formattedNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
    
    // Formatar: +55 11 98765-4321
    if (formattedNumber.length === 13) { // 55 + DDD (2) + Número (9)
        return `+${formattedNumber.substr(0, 2)} ${formattedNumber.substr(2, 2)} ${formattedNumber.substr(4, 5)}-${formattedNumber.substr(9)}`;
    } else if (formattedNumber.length === 12) { // 55 + DDD (2) + Número (8)
        return `+${formattedNumber.substr(0, 2)} ${formattedNumber.substr(2, 2)} ${formattedNumber.substr(4, 4)}-${formattedNumber.substr(8)}`;
    }
    
    return `+${formattedNumber}`;
}

/**
 * Verificar se número já está registrado no Meta (via API)
 */
async function checkNumberRegistration(phoneNumber) {
    if (!META_ACCESS_TOKEN || !WHATSAPP_BUSINESS_ACCOUNT_ID) {
        return {
            registered: false,
            message: 'Configuração da API do Meta não disponível',
            manualCheckRequired: true
        };
    }
    
    try {
        const response = await axios.get(
            `${META_GRAPH_API_URL}/${WHATSAPP_BUSINESS_ACCOUNT_ID}/phone_numbers`,
            {
                params: {
                    access_token: META_ACCESS_TOKEN
                },
                timeout: 10000
            }
        );
        
        const cleanNumber = phoneNumber.replace(/\D/g, '');
        const registeredNumbers = response.data.data || [];
        
        const isRegistered = registeredNumbers.some(num => 
            num.display_phone_number.replace(/\D/g, '').includes(cleanNumber)
        );
        
        return {
            registered: isRegistered,
            message: isRegistered ? 'Número já registrado no Meta' : 'Número não registrado',
            phoneNumberId: isRegistered ? registeredNumbers.find(n => 
                n.display_phone_number.replace(/\D/g, '').includes(cleanNumber)
            )?.id : null
        };
        
    } catch (error) {
        logger.error('Erro ao verificar número no Meta:', error.message);
        return {
            registered: false,
            message: 'Não foi possível verificar automaticamente',
            manualCheckRequired: true,
            error: error.message
        };
    }
}

/**
 * Tentar registrar número automaticamente (requer configuração avançada)
 */
async function registerNumberAutomatic(phoneNumber, displayName) {
    if (!META_ACCESS_TOKEN || !WHATSAPP_BUSINESS_ACCOUNT_ID) {
        throw new Error('Configuração da API do Meta não disponível. Configure META_ACCESS_TOKEN e WHATSAPP_BUSINESS_ACCOUNT_ID');
    }
    
    try {
        const cleanNumber = phoneNumber.replace(/\D/g, '');
        
        // Nota: Esta chamada pode requerer permissões especiais
        const response = await axios.post(
            `${META_GRAPH_API_URL}/${WHATSAPP_BUSINESS_ACCOUNT_ID}/phone_numbers`,
            {
                cc: cleanNumber.substr(0, 2), // Código do país
                phone_number: cleanNumber.substr(2), // Número sem código
                migrate_phone_number: false
            },
            {
                params: {
                    access_token: META_ACCESS_TOKEN
                },
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            }
        );
        
        logger.info('Número registrado no Meta:', response.data);
        
        return {
            success: true,
            phoneNumberId: response.data.id,
            verificationRequired: true,
            message: 'Número registrado! Verificação por SMS/chamada necessária.'
        };
        
    } catch (error) {
        logger.error('Erro ao registrar número no Meta:', error.response?.data || error.message);
        
        return {
            success: false,
            message: error.response?.data?.error?.message || error.message,
            manualRegistrationRequired: true
        };
    }
}

/**
 * Configurar webhook para um número específico
 */
async function configureWebhook(phoneNumberId) {
    if (!META_ACCESS_TOKEN) {
        throw new Error('META_ACCESS_TOKEN não configurado');
    }
    
    try {
        const webhookUrl = `${process.env.APP_URL || 'https://atenmed.com.br'}/api/whatsapp/webhook`;
        const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'atenmed_webhook_2025';
        
        // Subscrever aos eventos de mensagens
        const response = await axios.post(
            `${META_GRAPH_API_URL}/${phoneNumberId}/subscribed_apps`,
            {},
            {
                params: {
                    access_token: META_ACCESS_TOKEN
                },
                timeout: 10000
            }
        );
        
        logger.info('Webhook configurado para número:', phoneNumberId);
        
        return {
            success: true,
            message: 'Webhook configurado com sucesso',
            webhookUrl,
            verifyToken
        };
        
    } catch (error) {
        logger.error('Erro ao configurar webhook:', error.response?.data || error.message);
        
        return {
            success: false,
            message: error.response?.data?.error?.message || error.message
        };
    }
}

/**
 * Gerar configuração completa para copiar e colar
 */
function generateQuickConfig(clinic) {
    const webhookUrl = `${process.env.APP_URL || 'https://atenmed.com.br'}/api/whatsapp/webhook`;
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'atenmed_webhook_2025';
    const phoneNumber = formatPhoneForMeta(clinic.contact?.whatsapp);
    
    return {
        clinicName: clinic.name,
        phoneNumber,
        webhook: {
            callbackUrl: webhookUrl,
            verifyToken: verifyToken,
            fields: ['messages'],
            verification: {
                method: 'GET',
                params: {
                    'hub.mode': 'subscribe',
                    'hub.verify_token': verifyToken,
                    'hub.challenge': '[META_WILL_PROVIDE]'
                }
            }
        },
        copyPaste: {
            webhookUrl,
            verifyToken,
            phoneNumber,
            testUrl: `${webhookUrl}?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=TEST123`
        },
        links: {
            metaDeveloper: 'https://developers.facebook.com/apps/',
            phoneNumbers: process.env.META_APP_ID ? 
                `https://developers.facebook.com/apps/${process.env.META_APP_ID}/whatsapp-business/wa-phone-numbers/` :
                'https://developers.facebook.com/apps/',
            documentation: 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started'
        }
    };
}

module.exports = {
    generateMetaInstructions,
    formatPhoneForMeta,
    checkNumberRegistration,
    registerNumberAutomatic,
    configureWebhook,
    generateQuickConfig
};

