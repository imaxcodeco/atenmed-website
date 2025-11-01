const mongoose = require('mongoose');
const { EMAIL_REGEX, EMAIL_ERROR_MESSAGE, TIME_REGEX, TIME_ERROR_MESSAGE } = require('../utils/validators');

const appointmentSchema = new mongoose.Schema({
    // Dados do paciente
    patient: {
        name: {
            type: String,
            required: [true, 'Nome do paciente é obrigatório'],
            trim: true,
            maxlength: [200, 'Nome não pode ter mais de 200 caracteres']
        },
        email: {
            type: String,
            lowercase: true,
            trim: true,
            match: [EMAIL_REGEX, EMAIL_ERROR_MESSAGE]
        },
        phone: {
            type: String,
            required: [true, 'Telefone é obrigatório'],
            trim: true
        },
        cpf: {
            type: String,
            trim: true
        },
        birthDate: {
            type: Date
        },
        // Dados adicionais do paciente
        address: {
            street: String,
            number: String,
            complement: String,
            neighborhood: String,
            city: String,
            state: String,
            zipCode: String
        }
    },
    
    // Dados da consulta
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: [true, 'Médico é obrigatório']
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
    
    // Data e hora
    scheduledDate: {
        type: Date,
        required: [true, 'Data é obrigatória']
    },
    scheduledTime: {
        type: String,
        required: [true, 'Horário é obrigatório'],
        match: [TIME_REGEX, TIME_ERROR_MESSAGE]
    },
    duration: {
        type: Number,
        default: 60, // minutos
        min: 15,
        max: 180
    },
    
    // Status do agendamento
    status: {
        type: String,
        enum: ['pendente', 'confirmado', 'em-atendimento', 'concluido', 'cancelado', 'nao-compareceu'],
        default: 'pendente'
    },
    
    // Integração com Google Calendar
    googleEventId: {
        type: String,
        unique: true,
        sparse: true // permite null para eventos ainda não criados
    },
    googleCalendarId: {
        type: String
    },
    
    // Informações adicionais
    notes: {
        type: String,
        maxlength: [1000, 'Observações não podem ter mais de 1000 caracteres']
    },
    reason: {
        type: String,
        trim: true,
        maxlength: [500, 'Motivo não pode ter mais de 500 caracteres']
    },
    
    // Origem do agendamento
    source: {
        type: String,
        enum: ['site', 'whatsapp', 'telefone', 'presencial', 'admin'],
        default: 'whatsapp'
    },
    
    // Confirmações e lembretes
    confirmations: {
        patient: {
            confirmed: {
                type: Boolean,
                default: false
            },
            confirmedAt: Date,
            method: {
                type: String,
                enum: ['email', 'whatsapp', 'sms', 'phone', 'link']
            },
            confirmationToken: String // Token único para confirmação por link
        },
        reminders: [{
            type: {
                type: String,
                enum: ['24h', '1h', 'custom', 'manual'],
                default: 'manual'
            },
            sentAt: {
                type: Date,
                default: Date.now
            },
            method: {
                type: String,
                enum: ['email', 'whatsapp', 'sms', 'manual'],
                default: 'whatsapp'
            },
            status: {
                type: String,
                enum: ['pendente', 'enviado', 'entregue', 'lido', 'falhou'],
                default: 'enviado'
            },
            error: String
        }]
    },
    
    // Cancelamento
    canceledAt: Date,
    canceledBy: {
        type: String,
        enum: ['patient', 'doctor', 'clinic', 'system']
    },
    cancelReason: {
        type: String,
        maxlength: [500, 'Motivo do cancelamento não pode ter mais de 500 caracteres']
    },
    
    // Avaliação
    rating: {
        score: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        ratedAt: Date
    },
    
    // Dados de rastreamento
    ip: String,
    userAgent: String,
    
    // Histórico de alterações
    history: [{
        action: {
            type: String,
            enum: ['criado', 'confirmado', 'reagendado', 'cancelado', 'concluido']
        },
        date: {
            type: Date,
            default: Date.now
        },
        by: String,
        oldData: mongoose.Schema.Types.Mixed,
        newData: mongoose.Schema.Types.Mixed,
        notes: String
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Índices para performance
appointmentSchema.index({ doctor: 1, scheduledDate: 1 });
appointmentSchema.index({ 'patient.phone': 1 });
appointmentSchema.index({ 'patient.email': 1 });
appointmentSchema.index({ status: 1 });
// googleEventId já tem índice unique na definição do schema
appointmentSchema.index({ scheduledDate: 1, scheduledTime: 1 });
appointmentSchema.index({ clinic: 1, scheduledDate: 1 });

// Índices compostos para multi-tenancy e performance (remover duplicatas abaixo)
appointmentSchema.index({ clinic: 1, status: 1 });
appointmentSchema.index({ clinic: 1, doctor: 1, scheduledDate: 1 });
appointmentSchema.index({ clinic: 1, status: 1, scheduledDate: 1 });

// Virtual para data/hora completa
appointmentSchema.virtual('scheduledDateTime').get(function() {
    const [hours, minutes] = this.scheduledTime.split(':');
    const dateTime = new Date(this.scheduledDate);
    dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return dateTime;
});

// Virtual para verificar se está no passado
appointmentSchema.virtual('isPast').get(function() {
    return this.scheduledDateTime < new Date();
});

// Virtual para verificar se é hoje
appointmentSchema.virtual('isToday').get(function() {
    const today = new Date();
    const schedDate = new Date(this.scheduledDate);
    return schedDate.toDateString() === today.toDateString();
});

// Middleware pre-save
appointmentSchema.pre('save', function(next) {
    // Adicionar ao histórico se for uma nova mudança de status
    if (this.isModified('status')) {
        this.history.push({
            action: this.status === 'cancelado' ? 'cancelado' : 'confirmado',
            date: new Date(),
            by: 'system',
            notes: `Status alterado para: ${this.status}`
        });
    }
    
    // Definir data de cancelamento
    if (this.isModified('status') && this.status === 'cancelado' && !this.canceledAt) {
        this.canceledAt = new Date();
    }
    
    next();
});

// Método para confirmar agendamento
appointmentSchema.methods.confirm = function(method = 'whatsapp') {
    this.status = 'confirmado';
    this.confirmations.patient.confirmed = true;
    this.confirmations.patient.confirmedAt = new Date();
    this.confirmations.patient.method = method;
    return this.save();
};

// Método para cancelar agendamento
appointmentSchema.methods.cancel = function(canceledBy, reason) {
    this.status = 'cancelado';
    this.canceledAt = new Date();
    this.canceledBy = canceledBy;
    this.cancelReason = reason;
    return this.save();
};

// Método para adicionar lembrete
appointmentSchema.methods.addReminder = function(type = 'manual', method = 'whatsapp', status = 'enviado', error = null) {
    this.confirmations.reminders.push({
        type,
        sentAt: new Date(),
        method,
        status,
        error
    });
    return this.save();
};

// Método para confirmar presença
appointmentSchema.methods.confirmPresence = function(method = 'link', token = null) {
    this.confirmations.patient.confirmed = true;
    this.confirmations.patient.confirmedAt = new Date();
    this.confirmations.patient.method = method;
    if (token) {
        this.confirmations.patient.confirmationToken = token;
    }
    return this.save();
};

// Método estático para buscar agendamentos do dia
appointmentSchema.statics.findByDate = function(date, doctorId = null) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const query = {
        scheduledDate: {
            $gte: startOfDay,
            $lte: endOfDay
        },
        status: { $ne: 'cancelado' }
    };
    
    if (doctorId) {
        query.doctor = doctorId;
    }
    
    return this.find(query)
        .populate('doctor', 'name email')
        .populate('specialty', 'name')
        .populate('clinic', 'name')
        .sort({ scheduledTime: 1 });
};

// Método estático para estatísticas
appointmentSchema.statics.getStats = function(startDate, endDate, filters = {}) {
    const query = {
        scheduledDate: {
            $gte: startDate,
            $lte: endDate
        },
        ...filters
    };
    
    return this.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);
};

// Índices adicionais para otimização
appointmentSchema.index({ doctor: 1, scheduledDate: 1, scheduledTime: 1 }); // Disponibilidade de médico
appointmentSchema.index({ status: 1, scheduledDate: 1 }); // Filtrar por status e data
appointmentSchema.index({ source: 1 }); // Rastrear origem dos agendamentos
appointmentSchema.index({ createdAt: -1 }); // Ordenar por data de criação

module.exports = mongoose.model('Appointment', appointmentSchema);

