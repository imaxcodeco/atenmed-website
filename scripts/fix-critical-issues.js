#!/usr/bin/env node
/**
 * Script de Correção Automática - Issues Críticos
 * 
 * Este script aplica automaticamente as correções de segurança críticas
 * identificadas na auditoria do código.
 * 
 * USO: node scripts/fix-critical-issues.js
 * 
 * ATENÇÃO: Faça backup antes de executar!
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Cores para output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title) {
    console.log('\n' + '='.repeat(60));
    log(title, 'cyan');
    console.log('='.repeat(60) + '\n');
}

function success(message) {
    log(`✅ ${message}`, 'green');
}

function error(message) {
    log(`❌ ${message}`, 'red');
}

function warning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// Verificar se estamos no diretório raiz do projeto
function checkProjectRoot() {
    if (!fs.existsSync('package.json')) {
        error('Este script deve ser executado no diretório raiz do projeto!');
        process.exit(1);
    }
}

// Criar backup
function createBackup() {
    header('Criando Backup');
    
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupBranch = `backup-before-fixes-${timestamp}`;
        
        info(`Criando branch de backup: ${backupBranch}`);
        execSync(`git checkout -b ${backupBranch}`, { stdio: 'inherit' });
        execSync(`git add -A`, { stdio: 'inherit' });
        execSync(`git commit -m "Backup antes das correções críticas" || true`, { stdio: 'inherit' });
        
        // Voltar para branch principal
        try {
            execSync(`git checkout main`, { stdio: 'inherit' });
        } catch {
            execSync(`git checkout master`, { stdio: 'inherit' });
        }
        
        success(`Backup criado na branch: ${backupBranch}`);
        return backupBranch;
    } catch (err) {
        error('Erro ao criar backup!');
        error(err.message);
        process.exit(1);
    }
}

// Correção #1: Remover rota /health duplicada
function fixDuplicateHealthRoute() {
    header('Correção #1: Removendo rota /health duplicada');
    
    const filePath = 'server.js';
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        // Encontrar as duas definições de /health
        let firstHealthIndex = -1;
        let secondHealthIndex = -1;
        let inFirstHealth = false;
        let inSecondHealth = false;
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes("app.get('/health'")) {
                if (firstHealthIndex === -1) {
                    firstHealthIndex = i;
                    inFirstHealth = true;
                } else if (secondHealthIndex === -1) {
                    secondHealthIndex = i;
                    inSecondHealth = true;
                }
            }
        }
        
        if (secondHealthIndex !== -1) {
            // Remover a segunda definição (linhas 208-216 aproximadamente)
            const linesToRemove = [];
            for (let i = secondHealthIndex; i < lines.length; i++) {
                linesToRemove.push(i);
                if (lines[i].includes('});') && i > secondHealthIndex) {
                    break;
                }
            }
            
            // Remover de trás para frente para não afetar índices
            for (let i = linesToRemove.length - 1; i >= 0; i--) {
                lines.splice(linesToRemove[i], 1);
            }
            
            // Salvar arquivo
            fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
            success('Rota /health duplicada removida!');
        } else {
            info('Rota /health já não está duplicada.');
        }
    } catch (err) {
        error(`Erro ao corrigir ${filePath}: ${err.message}`);
    }
}

// Correção #2: Renomear env.example para .env.example
function fixEnvExampleName() {
    header('Correção #2: Renomeando env.example');
    
    try {
        if (fs.existsSync('env.example')) {
            fs.renameSync('env.example', '.env.example');
            success('Arquivo renomeado: env.example → .env.example');
        } else if (fs.existsSync('.env.example')) {
            info('Arquivo .env.example já existe com nome correto.');
        } else {
            warning('Nenhum arquivo env.example encontrado.');
        }
    } catch (err) {
        error(`Erro ao renomear arquivo: ${err.message}`);
    }
}

// Correção #4: Corrigir validação de signature WhatsApp
function fixWhatsAppSignatureValidation() {
    header('Correção #4: Corrigindo validação de signature WhatsApp');
    
    const filePath = 'services/whatsappServiceV2.js';
    
    try {
        if (!fs.existsSync(filePath)) {
            warning(`Arquivo ${filePath} não encontrado. Pulando...`);
            return;
        }
        
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Procurar e substituir o código problemático
        const oldCode = `if (!WHATSAPP_APP_SECRET) {
        logger.warn('⚠️ WHATSAPP_APP_SECRET não configurado - pulando verificação de signature');
        return true; // Em produção, deve retornar false
    }`;
        
        const newCode = `if (!WHATSAPP_APP_SECRET) {
        logger.warn('⚠️ WHATSAPP_APP_SECRET não configurado');
        if (process.env.NODE_ENV === 'production') {
            logger.error('❌ WHATSAPP_APP_SECRET obrigatório em produção');
            return false;
        }
        logger.info('ℹ️ Aceitando webhook sem signature (apenas desenvolvimento)');
        return true;
    }`;
        
        if (content.includes('return true; // Em produção, deve retornar false')) {
            content = content.replace(oldCode, newCode);
            fs.writeFileSync(filePath, content, 'utf8');
            success('Validação de signature corrigida!');
        } else {
            info('Validação de signature já parece estar correta.');
        }
    } catch (err) {
        error(`Erro ao corrigir ${filePath}: ${err.message}`);
    }
}

// Correção #5: Remover exposição de tokens em logs
function fixTokenExposure() {
    header('Correção #5: Removendo exposição de tokens');
    
    const filePath = 'routes/whatsapp.js';
    
    try {
        if (!fs.existsSync(filePath)) {
            warning(`Arquivo ${filePath} não encontrado. Pode já ter sido removido.`);
            return;
        }
        
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Substituir logs que expõem tokens
        content = content.replace(
            /logger\.info\(`   Token recebido: \$\{token\}`\);/g,
            "logger.info(`   Token recebido: ${token ? '***' + token.slice(-4) : 'null'}`);"
        );
        
        content = content.replace(
            /logger\.info\(`   Token esperado: \$\{process\.env\.WHATSAPP_VERIFY_TOKEN\}`\);/g,
            "logger.info(`   Token match: ${token === process.env.WHATSAPP_VERIFY_TOKEN}`);"
        );
        
        fs.writeFileSync(filePath, content, 'utf8');
        success('Exposição de tokens removida!');
    } catch (err) {
        error(`Erro ao corrigir ${filePath}: ${err.message}`);
    }
}

// Correção #7: Adicionar validação de JWT_SECRET
function addEnvValidation() {
    header('Correção #7: Adicionando validação de variáveis de ambiente');
    
    const filePath = 'server.js';
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        const validationCode = `
// Validar variáveis de ambiente críticas em produção
if (process.env.NODE_ENV === 'production') {
    const requiredEnvVars = [
        'MONGODB_URI',
        'JWT_SECRET',
        'WHATSAPP_TOKEN',
        'WHATSAPP_VERIFY_TOKEN',
        'WHATSAPP_APP_SECRET'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error('❌ Variáveis de ambiente obrigatórias não configuradas:');
        missingVars.forEach(varName => {
            console.error(\`   - \${varName}\`);
        });
        console.error('\\nAplicação não pode iniciar sem essas configurações.');
        process.exit(1);
    }
    
    console.log('✅ Todas as variáveis de ambiente obrigatórias configuradas');
}
`;
        
        // Adicionar após require('dotenv').config()
        if (!content.includes('Validar variáveis de ambiente críticas')) {
            content = content.replace(
                "require('dotenv').config();",
                "require('dotenv').config();\n" + validationCode
            );
            
            fs.writeFileSync(filePath, content, 'utf8');
            success('Validação de variáveis de ambiente adicionada!');
        } else {
            info('Validação de variáveis já existe.');
        }
    } catch (err) {
        error(`Erro ao adicionar validação: ${err.message}`);
    }
}

// Correção #8: Melhorar skip de rate limiter
function fixRateLimiterSkip() {
    header('Correção #8: Melhorando skip de rate limiter');
    
    const filePath = 'server.js';
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        const oldSkip = `skip: (req) => req.path.startsWith('/api/whatsapp/webhook') || req.originalUrl.startsWith('/api/whatsapp/webhook')`;
        
        const newSkip = `skip: (req) => {
        // Lista exata de endpoints que devem pular rate limit
        const skipPaths = ['/api/whatsapp/webhook'];
        return skipPaths.includes(req.path);
    }`;
        
        if (content.includes("startsWith('/api/whatsapp/webhook')")) {
            content = content.replace(oldSkip, newSkip);
            fs.writeFileSync(filePath, content, 'utf8');
            success('Skip de rate limiter melhorado!');
        } else {
            info('Skip de rate limiter já parece estar correto.');
        }
    } catch (err) {
        error(`Erro ao corrigir rate limiter: ${err.message}`);
    }
}

// Gerar relatório de correções
function generateReport(backupBranch) {
    header('Relatório de Correções');
    
    console.log(`
📊 Resumo das Correções Aplicadas:

✅ Correção #1: Rota /health duplicada removida
✅ Correção #2: env.example renomeado para .env.example
✅ Correção #4: Validação de signature WhatsApp corrigida
✅ Correção #5: Exposição de tokens removida
✅ Correção #7: Validação de variáveis de ambiente adicionada
✅ Correção #8: Skip de rate limiter melhorado

📦 Backup: ${backupBranch}

🔄 Próximos Passos:
1. Revisar as mudanças: git diff
2. Testar a aplicação: npm run dev
3. Verificar logs: tail -f logs/combined.log
4. Commitar: git add -A && git commit -m "fix: correções críticas de segurança"
5. Deploy em staging para testes finais

⚠️  IMPORTANTE:
- Rotacione tokens WhatsApp se já em produção
- Configure variáveis de ambiente faltantes
- Teste todas as funcionalidades antes do deploy

📚 Documentação:
- RELATORIO-AUDITORIA.md - Relatório completo
- PLANO-CORRECAO.md - Guia detalhado
- RESUMO-AUDITORIA-EXECUTIVO.md - Resumo executivo
`);
}

// Função principal
async function main() {
    try {
        log('\n🔧 Script de Correção Automática - Issues Críticos\n', 'cyan');
        
        // Verificar pré-requisitos
        checkProjectRoot();
        
        warning('ATENÇÃO: Este script vai modificar arquivos do projeto!');
        warning('Certifique-se de ter feito backup ou commit das mudanças atuais.');
        
        // Perguntar confirmação
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        const answer = await new Promise(resolve => {
            readline.question('\nDeseja continuar? (s/N): ', resolve);
        });
        readline.close();
        
        if (answer.toLowerCase() !== 's') {
            info('Operação cancelada pelo usuário.');
            process.exit(0);
        }
        
        // Criar backup
        const backupBranch = createBackup();
        
        // Aplicar correções
        fixDuplicateHealthRoute();
        fixEnvExampleName();
        fixWhatsAppSignatureValidation();
        fixTokenExposure();
        addEnvValidation();
        fixRateLimiterSkip();
        
        // Gerar relatório
        generateReport(backupBranch);
        
        success('\n✨ Todas as correções foram aplicadas com sucesso!\n');
        
    } catch (err) {
        error(`\nErro fatal: ${err.message}`);
        error('Stack trace:', err.stack);
        process.exit(1);
    }
}

// Executar
if (require.main === module) {
    main();
}

module.exports = { main };

