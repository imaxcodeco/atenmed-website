const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    // Identificação
    invoiceNumber: {
        type: String,
        unique: true,
        required: true
    },
    
    // Clínica
    clinic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
        required: true,
        index: true
    },
    
    // Período de referência
    referenceMonth: {
        type: Date,
        required: true,
        index: true
    },
    
    // Plano e valores
    plan: {
        type: String,
        enum: ['free', 'basic', 'pro', 'enterprise'],
        required: true
    },
    
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    
    // Datas
    issueDate: {
        type: Date,
        default: Date.now
    },
    
    dueDate: {
        type: Date,
        required: true,
        index: true
    },
    
    paidDate: {
        type: Date
    },
    
    // Status
    status: {
        type: String,
        enum: ['pendente', 'pago', 'vencido', 'cancelado'],
        default: 'pendente',
        index: true
    },
    
    // Pagamento
    paymentMethod: {
        type: String,
        enum: ['boleto', 'pix', 'transferencia', 'cartao', 'outros']
    },
    
    paymentReference: {
        type: String // ID da transação, linha digitável do boleto, etc
    },
    
    // Documentos
    pdfUrl: {
        type: String
    },
    
    boletoUrl: {
        type: String
    },
    
    pixCode: {
        type: String
    },
    
    // Observações
    notes: {
        type: String,
        maxlength: [1000, 'Observações não podem ter mais de 1000 caracteres']
    },
    
    // Histórico de lembretes enviados
    reminders: [{
        sentAt: {
            type: Date,
            default: Date.now
        },
        type: {
            type: String,
            enum: ['lembrete', 'vencimento', 'atraso'],
            required: true
        },
        channel: {
            type: String,
            enum: ['email', 'whatsapp', 'sms']
        },
        success: Boolean
    }],
    
    // Metadados
    metadata: {
        appointmentsCount: Number, // Quantos agendamentos neste período
        messagesCount: Number, // Quantas mensagens enviadas
        extraCharges: [{
            description: String,
            amount: Number
        }]
    }
    
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Índices compostos
invoiceSchema.index({ clinic: 1, referenceMonth: 1 });
invoiceSchema.index({ status: 1, dueDate: 1 });

// Virtual para verificar se está vencida
invoiceSchema.virtual('isOverdue').get(function() {
    return this.status === 'pendente' && this.dueDate < new Date();
});

// Virtual para dias de atraso
invoiceSchema.virtual('daysOverdue').get(function() {
    if (this.status !== 'pendente' || this.dueDate >= new Date()) {
        return 0;
    }
    return Math.floor((Date.now() - this.dueDate) / (1000 * 60 * 60 * 24));
});

// Middleware pre-save
invoiceSchema.pre('save', function(next) {
    // Calcular total amount com desconto
    this.totalAmount = this.amount - this.discount;
    
    // Atualizar status para vencido se passou da data
    if (this.status === 'pendente' && this.dueDate < new Date()) {
        this.status = 'vencido';
    }
    
    // Gerar número da fatura se não existir
    if (this.isNew && !this.invoiceNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.invoiceNumber = `FAT-${year}${month}-${random}`;
    }
    
    next();
});

// Método para marcar como paga
invoiceSchema.methods.markAsPaid = function(paymentMethod, paymentReference) {
    this.status = 'pago';
    this.paidDate = new Date();
    if (paymentMethod) this.paymentMethod = paymentMethod;
    if (paymentReference) this.paymentReference = paymentReference;
    return this.save();
};

// Método para adicionar lembrete ao histórico
invoiceSchema.methods.addReminder = function(type, channel, success = true) {
    this.reminders.push({
        type,
        channel,
        success,
        sentAt: new Date()
    });
    return this.save();
};

// Método estático para buscar faturas vencidas
invoiceSchema.statics.findOverdue = function(daysOverdue = 0) {
    const date = new Date();
    date.setDate(date.getDate() - daysOverdue);
    
    return this.find({
        status: 'pendente',
        dueDate: { $lt: date }
    }).sort({ dueDate: 1 });
};

// Método estático para buscar faturas a vencer
invoiceSchema.statics.findDueSoon = function(daysAhead = 3) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);
    
    return this.find({
        status: 'pendente',
        dueDate: { $gte: today, $lte: futureDate }
    }).sort({ dueDate: 1 });
};

// Método estático para estatísticas
invoiceSchema.statics.getStats = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$totalAmount' }
            }
        }
    ]);
    
    return stats;
};

module.exports = mongoose.model('Invoice', invoiceSchema);

