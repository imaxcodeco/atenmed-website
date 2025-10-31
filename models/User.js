const mongoose = require('mongoose');
const { EMAIL_REGEX, EMAIL_ERROR_MESSAGE } = require('../utils/validators');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'Nome é obrigatório'],
        trim: true,
        maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
    },
    email: {
        type: String,
        required: [true, 'Email é obrigatório'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [EMAIL_REGEX, EMAIL_ERROR_MESSAGE]
    },
    senha: {
        type: String,
        required: [true, 'Senha é obrigatória'],
        minlength: [6, 'Senha deve ter pelo menos 6 caracteres'],
        select: false // Não incluir senha por padrão nas consultas
    },
    role: {
        type: String,
        enum: ['admin', 'vendedor', 'suporte', 'viewer'],
        default: 'viewer'
    },
    ativo: {
        type: Boolean,
        default: true
    },
    ultimoLogin: {
        type: Date
    },
    tentativasLogin: {
        type: Number,
        default: 0
    },
    bloqueadoAte: {
        type: Date
    },
    avatar: {
        type: String
    },
    telefone: {
        type: String,
        trim: true
    },
    departamento: {
        type: String,
        enum: ['vendas', 'suporte', 'desenvolvimento', 'marketing', 'administracao']
    },
    
    // Multi-tenancy: vinculação com clínica
    clinic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
        index: true
    },
    clinicRole: {
        type: String,
        enum: ['owner', 'admin', 'doctor', 'receptionist', 'viewer'],
        default: 'viewer'
    },
    permissoes: [{
        type: String,
        enum: [
            'leads:read',
            'leads:write',
            'leads:delete',
            'users:read',
            'users:write',
            'users:delete',
            'admin:access',
            'reports:view'
        ]
    }],
    configuracoes: {
        notificacoes: {
            email: { type: Boolean, default: true },
            whatsapp: { type: Boolean, default: false },
            sistema: { type: Boolean, default: true }
        },
        tema: {
            type: String,
            enum: ['claro', 'escuro', 'auto'],
            default: 'auto'
        },
        idioma: {
            type: String,
            default: 'pt-BR'
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Índices para otimização (email já tem unique: true)
userSchema.index({ role: 1, ativo: 1 }); // Buscar usuários ativos por role
userSchema.index({ clinic: 1, role: 1 }); // Multi-tenancy: usuários por clínica
userSchema.index({ email: 1, ativo: 1 }); // Login de usuários ativos

// Virtual para verificar se usuário está bloqueado
userSchema.virtual('estaBloqueado').get(function() {
    return this.bloqueadoAte && this.bloqueadoAte > new Date();
});

// Middleware pre-save para hash da senha
userSchema.pre('save', async function(next) {
    // Só fazer hash se a senha foi modificada
    if (!this.isModified('senha')) return next();
    
    try {
        // Hash da senha com salt rounds
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        this.senha = await bcrypt.hash(this.senha, saltRounds);
        next();
    } catch (error) {
        next(error);
    }
});

// Método para verificar senha
userSchema.methods.verificarSenha = async function(senhaCandidata) {
    return await bcrypt.compare(senhaCandidata, this.senha);
};

// Método para atualizar último login
userSchema.methods.atualizarUltimoLogin = function() {
    this.ultimoLogin = new Date();
    this.tentativasLogin = 0; // Reset tentativas em login bem-sucedido
    return this.save();
};

// Método para incrementar tentativas de login
userSchema.methods.incrementarTentativasLogin = function() {
    this.tentativasLogin += 1;
    
    // Bloquear por 30 minutos após 5 tentativas
    if (this.tentativasLogin >= 5) {
        this.bloqueadoAte = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
    }
    
    return this.save();
};

// Método para resetar tentativas
userSchema.methods.resetarTentativasLogin = function() {
    this.tentativasLogin = 0;
    this.bloqueadoAte = undefined;
    return this.save();
};

// Método para verificar permissão
userSchema.methods.temPermissao = function(permissao) {
    if (this.role === 'admin') return true;
    return this.permissoes.includes(permissao);
};

// Método para obter dados públicos (sem senha)
userSchema.methods.obterDadosPublicos = function() {
    const userObject = this.toObject();
    delete userObject.senha;
    delete userObject.tentativasLogin;
    delete userObject.bloqueadoAte;
    return userObject;
};

// Método estático para buscar usuários ativos
userSchema.statics.buscarAtivos = function() {
    return this.find({ ativo: true }).select('-senha');
};

// Método estático para buscar por role
userSchema.statics.buscarPorRole = function(role) {
    return this.find({ role, ativo: true }).select('-senha');
};

module.exports = mongoose.model('User', userSchema);

