const mongoose = require('mongoose');
const { TIME_REGEX, TIME_ERROR_MESSAGE } = require('../utils/validators');

const waitlistSchema = new mongoose.Schema({
    // Dados do paciente
    patient: {
        name: {
            type: String,
            required: [true, 'Nome do paciente é obrigatório'],
            trim: true
        },
        email: {
            type: String,
            lowercase: true,
            trim: true
        },
        phone: {
            type: String,
            required: [true, 'Telefone é obrigatório'],
            trim: true
        }
    },
    
    // Preferências
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor'
    },
    specialty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Specialty',
        required: [true, 'Especialidade é obrigatória']
    },
    clinic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
        required: [true, 'Clínica é obrigatória']
    },
    
    // Preferências de data/hora
    preferredDates: [{
        type: Date
    }],
    preferredTimes: [{
        type: String,
        match: [TIME_REGEX, TIME_ERROR_MESSAGE]
    }],
    preferredPeriod: {
        type: String,
        enum: ['manha', 'tarde', 'noite', 'qualquer'],
        default: 'qualquer'
    },
    
    // Prioridade
    priority: {
        type: String,
        enum: ['baixa', 'normal', 'alta', 'urgente'],
        default: 'normal'
    },
    urgencyReason: {
        type: String,
        maxlength: [500, 'Motivo não pode ter mais de 500 caracteres']
    },
    
    // Status
    status: {
        type: String,
        enum: ['ativa', 'notificada', 'agendada', 'expirada', 'cancelada'],
        default: 'ativa'
    },
    
    // Notificações
    notified: {
        type: Boolean,
        default: false
    },
    notifiedAt: Date,
    notificationAttempts: {
        type: Number,
        default: 0
    },
    lastNotificationAt: Date,
    
    // Agendamento resultante
    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },
    appointmentCreatedAt: Date,
    
    // Expiração
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
    },
    
    // Notas
    notes: {
        type: String,
        maxlength: [1000, 'Observações não podem ter mais de 1000 caracteres']
    },
    
    // Origem
    source: {
        type: String,
        enum: ['whatsapp', 'site', 'telefone', 'admin'],
        default: 'whatsapp'
    },
    
    // Métricas
    position: Number, // Posição na fila
    waitTimeMinutes: Number, // Tempo total de espera
    
    // Histórico
    history: [{
        action: {
            type: String,
            enum: ['criado', 'notificado', 'agendado', 'cancelado', 'expirado']
        },
        date: {
            type: Date,
            default: Date.now
        },
        notes: String
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Índices para performance
waitlistSchema.index({ specialty: 1, status: 1 });
waitlistSchema.index({ doctor: 1, status: 1 });
waitlistSchema.index({ clinic: 1, status: 1 });
waitlistSchema.index({ 'patient.phone': 1 });
waitlistSchema.index({ priority: -1, createdAt: 1 }); // Ordenar por prioridade e data
waitlistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual para tempo de espera
waitlistSchema.virtual('waitTime').get(function() {
    if (this.status === 'agendada' && this.appointmentCreatedAt) {
        return Math.floor((this.appointmentCreatedAt - this.createdAt) / (1000 * 60)); // minutos
    }
    return Math.floor((new Date() - this.createdAt) / (1000 * 60));
});

// Virtual para verificar se está expirado
waitlistSchema.virtual('isExpired').get(function() {
    return this.expiresAt < new Date();
});

// Middleware pre-save
waitlistSchema.pre('save', function(next) {
    // Adicionar ao histórico quando status muda
    if (this.isModified('status')) {
        this.history.push({
            action: this.status === 'cancelada' ? 'cancelado' :
                   this.status === 'expirada' ? 'expirado' :
                   this.status === 'agendada' ? 'agendado' :
                   this.status === 'notificada' ? 'notificado' : 'criado',
            date: new Date(),
            notes: `Status alterado para: ${this.status}`
        });
    }
    
    // Marcar como notificado se status for 'notificada'
    if (this.isModified('status') && this.status === 'notificada' && !this.notified) {
        this.notified = true;
        this.notifiedAt = new Date();
    }
    
    next();
});

// Método para marcar como notificado
waitlistSchema.methods.markAsNotified = function() {
    this.status = 'notificada';
    this.notified = true;
    this.notifiedAt = new Date();
    this.lastNotificationAt = new Date();
    this.notificationAttempts++;
    return this.save();
};

// Método para converter em agendamento
waitlistSchema.methods.convertToAppointment = function(appointmentId) {
    this.status = 'agendada';
    this.appointment = appointmentId;
    this.appointmentCreatedAt = new Date();
    this.waitTimeMinutes = this.waitTime;
    return this.save();
};

// Método para cancelar
waitlistSchema.methods.cancel = function(reason) {
    this.status = 'cancelada';
    this.history.push({
        action: 'cancelado',
        date: new Date(),
        notes: reason || 'Cancelado pelo paciente'
    });
    return this.save();
};

// Método estático para buscar próximos da fila
waitlistSchema.statics.getNext = function(filters = {}, limit = 10) {
    const query = {
        status: 'ativa',
        expiresAt: { $gt: new Date() },
        ...filters
    };
    
    return this.find(query)
        .sort({ priority: -1, createdAt: 1 }) // Alta prioridade primeiro, depois FIFO
        .limit(limit)
        .populate('doctor', 'name')
        .populate('specialty', 'name')
        .populate('clinic', 'name');
};

// Método estático para atualizar posições na fila
waitlistSchema.statics.updatePositions = async function(specialty = null, doctor = null) {
    const filter = { status: 'ativa' };
    if (specialty) filter.specialty = specialty;
    if (doctor) filter.doctor = doctor;
    
    const entries = await this.find(filter)
        .sort({ priority: -1, createdAt: 1 });
    
    const updates = entries.map((entry, index) => ({
        updateOne: {
            filter: { _id: entry._id },
            update: { position: index + 1 }
        }
    }));
    
    if (updates.length > 0) {
        await this.bulkWrite(updates);
    }
    
    return updates.length;
};

// Método estático para limpar expirados
waitlistSchema.statics.cleanupExpired = async function() {
    const result = await this.updateMany(
        {
            status: 'ativa',
            expiresAt: { $lt: new Date() }
        },
        {
            status: 'expirada'
        }
    );
    
    return result.modifiedCount;
};

// Método estático para estatísticas
waitlistSchema.statics.getStats = async function(filters = {}) {
    const stats = await this.aggregate([
        { $match: filters },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                avgWaitTime: { $avg: '$waitTimeMinutes' }
            }
        }
    ]);
    
    const total = await this.countDocuments(filters);
    const active = await this.countDocuments({ ...filters, status: 'ativa' });
    const converted = await this.countDocuments({ ...filters, status: 'agendada' });
    
    return {
        total,
        active,
        converted,
        conversionRate: total > 0 ? ((converted / total) * 100).toFixed(2) + '%' : '0%',
        byStatus: stats
    };
};

module.exports = mongoose.model('Waitlist', waitlistSchema);

