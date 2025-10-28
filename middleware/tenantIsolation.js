/**
 * Middleware: Tenant Isolation
 * 
 * Garante que usuários só acessem dados da própria clínica
 */

const logger = require('../utils/logger');

/**
 * Adiciona clinicId do usuário à request
 * Deve ser usado após authenticateToken
 */
function addClinicContext(req, res, next) {
    try {
        // Se usuário está autenticado e tem clínica vinculada
        if (req.user && req.user.clinic) {
            req.clinicId = req.user.clinic;
            req.clinicRole = req.user.clinicRole || 'viewer';
        }
        
        // Se é admin global, não precisa de isolamento (pode ver tudo)
        if (req.user && req.user.role === 'admin' && !req.user.clinic) {
            req.isGlobalAdmin = true;
        }
        
        next();
    } catch (error) {
        logger.error('Erro no tenant isolation:', error);
        next(); // Fail-safe: permitir prosseguir
    }
}

/**
 * Requer que o usuário tenha uma clínica vinculada
 * Bloqueia acesso se não tiver
 */
function requireClinic(req, res, next) {
    if (!req.clinicId && !req.isGlobalAdmin) {
        return res.status(403).json({
            success: false,
            error: 'Acesso negado',
            message: 'Você precisa estar vinculado a uma clínica para acessar este recurso',
            code: 'NO_CLINIC'
        });
    }
    next();
}

/**
 * Verifica se usuário tem permissão na clínica
 */
function requireClinicRole(...allowedRoles) {
    return (req, res, next) => {
        // Admin global pode tudo
        if (req.isGlobalAdmin) {
            return next();
        }
        
        // Verificar se tem role permitida
        if (!req.clinicRole || !allowedRoles.includes(req.clinicRole)) {
            return res.status(403).json({
                success: false,
                error: 'Permissão insuficiente',
                message: `Esta ação requer uma das seguintes roles: ${allowedRoles.join(', ')}`,
                code: 'INSUFFICIENT_CLINIC_ROLE'
            });
        }
        
        next();
    };
}

/**
 * Adiciona filtro de clínica automaticamente em queries
 * Use antes de buscar dados
 */
function filterByClinic(req, res, next) {
    if (req.clinicId && !req.isGlobalAdmin) {
        // Se há filtros na query, adicionar clinic
        if (req.query && typeof req.query === 'object') {
            req.query.clinic = req.clinicId;
        }
        
        // Se há filtros no body, adicionar clinic
        if (req.body && typeof req.body === 'object' && req.method !== 'POST') {
            req.body.clinic = req.clinicId;
        }
    }
    next();
}

/**
 * Helper para verificar se recurso pertence à clínica do usuário
 */
async function checkResourceOwnership(resourceModel, resourceId, clinicField = 'clinic') {
    return async (req, res, next) => {
        try {
            // Admin global pode acessar tudo
            if (req.isGlobalAdmin) {
                return next();
            }
            
            if (!req.clinicId) {
                return res.status(403).json({
                    success: false,
                    error: 'Acesso negado',
                    code: 'NO_CLINIC'
                });
            }
            
            // Buscar recurso
            const resource = await resourceModel.findById(resourceId);
            
            if (!resource) {
                return res.status(404).json({
                    success: false,
                    error: 'Recurso não encontrado'
                });
            }
            
            // Verificar se pertence à clínica
            const resourceClinicId = resource[clinicField]?.toString();
            const userClinicId = req.clinicId.toString();
            
            if (resourceClinicId !== userClinicId) {
                return res.status(403).json({
                    success: false,
                    error: 'Acesso negado',
                    message: 'Este recurso pertence a outra clínica',
                    code: 'WRONG_CLINIC'
                });
            }
            
            // Adicionar recurso à request para uso posterior
            req.resource = resource;
            next();
            
        } catch (error) {
            logger.error('Erro ao verificar ownership:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao verificar permissões'
            });
        }
    };
}

module.exports = {
    addClinicContext,
    requireClinic,
    requireClinicRole,
    filterByClinic,
    checkResourceOwnership
};

