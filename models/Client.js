const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    // Dados do cliente
    name: {
        type: String,
        required: [true, 'Nome do cliente é obrigatório'],
        trim: true,
        maxlength: [200, 'Nome não pode ter mais de 200 caracteres']
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
    },
    whatsapp: {
        type: String,
        required: [true, 'Número do WhatsApp é obrigatório'],
        trim: true,
        unique: true,
        match: [/^\+?[1-9]\d{1,14}$/, 'Número de WhatsApp inválido (formato: +5511999999999)']
    },
    
    // Tipo de negócio
    businessType: {
        type: String,
        enum: ['clinica', 'consultorio', 'hospital', 'laboratorio', 'farmacia', 'outros'],
        default: 'consultorio'
    },
    
    // Aplicações contratadas
    applications: {
        automacaoAtendimento: {
            type: Boolean,
            default: false
        },
        agendamentoInteligente: {
            type: Boolean,
            default: false
        }
    },
    
    // Configurações das aplicações
    config: {
        // Configuração de atendimento automático
        automacao: {
            mensagemBoasVindas: {
                type: String,
                default: 'Olá! 👋 Bem-vindo(a) à nossa clínica. Como posso ajudá-lo(a)?'
            },
            horarioAtendimento: {
                inicio: { type: Number, default: 8, min: 0, max: 23 },
                fim: { type: Number, default: 18, min: 0, max: 23 }
            },
            diasAtendimento: {
                type: [Number], // 0=Domingo, 6=Sábado
                default: [1, 2, 3, 4, 5] // Segunda a Sexta
            },
            mensagemForaHorario: {
                type: String,
                default: 'No momento estamos fora do horário de atendimento. Nosso horário é de segunda a sexta, das 8h às 18h. Deixe sua mensagem que retornaremos em breve!'
            }
        },
        
        // Configuração de agendamento
        agendamento: {
            googleCalendarId: String,
            duracaoPadraoConsulta: {
                type: Number,
                default: 60, // minutos
                min: 15,
                max: 180
            },
            intervaloBetweenSlots: {
                type: Number,
                default: 15, // minutos
                min: 5,
                max: 60
            }
        }
    },
    
    // Status da conta
    status: {
        type: String,
        enum: ['ativo', 'inativo', 'suspenso', 'teste'],
        default: 'ativo'
    },
    
    // Plano
    plan: {
        type: String,
        enum: ['basico', 'profissional', 'empresarial', 'personalizado'],
        default: 'basico'
    },
    
    // Integração WhatsApp
    whatsappIntegration: {
        connected: {
            type: Boolean,
            default: false
        },
        connectedAt: Date,
        lastMessageAt: Date,
        messageCount: {
            type: Number,
            default: 0
        }
    },
    
    // Estatísticas
    stats: {
        totalAtendimentos: {
            type: Number,
            default: 0
        },
        totalAgendamentos: {
            type: Number,
            default: 0
        },
        satisfacaoMedia: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        }
    },
    
    // Observações
    notes: {
        type: String,
        maxlength: [1000, 'Observações não podem ter mais de 1000 caracteres']
    },
    
    // Responsável pela conta
    accountManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Índices para performance
clientSchema.index({ whatsapp: 1 }, { unique: true });
clientSchema.index({ status: 1 });
clientSchema.index({ 'applications.automacaoAtendimento': 1 });
clientSchema.index({ 'applications.agendamentoInteligente': 1 });
clientSchema.index({ createdAt: -1 });

// Virtual para verificar se tem alguma aplicação ativa
clientSchema.virtual('hasActiveApplications').get(function() {
    return this.applications.automacaoAtendimento || this.applications.agendamentoInteligente;
});

// Método para ativar aplicação
clientSchema.methods.activateApplication = function(appType) {
    if (appType === 'automacao' || appType === 'both') {
        this.applications.automacaoAtendimento = true;
    }
    if (appType === 'agendamento' || appType === 'both') {
        this.applications.agendamentoInteligente = true;
    }
    return this.save();
};

// Método para desativar aplicação
clientSchema.methods.deactivateApplication = function(appType) {
    if (appType === 'automacao' || appType === 'both') {
        this.applications.automacaoAtendimento = false;
    }
    if (appType === 'agendamento' || appType === 'both') {
        this.applications.agendamentoInteligente = false;
    }
    return this.save();
};

// Método para atualizar estatísticas
clientSchema.methods.updateStats = function(type) {
    if (type === 'atendimento') {
        this.stats.totalAtendimentos += 1;
    } else if (type === 'agendamento') {
        this.stats.totalAgendamentos += 1;
    }
    this.whatsappIntegration.lastMessageAt = new Date();
    this.whatsappIntegration.messageCount += 1;
    return this.save();
};

// Método estático para buscar clientes ativos
clientSchema.statics.findActive = function() {
    return this.find({ status: 'ativo' });
};

// Método estático para buscar por aplicação
clientSchema.statics.findByApplication = function(appType) {
    const filter = { status: 'ativo' };
    if (appType === 'automacao') {
        filter['applications.automacaoAtendimento'] = true;
    } else if (appType === 'agendamento') {
        filter['applications.agendamentoInteligente'] = true;
    }
    return this.find(filter);
};

module.exports = mongoose.model('Client', clientSchema);

