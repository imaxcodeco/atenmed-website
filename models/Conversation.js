const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent',
        required: true,
        index: true
    },
    clinic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
        required: true,
        index: true
    },
    userId: {
        type: String, // Pode ser ID do usuário ou identificador do canal
        index: true
    },
    userName: {
        type: String
    },
    userEmail: {
        type: String
    },
    userPhone: {
        type: String
    },
    channel: {
        type: String,
        enum: ['website', 'whatsapp', 'instagram', 'email', 'other'],
        default: 'website',
        index: true
    },
    messages: [{
        role: {
            type: String,
            enum: ['user', 'assistant', 'system'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        intent: String,
        metadata: mongoose.Schema.Types.Mixed,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['active', 'completed', 'abandoned', 'handed_off', 'archived'],
        default: 'active',
        index: true
    },
    leadGenerated: {
        type: Boolean,
        default: false
    },
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead'
    },
    satisfaction: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        feedback: String,
        ratedAt: Date
    },
    firstMessageAt: {
        type: Date,
        default: Date.now
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    handedOffTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    handedOffAt: Date,
    
    // Tags e categorização
    tags: [{
        type: String
    }],
    
    // Importância
    important: {
        type: Boolean,
        default: false
    },
    
    // Arquivado
    archived: {
        type: Boolean,
        default: false
    },
    archivedAt: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Índices
conversationSchema.index({ agent: 1, status: 1 });
conversationSchema.index({ clinic: 1, lastMessageAt: -1 });
conversationSchema.index({ userId: 1, status: 1 });
conversationSchema.index({ createdAt: -1 });

// Virtual para duração da conversa
conversationSchema.virtual('duration').get(function() {
    if (!this.lastMessageAt || !this.firstMessageAt) return 0;
    return Math.floor((this.lastMessageAt - this.firstMessageAt) / 1000); // segundos
});

// Métodos
conversationSchema.methods.complete = function() {
    this.status = 'completed';
    return this.save();
};

conversationSchema.methods.abandon = function() {
    this.status = 'abandoned';
    return this.save();
};

conversationSchema.methods.handOff = function(userId) {
    this.status = 'handed_off';
    this.handedOffTo = userId;
    this.handedOffAt = new Date();
    return this.save();
};

module.exports = mongoose.model('Conversation', conversationSchema);

