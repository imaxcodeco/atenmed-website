# ===================================================================
# SCRIPT DE DEPLOY PARA WINDOWS - AtenMed SaaS
#
# Este script automatiza o deploy do sistema em ambiente Windows
#
# Uso: .\deploy-windows.ps1
# ===================================================================

$ErrorActionPreference = "Stop"

# Cores para output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

# ===================================================================
# VERIFICAÇÕES PRÉ-DEPLOY
# ===================================================================

Write-Success "`n🚀 Iniciando processo de deploy...`n"

# Verificar se está na pasta correta
if (-not (Test-Path "package.json")) {
    Write-Error "❌ package.json não encontrado! Execute este script na raiz do projeto."
    exit 1
}

# Verificar Node.js
try {
    $nodeVersion = node -v
    Write-Info "✅ Node.js version: $nodeVersion"
} catch {
    Write-Error "❌ Node.js não está instalado!"
    exit 1
}

# Verificar se MongoDB está rodando
try {
    $mongoProcess = Get-Process mongod -ErrorAction SilentlyContinue
    if ($mongoProcess) {
        Write-Info "✅ MongoDB está rodando"
    } else {
        Write-Warning "⚠️  MongoDB pode não estar rodando. Verifique!"
    }
} catch {
    Write-Warning "⚠️  Não foi possível verificar MongoDB"
}

# Verificar PM2
try {
    $pm2Version = pm2 -v
    Write-Info "✅ PM2 version: $pm2Version"
} catch {
    Write-Warning "⚠️  PM2 não instalado. Instalando..."
    npm install -g pm2
}

# ===================================================================
# BACKUP
# ===================================================================

Write-Success "`n📦 Criando backup...`n"

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "backups\$timestamp"

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

# Backup do .env
if (Test-Path ".env") {
    Copy-Item ".env" "$backupDir\.env.backup"
    Write-Info "✅ Backup do .env criado"
}

# Backup do MongoDB (se mongodump estiver disponível)
try {
    mongodump --db atenmed --out "$backupDir\mongodb" 2>$null
    Write-Info "✅ Backup do MongoDB criado"
} catch {
    Write-Warning "⚠️  Backup do MongoDB não realizado"
}

Write-Success "✅ Backup concluído em: $backupDir"

# ===================================================================
# ATUALIZAR CÓDIGO
# ===================================================================

Write-Success "`n📥 Atualizando código...`n"

if (Test-Path ".git") {
    try {
        git fetch origin
        git pull origin main
        Write-Info "✅ Código atualizado via Git"
    } catch {
        git pull origin master
    }
} else {
    Write-Warning "⚠️  Não é um repositório Git"
}

# ===================================================================
# INSTALAR DEPENDÊNCIAS
# ===================================================================

Write-Success "`n📦 Instalando dependências...`n"

npm install --production

Write-Success "✅ Dependências instaladas"

# ===================================================================
# BUILD
# ===================================================================

Write-Success "`n🔨 Fazendo build...`n"

try {
    npm run build:css
    Write-Info "✅ Build CSS concluído"
} catch {
    Write-Warning "⚠️  Build CSS falhou (talvez não seja necessário)"
}

# ===================================================================
# VERIFICAR .ENV
# ===================================================================

Write-Success "`n🔧 Verificando variáveis de ambiente...`n"

if (-not (Test-Path ".env")) {
    Write-Error "❌ .env não encontrado! Copie env.example e configure antes de fazer deploy."
    exit 1
}

$envContent = Get-Content ".env" -Raw

$requiredVars = @(
    "NODE_ENV",
    "MONGODB_URI",
    "JWT_SECRET",
    "APP_URL"
)

foreach ($var in $requiredVars) {
    if ($envContent -notmatch "$var=") {
        Write-Error "❌ Variável $var não encontrada no .env!"
        exit 1
    }
}

if ($envContent -notmatch "NODE_ENV=production") {
    Write-Warning "⚠️  NODE_ENV não está configurado para 'production'"
    $continue = Read-Host "Continuar mesmo assim? (s/n)"
    if ($continue -ne "s") {
        exit 1
    }
}

Write-Success "✅ Variáveis de ambiente OK"

# ===================================================================
# CRIAR DIRETÓRIOS
# ===================================================================

Write-Success "`n📁 Criando diretórios necessários...`n"

@("logs", "uploads", "backups") | ForEach-Object {
    New-Item -ItemType Directory -Force -Path $_ | Out-Null
}

Write-Success "✅ Diretórios criados"

# ===================================================================
# PARAR PROCESSOS ANTIGOS
# ===================================================================

Write-Success "`n🛑 Parando processos antigos...`n"

try {
    pm2 stop atenmed 2>$null
    Start-Sleep -Seconds 2
    Write-Info "✅ Processo antigo parado"
} catch {
    Write-Info "ℹ️  Nenhum processo antigo para parar"
}

# ===================================================================
# DEPLOY COM PM2
# ===================================================================

Write-Success "`n🚀 Fazendo deploy com PM2...`n"

try {
    # Deletar processo antigo (se existir)
    pm2 delete atenmed 2>$null
} catch {
    # Ignorar erro se não existir
}

# Iniciar nova instância
pm2 start ecosystem.config.js --env production

# Salvar configuração
pm2 save

Write-Success "✅ Deploy com PM2 concluído"

# ===================================================================
# VERIFICAÇÕES PÓS-DEPLOY
# ===================================================================

Write-Success "`n🔍 Verificando deploy...`n"

Start-Sleep -Seconds 5

# Verificar status PM2
$pm2Status = pm2 list
Write-Info $pm2Status

# Verificar se está online
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Success "✅ Aplicação está respondendo!"
    }
} catch {
    Write-Warning "⚠️  Aplicação pode não estar respondendo na porta 3000"
}

# ===================================================================
# LIMPAR CACHE
# ===================================================================

Write-Success "`n🧹 Limpando cache...`n"

npm cache clean --force 2>$null

Write-Success "✅ Limpeza concluída"

# ===================================================================
# RESUMO
# ===================================================================

Write-Success "`n═══════════════════════════════════════════════════════════"
Write-Success "   ✅ DEPLOY CONCLUÍDO COM SUCESSO!"
Write-Success "═══════════════════════════════════════════════════════════`n"

Write-Info "📊 Status da Aplicação:"
pm2 status

Write-Info "`n📝 Comandos úteis:"
Write-Host "   Ver logs:      " -NoNewline; Write-Success "pm2 logs atenmed"
Write-Host "   Reiniciar:     " -NoNewline; Write-Success "pm2 restart atenmed"
Write-Host "   Parar:         " -NoNewline; Write-Success "pm2 stop atenmed"
Write-Host "   Status:        " -NoNewline; Write-Success "pm2 status"
Write-Host "   Monitor:       " -NoNewline; Write-Success "pm2 monit"

Write-Info "`n🔗 URLs:"
Write-Host "   API:           http://localhost:3000"
Write-Host "   Health:        http://localhost:3000/health"
Write-Host "   Landing:       http://localhost:3000"
Write-Host "   Planos:        http://localhost:3000/planos"
Write-Host "   CRM:           http://localhost:3000/crm"
Write-Host "   Portal:        http://localhost:3000/portal"

Write-Info "`n📦 Backup salvo em: $backupDir"

Write-Warning "`n⚠️  NÃO ESQUEÇA:"
Write-Host "   1. Testar todas as funcionalidades"
Write-Host "   2. Criar primeiro usuário admin: node scripts/create-admin.js"
Write-Host "   3. Configurar webhooks do WhatsApp"
Write-Host "   4. Testar envio de emails"
Write-Host "   5. Configurar firewall se for servidor de produção"

Write-Success "`n═══════════════════════════════════════════════════════════"
Write-Success "🎉 Deploy finalizado! Sistema pronto para uso."
Write-Success "═══════════════════════════════════════════════════════════`n"

