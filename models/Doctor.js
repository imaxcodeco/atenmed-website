const mongoose = require('mongoose');
const { EMAIL_REGEX, EMAIL_ERROR_MESSAGE } = require('../utils/validators');

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Nome do médico é obrigatório'],
        trim: true,
        maxlength: [200, 'Nome não pode ter mais de 200 caracteres']
    },
    email: {
        type: String,
        required: [true, 'Email é obrigatório'],
        lowercase: true,
        trim: true,
        match: [EMAIL_REGEX, EMAIL_ERROR_MESSAGE]
    },
    phone: {
        type: String,
        trim: true
    },
    // Dados profissionais
    crm: {
        number: String,
        state: String
    },
    specialties: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Specialty',
        required: [true, 'Pelo menos uma especialidade é obrigatória']
    }],
    clinic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
        required: [true, 'Clínica é obrigatória']
    },
    
    // Integração com Google Calendar
    googleCalendarId: {
        type: String,
        required: [true, 'ID do Google Calendar é obrigatório'],
        unique: true,
        trim: true
    },
    googleCalendarEmail: {
        type: String,
        trim: true,
        lowercase: true
    },
    
    // Configurações de agendamento
    workingDays: {
        type: [Number], // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
        default: [1, 2, 3, 4, 5], // Segunda a Sexta
        validate: {
            validator: function(days) {
                return days.every(day => day >= 0 && day <= 6);
            },
            message: 'Dias da semana devem ser entre 0 (Domingo) e 6 (Sábado)'
        }
    },
    workingHours: {
        start: {
            type: Number,
            default: 9,
            min: 0,
            max: 23
        },
        end: {
            type: Number,
            default: 18,
            min: 0,
            max: 23
        }
    },
    slotDuration: {
        type: Number,
        default: 60, // minutos
        min: 15,
        max: 180
    },
    
    // Status e disponibilidade
    active: {
        type: Boolean,
        default: true
    },
    acceptsNewPatients: {
        type: Boolean,
        default: true
    },
    
    // Informações adicionais
    bio: {
        type: String,
        maxlength: [1000, 'Biografia não pode ter mais de 1000 caracteres']
    },
    photo: {
        type: String // URL da foto
    },
    languages: {
        type: [String],
        default: ['Português']
    },
    
    // Preferências de notificação
    notifications: {
        email: {
            type: Boolean,
            default: true
        },
        sms: {
            type: Boolean,
            default: false
        },
        whatsapp: {
            type: Boolean,
            default: true
        }
    },
    
    // Estatísticas
    stats: {
        totalAppointments: {
            type: Number,
            default: 0
        },
        completedAppointments: {
            type: Number,
            default: 0
        },
        canceledAppointments: {
            type: Number,
            default: 0
        },
        rating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },
        reviewCount: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Índices para performance
// googleCalendarId já tem índice unique na definição do schema
doctorSchema.index({ email: 1 });
doctorSchema.index({ clinic: 1 });
doctorSchema.index({ specialties: 1 });
doctorSchema.index({ active: 1 });

// Índices compostos para multi-tenancy e performance
doctorSchema.index({ clinic: 1, active: 1 });
doctorSchema.index({ clinic: 1, specialties: 1 });
doctorSchema.index({ clinic: 1, email: 1 });

// Virtual para appointments
doctorSchema.virtual('appointments', {
    ref: 'Appointment',
    localField: '_id',
    foreignField: 'doctor'
});

// Método para verificar disponibilidade em um dia da semana
doctorSchema.methods.worksOnDay = function(dayOfWeek) {
    return this.workingDays.includes(dayOfWeek);
};

// Método para verificar se está em horário de trabalho
doctorSchema.methods.isWorkingTime = function(hour) {
    return hour >= this.workingHours.start && hour < this.workingHours.end;
};

// Método para incrementar estatísticas
doctorSchema.methods.incrementStat = function(statName) {
    if (this.stats[statName] !== undefined) {
        this.stats[statName]++;
        return this.save();
    }
};

module.exports = mongoose.model('Doctor', doctorSchema);

