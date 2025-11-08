# Script PowerShell para fazer upload dos arquivos de AI Agents via SCP
# Execute este script no Windows para fazer upload direto dos arquivos

$SERVER = "ubuntu@atenmed.com.br"
$REMOTE_PATH = "/var/www/atenmed/applications/ai-agents"
$LOCAL_PATH = "applications\ai-agents"

Write-Host "📦 Fazendo upload dos arquivos de AI Agents..." -ForegroundColor Cyan

# Criar diretório no servidor
ssh $SERVER "mkdir -p $REMOTE_PATH"

# Lista de arquivos essenciais
$FILES = @(
    "index.html",
    "app.js",
    "styles.css",
    "widget.js",
    "flow-editor.js",
    "flow-editor-v2.html"
)

foreach ($file in $FILES) {
    $localFile = Join-Path $LOCAL_PATH $file
    if (Test-Path $localFile) {
        Write-Host "⬆️  Enviando $file..." -ForegroundColor Yellow
        scp $localFile "${SERVER}:${REMOTE_PATH}/"
        Write-Host "✅ $file enviado" -ForegroundColor Green
    } else {
        Write-Host "❌ Arquivo não encontrado: $localFile" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ Upload concluído!" -ForegroundColor Green
Write-Host "🔄 Execute no servidor: pm2 restart atenmed" -ForegroundColor Cyan

