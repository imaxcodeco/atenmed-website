const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');
const logger = require('./logger');

// Inicializar Sentry apenas em produção
function initSentry(app) {
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || 'production',
            integrations: [
                // Habilitar tracing HTTP
                new Sentry.Integrations.Http({ tracing: true }),
                // Habilitar tracing Express
                new Sentry.Integrations.Express({ app }),
                // Habilitar profiling de performance
                new ProfilingIntegration(),
            ],
            // Taxa de amostragem de performance (1.0 = 100%)
            tracesSampleRate: 0.1, // 10% das transações
            // Taxa de amostragem de perfis
            profilesSampleRate: 0.1, // 10% dos perfis
            // Ignorar erros conhecidos
            ignoreErrors: [
                'ECONNREFUSED',
                'ENOTFOUND',
                'ETIMEDOUT',
                'Rate limit exceeded',
            ],
            // Capturar variáveis de ambiente (útil para debug)
            beforeSend(event, hint) {
                // Não enviar informações sensíveis
                if (event.request) {
                    delete event.request.cookies;
                    delete event.request.headers['authorization'];
                }
                return event;
            },
        });

        logger.info('✅ Sentry inicializado');

        return {
            requestHandler: Sentry.Handlers.requestHandler(),
            tracingHandler: Sentry.Handlers.tracingHandler(),
            errorHandler: Sentry.Handlers.errorHandler(),
        };
    }

    logger.info('ℹ️  Sentry desabilitado (desenvolvimento ou DSN não configurado)');
    
    // Retornar middlewares vazios se Sentry não estiver configurado
    return {
        requestHandler: (req, res, next) => next(),
        tracingHandler: (req, res, next) => next(),
        errorHandler: (err, req, res, next) => next(err),
    };
}

// Capturar exceção manualmente
function captureException(error, context = {}) {
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
        Sentry.captureException(error, {
            extra: context,
        });
    }
    logger.error('Exceção capturada:', { error: error.message, context });
}

// Capturar mensagem
function captureMessage(message, level = 'info', context = {}) {
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
        Sentry.captureMessage(message, {
            level,
            extra: context,
        });
    }
    logger.info(message, context);
}

// Adicionar breadcrumb (rastro de navegação)
function addBreadcrumb(breadcrumb) {
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
        Sentry.addBreadcrumb(breadcrumb);
    }
}

// Definir contexto de usuário
function setUser(user) {
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
        Sentry.setUser({
            id: user._id || user.id,
            email: user.email,
            username: user.nome || user.name,
        });
    }
}

// Limpar contexto de usuário (logout)
function clearUser() {
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
        Sentry.setUser(null);
    }
}

module.exports = {
    initSentry,
    captureException,
    captureMessage,
    addBreadcrumb,
    setUser,
    clearUser,
    Sentry,
};

