/**
 * AtenMed - WhatsApp Web Service (Não Oficial)
 * Integração via QR Code usando whatsapp-web.js
 * Similar ao Zaia.app - conexão com um clique
 */

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;

// Armazenar clientes por clínica/agente
const clients = new Map();
const qrCodes = new Map();
const connectionStatus = new Map();

/**
 * Criar e inicializar cliente WhatsApp Web
 */
async function createClient(agentId, clinicId) {
    const clientId = `${clinicId}_${agentId}`;
    
    // Se já existe, retornar
    if (clients.has(clientId)) {
        return clients.get(clientId);
    }
    
    try {
        // Criar diretório para sessões
        const sessionPath = path.join(__dirname, '../sessions', clientId);
        await fs.mkdir(sessionPath, { recursive: true });
        
        // Criar cliente
        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: clientId,
                dataPath: sessionPath
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu'
                ]
            }
        });
        
        // Event: QR Code gerado
        client.on('qr', async (qr) => {
            try {
                // Gerar QR Code como base64
                const qrImage = await qrcode.toDataURL(qr);
                qrCodes.set(clientId, {
                    qr: qr,
                    qrImage: qrImage,
                    timestamp: new Date()
                });
                
                logger.info(`📱 QR Code gerado para agente ${agentId}`);
                
                // Emitir evento (será capturado via WebSocket ou polling)
                connectionStatus.set(clientId, {
                    status: 'qr_ready',
                    qrImage: qrImage,
                    timestamp: new Date()
                });
            } catch (error) {
                logger.error('Erro ao gerar QR Code:', error);
            }
        });
        
        // Event: Autenticado
        client.on('authenticated', () => {
            logger.info(`✅ WhatsApp autenticado para agente ${agentId}`);
            connectionStatus.set(clientId, {
                status: 'authenticated',
                timestamp: new Date()
            });
            qrCodes.delete(clientId);
        });
        
        // Event: Pronto
        client.on('ready', async () => {
            const info = client.info;
            logger.info(`🚀 WhatsApp Web conectado para agente ${agentId}`);
            logger.info(`   Número: ${info.wid.user}`);
            logger.info(`   Nome: ${info.pushname || 'N/A'}`);
            
            connectionStatus.set(clientId, {
                status: 'connected',
                phoneNumber: info.wid.user,
                name: info.pushname,
                timestamp: new Date()
            });
        });
        
        // Event: Desconectado
        client.on('disconnected', (reason) => {
            logger.warn(`⚠️ WhatsApp desconectado para agente ${agentId}: ${reason}`);
            connectionStatus.set(clientId, {
                status: 'disconnected',
                reason: reason,
                timestamp: new Date()
            });
            
            // Limpar
            clients.delete(clientId);
            qrCodes.delete(clientId);
        });
        
        // Event: Mensagem recebida
        client.on('message', async (message) => {
            await handleIncomingMessage(message, agentId, clinicId);
        });
        
        // Event: Erro
        client.on('error', (error) => {
            logger.error(`❌ Erro no WhatsApp Web para agente ${agentId}:`, error);
            connectionStatus.set(clientId, {
                status: 'error',
                error: error.message,
                timestamp: new Date()
            });
        });
        
        // Armazenar cliente
        clients.set(clientId, client);
        
        // Inicializar
        await client.initialize();
        
        return client;
        
    } catch (error) {
        logger.error(`Erro ao criar cliente WhatsApp Web:`, error);
        throw error;
    }
}

/**
 * Obter QR Code para conexão
 */
async function getQRCode(agentId, clinicId) {
    const clientId = `${clinicId}_${agentId}`;
    
    // Se já tem QR Code, retornar
    if (qrCodes.has(clientId)) {
        return qrCodes.get(clientId);
    }
    
    // Se já está conectado, retornar status
    if (connectionStatus.has(clientId)) {
        const status = connectionStatus.get(clientId);
        if (status.status === 'connected') {
            return {
                status: 'connected',
                phoneNumber: status.phoneNumber,
                name: status.name
            };
        }
    }
    
    // Criar cliente (vai gerar QR Code)
    try {
        await createClient(agentId, clinicId);
        
        // Aguardar QR Code (máximo 10 segundos)
        let attempts = 0;
        while (attempts < 20) {
            if (qrCodes.has(clientId)) {
                return qrCodes.get(clientId);
            }
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }
        
        return null;
    } catch (error) {
        logger.error('Erro ao obter QR Code:', error);
        return null;
    }
}

/**
 * Obter status da conexão
 */
function getConnectionStatus(agentId, clinicId) {
    const clientId = `${clinicId}_${agentId}`;
    return connectionStatus.get(clientId) || { status: 'not_initialized' };
}

/**
 * Enviar mensagem via WhatsApp Web
 */
async function sendMessage(agentId, clinicId, to, message, options = {}) {
    const clientId = `${clinicId}_${agentId}`;
    const client = clients.get(clientId);
    
    if (!client) {
        throw new Error('Cliente WhatsApp não conectado');
    }
    
    const status = connectionStatus.get(clientId);
    if (status?.status !== 'connected') {
        throw new Error('WhatsApp não está conectado');
    }
    
    try {
        // Formatar número (adicionar @c.us se necessário)
        const number = to.includes('@') ? to : `${to}@c.us`;
        
        // Enviar mensagem
        const result = await client.sendMessage(number, message, options);
        
        logger.info(`📤 Mensagem enviada via WhatsApp Web para ${to}`);
        
        return {
            success: true,
            messageId: result.id._serialized,
            timestamp: new Date()
        };
    } catch (error) {
        logger.error('Erro ao enviar mensagem via WhatsApp Web:', error);
        throw error;
    }
}

/**
 * Processar mensagem recebida
 */
async function handleIncomingMessage(message, agentId, clinicId) {
    try {
        // Ignorar mensagens próprias
        if (message.fromMe) return;
        
        // Ignorar grupos (por enquanto)
        if (message.from.includes('@g.us')) return;
        
        const contact = await message.getContact();
        const userMessage = message.body;
        const from = message.from;
        
        logger.info(`📥 Mensagem recebida de ${contact.pushname || from}: ${userMessage.substring(0, 50)}`);
        
        // Buscar agente
        const Agent = require('../models/Agent');
        const agent = await Agent.findOne({
            _id: agentId,
            clinic: clinicId,
            active: true
        });
        
        if (!agent) {
            logger.warn(`Agente ${agentId} não encontrado ou inativo`);
            return;
        }
        
        // Verificar se canal WhatsApp está habilitado
        if (!agent.channels?.whatsapp?.enabled) {
            logger.warn(`Canal WhatsApp não habilitado para agente ${agentId}`);
            return;
        }
        
        // Processar mensagem através do agente de IA
        const agentService = require('./agentService');
        const response = await agentService.processMessage(agent, userMessage, {
            conversationId: null,
            userId: from,
            channel: 'whatsapp',
            clinicId: clinicId,
            userName: contact.pushname || contact.number || 'Usuário'
        });
        
        // Enviar resposta
        if (response && response.text) {
            await sendMessage(agentId, clinicId, from, response.text);
        }
        
    } catch (error) {
        logger.error('Erro ao processar mensagem recebida:', error);
    }
}

/**
 * Desconectar cliente
 */
async function disconnect(agentId, clinicId) {
    const clientId = `${clinicId}_${agentId}`;
    const client = clients.get(clientId);
    
    if (client) {
        try {
            await client.logout();
            await client.destroy();
        } catch (error) {
            logger.error('Erro ao desconectar cliente:', error);
        }
    }
    
    clients.delete(clientId);
    qrCodes.delete(clientId);
    connectionStatus.delete(clientId);
    
    logger.info(`🔌 Cliente WhatsApp desconectado para agente ${agentId}`);
}

/**
 * Verificar se está conectado
 */
function isConnected(agentId, clinicId) {
    const clientId = `${clinicId}_${agentId}`;
    const status = connectionStatus.get(clientId);
    return status?.status === 'connected';
}

/**
 * Obter informações da conexão
 */
function getConnectionInfo(agentId, clinicId) {
    const clientId = `${clinicId}_${agentId}`;
    const status = connectionStatus.get(clientId);
    const client = clients.get(clientId);
    
    return {
        connected: status?.status === 'connected',
        status: status?.status || 'not_initialized',
        phoneNumber: status?.phoneNumber,
        name: status?.name,
        timestamp: status?.timestamp,
        hasClient: !!client
    };
}

module.exports = {
    createClient,
    getQRCode,
    getConnectionStatus,
    sendMessage,
    disconnect,
    isConnected,
    getConnectionInfo
};

