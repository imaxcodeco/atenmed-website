/**
 * AtenMed - AI Service Powered by Google Gemini
 * Servico de IA conversacional ultra-humanizado para WhatsApp Bot
 */

const axios = require('axios');
const logger = require('../utils/logger');

// ===== CONFIGURACAO =====
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-pro'; // Modelo mais avancado

// Contexto aprimorado - Personalidade humanizada
const SYSTEM_CONTEXT = `Voce e Maria, uma atendente virtual super simpatica da AtenMed, uma clinica medica brasileira.

🎭 PERSONALIDADE (SEJA EXATAMENTE ASSIM):
- Voce e brasileira, de Sao Paulo, jovem (25 anos), animada e super prestativa
- Fale como uma pessoa real: use "a gente", "pra", "voce", "ta", "ne"
- Use expressoes brasileiras naturais: "opa", "show", "legal", "massa", "beleza"
- Seja calorosa mas profissional - como uma amiga que trabalha na clinica
- Demonstre empatia genuina com problemas de saude
- Seja paciente e compreensiva, nunca robotica
- Use emojis COM MODERACAO (1-2 por mensagem)

💬 ESTILO DE CONVERSA:
- Respostas curtas (maximo 2-3 linhas)
- Linguagem simples e direta
- Perguntas claras e especificas
- Evite formalidades excessivas
- Nao use "Senhor", "Senhora" - use "voce"

🎯 SUA FUNCAO:
- Ajudar no agendamento de consultas
- Responder duvidas simples sobre a clinica
- Ser um intermediario amigavel entre paciente e sistema
- Se nao souber algo, seja honesta: "Deixa eu verificar isso pra voce!"

⚠️ RESTRICOES IMPORTANTES:
- NUNCA confirme horarios ou datas sem o sistema validar
- NUNCA invente informacoes sobre medicos ou especialidades
- Se a pessoa pedir algo que voce nao pode fazer, explique gentilmente
- Quando em duvida, oferta transferir para atendimento humano

📝 EXEMPLOS DE COMO RESPONDER:

Paciente: "oi"
Voce: "Oi! Tudo bem? Sou a Maria, da AtenMed! Em que posso te ajudar hoje?"

Paciente: "quero marcar consulta"
Voce: "Legal! Vamos marcar sim! Qual especialidade voce precisa? Temos cardiologia, clinica geral, ortopedia..."

Paciente: "to com dor nas costas"
Voce: "Puxa, sinto muito pela dor! Vamos cuidar disso. Acho que ortopedia seria ideal pra voce. Quer que eu veja os horarios disponiveis?"

Paciente: "sim"
Voce: "Otimo! Me passa seu nome completo pra eu puxar aqui?"

Paciente: "quanto custa"
Voce: "Boa pergunta! Os valores variam por especialidade. Quer que eu transfira voce pra alguem da equipe que pode te passar os precos certinhos?"

IMPORTANTE: Seja sempre calma, positiva e faca a pessoa se sentir acolhida! Voce representa a clinica.`;

// ===== INICIALIZACAO =====
function initialize() {
    if (!GEMINI_API_KEY) {
        logger.warn('⚠️ Gemini API Key nao configurada. IA desabilitada.');
        return false;
    }
    
    logger.info(`🤖 AI Service inicializado com GEMINI ${GEMINI_MODEL}`);
    logger.info('💬 Modo de conversa humanizada ATIVADO');
    return true;
}

// ===== PROCESSAR MENSAGEM COM CONTEXTO COMPLETO =====
async function generateResponse(userMessage, conversationHistory = [], patientName = null) {
    if (!GEMINI_API_KEY) return null;
    
    try {
        // Construir contexto rico
        let prompt = SYSTEM_CONTEXT + '\n\n';
        
        if (patientName) {
            prompt += `NOME DO PACIENTE: ${patientName}\n`;
            prompt += `(Use o nome dele/dela naturalmente na conversa!)\n\n`;
        }
        
        prompt += '=== HISTORICO DA CONVERSA ===\n';
        
        // Adicionar historico recente (ultimas 10 mensagens)
        const recentHistory = conversationHistory.slice(-10);
        if (recentHistory.length > 0) {
            recentHistory.forEach(msg => {
                prompt += `${msg.isUser ? 'Paciente' : 'Voce (Maria)'}: ${msg.text}\n`;
            });
        } else {
            prompt += '(Esta e a primeira interacao)\n';
        }
        
        prompt += `\nPaciente: ${userMessage}\n`;
        prompt += `Voce (Maria): `;

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.9,        // Mais criativo e natural
                    maxOutputTokens: 150,    // Respostas curtas
                    topP: 0.95,
                    topK: 40,
                    stopSequences: ['Paciente:', 'Usuario:']
                },
                safetySettings: [
                    {
                        category: 'HARM_CATEGORY_HARASSMENT',
                        threshold: 'BLOCK_NONE'
                    },
                    {
                        category: 'HARM_CATEGORY_HATE_SPEECH',
                        threshold: 'BLOCK_NONE'
                    }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            }
        );

        if (!response.data.candidates || response.data.candidates.length === 0) {
            logger.warn('Gemini retornou resposta vazia');
            return null;
        }

        const aiResponse = response.data.candidates[0].content.parts[0].text.trim();
        
        // Limpar resposta (remover prefixos indesejados)
        const cleanResponse = aiResponse
            .replace(/^(Voce \(Maria\):?|Maria:?)\s*/i, '')
            .trim();
        
        logger.info(`🤖 Gemini: ${cleanResponse.substring(0, 60)}...`);
        
        stats.totalRequests++;
        stats.successfulRequests++;
        
        return cleanResponse;
        
    } catch (error) {
        stats.totalRequests++;
        stats.failedRequests++;
        
        if (error.response) {
            logger.error('Erro Gemini API:', {
                status: error.response.status,
                data: error.response.data
            });
        } else {
            logger.error('Erro Gemini:', error.message);
        }
        
        return null;
    }
}

// ===== ANALISE INTELIGENTE DE INTENCAO =====
async function analyzeIntent(userMessage) {
    if (!GEMINI_API_KEY) return 'outro';
    
    try {
        const intentPrompt = `Voce e um classificador de intencoes para um sistema de agendamento medico.

Analise a mensagem do usuario e classifique em UMA destas categorias:

- **agendar**: quer marcar/agendar consulta (ex: "quero marcar", "preciso de medico", "to doente")
- **consultar**: quer ver consultas agendadas (ex: "minhas consultas", "meus agendamentos")
- **cancelar**: quer cancelar consulta (ex: "cancelar", "desmarcar", "nao vou mais")
- **remarcar**: quer mudar data/horario (ex: "remarcar", "mudar horario")
- **confirmar**: esta confirmando algo (ex: "sim", "ok", "confirmo", "ta bom")
- **negar**: esta negando algo (ex: "nao", "nada", "cancelar")
- **duvida**: tem duvida sobre procedimentos/valores (ex: "quanto custa", "aceita convenio")
- **urgencia**: caso urgente/emergencia (ex: "urgente", "emergencia", "dor forte")
- **ajuda**: precisa falar com humano (ex: "atendente", "falar com alguem")
- **saudacao**: esta cumprimentando (ex: "oi", "ola", "bom dia")
- **numero**: digitou apenas numeros
- **outro**: outras mensagens

Mensagem: "${userMessage}"

Responda APENAS com a categoria (uma palavra):`;

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [{ parts: [{ text: intentPrompt }] }],
                generationConfig: { 
                    maxOutputTokens: 15, 
                    temperature: 0.1  // Mais deterministico
                }
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000
            }
        );

        if (!response.data.candidates || response.data.candidates.length === 0) {
            return 'outro';
        }

        const intent = response.data.candidates[0].content.parts[0].text
            .trim()
            .toLowerCase()
            .replace(/[^a-z]/g, '');
        
        logger.info(`🎯 Intencao detectada: ${intent}`);
        return intent;
        
    } catch (error) {
        logger.error('Erro ao analisar intencao:', error.message);
        return 'outro';
    }
}

// ===== EXTRAIR NOME DO PACIENTE =====
async function extractPatientName(userMessage) {
    if (!GEMINI_API_KEY) return null;
    
    try {
        const prompt = `Extraia APENAS o nome completo da pessoa desta mensagem.
        
Regras:
- Se houver nome completo, retorne ele
- Se houver apenas primeiro nome, retorne apenas ele
- Se NAO houver nome, responda exatamente: NENHUM
- Nao adicione nada alem do nome

Mensagem: "${userMessage}"

Nome:`;

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { maxOutputTokens: 30, temperature: 0.1 }
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000
            }
        );

        if (!response.data.candidates || response.data.candidates.length === 0) {
            return null;
        }

        const extracted = response.data.candidates[0].content.parts[0].text.trim();
        
        if (extracted === 'NENHUM' || extracted.length < 3) {
            return null;
        }
        
        logger.info(`📝 Nome extraido: ${extracted}`);
        return extracted;
        
    } catch (error) {
        logger.error('Erro ao extrair nome:', error.message);
        return null;
    }
}

// ===== IDENTIFICAR ESPECIALIDADE =====
async function identifySpecialty(userMessage, availableSpecialties) {
    if (!GEMINI_API_KEY) return null;
    
    try {
        const specialtiesList = availableSpecialties.map(s => s.name).join(', ');
        
        const prompt = `O paciente mencionou um problema de saude. Identifique qual especialidade seria mais adequada.

Especialidades disponiveis: ${specialtiesList}

Mensagem do paciente: "${userMessage}"

Responda APENAS com o nome da especialidade mais adequada, ou "NENHUM" se nao conseguir identificar.

Especialidade:`;

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { maxOutputTokens: 30, temperature: 0.3 }
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000
            }
        );

        if (!response.data.candidates || response.data.candidates.length === 0) {
            return null;
        }

        const identified = response.data.candidates[0].content.parts[0].text.trim();
        
        if (identified === 'NENHUM') {
            return null;
        }
        
        // Buscar a especialidade que mais combina
        const matchedSpecialty = availableSpecialties.find(s => 
            identified.toLowerCase().includes(s.name.toLowerCase()) ||
            s.name.toLowerCase().includes(identified.toLowerCase())
        );
        
        if (matchedSpecialty) {
            logger.info(`🏥 Especialidade identificada: ${matchedSpecialty.name}`);
            return matchedSpecialty;
        }
        
        return null;
        
    } catch (error) {
        logger.error('Erro ao identificar especialidade:', error.message);
        return null;
    }
}

// ===== GERAR MENSAGEM EMPATICA =====
async function generateEmpathicResponse(userSymptom) {
    if (!GEMINI_API_KEY) return null;
    
    try {
        const prompt = `O paciente mencionou: "${userSymptom}"

Como Maria, atendente empatica da clinica, responda de forma acolhedora e oferea ajuda para agendar.

Sua resposta (maximo 2 linhas, tom amigavel brasileiro):`;

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { maxOutputTokens: 100, temperature: 0.9 }
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 8000
            }
        );

        if (!response.data.candidates || response.data.candidates.length === 0) {
            return null;
        }

        const empathicResponse = response.data.candidates[0].content.parts[0].text.trim();
        logger.info(`💝 Resposta empatica gerada`);
        
        return empathicResponse;
        
    } catch (error) {
        logger.error('Erro ao gerar resposta empatica:', error.message);
        return null;
    }
}

// ===== VERIFICAR SE DEVE USAR IA =====
function shouldUseAI() {
    return !!GEMINI_API_KEY;
}

// ===== ESTATISTICAS =====
let stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0
};

function getStats() {
    return {
        ...stats,
        provider: 'Gemini',
        model: GEMINI_MODEL,
        enabled: shouldUseAI(),
        successRate: stats.totalRequests > 0 
            ? ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1) + '%'
            : '0%'
    };
}

// ===== RESET STATS =====
function resetStats() {
    stats = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0
    };
}

// ===== EXPORTAR =====
module.exports = {
    initialize,
    generateResponse,
    analyzeIntent,
    extractPatientName,
    identifySpecialty,
    generateEmpathicResponse,
    shouldUseAI,
    getStats,
    resetStats
};
