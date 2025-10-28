/**
 * Teste de Recebimento de Mensagem via Webhook
 * Simula o Meta enviando uma mensagem para o webhook
 */

const axios = require('axios');
const chalk = require('chalk');

const BASE_URL = process.env.TEST_URL || 'https://atenmed.com.br';

console.log('\n' + '='.repeat(70));
console.log(chalk.bold.cyan('  🧪 TESTE: Recebimento de Mensagem via Webhook'));
console.log('='.repeat(70) + '\n');

async function testWebhookMessage() {
    console.log(chalk.bold('📨 Simulando mensagem recebida do WhatsApp...\n'));

    // Payload exatamente como o Meta envia
    const webhookPayload = {
        object: 'whatsapp_business_account',
        entry: [
            {
                id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
                changes: [
                    {
                        value: {
                            messaging_product: 'whatsapp',
                            metadata: {
                                display_phone_number: '15555551234',
                                phone_number_id: 'YOUR_PHONE_NUMBER_ID'
                            },
                            contacts: [
                                {
                                    profile: {
                                        name: 'João Teste'
                                    },
                                    wa_id: '5511999999999'
                                }
                            ],
                            messages: [
                                {
                                    from: '5511999999999',
                                    id: 'wamid.' + Date.now(),
                                    timestamp: Math.floor(Date.now() / 1000).toString(),
                                    type: 'text',
                                    text: {
                                        body: 'Olá! Gostaria de agendar uma consulta.'
                                    }
                                }
                            ]
                        },
                        field: 'messages'
                    }
                ]
            }
        ]
    };

    try {
        console.log(chalk.gray('URL: ') + `${BASE_URL}/api/whatsapp/webhook`);
        console.log(chalk.gray('Payload: ') + JSON.stringify(webhookPayload, null, 2).substring(0, 200) + '...\n');

        const response = await axios.post(
            `${BASE_URL}/api/whatsapp/webhook`,
            webhookPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Meta-WhatsApp-Webhook-Test'
                }
            }
        );

        if (response.status === 200) {
            console.log(chalk.green.bold('✅ SUCESSO!'));
            console.log(chalk.green('   Webhook aceitou a mensagem simulada\n'));
            
            console.log(chalk.bold('📋 Próximos passos:'));
            console.log('   1. Verifique os logs do servidor para confirmar o processamento');
            console.log('   2. Envie uma mensagem REAL do WhatsApp para testar');
            console.log('   3. Monitore os logs: tail -f logs/combined.log\n');
            
            console.log(chalk.bold('🔍 Como verificar nos logs:'));
            console.log(chalk.gray('   ssh -i "C:\\Users\\Ian_1\\Documents\\AtenMed\\site-atenmed.pem" ubuntu@3.129.206.231'));
            console.log(chalk.gray('   tail -f /var/www/atenmed/logs/combined.log\n'));
            
            console.log(chalk.bold('📝 O que você deve ver:'));
            console.log(chalk.gray('   📬 Webhook recebido: 1 entradas'));
            console.log(chalk.gray('   📨 Processando mensagem de 5511999999999'));
            console.log(chalk.gray('   ✅ Mensagem processada\n'));
            
            return true;
        }
    } catch (error) {
        if (error.response) {
            if (error.response.status === 200) {
                console.log(chalk.green.bold('✅ SUCESSO!'));
                console.log(chalk.green('   Webhook respondeu 200 OK\n'));
                return true;
            } else {
                console.log(chalk.red.bold('❌ ERRO'));
                console.log(chalk.red(`   Status: ${error.response.status}`));
                console.log(chalk.red(`   Resposta: ${JSON.stringify(error.response.data)}\n`));
                return false;
            }
        } else {
            console.log(chalk.red.bold('❌ ERRO DE CONEXÃO'));
            console.log(chalk.red(`   ${error.message}\n`));
            return false;
        }
    }
}

// Executar teste
testWebhookMessage()
    .then(success => {
        console.log('='.repeat(70));
        if (success) {
            console.log(chalk.green.bold('  🎉 TESTE CONCLUÍDO COM SUCESSO!'));
            console.log(chalk.green('  O webhook está pronto para receber mensagens!\n'));
            process.exit(0);
        } else {
            console.log(chalk.red.bold('  ❌ TESTE FALHOU'));
            console.log(chalk.yellow('  Verifique a configuração e os logs do servidor.\n'));
            process.exit(1);
        }
    })
    .catch(error => {
        console.error(chalk.red('\n❌ Erro fatal:'));
        console.error(error);
        process.exit(1);
    });

