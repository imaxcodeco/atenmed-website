/**
 * Script de teste para verificar se o Sentry está configurado corretamente
 * Executar: NODE_ENV=production SENTRY_DSN=xxx node scripts/test-sentry.js
 */

require('dotenv').config({ path: '.env' });

console.log('🧪 Testando configuração do Sentry...\n');

// Verificar se SENTRY_DSN está configurado
if (!process.env.SENTRY_DSN) {
  console.error('❌ SENTRY_DSN não configurado!');
  console.log('\n📝 Configure no .env:');
  console.log('SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx');
  process.exit(1);
}

// Verificar NODE_ENV
if (process.env.NODE_ENV !== 'production') {
  console.warn('⚠️  NODE_ENV não é "production". Sentry pode não iniciar.');
  console.log('💡 Executar: NODE_ENV=production node scripts/test-sentry.js\n');
}

const Sentry = require('@sentry/node');

// Inicializar Sentry
console.log('🔧 Inicializando Sentry...');
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'production',
  sendDefaultPii: true,
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
  ignoreErrors: ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT'],
  beforeSend(event) {
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers['authorization'];
    }
    return event;
  },
});

console.log('✅ Sentry inicializado com sucesso!\n');

// Teste 1: Capturar exceção manualmente
console.log('📤 Teste 1: Capturando exceção manual...');

try {
  // Função intencionalmente indefinida para gerar erro
  // eslint-disable-next-line no-undef
  foo();
} catch (e) {
  console.log('   Erro capturado:', e.message);
  Sentry.captureException(e);
  console.log('   ✅ Exceção enviada para Sentry');
}

// Teste 2: Capturar mensagem
console.log('\n📤 Teste 2: Capturando mensagem...');
Sentry.captureMessage('Teste de configuração do Sentry', {
  level: 'info',
  extra: {
    script: 'test-sentry.js',
    timestamp: new Date().toISOString(),
  },
});
console.log('   ✅ Mensagem enviada para Sentry');

// Dar tempo para Sentry enviar
console.log('\n⏳ Aguardando 3 segundos para envio...');
setTimeout(() => {
  console.log('\n✅ Teste concluído!');
  console.log('\n📊 Verifique no dashboard do Sentry:');
  console.log('   https://sentry.io');
  console.log('\n   Deve aparecer 2 eventos:');
  console.log('   1. Exceção: "foo is not defined"');
  console.log('   2. Mensagem: "Teste de configuração do Sentry"\n');
  process.exit(0);
}, 3000);
