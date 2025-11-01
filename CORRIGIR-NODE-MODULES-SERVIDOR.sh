#!/bin/bash

# Script para corrigir problema de módulos não encontrados

echo "🔧 Corrigindo problema de módulos faltando..."
echo ""

# Ir para diretório do projeto
cd /var/www/atenmed

echo "📋 Verificando node_modules..."
if [ -d "node_modules" ]; then
    echo "⚠️ node_modules existe mas incompleto"
    echo "Removendo node_modules corrompido..."
    rm -rf node_modules
else
    echo "❌ node_modules não existe"
fi

echo ""
echo "📦 Reinstalando dependências..."
npm ci --production --legacy-peer-deps --ignore-scripts

echo ""
echo "✅ Dependências reinstaladas!"

echo ""
echo "🔄 Parando PM2..."
pm2 stop atenmed || pm2 delete atenmed

echo ""
echo "🚀 Reiniciando aplicação..."
pm2 start ecosystem.config.js --env production

echo ""
sleep 5

echo "📊 Status:"
pm2 status

echo ""
echo "📋 Últimos logs:"
pm2 logs atenmed --lines 20 --nostream

echo ""
echo "✅ Concluído!"

