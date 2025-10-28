/**
 * Middleware: Subscription Status Check
 * 
 * Verifica o status da assinatura da clínica e bloqueia acesso
 * se estiver suspensa ou inativa por inadimplência.
 */

const Clinic = require('../models/Clinic');
const Invoice = require('../models/Invoice');
const logger = require('../utils/logger');

/**
 * Verifica status da assinatura antes de permitir ação
 */
async function checkSubscriptionStatus(req, res, next) {
    try {
        // Se não houver clinicId na requisição, pular verificação
        // (será implementado quando tivermos multi-tenancy completo)
        if (!req.clinicId && !req.body.clinicId && !req.query.clinic) {
            return next();
        }

        const clinicId = req.clinicId || req.body.clinicId || req.query.clinic;
        
        // Buscar clínica
        const clinic = await Clinic.findById(clinicId);
        
        if (!clinic) {
            return res.status(404).json({
                success: false,
                error: 'Clínica não encontrada'
            });
        }

        // Verificar status da assinatura
        if (clinic.subscription.status === 'suspended') {
            return res.status(403).json({
                success: false,
                error: 'Assinatura suspensa por inadimplência',
                message: 'Entre em contato com o financeiro para regularizar sua situação',
                code: 'SUBSCRIPTION_SUSPENDED',
                contact: {
                    whatsapp: '(11) 99999-9999',
                    email: 'financeiro@atenmed.com.br'
                }
            });
        }

        if (clinic.subscription.status === 'inactive') {
            return res.status(403).json({
                success: false,
                error: 'Assinatura inativa',
                message: 'Sua assinatura foi desativada. Entre em contato para renovar.',
                code: 'SUBSCRIPTION_INACTIVE'
            });
        }

        // Adicionar informação da clínica na request para uso posterior
        req.clinic = clinic;
        next();

    } catch (error) {
        logger.error('Erro ao verificar status da assinatura:', error);
        next(); // Em caso de erro, permitir prosseguir (fail-safe)
    }
}

/**
 * Verifica se a clínica atingiu os limites do plano
 */
async function checkPlanLimits(req, res, next) {
    try {
        const clinic = req.clinic; // Definido pelo middleware anterior
        
        if (!clinic) {
            return next();
        }

        const plan = clinic.subscription.plan;
        
        // Definir limites por plano
        const limits = {
            free: {
                appointments: 50,
                whatsappMessages: 100,
                doctors: 2,
                locations: 1
            },
            basic: {
                appointments: 300,
                whatsappMessages: 1000,
                doctors: 5,
                locations: 1
            },
            pro: {
                appointments: -1, // ilimitado
                whatsappMessages: 5000,
                doctors: 20,
                locations: 3
            },
            enterprise: {
                appointments: -1,
                whatsappMessages: -1,
                doctors: -1,
                locations: -1
            }
        };

        const planLimits = limits[plan] || limits.free;
        
        // Verificar limite de agendamentos mensais (exemplo)
        if (planLimits.appointments !== -1) {
            const currentMonth = new Date();
            currentMonth.setDate(1);
            currentMonth.setHours(0, 0, 0, 0);
            
            // TODO: Implementar contagem real de agendamentos
            const monthlyAppointments = clinic.stats?.totalAppointments || 0;
            
            if (monthlyAppointments >= planLimits.appointments) {
                return res.status(403).json({
                    success: false,
                    error: 'Limite de agendamentos atingido',
                    message: `Seu plano ${plan.toUpperCase()} permite até ${planLimits.appointments} agendamentos por mês.`,
                    code: 'PLAN_LIMIT_REACHED',
                    suggestion: 'Faça upgrade do seu plano para continuar',
                    upgradeUrl: '/planos'
                });
            }
        }

        next();

    } catch (error) {
        logger.error('Erro ao verificar limites do plano:', error);
        next(); // Fail-safe
    }
}

/**
 * Atualiza automaticamente status de clínicas inadimplentes
 * Deve ser executado diariamente via cron job
 */
async function updateOverdueSubscriptions() {
    try {
        logger.info('Iniciando atualização de status de assinaturas...');

        // Buscar faturas vencidas há mais de 15 dias
        const overdueDate = new Date();
        overdueDate.setDate(overdueDate.getDate() - 15);

        const overdueInvoices = await Invoice.find({
            status: 'pendente',
            dueDate: { $lt: overdueDate }
        }).populate('clinic');

        let suspended = 0;

        for (const invoice of overdueInvoices) {
            const clinic = invoice.clinic;
            
            if (!clinic) continue;

            // Verificar se já está suspensa
            if (clinic.subscription.status === 'suspended') {
                continue;
            }

            // Suspender assinatura
            clinic.subscription.status = 'suspended';
            await clinic.save();

            suspended++;
            
            logger.warn(`Clínica suspensa por inadimplência: ${clinic.name} (Fatura ${invoice.invoiceNumber})`);
            
            // TODO: Enviar notificação por email/WhatsApp
        }

        logger.info(`Atualização concluída: ${suspended} clínicas suspensas`);
        return { suspended };

    } catch (error) {
        logger.error('Erro ao atualizar assinaturas vencidas:', error);
        throw error;
    }
}

/**
 * Reativa clínicas após pagamento
 */
async function reactivateSubscription(clinicId) {
    try {
        const clinic = await Clinic.findById(clinicId);
        
        if (!clinic) {
            throw new Error('Clínica não encontrada');
        }

        // Verificar se há faturas pendentes
        const pendingInvoices = await Invoice.find({
            clinic: clinicId,
            status: { $in: ['pendente', 'vencido'] }
        });

        if (pendingInvoices.length > 0) {
            throw new Error('Ainda há faturas pendentes');
        }

        // Reativar
        clinic.subscription.status = 'active';
        await clinic.save();

        logger.info(`Clínica reativada: ${clinic.name}`);
        
        return clinic;

    } catch (error) {
        logger.error('Erro ao reativar assinatura:', error);
        throw error;
    }
}

module.exports = {
    checkSubscriptionStatus,
    checkPlanLimits,
    updateOverdueSubscriptions,
    reactivateSubscription
};

