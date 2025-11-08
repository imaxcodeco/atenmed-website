/**
 * AtenMed - Agent Service
 * Serviço para processar mensagens e gerenciar agentes de IA
 */

const aiService = require('./aiService');
const logger = require('../utils/logger');

// Importar Conversation dinamicamente para evitar erro se não existir
let Conversation;
try {
    Conversation = require('../models/Conversation');
} catch (e) {
    logger.warn('Model Conversation não encontrado, criando estrutura básica');
}

// ===== TEMPLATES PRÉ-CONFIGURADOS =====

const TEMPLATES = {
    suporte: {
        name: 'Agente de Suporte',
        description: 'Ideal para atendimento ao cliente e resolução de problemas',
        personality: {
            name: 'Suporte',
            tone: 'profissional',
            useEmojis: true,
            responseLength: 'media'
        },
        aiConfig: {
            provider: 'gemini',
            model: 'gemini-1.5-pro',
            temperature: 0.7,
            systemPrompt: `Você é um assistente de suporte técnico profissional e prestativo.
Sua função é ajudar clientes com dúvidas, problemas e solicitações.
Seja claro, objetivo e empático. Se não souber algo, seja honesto e ofereça transferir para um humano.`
        },
        flows: [
            {
                name: 'Saudação',
                trigger: 'intent',
                triggerValue: 'saudacao',
                steps: [
                    {
                        type: 'message',
                        content: 'Olá! Como posso ajudá-lo hoje?',
                        nextStep: null
                    }
                ]
            }
        ]
    },
    
    vendas: {
        name: 'Agente de Vendas',
        description: 'Focado em qualificar leads e converter vendas',
        personality: {
            name: 'Vendas',
            tone: 'amigavel',
            useEmojis: true,
            responseLength: 'curta'
        },
        aiConfig: {
            provider: 'gemini',
            model: 'gemini-1.5-pro',
            temperature: 0.8,
            systemPrompt: `Você é um vendedor experiente e consultivo.
Sua função é qualificar leads, entender necessidades e apresentar soluções.
Seja persuasivo mas não invasivo. Faça perguntas para entender o que o cliente precisa.`
        },
        flows: [
            {
                name: 'Qualificação',
                trigger: 'intent',
                triggerValue: 'interesse',
                steps: [
                    {
                        type: 'question',
                        content: 'Qual é o principal desafio que você está enfrentando?',
                        options: { field: 'challenge' },
                        nextStep: 1
                    },
                    {
                        type: 'question',
                        content: 'Qual o tamanho da sua empresa?',
                        options: { field: 'companySize' },
                        nextStep: 2
                    },
                    {
                        type: 'action',
                        content: 'lead_qualification',
                        nextStep: null
                    }
                ]
            }
        ]
    },
    
    agendamento: {
        name: 'Agente de Agendamento',
        description: 'Especializado em agendar consultas e reuniões',
        personality: {
            name: 'Agendamento',
            tone: 'amigavel',
            useEmojis: true,
            responseLength: 'media'
        },
        aiConfig: {
            provider: 'gemini',
            model: 'gemini-1.5-pro',
            temperature: 0.7,
            systemPrompt: `Você é um assistente de agendamento.
Sua função é ajudar pessoas a agendar consultas, verificar disponibilidade e confirmar horários.
Seja organizado, claro e confirme todos os detalhes antes de finalizar.`
        },
        flows: [
            {
                name: 'Agendamento',
                trigger: 'intent',
                triggerValue: 'agendar',
                steps: [
                    {
                        type: 'question',
                        content: 'Qual especialidade você precisa?',
                        options: { field: 'specialty' },
                        nextStep: 1
                    },
                    {
                        type: 'question',
                        content: 'Qual data seria melhor para você?',
                        options: { field: 'date' },
                        nextStep: 2
                    },
                    {
                        type: 'api_call',
                        content: 'check_availability',
                        options: { endpoint: '/api/appointments/availability' },
                        nextStep: 3
                    },
                    {
                        type: 'message',
                        content: 'Perfeito! Vou confirmar seu agendamento.',
                        nextStep: null
                    }
                ]
            }
        ]
    },
    
    qualificacao: {
        name: 'Agente de Qualificação',
        description: 'Focado em coletar informações e qualificar leads',
        personality: {
            name: 'Qualificação',
            tone: 'profissional',
            useEmojis: false,
            responseLength: 'curta'
        },
        aiConfig: {
            provider: 'gemini',
            model: 'gemini-1.5-pro',
            temperature: 0.6,
            systemPrompt: `Você é um qualificador de leads.
Sua função é fazer perguntas estratégicas para entender o perfil do lead.
Seja direto, objetivo e colete informações relevantes.`
        },
        flows: []
    },
    
    personalizado: {
        name: 'Agente Personalizado',
        description: 'Configure do zero conforme suas necessidades',
        personality: {
            name: 'Assistente',
            tone: 'amigavel',
            useEmojis: true,
            responseLength: 'media'
        },
        aiConfig: {
            provider: 'gemini',
            model: 'gemini-1.5-pro',
            temperature: 0.7,
            systemPrompt: ''
        },
        flows: []
    }
};

// ===== PROCESSAR MENSAGEM =====

async function processMessage(agent, userMessage, context = {}) {
    try {
        const { conversationId, userId, channel, clinicId } = context;
        
        // Buscar ou criar conversa
        let conversation = null;
        if (Conversation) {
            if (conversationId) {
                conversation = await Conversation.findById(conversationId);
            }
            
            if (!conversation) {
                conversation = new Conversation({
                    agent: agent._id,
                    clinic: clinicId,
                    userId: userId,
                    channel: channel || 'website',
                    messages: []
                });
            }
        } else {
            // Fallback: criar objeto de conversa simples
            conversation = {
                messages: [],
                save: async function() { return this; }
            };
        }
        
        // Adicionar mensagem do usuário
        conversation.messages.push({
            role: 'user',
            content: userMessage,
            timestamp: new Date()
        });
        
        // Processar através do fluxo ou IA
        let response = null;
        let intent = null;
        const actions = [];
        
        // 1. Verificar se há fluxo que corresponde
        const matchedFlow = findMatchingFlow(agent, userMessage, conversation);
        
        if (matchedFlow) {
            // Executar fluxo
            response = await executeFlow(matchedFlow, conversation, context);
        } else {
            // Usar IA para gerar resposta
            intent = await aiService.analyzeIntent(userMessage);
            
            // Construir contexto para IA
            const systemPrompt = buildSystemPrompt(agent, conversation);
            const conversationHistory = conversation.messages.slice(-10).map(m => ({
                isUser: m.role === 'user',
                text: m.content
            }));
            
            // Gerar resposta com IA
            const aiResponse = await aiService.generateResponse(
                userMessage,
                conversationHistory,
                conversation.userName
            );
            
            if (aiResponse) {
                response = {
                    text: aiResponse,
                    intent: intent
                };
            } else {
                // Fallback
                response = {
                    text: 'Desculpe, não entendi. Pode reformular sua pergunta?',
                    intent: 'outro'
                };
            }
        }
        
        // Adicionar resposta à conversa
        conversation.messages.push({
            role: 'assistant',
            content: response.text,
            intent: response.intent || intent,
            timestamp: new Date()
        });
        
        if (conversation.lastMessageAt !== undefined) {
            conversation.lastMessageAt = new Date();
        }
        if (conversation.save) {
            await conversation.save();
        }
        
        return {
            text: response.text,
            intent: response.intent || intent,
            actions: response.actions || actions,
            conversationId: conversation._id
        };
        
    } catch (error) {
        logger.error('Erro ao processar mensagem:', error);
        return {
            text: 'Desculpe, ocorreu um erro. Tente novamente em instantes.',
            intent: 'erro',
            conversationId: context.conversationId
        };
    }
}

// ===== ENCONTRAR FLUXO CORRESPONDENTE =====

function findMatchingFlow(agent, userMessage, conversation) {
    if (!agent.flows || agent.flows.length === 0) {
        return null;
    }
    
    const lowerMessage = userMessage.toLowerCase();
    
    for (const flow of agent.flows) {
        if (flow.trigger === 'always' && flow.isDefault) {
            return flow;
        }
        
        if (flow.trigger === 'keyword') {
            const keywords = flow.triggerValue.split(',').map(k => k.trim().toLowerCase());
            if (keywords.some(k => lowerMessage.includes(k))) {
                return flow;
            }
        }
        
        if (flow.trigger === 'regex') {
            const regex = new RegExp(flow.triggerValue, 'i');
            if (regex.test(userMessage)) {
                return flow;
            }
        }
        
        if (flow.trigger === 'intent') {
            // Verificar intenção (seria necessário analisar antes)
            // Por enquanto, retornar null e usar IA
        }
    }
    
    return null;
}

// ===== EXECUTAR FLUXO =====

async function executeFlow(flow, conversation, context) {
    let currentStep = 0;
    const responses = [];
    const actions = [];
    
    while (currentStep < flow.steps.length) {
        const step = flow.steps[currentStep];
        
        switch (step.type) {
            case 'message':
                responses.push(step.content);
                currentStep = step.nextStep !== null ? step.nextStep : currentStep + 1;
                break;
                
            case 'question':
                responses.push(step.content);
                // Aguardar resposta do usuário (seria em uma próxima interação)
                currentStep = step.nextStep !== null ? step.nextStep : currentStep + 1;
                break;
                
            case 'action': {
                const actionResult = await executeAction(step.content, step.options, context);
                actions.push(actionResult);
                currentStep = step.nextStep !== null ? step.nextStep : currentStep + 1;
                break;
            }
                
            case 'api_call': {
                const apiResult = await makeApiCall(step.options, context);
                if (apiResult) {
                    responses.push(apiResult.message || 'Processado com sucesso');
                }
                currentStep = step.nextStep !== null ? step.nextStep : currentStep + 1;
                break;
            }
                
            default:
                currentStep++;
        }
    }
    
    return {
        text: responses.join('\n\n'),
        actions: actions
    };
}

// ===== EXECUTAR AÇÃO =====

async function executeAction(actionType, options, context) {
    switch (actionType) {
        case 'lead_qualification': {
            // Criar lead no sistema
            const Lead = require('../models/Lead');
            const lead = new Lead({
                name: context.userName || 'Lead',
                email: context.email,
                phone: context.phone,
                source: 'ai_agent',
                status: 'novo',
                clinic: context.clinicId,
                metadata: context
            });
            await lead.save();
            return { type: 'lead_created', leadId: lead._id };
        }
            
        default:
            return { type: actionType, status: 'executed' };
    }
}

// ===== FAZER CHAMADA API =====

async function makeApiCall(options, context) {
    // Implementar chamadas API conforme necessário
    // Por exemplo, verificar disponibilidade de agendamentos
    return { message: 'API call executada', data: {} };
}

// ===== CONSTRUIR SYSTEM PROMPT =====

function buildSystemPrompt(agent, conversation) {
    let prompt = agent.aiConfig.systemPrompt || '';
    
    if (!prompt) {
        // Construir prompt baseado na personalidade
        prompt = `Você é ${agent.personality.name}, um assistente virtual ${agent.personality.tone}.`;
        
        if (agent.knowledgeBase.enabled && agent.knowledgeBase.documents.length > 0) {
            prompt += '\n\nVocê tem acesso às seguintes informações:\n';
            agent.knowledgeBase.documents.forEach(doc => {
                prompt += `- ${doc.title}: ${doc.content.substring(0, 200)}\n`;
            });
        }
    }
    
    return prompt;
}

// ===== OBTER TEMPLATE =====

function getTemplateConfig(templateName) {
    return TEMPLATES[templateName] || TEMPLATES.personalizado;
}

// ===== OBTER TEMPLATES DISPONÍVEIS =====

function getAvailableTemplates() {
    return Object.keys(TEMPLATES).map(key => ({
        id: key,
        name: TEMPLATES[key].name,
        description: TEMPLATES[key].description
    }));
}

// ===== OBTER ESTATÍSTICAS DETALHADAS =====

async function getDetailedStats(agentId) {
    try {
        if (!Conversation) {
            return {
                totalConversations: 0,
                totalMessages: 0,
                recentConversations: 0,
                averageMessagesPerConversation: 0
            };
        }
        
        const conversations = await Conversation.find({ agent: agentId });
        
        const totalConversations = conversations.length;
        const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
        
        const recentConversations = conversations.filter(conv => {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return conv.lastMessageAt > weekAgo;
        });
        
        return {
            totalConversations,
            totalMessages,
            recentConversations: recentConversations.length,
            averageMessagesPerConversation: totalConversations > 0 
                ? (totalMessages / totalConversations).toFixed(1) 
                : 0
        };
        
    } catch (error) {
        logger.error('Erro ao obter estatísticas:', error);
        return {};
    }
}

module.exports = {
    processMessage,
    getTemplateConfig,
    getAvailableTemplates,
    getDetailedStats
};

