const mongoose = require('mongoose');

const clinicSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Nome da clínica é obrigatório'],
        unique: true,
        trim: true,
        maxlength: [200, 'Nome não pode ter mais de 200 caracteres']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Descrição não pode ter mais de 1000 caracteres']
    },
    address: {
        street: String,
        number: String,
        complement: String,
        neighborhood: String,
        city: String,
        state: String,
        zipCode: String
    },
    contact: {
        phone: String,
        email: String,
        whatsapp: String
    },
    workingHours: {
        start: {
            type: Number,
            default: 9, // 9h
            min: 0,
            max: 23
        },
        end: {
            type: Number,
            default: 18, // 18h
            min: 0,
            max: 23
        }
    },
    slotDuration: {
        type: Number,
        default: 60, // 60 minutos por consulta
        min: 15,
        max: 180
    },
    active: {
        type: Boolean,
        default: true
    },
    settings: {
        allowWeekends: {
            type: Boolean,
            default: false
        },
        autoConfirmAppointments: {
            type: Boolean,
            default: true
        },
        sendEmailNotifications: {
            type: Boolean,
            default: true
        },
        sendWhatsAppNotifications: {
            type: Boolean,
            default: true
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Índices para performance
// name já tem unique: true (índice automático)
clinicSchema.index({ active: 1 });

// Virtual para contar especialidades
clinicSchema.virtual('specialties', {
    ref: 'Specialty',
    localField: '_id',
    foreignField: 'clinic'
});

// Método para verificar se está em horário de funcionamento
clinicSchema.methods.isWorkingTime = function(hour) {
    return hour >= this.workingHours.start && hour < this.workingHours.end;
};

module.exports = mongoose.model('Clinic', clinicSchema);

