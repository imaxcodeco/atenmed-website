/**
 * AtenMed - WhatsApp Business API Service
 * Serviço de integração com WhatsApp Business API
 * Implementa bot conversacional para agendamento de consultas
 */

const axios = require('axios');
const logger = require('../utils/logger');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Specialty = require('../models/Specialty');
const Clinic = require('../models/Clinic');
const Waitlist = require('../models/Waitlist');
const googleCalendarService = require('./googleCalendarService');
const aiService = require('./aiService');

// ===== CONFIGURAÇÃO =====
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// Estado das conversas (em produção, usar Redis ou banco de dados)
const conversationState = new Map();

// ===== SESSÃO DE CONVERSA =====
class ConversationSession {
    constructor(phoneNumber) {
        this.phoneNumber = phoneNumber;
        this.state = 'initial';
        this.data = {};
        this.lastActivity = Date.now();
        this.conversationHistory = []; // Para IA
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
        
        // Manter apenas últimas 10 mensagens
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
    // Inicializar AI Service
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

    logger.info('📱 WhatsApp Business API Service inicializado');
}

// ===== WEBHOOK VERIFICATION =====
function verifyWebhook(mode, token, challenge) {
    if (!WHATSAPP_VERIFY_TOKEN) {
        logger.warn('⚠️ WHATSAPP_VERIFY_TOKEN não configurado');
        return null;
    }
    if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
        logger.info('✅ WhatsApp webhook verificado com sucesso');
        return challenge;
    }
    return null;
}

// ===== PROCESSAR MENSAGEM RECEBIDA =====
async function handleIncomingMessage(message) {
    try {
        const phoneNumber = message.from;
        const messageText = message.text?.body?.toLowerCase().trim();
        const messageType = message.type;

        if (!messageText || messageType !== 'text') {
            return;
        }

        logger.info(`📩 Mensagem recebida de ${phoneNumber}: ${messageText}`);

        // Obter ou criar sessão
        let session = conversationState.get(phoneNumber);
        if (!session) {
            session = new ConversationSession(phoneNumber);
            conversationState.set(phoneNumber, session);
        }

        // Processar comandos globais
        if (messageText === 'menu' || messageText === 'início' || messageText === 'iniciar') {
            session.reset();
            await sendWelcomeMessage(phoneNumber);
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
        await sendMessage(message.from, '❌ Desculpe, ocorreu um erro. Digite *menu* para tentar novamente.');
    }
}

// ===== FLUXO DE CONVERSA =====
async function processConversationFlow(phoneNumber, messageText, session) {
    switch (session.state) {
        case 'initial':
            await sendWelcomeMessage(phoneNumber);
            session.setState('awaiting_action');
            break;

        case 'awaiting_action':
            await handleActionSelection(phoneNumber, messageText, session);
            break;

        case 'awaiting_clinic':
            await handleClinicSelection(phoneNumber, messageText, session);
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
            await handleFinalConfirmation(phoneNumber, messageText, session);
            break;

        case 'awaiting_appointment_id':
            await handleAppointmentCheck(phoneNumber, messageText, session);
            break;

        default:
            await sendWelcomeMessage(phoneNumber);
            session.setState('awaiting_action');
    }
}

// ===== MENSAGEM DE BOAS-VINDAS =====
async function sendWelcomeMessage(phoneNumber) {
    const hour = new Date().getHours();
    let greeting;
    
    if (hour < 12) {
        greeting = 'Bom dia! ☀️';
    } else if (hour < 18) {
        greeting = 'Boa tarde! 😊';
    } else {
        greeting = 'Boa noite! 🌙';
    }

    // Variar saudações para parecer mais humano
    const welcomes = [
        `${greeting} Tudo bem? Aqui é da *AtenMed*!`,
        `${greeting} Como vai? Sou da equipe *AtenMed*!`,
        `${greeting} Prazer em falar com você! Aqui é da *AtenMed*!`
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

    await sendMessage(phoneNumber, message);
}

// ===== SELEÇÃO DE AÇÃO =====
async function handleActionSelection(phoneNumber, messageText, session) {
    // Se IA estiver habilitada, analisar intenção
    let action = messageText;
    
    if (session.useAI && isNaN(messageText)) {
        const intent = await aiService.analyzeIntent(messageText);
        
        // Mapear intenção para ação
        if (intent === 'agendar') action = '1';
        else if (intent === 'consultar') action = '2';
        else if (intent === 'cancelar') action = '3';
        else if (intent === 'ajuda') action = '5';
        else if (intent === 'confirmar') action = '1'; // Assume que quer agendar
    }
    
    switch (action) {
        case '1':
            session.setState('awaiting_clinic');
            await sendTypingIndicator(phoneNumber);
            await sendClinicOptions(phoneNumber);
            break;

        case '2':
            session.setState('awaiting_appointment_id');
            const consultMessages = [
                'Claro! Vou verificar suas consultas aqui... 🔍\n\nPode me passar seu telefone ou o código da consulta?',
                'Perfeito! Deixa eu dar uma olhada nas suas consultas... 📋\n\nQual seu telefone ou código do agendamento?',
                'Certo! Vou buscar suas consultas aqui... ✨\n\nMe passa seu telefone ou o código?'
            ];
            await sendMessage(phoneNumber, consultMessages[Math.floor(Math.random() * consultMessages.length)]);
            break;

        case '3':
            session.setState('awaiting_appointment_id');
            session.data.cancelMode = true;
            const cancelMessages = [
                'Entendi... vou te ajudar com isso! 😔\n\nQual o código da consulta que você quer cancelar?',
                'Sem problemas! Acontece... 🤝\n\nMe passa o código da consulta pra eu cancelar pra você?',
                'Tudo bem! Vou cancelar pra você... 👌\n\nQual o código da consulta?'
            ];
            await sendMessage(phoneNumber, cancelMessages[Math.floor(Math.random() * cancelMessages.length)]);
            break;

        case '4':
            session.setState('awaiting_clinic');
            session.data.waitlistMode = true;
            await sendMessage(phoneNumber, 'Boa! Vou te colocar na lista de espera... 📝\n\nVamos começar:');
            await sendTypingIndicator(phoneNumber);
            await sendClinicOptions(phoneNumber);
            break;

        case '5':
            const transferMessages = [
                '👤 Tudo bem! Vou chamar alguém da equipe pra falar com você...\n\nSó um momentinho! ⏱️',
                '👤 Claro! Deixa eu transferir você pra um colega meu...\n\nJá volto! 😊',
                '👤 Combinado! Vou te passar pra alguém da equipe agora...\n\nAguarda só um pouquinho! ✨'
            ];
            await sendMessage(phoneNumber, transferMessages[Math.floor(Math.random() * transferMessages.length)]);
            session.reset();
            break;

        default:
            // Se IA está habilitada, tentar gerar resposta contextual
            if (session.useAI) {
                const aiResponse = await aiService.processMessage(
                    messageText,
                    session.conversationHistory
                );
                
                if (aiResponse) {
                    await sendMessage(phoneNumber, aiResponse);
                    session.addToHistory(aiResponse, false);
                    
                    // Reenviar menu após resposta da IA
                    await sendTypingIndicator(phoneNumber, 1000);
                    await sendWelcomeMessage(phoneNumber);
                    return;
                }
            }
            
            const errorMessages = [
                'Ops! Não entendi direito... 😅\n\nPode escolher uma opção de 1 a 5?',
                'Hmm... essa opção não tá aqui não... 🤔\n\nTenta de novo? Digite um número de 1 a 5!',
                'Eita! Não achei essa opção... 😬\n\nEscolhe uma de 1 a 5, por favor!'
            ];
            await sendMessage(phoneNumber, errorMessages[Math.floor(Math.random() * errorMessages.length)]);
    }
}

// ===== SIMULAR "DIGITANDO..." =====
async function sendTypingIndicator(phoneNumber, delayMs = 1500) {
    // Simula tempo de digitação para parecer mais humano
    await new Promise(resolve => setTimeout(resolve, delayMs));
}

// ===== ENVIAR OPÇÕES DE CLÍNICA =====
async function sendClinicOptions(phoneNumber) {
    try {
        const clinics = await Clinic.find({ isActive: true }).select('name address');

        if (clinics.length === 0) {
            await sendMessage(phoneNumber, 'Puts... no momento não temos clínicas disponíveis. 😔\n\nTenta de novo mais tarde?');
            return;
        }

        const introMessages = [
            'Legal! Vamos lá então... 😊\n\nOnde você prefere ser atendido?',
            'Perfeito! Primeiro passo... 🏥\n\nQual clínica fica melhor pra você?',
            'Ótimo! Vamos marcar então... ✨\n\nEm qual clínica você quer consultar?'
        ];

        let message = introMessages[Math.floor(Math.random() * introMessages.length)] + '\n\n';
        
        clinics.forEach((clinic, index) => {
            message += `${index + 1}️⃣ *${clinic.name}*\n`;
            if (clinic.address) {
                message += `   📍 ${clinic.address}\n`;
            }
            message += '\n';
        });

        message += 'Qual você escolhe? É só digitar o número!';

        await sendMessage(phoneNumber, message);
    } catch (error) {
        logger.error('Erro ao buscar clínicas:', error);
        const errorMessages = [
            'Ai, deu um probleminha aqui... 😅\n\nTenta de novo pra mim?',
            'Ops! Algo deu errado... 🤔\n\nVamos tentar mais uma vez?',
            'Eita! Sistema travou aqui... 😬\n\nTenta novamente, por favor!'
        ];
        await sendMessage(phoneNumber, errorMessages[Math.floor(Math.random() * errorMessages.length)]);
    }
}

// ===== SELEÇÃO DE CLÍNICA =====
async function handleClinicSelection(phoneNumber, messageText, session) {
    try {
        const clinicIndex = parseInt(messageText) - 1;
        const clinics = await Clinic.find({ isActive: true });

        if (clinicIndex < 0 || clinicIndex >= clinics.length) {
            const errorMessages = [
                'Hmm... esse número não tá aqui não... 🤔\n\nTenta escolher um dos que aparecem na lista?',
                'Opa! Não achei essa opção... 😅\n\nEscolhe um número da lista, por favor!',
                'Puts! Número inválido... 😬\n\nVamos tentar de novo? Digite um número que apareça aí!'
            ];
            await sendMessage(phoneNumber, errorMessages[Math.floor(Math.random() * errorMessages.length)]);
            return;
        }

        const clinic = clinics[clinicIndex];
        session.setState('awaiting_specialty', { clinicId: clinic._id, clinicName: clinic.name });

        const confirmMessages = [
            `Show! ${clinic.name} escolhida! 👍`,
            `Boa escolha! ${clinic.name}! ✨`,
            `Perfeito! Vamos marcar na ${clinic.name} então! 😊`
        ];
        
        await sendMessage(phoneNumber, confirmMessages[Math.floor(Math.random() * confirmMessages.length)]);
        await sendTypingIndicator(phoneNumber, 1000);
        await sendSpecialtyOptions(phoneNumber, clinic._id);
    } catch (error) {
        logger.error('Erro ao processar clínica:', error);
        await sendMessage(phoneNumber, 'Ops! Deu um errinho aqui... 😅\n\nVamos tentar de novo?');
    }
}

// ===== ENVIAR OPÇÕES DE ESPECIALIDADE =====
async function sendSpecialtyOptions(phoneNumber, clinicId) {
    try {
        const specialties = await Specialty.find({ clinic: clinicId }).select('name description');

        if (specialties.length === 0) {
            await sendMessage(phoneNumber, 'Putz... essa clínica tá sem especialidades no momento. 😕\n\nQuer tentar outra?');
            return;
        }

        const introMessages = [
            'Agora me diz... qual especialidade você precisa? 🩺',
            'Certo! E pra qual especialidade você quer marcar? 👨‍⚕️',
            'Beleza! Agora escolhe a área... qual especialidade? 💉'
        ];

        let message = introMessages[Math.floor(Math.random() * introMessages.length)] + '\n\n';
        
        specialties.forEach((specialty, index) => {
            message += `${index + 1}️⃣ *${specialty.name}*\n`;
            if (specialty.description) {
                message += `   ${specialty.description}\n`;
            }
            message += '\n';
        });

        message += 'Qual delas? 😊';

        await sendMessage(phoneNumber, message);
    } catch (error) {
        logger.error('Erro ao buscar especialidades:', error);
        await sendMessage(phoneNumber, 'Eita! Travou aqui... 😅\n\nTenta de novo pra mim?');
    }
}

// ===== SELEÇÃO DE ESPECIALIDADE =====
async function handleSpecialtySelection(phoneNumber, messageText, session) {
    try {
        const specialtyIndex = parseInt(messageText) - 1;
        const specialties = await Specialty.find({ clinic: session.getData('clinicId') });

        if (specialtyIndex < 0 || specialtyIndex >= specialties.length) {
            await sendMessage(phoneNumber, '❓ Número inválido. Por favor, escolha uma opção válida.');
            return;
        }

        const specialty = specialties[specialtyIndex];
        session.setState('awaiting_doctor', { 
            specialtyId: specialty._id, 
            specialtyName: specialty.name 
        });

        await sendDoctorOptions(phoneNumber, specialty._id);
    } catch (error) {
        logger.error('Erro ao processar especialidade:', error);
        await sendMessage(phoneNumber, '❌ Erro ao processar. Tente novamente.');
    }
}

// ===== ENVIAR OPÇÕES DE MÉDICO =====
async function sendDoctorOptions(phoneNumber, specialtyId) {
    try {
        const doctors = await Doctor.find({ 
            specialties: specialtyId, 
            isActive: true 
        }).select('name');

        if (doctors.length === 0) {
            await sendMessage(phoneNumber, '❌ Nenhum médico disponível para esta especialidade.');
            return;
        }

        let message = '👨‍⚕️ *Escolha o médico:*\n\n';
        doctors.forEach((doctor, index) => {
            message += `${index + 1}️⃣ ${doctor.name}\n`;
        });
        message += '\n0️⃣ Qualquer médico disponível';

        await sendMessage(phoneNumber, message);
    } catch (error) {
        logger.error('Erro ao buscar médicos:', error);
        await sendMessage(phoneNumber, '❌ Erro ao buscar médicos. Tente novamente.');
    }
}

// ===== SELEÇÃO DE MÉDICO =====
async function handleDoctorSelection(phoneNumber, messageText, session) {
    try {
        const doctors = await Doctor.find({ 
            specialties: session.getData('specialtyId'), 
            isActive: true 
        });

        let doctor;
        if (messageText === '0') {
            doctor = doctors[0];
            const anyDoctorMessages = [
                `Legal! Então vou buscar o primeiro disponível pra você... 👌`,
                `Boa! Deixa comigo, vou achar o melhor horário disponível! ✨`,
                `Tranquilo! Vou ver quem tá disponível pra te atender! 😊`
            ];
            await sendMessage(phoneNumber, anyDoctorMessages[Math.floor(Math.random() * anyDoctorMessages.length)]);
        } else {
            const doctorIndex = parseInt(messageText) - 1;
            if (doctorIndex < 0 || doctorIndex >= doctors.length) {
                await sendMessage(phoneNumber, 'Hmm... não achei esse número aqui... 😅\n\nEscolhe um da lista, por favor!');
                return;
            }
            doctor = doctors[doctorIndex];
            const confirmDoctorMessages = [
                `Perfeito! Vou marcar com ${doctor.name}! 👨‍⚕️`,
                `Ótima escolha! ${doctor.name} é muito bom(a)! ✨`,
                `Show! Marcando com ${doctor.name} então! 😊`
            ];
            await sendMessage(phoneNumber, confirmDoctorMessages[Math.floor(Math.random() * confirmDoctorMessages.length)]);
        }

        session.setState('awaiting_date', { 
            doctorId: doctor._id, 
            doctorName: doctor.name,
            calendarId: doctor.googleCalendarId
        });

        await sendTypingIndicator(phoneNumber, 1000);
        
        const dateMessages = [
            `📅 Agora me fala... que dia você quer vir?\n\nDigita no formato: *DD/MM/AAAA*\nPor exemplo: 25/12/2024`,
            `📅 Beleza! E qual dia fica melhor pra você?\n\nManda assim: *DD/MM/AAAA*\nExemplo: 25/12/2024`,
            `📅 Certo! Qual a data que você prefere?\n\nEscreve assim: *DD/MM/AAAA*\nTipo: 25/12/2024`
        ];
        
        await sendMessage(phoneNumber, dateMessages[Math.floor(Math.random() * dateMessages.length)]);
    } catch (error) {
        logger.error('Erro ao processar médico:', error);
        await sendMessage(phoneNumber, 'Ops! Algo deu errado... 😬\n\nTenta de novo pra mim?');
    }
}

// ===== SELEÇÃO DE DATA =====
async function handleDateSelection(phoneNumber, messageText, session) {
    try {
        // Validar formato de data
        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const match = messageText.match(dateRegex);

        if (!match) {
            const formatErrorMessages = [
                'Ops! Não entendi essa data... 🤔\n\nTenta assim: *DD/MM/AAAA*\nPor exemplo: 25/12/2024',
                'Hmm... formato errado... 😅\n\nDigita assim: *DD/MM/AAAA*\nTipo: 25/12/2024',
                'Eita! Essa data tá estranha... 😬\n\nManda no formato: *DD/MM/AAAA*\nExemplo: 25/12/2024'
            ];
            await sendMessage(phoneNumber, formatErrorMessages[Math.floor(Math.random() * formatErrorMessages.length)]);
            return;
        }

        const [, day, month, year] = match;
        const date = new Date(year, month - 1, day);

        // Validar se a data é futura
        if (date < new Date()) {
            const pastDateMessages = [
                'Puts... essa data já passou! 😅\n\nEscolhe uma data futura, por favor!',
                'Opa! Não dá pra marcar no passado... 🤔\n\nManda uma data que ainda vai chegar!',
                'Eita! Essa já foi embora... 😬\n\nPrecisa ser uma data futura!'
            ];
            await sendMessage(phoneNumber, pastDateMessages[Math.floor(Math.random() * pastDateMessages.length)]);
            return;
        }

        session.setState('awaiting_time', { selectedDate: date });

        const checkingMessages = [
            `Legal! Deixa eu ver os horários disponíveis pra ${date.toLocaleDateString('pt-BR')}... 🔍`,
            `Boa! Vou olhar a agenda de ${date.toLocaleDateString('pt-BR')} aqui... ⏰`,
            `Show! Conferindo os horários de ${date.toLocaleDateString('pt-BR')}... 📋`
        ];
        
        await sendMessage(phoneNumber, checkingMessages[Math.floor(Math.random() * checkingMessages.length)]);
        await sendTypingIndicator(phoneNumber, 2000);
        
        // Buscar horários disponíveis
        await sendAvailableTimeSlots(phoneNumber, session);
    } catch (error) {
        logger.error('Erro ao processar data:', error);
        await sendMessage(phoneNumber, 'Ops! Deu pau aqui... 😅\n\nTenta digitar a data de novo?');
    }
}

// ===== ENVIAR HORÁRIOS DISPONÍVEIS =====
async function sendAvailableTimeSlots(phoneNumber, session) {
    try {
        const calendarId = session.getData('calendarId');
        const selectedDate = session.getData('selectedDate');

        // Normalizar data para YYYY-MM-DD
        const dateStr = (selectedDate instanceof Date)
            ? selectedDate.toISOString().slice(0, 10)
            : selectedDate;

        // Buscar slots disponíveis via Google Calendar
        const availableSlots = await googleCalendarService.getAvailableSlots(
            calendarId,
            dateStr,
            { slotDuration: 30 }
        );

        if (availableSlots.length === 0) {
            const noSlotsMessages = [
                `Puts... nesse dia tá lotado! 😕\n\nTenta outra data? Digita no formato *DD/MM/AAAA*`,
                `Ah não! Não achei nenhum horário livre nesse dia... 😔\n\nQue tal tentar outro dia? *DD/MM/AAAA*`,
                `Eita! Tá tudo ocupado nessa data... 😬\n\nEscolhe outro dia? Manda no formato *DD/MM/AAAA*`
            ];
            await sendMessage(phoneNumber, noSlotsMessages[Math.floor(Math.random() * noSlotsMessages.length)]);
            session.setState('awaiting_date');
            return;
        }

        const slotsMessages = [
            `Olha só! Achei esses horários vagos pra ${selectedDate.toLocaleDateString('pt-BR')}:`,
            `Legal! Tem essas opções disponíveis em ${selectedDate.toLocaleDateString('pt-BR')}:`,
            `Boa! Essas são as vagas livres pra ${selectedDate.toLocaleDateString('pt-BR')}:`
        ];

        let message = slotsMessages[Math.floor(Math.random() * slotsMessages.length)] + '\n\n🕐 ';
        availableSlots.slice(0, 10).forEach((slot, index) => {
            message += `${index + 1}️⃣ ${slot}\n`;
        });

        message += '\nQual horário fica melhor pra você? 😊';

        await sendMessage(phoneNumber, message);
    } catch (error) {
        logger.error('Erro ao buscar horários:', error);
        const errorMessages = [
            'Ai... deu um problema pra buscar os horários... 😅\n\nDigita a data de novo pra mim?',
            'Ops! Sistema travou aqui... 😬\n\nTenta mandar a data novamente?',
            'Eita! Não consegui verificar... 🤔\n\nManda a data de novo? *DD/MM/AAAA*'
        ];
        await sendMessage(phoneNumber, errorMessages[Math.floor(Math.random() * errorMessages.length)]);
        session.setState('awaiting_date');
    }
}

// ===== SELEÇÃO DE HORÁRIO =====
async function handleTimeSelection(phoneNumber, messageText, session) {
    try {
        const calendarId = session.getData('calendarId');
        const selectedDate = session.getData('selectedDate');

        // Normalizar data para YYYY-MM-DD
        const dateStr = (selectedDate instanceof Date)
            ? selectedDate.toISOString().slice(0, 10)
            : selectedDate;

        const availableSlots = await googleCalendarService.getAvailableSlots(
            calendarId,
            dateStr,
            { slotDuration: 30 }
        );

        const timeIndex = parseInt(messageText) - 1;
        if (timeIndex < 0 || timeIndex >= availableSlots.length) {
            await sendMessage(phoneNumber, '❓ Número inválido. Por favor, escolha uma opção válida.');
            return;
        }

        const selectedTime = availableSlots[timeIndex];
        session.setState('awaiting_patient_name', { selectedTime });

        await sendMessage(phoneNumber, '👤 Por favor, informe o *nome completo* do paciente:');
    } catch (error) {
        logger.error('Erro ao processar horário:', error);
        await sendMessage(phoneNumber, '❌ Erro ao processar. Tente novamente.');
    }
}

// ===== NOME DO PACIENTE =====
async function handlePatientName(phoneNumber, messageText, session) {
    if (messageText.length < 3) {
        const shortNameMessages = [
            'Hmm... esse nome tá muito curtinho... 🤔\n\nManda o nome completo pra mim?',
            'Ops! Preciso do nome completo, por favor! 😊',
            'Puts... nome muito pequeno... 😅\n\nDigita o nome todo?'
        ];
        await sendMessage(phoneNumber, shortNameMessages[Math.floor(Math.random() * shortNameMessages.length)]);
        return;
    }

    session.setState('awaiting_confirmation', { patientName: messageText });

    const preparingMessages = [
        'Perfeito! Deixa eu montar o resumo aqui pra você conferir... 📝',
        'Show! Vou organizar tudo certinho pra você ver... ✨',
        'Legal! Montando o resumo da consulta... 📋'
    ];
    
    await sendMessage(phoneNumber, preparingMessages[Math.floor(Math.random() * preparingMessages.length)]);
    await sendTypingIndicator(phoneNumber, 1500);

    // Resumo do agendamento
    const summaryIntros = [
        '✨ *Olha só como ficou:*',
        '📋 *Confere aí pra mim:*',
        '👀 *Tá tudo certo? Dá uma olhada:*'
    ];

    const summary = `${summaryIntros[Math.floor(Math.random() * summaryIntros.length)]}

👤 *Paciente:* ${session.getData('patientName')}
📞 *Telefone:* ${phoneNumber}
🏥 *Clínica:* ${session.getData('clinicName')}
🩺 *Especialidade:* ${session.getData('specialtyName')}
👨‍⚕️ *Médico(a):* ${session.getData('doctorName')}
📅 *Data:* ${session.getData('selectedDate').toLocaleDateString('pt-BR')}
🕐 *Horário:* ${session.getData('selectedTime')}

Tá tudo certo? Posso confirmar? 🤔

1️⃣ *Sim! Confirma aí* ✅
2️⃣ *Não, quero mudar algo* ❌`;

    await sendMessage(phoneNumber, summary);
}

// ===== CONFIRMAÇÃO FINAL =====
async function handleFinalConfirmation(phoneNumber, messageText, session) {
    if (messageText === '1') {
        const confirmingMessages = [
            'Eba! Bora marcar então! 🎉\n\nSó um instantinho...',
            'Show! Vou confirmar aqui pra você! ✨\n\nAguarda só um pouquinho...',
            'Perfeito! Já tô finalizando aqui! 😊\n\nSó mais um segundo...'
        ];
        await sendMessage(phoneNumber, confirmingMessages[Math.floor(Math.random() * confirmingMessages.length)]);
        await sendTypingIndicator(phoneNumber, 2000);
        await createAppointment(phoneNumber, session);
    } else if (messageText === '2') {
        session.reset();
        const cancelMessages = [
            'Tudo bem! Cancelei aqui... 👌\n\nQuando quiser marcar de novo é só digitar *menu*, beleza?',
            'Sem problemas! Não vou confirmar... 😊\n\nPra tentar de novo depois, digita *menu*!',
            'Tranquilo! Cancelado então... 👍\n\nQuando decidir, manda *menu* que a gente marca!'
        ];
        await sendMessage(phoneNumber, cancelMessages[Math.floor(Math.random() * cancelMessages.length)]);
    } else {
        const errorMessages = [
            'Hmm... não entendi... 😅\n\nDigita *1* pra confirmar ou *2* pra cancelar!',
            'Ops! Opção errada... 🤔\n\n*1* = Confirma | *2* = Cancela',
            'Eita! Escolhe *1* ou *2*, por favor! 😊'
        ];
        await sendMessage(phoneNumber, errorMessages[Math.floor(Math.random() * errorMessages.length)]);
    }
}

// ===== CRIAR AGENDAMENTO =====
async function createAppointment(phoneNumber, session) {
    try {
        const selectedDate = session.getData('selectedDate');
        const selectedTime = session.getData('selectedTime');

        // Criar data/hora completa
        const [hours, minutes] = selectedTime.split(':');
        const startTime = new Date(selectedDate);
        startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + 30);

        // Criar agendamento no banco
        const appointment = await Appointment.create({
            patient: {
                name: session.getData('patientName'),
                phone: phoneNumber
            },
            doctor: session.getData('doctorId'),
            specialty: session.getData('specialtyId'),
            clinic: session.getData('clinicId'),
            scheduledDate: selectedDate,
            scheduledTime: selectedTime,
            status: 'confirmado',
            source: 'whatsapp',
            confirmations: {
                patient: {
                    confirmed: true,
                    confirmedAt: new Date(),
                    method: 'whatsapp'
                }
            }
        });

        // Criar evento no Google Calendar
        await googleCalendarService.createCalendarEvent(session.getData('calendarId'), {
            summary: `Consulta - ${session.getData('patientName')}`,
            description: `Paciente: ${session.getData('patientName')}\nTelefone: ${phoneNumber}\nEspecialidade: ${session.getData('specialtyName')}`,
            startTime,
            endTime,
            attendees: []
        });

        const successIntros = [
            '🎉 *Tudo certo! Consulta marcada com sucesso!*',
            '✅ *Pronto! Sua consulta tá confirmada!*',
            '🎊 *Eba! Consegui marcar pra você!*'
        ];

        const closingMessages = [
            'Vou te mandar lembretes 24h e 1h antes da consulta, combinado? 🔔\n\nSe precisar cancelar ou mudar alguma coisa, é só digitar *menu*!\n\nNos vemos lá! Até breve! 👋😊',
            'Ah! Vou te lembrar um dia antes e 1h antes da consulta, tá? 😉\n\nQualquer coisa, digita *menu* que te ajudo!\n\nTe vejo na consulta! Até! 🌟',
            'Não esquece! Vou te avisar 24h e 1h antes, beleza? 📲\n\nPra cancelar ou reagendar, manda *menu*!\n\nAté mais! Cuida-se! 💚'
        ];

        await sendMessage(phoneNumber, `${successIntros[Math.floor(Math.random() * successIntros.length)]}

🎫 *Código da consulta:* ${appointment._id.toString().slice(-6).toUpperCase()}

📅 *Quando:* ${startTime.toLocaleDateString('pt-BR')} às ${selectedTime}
🏥 *Onde:* ${session.getData('clinicName')}
👨‍⚕️ *Com quem:* ${session.getData('doctorName')}

${closingMessages[Math.floor(Math.random() * closingMessages.length)]}`);


        session.reset();
    } catch (error) {
        logger.error('Erro ao criar agendamento:', error);
        const errorMessages = [
            'Ai não! Deu um erro na hora de confirmar... 😔\n\nTenta de novo digitando *menu* ou me chama que te ajudo!',
            'Puts... algo deu errado aqui... 😬\n\nDesculpa! Tenta mais uma vez? Digita *menu*!',
            'Eita! Sistema travou na confirmação... 😅\n\nVamos tentar de novo? Manda *menu*!'
        ];
        await sendMessage(phoneNumber, errorMessages[Math.floor(Math.random() * errorMessages.length)]);
        session.reset();
    }
}

// ===== CONSULTAR AGENDAMENTO =====
async function handleAppointmentCheck(phoneNumber, messageText, session) {
    try {
        const searchingMessages = [
            'Deixa eu procurar aqui pra você... 🔍',
            'Opa! Vou dar uma olhada nas suas consultas... 📋',
            'Só um instante! Buscando suas consultas... ⏳'
        ];
        
        await sendMessage(phoneNumber, searchingMessages[Math.floor(Math.random() * searchingMessages.length)]);
        await sendTypingIndicator(phoneNumber, 1500);
        
        const appointments = await Appointment.find({
            $or: [
                { 'patient.phone': phoneNumber },
                { _id: messageText }
            ],
            scheduledDate: { $gte: new Date() },
            status: { $in: ['confirmado', 'pendente'] }
        })
        .populate('doctor', 'name')
        .populate('specialty', 'name')
        .populate('clinic', 'name')
        .sort({ scheduledDate: 1, scheduledTime: 1 });

        if (appointments.length === 0) {
            const notFoundMessages = [
                'Hmm... não achei nenhuma consulta marcada no seu nome... 🤔\n\nQuer marcar uma? Digita *menu*!',
                'Puts... não encontrei agendamento pra você... 😕\n\nVamos marcar uma consulta? Manda *menu*!',
                'Eita! Não vi nada agendado aqui... 😬\n\nQuer agendar agora? É só digitar *menu*!'
            ];
            await sendMessage(phoneNumber, notFoundMessages[Math.floor(Math.random() * notFoundMessages.length)]);
            session.reset();
            return;
        }

        const foundMessages = [
            appointments.length === 1 ? 'Achei! Você tem 1 consulta marcada:' : `Legal! Encontrei ${appointments.length} consultas suas:`,
            appointments.length === 1 ? 'Olha só! Tem uma consulta agendada:' : `Opa! Vi que tem ${appointments.length} consultas marcadas:`,
            appointments.length === 1 ? 'Boa! Aqui tá sua consulta:' : `Show! Essas são suas ${appointments.length} consultas:`
        ];

        let message = `📋 *${foundMessages[Math.floor(Math.random() * foundMessages.length)]}*\n\n`;
        
        appointments.forEach((appt, index) => {
            message += `${index + 1}️⃣ *Código:* ${appt._id.toString().slice(-6).toUpperCase()}\n`;
            message += `   📅 ${new Date(appt.scheduledDate).toLocaleDateString('pt-BR')} às ${appt.scheduledTime}\n`;
            message += `   👨‍⚕️ ${appt.doctor.name}\n`;
            message += `   🩺 ${appt.specialty.name}\n`;
            message += `   📍 ${appt.clinic.name}\n\n`;
        });

        message += '\nPrecisa de mais alguma coisa? Digita *menu*! 😊';

        await sendMessage(phoneNumber, message);
        session.reset();
    } catch (error) {
        logger.error('Erro ao buscar agendamento:', error);
        const errorMessages = [
            'Ops! Deu um erro ao buscar... 😅\n\nTenta de novo? Digita *menu*!',
            'Ai... sistema travou aqui... 😬\n\nVamos tentar novamente? Manda *menu*!',
            'Eita! Não consegui buscar... 🤔\n\nTenta mais uma vez? *menu*'
        ];
        await sendMessage(phoneNumber, errorMessages[Math.floor(Math.random() * errorMessages.length)]);
        session.reset();
    }
}

// ===== ENVIAR MENSAGEM =====
async function sendMessage(to, text) {
    try {
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
                }
            }
        );

        logger.info(`✅ Mensagem enviada para ${to}`);
        return response.data;
    } catch (error) {
        logger.error('Erro ao enviar mensagem:', error.response?.data || error.message);
        throw error;
    }
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

    const reminderIntros = [
        `Oi! Passando aqui pra te lembrar... 😊`,
        `Opa! Só lembrando você... 👋`,
        `Oi, tudo bem? É só um lembrete... 🔔`
    ];

    const confirmationPrompts = [
        'Você vai conseguir vir?',
        'Vai dar pra você comparecer?',
        'Tá confirmado ainda?'
    ];

    const message = `${reminderIntros[Math.floor(Math.random() * reminderIntros.length)]}

Sua consulta ${timeText}! 📅

👤 *${appointment.patient.name}*
📅 *${appointmentDate.toLocaleDateString('pt-BR')}* às *${appointment.scheduledTime}*
👨‍⚕️ Com *${appointment.doctor?.name}*
🏥 Na *${appointment.clinic?.name}*

${confirmationPrompts[Math.floor(Math.random() * confirmationPrompts.length)]} 🤔

1️⃣ *Sim! Vou comparecer* ✅
2️⃣ *Preciso remarcar* 📅`;

    await sendMessage(phoneNumber, message);
}

// ===== EXPORTAR =====
module.exports = {
    initialize,
    verifyWebhook,
    handleIncomingMessage,
    sendMessage,
    sendReminder
};

