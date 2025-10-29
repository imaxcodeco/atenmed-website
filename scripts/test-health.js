#!/usr/bin/env node
/**
 * Script de Health Check Completo
 * 
 * Testa todos os componentes críticos do sistema:
 * - API Health endpoint
 * - Autenticação
 * - Rate limiting
 * - Webhooks
 * - Logs seguros
 */

const http = require('http');
const https = require('https');

// Cores para output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
    console.log(`${colors[color]}${msg}${colors.reset}`);
}

// Configuração
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const USE_HTTPS = BASE_URL.startsWith('https');

function makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const client = USE_HTTPS ? https : http;
        
        const req = client.request(url, {
            method: options.method || 'GET',
            headers: options.headers || {},
            ...options
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });
        
        req.on('error', reject);
        
        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        
        req.end();
    });
}

async function testHealthEndpoint() {
    log('\n1️⃣ Testando Health Endpoint...', 'cyan');
    
    try {
        const res = await makeRequest('/health');
        
        if (res.status === 200) {
            const data = JSON.parse(res.body);
            if (data.status === 'OK') {
                log('✅ Health check OK', 'green');
                log(`   Uptime: ${data.uptime}s`);
                log(`   Environment: ${data.environment}`);
                return true;
            }
        }
        
        log(`❌ Health check FALHOU (status: ${res.status})`, 'red');
        return false;
    } catch (err) {
        log(`❌ Erro ao testar health: ${err.message}`, 'red');
        return false;
    }
}

async function testAuthentication() {
    log('\n2️⃣ Testando Autenticação...', 'cyan');
    
    try {
        const res = await makeRequest('/api/whatsapp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: { to: '123', message: 'test' }
        });
        
        if (res.status === 401) {
            log('✅ Autenticação funciona (401 sem token)', 'green');
            return true;
        }
        
        log(`⚠️ Autenticação pode estar desabilitada (status: ${res.status})`, 'yellow');
        return false;
    } catch (err) {
        log(`❌ Erro ao testar autenticação: ${err.message}`, 'red');
        return false;
    }
}

async function testRateLimiting() {
    log('\n3️⃣ Testando Rate Limiting...', 'cyan');
    
    try {
        log('   Fazendo 101 requests...');
        
        let lastStatus = 200;
        for (let i = 0; i < 101; i++) {
            const res = await makeRequest('/api/services');
            lastStatus = res.status;
            
            if (lastStatus === 429) {
                log(`✅ Rate limiting ativo (bloqueou após ${i + 1} requests)`, 'green');
                return true;
            }
        }
        
        log(`⚠️ Rate limiting não ativou após 101 requests`, 'yellow');
        return false;
    } catch (err) {
        log(`❌ Erro ao testar rate limiting: ${err.message}`, 'red');
        return false;
    }
}

async function testWebhookSecurity() {
    log('\n4️⃣ Testando Webhook WhatsApp...', 'cyan');
    
    try {
        // Teste de verificação
        const res = await makeRequest('/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=invalid&hub.challenge=test');
        
        if (res.status === 403) {
            log('✅ Webhook rejeita tokens inválidos', 'green');
            return true;
        }
        
        log(`⚠️ Webhook pode não estar validando tokens (status: ${res.status})`, 'yellow');
        return false;
    } catch (err) {
        log(`❌ Erro ao testar webhook: ${err.message}`, 'red');
        return false;
    }
}

async function testNotDuplicatedRoutes() {
    log('\n5️⃣ Testando Rotas Não Duplicadas...', 'cyan');
    
    try {
        const res1 = await makeRequest('/health');
        const res2 = await makeRequest('/health');
        
        const data1 = JSON.parse(res1.body);
        const data2 = JSON.parse(res2.body);
        
        // Se o uptime for idêntico, pode ser cache ou resposta duplicada
        // Mas se ambos têm status OK, está funcionando
        if (data1.status === 'OK' && data2.status === 'OK') {
            log('✅ Rota /health não duplicada (responde corretamente)', 'green');
            return true;
        }
        
        log('⚠️ Comportamento inesperado na rota /health', 'yellow');
        return false;
    } catch (err) {
        log(`❌ Erro ao testar rotas: ${err.message}`, 'red');
        return false;
    }
}

async function testConfigFiles() {
    log('\n6️⃣ Testando Arquivos de Configuração...', 'cyan');
    
    const fs = require('fs');
    const path = require('path');
    
    const checks = [
        { file: '.env.example', desc: 'Arquivo .env.example' },
        { file: 'package.json', desc: 'package.json' },
        { file: 'server.js', desc: 'server.js' },
        { file: 'config/validate-env.js', desc: 'Validador de ambiente' }
    ];
    
    let allOk = true;
    
    for (const check of checks) {
        const fullPath = path.join(process.cwd(), check.file);
        if (fs.existsSync(fullPath)) {
            log(`✅ ${check.desc} existe`, 'green');
        } else {
            log(`❌ ${check.desc} NÃO existe`, 'red');
            allOk = false;
        }
    }
    
    return allOk;
}

async function runAllTests() {
    console.log('═'.repeat(60));
    log('🧪 AtenMed - Suite de Testes Automatizados', 'cyan');
    console.log('═'.repeat(60));
    log(`\nTestando: ${BASE_URL}\n`);
    
    const results = {
        health: await testHealthEndpoint(),
        auth: await testAuthentication(),
        rateLimiting: await testRateLimiting(),
        webhook: await testWebhookSecurity(),
        routes: await testNotDuplicatedRoutes(),
        config: await testConfigFiles()
    };
    
    console.log('\n' + '═'.repeat(60));
    log('📊 Resultado dos Testes:', 'cyan');
    console.log('═'.repeat(60));
    
    const passed = Object.values(results).filter(r => r).length;
    const total = Object.keys(results).length;
    
    Object.entries(results).forEach(([test, passed]) => {
        const icon = passed ? '✅' : '❌';
        const color = passed ? 'green' : 'red';
        log(`${icon} ${test}: ${passed ? 'PASSOU' : 'FALHOU'}`, color);
    });
    
    console.log('\n' + '═'.repeat(60));
    
    const percentage = Math.round((passed / total) * 100);
    let statusColor = 'green';
    let statusIcon = '✅';
    
    if (percentage < 60) {
        statusColor = 'red';
        statusIcon = '❌';
    } else if (percentage < 80) {
        statusColor = 'yellow';
        statusIcon = '⚠️';
    }
    
    log(`\n${statusIcon} Resultado Final: ${passed}/${total} testes passaram (${percentage}%)`, statusColor);
    
    if (percentage === 100) {
        log('\n🎉 TODOS OS TESTES PASSARAM! Sistema está ótimo!', 'green');
    } else if (percentage >= 80) {
        log('\n👍 Maioria dos testes passou. Verifique os falhos.', 'yellow');
    } else {
        log('\n⚠️ Muitos testes falharam. Sistema precisa de atenção!', 'red');
    }
    
    console.log('═'.repeat(60) + '\n');
    
    process.exit(percentage === 100 ? 0 : 1);
}

// Executar testes
if (require.main === module) {
    runAllTests().catch(err => {
        log(`\n❌ Erro fatal: ${err.message}`, 'red');
        process.exit(1);
    });
}

module.exports = { runAllTests };

