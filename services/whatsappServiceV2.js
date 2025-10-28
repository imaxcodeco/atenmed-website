/**
 * AtenMed - WhatsApp Business API Service V2
 * Versão melhorada com retry logic, queue e tratamento robusto de erros
 */

const logger = require('../utils/logger');
const crypto = require('crypto');
const Bottleneck = require('bottleneck');

// Carregar axios e Bull de forma segura
let axios, Queue;
try {
    axios = require('axios');
    Queue = require('bull');
} catch (err) {
    logger.error('❌ Dependências não puderam ser carregadas. WhatsApp Service será desativado.', err.message);
    module.exports = {
        sendMessage: async () => { throw new Error('WhatsApp Service desativado - dependências indisponíveis'); },
        processWebhook: async () => { throw new Error('WhatsApp Service desativado - dependências indisponíveis'); },
        verifyWebhook: () => { throw new Error('WhatsApp Service desativado - dependências indisponíveis'); }
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
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const WHATSAPP_APP_SECRET = process.env.WHATSAPP_APP_SECRET;

// Rate limiter inteligente com Bottleneck
// WhatsApp Cloud API: 80 mensagens por segundo, 1000 por minuto
const limiter = new Bottleneck({
    reservoir: 80, // Número inicial de tarefas
    reservoirRefreshAmount: 80,
    reservoirRefreshInterval: 1000, // por segundo
    maxConcurrent: 10, // Máximo de requisições simultâneas
    minTime: 13 // Mínimo de 13ms entre requisições (aproximadamente 77 req/s)
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

    messageQueue = new Queue('whatsapp-messages', redisConfig);

    // Processar mensagens da fila
    messageQueue.process(async (job) => {
        const { to, text, retryCount = 0 } = job.data;
        return await sendMessageInternal(to, text, retryCount);
    });

    // Eventos da fila
    messageQueue.on('completed', (job, result) => {
        logger.info(`✅ Mensagem enviada com sucesso (Job ${job.id})`);
    });

    messageQueue.on('failed', (job, err) => {
        logger.error(`❌ Falha ao enviar mensagem (Job ${job.id}):`, err.message);
    });

    logger.info('📬 Fila de mensagens WhatsApp inicializada');
} catch (error) {
    logger.warn('⚠️ Redis não disponível. Fila de mensagens desabilitada. Mensagens serão enviadas diretamente.');
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
        logger.info('🤖 WhatsApp com IA conversacional habilitada!');
    } else {
        logger.info('📱 WhatsApp sem IA (modo básico)');
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

    // Verificar configuração
    if (!WHATSAPP_PHONE_ID || !WHATSAPP_TOKEN) {
        logger.warn('⚠️ WhatsApp não configurado completamente. Defina WHATSAPP_PHONE_ID e WHATSAPP_TOKEN');
    } else {
        logger.info('✅ WhatsApp Business API Service V2 inicializado');
        logger.info(`   Phone ID: ${WHATSAPP_PHONE_ID.substring(0, 8)}...`);
        logger.info(`   API URL: ${WHATSAPP_API_URL}`);
        logger.info(`   Fila: ${messageQueue ? 'Ativada (Redis)' : 'Desativada (Modo direto)'}`);
        logger.info(`   Rate Limiting: ${limiter ? 'Ativo (80 msg/s)' : 'Inativo'}`);
    }

    logger.info('📱 WhatsApp Business API Service inicializado');
}

// ===== VERIFICAÇÃO DE WEBHOOK COM SIGNATURE =====
function verifyWebhookSignature(rawBody, signature) {
    if (!WHATSAPP_APP_SECRET) {
        logger.warn('⚠️ WHATSAPP_APP_SECRET não configurado - pulando verificação de signature');
        return true; // Em produção, deve retornar false
    }

    try {
        const expectedSignature = crypto
            .createHmac('sha256', WHATSAPP_APP_SECRET)
            .update(rawBody)
            .digest('hex');

        const signatureHash = signature.replace('sha256=', '');
        
        return crypto.timingSafeEqual(
            Buffer.from(signatureHash, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    } catch (error) {
        logger.error('Erro ao verificar signature do webhook:', error);
        return false;
    }
}

// ===== WEBHOOK VERIFICATION =====
function verifyWebhook(mode, token, challenge) {
    if (!WHATSAPP_VERIFY_TOKEN) {
        logger.warn('⚠️ WHATSAPP_VERIFY_TOKEN não configurado');
        return null;
    }

    logger.info(`🔍 Verificando webhook: mode=${mode}, token=${token ? '***' : 'null'}`);

    if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
        logger.info('✅ WhatsApp webhook verificado com sucesso');
        return challenge;
    }

    logger.warn('❌ Falha na verificação do webhook');
    logger.warn(`   Mode recebido: ${mode} (esperado: subscribe)`);
    logger.warn(`   Token match: ${token === WHATSAPP_VERIFY_TOKEN}`);
    
    return null;
}

// ===== IDENTIFICAR CLINICA PELO NUMERO =====
async function identifyClinicByNumber(toNumber) {
    try {
        const cleanNumber = toNumber.replace(/\D/g, '');
        
        const clinic = await Clinic.findOne({
            'contact.whatsapp': new RegExp(cleanNumber, 'i'),
            active: true
        });

        if (clinic) {
            logger.info(`Clinica identificada: ${clinic.name} (${clinic._id})`);
            return clinic;
        }

        logger.warn(`Nenhuma clinica encontrada para o numero: ${cleanNumber}`);
        return null;
    } catch (error) {
        logger.error('Erro ao identificar clinica:', error);
        return null;
    }
}

// ===== PROCESSAR MENSAGEM RECEBIDA =====
async function handleIncomingMessage(message, webhookMetadata = null) {
    try {
        const phoneNumber = message.from;
        const messageText = message.text?.body?.toLowerCase().trim();
        const messageType = message.type;
        
        const toNumber = webhookMetadata?.phone_number_id || WHATSAPP_PHONE_ID;
        const clinic = await identifyClinicByNumber(toNumber);

        if (!messageText || messageType !== 'text') {
            logger.info(`Mensagem ignorada (tipo: ${messageType})`);
            return;
        }

        logger.info(`Mensagem recebida de ${phoneNumber}: ${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}`);
        if (clinic) {
            logger.info(`Direcionada para: ${clinic.name}`);
        }

        let session = conversationState.get(phoneNumber);
        if (!session) {
            session = new ConversationSession(phoneNumber, clinic?._id);
            conversationState.set(phoneNumber, session);
        } else if (clinic && !session.clinicId) {
            session.clinicId = clinic._id;
        }

        if (['menu', 'início', 'iniciar', 'oi', 'olá', 'ola'].includes(messageText)) {
            session.reset();
            if (clinic) session.clinicId = clinic._id;
            await sendWelcomeMessage(phoneNumber, clinic);
            return;
        }

        if (messageText === 'cancelar') {
            session.reset();
            await sendMessage(phoneNumber, '❌ Operação cancelada. Digite *menu* para começar novamente.');
            return;
        }

        // Adicionar mensagem ao histórico
        session.addToHistory(messageText, true);
        
        // Processar baseado no estado da conversa
        await processConversationFlow(phoneNumber, messageText, session);

    } catch (error) {
        logger.error('Erro ao processar mensagem:', error);
        try {
            await sendMessage(message.from, '❌ Desculpe, ocorreu um erro. Digite *menu* para tentar novamente.');
        } catch (sendError) {
            logger.error('Erro ao enviar mensagem de erro:', sendError);
        }
    }
}

// ===== ENVIAR MENSAGEM (API PÚBLICA) =====
async function sendMessage(to, text, priority = 'normal') {
    if (!WHATSAPP_PHONE_ID || !WHATSAPP_TOKEN) {
        throw new Error('WhatsApp não configurado. Defina WHATSAPP_PHONE_ID e WHATSAPP_TOKEN');
    }

    // Se a fila estiver disponível e não for prioridade alta, usar fila
    if (messageQueue && priority !== 'high') {
        try {
            const job = await messageQueue.add(
                { to, text, retryCount: 0 },
                {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000
                    },
                    removeOnComplete: true,
                    removeOnFail: false
                }
            );
            logger.info(`📬 Mensagem adicionada à fila (Job ${job.id})`);
            return { queued: true, jobId: job.id };
        } catch (queueError) {
            logger.warn('⚠️ Falha ao adicionar à fila, enviando direto:', queueError.message);
            return await sendMessageInternal(to, text, 0);
        }
    }

    // Enviar diretamente
    return await sendMessageInternal(to, text, 0);
}

// ===== ENVIAR MENSAGEM (INTERNO COM RETRY) =====
async function sendMessageInternal(to, text, retryCount = 0) {
    const maxRetries = 3;

    try {
        // Usar rate limiter
        const result = await limiter.schedule(async () => {
            const response = await axios.post(
                `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to: to,
                    type: 'text',
                    text: { body: text }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000 // 10 segundos timeout
                }
            );

            return response.data;
        });

        logger.info(`✅ Mensagem enviada para ${to} (tentativa ${retryCount + 1})`);
        return result;

    } catch (error) {
        const errorCode = error.response?.data?.error?.code;
        const errorMessage = error.response?.data?.error?.message || error.message;
        const statusCode = error.response?.status;

        logger.error(`❌ Erro ao enviar mensagem (tentativa ${retryCount + 1}/${maxRetries}):`, {
            to,
            statusCode,
            errorCode,
            errorMessage
        });

        // Erros que não devem ser retentados
        const nonRetryableErrors = [
            'WABA_RATE_LIMIT_HIT', // Rate limit atingido
            'WABA_ACCOUNT_RESTRICTED', // Conta restrita
            'RECIPIENT_NOT_REGISTERED', // Número não cadastrado no WhatsApp
            'INVALID_PARAMETER', // Parâmetro inválido
            403, // Forbidden
            400 // Bad Request
        ];

        const shouldRetry = 
            retryCount < maxRetries &&
            !nonRetryableErrors.includes(errorCode) &&
            !nonRetryableErrors.includes(statusCode);

        if (shouldRetry) {
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
            logger.info(`⏳ Tentando novamente em ${delay}ms...`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            return await sendMessageInternal(to, text, retryCount + 1);
        }

        // Tratamento de erros específicos
        if (errorCode === 'WABA_RATE_LIMIT_HIT') {
            throw new Error('Rate limit do WhatsApp atingido. Tente novamente mais tarde.');
        } else if (errorCode === 'RECIPIENT_NOT_REGISTERED') {
            throw new Error('Número não está registrado no WhatsApp.');
        } else if (statusCode === 403) {
            throw new Error('Acesso negado pela API do WhatsApp. Verifique suas credenciais e permissões.');
        } else if (statusCode === 401) {
            throw new Error('Token de autenticação inválido. Verifique WHATSAPP_TOKEN.');
        }

        throw new Error(`Erro ao enviar mensagem: ${errorMessage}`);
    }
}

// ===== FLUXO DE CONVERSA =====
async function processConversationFlow(phoneNumber, messageText, session) {
    logger.info(`Processando conversa: estado=${session.state}, mensagem=${messageText.substring(0, 30)}`);

    switch (session.state) {
        case 'initial':
            await handleInitialState(phoneNumber, messageText, session);
            break;

        case 'awaiting_specialty':
            await handleSpecialtySelection(phoneNumber, messageText, session);
            break;

        case 'awaiting_doctor':
            await handleDoctorSelection(phoneNumber, messageText, session);
            break;

        case 'awaiting_date':
            await handleDateSelection(phoneNumber, messageText, session);
            break;

        case 'awaiting_time':
            await handleTimeSelection(phoneNumber, messageText, session);
            break;

        case 'awaiting_patient_name':
            await handlePatientName(phoneNumber, messageText, session);
            break;

        case 'awaiting_confirmation':
            await handleConfirmation(phoneNumber, messageText, session);
            break;

        case 'view_appointments':
            await handleViewAppointments(phoneNumber, messageText, session);
            break;

        case 'cancel_appointment':
            await handleCancelAppointment(phoneNumber, messageText, session);
            break;

        case 'waitlist':
            await handleWaitlist(phoneNumber, messageText, session);
            break;

        case 'human_support':
            await handleHumanSupport(phoneNumber, messageText, session);
            break;

        default:
            session.reset();
            await sendWelcomeMessage(phoneNumber);
    }
}

// ===== HANDLER: ESTADO INICIAL =====
async function handleInitialState(phoneNumber, messageText, session) {
    const option = messageText.trim();

    switch (option) {
        case '1':
            // Marcar consulta
            session.setState('awaiting_specialty');
            await listSpecialties(phoneNumber, session.clinicId);
            break;

        case '2':
            // Ver consultas agendadas
            session.setState('view_appointments');
            await viewAppointments(phoneNumber, session);
            break;

        case '3':
            // Cancelar consulta
            session.setState('cancel_appointment');
            await listAppointmentsToCancel(phoneNumber, session);
            break;

        case '4':
            // Lista de espera
            session.setState('waitlist');
            await handleWaitlistFlow(phoneNumber, session);
            break;

        case '5':
            // Falar com humano
            session.setState('human_support');
            await requestHumanSupport(phoneNumber, session);
            break;

        default:
            // Usar IA se disponível
            if (session.useAI) {
                const aiResponse = await aiService.generateResponse(
                    messageText,
                    session.conversationHistory
                );
                if (aiResponse) {
                    await sendMessage(phoneNumber, aiResponse);
                    session.addToHistory(aiResponse, false);
                    return;
                }
            }

            // Resposta padrão
            await sendMessage(phoneNumber, 
                `Ops! Não entendi... 😅\n\n` +
                `Digite o *número* da opção que você quer:\n` +
                `1 - Marcar consulta\n` +
                `2 - Ver consultas\n` +
                `3 - Cancelar\n` +
                `4 - Lista de espera\n` +
                `5 - Falar com alguém\n\n` +
                `Ou digite *menu* para ver todas as opções!`
            );
    }
}

// ===== HANDLER: SELEÇÃO DE ESPECIALIDADE =====
async function handleSpecialtySelection(phoneNumber, messageText, session) {
    try {
        const specialtyNumber = parseInt(messageText);
        
        let query = { active: true };
        if (session.clinicId) {
            const doctors = await Doctor.find({ clinic: session.clinicId, active: true }).distinct('specialties');
            if (doctors.length > 0) {
                query._id = { $in: doctors };
            }
        }
        
        const specialties = await Specialty.find(query).sort('name');

        if (!specialtyNumber || specialtyNumber < 1 || specialtyNumber > specialties.length) {
            await sendMessage(phoneNumber, 
                `Hmm, número inválido... 🤔\n\n` +
                `Digite o *número* da especialidade que você quer.\n` +
                `Ou digite *menu* para voltar ao início.`
            );
            return;
        }

        const selectedSpecialty = specialties[specialtyNumber - 1];
        session.setState('awaiting_doctor', { specialtyId: selectedSpecialty._id });

        await listDoctors(phoneNumber, selectedSpecialty._id, session.clinicId);

    } catch (error) {
        logger.error('Erro ao processar especialidade:', error);
        await sendMessage(phoneNumber, 
            `Ops! Algo deu errado... 😓\n\n` +
            `Digite *menu* para tentar novamente.`
        );
    }
}

// ===== HANDLER: SELEÇÃO DE MÉDICO =====
async function handleDoctorSelection(phoneNumber, messageText, session) {
    try {
        const doctorNumber = parseInt(messageText);
        
        let query = { 
            specialties: session.getData('specialtyId'),
            active: true 
        };
        
        if (session.clinicId) {
            query.clinic = session.clinicId;
        }
        
        const doctors = await Doctor.find(query).populate('specialties');

        if (!doctorNumber || doctorNumber < 1 || doctorNumber > doctors.length) {
            await sendMessage(phoneNumber, 
                `Número inválido... 🤔\n\n` +
                `Digite o *número* do médico que você quer.`
            );
            return;
        }

        const selectedDoctor = doctors[doctorNumber - 1];
        session.setState('awaiting_date', { 
            doctorId: selectedDoctor._id,
            doctorName: selectedDoctor.name
        });

        await listAvailableDates(phoneNumber, selectedDoctor._id);

    } catch (error) {
        logger.error('Erro ao processar médico:', error);
        await sendMessage(phoneNumber, 
            `Ops! Algo deu errado... 😓\n\nDigite *menu* para tentar novamente.`
        );
    }
}

// ===== HANDLER: SELEÇÃO DE DATA =====
async function handleDateSelection(phoneNumber, messageText, session) {
    // Validar formato de data (DD/MM ou DD/MM/AAAA)
    const dateRegex = /^(\d{1,2})\/(\d{1,2})(\/\d{4})?$/;
    const match = messageText.match(dateRegex);

    if (!match) {
        await sendMessage(phoneNumber, 
            `Data inválida! 📅\n\n` +
            `Use o formato: DD/MM\n` +
            `Exemplo: 15/12`
        );
        return;
    }

    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    const year = match[3] ? parseInt(match[3].substring(1)) : new Date().getFullYear();

    const selectedDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
        await sendMessage(phoneNumber, 
            `Essa data já passou! ⏰\n\n` +
            `Por favor, escolha uma data futura.`
        );
        return;
    }

    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    session.setState('awaiting_time', { scheduledDate: dateStr });

    await listAvailableTimes(phoneNumber, session.getData('doctorId'), dateStr);
}

// ===== HANDLER: SELEÇÃO DE HORÁRIO =====
async function handleTimeSelection(phoneNumber, messageText, session) {
    const timeRegex = /^(\d{1,2}):(\d{2})$/;
    const match = messageText.match(timeRegex);

    if (!match) {
        await sendMessage(phoneNumber, 
            `Horário inválido! ⏰\n\n` +
            `Use o formato: HH:MM\n` +
            `Exemplo: 14:30`
        );
        return;
    }

    const hour = parseInt(match[1]);
    const minute = parseInt(match[2]);

    if (hour < 8 || hour > 18 || minute < 0 || minute > 59) {
        await sendMessage(phoneNumber, 
            `Horário fora do expediente! 🕐\n\n` +
            `Atendemos de 08:00 às 18:00.`
        );
        return;
    }

    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    session.setState('awaiting_patient_name', { scheduledTime: timeStr });

    await sendMessage(phoneNumber, 
        `Perfeito! 👌\n\n` +
        `Agora me diz: *qual é o seu nome completo?*`
    );
}

// ===== HANDLER: NOME DO PACIENTE =====
async function handlePatientName(phoneNumber, messageText, session) {
    if (messageText.length < 3) {
        await sendMessage(phoneNumber, 
            `Nome muito curto! 🤔\n\n` +
            `Por favor, digite seu *nome completo*.`
        );
        return;
    }

    session.setState('awaiting_confirmation', { patientName: messageText });

    await confirmAppointment(phoneNumber, session);
}

// ===== HANDLER: CONFIRMAÇÃO =====
async function handleConfirmation(phoneNumber, messageText, session) {
    const response = messageText.toLowerCase();

    if (response === 'sim' || response === '1' || response === 's') {
        await createAppointment(phoneNumber, session);
    } else if (response === 'não' || response === 'nao' || response === '2' || response === 'n') {
        session.reset();
        await sendMessage(phoneNumber, 
            `Tudo bem! ❌\n\n` +
            `Agendamento cancelado.\n` +
            `Digite *menu* quando quiser tentar novamente!`
        );
    } else {
        await sendMessage(phoneNumber, 
            `Não entendi... 🤔\n\n` +
            `Digite *sim* para confirmar ou *não* para cancelar.`
        );
    }
}

// ===== FUNÇÕES AUXILIARES =====

async function listSpecialties(phoneNumber, clinicId = null) {
    let query = { active: true };
    
    if (clinicId) {
        const doctors = await Doctor.find({ clinic: clinicId, active: true }).distinct('specialties');
        if (doctors.length > 0) {
            query._id = { $in: doctors };
        }
    }
    
    const specialties = await Specialty.find(query).sort('name');
    
    if (specialties.length === 0) {
        await sendMessage(phoneNumber,
            `Ops! No momento não temos especialidades disponíveis. 😓\n\n` +
            `Entre em contato conosco pelo telefone para mais informações.`
        );
        return;
    }

    let message = `Legal! Vamos agendar sua consulta!\n\nQual especialidade voce precisa?\n\n`;
    
    specialties.forEach((spec, index) => {
        message += `${index + 1}️⃣ ${spec.name}\n`;
    });
    
    message += `\nDigite o *número* da especialidade!`;
    
    await sendMessage(phoneNumber, message);
}

async function listDoctors(phoneNumber, specialtyId, clinicId = null) {
    let query = { specialties: specialtyId, active: true };
    
    if (clinicId) {
        query.clinic = clinicId;
    }
    
    const doctors = await Doctor.find(query).populate('specialties');
    
    if (doctors.length === 0) {
        await sendMessage(phoneNumber,
            `Ops! No momento não temos médicos disponíveis nessa especialidade. 😓\n\n` +
            `Digite *menu* para tentar outra opção.`
        );
        return;
    }

    const profissional = doctors.length > 1 ? 'profissionais disponiveis' : 'profissional disponivel';
    let message = `Otimo! Temos ${doctors.length} ${profissional}:\n\n`;
    
    doctors.forEach((doc, index) => {
        message += `${index + 1} *${doc.name}*\n`;
        if (doc.crm && doc.crm.number) message += `   CRM: ${doc.crm.number}${doc.crm.state ? '/' + doc.crm.state : ''}\n`;
        message += `\n`;
    });
    
    message += `Digite o *número* do médico que você prefere!`;
    
    await sendMessage(phoneNumber, message);
}

async function listAvailableDates(phoneNumber, doctorId) {
    const message = `Perfeito! 👌\n\n` +
        `Agora me diz: *qual data você prefere?*\n\n` +
        `📅 Use o formato: DD/MM\n` +
        `Exemplo: 15/12\n\n` +
        `_Dica: Temos horários disponíveis de segunda a sexta!_`;
    
    await sendMessage(phoneNumber, message);
}

async function listAvailableTimes(phoneNumber, doctorId, date) {
    const message = `Show! 📅\n\n` +
        `Agora escolha o *horário*:\n\n` +
        `⏰ Use o formato: HH:MM\n` +
        `Exemplo: 14:30\n\n` +
        `_Atendemos de 08:00 às 18:00_`;
    
    await sendMessage(phoneNumber, message);
}

async function confirmAppointment(phoneNumber, session) {
    const data = session.data;
    const date = new Date(data.scheduledDate + 'T' + data.scheduledTime);
    
    const message = `Perfeito! Vou confirmar os dados: ✅\n\n` +
        `👤 *Paciente:* ${data.patientName}\n` +
        `👨‍⚕️ *Médico:* ${data.doctorName}\n` +
        `📅 *Data:* ${date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n` +
        `⏰ *Horário:* ${data.scheduledTime}\n\n` +
        `Está tudo certo? 🤔\n\n` +
        `1️⃣ *Sim, confirmar!* ✅\n` +
        `2️⃣ *Não, cancelar* ❌`;
    
    await sendMessage(phoneNumber, message);
}

async function createAppointment(phoneNumber, session) {
    try {
        const data = session.data;
        
        const appointment = new Appointment({
            patient: {
                name: data.patientName,
                phone: phoneNumber,
                email: ''
            },
            doctor: data.doctorId,
            clinic: session.clinicId || null,
            scheduledDate: data.scheduledDate,
            scheduledTime: data.scheduledTime,
            status: 'scheduled',
            source: 'whatsapp',
            notes: session.clinicId ? 
                `Agendamento via WhatsApp automatico (Clinica: ${session.clinicId})` :
                'Agendamento via WhatsApp automatico'
        });

        await appointment.save();
        
        // Tentar criar no Google Calendar
        try {
            if (googleCalendarService.isAuthenticated()) {
                await googleCalendarService.createEvent(appointment);
                logger.info(`✅ Evento criado no Google Calendar para ${phoneNumber}`);
            }
        } catch (calendarError) {
            logger.warn('Erro ao criar evento no Google Calendar:', calendarError.message);
        }

        const date = new Date(data.scheduledDate + 'T' + data.scheduledTime);
        
        await sendMessage(phoneNumber,
            `🎉 *Consulta agendada com sucesso!*\n\n` +
            `👤 ${data.patientName}\n` +
            `📅 ${date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}\n` +
            `⏰ ${data.scheduledTime}\n` +
            `👨‍⚕️ Dr(a). ${data.doctorName}\n\n` +
            `📱 Você vai receber um lembrete antes da consulta!\n\n` +
            `Qualquer dúvida, é só mandar mensagem! 😊\n\n` +
            `_Digite *menu* para mais opções._`,
            'high'
        );

        session.reset();
        
        logger.info(`✅ Consulta agendada via WhatsApp para ${phoneNumber}`);

    } catch (error) {
        logger.error('Erro ao criar agendamento:', error);
        await sendMessage(phoneNumber,
            `Ops! Algo deu errado ao agendar sua consulta... 😓\n\n` +
            `Por favor, tente novamente digitando *menu*.\n\n` +
            `Se o problema persistir, entre em contato conosco!`
        );
    }
}

async function viewAppointments(phoneNumber, session) {
    try {
        const appointments = await Appointment.find({
            'patient.phone': phoneNumber,
            status: { $in: ['scheduled', 'confirmed'] }
        }).populate('doctor').sort('scheduledDate scheduledTime');

        if (appointments.length === 0) {
            await sendMessage(phoneNumber,
                `Você não tem consultas agendadas no momento. 📅\n\n` +
                `Digite *1* para marcar uma nova consulta!\n` +
                `Ou *menu* para ver outras opções.`
            );
            session.reset();
            return;
        }

        let message = `Suas consultas agendadas: 📋\n\n`;
        
        appointments.forEach((apt, index) => {
            const date = new Date(apt.scheduledDate + 'T' + apt.scheduledTime);
            message += `${index + 1}️⃣ *${apt.doctor?.name || 'Médico não definido'}*\n`;
            message += `   📅 ${date.toLocaleDateString('pt-BR')}\n`;
            message += `   ⏰ ${apt.scheduledTime}\n`;
            message += `   📍 Status: ${apt.status === 'confirmed' ? 'Confirmada ✅' : 'Agendada 📅'}\n\n`;
        });

        message += `Digite *menu* para voltar às opções.`;
        
        await sendMessage(phoneNumber, message);
        session.reset();

    } catch (error) {
        logger.error('Erro ao listar agendamentos:', error);
        await sendMessage(phoneNumber,
            `Ops! Algo deu errado... 😓\n\nDigite *menu* para tentar novamente.`
        );
    }
}

async function listAppointmentsToCancel(phoneNumber, session) {
    try {
        const appointments = await Appointment.find({
            'patient.phone': phoneNumber,
            status: { $in: ['scheduled', 'confirmed'] }
        }).populate('doctor').sort('scheduledDate scheduledTime');

        if (appointments.length === 0) {
            await sendMessage(phoneNumber,
                `Você não tem consultas para cancelar. 📅\n\n` +
                `Digite *menu* para ver outras opções.`
            );
            session.reset();
            return;
        }

        let message = `Qual consulta você quer cancelar? 🤔\n\n`;
        
        appointments.forEach((apt, index) => {
            const date = new Date(apt.scheduledDate + 'T' + apt.scheduledTime);
            message += `${index + 1}️⃣ ${apt.doctor?.name || 'Médico'}\n`;
            message += `   📅 ${date.toLocaleDateString('pt-BR')} às ${apt.scheduledTime}\n\n`;
        });

        message += `Digite o *número* da consulta para cancelar.\n`;
        message += `Ou *menu* para voltar.`;
        
        session.setState('cancel_appointment', { appointments: appointments.map(a => a._id.toString()) });
        
        await sendMessage(phoneNumber, message);

    } catch (error) {
        logger.error('Erro ao listar agendamentos:', error);
        await sendMessage(phoneNumber,
            `Ops! Algo deu errado... 😓\n\nDigite *menu* para tentar novamente.`
        );
    }
}

async function handleViewAppointments(phoneNumber, messageText, session) {
    session.reset();
    await sendWelcomeMessage(phoneNumber);
}

async function handleCancelAppointment(phoneNumber, messageText, session) {
    try {
        const appointmentNumber = parseInt(messageText);
        const appointmentIds = session.getData('appointments') || [];

        if (!appointmentNumber || appointmentNumber < 1 || appointmentNumber > appointmentIds.length) {
            await sendMessage(phoneNumber,
                `Número inválido... 🤔\n\n` +
                `Digite o *número* da consulta que você quer cancelar.`
            );
            return;
        }

        const appointmentId = appointmentIds[appointmentNumber - 1];
        const appointment = await Appointment.findById(appointmentId).populate('doctor');

        if (!appointment) {
            await sendMessage(phoneNumber,
                `Consulta não encontrada... 😓\n\nDigite *menu* para tentar novamente.`
            );
            session.reset();
            return;
        }

        appointment.status = 'cancelled';
        appointment.cancellationReason = 'Cancelado pelo paciente via WhatsApp';
        appointment.cancelledAt = new Date();
        await appointment.save();

        const date = new Date(appointment.scheduledDate + 'T' + appointment.scheduledTime);

        await sendMessage(phoneNumber,
            `✅ *Consulta cancelada com sucesso!*\n\n` +
            `👨‍⚕️ ${appointment.doctor?.name || 'Médico'}\n` +
            `📅 ${date.toLocaleDateString('pt-BR')} às ${appointment.scheduledTime}\n\n` +
            `Se quiser remarcar, é só digitar *1*!\n\n` +
            `_Digite *menu* para mais opções._`
        );

        session.reset();
        logger.info(`✅ Consulta cancelada via WhatsApp: ${appointmentId}`);

    } catch (error) {
        logger.error('Erro ao cancelar agendamento:', error);
        await sendMessage(phoneNumber,
            `Ops! Algo deu errado... 😓\n\nDigite *menu* para tentar novamente.`
        );
    }
}

async function handleWaitlistFlow(phoneNumber, session) {
    await sendMessage(phoneNumber,
        `📋 *Lista de Espera*\n\n` +
        `Essa funcionalidade está em desenvolvimento! 🚧\n\n` +
        `Em breve você poderá entrar na lista de espera para horários que abrirem.\n\n` +
        `Por enquanto, entre em contato conosco diretamente.\n\n` +
        `Digite *menu* para voltar.`
    );
    session.reset();
}

async function handleWaitlist(phoneNumber, messageText, session) {
    session.reset();
    await sendWelcomeMessage(phoneNumber);
}

async function requestHumanSupport(phoneNumber, session) {
    await sendMessage(phoneNumber,
        `👨‍💼 *Atendimento Humano*\n\n` +
        `Entendi! Vou transferir você para nossa equipe.\n\n` +
        `📞 Você também pode ligar para:\n` +
        `*${process.env.SUPPORT_PHONE || '(11) 0000-0000'}*\n\n` +
        `📧 Ou enviar email para:\n` +
        `*${process.env.SUPPORT_EMAIL || 'contato@atenmed.com.br'}*\n\n` +
        `Nosso horário de atendimento:\n` +
        `Segunda a Sexta: 08:00 às 18:00\n\n` +
        `_Digite *menu* para voltar às opções automáticas._`
    );
    session.reset();
}

async function handleHumanSupport(phoneNumber, messageText, session) {
    session.reset();
    await sendWelcomeMessage(phoneNumber);
}

// ===== MENSAGEM DE BOAS-VINDAS =====
async function sendWelcomeMessage(phoneNumber, clinic = null) {
    const hour = new Date().getHours();
    let greeting;

    if (hour < 12) {
        greeting = 'Bom dia!';
    } else if (hour < 18) {
        greeting = 'Boa tarde!';
    } else {
        greeting = 'Boa noite!';
    }

    const clinicName = clinic ? clinic.name : 'AtenMed';
    
    const welcomes = [
        `${greeting} Tudo bem? Aqui e da *${clinicName}*!`,
        `${greeting} Como vai? Sou da equipe *${clinicName}*!`,
        `${greeting} Prazer em falar com voce! Aqui e da *${clinicName}*!`
    ];
    
    const randomWelcome = welcomes[Math.floor(Math.random() * welcomes.length)];
    
    const message = `${randomWelcome}

Em que posso te ajudar hoje? 😊

1️⃣ Quero marcar uma consulta
2️⃣ Ver minhas consultas agendadas
3️⃣ Preciso cancelar uma consulta
4️⃣ Entrar na lista de espera
5️⃣ Falar com alguém da equipe

É só digitar o número da opção!`;

    await sendMessage(phoneNumber, message, 'high');
}

// ===== ENVIAR LEMBRETE =====
async function sendReminder(phoneNumber, appointment) {
    const appointmentDate = new Date(appointment.scheduledDate + 'T' + appointment.scheduledTime);
    const now = new Date();
    const hoursUntil = Math.round((appointmentDate - now) / (1000 * 60 * 60));
    
    let timeText;
    if (hoursUntil <= 1) {
        timeText = 'já é daqui a pouco';
    } else if (hoursUntil < 24) {
        timeText = `é daqui a ${hoursUntil} hora${hoursUntil > 1 ? 's' : ''}`;
    } else {
        timeText = 'é amanhã';
    }

    const message = `Oi! Passando aqui pra te lembrar... 😊

Sua consulta ${timeText}! 📅

👤 *${appointment.patient.name}*
📅 *${appointmentDate.toLocaleDateString('pt-BR')}* às *${appointment.scheduledTime}*
👨‍⚕️ Com *${appointment.doctor?.name}*
🏥 Na *${appointment.clinic?.name}*

Você vai conseguir vir? 🤔

1️⃣ *Sim! Vou comparecer* ✅
2️⃣ *Preciso remarcar* 📅`;

    await sendMessage(phoneNumber, message, 'high');
}

// ===== ESTATÍSTICAS DO SERVIÇO =====
function getStats() {
    return {
        activeSessions: conversationState.size,
        queueEnabled: !!messageQueue,
        rateLimiterActive: !!limiter,
        configured: !!(WHATSAPP_PHONE_ID && WHATSAPP_TOKEN)
    };
}

// ===== HEALTH CHECK =====
function healthCheck() {
    const isConfigured = !!(WHATSAPP_PHONE_ID && WHATSAPP_TOKEN);
    const issues = [];

    if (!WHATSAPP_PHONE_ID) issues.push('WHATSAPP_PHONE_ID não configurado');
    if (!WHATSAPP_TOKEN) issues.push('WHATSAPP_TOKEN não configurado');
    if (!WHATSAPP_VERIFY_TOKEN) issues.push('WHATSAPP_VERIFY_TOKEN não configurado');
    if (!WHATSAPP_APP_SECRET) issues.push('WHATSAPP_APP_SECRET não configurado (recomendado)');
    if (!messageQueue) issues.push('Redis não disponível (fila desabilitada)');

    return {
        healthy: isConfigured,
        issues: issues.length > 0 ? issues : null,
        stats: getStats()
    };
}

// ===== EXPORTAR =====
module.exports = {
    initialize,
    verifyWebhook,
    verifyWebhookSignature,
    handleIncomingMessage,
    sendMessage,
    sendReminder,
    getStats,
    healthCheck
};



