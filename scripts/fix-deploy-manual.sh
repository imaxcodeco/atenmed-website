#!/bin/bash
# Script para corrigir deploy manualmente no servidor

cd /var/www/atenmed

echo "🔍 Verificando status do git..."
git status

echo "🔄 Fazendo pull do repositório..."
git fetch origin
git reset --hard origin/main

echo "📋 Último commit:"
git log -1 --oneline

echo "🔍 Verificando se diretório existe..."
if [ ! -d "applications/ai-agents" ]; then
  echo "❌ Diretório applications/ai-agents não existe!"
  echo "📂 Listando applications:"
  ls -la applications/ || echo "Diretório applications não existe"
else
  echo "✅ Diretório existe"
  echo "📄 Arquivos em applications/ai-agents:"
  ls -la applications/ai-agents/
fi

echo "🔍 Verificando rotas no server.js:"
grep -n "ai-agents" server.js || echo "❌ Rotas não encontradas no server.js"

echo "📦 Instalando dependências..."
npm install --production --legacy-peer-deps --ignore-scripts

echo "🔄 Reiniciando PM2..."
pm2 restart atenmed --update-env

echo "✅ Verificação concluída!"

