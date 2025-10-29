#!/bin/bash
echo "🔧 Limpando processos..."
pm2 delete all 2>/dev/null
sudo killall -9 node 2>/dev/null
sleep 3

echo "🚀 Iniciando servidor..."
cd /var/www/atenmed
pm2 start ecosystem.config.js --env production
sleep 5

echo "🧪 Testando webhook..."
curl "https://atenmed.com.br/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=atenmed_webhook_2025&hub.challenge=SUCESSO"
echo ""

echo "✅ Status do servidor:"
pm2 status

echo ""
echo "📋 Configure no Meta Developer:"
echo "URL: https://atenmed.com.br/api/whatsapp/webhook"
echo "Token: atenmed_webhook_2025"








