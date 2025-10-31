/**
 * Script para testar conexão com MongoDB Atlas
 * 
 * Uso:
 * node scripts/testar-mongodb-atlas.js
 * 
 * OU com senha específica:
 * node scripts/testar-mongodb-atlas.js "sua-senha-aqui"
 */

const mongoose = require('mongoose');
require('dotenv').config();

const USERNAME = 'ianmaxcodeco_atenmed';
const CLUSTER = 'cluster0.fcpsqdo.mongodb.net';
const DATABASE = 'atenmed';

async function testConnection(password) {
    // Codificar caracteres especiais na senha
    const encodedPassword = encodeURIComponent(password);
    
    // Montar string de conexão
    const connectionString = `mongodb+srv://${USERNAME}:${encodedPassword}@${CLUSTER}/${DATABASE}?retryWrites=true&w=majority&appName=Cluster0`;
    
    console.log('\n🔍 Testando conexão com MongoDB Atlas...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Usuário: ${USERNAME}`);
    console.log(`Cluster: ${CLUSTER}`);
    console.log(`Banco: ${DATABASE}`);
    console.log(`Senha testada: ${'*'.repeat(password.length)} (${password.length} caracteres)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
        // Tentar conectar com timeout de 10 segundos
        const connection = await mongoose.connect(connectionString, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });

        console.log('✅ SUCESSO! Conexão estabelecida!');
        console.log(`   Host: ${connection.connection.host}`);
        console.log(`   Database: ${connection.connection.name}`);
        console.log(`   Status: ${connection.connection.readyState === 1 ? 'Conectado' : 'Desconectado'}`);
        
        // Testar uma operação simples
        const collections = await connection.connection.db.listCollections().toArray();
        console.log(`\n📊 Coleções encontradas: ${collections.length}`);
        if (collections.length > 0) {
            console.log('   Primeiras coleções:');
            collections.slice(0, 5).forEach(col => {
                console.log(`   - ${col.name}`);
            });
        }

        // Fechar conexão
        await mongoose.connection.close();
        console.log('\n✅ Teste concluído com sucesso!');
        console.log('\n📝 String de conexão para usar:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(connectionString);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        return true;

    } catch (error) {
        console.error('\n❌ ERRO ao conectar!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (error.message.includes('authentication failed') || error.message.includes('bad auth')) {
            console.error('🔴 Senha incorreta ou usuário não existe');
            console.error('   Erro:', error.message);
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
            console.error('🔴 Erro de DNS - Cluster não encontrado');
            console.error('   Verifique se o cluster está ativo');
        } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
            console.error('🔴 Timeout - Servidor não respondeu');
            console.error('   Verifique sua internet e whitelist de IPs no MongoDB Atlas');
        } else if (error.message.includes('IP')) {
            console.error('🔴 IP não autorizado');
            console.error('   Adicione seu IP na whitelist do MongoDB Atlas');
            console.error('   MongoDB Atlas → Network Access → Add IP Address');
        } else {
            console.error('🔴 Erro desconhecido:', error.message);
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        return false;
    }
}

async function main() {
    let password;
    
    // Verificar se senha foi passada como argumento
    if (process.argv[2]) {
        password = process.argv[2];
    } 
    // Verificar se existe no .env
    else if (process.env.MONGODB_URI) {
        // Tentar extrair senha do MONGODB_URI
        const uriMatch = process.env.MONGODB_URI.match(/mongodb\+srv:\/\/[^:]+:([^@]+)@/);
        if (uriMatch && uriMatch[1] !== '<db_password>' && uriMatch[1] !== '<password>') {
            password = decodeURIComponent(uriMatch[1]);
            console.log('📋 Senha encontrada no .env\n');
        }
    }
    
    // Se não encontrou, pedir ao usuário
    if (!password) {
        console.log('🔐 Teste de Conexão MongoDB Atlas');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\nPor favor, digite a senha para testar:');
        console.log('(A senha não será exibida na tela)\n');
        
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        password = await new Promise((resolve) => {
            rl.question('Senha: ', (answer) => {
                rl.close();
                resolve(answer);
            });
            
            // Esconder senha no terminal (funciona na maioria dos terminais)
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.setEncoding('utf8');
        });
        
        if (!password) {
            console.error('\n❌ Senha não fornecida. Encerrando...\n');
            process.exit(1);
        }
    }
    
    const success = await testConnection(password);
    
    if (success) {
        console.log('✅ Use esta string no GitHub Secret MONGODB_URI\n');
        process.exit(0);
    } else {
        console.log('\n💡 DICAS:');
        console.log('   - Verifique se a senha está correta');
        console.log('   - Se a senha tiver caracteres especiais, eles precisam ser codificados');
        console.log('   - Verifique se o IP está na whitelist do MongoDB Atlas');
        console.log('   - MongoDB Atlas → Network Access → Add IP Address');
        console.log('   - Para desenvolvimento, pode usar: 0.0.0.0/0 (permitir qualquer IP)\n');
        process.exit(1);
    }
}

// Executar
main().catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
});

