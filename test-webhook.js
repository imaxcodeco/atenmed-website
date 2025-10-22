#!/usr/bin/env node
/**
 * Script de Teste do Webhook WhatsApp
 * Verifica configuração e testa conectividade
 */

require('dotenv').config();
const axios = require('axios');
const chalk = require('chalk');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
const WEBHOOK_URL = `http://${HOST}:${PORT}/api/whatsapp/webhook`;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || '';

console.log('\n' + '='.repeat(60));
console.log(chalk.bold.cyan('🔍 DIAGNÓSTICO DO WEBHOOK WHATSAPP'));
console.log('='.repeat(60) + '\n');

// Teste 1: Verificar variáveis de ambiente
console.log(chalk.bold('1️⃣  Verificando variáveis de ambiente...\n'));

const checks = [
    { name: 'WHATSAPP_VERIFY_TOKEN', value: process.env.WHATSAPP_VERIFY_TOKEN, required: true },
    { name: 'WHATSAPP_PHONE_ID', value: process.env.WHATSAPP_PHONE_ID, required: true },
    { name: 'WHATSAPP_TOKEN', value: process.env.WHATSAPP_TOKEN, required: true },
    { name: 'WHATSAPP_API_URL', value: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0', required: false }
];

let allConfigured = true;

checks.forEach(check => {
    if (check.value) {
        const displayValue = check.name.includes('TOKEN') || check.name.includes('PHONE')
            ? `${check.value.substring(0, 8)}...`
            : check.value;
        console.log(chalk.green('✅'), `${check.name}:`, chalk.dim(displayValue));
    } else {
        console.log(chalk.red('❌'), `${check.name}:`, chalk.red('NÃO CONFIGURADO'));
        if (check.required) allConfigured = false;
    }
});

console.log('');

if (!allConfigured) {
    console.log(chalk.yellow('⚠️  Configure as variáveis faltantes no arquivo .env\n'));
}

// Teste 2: Token de verificação
console.log(chalk.bold('2️⃣  Token de Verificação:\n'));
console.log(chalk.cyan('   Token configurado:'), chalk.white(VERIFY_TOKEN));
console.log(chalk.cyan('   Comprimento:'), chalk.white(VERIFY_TOKEN.length), 'caracteres');
console.log(chalk.yellow('\n   ⚠️  Este token DEVE ser EXATAMENTE o mesmo na interface do Meta!\n'));

// Teste 3: Testar servidor local
console.log(chalk.bold('3️⃣  Testando servidor local...\n'));

const testWebhook = async () => {
    try {
        const testChallenge = 'test_challenge_12345';
        const url = `${WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=${testChallenge}`;
        
        console.log(chalk.dim('   URL de teste:'), chalk.dim(url));
        console.log('');
        
        const response = await axios.get(url, { timeout: 5000 });
        
        if (response.data === testChallenge) {
            console.log(chalk.green('✅ SUCESSO!'), 'Webhook respondeu corretamente!');
            console.log(chalk.green('   Resposta:'), chalk.white(response.data));
        } else {
            console.log(chalk.red('❌ ERRO!'), 'Resposta incorreta do webhook');
            console.log(chalk.red('   Esperado:'), testChallenge);
            console.log(chalk.red('   Recebido:'), response.data);
        }
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log(chalk.red('❌ ERRO!'), 'Servidor não está rodando');
            console.log(chalk.yellow('\n   Inicie o servidor com: npm start\n'));
        } else if (error.response) {
            console.log(chalk.red('❌ ERRO!'), `Status ${error.response.status}`);
            console.log(chalk.red('   Resposta:'), error.response.data);
        } else {
            console.log(chalk.red('❌ ERRO!'), error.message);
        }
    }
};

// Teste 4: Instruções para ngrok
const showNgrokInstructions = () => {
    console.log('\n' + chalk.bold('4️⃣  Para conectar ao WhatsApp (Desenvolvimento):\n'));
    console.log(chalk.cyan('   1. Instale o ngrok:'));
    console.log(chalk.white('      npm install -g ngrok\n'));
    
    console.log(chalk.cyan('   2. Rode o ngrok:'));
    console.log(chalk.white('      ngrok http 3000\n'));
    
    console.log(chalk.cyan('   3. Copie a URL HTTPS fornecida pelo ngrok'));
    console.log(chalk.dim('      Exemplo: https://abc123.ngrok.io\n'));
    
    console.log(chalk.cyan('   4. Configure no Meta Developer:'));
    console.log(chalk.white('      URL de callback: https://abc123.ngrok.io/api/whatsapp/webhook'));
    console.log(chalk.white('      Verificar token:'), chalk.yellow(VERIFY_TOKEN), '\n');
    
    console.log(chalk.cyan('   5. Clique em "Verificar e salvar"\n'));
};

// Teste 5: Instruções para produção
const showProductionInstructions = () => {
    console.log(chalk.bold('📦 Para Produção (AWS/VPS):\n'));
    console.log(chalk.cyan('   URL de callback:'), chalk.white('https://atenmed.com.br/api/whatsapp/webhook'));
    console.log(chalk.cyan('   Verificar token:'), chalk.yellow(VERIFY_TOKEN));
    console.log(chalk.dim('\n   ⚠️  Certifique-se de que:'));
    console.log(chalk.dim('      • Servidor está rodando'));
    console.log(chalk.dim('      • SSL/HTTPS está configurado'));
    console.log(chalk.dim('      • Porta 443 está aberta'));
    console.log(chalk.dim('      • Arquivo .env está configurado corretamente\n'));
};

// Executar testes
(async () => {
    await testWebhook();
    showNgrokInstructions();
    showProductionInstructions();
    
    console.log('='.repeat(60));
    console.log(chalk.bold.green('✨ Diagnóstico completo!\n'));
    
    console.log(chalk.bold('📚 Documentação completa:'));
    console.log(chalk.cyan('   SOLUCAO-WEBHOOK-WHATSAPP.md\n'));
    
    console.log(chalk.bold('🆘 Precisa de ajuda?'));
    console.log(chalk.cyan('   http://localhost:3000/api/whatsapp/debug-webhook\n'));
    
    console.log('='.repeat(60) + '\n');
})();



