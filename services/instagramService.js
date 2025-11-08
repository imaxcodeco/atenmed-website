/**
 * AtenMed - Instagram Service
 * Integração com Instagram para agentes de IA
 */

const axios = require('axios');
const logger = require('../utils/logger');

// Configuração
const INSTAGRAM_API_URL = process.env.INSTAGRAM_API_URL || 'https://graph.instagram.com';
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;

/**
 * Inicializar serviço Instagram
 */
function initialize() {
    if (!INSTAGRAM_ACCESS_TOKEN) {
        logger.warn('⚠️ Instagram Access Token não configurado. Instagram desabilitado.');
        return false;
    }
    
    logger.info('📷 Instagram Service inicializado');
    return true;
}

/**
 * Enviar mensagem via Instagram
 */
async function sendMessage(recipientId, message, agentId) {
    try {
        if (!INSTAGRAM_ACCESS_TOKEN) {
            throw new Error('Instagram não configurado');
        }
        
        const response = await axios.post(
            `${INSTAGRAM_API_URL}/v18.0/${INSTAGRAM_APP_ID}/messages`,
            {
                recipient: {
                    id: recipientId
                },
                message: {
                    text: message
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${INSTAGRAM_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        logger.info(`📤 Mensagem Instagram enviada para ${recipientId}`);
        
        return {
            success: true,
            messageId: response.data.message_id
        };
        
    } catch (error) {
        logger.error('Erro ao enviar mensagem Instagram:', error);
        throw error;
    }
}

/**
 * Processar webhook do Instagram
 */
async function processWebhook(body) {
    try {
        const entry = body.entry?.[0];
        if (!entry) return null;
        
        const messaging = entry.messaging?.[0];
        if (!messaging) return null;
        
        const senderId = messaging.sender?.id;
        const message = messaging.message;
        
        if (!senderId || !message) return null;
        
        return {
            senderId,
            message: message.text,
            timestamp: messaging.timestamp,
            messageId: message.mid
        };
        
    } catch (error) {
        logger.error('Erro ao processar webhook Instagram:', error);
        return null;
    }
}

/**
 * Verificar webhook do Instagram
 */
function verifyWebhook(mode, token, challenge) {
    const verifyToken = process.env.INSTAGRAM_VERIFY_TOKEN;
    
    if (mode === 'subscribe' && token === verifyToken) {
        logger.info('✅ Instagram webhook verificado');
        return challenge;
    }
    
    return null;
}

module.exports = {
    initialize,
    sendMessage,
    processWebhook,
    verifyWebhook
};

