/**
 * AtenMed - AI Agents Routes
 * Rotas para gerenciar agentes de IA conversacional
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const Agent = require('../models/Agent');
const { authenticateToken, authorize } = require('../middleware/auth');
const agentService = require('../services/agentService');
const logger = require('../utils/logger');

// ===== ROTAS PÚBLICAS (ANTES DO MIDDLEWARE DE AUTENTICAÇÃO) =====

// Processar mensagem (público para widget/webhook)
router.post('/:id/process', async (req, res) => {
    try {
        const { message, conversationId, userId, channel } = req.body;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Mensagem é obrigatória'
            });
        }
        
        const agent = await Agent.findById(req.params.id);
        
        if (!agent || !agent.active) {
            return res.status(404).json({
                success: false,
                error: 'Agente não encontrado ou inativo'
            });
        }
        
        // Processar mensagem através do serviço
        const response = await agentService.processMessage(agent, message, {
            conversationId,
            userId,
            channel: channel || 'website',
            clinicId: agent.clinic
        });
        
        // Atualizar estatísticas
        agent.stats.totalMessages = (agent.stats.totalMessages || 0) + 1;
        await agent.save();
        
        res.json({
            success: true,
            response: response.text,
            intent: response.intent,
            actions: response.actions || [],
            conversationId: response.conversationId
        });
        
    } catch (error) {
        logger.error('Erro ao processar mensagem:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao processar mensagem'
        });
    }
});

// ===== MIDDLEWARE =====
// Rotas privadas (com autenticação)
router.use(authenticateToken);

// ===== LISTAR AGENTES =====
/**
 * @route   GET /api/agents
 * @desc    Listar todos os agentes da clínica
 * @access  Private
 */
router.get('/', async (req, res) => {
    try {
        const { status, template, search } = req.query;
        
        let query = { clinic: req.clinicId };
        
        if (status) {
            query.status = status;
        }
        
        if (template) {
            query.template = template;
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        const agents = await Agent.find(query)
            .populate('createdBy', 'nome email')
            .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            count: agents.length,
            agents
        });
        
    } catch (error) {
        logger.error('Erro ao listar agentes:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao listar agentes'
        });
    }
});

// ===== CRIAR AGENTE =====
/**
 * @route   POST /api/agents
 * @desc    Criar novo agente
 * @access  Private
 */
router.post('/', async (req, res) => {
    try {
        const agentData = {
            ...req.body,
            clinic: req.clinicId,
            createdBy: req.user._id
        };
        
        // Se usar template, aplicar configurações pré-definidas
        if (agentData.template && agentData.template !== 'personalizado') {
            const templateConfig = agentService.getTemplateConfig(agentData.template);
            agentData.personality = { ...templateConfig.personality, ...agentData.personality };
            agentData.aiConfig = { ...templateConfig.aiConfig, ...agentData.aiConfig };
            agentData.flows = templateConfig.flows || [];
        }
        
        const agent = new Agent(agentData);
        await agent.save();
        
        res.status(201).json({
            success: true,
            agent
        });
        
    } catch (error) {
        logger.error('Erro ao criar agente:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro ao criar agente'
        });
    }
});

// ===== OBTER AGENTE =====
/**
 * @route   GET /api/agents/:id
 * @desc    Obter detalhes de um agente
 * @access  Private
 */
router.get('/:id', async (req, res) => {
    try {
        const agent = await Agent.findOne({
            _id: req.params.id,
            clinic: req.clinicId
        }).populate('createdBy', 'nome email');
        
        if (!agent) {
            return res.status(404).json({
                success: false,
                error: 'Agente não encontrado'
            });
        }
        
        res.json({
            success: true,
            agent
        });
        
    } catch (error) {
        logger.error('Erro ao obter agente:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao obter agente'
        });
    }
});

// ===== ATUALIZAR AGENTE =====
/**
 * @route   PUT /api/agents/:id
 * @desc    Atualizar agente
 * @access  Private
 */
router.put('/:id', async (req, res) => {
    try {
        const agent = await Agent.findOne({
            _id: req.params.id,
            clinic: req.clinicId
        });
        
        if (!agent) {
            return res.status(404).json({
                success: false,
                error: 'Agente não encontrado'
            });
        }
        
        // Atualizar campos
        Object.keys(req.body).forEach(key => {
            if (key !== '_id' && key !== 'clinic' && key !== 'createdBy') {
                agent[key] = req.body[key];
            }
        });
        
        agent.updatedBy = req.user._id;
        await agent.save();
        
        res.json({
            success: true,
            agent
        });
        
    } catch (error) {
        logger.error('Erro ao atualizar agente:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro ao atualizar agente'
        });
    }
});

// ===== ATIVAR/DESATIVAR AGENTE =====
/**
 * @route   POST /api/agents/:id/activate
 * @desc    Ativar agente
 * @access  Private
 */
router.post('/:id/activate', async (req, res) => {
    try {
        const agent = await Agent.findOne({
            _id: req.params.id,
            clinic: req.clinicId
        });
        
        if (!agent) {
            return res.status(404).json({
                success: false,
                error: 'Agente não encontrado'
            });
        }
        
        await agent.activate();
        
        res.json({
            success: true,
            message: 'Agente ativado com sucesso',
            agent
        });
        
    } catch (error) {
        logger.error('Erro ao ativar agente:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao ativar agente'
        });
    }
});

/**
 * @route   POST /api/agents/:id/pause
 * @desc    Pausar agente
 * @access  Private
 */
router.post('/:id/pause', async (req, res) => {
    try {
        const agent = await Agent.findOne({
            _id: req.params.id,
            clinic: req.clinicId
        });
        
        if (!agent) {
            return res.status(404).json({
                success: false,
                error: 'Agente não encontrado'
            });
        }
        
        await agent.pause();
        
        res.json({
            success: true,
            message: 'Agente pausado com sucesso',
            agent
        });
        
    } catch (error) {
        logger.error('Erro ao pausar agente:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao pausar agente'
        });
    }
});

// ===== DELETAR AGENTE =====
/**
 * @route   DELETE /api/agents/:id
 * @desc    Deletar agente
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
    try {
        const agent = await Agent.findOne({
            _id: req.params.id,
            clinic: req.clinicId
        });
        
        if (!agent) {
            return res.status(404).json({
                success: false,
                error: 'Agente não encontrado'
            });
        }
        
        await agent.deleteOne();
        
        res.json({
            success: true,
            message: 'Agente deletado com sucesso'
        });
        
    } catch (error) {
        logger.error('Erro ao deletar agente:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao deletar agente'
        });
    }
});

// ===== PROCESSAR MENSAGEM (PRIVADO - ALIAS) =====
/**
 * @route   POST /api/agents/:id/chat
 * @desc    Processar mensagem do usuário (alias para /process)
 * @access  Private
 */
router.post('/:id/chat', async (req, res) => {
    // Redirecionar para a rota pública /process
    req.url = req.url.replace('/chat', '/process');
    req.originalUrl = req.originalUrl.replace('/chat', '/process');
    // Mas como já passou pelo middleware, vamos processar aqui mesmo
    try {
        const { message, conversationId, userId, channel } = req.body;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Mensagem é obrigatória'
            });
        }
        
        const agent = await Agent.findOne({
            _id: req.params.id,
            clinic: req.clinicId
        });
        
        if (!agent || !agent.active) {
            return res.status(404).json({
                success: false,
                error: 'Agente não encontrado ou inativo'
            });
        }
        
        const response = await agentService.processMessage(agent, message, {
            conversationId,
            userId,
            channel: channel || 'website',
            clinicId: req.clinicId
        });
        
        agent.stats.totalMessages = (agent.stats.totalMessages || 0) + 1;
        await agent.save();
        
        res.json({
            success: true,
            response: response.text,
            intent: response.intent,
            actions: response.actions || [],
            conversationId: response.conversationId
        });
        
    } catch (error) {
        logger.error('Erro ao processar mensagem:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao processar mensagem'
        });
    }
});

// ===== OBTER ESTATÍSTICAS =====
/**
 * @route   GET /api/agents/:id/stats
 * @desc    Obter estatísticas do agente
 * @access  Private
 */
router.get('/:id/stats', async (req, res) => {
    try {
        const agent = await Agent.findOne({
            _id: req.params.id,
            clinic: req.clinicId
        });
        
        if (!agent) {
            return res.status(404).json({
                success: false,
                error: 'Agente não encontrado'
            });
        }
        
        // Buscar estatísticas detalhadas
        const detailedStats = await agentService.getDetailedStats(agent._id);
        
        res.json({
            success: true,
            stats: {
                ...agent.stats,
                ...detailedStats
            }
        });
        
    } catch (error) {
        logger.error('Erro ao obter estatísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao obter estatísticas'
        });
    }
});

// ===== OBTER TEMPLATES =====
/**
 * @route   GET /api/agents/templates
 * @desc    Obter templates disponíveis
 * @access  Private
 */
// ===== GERAR PROMPT COM IA =====
/**
 * @route   POST /api/agents/generate-prompt
 * @desc    Gerar prompt do sistema usando IA baseado em descrição
 * @access  Private
 */
router.post('/generate-prompt', authenticateToken, async (req, res) => {
    try {
        const { description, agentName, personality, template } = req.body;
        
        if (!description || !description.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Descrição é obrigatória'
            });
        }
        
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
        
        if (!GEMINI_API_KEY) {
            return res.status(500).json({
                success: false,
                error: 'API do Gemini não configurada'
            });
        }
        
        // Construir prompt para gerar o system prompt
        const prompt = `Você é um especialista em criar prompts de sistema para assistentes de IA conversacional.

Com base na seguinte descrição, crie um prompt de sistema completo e profissional:

DESCRIÇÃO DO AGENTE:
${description}

${agentName ? `NOME DO AGENTE: ${agentName}` : ''}
${personality ? `PERSONALIDADE: ${personality.name || 'Assistente'} - Tom: ${personality.tone || 'profissional'}` : ''}
${template ? `TEMPLATE: ${template}` : ''}

INSTRUÇÕES:
1. Crie um prompt de sistema detalhado e profissional
2. Defina claramente o papel, personalidade e comportamento do agente
3. Inclua exemplos de como o agente deve responder
4. Especifique restrições e limites importantes
5. Use tom ${personality?.tone || 'profissional'} e seja ${personality?.tone === 'empatico' ? 'empático e acolhedor' : personality?.tone === 'casual' ? 'descontraído e amigável' : 'profissional e claro'}
6. O prompt deve ter entre 200-400 palavras
7. Seja específico sobre o contexto e função do agente

Gere APENAS o prompt de sistema, sem explicações adicionais:`;

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 1000,
                    topP: 0.95,
                    topK: 40
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
                timeout: 30000
            }
        );
        
        if (!response.data.candidates || response.data.candidates.length === 0) {
            return res.status(500).json({
                success: false,
                error: 'Erro ao gerar prompt: resposta vazia da IA'
            });
        }
        
        const generatedPrompt = response.data.candidates[0].content.parts[0].text.trim();
        
        logger.info('✅ Prompt gerado com sucesso pela IA');
        
        res.json({
            success: true,
            prompt: generatedPrompt
        });
        
    } catch (error) {
        logger.error('Erro ao gerar prompt:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro ao gerar prompt com IA'
        });
    }
});

router.get('/templates/list', async (req, res) => {
    try {
        const templates = agentService.getAvailableTemplates();
        
        res.json({
            success: true,
            templates
        });
        
    } catch (error) {
        logger.error('Erro ao obter templates:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao obter templates'
        });
    }
});

// ===== ADICIONAR DOCUMENTO À KNOWLEDGE BASE =====
/**
 * @route   POST /api/agents/:id/knowledge
 * @desc    Adicionar documento à knowledge base
 * @access  Private
 */
router.post('/:id/knowledge', async (req, res) => {
    try {
        const { title, content, type, url } = req.body;
        
        const agent = await Agent.findOne({
            _id: req.params.id,
            clinic: req.clinicId
        });
        
        if (!agent) {
            return res.status(404).json({
                success: false,
                error: 'Agente não encontrado'
            });
        }
        
        if (!agent.knowledgeBase.documents) {
            agent.knowledgeBase.documents = [];
        }
        
        // Se for URL, fazer crawl
        if (url) {
            const documentService = require('../services/documentService');
            const crawled = await documentService.crawlURL(url);
            
            if (crawled.success) {
                agent.knowledgeBase.documents.push({
                    title: crawled.title,
                    content: crawled.content,
                    type: type || 'documento',
                    url: crawled.url,
                    crawledAt: crawled.crawledAt
                });
            } else {
                return res.status(400).json({
                    success: false,
                    error: 'Erro ao fazer crawl da URL: ' + crawled.error
                });
            }
        } else {
            // Documento manual
            agent.knowledgeBase.documents.push({
                title,
                content,
                type: type || 'documento'
            });
        }
        
        await agent.save();
        
        res.json({
            success: true,
            message: 'Documento adicionado com sucesso',
            agent
        });
        
    } catch (error) {
        logger.error('Erro ao adicionar documento:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao adicionar documento'
        });
    }
});

// ===== UPLOAD DE ARQUIVO =====
/**
 * @route   POST /api/agents/:id/knowledge/upload
 * @desc    Upload de arquivo para knowledge base
 * @access  Private
 */
const upload = multer({
    dest: 'uploads/temp/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        // Aceitar PDF, DOCX, DOC, TXT, MD
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'text/plain',
            'text/markdown'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não suportado. Use PDF, DOCX, DOC, TXT ou MD'));
        }
    }
});

router.post('/:id/knowledge/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Arquivo é obrigatório'
            });
        }
        
        const agent = await Agent.findOne({
            _id: req.params.id,
            clinic: req.clinicId
        });
        
        if (!agent) {
            return res.status(404).json({
                success: false,
                error: 'Agente não encontrado'
            });
        }
        
        const documentService = require('../services/documentService');
        const processed = await documentService.processDocument(req.file, req.params.id);
        
        if (!agent.knowledgeBase.documents) {
            agent.knowledgeBase.documents = [];
        }
        
        agent.knowledgeBase.documents.push({
            title: req.file.originalname,
            content: processed.content,
            type: 'documento',
            filePath: processed.filePath,
            fileSize: processed.size,
            fileType: processed.type
        });
        
        await agent.save();
        
        res.json({
            success: true,
            message: 'Arquivo adicionado com sucesso',
            agent
        });
        
    } catch (error) {
        logger.error('Erro ao fazer upload:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao fazer upload'
        });
    }
});

module.exports = router;

