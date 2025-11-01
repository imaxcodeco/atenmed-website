#!/bin/bash

# Script para verificar e corrigir servidor AtenMed

echo "🔍 Verificando status do servidor..."
echo ""

# Verificar diretório do projeto
echo "📁 Verificando diretórios..."
if [ -d "/var/www/atenmed" ]; then
    echo "✅ Encontrado: /var/www/atenmed"
    cd /var/www/atenmed
elif [ -d "$HOME/atenmed" ]; then
    echo "✅ Encontrado: $HOME/atenmed"
    cd $HOME/atenmed
elif [ -d "$HOME/atenmed-website" ]; then
    echo "✅ Encontrado: $HOME/atenmed-website"
    cd $HOME/atenmed-website
else
    echo "❌ Não encontrou diretório do projeto"
    exit 1
fi

echo ""
echo "🔄 Verificando PM2..."
pm2 status

echo ""
echo "📋 Verificando Node.js e npm..."
node --version
npm --version

echo ""
echo "🌐 Verificando se aplicação está respondendo na porta 3000..."
curl -s http://localhost:3000/health || echo "❌ Aplicação não está respondendo"

echo ""
echo "📦 Verificando se node_modules existe..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules existe"
else
    echo "❌ node_modules não existe - precisa instalar dependências"
fi

echo ""
echo "🔐 Verificando .env..."
if [ -f ".env" ]; then
    echo "✅ .env existe"
else
    echo "❌ .env não existe - precisa configurar variáveis de ambiente"
fi

echo ""
echo "✅ Verificação completa!"
echo ""
echo "Próximos comandos sugeridos:"
echo ""
echo "Se PM2 não estiver rodando:"
echo "  pm2 start ecosystem.config.js --env production"
echo "  pm2 save"
echo ""
echo "Se PM2 estiver com erro:"
echo "  pm2 restart atenmed --update-env"
echo "  pm2 logs atenmed --lines 50"
echo ""

