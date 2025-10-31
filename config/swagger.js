/**
 * Configuração do Swagger/OpenAPI
 * Documentação automática da API
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'AtenMed API',
            version: '1.0.0',
            description: 'API REST para o sistema AtenMed - Organização Inteligente para Consultórios',
            contact: {
                name: 'AtenMed Support',
                email: 'contato@atenmed.com.br',
                url: 'https://atenmed.com.br'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'https://atenmed.com.br/api',
                description: 'Servidor de Produção (atenmed.com.br)'
            },
            ...(process.env.NODE_ENV === 'development' ? [{
                url: 'http://localhost:3000/api',
                description: 'Servidor de Desenvolvimento'
            }] : [])
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Token JWT para autenticação'
                }
            },
            schemas: {
                Client: {
                    type: 'object',
                    required: ['name', 'email', 'clinic'],
                    properties: {
                        name: { type: 'string', example: 'Dr. Carlos Mendes' },
                        email: { type: 'string', format: 'email', example: 'carlos@clinica.com.br' },
                        phone: { type: 'string', example: '(11) 98765-4321' },
                        clinic: { type: 'string', example: 'Clínica Coração Saudável' },
                        specialty: { type: 'string', example: 'Cardiologia' },
                        applications: { 
                            type: 'array', 
                            items: { type: 'string' },
                            example: ['whatsapp', 'calendar', 'website']
                        },
                        subscription: { 
                            type: 'string', 
                            enum: ['basic', 'pro', 'premium'],
                            example: 'premium'
                        },
                        status: { 
                            type: 'string', 
                            enum: ['active', 'inactive', 'suspended'],
                            example: 'active'
                        }
                    }
                },
                Lead: {
                    type: 'object',
                    required: ['name', 'email'],
                    properties: {
                        name: { type: 'string', example: 'Dra. Ana Silva' },
                        email: { type: 'string', format: 'email', example: 'ana@email.com' },
                        phone: { type: 'string', example: '(11) 97654-3210' },
                        clinic: { type: 'string', example: 'Clínica ABC' },
                        specialty: { type: 'string', example: 'Dermatologia' },
                        interest: { type: 'string', example: 'whatsapp,calendar' },
                        source: { 
                            type: 'string', 
                            enum: ['google', 'facebook', 'instagram', 'direct', 'other'],
                            example: 'google'
                        },
                        status: { 
                            type: 'string', 
                            enum: ['new', 'contacted', 'qualified', 'converted', 'lost'],
                            example: 'new'
                        }
                    }
                },
                Contact: {
                    type: 'object',
                    required: ['name', 'email', 'message'],
                    properties: {
                        name: { type: 'string', example: 'João Silva' },
                        email: { type: 'string', format: 'email', example: 'joao@email.com' },
                        phone: { type: 'string', example: '(11) 91234-5678' },
                        message: { type: 'string', example: 'Gostaria de saber mais sobre os planos.' },
                        status: { 
                            type: 'string', 
                            enum: ['pending', 'answered', 'closed'],
                            example: 'pending'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string', example: 'Erro ao processar requisição' },
                        error: { type: 'string', example: 'Detalhes do erro' }
                    }
                }
            }
        },
        tags: [
            { name: 'Auth', description: 'Autenticação e autorização' },
            { name: 'Clients', description: 'Gerenciamento de clientes' },
            { name: 'Leads', description: 'Gerenciamento de leads' },
            { name: 'Contacts', description: 'Mensagens de contato' },
            { name: 'WhatsApp', description: 'Integração WhatsApp Business' },
            { name: 'Appointments', description: 'Agendamentos' },
            { name: 'Health', description: 'Status e saúde da API' }
        ]
    },
    apis: ['./routes/*.js', './server.js'] // Paths para os arquivos com anotações
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

