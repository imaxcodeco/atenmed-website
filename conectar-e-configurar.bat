@echo off
echo ========================================
echo CONECTANDO AO SERVIDOR AWS
echo ========================================
echo.
echo Use este comando para conectar:
echo.
echo ssh -i "C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem" ubuntu@3.129.206.231
echo.
echo ========================================
echo DEPOIS DE CONECTAR, EXECUTE:
echo ========================================
echo.
echo # 1. Ir para a pasta do projeto
echo cd /var/www/atenmed
echo.
echo # 2. Executar configuracao automatica
echo chmod +x scripts/setup-webhook-aws.sh
echo ./scripts/setup-webhook-aws.sh
echo.
echo ========================================
echo INFORMACOES QUE VOCE VAI PRECISAR:
echo ========================================
echo.
echo Token de verificacao: atenmed_webhook_secure_2024
echo Phone ID: [Pegue no Meta Developer]
echo Token API: [Pegue no Meta Developer]
echo.
echo ========================================
echo META DEVELOPER:
echo ========================================
echo.
echo 1. Acesse: https://developers.facebook.com/apps/
echo 2. Selecione seu app WhatsApp
echo 3. WhatsApp ^> Configuracoes da API
echo 4. Copie:
echo    - Phone Number ID
echo    - Token de acesso (clique em "Gerar Token")
echo.
pause








