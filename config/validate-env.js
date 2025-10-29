/**
 * Validação de Variáveis de Ambiente
 * 
 * Valida que todas as variáveis críticas estão configuradas antes
 * de iniciar a aplicação. Previne erros em runtime.
 */

const logger = require('../utils/logger');

// Variáveis obrigatórias por ambiente
const requiredEnvVars = {
    production: [
        // Core
        'NODE_ENV',
        'PORT',
        
        // Database
        'MONGODB_URI',
        
        // Segurança
        'JWT_SECRET',
        'SESSION_SECRET',
        
        // WhatsApp (obrigatório em produção)
        'WHATSAPP_PHONE_ID',
        'WHATSAPP_TOKEN',
        'WHATSAPP_VERIFY_TOKEN',
        'WHATSAPP_APP_SECRET',
        
        // Email (obrigatório em produção)
        'EMAIL_HOST',
        'EMAIL_PORT',
        'EMAIL_USER',
        'EMAIL_PASS',
        'EMAIL_FROM'
    ],
    
    development: [
        'NODE_ENV',
        'PORT',
        'JWT_SECRET'
    ],
    
    test: [
        'NODE_ENV',
        'MONGODB_TEST_URI',
        'JWT_SECRET'
    ]
};

// Variáveis opcionais mas recomendadas
const recommendedEnvVars = {
    production: [
        'REDIS_URL',
        'SENTRY_DSN',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'GEMINI_API_KEY',
        'CORS_ORIGIN'
    ],
    development: [
        'MONGODB_URI'
    ]
};

/**
 * Valida variáveis de ambiente
 * @param {boolean} strict - Se true, falha em produção se vars faltarem
 * @returns {Object} Resultado da validação
 */
function validateEnv(strict = true) {
    const env = process.env.NODE_ENV || 'development';
    const required = requiredEnvVars[env] || requiredEnvVars.development;
    const recommended = recommendedEnvVars[env] || [];
    
    // Verificar variáveis obrigatórias
    const missingRequired = required.filter(varName => !process.env[varName]);
    
    // Verificar variáveis recomendadas
    const missingRecommended = recommended.filter(varName => !process.env[varName]);
    
    const hasErrors = missingRequired.length > 0;
    const hasWarnings = missingRecommended.length > 0;
    
    // Log dos resultados
    if (hasErrors) {
        logger.error(`❌ Variáveis de ambiente obrigatórias não configuradas (${env}):`);
        missingRequired.forEach(varName => {
            logger.error(`   - ${varName}`);
        });
        
        if (env === 'production' && strict) {
            logger.error('\n🚨 APLICAÇÃO NÃO PODE INICIAR EM PRODUÇÃO SEM ESSAS VARIÁVEIS!');
            process.exit(1);
        } else {
            logger.warn('\n⚠️ Continuando em modo desenvolvimento...');
        }
    } else {
        logger.info(`✅ Todas as variáveis obrigatórias configuradas (${env})`);
    }
    
    if (hasWarnings) {
        logger.warn(`⚠️ Variáveis recomendadas não configuradas (${env}):`);
        missingRecommended.forEach(varName => {
            logger.warn(`   - ${varName} (recomendado)`);
        });
    }
    
    return {
        valid: !hasErrors,
        environment: env,
        missingRequired,
        missingRecommended,
        allConfigured: !hasErrors && !hasWarnings
    };
}

/**
 * Valida uma variável específica
 * @param {string} varName - Nome da variável
 * @returns {boolean} True se configurada
 */
function checkVar(varName) {
    return !!process.env[varName];
}

/**
 * Obtém valor de variável com validação
 * @param {string} varName - Nome da variável
 * @param {*} defaultValue - Valor padrão
 * @param {boolean} required - Se é obrigatória
 * @returns {*} Valor da variável ou padrão
 */
function getVar(varName, defaultValue = null, required = false) {
    const value = process.env[varName];
    
    if (!value) {
        if (required) {
            logger.error(`❌ Variável obrigatória não configurada: ${varName}`);
            if (process.env.NODE_ENV === 'production') {
                process.exit(1);
            }
        }
        return defaultValue;
    }
    
    return value;
}

/**
 * Valida e converte para número
 * @param {string} varName - Nome da variável
 * @param {number} defaultValue - Valor padrão
 * @returns {number} Valor numérico
 */
function getNumericVar(varName, defaultValue) {
    const value = process.env[varName];
    if (!value) return defaultValue;
    
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
        logger.warn(`⚠️ Variável ${varName} não é um número válido, usando padrão: ${defaultValue}`);
        return defaultValue;
    }
    
    return parsed;
}

/**
 * Valida e converte para boolean
 * @param {string} varName - Nome da variável
 * @param {boolean} defaultValue - Valor padrão
 * @returns {boolean} Valor booleano
 */
function getBooleanVar(varName, defaultValue = false) {
    const value = process.env[varName];
    if (!value) return defaultValue;
    
    return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Mostra resumo da configuração atual
 */
function showConfigSummary() {
    const env = process.env.NODE_ENV || 'development';
    
    logger.info('\n📋 Resumo da Configuração:');
    logger.info(`   Ambiente: ${env}`);
    logger.info(`   Porta: ${process.env.PORT || '3000'}`);
    logger.info(`   MongoDB: ${process.env.MONGODB_URI ? 'Configurado' : 'Não configurado'}`);
    logger.info(`   JWT Secret: ${process.env.JWT_SECRET ? 'Configurado' : 'Não configurado'}`);
    logger.info(`   WhatsApp: ${process.env.WHATSAPP_TOKEN ? 'Configurado' : 'Não configurado'}`);
    logger.info(`   Email: ${process.env.EMAIL_HOST ? 'Configurado' : 'Não configurado'}`);
    logger.info(`   Redis: ${process.env.REDIS_URL || process.env.REDIS_HOST ? 'Configurado' : 'Não configurado'}`);
    logger.info(`   Sentry: ${process.env.SENTRY_DSN ? 'Configurado' : 'Não configurado'}`);
    logger.info(`   Google Calendar: ${process.env.GOOGLE_CLIENT_ID ? 'Configurado' : 'Não configurado'}`);
    logger.info(`   IA (Gemini): ${process.env.GEMINI_API_KEY ? 'Configurado' : 'Não configurado'}\n`);
}

module.exports = {
    validateEnv,
    checkVar,
    getVar,
    getNumericVar,
    getBooleanVar,
    showConfigSummary,
    requiredEnvVars,
    recommendedEnvVars
};

