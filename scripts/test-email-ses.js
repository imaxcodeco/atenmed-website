#!/usr/bin/env node

/**
 * Script: Teste de Configuração AWS SES
 * 
 * Testa a configuração do AWS SES:
 * 1. Verifica variáveis de ambiente
 * 2. Testa conexão SMTP
 * 3. Envia email de teste
 * 4. Mostra estatísticas
 * 
 * Uso: node scripts/test-email-ses.js
 */

require('dotenv').config();
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

console.log('\n📧 TESTE DE CONFIGURAÇÃO AWS SES\n');
console.log('='.repeat(60));

// Verificar variáveis de ambiente
console.log('\n1️⃣ Verificando Variáveis de Ambiente:\n');

const requiredVars = {
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: process.env.EMAIL_PORT,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM
};

let hasErrors = false;

for (const [key, value] of Object.entries(requiredVars)) {
    if (value) {
        // Mascarar senha
        if (key === 'EMAIL_PASS') {
            console.log(`   ✅ ${key}: ${'*'.repeat(value.length)}`);
        } else {
            console.log(`   ✅ ${key}: ${value}`);
        }
    } else {
        console.log(`   ❌ ${key}: NÃO CONFIGURADO`);
        hasErrors = true;
    }
}

if (hasErrors) {
    console.log('\n❌ ERRO: Variáveis de ambiente não configuradas!');
    console.log('   Configure as variáveis no arquivo .env antes de continuar.\n');
    process.exit(1);
}

console.log('\n✅ Todas as variáveis estão configuradas\n');

// Testar configuração
console.log('2️⃣ Testando Conexão SMTP:\n');

async function testEmailConfiguration() {
    try {
        // Testar configuração
        const result = await emailService.testEmailConfiguration();
        
        if (result.success) {
            console.log('   ✅ Conexão SMTP estabelecida com sucesso!');
            console.log(`   ✅ Email de teste enviado: ${result.messageId || 'N/A'}\n`);
            
            console.log('='.repeat(60));
            console.log('\n✅ CONFIGURAÇÃO OK!\n');
            console.log('📋 Próximos passos:');
            console.log('   1. Verifique sua caixa de entrada (e spam)');
            console.log('   2. Confirme que o email chegou corretamente');
            console.log('   3. Se ainda está no sandbox, verifique se o email');
            console.log('      de destino foi verificado no SES\n');
            
            return true;
        } else {
            console.log('   ❌ Erro ao testar configuração:');
            console.log(`      ${result.error}\n`);
            
            console.log('🔍 Possíveis causas:');
            console.log('   - Credenciais SMTP incorretas');
            console.log('   - Endpoint SMTP incorreto para a região');
            console.log('   - Problemas de conectividade');
            console.log('   - Ainda no sandbox (envie apenas para emails verificados)');
            console.log('   - Porta/firewall bloqueando conexão\n');
            
            return false;
        }
    } catch (error) {
        console.log('   ❌ Erro inesperado:');
        console.log(`      ${error.message}\n`);
        
        // Sugestões baseadas no erro
        if (error.message.includes('Invalid login')) {
            console.log('💡 DICA: Verifique EMAIL_USER e EMAIL_PASS no .env');
            console.log('   A senha SMTP só é exibida UMA VEZ ao criar.\n');
        } else if (error.message.includes('timeout')) {
            console.log('💡 DICA: Verifique EMAIL_HOST (endpoint correto para a região)');
            console.log('   Exemplo: email-smtp.sa-east-1.amazonaws.com\n');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.log('💡 DICA: Verifique EMAIL_PORT (587 ou 465)');
            console.log('   E se o firewall permite conexão SMTP\n');
        }
        
        return false;
    }
}

// Executar teste
testEmailConfiguration()
    .then(success => {
        if (!success) {
            process.exit(1);
        }
    })
    .catch(error => {
        logger.error('Erro no teste de email:', error);
        console.log('\n❌ Erro ao executar teste\n');
        process.exit(1);
    });

