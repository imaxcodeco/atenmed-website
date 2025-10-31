# Script para copiar chave SSH para GitHub Secrets
# Uso: .\scripts\copiar-chave-ssh.ps1

$pemPath = "C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem"

Write-Host "🔐 COPIAR CHAVE SSH PARA GITHUB SECRETS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

if (Test-Path $pemPath) {
    Write-Host "✅ Arquivo encontrado: $pemPath" -ForegroundColor Green
    Write-Host ""
    
    # Ler conteúdo completo
    $keyContent = Get-Content $pemPath -Raw
    
    # Verificar formato
    if ($keyContent -match "-----BEGIN.*PRIVATE KEY-----") {
        Write-Host "✅ Formato da chave está correto!" -ForegroundColor Green
        Write-Host ""
        
        # Copiar para clipboard
        $keyContent | Set-Clipboard
        
        Write-Host "📋 CHAVE COPIADA PARA O CLIPBOARD!" -ForegroundColor Green
        Write-Host ""
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📝 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "1. Acesse: https://github.com/imaxcodeco/atenmed-website/settings/secrets/actions" -ForegroundColor White
        Write-Host "2. Clique em 'New repository secret'" -ForegroundColor White
        Write-Host "3. Name: SERVER_SSH_KEY" -ForegroundColor White
        Write-Host "4. Secret: Ctrl+V (chave já está copiada!)" -ForegroundColor White
        Write-Host "5. Clique em 'Add secret'" -ForegroundColor White
        Write-Host ""
        Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
        Write-Host "   - O GitHub NÃO mostra o valor depois de salvar (é normal!)" -ForegroundColor White
        Write-Host "   - Se o secret aparecer na LISTA = está salvo corretamente!" -ForegroundColor White
        Write-Host ""
        
        # Mostrar primeiras e últimas linhas para confirmação
        $lines = Get-Content $pemPath
        Write-Host "📄 Prévia da chave (primeira e última linha):" -ForegroundColor Cyan
        Write-Host $lines[0] -ForegroundColor Gray
        Write-Host "... ($($lines.Count) linhas no total) ..." -ForegroundColor Gray
        Write-Host $lines[-1] -ForegroundColor Gray
        Write-Host ""
        
    } else {
        Write-Host "❌ ERRO: Formato da chave parece incorreto!" -ForegroundColor Red
        Write-Host "   A chave deve começar com: -----BEGIN ... PRIVATE KEY-----" -ForegroundColor Red
    }
} 
else {
    Write-Host "❌ Arquivo não encontrado: $pemPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 Procurando arquivos .pem..." -ForegroundColor Yellow
    Get-ChildItem "C:\Users\Ian_1\Documents\AtenMed\" -Filter "*.pem" -Recurse -ErrorAction SilentlyContinue | 
        ForEach-Object { Write-Host "   Encontrado: $($_.FullName)" -ForegroundColor Cyan }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

