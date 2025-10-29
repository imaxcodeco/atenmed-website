const logger = require('../utils/logger');

// Middleware de tratamento de erros
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log do erro
    logger.logError(err, req);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Recurso não encontrado';
        error = {
            message,
            statusCode: 404,
            code: 'RESOURCE_NOT_FOUND'
        };
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `${field} já existe`;
        error = {
            message,
            statusCode: 400,
            code: 'DUPLICATE_FIELD',
            field
        };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = {
            message,
            statusCode: 400,
            code: 'VALIDATION_ERROR',
            errors: Object.values(err.errors).map(val => ({
                field: val.path,
                message: val.message
            }))
        };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Token inválido';
        error = {
            message,
            statusCode: 401,
            code: 'INVALID_TOKEN'
        };
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expirado';
        error = {
            message,
            statusCode: 401,
            code: 'TOKEN_EXPIRED'
        };
    }

    // Rate limit error
    if (err.statusCode === 429) {
        error = {
            message: 'Muitas requisições. Tente novamente mais tarde',
            statusCode: 429,
            code: 'RATE_LIMIT_EXCEEDED'
        };
    }

    // File upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        error = {
            message: 'Arquivo muito grande',
            statusCode: 400,
            code: 'FILE_TOO_LARGE'
        };
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        error = {
            message: 'Tipo de arquivo não permitido',
            statusCode: 400,
            code: 'INVALID_FILE_TYPE'
        };
    }

    // Database connection error
    if (err.name === 'MongoNetworkError') {
        error = {
            message: 'Erro de conexão com o banco de dados',
            statusCode: 503,
            code: 'DATABASE_CONNECTION_ERROR'
        };
    }

    // Default error
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Erro interno do servidor';

    // Resposta de erro
    const errorResponse = {
        success: false,
        error: message,
        code: error.code || 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            details: error
        })
    };

    // Adicionar erros de validação se existirem
    if (error.errors) {
        errorResponse.errors = error.errors;
    }

    // Adicionar campo específico se for erro de duplicação
    if (error.field) {
        errorResponse.field = error.field;
    }

    res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;












