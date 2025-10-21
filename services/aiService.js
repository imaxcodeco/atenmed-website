/**
 * AtenMed - AI Service
 * Serviço de IA conversacional para WhatsApp Bot
 * Suporta: OpenAI GPT e Google Gemini
 */

const axios = require('axios');
const logger = require('../utils/logger');

// ===== CONFIGURAÇÃO =====
const AI_PROVIDER = process.env.AI_PROVIDER || 'openai'; // 'openai' ou 'gemini'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Contexto do sistema (personalidade do bot)
const SYSTEM_CONTEXT = `Você é um assistente virtual amigável da AtenMed, uma clínica médica brasileira.

PERSONALIDADE:
- Seja extremamente amigável, empático e prestativo
- Use linguagem casual brasileira (puts, eita, opa, show, legal)
- Seja breve e direto nas respostas
- Use emojis contextuais (mas sem exagero)
- Demonstre entusiasmo em ajudar

RESTRIÇÕES:
- NUNCA marque consultas diretamente - apenas colete informações
- NÃO invente horários ou disponibilidade - isso é verificado no sistema
- Se não souber algo, seja honesto e ofereça ajuda humana
- Mantenha foco em agendamento médico

EXEMPLOS DE COMO RESPONDER:
Paciente: "Oi, quero marcar"
Você: "Oi! 😊 Legal, vamos marcar uma consulta! Pra qual especialidade você precisa? Cardiologia, Clínica Geral, Odontologia...?"

Paciente: "sim"
Você: "Show! Bora então! 👍"

Paciente: "quero um médico"
Você: "Claro! Vamos te ajudar! Qual especialidade você precisa? 😊"

IMPORTANTE: Seja sempre positivo, acolhedor e eficiente!`;

// ===== INICIALIZAÇÃO =====
function initialize() {
    if (AI_PROVIDER === 'openai' && !OPENAI_API_KEY) {
        logger.warn('⚠️ OpenAI API Key não configurada. IA desabilitada.');
        return false;
    }
    
    if (AI_PROVIDER === 'gemini' && !GEMINI_API_KEY) {
        logger.warn('⚠️ Gemini API Key não configurada. IA desabilitada.');
        return false;
    }
    
    logger.info(`🤖 AI Service inicializado com ${AI_PROVIDER.toUpperCase()}`);
    return true;
}

// ===== PROCESSAR MENSAGEM COM IA =====
async function processMessage(userMessage, conversationHistory = []) {
    try {
        if (AI_PROVIDER === 'openai') {
            return await processWithOpenAI(userMessage, conversationHistory);
        } else if (AI_PROVIDER === 'gemini') {
            return await processWithGemini(userMessage, conversationHistory);
        }
        
        return null;
    } catch (error) {
        logger.error('Erro ao processar com IA:', error);
        return null;
    }
}

// ===== OPENAI GPT =====
async function processWithOpenAI(userMessage, conversationHistory) {
    if (!OPENAI_API_KEY) return null;
    
    try {
        const messages = [
            { role: 'system', content: SYSTEM_CONTEXT },
            ...conversationHistory.map(msg => ({
                role: msg.isUser ? 'user' : 'assistant',
                content: msg.text
            })),
            { role: 'user', content: userMessage }
        ];

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
                messages: messages,
                max_tokens: 200,
                temperature: 0.8,
                presence_penalty: 0.6,
                frequency_penalty: 0.3
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        const aiResponse = response.data.choices[0].message.content;
        logger.info(`🤖 OpenAI: ${aiResponse.substring(0, 50)}...`);
        
        return aiResponse;
    } catch (error) {
        logger.error('Erro OpenAI:', error.response?.data || error.message);
        return null;
    }
}

// ===== GOOGLE GEMINI =====
async function processWithGemini(userMessage, conversationHistory) {
    if (!GEMINI_API_KEY) return null;
    
    try {
        // Construir histórico para Gemini
        let fullContext = SYSTEM_CONTEXT + '\n\nHistórico da conversa:\n';
        
        conversationHistory.forEach(msg => {
            fullContext += `${msg.isUser ? 'Paciente' : 'Você'}: ${msg.text}\n`;
        });
        
        fullContext += `Paciente: ${userMessage}\nVocê:`;

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{
                        text: fullContext
                    }]
                }],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 200,
                    topP: 0.8,
                    topK: 40
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        const aiResponse = response.data.candidates[0].content.parts[0].text;
        logger.info(`🤖 Gemini: ${aiResponse.substring(0, 50)}...`);
        
        return aiResponse;
    } catch (error) {
        logger.error('Erro Gemini:', error.response?.data || error.message);
        return null;
    }
}

// ===== ANÁLISE DE INTENÇÃO =====
async function analyzeIntent(userMessage) {
    try {
        const intentPrompt = `Analise a intenção do usuário e responda APENAS com uma destas opções:
- agendar: quer marcar consulta
- consultar: quer ver agendamentos
- cancelar: quer cancelar
- confirmar: está confirmando algo (sim, ok, confirmo)
- negar: está negando algo (não, nao)
- ajuda: precisa de ajuda/atendente
- saudacao: está cumprimentando
- numero: digitou apenas um número
- outro: outra coisa

Mensagem do usuário: "${userMessage}"

Responda APENAS com uma palavra (agendar, consultar, etc):`;

        if (AI_PROVIDER === 'openai' && OPENAI_API_KEY) {
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: 'Você é um classificador de intenções.' },
                        { role: 'user', content: intentPrompt }
                    ],
                    max_tokens: 10,
                    temperature: 0.3
                },
                {
                    headers: {
                        'Authorization': `Bearer ${OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000
                }
            );

            const intent = response.data.choices[0].message.content.trim().toLowerCase();
            logger.info(`🎯 Intenção detectada: ${intent}`);
            return intent;
            
        } else if (AI_PROVIDER === 'gemini' && GEMINI_API_KEY) {
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
                {
                    contents: [{ parts: [{ text: intentPrompt }] }],
                    generationConfig: { maxOutputTokens: 10, temperature: 0.3 }
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 5000
                }
            );

            const intent = response.data.candidates[0].content.parts[0].text.trim().toLowerCase();
            logger.info(`🎯 Intenção detectada: ${intent}`);
            return intent;
        }
        
        return 'outro';
    } catch (error) {
        logger.error('Erro ao analisar intenção:', error.message);
        return 'outro';
    }
}

// ===== EXTRAIR INFORMAÇÕES =====
async function extractInformation(userMessage, infoType) {
    try {
        let extractPrompt = '';
        
        switch (infoType) {
            case 'name':
                extractPrompt = `Extraia APENAS o nome da pessoa desta mensagem. Se não houver nome, responda "NENHUM".
Mensagem: "${userMessage}"
Nome:`;
                break;
                
            case 'date':
                extractPrompt = `Extraia APENAS a data desta mensagem no formato DD/MM/AAAA. Se não houver data válida, responda "NENHUM".
Mensagem: "${userMessage}"
Data:`;
                break;
                
            case 'specialty':
                extractPrompt = `Identifique a especialidade médica mencionada. Opções: cardiologia, clinica geral, odontologia, ortopedia, pediatria.
Se não identificar ou for outra, responda "NENHUM".
Mensagem: "${userMessage}"
Especialidade:`;
                break;
                
            default:
                return null;
        }

        if (AI_PROVIDER === 'openai' && OPENAI_API_KEY) {
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: 'Você extrai informações específicas de mensagens.' },
                        { role: 'user', content: extractPrompt }
                    ],
                    max_tokens: 50,
                    temperature: 0.3
                },
                {
                    headers: {
                        'Authorization': `Bearer ${OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000
                }
            );

            const extracted = response.data.choices[0].message.content.trim();
            return extracted === 'NENHUM' ? null : extracted;
        }
        
        return null;
    } catch (error) {
        logger.error('Erro ao extrair informação:', error.message);
        return null;
    }
}

// ===== VERIFICAR SE DEVE USAR IA =====
function shouldUseAI() {
    return (AI_PROVIDER === 'openai' && OPENAI_API_KEY) || 
           (AI_PROVIDER === 'gemini' && GEMINI_API_KEY);
}

// ===== ESTATÍSTICAS =====
let stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    avgResponseTime: 0
};

function getStats() {
    return {
        ...stats,
        provider: AI_PROVIDER,
        enabled: shouldUseAI(),
        successRate: stats.totalRequests > 0 
            ? ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1) + '%'
            : '0%'
    };
}

// ===== EXPORTAR =====
module.exports = {
    initialize,
    processMessage,
    analyzeIntent,
    extractInformation,
    shouldUseAI,
    getStats
};

