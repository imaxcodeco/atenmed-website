/**
 * Script para Cadastrar Clínica com WhatsApp
 * Uso: node scripts/cadastrar-clinica-whatsapp.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const Clinic = require('../models/Clinic');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

function limparNumero(numero) {
    // Remove tudo que não é número
    return numero.replace(/\D/g, '');
}

function validarNumero(numero) {
    const limpo = limparNumero(numero);
    
    // Deve ter pelo menos 12 dígitos (55 + DDD + número)
    if (limpo.length < 12) {
        return { valid: false, error: 'Número muito curto (mínimo: 55 + DDD + número)' };
    }
    
    // Deve começar com 55 (Brasil)
    if (!limpo.startsWith('55')) {
        return { valid: false, error: 'Número deve começar com código do país (55)' };
    }
    
    return { valid: true, numero: limpo };
}

async function cadastrarClinica() {
    try {
        console.log('\n╔══════════════════════════════════════════════════════════╗');
        console.log('║                                                          ║');
        console.log('║    🏥 CADASTRAR CLÍNICA COM WHATSAPP 🏥                 ║');
        console.log('║                                                          ║');
        console.log('╚══════════════════════════════════════════════════════════╝\n');

        // Conectar ao banco
        console.log('📡 Conectando ao banco de dados...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado!\n');

        // Coletar informações
        console.log('📋 Preencha os dados da clínica:\n');

        const name = await question('Nome da clínica: ');
        if (!name) {
            throw new Error('Nome é obrigatório');
        }

        const phone = await question('Telefone fixo (ex: 11 3333-4444): ');
        const email = await question('Email: ');
        
        let whatsappNumero;
        while (true) {
            const whatsappInput = await question('Número WhatsApp (ex: 11 98765-4321): ');
            const validacao = validarNumero(whatsappInput);
            
            if (validacao.valid) {
                whatsappNumero = validacao.numero;
                console.log(`✅ Número validado: ${whatsappNumero}\n`);
                break;
            } else {
                console.log(`❌ ${validacao.error}`);
                console.log('💡 Formato aceito: (11) 98765-4321 ou 5511987654321\n');
            }
        }

        const website = await question('Website (opcional): ');
        const street = await question('Rua: ');
        const number = await question('Número: ');
        const neighborhood = await question('Bairro: ');
        const city = await question('Cidade: ');
        const state = await question('Estado (ex: SP): ');
        const zipCode = await question('CEP: ');

        console.log('\n⏰ Horário de funcionamento:');
        const startHour = await question('Horário de abertura (ex: 8): ') || '8';
        const endHour = await question('Horário de fechamento (ex: 18): ') || '18';

        // Confirmar
        console.log('\n📊 RESUMO:\n');
        console.log(`Nome: ${name}`);
        console.log(`WhatsApp: ${whatsappNumero}`);
        console.log(`Email: ${email}`);
        console.log(`Telefone: ${phone}`);
        console.log(`Endereço: ${street}, ${number} - ${neighborhood}`);
        console.log(`Cidade: ${city}/${state}`);
        console.log(`Horário: ${startHour}h às ${endHour}h\n`);

        const confirma = await question('Confirmar cadastro? (s/n): ');
        
        if (confirma.toLowerCase() !== 's' && confirma.toLowerCase() !== 'sim') {
            console.log('\n❌ Cadastro cancelado.');
            process.exit(0);
        }

        // Criar clínica
        console.log('\n💾 Salvando clínica...');

        const clinic = new Clinic({
            name: name,
            slug: name
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-'),
            contact: {
                phone: phone,
                email: email,
                whatsapp: whatsappNumero,
                website: website
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
                start: parseInt(startHour),
                end: parseInt(endHour)
            },
            features: {
                onlineBooking: true,
                whatsappBot: true,
                telemedicine: false,
                electronicRecords: false
            },
            active: true
        });

        await clinic.save();

        console.log('\n✅ CLÍNICA CADASTRADA COM SUCESSO!\n');
        console.log(`ID: ${clinic._id}`);
        console.log(`Nome: ${clinic.name}`);
        console.log(`WhatsApp: ${clinic.contact.whatsapp}`);
        console.log(`Slug: ${clinic.slug}`);
        console.log(`URL Pública: /clinica/${clinic.slug}\n`);

        console.log('🎉 Próximos passos:');
        console.log('1. Cadastre médicos vinculados a esta clínica');
        console.log('2. Cadastre especialidades');
        console.log('3. Teste enviando "oi" para o número WhatsApp');
        console.log(`4. Verifique os logs: tail -f logs/combined.log\n`);

    } catch (error) {
        console.error('\n❌ ERRO:', error.message);
        console.error(error);
    } finally {
        rl.close();
        await mongoose.connection.close();
        process.exit(0);
    }
}

// Executar
cadastrarClinica();

