#!/usr/bin/env node

/**
 * Script para gerar secrets fortes para produção
 * Uso: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 GERADOR DE SECRETS FORTES - AtenMed\n');
console.log('='.repeat(60));

// Função para gerar secret forte
function generateSecret(length = 64) {
    return crypto.randomBytes(length).toString('hex');
}

// Gerar secrets
const jwtSecret = generateSecret(64);
const sessionSecret = generateSecret(64);
const whatsappVerifyToken = generateSecret(32);

console.log('\n📋 SECRETS GERADOS:\n');

console.log('JWT_SECRET=' + jwtSecret);
console.log('\nSESSION_SECRET=' + sessionSecret);
console.log('\nWHATSAPP_VERIFY_TOKEN=' + whatsappVerifyToken);

console.log('\n' + '='.repeat(60));
console.log('\n✅ IMPORTANTE:');
console.log('   1. Copie estes valores para o arquivo .env');
console.log('   2. NUNCA compartilhe ou commite estes valores');
console.log('   3. Cada ambiente deve ter seus próprios secrets');
console.log('   4. Guarde-os em local seguro (gerenciador de senhas)\n');

// Opção para salvar em arquivo temporário
const fs = require('fs');
const path = require('path');
const tempFile = path.join(__dirname, '..', '.env.secrets.tmp');

const secretsContent = `# SECRETS GERADOS - ${new Date().toISOString()}
# ⚠️ IMPORTANTE: Este arquivo contém secrets! Não commitar no Git!
# Após copiar para .env, exclua este arquivo

JWT_SECRET=${jwtSecret}
SESSION_SECRET=${sessionSecret}
WHATSAPP_VERIFY_TOKEN=${whatsappVerifyToken}
`;

try {
    fs.writeFileSync(tempFile, secretsContent);
    console.log(`💾 Secrets salvos temporariamente em: ${tempFile}`);
    console.log('   ⚠️  Lembre-se de excluir este arquivo após copiar!\n');
} catch (error) {
    console.log('   ⚠️  Não foi possível salvar em arquivo, copie manualmente\n');
}

