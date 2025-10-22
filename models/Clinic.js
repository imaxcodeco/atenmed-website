const mongoose = require('mongoose');

const clinicSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Nome da clínica é obrigatório'],
        trim: true,
        maxlength: [200, 'Nome não pode ter mais de 200 caracteres']
    },
    slug: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Descrição não pode ter mais de 1000 caracteres']
    },
    slogan: {
        type: String,
        maxlength: [200, 'Slogan não pode ter mais de 200 caracteres']
    },
    cnpj: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    logo: {
        type: String, // URL da logo
    },
    favicon: {
        type: String, // URL do favicon
    },
    coverImage: {
        type: String, // URL da imagem de capa
    },
    address: {
        street: String,
        number: String,
        complement: String,
        neighborhood: String,
        city: String,
        state: String,
        zipCode: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    contact: {
        phone: String,
        email: String,
        whatsapp: String,
        website: String
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
        },
        formatted: String, // Ex: "Seg-Sex: 8h às 18h"
        monday: { start: String, end: String, closed: Boolean },
        tuesday: { start: String, end: String, closed: Boolean },
        wednesday: { start: String, end: String, closed: Boolean },
        thursday: { start: String, end: String, closed: Boolean },
        friday: { start: String, end: String, closed: Boolean },
        saturday: { start: String, end: String, closed: Boolean },
        sunday: { start: String, end: String, closed: Boolean }
    },
    slotDuration: {
        type: Number,
        default: 60, // 60 minutos por consulta
        min: 15,
        max: 180
    },
    insurance: [{
        name: String,
        logo: String,
        active: Boolean
    }],
    amenities: [{
        type: String,
        enum: ['wifi', 'estacionamento', 'acessibilidade', 'cafeteria', 'sala-espera']
    }],
    branding: {
        primaryColor: {
            type: String,
            default: '#45a7b1'
        },
        secondaryColor: {
            type: String,
            default: '#184354'
        },
        accentColor: {
            type: String,
            default: '#6dd5ed'
        },
        fontFamily: String
    },
    social: {
        facebook: String,
        instagram: String,
        linkedin: String,
        twitter: String,
        youtube: String
    },
    rating: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        }
    },
    stats: {
        totalAppointments: {
            type: Number,
            default: 0
        },
        activePatients: {
            type: Number,
            default: 0
        },
        pageViews: {
            type: Number,
            default: 0
        }
    },
    features: {
        onlineBooking: {
            type: Boolean,
            default: true
        },
        whatsappBot: {
            type: Boolean,
            default: true
        },
        telemedicine: {
            type: Boolean,
            default: false
        },
        electronicRecords: {
            type: Boolean,
            default: false
        }
    },
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'basic', 'pro', 'enterprise'],
            default: 'free'
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'suspended', 'trial'],
            default: 'trial'
        },
        startDate: Date,
        endDate: Date,
        autoRenew: {
            type: Boolean,
            default: true
        }
    },
    active: {
        type: Boolean,
        default: true
    },
    isActive: { // Alias para compatibilidade
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
clinicSchema.index({ slug: 1 });
clinicSchema.index({ 'address.city': 1 });
clinicSchema.index({ active: 1 });
clinicSchema.index({ isActive: 1 });
clinicSchema.index({ 'subscription.plan': 1 });

// Virtual para especialidades
clinicSchema.virtual('specialties', {
    ref: 'Specialty',
    localField: '_id',
    foreignField: 'clinic'
});

// Virtual para URL da página pública
clinicSchema.virtual('publicUrl').get(function() {
    return this.slug ? `/clinica/${this.slug}` : null;
});

// Middleware pre-save para gerar slug automaticamente
clinicSchema.pre('save', function(next) {
    // Sincronizar active com isActive
    if (this.isModified('active')) {
        this.isActive = this.active;
    } else if (this.isModified('isActive')) {
        this.active = this.isActive;
    }
    
    // Gerar slug se não existir
    if (this.isNew && !this.slug && this.name) {
        this.slug = this.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }
    
    next();
});

// Método para verificar se está em horário de funcionamento
clinicSchema.methods.isWorkingTime = function(hour) {
    return hour >= this.workingHours.start && hour < this.workingHours.end;
};

// Método para incrementar estatísticas
clinicSchema.methods.incrementStat = function(statName) {
    if (!this.stats) this.stats = {};
    if (!this.stats[statName]) this.stats[statName] = 0;
    this.stats[statName]++;
    return this.save();
};

// Método para atualizar rating
clinicSchema.methods.updateRating = function(newRating) {
    if (!this.rating) {
        this.rating = { average: 0, count: 0 };
    }
    
    const totalRating = this.rating.average * this.rating.count;
    this.rating.count++;
    this.rating.average = (totalRating + newRating) / this.rating.count;
    
    return this.save();
};

module.exports = mongoose.model('Clinic', clinicSchema);
