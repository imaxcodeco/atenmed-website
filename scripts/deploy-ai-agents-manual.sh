#!/bin/bash
# Script para fazer deploy manual dos arquivos de AI Agents
# Execute este script no servidor quando o git pull não funcionar

cd /var/www/atenmed

echo "📦 Criando diretório se não existir..."
mkdir -p applications/ai-agents

echo "📥 Baixando arquivos do GitHub via raw URLs..."

# Lista de arquivos essenciais
FILES=(
  "applications/ai-agents/index.html"
  "applications/ai-agents/app.js"
  "applications/ai-agents/styles.css"
  "applications/ai-agents/widget.js"
  "applications/ai-agents/flow-editor.js"
  "applications/ai-agents/flow-editor-v2.html"
)

BASE_URL="https://raw.githubusercontent.com/imaxcodeco/atenmed-website/main"

for file in "${FILES[@]}"; do
  filename=$(basename "$file")
  echo "⬇️  Baixando $filename..."
  curl -s -o "$file" "${BASE_URL}/${file}" || {
    echo "❌ Erro ao baixar $file"
    continue
  }
  echo "✅ $filename baixado"
done

echo ""
echo "🔍 Verificando arquivos..."
ls -la applications/ai-agents/

echo ""
echo "✅ Deploy manual concluído!"
echo "🔄 Reinicie o PM2: pm2 restart atenmed"

