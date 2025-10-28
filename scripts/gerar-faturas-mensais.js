#!/usr/bin/env node
/**
 * Script: Gerar Faturas Mensais
 * 
 * Este script gera faturas automaticamente para todas as clínicas ativas
 * no dia 1 de cada mês.
 * 
 * Uso: node scripts/gerar-faturas-mensais.js
 * 
 * Pode ser agendado com cron:
 * 0 0 1 * * node /path/to/atenmed/scripts/gerar-faturas-mensais.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Clinic = require('../models/Clinic');
const Invoice = require('../models/Invoice');
const logger = require('../utils/logger');

// Valores dos planos
const planValues = {
    free: 0,
    basic: 99,
    pro: 249,
    enterprise: 599
};

async function gerarFaturasMensais() {
    try {
        // Conectar ao MongoDB
        console.log('🔌 Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado!\n');

        // Data de referência (mês anterior)
        const referenceDate = new Date();
        referenceDate.setMonth(referenceDate.getMonth() - 1);
        referenceDate.setDate(1);
        referenceDate.setHours(0, 0, 0, 0);

        // Data de vencimento (dia 10 do mês atual)
        const dueDate = new Date();
        dueDate.setDate(10);
        dueDate.setHours(23, 59, 59, 999);

        console.log('📅 Gerando faturas para o período:');
        console.log(`   Referência: ${referenceDate.toLocaleDateString('pt-BR')}`);
        console.log(`   Vencimento: ${dueDate.toLocaleDateString('pt-BR')}\n`);

        // Buscar clínicas ativas com planos pagos
        const clinics = await Clinic.find({
            active: true,
            'subscription.status': 'active',
            'subscription.plan': { $in: ['basic', 'pro', 'enterprise'] }
        });

        console.log(`🏥 Encontradas ${clinics.length} clínicas ativas para faturamento\n`);

        let created = 0;
        let skipped = 0;
        let errors = 0;

        for (const clinic of clinics) {
            try {
                // Verificar se já existe fatura para este período
                const existingInvoice = await Invoice.findOne({
                    clinic: clinic._id,
                    referenceMonth: referenceDate
                });

                if (existingInvoice) {
                    console.log(`⏭️  ${clinic.name}: Fatura já existe (${existingInvoice.invoiceNumber})`);
                    skipped++;
                    continue;
                }

                // Calcular valor
                const amount = planValues[clinic.subscription.plan] || 0;

                if (amount === 0) {
                    console.log(`⏭️  ${clinic.name}: Plano gratuito`);
                    skipped++;
                    continue;
                }

                // Criar fatura
                const invoice = new Invoice({
                    clinic: clinic._id,
                    referenceMonth: referenceDate,
                    plan: clinic.subscription.plan,
                    amount: amount,
                    discount: 0,
                    dueDate: dueDate,
                    status: 'pendente',
                    notes: `Fatura gerada automaticamente em ${new Date().toLocaleDateString('pt-BR')}`
                });

                await invoice.save();

                console.log(`✅ ${clinic.name}: Fatura criada - R$ ${amount.toFixed(2)} (${invoice.invoiceNumber})`);
                created++;

                // Log no sistema
                logger.info(`Fatura gerada automaticamente: ${invoice.invoiceNumber} - ${clinic.name}`);

            } catch (error) {
                console.error(`❌ ${clinic.name}: Erro ao criar fatura - ${error.message}`);
                logger.error(`Erro ao gerar fatura para ${clinic.name}:`, error);
                errors++;
            }
        }

        // Resumo
        console.log('\n════════════════════════════════════════');
        console.log('   📊 RESUMO DA GERAÇÃO DE FATURAS');
        console.log('════════════════════════════════════════');
        console.log(`✅ Criadas: ${created}`);
        console.log(`⏭️  Puladas: ${skipped}`);
        console.log(`❌ Erros: ${errors}`);
        console.log(`📊 Total processado: ${clinics.length}`);
        console.log('════════════════════════════════════════\n');

        if (created > 0) {
            console.log('💡 PRÓXIMOS PASSOS:');
            console.log('   1. Enviar emails de cobrança aos clientes');
            console.log('   2. Gerar boletos/PIX para as faturas');
            console.log('   3. Acompanhar pagamentos no sistema\n');
        }

    } catch (error) {
        console.error('❌ ERRO CRÍTICO:', error);
        logger.error('Erro crítico na geração de faturas:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Processo finalizado.\n');
    }
}

// Executar
console.log('\n🚀 Iniciando geração de faturas mensais...\n');
gerarFaturasMensais();

