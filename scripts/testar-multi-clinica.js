/**
 * Script de Teste - Sistema Multi-Clínica
 * Verifica se o sistema está identificando clínicas corretamente
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Clinic = require('../models/Clinic');
const Doctor = require('../models/Doctor');
const Specialty = require('../models/Specialty');

// Cores para terminal
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testarIdentificacaoClinica(numero) {
    try {
        log('\n=== TESTANDO IDENTIFICAÇÃO DE CLÍNICA ===', 'cyan');
        log(`Número testado: ${numero}`, 'blue');
        
        // Limpar número (igual ao sistema faz)
        const cleanNumber = numero.replace(/\D/g, '');
        log(`Número limpo: ${cleanNumber}`, 'blue');
        
        // Buscar clínica
        const clinic = await Clinic.findOne({
            'contact.whatsapp': new RegExp(cleanNumber, 'i'),
            active: true
        });
        
        if (clinic) {
            log('\n✅ CLÍNICA IDENTIFICADA!', 'green');
            log(`Nome: ${clinic.name}`, 'green');
            log(`ID: ${clinic._id}`, 'green');
            log(`WhatsApp cadastrado: ${clinic.contact?.whatsapp}`, 'green');
            log(`Status: ${clinic.active ? 'Ativa' : 'Inativa'}`, 'green');
            log(`Bot habilitado: ${clinic.whatsappBot?.enabled ? 'Sim' : 'Não'}`, 'green');
            
            // Buscar médicos da clínica
            const doctors = await Doctor.find({ 
                clinic: clinic._id, 
                active: true 
            }).populate('specialties');
            
            log(`\nMédicos vinculados: ${doctors.length}`, 'blue');
            doctors.forEach((doc, i) => {
                log(`  ${i + 1}. ${doc.name}`, 'blue');
                if (doc.specialties && doc.specialties.length > 0) {
                    doc.specialties.forEach(spec => {
                        log(`     - ${spec.name}`, 'cyan');
                    });
                }
            });
            
            return clinic;
        } else {
            log('\n❌ CLÍNICA NÃO ENCONTRADA!', 'red');
            log('\nPossíveis causas:', 'yellow');
            log('1. Número não cadastrado no sistema', 'yellow');
            log('2. Clínica está inativa', 'yellow');
            log('3. Formato do número diferente', 'yellow');
            return null;
        }
        
    } catch (error) {
        log(`\n❌ ERRO: ${error.message}`, 'red');
        throw error;
    }
}

async function listarTodasClinicas() {
    try {
        log('\n=== TODAS AS CLÍNICAS CADASTRADAS ===', 'cyan');
        
        const clinics = await Clinic.find().sort({ name: 1 });
        
        if (clinics.length === 0) {
            log('Nenhuma clínica cadastrada!', 'red');
            return;
        }
        
        log(`\nTotal: ${clinics.length} clínica(s)\n`, 'blue');
        
        for (const clinic of clinics) {
            const doctors = await Doctor.countDocuments({ 
                clinic: clinic._id, 
                active: true 
            });
            
            const status = clinic.active ? '✅' : '❌';
            const bot = clinic.whatsappBot?.enabled ? '🤖' : '🚫';
            
            log(`${status} ${bot} ${clinic.name}`, clinic.active ? 'green' : 'red');
            log(`   WhatsApp: ${clinic.contact?.whatsapp || 'Não cadastrado'}`, 'cyan');
            log(`   Médicos: ${doctors}`, 'blue');
            log(`   ID: ${clinic._id}`, 'yellow');
            log('');
        }
        
    } catch (error) {
        log(`❌ ERRO: ${error.message}`, 'red');
        throw error;
    }
}

async function simularWebhook(numeroClinica, numeroCliente, mensagem) {
    try {
        log('\n=== SIMULANDO RECEBIMENTO DE WEBHOOK ===', 'cyan');
        log(`Número da clínica (recebe): ${numeroClinica}`, 'blue');
        log(`Número do cliente (envia): ${numeroCliente}`, 'blue');
        log(`Mensagem: "${mensagem}"`, 'blue');
        
        // Identificar clínica
        const cleanNumber = numeroClinica.replace(/\D/g, '');
        const clinic = await Clinic.findOne({
            'contact.whatsapp': new RegExp(cleanNumber, 'i'),
            active: true
        });
        
        if (!clinic) {
            log('\n❌ ERRO: Clínica não identificada!', 'red');
            return;
        }
        
        log(`\n✅ Clínica identificada: ${clinic.name}`, 'green');
        
        // Buscar especialidades disponíveis
        const doctors = await Doctor.find({ 
            clinic: clinic._id, 
            active: true 
        }).distinct('specialties');
        
        const specialties = await Specialty.find({
            _id: { $in: doctors },
            active: true
        }).sort('name');
        
        log(`\nEspecialidades disponíveis: ${specialties.length}`, 'blue');
        specialties.forEach((spec, i) => {
            log(`  ${i + 1}. ${spec.name}`, 'cyan');
        });
        
        // Simular resposta do bot
        log('\n📱 RESPOSTA DO BOT:', 'cyan');
        log('─'.repeat(50), 'cyan');
        log(`Boa tarde! Tudo bem? Aqui e da *${clinic.name}*!`, 'green');
        log(`Como posso te ajudar hoje?\n`, 'green');
        log(`1 Quero marcar uma consulta`, 'green');
        log(`2 Ver minhas consultas agendadas`, 'green');
        log(`3 Preciso cancelar uma consulta`, 'green');
        log(`4 Entrar na lista de espera`, 'green');
        log(`5 Falar com alguem da equipe\n`, 'green');
        log(`E so digitar o numero da opcao!`, 'green');
        log('─'.repeat(50), 'cyan');
        
    } catch (error) {
        log(`❌ ERRO: ${error.message}`, 'red');
        throw error;
    }
}

async function verificarConfiguracao() {
    try {
        log('\n=== VERIFICAÇÃO DE CONFIGURAÇÃO ===', 'cyan');
        
        // Verificar variáveis de ambiente
        log('\n📋 Variáveis de Ambiente:', 'blue');
        log(`WHATSAPP_PHONE_ID: ${process.env.WHATSAPP_PHONE_ID ? '✅ Configurado' : '❌ Não configurado'}`, 
            process.env.WHATSAPP_PHONE_ID ? 'green' : 'red');
        log(`WHATSAPP_TOKEN: ${process.env.WHATSAPP_TOKEN ? '✅ Configurado' : '❌ Não configurado'}`, 
            process.env.WHATSAPP_TOKEN ? 'green' : 'red');
        log(`WHATSAPP_VERIFY_TOKEN: ${process.env.WHATSAPP_VERIFY_TOKEN ? '✅ Configurado' : '❌ Não configurado'}`, 
            process.env.WHATSAPP_VERIFY_TOKEN ? 'green' : 'red');
        log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Configurado' : '❌ Não configurado'}`, 
            process.env.GEMINI_API_KEY ? 'green' : 'red');
        
        // Contar registros
        const totalClinics = await Clinic.countDocuments();
        const activeClinics = await Clinic.countDocuments({ active: true });
        const totalDoctors = await Doctor.countDocuments();
        const activeDoctors = await Doctor.countDocuments({ active: true });
        const totalSpecialties = await Specialty.countDocuments();
        
        log('\n📊 Banco de Dados:', 'blue');
        log(`Clínicas: ${activeClinics}/${totalClinics} ativas`, activeClinics > 0 ? 'green' : 'red');
        log(`Médicos: ${activeDoctors}/${totalDoctors} ativos`, activeDoctors > 0 ? 'green' : 'red');
        log(`Especialidades: ${totalSpecialties}`, totalSpecialties > 0 ? 'green' : 'red');
        
        // Verificar clínicas com WhatsApp
        const clinicsWithWhatsApp = await Clinic.countDocuments({ 
            'contact.whatsapp': { $exists: true, $ne: '' },
            active: true
        });
        
        log(`\n📱 Clínicas com WhatsApp configurado: ${clinicsWithWhatsApp}`, 
            clinicsWithWhatsApp > 0 ? 'green' : 'red');
        
    } catch (error) {
        log(`❌ ERRO: ${error.message}`, 'red');
        throw error;
    }
}

async function main() {
    try {
        // Conectar ao MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/atenmed');
        log('✅ Conectado ao MongoDB', 'green');
        
        // Menu de opções
        const args = process.argv.slice(2);
        const comando = args[0];
        
        if (!comando) {
            log('\n📚 USO:', 'cyan');
            log('node scripts/testar-multi-clinica.js [comando] [parametros]', 'yellow');
            log('\nCOMANDOS DISPONÍVEIS:', 'cyan');
            log('  listar                    - Lista todas as clínicas', 'yellow');
            log('  testar [numero]           - Testa identificação de clínica', 'yellow');
            log('  simular [clinica] [cliente] [msg] - Simula webhook completo', 'yellow');
            log('  config                    - Verifica configuração do sistema', 'yellow');
            log('\nEXEMPLOS:', 'cyan');
            log('  node scripts/testar-multi-clinica.js listar', 'green');
            log('  node scripts/testar-multi-clinica.js testar 11987654321', 'green');
            log('  node scripts/testar-multi-clinica.js simular 11987654321 11999999999 "oi"', 'green');
            log('  node scripts/testar-multi-clinica.js config', 'green');
            process.exit(0);
        }
        
        switch (comando) {
            case 'listar':
                await listarTodasClinicas();
                break;
                
            case 'testar':
                if (!args[1]) {
                    log('❌ Informe o número da clínica!', 'red');
                    log('Exemplo: node scripts/testar-multi-clinica.js testar 11987654321', 'yellow');
                    process.exit(1);
                }
                await testarIdentificacaoClinica(args[1]);
                break;
                
            case 'simular':
                if (!args[1] || !args[2]) {
                    log('❌ Informe número da clínica e do cliente!', 'red');
                    log('Exemplo: node scripts/testar-multi-clinica.js simular 11987654321 11999999999 "oi"', 'yellow');
                    process.exit(1);
                }
                await simularWebhook(args[1], args[2], args[3] || 'oi');
                break;
                
            case 'config':
                await verificarConfiguracao();
                break;
                
            default:
                log(`❌ Comando desconhecido: ${comando}`, 'red');
                log('Use sem parâmetros para ver ajuda', 'yellow');
                process.exit(1);
        }
        
        log('\n✅ Teste concluído!', 'green');
        
    } catch (error) {
        log(`\n❌ ERRO FATAL: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        log('MongoDB desconectado', 'yellow');
    }
}

main();

