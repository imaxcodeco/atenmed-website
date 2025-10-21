#!/bin/bash

###############################################################################
# DEPLOY SCRIPT PARA AWS - AtenMed v2.0
# Execute este script no servidor AWS (atenmed.com.br)
###############################################################################

echo "============================================="
echo "🚀 DEPLOY AtenMed v2.0 para AWS"
echo "============================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configurações
PROJECT_DIR="/var/www/atenmed"  # Ajuste se necessário
BRANCH="reorganizacao-estrutura"

# Função para log
log_step() {
    echo -e "${GREEN}✓ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

log_error() {
    echo -e "${RED}✗ $1${NC}"
}

# 1. Backup do .env
echo "1️⃣ Fazendo backup do .env..."
if [ -f "$PROJECT_DIR/.env" ]; then
    cp "$PROJECT_DIR/.env" "$PROJECT_DIR/.env.backup.$(date +%Y%m%d_%H%M%S)"
    log_step ".env backup criado"
else
    log_warning ".env não encontrado - será necessário configurar"
fi

# 2. Navegar para o diretório
echo ""
echo "2️⃣ Navegando para diretório do projeto..."
cd "$PROJECT_DIR" || {
    log_error "Diretório $PROJECT_DIR não encontrado!"
    exit 1
}
log_step "Diretório: $(pwd)"

# 3. Atualizar código do GitHub
echo ""
echo "3️⃣ Atualizando código do GitHub..."
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH
log_step "Código atualizado com sucesso!"

# 4. Instalar dependências
echo ""
echo "4️⃣ Instalando/atualizando dependências..."
npm install
log_step "Dependências instaladas!"

# 5. Verificar se .env existe
echo ""
echo "5️⃣ Verificando configurações..."
if [ ! -f ".env" ]; then
    log_warning "Arquivo .env não encontrado!"
    echo "📝 Criando .env a partir do env.example..."
    cp env.example .env
    log_warning "IMPORTANTE: Configure o arquivo .env com suas credenciais!"
    echo "Execute: nano .env"
else
    log_step ".env encontrado"
fi

# 6. Verificar MongoDB
echo ""
echo "6️⃣ Verificando MongoDB..."
if systemctl is-active --quiet mongod; then
    log_step "MongoDB está rodando"
else
    log_warning "MongoDB não está rodando!"
    echo "Tentando iniciar MongoDB..."
    sudo systemctl start mongod
    if systemctl is-active --quiet mongod; then
        log_step "MongoDB iniciado com sucesso!"
    else
        log_error "Falha ao iniciar MongoDB. Inicie manualmente."
    fi
fi

# 7. Parar PM2
echo ""
echo "7️⃣ Parando aplicação atual..."
pm2 stop atenmed 2>/dev/null || log_warning "App não estava rodando"

# 8. Limpar logs antigos (opcional)
echo ""
echo "8️⃣ Limpando logs antigos..."
rm -f logs/*.log
log_step "Logs limpos"

# 9. Reiniciar aplicação com PM2
echo ""
echo "9️⃣ Iniciando aplicação com PM2..."
pm2 delete atenmed 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
log_step "Aplicação iniciada!"

# 10. Verificar status
echo ""
echo "🔍 Verificando status..."
sleep 3
pm2 status

# 11. Mostrar logs
echo ""
echo "📋 Últimos logs:"
echo "============================================="
pm2 logs atenmed --lines 20 --nostream

# 12. Instruções finais
echo ""
echo "============================================="
echo "✅ DEPLOY CONCLUÍDO!"
echo "============================================="
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1. Configure o .env se ainda não foi feito:"
echo "   nano .env"
echo ""
echo "2. Configure as variáveis essenciais:"
echo "   - AI_PROVIDER=gemini"
echo "   - GEMINI_API_KEY=AIzaSyCYJKuN94hPx5evfqY_Zdh2-nfDov_WJm8"
echo "   - GOOGLE_CLIENT_ID=..."
echo "   - GOOGLE_CLIENT_SECRET=..."
echo "   - WHATSAPP_PHONE_ID=..."
echo "   - WHATSAPP_TOKEN=..."
echo ""
echo "3. Reinicie após configurar o .env:"
echo "   pm2 restart atenmed"
echo ""
echo "4. Teste os endpoints:"
echo "   curl https://atenmed.com.br/api/health"
echo "   curl https://atenmed.com.br/api/whatsapp/health"
echo ""
echo "5. Configure o webhook do WhatsApp:"
echo "   URL: https://atenmed.com.br/api/whatsapp/webhook"
echo "   Token: (valor de WHATSAPP_VERIFY_TOKEN)"
echo ""
echo "6. Monitore os logs:"
echo "   pm2 logs atenmed"
echo ""
echo "============================================="
echo "🎉 AtenMed v2.0 deployado!"
echo "============================================="

