/**
 * AtenMed - WhatsApp Business API Routes V2
 * Webhook endpoints melhorados com signature verification
 */

const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappServiceV2');
const { authenticateToken, authorize } = require('../middleware/auth');
const { checkSubscriptionStatus, checkPlanLimits } = require('../middleware/subscriptionStatus');
const logger = require('../utils/logger');

// Observação: o raw body é capturado via express.json({ verify }) abaixo

// ===== WEBHOOK VERIFICATION =====

/**
 * @route   GET /api/whatsapp/webhook
 * @desc    Verificação do webhook do WhatsApp Business API
 * @access  Public (verificado por token)
 */
router.get('/webhook', (req, res) => {
    try {
        // Parse URL diretamente para ignorar sanitização
        const url = require('url');
        const parsed = url.parse(req.originalUrl, true);
        const qs = parsed.query;

        const mode = qs['hub.mode'] || qs.mode;
        const token = qs['hub.verify_token'] || qs.token;
        const challenge = qs['hub.challenge'] || qs.challenge;

        // LOG DETALHADO PARA DEBUG
        logger.info('📱 Tentativa de verificação de webhook WhatsApp');
        logger.info(`   Mode: ${mode}`);
        logger.info(`   Token: ${token ? '***' + token.slice(-4) : 'null'}`);
        logger.info(`   Challenge: ${challenge ? challenge.substring(0, 20) + '...' : 'null'}`);
        logger.info(`   IP: ${req.ip}`);
        logger.info(`   User-Agent: ${req.get('user-agent')}`);

        const result = whatsappService.verifyWebhook(mode, token, challenge);

        if (result) {
            logger.info('✅ Webhook verificado com sucesso');
            logger.info(`   Retornando challenge: ${result}`);
            return res.status(200).send(result);
        }

        logger.warn('❌ Falha na verificação do webhook');
        logger.warn(`   Mode: ${mode}, Token válido: ${token === process.env.WHATSAPP_VERIFY_TOKEN}`);
        return res.sendStatus(403);

    } catch (error) {
        logger.error('Erro na verificação do webhook:', error);
        res.sendStatus(500);
    }
});

// ===== WEBHOOK PARA MENSAGENS =====

/**
 * @route   POST /api/whatsapp/webhook
 * @desc    Receber mensagens do WhatsApp Business API
 * @access  Public (verificado pela signature do Meta)
 */
router.post('/webhook', express.json({ 
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}), async (req, res) => {
    try {
        // Verificar signature do Meta (se configurado)
        const signature = req.get('x-hub-signature-256');
        
        if (signature && process.env.WHATSAPP_APP_SECRET) {
            const isValid = whatsappService.verifyWebhookSignature(req.rawBody, signature);
            
            if (!isValid) {
                logger.warn('❌ Signature inválida do webhook WhatsApp');
                logger.warn(`   IP: ${req.ip}`);
                logger.warn(`   Signature: ${signature}`);
                return res.sendStatus(403);
            }
            
            logger.info('✅ Signature do webhook verificada');
        } else if (!signature) {
            logger.warn('⚠️ Webhook recebido sem signature (aceito apenas em desenvolvimento)');
            if (process.env.NODE_ENV === 'production') {
                logger.error('❌ Produção: Signature obrigatória!');
                return res.sendStatus(403);
            }
        }

        const body = req.body;

        // Verificar se é uma notificação do WhatsApp
        if (body.object !== 'whatsapp_business_account') {
            logger.warn(`❌ Objeto inválido recebido: ${body.object}`);
            return res.sendStatus(404);
        }

        // Responder imediatamente (webhook deve responder em menos de 20s)
        res.sendStatus(200);

        logger.info(`📬 Webhook recebido: ${body.entry?.length || 0} entradas`);

        // Processar mensagens de forma assíncrona
        if (body.entry && Array.isArray(body.entry)) {
            for (const entry of body.entry) {
                if (entry.changes && Array.isArray(entry.changes)) {
                    for (const change of entry.changes) {
                        // Processar mensagens recebidas
                        if (change.value?.messages && Array.isArray(change.value.messages)) {
                            for (const message of change.value.messages) {
                                logger.info(`📨 Processando mensagem de ${message.from}`);
                                
                                // Passar metadata para identificar a clínica
                                const metadata = change.value?.metadata || null;
                                
                                // Processar mensagem de forma assíncrona
                                whatsappService.handleIncomingMessage(message, metadata)
                                    .catch(err => {
                                        logger.error('Erro ao processar mensagem:', err);
                                        logger.error('Mensagem:', JSON.stringify(message, null, 2));
                                    });
                            }
                        }

                        // Processar status de mensagens enviadas
                        if (change.value?.statuses && Array.isArray(change.value.statuses)) {
                            for (const status of change.value.statuses) {
                                logger.info(`📬 Status de mensagem: ${status.id} - ${status.status}`);
                                
                                // Aqui você pode atualizar o banco de dados com o status
                                if (status.status === 'failed') {
                                    logger.error(`❌ Mensagem falhou: ${status.id}`, status.errors);
                                }
                            }
                        }
                    }
                }
            }
        }

    } catch (error) {
        logger.error('Erro ao processar webhook:', error);
        logger.error('Body:', JSON.stringify(req.body, null, 2));
        // Não enviar erro 500 para não fazer o WhatsApp retentar indefinidamente
        res.sendStatus(200);
    }
});

// ===== ENVIAR MENSAGEM MANUAL =====

/**
 * @route   POST /api/whatsapp/send
 * @desc    Enviar mensagem manual (para testes ou admin)
 * @access  Private (Admin only)
 */
router.post('/send', authenticateToken, authorize('admin'), checkSubscriptionStatus, checkPlanLimits, async (req, res) => {
    try {
        const { to, message, priority } = req.body;

        if (!to || !message) {
            return res.status(400).json({
                success: false,
                message: 'Telefone e mensagem são obrigatórios'
            });
        }

        // Remover caracteres não numéricos do telefone
        const cleanPhone = to.replace(/\D/g, '');

        if (cleanPhone.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Número de telefone inválido'
            });
        }

        logger.info(`📤 Enviando mensagem para ${cleanPhone}`);

        const result = await whatsappService.sendMessage(cleanPhone, message, priority);

        res.json({
            success: true,
            data: result,
            message: result.queued ? 'Mensagem adicionada à fila' : 'Mensagem enviada'
        });

    } catch (error) {
        logger.error('Erro ao enviar mensagem:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao enviar mensagem',
            error: error.message
        });
    }
});

// ===== ENVIAR MENSAGEM DE TESTE =====

/**
 * @route   POST /api/whatsapp/send-test
 * @desc    Enviar mensagem de teste
 * @access  Private (Admin only)
 */
router.post('/send-test', authenticateToken, authorize('admin'), checkSubscriptionStatus, async (req, res) => {
    try {
        const { phone, message } = req.body;
        
        if (!phone || !message) {
            return res.status(400).json({
                success: false,
                error: 'Telefone e mensagem são obrigatórios'
            });
        }
        
        // Verificar se está configurado
        if (!process.env.WHATSAPP_PHONE_ID || !process.env.WHATSAPP_TOKEN) {
            return res.status(503).json({
                success: false,
                error: 'WhatsApp não configurado. Configure WHATSAPP_PHONE_ID e WHATSAPP_TOKEN nas variáveis de ambiente.'
            });
        }
        
        // Remover caracteres não numéricos e validar formato
        const cleanPhone = phone.replace(/\D/g, '');
        
        if (cleanPhone.length < 10) {
            return res.status(400).json({
                success: false,
                error: 'Número de telefone inválido (mínimo 10 dígitos)'
            });
        }
        
        logger.info(`📤 Enviando mensagem de teste para ${cleanPhone}`);
        
        const result = await whatsappService.sendMessage(cleanPhone, message, 'high');
        
        logger.info(`✅ Mensagem de teste enviada para ${cleanPhone}`);
        
        res.json({
            success: true,
            message: 'Mensagem enviada com sucesso',
            data: result,
            phone: cleanPhone
        });
        
    } catch (error) {
        logger.error('Erro ao enviar mensagem de teste:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro ao enviar mensagem'
        });
    }
});

// ===== ESTATÍSTICAS =====

/**
 * @route   GET /api/whatsapp/stats
 * @desc    Retorna estatísticas de mensagens WhatsApp
 * @access  Admin
 */
router.get('/stats', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const Appointment = require('../models/Appointment');

        const whatsappAppointments = await Appointment.countDocuments({
            source: 'whatsapp'
        });

        const whatsappConfirmed = await Appointment.countDocuments({
            source: 'whatsapp',
            'confirmations.patient.method': 'whatsapp'
        });

        const serviceStats = whatsappService.getStats();

        res.json({
            success: true,
            data: {
                appointments: {
                    total: whatsappAppointments,
                    confirmedViaWhatsApp: whatsappConfirmed,
                    confirmationRate: whatsappAppointments > 0 
                        ? ((whatsappConfirmed / whatsappAppointments) * 100).toFixed(1) + '%'
                        : '0%'
                },
                service: serviceStats
            }
        });

    } catch (error) {
        logger.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar estatísticas',
            error: error.message
        });
    }
});

// ===== HEALTH CHECK =====

/**
 * @route   GET /api/whatsapp/health
 * @desc    Verificar status da integração WhatsApp
 * @access  Public
 */
router.get('/health', (req, res) => {
    try {
        const health = whatsappService.healthCheck();
        
        res.status(health.healthy ? 200 : 503).json({
            success: health.healthy,
            status: health.healthy ? 'healthy' : 'unhealthy',
            ...health
        });
    } catch (error) {
        logger.error('Erro ao verificar health:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao verificar status'
        });
    }
});

// ===== STATUS DA CONEXÃO =====

/**
 * @route   GET /api/whatsapp/status
 * @desc    Verificar status da conexão WhatsApp
 * @access  Private (Admin only)
 */
router.get('/status', authenticateToken, authorize('admin'), (req, res) => {
    try {
        const configured = !!(process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_TOKEN);
        const stats = whatsappService.getStats();
        
        res.json({
            success: true,
            configured,
            message: configured ? 
                'WhatsApp configurado e pronto' : 
                'WhatsApp não configurado. Adicione WHATSAPP_PHONE_ID e WHATSAPP_TOKEN',
            stats
        });
    } catch (error) {
        logger.error('Erro ao verificar status:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao verificar status'
        });
    }
});

// ===== CONFIGURAÇÃO =====

/**
 * @route   GET /api/whatsapp/config
 * @desc    Verificar configuração atual
 * @access  Private (Admin only)
 */
router.get('/config', authenticateToken, authorize('admin'), (req, res) => {
    try {
        const phoneId = process.env.WHATSAPP_PHONE_ID;
        const token = process.env.WHATSAPP_TOKEN;
        const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
        const appSecret = process.env.WHATSAPP_APP_SECRET;
        const apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
        
        const configured = !!(phoneId && token && verifyToken);
        
        // Recomendações de configuração
        const recommendations = [];
        if (!appSecret) {
            recommendations.push('Configure WHATSAPP_APP_SECRET para validação de signature (segurança)');
        }
        if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
            recommendations.push('Configure Redis para habilitar fila de mensagens (melhor performance)');
        }

        res.json({
            success: true,
            configured,
            phoneId: phoneId ? `${phoneId.substring(0, 8)}***` : null,
            apiUrl: apiUrl,
            hasToken: !!token,
            hasVerifyToken: !!verifyToken,
            hasAppSecret: !!appSecret,
            appSecretRequired: process.env.NODE_ENV === 'production',
            recommendations: recommendations.length > 0 ? recommendations : []
        });
        
    } catch (error) {
        logger.error('Erro ao verificar configuração:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao verificar configuração'
        });
    }
});

// ===== DEBUG WEBHOOK =====

/**
 * @route   GET /api/whatsapp/debug-webhook
 * @desc    Debug do webhook - mostra configuração atual
 * @access  Private (Admin only)
 */
router.get('/debug-webhook', authenticateToken, authorize('admin'), (req, res) => {
    const health = whatsappService.healthCheck();
    
    res.json({
        success: true,
        debug: {
            env_verify_token: process.env.WHATSAPP_VERIFY_TOKEN ? 
                `***${process.env.WHATSAPP_VERIFY_TOKEN.slice(-4)}` : 'NÃO CONFIGURADO',
            env_verify_token_length: (process.env.WHATSAPP_VERIFY_TOKEN || '').length,
            env_phone_id: process.env.WHATSAPP_PHONE_ID ? 
                `${process.env.WHATSAPP_PHONE_ID.substring(0, 8)}***` : 'NÃO configurado',
            env_token: process.env.WHATSAPP_TOKEN ? 'Configurado (****)' : 'NÃO configurado',
            env_app_secret: process.env.WHATSAPP_APP_SECRET ? 'Configurado (****)' : 'NÃO configurado',
            api_url: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0'
        },
        health
    });
});

// ===== WEBHOOK TEST ENDPOINT =====

/**
 * @route   POST /api/whatsapp/test-webhook
 * @desc    Endpoint para testar processamento de webhook localmente
 * @access  Private (Admin only) - Apenas para desenvolvimento/testes
 */
router.post('/test-webhook', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                success: false,
                error: 'Endpoint de teste não disponível em produção'
            });
        }

        const { from, message } = req.body;

        if (!from || !message) {
            return res.status(400).json({
                success: false,
                error: 'Parâmetros "from" e "message" são obrigatórios'
            });
        }

        const mockMessage = {
            from: from,
            type: 'text',
            text: {
                body: message
            },
            timestamp: Date.now()
        };

        await whatsappService.handleIncomingMessage(mockMessage);

        res.json({
            success: true,
            message: 'Mensagem de teste processada',
            data: mockMessage
        });

    } catch (error) {
        logger.error('Erro ao processar teste de webhook:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== ESTATÍSTICAS =====



/**

 * @route   GET /api/whatsapp/stats

 * @desc    Retorna estatísticas de mensagens WhatsApp

 * @access  Admin

 */

router.get('/stats', authenticateToken, authorize('admin'), async (req, res) => {

    try {

        const Appointment = require('../models/Appointment');



        const whatsappAppointments = await Appointment.countDocuments({

            source: 'whatsapp'

        });



        const whatsappConfirmed = await Appointment.countDocuments({

            source: 'whatsapp',

            'confirmations.patient.method': 'whatsapp'

        });



        const serviceStats = whatsappService.getStats();



        res.json({

            success: true,

            data: {

                appointments: {

                    total: whatsappAppointments,

                    confirmedViaWhatsApp: whatsappConfirmed,

                    confirmationRate: whatsappAppointments > 0 

                        ? ((whatsappConfirmed / whatsappAppointments) * 100).toFixed(1) + '%'

                        : '0%'

                },

                service: serviceStats

            }

        });



    } catch (error) {

        logger.error('Erro ao buscar estatísticas:', error);

        res.status(500).json({

            success: false,

            message: 'Erro ao buscar estatísticas',

            error: error.message

        });

    }

});



// ===== HEALTH CHECK =====



/**

 * @route   GET /api/whatsapp/health

 * @desc    Verificar status da integração WhatsApp

 * @access  Public

 */

router.get('/health', (req, res) => {

    try {

        const health = whatsappService.healthCheck();

        

        res.status(health.healthy ? 200 : 503).json({

            success: health.healthy,

            status: health.healthy ? 'healthy' : 'unhealthy',

            ...health

        });

    } catch (error) {

        logger.error('Erro ao verificar health:', error);

        res.status(500).json({

            success: false,

            error: 'Erro ao verificar status'

        });

    }

});



// ===== STATUS DA CONEXÃO =====



/**

 * @route   GET /api/whatsapp/status

 * @desc    Verificar status da conexão WhatsApp

 * @access  Private (Admin only)

 */

router.get('/status', authenticateToken, authorize('admin'), (req, res) => {

    try {

        const configured = !!(process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_TOKEN);

        const stats = whatsappService.getStats();

        

        res.json({

            success: true,

            configured,

            message: configured ? 

                'WhatsApp configurado e pronto' : 

                'WhatsApp não configurado. Adicione WHATSAPP_PHONE_ID e WHATSAPP_TOKEN',

            stats

        });

    } catch (error) {

        logger.error('Erro ao verificar status:', error);

        res.status(500).json({

            success: false,

            error: 'Erro ao verificar status'

        });

    }

});



// ===== CONFIGURAÇÃO =====



/**

 * @route   GET /api/whatsapp/config

 * @desc    Verificar configuração atual

 * @access  Private (Admin only)

 */

router.get('/config', authenticateToken, authorize('admin'), (req, res) => {

    try {

        const phoneId = process.env.WHATSAPP_PHONE_ID;

        const token = process.env.WHATSAPP_TOKEN;

        const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

        const appSecret = process.env.WHATSAPP_APP_SECRET;

        const apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';

        

        const configured = !!(phoneId && token && verifyToken);

        

        res.json({

            success: true,

            configured,

            phoneId: phoneId ? `${phoneId.substring(0, 8)}***` : null,

            apiUrl: apiUrl,

            hasToken: !!token,

            hasVerifyToken: !!verifyToken,

            hasAppSecret: !!appSecret,

            appSecretRequired: process.env.NODE_ENV === 'production',

            recommendations: []

        });



        // Adicionar recomendações

        const recommendations = [];

        if (!appSecret) {

            recommendations.push('Configure WHATSAPP_APP_SECRET para validação de signature (segurança)');

        }

        if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {

            recommendations.push('Configure Redis para habilitar fila de mensagens (melhor performance)');

        }



        res.json({

            success: true,

            configured,

            phoneId: phoneId ? `${phoneId.substring(0, 8)}***` : null,

            apiUrl: apiUrl,

            hasToken: !!token,

            hasVerifyToken: !!verifyToken,

            hasAppSecret: !!appSecret,

            recommendations: recommendations.length > 0 ? recommendations : null

        });

        

    } catch (error) {

        logger.error('Erro ao verificar configuração:', error);

        res.status(500).json({

            success: false,

            error: 'Erro ao verificar configuração'

        });

    }

});

// ===== WEBHOOK TEST ENDPOINT =====



/**

 * @route   POST /api/whatsapp/test-webhook

 * @desc    Endpoint para testar processamento de webhook localmente

 * @access  Private (Admin only) - Apenas para desenvolvimento/testes

 */

router.post('/test-webhook', authenticateToken, authorize('admin'), async (req, res) => {

    try {

        if (process.env.NODE_ENV === 'production') {

            return res.status(403).json({

                success: false,

                error: 'Endpoint de teste não disponível em produção'

            });

        }



        const { from, message } = req.body;



        if (!from || !message) {

            return res.status(400).json({

                success: false,

                error: 'Parâmetros "from" e "message" são obrigatórios'

            });

        }



        const mockMessage = {

            from: from,

            type: 'text',

            text: {

                body: message

            },

            timestamp: Date.now()

        };



        await whatsappService.handleIncomingMessage(mockMessage);



        res.json({

            success: true,

            message: 'Mensagem de teste processada',

            data: mockMessage

        });



    } catch (error) {

        logger.error('Erro ao processar teste de webhook:', error);

        res.status(500).json({

            success: false,

            error: error.message

        });

    }

});



module.exports = router;









// ===== ESTATÍSTICAS =====



/**

 * @route   GET /api/whatsapp/stats

 * @desc    Retorna estatísticas de mensagens WhatsApp

 * @access  Admin

 */

router.get('/stats', authenticateToken, authorize('admin'), async (req, res) => {

    try {

        const Appointment = require('../models/Appointment');



        const whatsappAppointments = await Appointment.countDocuments({

            source: 'whatsapp'

        });



        const whatsappConfirmed = await Appointment.countDocuments({

            source: 'whatsapp',

            'confirmations.patient.method': 'whatsapp'

        });



        const serviceStats = whatsappService.getStats();



        res.json({

            success: true,

            data: {

                appointments: {

                    total: whatsappAppointments,

                    confirmedViaWhatsApp: whatsappConfirmed,

                    confirmationRate: whatsappAppointments > 0 

                        ? ((whatsappConfirmed / whatsappAppointments) * 100).toFixed(1) + '%'

                        : '0%'

                },

                service: serviceStats

            }

        });



    } catch (error) {

        logger.error('Erro ao buscar estatísticas:', error);

        res.status(500).json({

            success: false,

            message: 'Erro ao buscar estatísticas',

            error: error.message

        });

    }

});



// ===== HEALTH CHECK =====



/**

 * @route   GET /api/whatsapp/health

 * @desc    Verificar status da integração WhatsApp

 * @access  Public

 */

router.get('/health', (req, res) => {

    try {

        const health = whatsappService.healthCheck();

        

        res.status(health.healthy ? 200 : 503).json({

            success: health.healthy,

            status: health.healthy ? 'healthy' : 'unhealthy',

            ...health

        });

    } catch (error) {

        logger.error('Erro ao verificar health:', error);

        res.status(500).json({

            success: false,

            error: 'Erro ao verificar status'

        });

    }

});



// ===== STATUS DA CONEXÃO =====



/**

 * @route   GET /api/whatsapp/status

 * @desc    Verificar status da conexão WhatsApp

 * @access  Private (Admin only)

 */

router.get('/status', authenticateToken, authorize('admin'), (req, res) => {

    try {

        const configured = !!(process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_TOKEN);

        const stats = whatsappService.getStats();

        

        res.json({

            success: true,

            configured,

            message: configured ? 

                'WhatsApp configurado e pronto' : 

                'WhatsApp não configurado. Adicione WHATSAPP_PHONE_ID e WHATSAPP_TOKEN',

            stats

        });

    } catch (error) {

        logger.error('Erro ao verificar status:', error);

        res.status(500).json({

            success: false,

            error: 'Erro ao verificar status'

        });

    }

});



// ===== CONFIGURAÇÃO =====



/**

 * @route   GET /api/whatsapp/config

 * @desc    Verificar configuração atual

 * @access  Private (Admin only)

 */

router.get('/config', authenticateToken, authorize('admin'), (req, res) => {

    try {

        const phoneId = process.env.WHATSAPP_PHONE_ID;

        const token = process.env.WHATSAPP_TOKEN;

        const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

        const appSecret = process.env.WHATSAPP_APP_SECRET;

        const apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';

        

        const configured = !!(phoneId && token && verifyToken);

        

        res.json({

            success: true,

            configured,

            phoneId: phoneId ? `${phoneId.substring(0, 8)}***` : null,

            apiUrl: apiUrl,

            hasToken: !!token,

            hasVerifyToken: !!verifyToken,

            hasAppSecret: !!appSecret,

            appSecretRequired: process.env.NODE_ENV === 'production',

            recommendations: []

        });



        // Adicionar recomendações

        const recommendations = [];

        if (!appSecret) {

            recommendations.push('Configure WHATSAPP_APP_SECRET para validação de signature (segurança)');

        }

        if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {

            recommendations.push('Configure Redis para habilitar fila de mensagens (melhor performance)');

        }



        res.json({

            success: true,

            configured,

            phoneId: phoneId ? `${phoneId.substring(0, 8)}***` : null,

            apiUrl: apiUrl,

            hasToken: !!token,

            hasVerifyToken: !!verifyToken,

            hasAppSecret: !!appSecret,

            recommendations: recommendations.length > 0 ? recommendations : null

        });

        

    } catch (error) {

        logger.error('Erro ao verificar configuração:', error);

        res.status(500).json({

            success: false,

            error: 'Erro ao verificar configuração'

        });

    }

});

// ===== WEBHOOK TEST ENDPOINT =====



/**

 * @route   POST /api/whatsapp/test-webhook

 * @desc    Endpoint para testar processamento de webhook localmente

 * @access  Private (Admin only) - Apenas para desenvolvimento/testes

 */

router.post('/test-webhook', authenticateToken, authorize('admin'), async (req, res) => {

    try {

        if (process.env.NODE_ENV === 'production') {

            return res.status(403).json({

                success: false,

                error: 'Endpoint de teste não disponível em produção'

            });

        }



        const { from, message } = req.body;



        if (!from || !message) {

            return res.status(400).json({

                success: false,

                error: 'Parâmetros "from" e "message" são obrigatórios'

            });

        }



        const mockMessage = {

            from: from,

            type: 'text',

            text: {

                body: message

            },

            timestamp: Date.now()

        };



        await whatsappService.handleIncomingMessage(mockMessage);



        res.json({

            success: true,

            message: 'Mensagem de teste processada',

            data: mockMessage

        });



    } catch (error) {

        logger.error('Erro ao processar teste de webhook:', error);

        res.status(500).json({

            success: false,

            error: error.message

        });

    }

});



module.exports = router;









// ===== ESTATÍSTICAS =====



/**

 * @route   GET /api/whatsapp/stats

 * @desc    Retorna estatísticas de mensagens WhatsApp

 * @access  Admin

 */

router.get('/stats', authenticateToken, authorize('admin'), async (req, res) => {

    try {

        const Appointment = require('../models/Appointment');



        const whatsappAppointments = await Appointment.countDocuments({

            source: 'whatsapp'

        });



        const whatsappConfirmed = await Appointment.countDocuments({

            source: 'whatsapp',

            'confirmations.patient.method': 'whatsapp'

        });



        const serviceStats = whatsappService.getStats();



        res.json({

            success: true,

            data: {

                appointments: {

                    total: whatsappAppointments,

                    confirmedViaWhatsApp: whatsappConfirmed,

                    confirmationRate: whatsappAppointments > 0 

                        ? ((whatsappConfirmed / whatsappAppointments) * 100).toFixed(1) + '%'

                        : '0%'

                },

                service: serviceStats

            }

        });



    } catch (error) {

        logger.error('Erro ao buscar estatísticas:', error);

        res.status(500).json({

            success: false,

            message: 'Erro ao buscar estatísticas',

            error: error.message

        });

    }

});



// ===== HEALTH CHECK =====



/**

 * @route   GET /api/whatsapp/health

 * @desc    Verificar status da integração WhatsApp

 * @access  Public

 */

router.get('/health', (req, res) => {

    try {

        const health = whatsappService.healthCheck();

        

        res.status(health.healthy ? 200 : 503).json({

            success: health.healthy,

            status: health.healthy ? 'healthy' : 'unhealthy',

            ...health

        });

    } catch (error) {

        logger.error('Erro ao verificar health:', error);

        res.status(500).json({

            success: false,

            error: 'Erro ao verificar status'

        });

    }

});



// ===== STATUS DA CONEXÃO =====



/**

 * @route   GET /api/whatsapp/status

 * @desc    Verificar status da conexão WhatsApp

 * @access  Private (Admin only)

 */

router.get('/status', authenticateToken, authorize('admin'), (req, res) => {

    try {

        const configured = !!(process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_TOKEN);

        const stats = whatsappService.getStats();

        

        res.json({

            success: true,

            configured,

            message: configured ? 

                'WhatsApp configurado e pronto' : 

                'WhatsApp não configurado. Adicione WHATSAPP_PHONE_ID e WHATSAPP_TOKEN',

            stats

        });

    } catch (error) {

        logger.error('Erro ao verificar status:', error);

        res.status(500).json({

            success: false,

            error: 'Erro ao verificar status'

        });

    }

});



// ===== CONFIGURAÇÃO =====



/**

 * @route   GET /api/whatsapp/config

 * @desc    Verificar configuração atual

 * @access  Private (Admin only)

 */

router.get('/config', authenticateToken, authorize('admin'), (req, res) => {

    try {

        const phoneId = process.env.WHATSAPP_PHONE_ID;

        const token = process.env.WHATSAPP_TOKEN;

        const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

        const appSecret = process.env.WHATSAPP_APP_SECRET;

        const apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';

        

        const configured = !!(phoneId && token && verifyToken);

        

        res.json({

            success: true,

            configured,

            phoneId: phoneId ? `${phoneId.substring(0, 8)}***` : null,

            apiUrl: apiUrl,

            hasToken: !!token,

            hasVerifyToken: !!verifyToken,

            hasAppSecret: !!appSecret,

            appSecretRequired: process.env.NODE_ENV === 'production',

            recommendations: []

        });



        // Adicionar recomendações

        const recommendations = [];

        if (!appSecret) {

            recommendations.push('Configure WHATSAPP_APP_SECRET para validação de signature (segurança)');

        }

        if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {

            recommendations.push('Configure Redis para habilitar fila de mensagens (melhor performance)');

        }



        res.json({

            success: true,

            configured,

            phoneId: phoneId ? `${phoneId.substring(0, 8)}***` : null,

            apiUrl: apiUrl,

            hasToken: !!token,

            hasVerifyToken: !!verifyToken,

            hasAppSecret: !!appSecret,

            recommendations: recommendations.length > 0 ? recommendations : null

        });

        

    } catch (error) {

        logger.error('Erro ao verificar configuração:', error);

        res.status(500).json({

            success: false,

            error: 'Erro ao verificar configuração'

        });

    }

});

// ===== WEBHOOK TEST ENDPOINT =====



/**

 * @route   POST /api/whatsapp/test-webhook

 * @desc    Endpoint para testar processamento de webhook localmente

 * @access  Private (Admin only) - Apenas para desenvolvimento/testes

 */

router.post('/test-webhook', authenticateToken, authorize('admin'), async (req, res) => {

    try {

        if (process.env.NODE_ENV === 'production') {

            return res.status(403).json({

                success: false,

                error: 'Endpoint de teste não disponível em produção'

            });

        }



        const { from, message } = req.body;



        if (!from || !message) {

            return res.status(400).json({

                success: false,

                error: 'Parâmetros "from" e "message" são obrigatórios'

            });

        }



        const mockMessage = {

            from: from,

            type: 'text',

            text: {

                body: message

            },

            timestamp: Date.now()

        };



        await whatsappService.handleIncomingMessage(mockMessage);



        res.json({

            success: true,

            message: 'Mensagem de teste processada',

            data: mockMessage

        });



    } catch (error) {

        logger.error('Erro ao processar teste de webhook:', error);

        res.status(500).json({

            success: false,

            error: error.message

        });

    }

});



module.exports = router;








