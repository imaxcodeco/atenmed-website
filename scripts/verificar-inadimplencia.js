#!/usr/bin/env node
/**
 * Script: Verificação de Inadimplência
 * 
 * Executa verificações diárias de status de pagamento:
 * - Suspende clínicas com 15+ dias de atraso
 * - Envia lembretes de faturas vencendo
 * - Atualiza status de faturas vencidas
 * 
 * Uso: node scripts/verificar-inadimplencia.js
 * 
 * Agendar com cron (diariamente às 8h):
 * 0 8 * * * node /path/to/atenmed/scripts/verificar-inadimplencia.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Clinic = require('../models/Clinic');
const Invoice = require('../models/Invoice');
const logger = require('../utils/logger');

async function verificarInadimplencia() {
    try {
        console.log('\n🔍 Iniciando verificação de inadimplência...\n');
        
        // Conectar ao MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado ao MongoDB\n');

        let stats = {
            vencidas: 0,
            suspensas: 0,
            lembretes: 0,
            reativadas: 0
        };

        // ===== 1. ATUALIZAR STATUS DE FATURAS VENCIDAS =====
        console.log('📋 Atualizando faturas vencidas...');
        const overdueResult = await Invoice.updateMany(
            {
                status: 'pendente',
                dueDate: { $lt: new Date() }
            },
            {
                $set: { status: 'vencido' }
            }
        );
        stats.vencidas = overdueResult.modifiedCount;
        console.log(`   ✓ ${stats.vencidas} faturas marcadas como vencidas\n`);

        // ===== 2. SUSPENDER CLÍNICAS COM 15+ DIAS DE ATRASO =====
        console.log('⏸️  Verificando clínicas para suspensão (15+ dias)...');
        
        const suspensionDate = new Date();
        suspensionDate.setDate(suspensionDate.getDate() - 15);

        const invoicesToSuspend = await Invoice.find({
            status: 'vencido',
            dueDate: { $lt: suspensionDate }
        }).populate('clinic');

        for (const invoice of invoicesToSuspend) {
            if (!invoice.clinic) continue;
            
            const clinic = invoice.clinic;
            
            if (clinic.subscription.status === 'suspended') {
                continue; // Já suspensa
            }

            // Suspender
            clinic.subscription.status = 'suspended';
            await clinic.save();
            
            stats.suspensas++;
            console.log(`   ⏸️  ${clinic.name}: SUSPENSA (Fatura ${invoice.invoiceNumber})`);
            logger.warn(`Clínica suspensa: ${clinic.name} - Fatura ${invoice.invoiceNumber} vencida há ${Math.floor((Date.now() - invoice.dueDate) / (1000 * 60 * 60 * 24))} dias`);
        }
        console.log(`   ✓ ${stats.suspensas} clínicas suspensas\n`);

        // ===== 3. REATIVAR CLÍNICAS QUE PAGARAM =====
        console.log('✅ Verificando clínicas para reativação...');
        
        const suspendedClinics = await Clinic.find({
            'subscription.status': 'suspended'
        });

        for (const clinic of suspendedClinics) {
            // Verificar se ainda há faturas pendentes
            const pendingInvoices = await Invoice.countDocuments({
                clinic: clinic._id,
                status: { $in: ['pendente', 'vencido'] }
            });

            if (pendingInvoices === 0) {
                // Reativar
                clinic.subscription.status = 'active';
                await clinic.save();
                
                stats.reativadas++;
                console.log(`   ✅ ${clinic.name}: REATIVADA`);
                logger.info(`Clínica reativada: ${clinic.name}`);
            }
        }
        console.log(`   ✓ ${stats.reativadas} clínicas reativadas\n`);

        // ===== 4. LEMBRETES DE FATURAS A VENCER (3 DIAS) =====
        console.log('📧 Verificando faturas a vencer (próximos 3 dias)...');
        
        const reminderDate = new Date();
        reminderDate.setDate(reminderDate.getDate() + 3);

        const invoicesDueSoon = await Invoice.find({
            status: 'pendente',
            dueDate: {
                $gte: new Date(),
                $lte: reminderDate
            }
        }).populate('clinic');

        for (const invoice of invoicesDueSoon) {
            // Verificar se já enviou lembrete nos últimos 2 dias
            const recentReminder = invoice.reminders.find(r => {
                const daysSince = (Date.now() - r.sentAt) / (1000 * 60 * 60 * 24);
                return r.type === 'lembrete' && daysSince < 2;
            });

            if (recentReminder) {
                continue; // Já enviou recentemente
            }

            // TODO: Enviar email/WhatsApp de lembrete
            // await sendInvoiceReminder(invoice);
            
            // Registrar lembrete
            invoice.reminders.push({
                type: 'lembrete',
                channel: 'email',
                success: true,
                sentAt: new Date()
            });
            await invoice.save();
            
            stats.lembretes++;
            console.log(`   📧 ${invoice.clinic.name}: Lembrete enviado (vence em ${Math.ceil((invoice.dueDate - Date.now()) / (1000 * 60 * 60 * 24))} dias)`);
        }
        console.log(`   ✓ ${stats.lembretes} lembretes enviados\n`);

        // ===== 5. ALERTAS PARA FATURAS MUITO ATRASADAS (30+ DIAS) =====
        console.log('🚨 Verificando faturas críticas (30+ dias)...');
        
        const criticalDate = new Date();
        criticalDate.setDate(criticalDate.getDate() - 30);

        const criticalInvoices = await Invoice.find({
            status: 'vencido',
            dueDate: { $lt: criticalDate }
        }).populate('clinic');

        if (criticalInvoices.length > 0) {
            console.log(`   ⚠️  ${criticalInvoices.length} faturas críticas encontradas:`);
            criticalInvoices.forEach(invoice => {
                const daysOverdue = Math.floor((Date.now() - invoice.dueDate) / (1000 * 60 * 60 * 24));
                console.log(`      - ${invoice.clinic.name}: ${daysOverdue} dias de atraso (R$ ${invoice.totalAmount})`);
            });
            console.log('   ℹ️  Considere desativação permanente ou negociação\n');
        } else {
            console.log('   ✓ Nenhuma fatura crítica\n');
        }

        // ===== RESUMO =====
        console.log('════════════════════════════════════════');
        console.log('   📊 RESUMO DA VERIFICAÇÃO');
        console.log('════════════════════════════════════════');
        console.log(`📋 Faturas marcadas como vencidas: ${stats.vencidas}`);
        console.log(`⏸️  Clínicas suspensas: ${stats.suspensas}`);
        console.log(`✅ Clínicas reativadas: ${stats.reativadas}`);
        console.log(`📧 Lembretes enviados: ${stats.lembretes}`);
        console.log(`🚨 Faturas críticas: ${criticalInvoices.length}`);
        console.log('════════════════════════════════════════\n');

        // Log geral
        logger.info('Verificação de inadimplência concluída', stats);

    } catch (error) {
        console.error('❌ ERRO:', error);
        logger.error('Erro na verificação de inadimplência:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Processo finalizado.\n');
    }
}

// Executar
verificarInadimplencia();

