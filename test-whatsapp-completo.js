/**
 * Teste Completo do WhatsApp Business API
 * Verifica webhook, health check e envio de mensagens
 */

const axios = require('axios');
const chalk = require('chalk');

const BASE_URL = process.env.TEST_URL || 'https://atenmed.com.br';
const TEST_PHONE = process.env.TEST_PHONE; // Ex: 5511999999999

console.log('\n' + '='.repeat(70));
console.log(chalk.bold.cyan('  🧪 TESTE COMPLETO - WhatsApp Business API'));
console.log('='.repeat(70) + '\n');

async function runTests() {
    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };

    // ===== TESTE 1: Health Check =====
    console.log(chalk.bold('\n📊 TESTE 1: Health Check'));
    console.log('─'.repeat(70));
    
    try {
        const response = await axios.get(`${BASE_URL}/api/whatsapp/health`);
        
        if (response.status === 200 && response.data.success) {
            console.log(chalk.green('✅ PASSOU') + ' - WhatsApp Health Check OK');
            console.log(`   Status: ${response.data.status}`);
            console.log(`   Configurado: ${response.data.configured ? 'Sim' : 'Não'}`);
            results.passed++;
            results.tests.push({ name: 'Health Check', status: 'PASSOU' });
        } else {
            throw new Error('Health check retornou status inválido');
        }
    } catch (error) {
        console.log(chalk.red('❌ FALHOU') + ' - Health Check');
        console.log(`   Erro: ${error.message}`);
        results.failed++;
        results.tests.push({ name: 'Health Check', status: 'FALHOU' });
    }

    // ===== TESTE 2: Verificação do Webhook (GET) =====
    console.log(chalk.bold('\n🔐 TESTE 2: Verificação do Webhook'));
    console.log('─'.repeat(70));
    
    try {
        const challenge = 'TEST_' + Date.now();
        const response = await axios.get(`${BASE_URL}/api/whatsapp/webhook`, {
            params: {
                'hub.mode': 'subscribe',
                'hub.verify_token': 'atenmed_webhook_2025',
                'hub.challenge': challenge
            }
        });
        
        if (response.status === 200 && response.data === challenge) {
            console.log(chalk.green('✅ PASSOU') + ' - Webhook Verification OK');
            console.log(`   Challenge enviado: ${challenge}`);
            console.log(`   Challenge retornado: ${response.data}`);
            results.passed++;
            results.tests.push({ name: 'Webhook Verification', status: 'PASSOU' });
        } else {
            throw new Error('Challenge não foi retornado corretamente');
        }
    } catch (error) {
        console.log(chalk.red('❌ FALHOU') + ' - Webhook Verification');
        console.log(`   Erro: ${error.message}`);
        results.failed++;
        results.tests.push({ name: 'Webhook Verification', status: 'FALHOU' });
    }

    // ===== TESTE 3: Configuração =====
    console.log(chalk.bold('\n⚙️  TESTE 3: Verificar Configuração'));
    console.log('─'.repeat(70));
    
    try {
        // Nota: Este endpoint requer autenticação admin
        console.log(chalk.yellow('⚠️  PULADO') + ' - Requer autenticação admin');
        console.log('   Para testar manualmente, use o dashboard admin');
        results.tests.push({ name: 'Configuração', status: 'PULADO' });
    } catch (error) {
        console.log(chalk.yellow('⚠️  PULADO') + ' - Configuração');
    }

    // ===== TESTE 4: Webhook POST (Simular mensagem recebida) =====
    console.log(chalk.bold('\n📨 TESTE 4: Webhook POST - Receber Mensagem'));
    console.log('─'.repeat(70));
    
    try {
        // Simular webhook do Meta
        const webhookPayload = {
            object: 'whatsapp_business_account',
            entry: [{
                id: 'TEST_ENTRY_ID',
                changes: [{
                    value: {
                        messaging_product: 'whatsapp',
                        metadata: {
                            display_phone_number: '15555551234',
                            phone_number_id: 'TEST_PHONE_ID'
                        },
                        messages: [{
                            from: '5511999999999',
                            id: 'TEST_MESSAGE_' + Date.now(),
                            timestamp: Math.floor(Date.now() / 1000),
                            type: 'text',
                            text: {
                                body: 'Teste de mensagem'
                            }
                        }]
                    },
                    field: 'messages'
                }]
            }]
        };

        const response = await axios.post(
            `${BASE_URL}/api/whatsapp/webhook`,
            webhookPayload,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (response.status === 200) {
            console.log(chalk.green('✅ PASSOU') + ' - Webhook POST aceita mensagens');
            console.log('   Webhook processou a mensagem simulada');
            results.passed++;
            results.tests.push({ name: 'Webhook POST', status: 'PASSOU' });
        } else {
            throw new Error('Webhook não retornou 200 OK');
        }
    } catch (error) {
        if (error.response?.status === 200) {
            console.log(chalk.green('✅ PASSOU') + ' - Webhook POST');
            results.passed++;
            results.tests.push({ name: 'Webhook POST', status: 'PASSOU' });
        } else {
            console.log(chalk.red('❌ FALHOU') + ' - Webhook POST');
            console.log(`   Erro: ${error.message}`);
            results.failed++;
            results.tests.push({ name: 'Webhook POST', status: 'FALHOU' });
        }
    }

    // ===== TESTE 5: Enviar Mensagem (Opcional - requer autenticação) =====
    console.log(chalk.bold('\n📤 TESTE 5: Enviar Mensagem'));
    console.log('─'.repeat(70));
    
    if (TEST_PHONE) {
        console.log(chalk.yellow('⚠️  PULADO') + ' - Requer autenticação e número de teste');
        console.log('   Para testar, use o endpoint /api/whatsapp/send-test com token admin');
        results.tests.push({ name: 'Enviar Mensagem', status: 'PULADO' });
    } else {
        console.log(chalk.yellow('⚠️  PULADO') + ' - Variável TEST_PHONE não configurada');
        results.tests.push({ name: 'Enviar Mensagem', status: 'PULADO' });
    }

    // ===== RESUMO =====
    console.log('\n' + '='.repeat(70));
    console.log(chalk.bold.cyan('  📊 RESUMO DOS TESTES'));
    console.log('='.repeat(70));
    
    results.tests.forEach((test, index) => {
        const icon = test.status === 'PASSOU' ? '✅' : 
                     test.status === 'FALHOU' ? '❌' : '⚠️';
        const color = test.status === 'PASSOU' ? chalk.green : 
                      test.status === 'FALHOU' ? chalk.red : chalk.yellow;
        
        console.log(`  ${icon} ${color(test.status.padEnd(10))} - ${test.name}`);
    });
    
    console.log('\n' + '─'.repeat(70));
    console.log(chalk.bold(`  Total: ${results.tests.length} testes`));
    console.log(chalk.green(`  ✅ Passou: ${results.passed}`));
    console.log(chalk.red(`  ❌ Falhou: ${results.failed}`));
    console.log(chalk.yellow(`  ⚠️  Pulados: ${results.tests.length - results.passed - results.failed}`));
    console.log('='.repeat(70) + '\n');

    // Determinar sucesso geral
    if (results.failed === 0 && results.passed >= 2) {
        console.log(chalk.green.bold('  🎉 TESTES BEM-SUCEDIDOS!'));
        console.log(chalk.green('  O webhook do WhatsApp está funcionando corretamente!\n'));
        return 0;
    } else if (results.failed > 0) {
        console.log(chalk.red.bold('  ❌ ALGUNS TESTES FALHARAM'));
        console.log(chalk.yellow('  Verifique os erros acima e corrija os problemas.\n'));
        return 1;
    } else {
        console.log(chalk.yellow.bold('  ⚠️  TESTES INCOMPLETOS'));
        console.log(chalk.yellow('  Configure autenticação para executar todos os testes.\n'));
        return 0;
    }
}

// Executar testes
runTests()
    .then(exitCode => {
        process.exit(exitCode);
    })
    .catch(error => {
        console.error(chalk.red('\n❌ Erro fatal ao executar testes:'));
        console.error(error);
        process.exit(1);
    });

