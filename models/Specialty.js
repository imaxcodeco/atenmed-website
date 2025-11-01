const mongoose = require('mongoose');

const specialtySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Nome da especialidade é obrigatório'],
        trim: true,
        maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
    },
    clinic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
        required: [true, 'Clínica é obrigatória']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Descrição não pode ter mais de 500 caracteres']
    },
    color: {
        type: String,
        default: '#45a7b1', // Cor padrão do AtenMed
        match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor inválida']
    },
    icon: {
        type: String,
        default: '🏥'
    },
    active: {
        type: Boolean,
        default: true
    },
    // Configurações específicas da especialidade
    defaultDuration: {
        type: Number,
        default: 60, // duração padrão em minutos
        min: 15,
        max: 180
    },
    requiresPreparation: {
        type: Boolean,
        default: false
    },
    preparationInstructions: {
        type: String,
        maxlength: [1000, 'Instruções não podem ter mais de 1000 caracteres']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Índices para performance
specialtySchema.index({ clinic: 1, name: 1 }, { unique: true });
specialtySchema.index({ active: 1 });

// Índices compostos para multi-tenancy e performance
specialtySchema.index({ clinic: 1, active: 1 });
specialtySchema.index({ clinic: 1, createdAt: -1 });

// Virtual para contar médicos
specialtySchema.virtual('doctors', {
    ref: 'Doctor',
    localField: '_id',
    foreignField: 'specialties'
});

module.exports = mongoose.model('Specialty', specialtySchema);

