# ===================================================================
# SCRIPT DE DEPLOY PARA WINDOWS - AtenMed SaaS
# ===================================================================

$ErrorActionPreference = "Stop"

function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

Write-Success "`n=== INICIANDO DEPLOY ===`n"

# Verificar package.json
if (-not (Test-Path "package.json")) {
    Write-Error "package.json nao encontrado! Execute na raiz do projeto."
    exit 1
}

# Verificar Node.js
try {
    $nodeVersion = node -v
    Write-Info "Node.js version: $nodeVersion"
} catch {
    Write-Error "Node.js nao esta instalado!"
    exit 1
}

# Verificar PM2
try {
    $pm2Version = pm2 -v
    Write-Info "PM2 version: $pm2Version"
} catch {
    Write-Warning "PM2 nao instalado. Instalando..."
    npm install -g pm2
}

# Criar backup
Write-Success "`nCriando backup..."
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "backups\$timestamp"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

if (Test-Path ".env") {
    Copy-Item ".env" "$backupDir\.env.backup"
    Write-Info "Backup do .env criado"
}

Write-Success "Backup criado em: $backupDir"

# Atualizar codigo (Git)
Write-Success "`nAtualizando codigo..."
if (Test-Path ".git") {
    try {
        git pull
        Write-Info "Codigo atualizado via Git"
    } catch {
        Write-Warning "Nao foi possivel atualizar via Git"
    }
}

# Instalar dependencias
Write-Success "`nInstalando dependencias..."
npm install --production

# Build
Write-Success "`nFazendo build..."
try {
    npm run build:css
    Write-Info "Build CSS concluido"
} catch {
    Write-Warning "Build CSS falhou (pode ser opcional)"
}

# Verificar .env
Write-Success "`nVerificando .env..."
if (-not (Test-Path ".env")) {
    Write-Error ".env nao encontrado! Configure antes de fazer deploy."
    exit 1
}

$envContent = Get-Content ".env" -Raw
$requiredVars = @("NODE_ENV", "MONGODB_URI", "JWT_SECRET", "APP_URL")

foreach ($var in $requiredVars) {
    if ($envContent -notmatch "$var=") {
        Write-Error "Variavel $var nao encontrada no .env!"
        exit 1
    }
}

Write-Success "Variaveis de ambiente OK"

# Criar diretorios
Write-Success "`nCriando diretorios..."
@("logs", "uploads", "backups") | ForEach-Object {
    New-Item -ItemType Directory -Force -Path $_ | Out-Null
}

# Parar processo antigo
Write-Success "`nParando processo antigo..."
try {
    pm2 delete atenmed 2>$null
} catch {
    Write-Info "Nenhum processo antigo"
}

# Iniciar com PM2
Write-Success "`nIniciando aplicacao com PM2..."
pm2 start ecosystem.config.js --env production
pm2 save

Write-Success "`nDeploy concluido!"

# Verificar
Start-Sleep -Seconds 5
Write-Success "`nVerificando status..."
pm2 status

Write-Info "`nComandos uteis:"
Write-Host "  pm2 logs atenmed      - Ver logs"
Write-Host "  pm2 restart atenmed   - Reiniciar"
Write-Host "  pm2 monit             - Monitor"

Write-Info "`nURLs:"
Write-Host "  http://localhost:3000         - Landing"
Write-Host "  http://localhost:3000/planos  - Captacao"
Write-Host "  http://localhost:3000/crm     - CRM"
Write-Host "  http://localhost:3000/portal  - Portal"
Write-Host "  http://localhost:3000/health  - Health Check"

Write-Success "`n=== DEPLOY FINALIZADO COM SUCESSO! ==="

