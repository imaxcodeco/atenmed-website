/**
 * Validações com Zod - Type-safe validation
 * 
 * Usar em conjunto ou substituir express-validator
 * Mais moderno e type-safe quando usado com TypeScript
 */

const { z } = require('zod');

// Schemas de validação reutilizáveis

/**
 * Validação de email
 */
const emailSchema = z.string().email('Email inválido');

/**
 * Validação de telefone brasileiro
 */
const phoneSchema = z.string().regex(
    /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
    'Telefone deve estar no formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX'
);

/**
 * Validação de MongoDB ObjectId
 */
const objectIdSchema = z.string().regex(
    /^[0-9a-fA-F]{24}$/,
    'ID inválido (deve ser ObjectId do MongoDB)'
);

/**
 * Validação de data (YYYY-MM-DD)
 */
const dateSchema = z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Data deve estar no formato YYYY-MM-DD'
);

/**
 * Validação de hora (HH:MM)
 */
const timeSchema = z.string().regex(
    /^\d{2}:\d{2}$/,
    'Horário deve estar no formato HH:MM'
);

/**
 * Schema de criação de Appointment
 */
const createAppointmentSchema = z.object({
    patient: z.object({
        name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(200),
        email: emailSchema.optional(),
        phone: phoneSchema,
        cpf: z.string().optional()
    }),
    doctorId: objectIdSchema,
    specialtyId: objectIdSchema,
    scheduledDate: dateSchema,
    scheduledTime: timeSchema,
    notes: z.string().max(1000).optional(),
    reason: z.string().max(500).optional(),
    source: z.enum(['site', 'whatsapp', 'telefone', 'presencial', 'admin']).optional()
});

/**
 * Schema de criação de Lead
 */
const createLeadSchema = z.object({
    nome: z.string().min(2).max(100),
    email: emailSchema,
    telefone: phoneSchema,
    especialidade: z.enum([
        'clinica-geral',
        'cardiologia',
        'dermatologia',
        'ginecologia',
        'pediatria',
        'odontologia',
        'outros'
    ]).optional(),
    origem: z.enum(['site', 'whatsapp', 'indicacao', 'google', 'facebook', 'formulario-contato', 'pagina-planos', 'outros']).optional(),
    interesse: z.enum(['baixo', 'medio', 'alto']).optional(),
    nomeClinica: z.string().max(200).optional(),
    numeroMedicos: z.number().int().min(1).max(100).optional(),
    cidade: z.string().optional(),
    planoInteresse: z.enum(['free', 'basic', 'pro', 'enterprise']).optional()
});

/**
 * Schema de criação de Contact
 */
const createContactSchema = z.object({
    nome: z.string().min(2).max(100),
    email: emailSchema,
    telefone: phoneSchema,
    empresa: z.string().max(200).optional(),
    cargo: z.string().max(100).optional(),
    assunto: z.string().min(3).max(200),
    mensagem: z.string().min(10).max(2000),
    categoria: z.enum(['duvida', 'suporte', 'vendas', 'parceria', 'outros']).optional(),
    prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']).optional()
});

/**
 * Schema de login
 */
const loginSchema = z.object({
    email: emailSchema,
    senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
});

/**
 * Schema de paginação
 */
const paginationSchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1)).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(100)).default('20')
});

/**
 * Middleware para validar com Zod
 * Usa em rotas do Express
 */
function validateZod(schema) {
    return (req, res, next) => {
        try {
            // Validar body (ou query/params conforme necessário)
            const validated = schema.parse(req.body);
            
            // Substituir req.body com dados validados e tipados
            req.body = validated;
            
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: 'Dados inválidos',
                    errors: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            
            next(error);
        }
    };
}

/**
 * Validar query parameters
 */
function validateQuery(schema) {
    return (req, res, next) => {
        try {
            const validated = schema.parse(req.query);
            req.query = validated;
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: 'Parâmetros de query inválidos',
                    errors: error.errors
                });
            }
            next(error);
        }
    };
}

/**
 * Validar route parameters
 */
function validateParams(schema) {
    return (req, res, next) => {
        try {
            const validated = schema.parse(req.params);
            req.params = validated;
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: 'Parâmetros de rota inválidos',
                    errors: error.errors
                });
            }
            next(error);
        }
    };
}

module.exports = {
    // Schemas
    emailSchema,
    phoneSchema,
    objectIdSchema,
    dateSchema,
    timeSchema,
    createAppointmentSchema,
    createLeadSchema,
    createContactSchema,
    loginSchema,
    paginationSchema,
    
    // Middlewares
    validateZod,
    validateQuery,
    validateParams
};

