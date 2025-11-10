/**
 * AtenMed - Evolution API WhatsApp Service
 * Serviço para integração com Evolution API (alternativa ao WhatsApp Business API oficial)
 */

const logger = require('../utils/logger');
const Bottleneck = require('bottleneck');
const { v4: uuidv4 } = require('uuid');

// Carregar axios e Bull de forma segura
let axios, Queue;
try {
    axios = require('axios');
    Queue = require('bull');
} catch (err) {
    logger.error('❌ Dependências não puderam ser carregadas. WhatsApp Evolution Service será desativado.', err.message);
    module.exports = {
        sendMessage: async () => { throw new Error('WhatsApp Evolution Service desativado - dependências indisponíveis'); },
        processWebhook: async () => { throw new Error('WhatsApp Evolution Service desativado - dependências indisponíveis'); }
    };
    return;
}

const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Specialty = require('../models/Specialty');
const Clinic = require('../models/Clinic');
const googleCalendarService = require('./googleCalendarService');
const aiService = require('./aiService');

// ===== CONFIGURAÇÃO =====
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'atenmed-main';
const EVOLUTION_WEBHOOK_URL = process.env.EVOLUTION_WEBHOOK_URL || process.env.APP_URL + '/api/whatsapp-evolution/webhook';

// Rate limiter (Evolution API geralmente permite mais mensagens)
const limiter = new Bottleneck({
    reservoir: 100,
    reservoirRefreshAmount: 100,
    reservoirRefreshInterval: 1000,
    maxConcurrent: 20,
    minTime: 10
});

// Fila de mensagens com Bull
let messageQueue;
try {
    const redisConfig = process.env.REDIS_URL ? {
        redis: process.env.REDIS_URL
    } : {
        redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || undefined
        }
    };

    messageQueue = new Queue('whatsapp-evolution-messages', redisConfig);

    messageQueue.process(async (job) => {
        const { to, text, retryCount = 0 } = job.data;
        return await sendMessageInternal(to, text, retryCount);
    });

    messageQueue.on('completed', (job, result) => {
        logger.info(`✅ Mensagem Evolution API enviada com sucesso (Job ${job.id})`);
    });

    messageQueue.on('failed', (job, err) => {
        logger.error(`❌ Falha ao enviar mensagem Evolution API (Job ${job.id}):`, err.message);
    });

    logger.info('📬 Fila de mensagens Evolution API inicializada');
} catch (error) {
    logger.warn('⚠️ Redis não disponível. Fila de mensagens desabilitada.');
    messageQueue = null;
}

// Estado das conversas
const conversationState = new Map();

// ===== CLASSE DE SESSÃO =====
class ConversationSession {
    constructor(phoneNumber, clinicId = null) {
        this.phoneNumber = phoneNumber;
        this.clinicId = clinicId;
        this.state = 'initial';
        this.data = {};
        this.lastActivity = Date.now();
        this.conversationHistory = [];
        this.useAI = aiService.shouldUseAI();
    }

    setState(state, data = {}) {
        this.state = state;
        this.data = { ...this.data, ...data };
        this.lastActivity = Date.now();
    }

    getData(key) {
        return this.data[key];
    }
    
    addToHistory(text, isUser = true) {
        this.conversationHistory.push({
            text,
            isUser,
            timestamp: Date.now()
        });
        
        if (this.conversationHistory.length > 10) {
            this.conversationHistory = this.conversationHistory.slice(-10);
        }
    }

    reset() {
        this.state = 'initial';
        this.data = {};
        this.conversationHistory = [];
        this.lastActivity = Date.now();
    }

    isExpired(timeoutMinutes = 30) {
        return Date.now() - this.lastActivity > timeoutMinutes * 60 * 1000;
    }
}

// ===== INICIALIZAÇÃO =====
function initialize() {
    const aiEnabled = aiService.initialize();
    if (aiEnabled) {
        logger.info('🤖 Evolution API com IA conversacional habilitada!');
    } else {
        logger.info('📱 Evolution API sem IA (modo básico)');
    }
    
    // Limpar sessões expiradas a cada 5 minutos
    setInterval(() => {
        for (const [phone, session] of conversationState.entries()) {
            if (session.isExpired()) {
                conversationState.delete(phone);
                logger.info(`Sessão expirada removida: ${phone}`);
            }
        }
    }, 5 * 60 * 1000);

    // Verificar status da instância
    checkInstanceStatus();
    setInterval(checkInstanceStatus, 5 * 60 * 1000); // A cada 5 minutos

    logger.info('✅ Evolution API Service inicializado');
}

// ===== VERIFICAR STATUS DA INSTÂNCIA =====
async function checkInstanceStatus() {
    try {
        const response = await axios.get(
            `${EVOLUTION_API_URL}/instance/fetchInstances`,
            {
                headers: {
                    'apikey': EVOLUTION_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            }
        );

        const instances = response.data || [];
        const instance = instances.find(inst => inst.instance.instanceName === EVOLUTION_INSTANCE_NAME);
        
        if (instance) {
            const status = instance.instance.status;
            logger.info(`📱 Evolution API Instance Status: ${status}`);
            
            if (status === 'open') {
                // Configurar webhook se necessário
                await setupWebhook();
            }
        } else {
            logger.warn(`⚠️ Instância ${EVOLUTION_INSTANCE_NAME} não encontrada`);
        }
    } catch (error) {
        logger.warn('⚠️ Erro ao verificar status da instância:', error.message);
    }
}

// ===== CONFIGURAR WEBHOOK =====
async function setupWebhook() {
    try {
        await axios.post(
            `${EVOLUTION_API_URL}/webhook/set/${EVOLUTION_INSTANCE_NAME}`,
            {
                url: EVOLUTION_WEBHOOK_URL,
                webhook_by_events: false,
                webhook_base64: false,
                events: [
                    'MESSAGES_UPSERT',
                    'MESSAGES_UPDATE',
                    'MESSAGES_DELETE',
                    'SEND_MESSAGE',
                    'CONNECTION_UPDATE',
                    'QRCODE_UPDATED'
                ]
            },
            {
                headers: {
                    'apikey': EVOLUTION_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );
        
        logger.info('✅ Webhook Evolution API configurado');
    } catch (error) {
        logger.warn('⚠️ Erro ao configurar webhook:', error.message);
    }
}

// ===== ENVIAR MENSAGEM INTERNA =====
async function sendMessageInternal(to, text, retryCount = 0) {
    if (!EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME) {
        throw new Error('Evolution API não configurada. Configure EVOLUTION_API_KEY e EVOLUTION_INSTANCE_NAME');
    }

    // Limpar número (remover caracteres especiais)
    const cleanNumber = to.replace(/\D/g, '');
    
    // Adicionar código do país se não tiver
    const phoneNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;

    try {
        const response = await axios.post(
            `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_NAME}`,
            {
                number: phoneNumber,
                textContent: text
            },
            {
                headers: {
                    'apikey': EVOLUTION_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        if (response.data && response.data.key) {
            logger.info(`✅ Mensagem Evolution API enviada para ${to}`);
            return {
                success: true,
                messageId: response.data.key.id,
                timestamp: response.data.key.timestamp
            };
        }

        throw new Error('Resposta inválida da Evolution API');

    } catch (error) {
        logger.error(`❌ Erro ao enviar mensagem Evolution API para ${to}:`, error.message);
        
        // Retry logic
        if (retryCount < 3 && error.response?.status >= 500) {
            logger.info(`🔄 Tentando novamente (${retryCount + 1}/3)...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return await sendMessageInternal(to, text, retryCount + 1);
        }

        throw error;
    }
}

// ===== ENVIAR MENSAGEM =====
async function sendMessage(to, text, options = {}) {
    const { useQueue = true, priority = 0 } = options;

    if (useQueue && messageQueue) {
        return await messageQueue.add(
            { to, text },
            {
                priority,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000
                }
            }
        );
    }

    return await limiter.schedule(() => sendMessageInternal(to, text));
}

// ===== PROCESSAR WEBHOOK =====
async function processWebhook(body) {
    try {
        const { event, instance, data } = body;

        // Verificar se é da instância correta
        if (instance !== EVOLUTION_INSTANCE_NAME) {
            logger.warn(`⚠️ Webhook de instância diferente: ${instance}`);
            return;
        }

        // Processar diferentes tipos de eventos
        switch (event) {
            case 'MESSAGES_UPSERT':
                await handleIncomingMessage(data);
                break;
            
            case 'CONNECTION_UPDATE':
                logger.info(`📱 Status da conexão: ${data.state}`);
                break;
            
            case 'QRCODE_UPDATED':
                logger.info('📱 QR Code atualizado');
                break;
            
            default:
                logger.debug(`Evento não tratado: ${event}`);
        }

    } catch (error) {
        logger.error('Erro ao processar webhook Evolution API:', error);
        throw error;
    }
}

// ===== PROCESSAR MENSAGEM RECEBIDA =====
async function handleIncomingMessage(data) {
    try {
        const message = data.messages?.[0];
        if (!message) return;

        const from = message.key.remoteJid.replace('@s.whatsapp.net', '');
        const messageText = message.message?.conversation || 
                          message.message?.extendedTextMessage?.text || 
                          '';

        if (!messageText) return;

        logger.info(`📩 Mensagem recebida de ${from}: ${messageText.substring(0, 50)}...`);

        // Obter ou criar sessão
        let session = conversationState.get(from);
        if (!session) {
            // Tentar identificar clínica pelo número (pode ser melhorado)
            session = new ConversationSession(from);
            conversationState.set(from, session);
        }

        session.addToHistory(messageText, true);
        session.lastActivity = Date.now();

        // Processar mensagem (mesma lógica do serviço oficial)
        await handleMessage(from, messageText, session);

    } catch (error) {
        logger.error('Erro ao processar mensagem recebida:', error);
    }
}

// ===== PROCESSAR MENSAGEM (LÓGICA DE CONVERSA) =====
async function handleMessage(phoneNumber, messageText, session) {
    // Reutilizar a lógica do whatsappServiceV2.js
    // Por enquanto, implementação básica
    const response = await generateResponse(phoneNumber, messageText, session);
    
    if (response) {
        await sendMessage(phoneNumber, response);
    }
}

// ===== GERAR RESPOSTA =====
async function generateResponse(phoneNumber, messageText, session) {
    // Reutilizar lógica do whatsappServiceV2.js
    // Por enquanto, resposta básica
    if (session.useAI) {
        const aiResponse = await aiService.generateResponse(
            messageText,
            session.conversationHistory.map(h => ({
                isUser: h.isUser,
                text: h.text
            }))
        );
        
        if (aiResponse) {
            return aiResponse;
        }
    }

    return 'Olá! Como posso ajudar?';
}

// ===== OBTER QR CODE =====
async function getQRCode() {
    try {
        const response = await axios.get(
            `${EVOLUTION_API_URL}/instance/connect/${EVOLUTION_INSTANCE_NAME}`,
            {
                headers: {
                    'apikey': EVOLUTION_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        return response.data?.qrcode?.base64 || null;
    } catch (error) {
        logger.error('Erro ao obter QR Code:', error);
        return null;
    }
}

// ===== OBTER STATUS DA INSTÂNCIA =====
async function getInstanceStatus() {
    try {
        const response = await axios.get(
            `${EVOLUTION_API_URL}/instance/fetchInstances`,
            {
                headers: {
                    'apikey': EVOLUTION_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            }
        );

        const instances = response.data || [];
        const instance = instances.find(inst => inst.instance.instanceName === EVOLUTION_INSTANCE_NAME);
        
        return instance ? {
            name: instance.instance.instanceName,
            status: instance.instance.status,
            qrcode: instance.instance.qrcode?.base64 || null
        } : null;
    } catch (error) {
        logger.error('Erro ao obter status da instância:', error);
        return null;
    }
}

// ===== DESCONECTAR INSTÂNCIA =====
async function disconnectInstance() {
    try {
        await axios.delete(
            `${EVOLUTION_API_URL}/instance/delete/${EVOLUTION_INSTANCE_NAME}`,
            {
                headers: {
                    'apikey': EVOLUTION_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        logger.info('✅ Instância desconectada');
        return true;
    } catch (error) {
        logger.error('Erro ao desconectar instância:', error);
        return false;
    }
}

// Inicializar ao carregar
initialize();

module.exports = {
    sendMessage,
    processWebhook,
    getQRCode,
    getInstanceStatus,
    disconnectInstance,
    checkInstanceStatus
};

