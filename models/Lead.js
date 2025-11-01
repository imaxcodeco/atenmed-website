const mongoose = require('mongoose');
const { EMAIL_REGEX, EMAIL_ERROR_MESSAGE } = require('../utils/validators');

const leadSchema = new mongoose.Schema({
    // Informações pessoais
    nome: {
        type: String,
        required: [true, 'Nome é obrigatório'],
        trim: true,
        maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
    },
    email: {
        type: String,
        required: [true, 'Email é obrigatório'],
        lowercase: true,
        trim: true,
        match: [EMAIL_REGEX, EMAIL_ERROR_MESSAGE]
    },
    telefone: {
        type: String,
        required: [true, 'Telefone é obrigatório'],
        trim: true
    },
    especialidade: {
        type: String,
        enum: [
            'clinica-geral',
            'cardiologia',
            'dermatologia',
            'ginecologia',
            'pediatria',
            'odontologia',
            'outros'
        ]
    },
    empresa: {
        type: String,
        trim: true,
        maxlength: [200, 'Nome da empresa não pode ter mais de 200 caracteres']
    },
    cargo: {
        type: String,
        trim: true,
        maxlength: [100, 'Cargo não pode ter mais de 100 caracteres']
    },
    
    // Informações do lead
    status: {
        type: String,
        enum: ['novo', 'contato_feito', 'negociacao', 'proposta_enviada', 'fechado', 'perdido'],
        default: 'novo'
    },
    origem: {
        type: String,
        enum: ['site', 'whatsapp', 'indicacao', 'google', 'facebook', 'formulario-contato', 'pagina-planos', 'outros'],
        default: 'site'
    },
    interesse: {
        type: String,
        enum: ['baixo', 'medio', 'alto'],
        default: 'medio'
    },
    
    // Informações SaaS
    nomeClinica: {
        type: String,
        trim: true,
        maxlength: [200, 'Nome da clínica não pode ter mais de 200 caracteres']
    },
    numeroMedicos: {
        type: Number,
        min: 1,
        max: 100
    },
    cidade: {
        type: String,
        trim: true
    },
    planoInteresse: {
        type: String,
        enum: ['free', 'basic', 'pro', 'enterprise'],
        default: 'basic'
    },
    valorMensal: {
        type: Number,
        min: 0
    },
    dataFechamento: {
        type: Date
    },
    motivoPerda: {
        type: String,
        maxlength: [500, 'Motivo não pode ter mais de 500 caracteres']
    },
    vendedorResponsavel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    // Referência ao contato original (se veio do formulário)
    contatoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact'
    },
    
    // Dados de acompanhamento
    observacoes: {
        type: String,
        maxlength: [1000, 'Observações não podem ter mais de 1000 caracteres']
    },
    proximoContato: {
        type: Date
    },
    ultimoContato: {
        type: Date,
        default: Date.now
    },
    
    // Dados técnicos
    ip: {
        type: String
    },
    userAgent: {
        type: String
    },
    utmSource: {
        type: String
    },
    utmMedium: {
        type: String
    },
    utmCampaign: {
        type: String
    },
    
    // Histórico de interações
    historico: [{
        tipo: {
            type: String,
            enum: ['contato', 'email', 'whatsapp', 'proposta', 'reuniao', 'outros']
        },
        descricao: String,
        data: {
            type: Date,
            default: Date.now
        },
        usuario: String
    }],
    
    // Dados de conversão
    convertido: {
        type: Boolean,
        default: false
    },
    dataConversao: {
        type: Date
    },
    valorProposta: {
        type: Number
    },
    planoEscolhido: {
        type: String,
        enum: ['free', 'basic', 'pro', 'enterprise']
    },
    
    // Clínica criada (após fechamento)
    clinicaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic'
    },
    
    // Multi-tenancy: Clínica do lead (opcional - pode ser público ou de uma clínica específica)
    clinic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
        index: true,
        sparse: true  // Permite null (leads públicos do site)
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Índices para performance
leadSchema.index({ email: 1 });
leadSchema.index({ telefone: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ especialidade: 1 });

// Índices compostos para multi-tenancy e performance
leadSchema.index({ clinic: 1, status: 1 });
leadSchema.index({ clinic: 1, createdAt: -1 });
leadSchema.index({ clinic: 1, especialidade: 1 });
leadSchema.index({ clinic: 1, origem: 1 });

// Virtual para tempo desde criação
leadSchema.virtual('tempoDesdeCriacao').get(function() {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)); // dias
});

// Middleware pre-save
leadSchema.pre('save', function(next) {
    // Se o status mudou para 'fechado' ou 'perdido', atualizar data de conversão
    if (this.isModified('status') && (this.status === 'fechado' || this.status === 'perdido')) {
        this.dataConversao = new Date();
        this.convertido = this.status === 'fechado';
    }
    
    next();
});

// Método para adicionar ao histórico
leadSchema.methods.adicionarHistorico = function(tipo, descricao, usuario = 'sistema') {
    this.historico.push({
        tipo,
        descricao,
        usuario
    });
    this.ultimoContato = new Date();
    return this.save();
};

// Método para atualizar status
leadSchema.methods.atualizarStatus = function(novoStatus, observacoes = '') {
    this.status = novoStatus;
    if (observacoes) {
        this.observacoes = observacoes;
    }
    this.ultimoContato = new Date();
    return this.save();
};

// Método estático para buscar leads por período
leadSchema.statics.buscarPorPeriodo = function(dataInicio, dataFim) {
    return this.find({
        createdAt: {
            $gte: dataInicio,
            $lte: dataFim
        }
    }).sort({ createdAt: -1 });
};

// Método estático para estatísticas
leadSchema.statics.obterEstatisticas = function() {
    return this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);
};

module.exports = mongoose.model('Lead', leadSchema);







