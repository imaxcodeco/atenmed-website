const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
    // Identificação
    name: {
        type: String,
        required: [true, 'Nome do agente é obrigatório'],
        trim: true,
        maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Descrição não pode ter mais de 500 caracteres']
    },
    clinic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
        required: [true, 'Clínica é obrigatória'],
        index: true
    },
    
    // Template/Base
    template: {
        type: String,
        enum: ['suporte', 'vendas', 'agendamento', 'qualificacao', 'personalizado'],
        default: 'personalizado'
    },
    
    // Personalidade e Comportamento
    personality: {
        name: {
            type: String,
            default: 'Assistente',
            maxlength: [50, 'Nome não pode ter mais de 50 caracteres']
        },
        tone: {
            type: String,
            enum: ['formal', 'casual', 'amigavel', 'profissional', 'empatico'],
            default: 'amigavel'
        },
        language: {
            type: String,
            default: 'pt-BR'
        },
        useEmojis: {
            type: Boolean,
            default: true
        },
        responseLength: {
            type: String,
            enum: ['curta', 'media', 'longa'],
            default: 'media'
        }
    },
    
    // Sistema de IA
    aiConfig: {
        provider: {
            type: String,
            enum: ['gemini', 'openai', 'custom'],
            default: 'gemini'
        },
        model: {
            type: String,
            default: 'gemini-1.5-pro'
        },
        temperature: {
            type: Number,
            default: 0.7,
            min: 0,
            max: 1
        },
        maxTokens: {
            type: Number,
            default: 500
        },
        systemPrompt: {
            type: String,
            default: ''
        }
    },
    
    // Knowledge Base
    knowledgeBase: {
        enabled: {
            type: Boolean,
            default: true
        },
        documents: [{
            title: String,
            content: String,
            type: {
                type: String,
                enum: ['faq', 'documento', 'politica', 'procedimento', 'outro']
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
        urls: [{
            url: String,
            description: String,
            lastCrawled: Date
        }]
    },
    
    // Fluxos Conversacionais
    flows: [{
        name: String,
        trigger: {
            type: String,
            enum: ['intent', 'keyword', 'regex', 'always']
        },
        triggerValue: String,
        steps: [{
            type: {
                type: String,
                enum: ['message', 'question', 'action', 'condition', 'api_call']
            },
            content: String,
            options: mongoose.Schema.Types.Mixed,
            nextStep: Number
        }],
        isDefault: {
            type: Boolean,
            default: false
        }
    }],
    
    // Canais de Integração
    channels: {
        whatsapp: {
            enabled: {
                type: Boolean,
                default: false
            },
            phoneNumber: String,
            webhookUrl: String
        },
        instagram: {
            enabled: {
                type: Boolean,
                default: false
            },
            pageId: String,
            accessToken: String
        },
        website: {
            enabled: {
                type: Boolean,
                default: false
            },
            widgetConfig: {
                position: {
                    type: String,
                    enum: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
                    default: 'bottom-right'
                },
                primaryColor: {
                    type: String,
                    default: '#45a7b1'
                },
                welcomeMessage: String
            },
            embedCode: String
        },
        email: {
            enabled: {
                type: Boolean,
                default: false
            },
            autoRespond: {
                type: Boolean,
                default: false
            }
        }
    },
    
    // Qualificação de Leads
    leadQualification: {
        enabled: {
            type: Boolean,
            default: true
        },
        questions: [{
            question: String,
            field: {
                type: String,
                enum: ['name', 'email', 'phone', 'company', 'budget', 'custom']
            },
            required: {
                type: Boolean,
                default: false
            },
            validation: String
        }],
        scoring: {
            enabled: {
                type: Boolean,
                default: false
            },
            criteria: mongoose.Schema.Types.Mixed
        }
    },
    
    // Integrações
    integrations: {
        googleCalendar: {
            enabled: {
                type: Boolean,
                default: false
            },
            calendarId: String
        },
        crm: {
            enabled: {
                type: Boolean,
                default: false
            },
            provider: String,
            apiKey: String
        },
        webhooks: [{
            name: String,
            url: String,
            events: [String],
            secret: String
        }]
    },
    
    // Configurações Avançadas
    settings: {
        workingHours: {
            enabled: {
                type: Boolean,
                default: false
            },
            timezone: {
                type: String,
                default: 'America/Sao_Paulo'
            },
            schedule: {
                monday: { start: String, end: String, closed: Boolean },
                tuesday: { start: String, end: String, closed: Boolean },
                wednesday: { start: String, end: String, closed: Boolean },
                thursday: { start: String, end: String, closed: Boolean },
                friday: { start: String, end: String, closed: Boolean },
                saturday: { start: String, end: String, closed: Boolean },
                sunday: { start: String, end: String, closed: Boolean }
            },
            awayMessage: String
        },
        handoff: {
            enabled: {
                type: Boolean,
                default: true
            },
            triggerKeywords: [String],
            message: String
        },
        analytics: {
            trackConversations: {
                type: Boolean,
                default: true
            },
            trackSentiment: {
                type: Boolean,
                default: false
            }
        }
    },
    
    // Status e Controle
    status: {
        type: String,
        enum: ['draft', 'active', 'paused', 'archived'],
        default: 'draft'
    },
    active: {
        type: Boolean,
        default: false
    },
    
    // Estatísticas
    stats: {
        totalConversations: {
            type: Number,
            default: 0
        },
        totalMessages: {
            type: Number,
            default: 0
        },
        averageResponseTime: {
            type: Number,
            default: 0
        },
        satisfactionRate: {
            type: Number,
            default: 0
        },
        leadsGenerated: {
            type: Number,
            default: 0
        },
        lastActivity: Date
    },
    
    // Metadata
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Índices
agentSchema.index({ clinic: 1, status: 1 });
agentSchema.index({ clinic: 1, active: 1 });
agentSchema.index({ 'channels.whatsapp.phoneNumber': 1 });
agentSchema.index({ createdAt: -1 });

// Virtual para URL do widget
agentSchema.virtual('widgetUrl').get(function() {
    return `/ai-agent/${this._id}`;
});

// Métodos
agentSchema.methods.activate = function() {
    this.status = 'active';
    this.active = true;
    return this.save();
};

agentSchema.methods.pause = function() {
    this.status = 'paused';
    this.active = false;
    return this.save();
};

agentSchema.methods.incrementStats = function(field, value = 1) {
    if (!this.stats) this.stats = {};
    if (!this.stats[field]) this.stats[field] = 0;
    this.stats[field] += value;
    this.stats.lastActivity = new Date();
    return this.save();
};

// Método estático para buscar agentes ativos de uma clínica
agentSchema.statics.findActiveByClinic = function(clinicId) {
    return this.find({
        clinic: clinicId,
        active: true,
        status: 'active'
    });
};

module.exports = mongoose.model('Agent', agentSchema);

