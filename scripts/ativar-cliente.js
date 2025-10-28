#!/usr/bin/env node
/**
 * Script Auxiliar: Ativação de Cliente AtenMed
 * 
 * Este script facilita o processo de onboarding de novos clientes,
 * criando a clínica e o usuário owner de forma interativa.
 * 
 * Uso: node scripts/ativar-cliente.js
 */

const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

// Models
const Clinic = require('../models/Clinic');
const User = require('../models/User');
const Lead = require('../models/Lead');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Helper para fazer perguntas
function question(prompt) {
    return new Promise(resolve => {
        rl.question(prompt, answer => resolve(answer.trim()));
    });
}

// Cores para output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m'
};

function log(message, color = 'reset') {
    console.log(colors[color] + message + colors.reset);
}

function generateSlug(name) {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

function generatePassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

async function ativarCliente() {
    try {
        // Conectar ao MongoDB
        log('\n🔌 Conectando ao MongoDB...', 'blue');
        await mongoose.connect(process.env.MONGODB_URI);
        log('✅ Conectado com sucesso!\n', 'green');

        log('═════════════════════════════════════════', 'bright');
        log('   🚀 ATIVAÇÃO DE CLIENTE ATENMED', 'bright');
        log('═════════════════════════════════════════\n', 'bright');

        // ==== DADOS DO LEAD ====
        log('📋 PASSO 1: Identificar Lead', 'blue');
        const leadEmail = await question('Email do lead (ou deixe vazio para criar novo): ');
        
        let lead = null;
        if (leadEmail) {
            lead = await Lead.findOne({ email: leadEmail });
            if (lead) {
                log(`✅ Lead encontrado: ${lead.nome}`, 'green');
                log(`   Plano de interesse: ${lead.planoInteresse}`, 'yellow');
                log(`   Clínica: ${lead.nomeClinica || 'Não informado'}`, 'yellow');
            } else {
                log('❌ Lead não encontrado', 'red');
            }
        }

        // ==== DADOS DA CLÍNICA ====
        log('\n📋 PASSO 2: Dados da Clínica', 'blue');
        
        const clinicName = await question(`Nome da clínica${lead?.nomeClinica ? ` [${lead.nomeClinica}]` : ''}: `) || lead?.nomeClinica;
        const suggestedSlug = generateSlug(clinicName);
        const slug = await question(`Slug (URL) [${suggestedSlug}]: `) || suggestedSlug;
        
        // Verificar se slug já existe
        const existingClinic = await Clinic.findOne({ slug });
        if (existingClinic) {
            log(`❌ ERRO: Já existe uma clínica com o slug "${slug}"`, 'red');
            log(`   Clínica existente: ${existingClinic.name}`, 'yellow');
            throw new Error('Slug duplicado');
        }

        const whatsapp = await question(`WhatsApp${lead?.telefone ? ` [${lead.telefone}]` : ''}: `) || lead?.telefone;
        const email = await question(`Email${lead?.email ? ` [${lead.email}]` : ''}: `) || lead?.email;
        const phone = await question('Telefone fixo (opcional): ');
        
        // Endereço
        log('\n📍 Endereço:', 'yellow');
        const street = await question('  Rua: ');
        const number = await question('  Número: ');
        const neighborhood = await question('  Bairro: ');
        const city = await question(`  Cidade${lead?.cidade ? ` [${lead.cidade}]` : ''}: `) || lead?.cidade || 'São Paulo';
        const state = await question('  Estado [SP]: ') || 'SP';
        const zipCode = await question('  CEP: ');

        // Plano
        log('\n💎 Plano:', 'yellow');
        log('  1 - FREE (R$ 0/mês)');
        log('  2 - BASIC (R$ 99/mês)');
        log('  3 - PRO (R$ 249/mês)');
        log('  4 - ENTERPRISE (R$ 599/mês)');
        
        const planChoice = await question(`Escolha o plano [2]: `) || '2';
        const plans = { '1': 'free', '2': 'basic', '3': 'pro', '4': 'enterprise' };
        const plan = plans[planChoice] || 'basic';

        // Criar clínica
        log('\n⏳ Criando clínica no sistema...', 'yellow');
        
        const clinic = new Clinic({
            name: clinicName,
            slug: slug,
            contact: {
                whatsapp: whatsapp,
                email: email,
                phone: phone
            },
            address: {
                street: street,
                number: number,
                neighborhood: neighborhood,
                city: city,
                state: state,
                zipCode: zipCode
            },
            workingHours: {
                start: 8,
                end: 18,
                formatted: 'Seg-Sex: 8h às 18h'
            },
            subscription: {
                plan: plan,
                status: 'active',
                startDate: new Date(),
                autoRenew: true
            },
            branding: {
                primaryColor: '#45a7b1',
                secondaryColor: '#184354',
                accentColor: '#6dd5ed'
            },
            features: {
                onlineBooking: true,
                whatsappBot: plan !== 'free',
                telemedicine: plan === 'pro' || plan === 'enterprise',
                electronicRecords: false
            },
            active: true
        });

        await clinic.save();
        log('✅ Clínica criada com sucesso!', 'green');
        log(`   ID: ${clinic._id}`, 'yellow');
        log(`   URL: https://atenmed.com.br/clinica/${clinic.slug}`, 'yellow');

        // ==== CRIAR USUÁRIO OWNER ====
        log('\n📋 PASSO 3: Criar Usuário Owner', 'blue');
        
        const ownerName = await question(`Nome completo${lead?.nome ? ` [${lead.nome}]` : ''}: `) || lead?.nome;
        const ownerEmail = await question(`Email de login [${email}]: `) || email;
        const tempPassword = generatePassword();
        
        log(`⏳ Criando usuário owner...`, 'yellow');
        
        const user = new User({
            nome: ownerName,
            email: ownerEmail,
            senha: tempPassword,
            role: 'admin',
            telefone: whatsapp,
            departamento: 'administracao',
            ativo: true,
            clinic: clinic._id,  // Vincular à clínica
            clinicRole: 'owner'  // Role de dono da clínica
        });

        await user.save();
        log('✅ Usuário criado e vinculado à clínica!', 'green');

        // ==== ATUALIZAR LEAD ====
        if (lead) {
            log('\n📋 PASSO 4: Atualizar Lead', 'blue');
            
            lead.status = 'fechado';
            lead.clinicaId = clinic._id;
            lead.planoEscolhido = plan;
            lead.convertido = true;
            lead.dataFechamento = new Date();
            
            // Calcular valor mensal
            const planValues = { free: 0, basic: 99, pro: 249, enterprise: 599 };
            lead.valorMensal = planValues[plan];
            
            lead.historico.push({
                tipo: 'outros',
                descricao: `Cliente ativado! Clínica "${clinicName}" criada com sucesso.`,
                usuario: 'sistema',
                data: new Date()
            });
            
            await lead.save();
            log('✅ Lead atualizado!', 'green');
        }

        // ==== RESUMO ====
        log('\n═════════════════════════════════════════', 'bright');
        log('   ✅ ATIVAÇÃO CONCLUÍDA COM SUCESSO!', 'green');
        log('═════════════════════════════════════════\n', 'bright');

        log('📊 RESUMO:', 'blue');
        log(`   Clínica: ${clinic.name}`, 'bright');
        log(`   Plano: ${plan.toUpperCase()} (R$ ${planValues[plan] || 0}/mês)`, 'bright');
        log(`   ID da Clínica: ${clinic._id}`, 'yellow');
        log(`   URL Pública: https://atenmed.com.br/clinica/${clinic.slug}\n`, 'yellow');

        log('🔐 CREDENCIAIS DE ACESSO:', 'blue');
        log(`   URL: https://atenmed.com.br/portal`, 'bright');
        log(`   Login: ${user.email}`, 'bright');
        log(`   Senha temporária: ${tempPassword}`, 'red');
        log(`   ⚠️ ANOTE ESTA SENHA! Não será exibida novamente.\n`, 'yellow');

        log('📋 PRÓXIMOS PASSOS:', 'blue');
        log('   1. Enviar email de boas-vindas com as credenciais');
        log('   2. Criar e enviar primeira fatura');
        log('   3. Configurar WhatsApp Business (se aplicável)');
        log('   4. Configurar Google Calendar (se aplicável)');
        log('   5. Agendar call de onboarding');
        log('   6. Testar agendamento na página pública\n');

        log('📄 Consulte o manual completo em: docs/ONBOARDING-MANUAL.md\n', 'yellow');

        // Oferecer gerar email de boas-vindas
        const generateEmail = await question('Deseja gerar o email de boas-vindas agora? (s/n): ');
        
        if (generateEmail.toLowerCase() === 's') {
            log('\n📧 EMAIL DE BOAS-VINDAS:', 'blue');
            log('════════════════════════════════════════════════════════\n', 'bright');
            
            const emailTemplate = `
Assunto: 🎉 Bem-vindo ao AtenMed! Suas credenciais de acesso

Olá Dr(a). ${ownerName},

Sua clínica está ativa no AtenMed! 🚀

📌 SEUS DADOS DE ACESSO:
━━━━━━━━━━━━━━━━━━━━━━
🌐 URL: https://atenmed.com.br/portal
📧 Login: ${user.email}
🔑 Senha temporária: ${tempPassword}

⚠️ IMPORTANTE: Altere sua senha no primeiro acesso!

━━━━━━━━━━━━━━━━━━━━━━

📱 SUA PÁGINA PÚBLICA:
https://atenmed.com.br/clinica/${clinic.slug}

Compartilhe este link com seus pacientes!

━━━━━━━━━━━━━━━━━━━━━━

✅ O QUE ESTÁ ATIVO:
• Agendamento online 24/7
${plan !== 'free' ? '• WhatsApp automatizado' : ''}
${plan !== 'free' ? '• Lembretes automáticos' : ''}
${plan !== 'free' ? '• Google Calendar sincronizado' : ''}
• Página personalizada

━━━━━━━━━━━━━━━━━━━━━━

📚 PRÓXIMOS PASSOS:
1. Fazer login e trocar senha
2. Adicionar logo e personalizar cores
3. Cadastrar médicos e especialidades
4. Testar um agendamento
5. Compartilhar link nas redes sociais

━━━━━━━━━━━━━━━━━━━━━━

💰 FATURA:
Plano: ${plan.toUpperCase()} - R$ ${planValues[plan] || 0}/mês
Vencimento: ${new Date(new Date().setDate(new Date().getDate() + 10)).toLocaleDateString('pt-BR')}

━━━━━━━━━━━━━━━━━━━━━━

💬 SUPORTE:
📱 WhatsApp: (11) 99999-9999
📧 Email: suporte@atenmed.com.br
🕐 Horário: Seg-Sex, 9h-18h

Qualquer dúvida, estamos à disposição!

Bem-vindo à família AtenMed! 🏥❤️

Abraços,
Equipe AtenMed
            `.trim();
            
            log(emailTemplate, 'bright');
            log('\n════════════════════════════════════════════════════════\n', 'bright');
            
            log('📋 Copie o email acima e envie para: ' + ownerEmail, 'yellow');
        }

    } catch (error) {
        log('\n❌ ERRO: ' + error.message, 'red');
        console.error(error);
    } finally {
        await mongoose.connection.close();
        rl.close();
        log('\n👋 Processo finalizado.\n', 'blue');
    }
}

// Rodar script
log('\n🚀 Iniciando processo de ativação...\n', 'bright');
ativarCliente();

