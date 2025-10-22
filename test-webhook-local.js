#!/usr/bin/env node
/**
 * Teste Rápido do Webhook WhatsApp - Local
 * Verifica se o webhook está funcionando corretamente
 */

require('dotenv').config();
const axios = require('axios');

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || '';

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║        🧪 TESTE DO WEBHOOK WHATSAPP - VERSÃO SIMPLES          ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

async function testWebhook() {
    const testChallenge = 'TESTE_OK_' + Date.now();
    const url = `http://localhost:${PORT}/api/whatsapp/webhook`;
    const params = {
        'hub.mode': 'subscribe',
        'hub.verify_token': VERIFY_TOKEN,
        'hub.challenge': testChallenge
    };

    console.log('📋 Configuração do Teste:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`   URL:           ${url}`);
    console.log(`   Token:         ${VERIFY_TOKEN}`);
    console.log(`   Challenge:     ${testChallenge}`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔄 Enviando requisição...\n');

    try {
        const response = await axios.get(url, {
            params,
            timeout: 5000,
            validateStatus: () => true // Aceitar qualquer status
        });

        console.log('📥 Resposta Recebida:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log(`   Status:        ${response.status} ${getStatusEmoji(response.status)}`);
        console.log(`   Resposta:      ${response.data}`);
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Verificar resultado
        if (response.status === 200 && response.data === testChallenge) {
            console.log('✅ SUCESSO! Webhook está funcionando corretamente!\n');
            console.log('╔════════════════════════════════════════════════════════════════╗');
            console.log('║                     ✅ TESTE APROVADO                          ║');
            console.log('╚════════════════════════════════════════════════════════════════╝\n');
            console.log('👉 Próximos passos:');
            console.log('   1. Faça deploy no servidor AWS');
            console.log('   2. Configure no Meta Developer');
            console.log('   3. URL: https://atenmed.com.br/api/whatsapp/webhook');
            console.log(`   4. Token: ${VERIFY_TOKEN}\n`);
            process.exit(0);
        } else if (response.status === 403) {
            console.log('❌ ERRO: 403 FORBIDDEN\n');
            console.log('╔════════════════════════════════════════════════════════════════╗');
            console.log('║                    ❌ PROBLEMA ENCONTRADO                      ║');
            console.log('╚════════════════════════════════════════════════════════════════╝\n');
            console.log('Possíveis causas:');
            console.log('   • Rate limiter bloqueando o webhook');
            console.log('   • Sanitização XSS modificando parâmetros');
            console.log('   • CORS bloqueando requisições');
            console.log('   • Token incorreto ou não configurado\n');
            console.log('💡 Solução:');
            console.log('   Leia: SOLUCAO-FORBIDDEN-WEBHOOK.md\n');
            process.exit(1);
        } else if (response.status === 500) {
            console.log('❌ ERRO: 500 INTERNAL SERVER ERROR\n');
            console.log('╔════════════════════════════════════════════════════════════════╗');
            console.log('║                  ❌ ERRO NO SERVIDOR                           ║');
            console.log('╚════════════════════════════════════════════════════════════════╝\n');
            console.log('   Verifique os logs do servidor para mais detalhes.\n');
            console.log('   Comando: npm run logs\n');
            process.exit(1);
        } else {
            console.log(`❌ ERRO: Status ${response.status}\n`);
            console.log('╔════════════════════════════════════════════════════════════════╗');
            console.log('║                    ❌ RESPOSTA INESPERADA                      ║');
            console.log('╚════════════════════════════════════════════════════════════════╝\n');
            console.log(`   Esperado: 200 ${testChallenge}`);
            console.log(`   Recebido: ${response.status} ${response.data}\n`);
            process.exit(1);
        }

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('❌ ERRO: Servidor não está rodando\n');
            console.log('╔════════════════════════════════════════════════════════════════╗');
            console.log('║                  ❌ SERVIDOR OFFLINE                           ║');
            console.log('╚════════════════════════════════════════════════════════════════╝\n');
            console.log('💡 Solução:');
            console.log('   Inicie o servidor com: npm start\n');
            console.log(`   O servidor deve estar rodando na porta ${PORT}\n`);
            process.exit(1);
        } else if (error.code === 'ETIMEDOUT') {
            console.log('❌ ERRO: Timeout\n');
            console.log('╔════════════════════════════════════════════════════════════════╗');
            console.log('║                     ❌ TIMEOUT                                 ║');
            console.log('╚════════════════════════════════════════════════════════════════╝\n');
            console.log('   O servidor não respondeu em 5 segundos.\n');
            process.exit(1);
        } else {
            console.log(`❌ ERRO: ${error.message}\n`);
            console.log('╔════════════════════════════════════════════════════════════════╗');
            console.log('║                     ❌ ERRO DESCONHECIDO                       ║');
            console.log('╚════════════════════════════════════════════════════════════════╝\n');
            console.log('Detalhes:', error);
            console.log('');
            process.exit(1);
        }
    }
}

function getStatusEmoji(status) {
    if (status === 200) return '✅';
    if (status === 403) return '🚫';
    if (status === 404) return '❓';
    if (status === 500) return '💥';
    return '⚠️';
}

// Executar teste
testWebhook();


