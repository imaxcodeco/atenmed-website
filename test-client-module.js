// Script de teste para verificar se os módulos de cliente estão funcionando

console.log('🔍 Testando módulos de cliente...\n');

try {
    console.log('1️⃣ Carregando modelo Client...');
    const Client = require('./models/Client');
    console.log('✅ Modelo Client carregado com sucesso\n');
    
    console.log('2️⃣ Carregando rota clients...');
    const clientRoutes = require('./routes/clients');
    console.log('✅ Rota clients carregada com sucesso\n');
    
    console.log('✅ Todos os módulos carregados sem erros!');
    process.exit(0);
    
} catch (error) {
    console.error('❌ Erro ao carregar módulos:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
}

