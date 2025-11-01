#!/bin/bash

# Script para iniciar aplicação AtenMed no servidor

echo "🚀 Iniciando aplicação AtenMed..."
echo ""

# Descobrir diretório do projeto
if [ -d "/var/www/atenmed" ]; then
    echo "📁 Usando: /var/www/atenmed"
    cd /var/www/atenmed
elif [ -d "$HOME/atenmed" ]; then
    echo "📁 Usando: $HOME/atenmed"
    cd $HOME/atenmed
elif [ -d "$HOME/atenmed-website" ]; then
    echo "📁 Usando: $HOME/atenmed-website"
    cd $HOME/atenmed-website
else
    echo "❌ Diretório do projeto não encontrado!"
    echo "Diretórios verificados:"
    ls -la /var/www/
    ls -la $HOME/ | grep aten
    exit 1
fi

echo ""
echo "📋 Verificando estrutura do projeto..."
ls -la | head -20

echo ""
echo "📦 Verificando se node_modules existe..."
if [ ! -d "node_modules" ]; then
    echo "⚠️ node_modules não encontrado - instalando dependências..."
    npm install --production --legacy-peer-deps --ignore-scripts
else
    echo "✅ node_modules existe"
fi

echo ""
echo "🔐 Verificando .env..."
if [ ! -f ".env" ]; then
    echo "⚠️ .env não encontrado!"
    echo "Você precisa configurar variáveis de ambiente"
    exit 1
else
    echo "✅ .env existe"
fi

echo ""
echo "🔄 Verificando ecosystem.config.js..."
if [ ! -f "ecosystem.config.js" ]; then
    echo "⚠️ ecosystem.config.js não encontrado!"
    exit 1
else
    echo "✅ ecosystem.config.js existe"
fi

echo ""
echo "🚀 Iniciando aplicação com PM2..."
pm2 start ecosystem.config.js --env production

echo ""
echo "💾 Salvando configuração PM2..."
pm2 save

echo ""
echo "🔧 Configurando startup automático..."
pm2 startup | tail -1

echo ""
sleep 3

echo ""
echo "📊 Status PM2:"
pm2 status

echo ""
echo "🧪 Testando aplicação..."
curl -s http://localhost:3000/health && echo "✅ Aplicação responde!" || echo "⏳ Aplicação ainda inicializando..."

echo ""
echo "📋 Últimas 20 linhas do log:"
pm2 logs atenmed --lines 20 --nostream

echo ""
echo "✅ Concluído!"
echo ""
echo "Para ver logs em tempo real:"
echo "  pm2 logs atenmed"
echo ""
echo "Para parar aplicação:"
echo "  pm2 stop atenmed"
echo ""
echo "Para reiniciar aplicação:"
echo "  pm2 restart atenmed"
echo ""

