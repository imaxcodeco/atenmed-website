/**
 * Utilities: Tenant Query Helpers
 * 
 * Funções auxiliares para garantir isolamento de dados multi-tenant
 * em todas as queries do sistema.
 */

const logger = require('./logger');

/**
 * Adiciona filtro de tenant automaticamente
 * @param {Object} filter - Filtro da query
 * @param {Object} req - Request object com clinicId
 * @param {string} clinicField - Nome do campo que armazena clinic (padrão: 'clinic')
 * @returns {Object} Filtro com tenant aplicado
 */
function addTenantFilter(filter = {}, req, clinicField = 'clinic') {
    // Se não é admin global e tem clinicId, adicionar filtro
    if (!req.isGlobalAdmin && req.clinicId) {
        filter[clinicField] = req.clinicId;
    }
    
    return filter;
}

/**
 * Executa find com isolamento de tenant automático
 * @param {Mongoose Model} Model - Modelo Mongoose
 * @param {Object} filter - Filtro da query
 * @param {Object} req - Request object
 * @param {Object} options - Opções adicionais (projection, sort, etc)
 * @param {string} clinicField - Nome do campo clinic
 * @returns {Promise<Array>} Resultados filtrados
 */
async function findWithTenant(Model, filter = {}, req, options = {}, clinicField = 'clinic') {
    try {
        // Adicionar filtro de tenant
        filter = addTenantFilter(filter, req, clinicField);
        
        // Construir query
        let query = Model.find(filter);
        
        // Aplicar opções (projection, sort, limit, etc)
        if (options.select) {
            query = query.select(options.select);
        }
        if (options.sort) {
            query = query.sort(options.sort);
        }
        if (options.limit) {
            query = query.limit(options.limit);
        }
        if (options.skip) {
            query = query.skip(options.skip);
        }
        if (options.populate) {
            query = query.populate(options.populate);
        }
        
        const results = await query.exec();
        return results;
    } catch (error) {
        logger.error('Erro em findWithTenant:', error);
        throw error;
    }
}

/**
 * Executa findOne com isolamento de tenant
 * @param {Mongoose Model} Model - Modelo Mongoose
 * @param {Object} filter - Filtro da query
 * @param {Object} req - Request object
 * @param {Object} options - Opções adicionais
 * @param {string} clinicField - Nome do campo clinic
 * @returns {Promise<Object|null>} Resultado ou null
 */
async function findOneWithTenant(Model, filter = {}, req, options = {}, clinicField = 'clinic') {
    try {
        filter = addTenantFilter(filter, req, clinicField);
        
        let query = Model.findOne(filter);
        
        if (options.select) {
            query = query.select(options.select);
        }
        if (options.populate) {
            query = query.populate(options.populate);
        }
        
        return await query.exec();
    } catch (error) {
        logger.error('Erro em findOneWithTenant:', error);
        throw error;
    }
}

/**
 * Executa findById com verificação de tenant
 * @param {Mongoose Model} Model - Modelo Mongoose
 * @param {string} id - ID do documento
 * @param {Object} req - Request object
 * @param {Object} options - Opções adicionais
 * @param {string} clinicField - Nome do campo clinic
 * @returns {Promise<Object|null>} Resultado ou null
 */
async function findByIdWithTenant(Model, id, req, options = {}, clinicField = 'clinic') {
    try {
        const filter = { _id: id };
        return await findOneWithTenant(Model, filter, req, options, clinicField);
    } catch (error) {
        logger.error('Erro em findByIdWithTenant:', error);
        throw error;
    }
}

/**
 * Executa count com isolamento de tenant
 * @param {Mongoose Model} Model - Modelo Mongoose
 * @param {Object} filter - Filtro da query
 * @param {Object} req - Request object
 * @param {string} clinicField - Nome do campo clinic
 * @returns {Promise<number>} Contagem
 */
async function countWithTenant(Model, filter = {}, req, clinicField = 'clinic') {
    try {
        filter = addTenantFilter(filter, req, clinicField);
        return await Model.countDocuments(filter);
    } catch (error) {
        logger.error('Erro em countWithTenant:', error);
        throw error;
    }
}

/**
 * Verifica se um documento pertence ao tenant do usuário
 * @param {Mongoose Model} Model - Modelo Mongoose
 * @param {string} id - ID do documento
 * @param {Object} req - Request object
 * @param {string} clinicField - Nome do campo clinic
 * @returns {Promise<boolean>} True se pertence ao tenant
 */
async function belongsToTenant(Model, id, req, clinicField = 'clinic') {
    try {
        // Admin global pode acessar tudo
        if (req.isGlobalAdmin) {
            return true;
        }
        
        if (!req.clinicId) {
            return false;
        }
        
        const doc = await Model.findById(id).select(clinicField);
        if (!doc) {
            return false;
        }
        
        const docClinicId = doc[clinicField]?.toString();
        const userClinicId = req.clinicId.toString();
        
        return docClinicId === userClinicId;
    } catch (error) {
        logger.error('Erro em belongsToTenant:', error);
        return false;
    }
}

/**
 * Cria documento com clinicId automático
 * @param {Mongoose Model} Model - Modelo Mongoose
 * @param {Object} data - Dados do documento
 * @param {Object} req - Request object
 * @param {string} clinicField - Nome do campo clinic
 * @returns {Promise<Object>} Documento criado
 */
async function createWithTenant(Model, data, req, clinicField = 'clinic') {
    try {
        // Se não tem clinic e usuário tem, adicionar automaticamente
        if (!data[clinicField] && req.clinicId && !req.isGlobalAdmin) {
            data[clinicField] = req.clinicId;
        }
        
        const doc = new Model(data);
        return await doc.save();
    } catch (error) {
        logger.error('Erro em createWithTenant:', error);
        throw error;
    }
}

/**
 * Atualiza documento com verificação de tenant
 * @param {Mongoose Model} Model - Modelo Mongoose
 * @param {string} id - ID do documento
 * @param {Object} update - Dados para atualizar
 * @param {Object} req - Request object
 * @param {string} clinicField - Nome do campo clinic
 * @returns {Promise<Object|null>} Documento atualizado ou null
 */
async function updateWithTenant(Model, id, update, req, clinicField = 'clinic') {
    try {
        // Verificar se pertence ao tenant
        const belongs = await belongsToTenant(Model, id, req, clinicField);
        if (!belongs) {
            return null;
        }
        
        // Não permitir alterar clinic via update
        delete update[clinicField];
        
        return await Model.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    } catch (error) {
        logger.error('Erro em updateWithTenant:', error);
        throw error;
    }
}

/**
 * Remove documento com verificação de tenant
 * @param {Mongoose Model} Model - Modelo Mongoose
 * @param {string} id - ID do documento
 * @param {Object} req - Request object
 * @param {string} clinicField - Nome do campo clinic
 * @returns {Promise<Object|null>} Documento removido ou null
 */
async function deleteWithTenant(Model, id, req, clinicField = 'clinic') {
    try {
        // Verificar se pertence ao tenant
        const belongs = await belongsToTenant(Model, id, req, clinicField);
        if (!belongs) {
            return null;
        }
        
        return await Model.findByIdAndDelete(id);
    } catch (error) {
        logger.error('Erro em deleteWithTenant:', error);
        throw error;
    }
}

module.exports = {
    addTenantFilter,
    findWithTenant,
    findOneWithTenant,
    findByIdWithTenant,
    countWithTenant,
    belongsToTenant,
    createWithTenant,
    updateWithTenant,
    deleteWithTenant
};

