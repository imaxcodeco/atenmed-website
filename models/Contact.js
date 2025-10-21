const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    // Informações de contato
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
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
    },
    telefone: {
        type: String,
        required: [true, 'Telefone é obrigatório'],
        trim: true
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
    
    // Assunto e mensagem
    assunto: {
        type: String,
        required: [true, 'Assunto é obrigatório'],
        trim: true,
        maxlength: [200, 'Assunto não pode ter mais de 200 caracteres']
    },
    mensagem: {
        type: String,
        required: [true, 'Mensagem é obrigatória'],
        trim: true,
        maxlength: [2000, 'Mensagem não pode ter mais de 2000 caracteres']
    },
    
    // Categoria e prioridade
    categoria: {
        type: String,
        enum: ['duvida', 'suporte', 'vendas', 'parceria', 'outros'],
        default: 'duvida'
    },
    prioridade: {
        type: String,
        enum: ['baixa', 'media', 'alta', 'urgente'],
        default: 'media'
    },
    
    // Status do contato
    status: {
        type: String,
        enum: ['novo', 'em-andamento', 'respondido', 'fechado'],
        default: 'novo'
    },
    
    // Resposta
    resposta: {
        tipo: {
            type: String,
            enum: ['email', 'telefone', 'whatsapp', 'presencial']
        },
        conteudo: String,
        dataResposta: Date,
        responsavel: String
    },
    
    // Dados técnicos
    ip: {
        type: String
    },
    userAgent: {
        type: String
    },
    origem: {
        type: String,
        enum: ['site', 'whatsapp', 'email', 'telefone', 'outros'],
        default: 'site'
    },
    
    // UTM parameters
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    utmTerm: String,
    utmContent: String,
    
    // Anexos
    anexos: [{
        nome: String,
        caminho: String,
        tamanho: Number,
        tipo: String
    }],
    
    // Histórico de interações
    historico: [{
        tipo: {
            type: String,
            enum: ['contato', 'resposta', 'follow-up', 'escalacao', 'resolucao']
        },
        descricao: String,
        data: {
            type: Date,
            default: Date.now
        },
        usuario: String,
        anexos: [String]
    }],
    
    // Tags para organização
    tags: [String],
    
    // Data de follow-up
    proximoFollowUp: {
        type: Date
    },
    
    // Satisfação
    satisfacao: {
        nota: {
            type: Number,
            min: 1,
            max: 5
        },
        comentario: String,
        data: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Índices para performance
contactSchema.index({ email: 1 });
contactSchema.index({ status: 1 });
contactSchema.index({ categoria: 1 });
contactSchema.index({ prioridade: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ proximoFollowUp: 1 });

// Virtual para tempo de resposta
contactSchema.virtual('tempoResposta').get(function() {
    if (this.resposta && this.resposta.dataResposta) {
        return Math.floor((this.resposta.dataResposta - this.createdAt) / (1000 * 60 * 60)); // horas
    }
    return null;
});

// Virtual para verificar se está atrasado
contactSchema.virtual('estaAtrasado').get(function() {
    if (this.proximoFollowUp) {
        return this.proximoFollowUp < new Date() && this.status !== 'fechado';
    }
    return false;
});

// Middleware pre-save
contactSchema.pre('save', function(next) {
    // Se a prioridade for 'urgente', definir follow-up para 1 hora
    if (this.prioridade === 'urgente' && !this.proximoFollowUp) {
        this.proximoFollowUp = new Date(Date.now() + 60 * 60 * 1000);
    }
    
    // Se a prioridade for 'alta', definir follow-up para 4 horas
    if (this.prioridade === 'alta' && !this.proximoFollowUp) {
        this.proximoFollowUp = new Date(Date.now() + 4 * 60 * 60 * 1000);
    }
    
    next();
});

// Método para adicionar ao histórico
contactSchema.methods.adicionarHistorico = function(tipo, descricao, usuario = 'sistema', anexos = []) {
    this.historico.push({
        tipo,
        descricao,
        usuario,
        anexos
    });
    return this.save();
};

// Método para responder
contactSchema.methods.responder = function(tipo, conteudo, responsavel) {
    this.resposta = {
        tipo,
        conteudo,
        dataResposta: new Date(),
        responsavel
    };
    this.status = 'respondido';
    return this.save();
};

// Método para escalar
contactSchema.methods.escalar = function(novaPrioridade, observacoes, usuario) {
    this.prioridade = novaPrioridade;
    this.adicionarHistorico('escalacao', observacoes, usuario);
    return this.save();
};

// Método para fechar
contactSchema.methods.fechar = function(observacoes, usuario) {
    this.status = 'fechado';
    this.adicionarHistorico('resolucao', observacoes, usuario);
    return this.save();
};

// Método estático para buscar contatos atrasados
contactSchema.statics.buscarAtrasados = function() {
    return this.find({
        proximoFollowUp: { $lt: new Date() },
        status: { $ne: 'fechado' }
    }).sort({ proximoFollowUp: 1 });
};

// Método estático para estatísticas
contactSchema.statics.obterEstatisticas = function() {
    return this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);
};

module.exports = mongoose.model('Contact', contactSchema);



