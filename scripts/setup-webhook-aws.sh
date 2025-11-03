#!/bin/bash

###############################################################################
# Script de Configuração do Webhook WhatsApp - AWS/Produção
# AtenMed - Organização Inteligente para Consultórios
###############################################################################

echo ""
echo "=========================================="
echo "🔧 CONFIGURAÇÃO DO WEBHOOK WHATSAPP"
echo "=========================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Verificar se está rodando na pasta correta
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script na pasta raiz do projeto!${NC}"
    exit 1
fi

# Verificar se arquivo .env existe
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado. Criando a partir do env.example...${NC}"
    if [ -f "env.example" ]; then
        cp env.example .env
        echo -e "${GREEN}✅ Arquivo .env criado!${NC}"
    else
        echo -e "${RED}❌ Erro: env.example não encontrado!${NC}"
        exit 1
    fi
fi

echo -e "${CYAN}📋 Configuração do Webhook${NC}"
echo ""

# Solicitar token de verificação
echo -e "${YELLOW}Digite o token de verificação que você configurou no Meta Developer:${NC}"
echo -e "${CYAN}(Exemplo: atenmed_webhook_secure_2024)${NC}"
read -p "Token: " VERIFY_TOKEN

if [ -z "$VERIFY_TOKEN" ]; then
    echo -e "${RED}❌ Token não pode estar vazio!${NC}"
    exit 1
fi

# Solicitar Phone ID
echo ""
echo -e "${YELLOW}Digite o WHATSAPP_PHONE_ID (obtido no Meta Developer):${NC}"
read -p "Phone ID: " PHONE_ID

# Solicitar Token do WhatsApp
echo ""
echo -e "${YELLOW}Digite o WHATSAPP_TOKEN (token de acesso da API):${NC}"
read -p "Token API: " WA_TOKEN

# Atualizar arquivo .env
echo ""
echo -e "${CYAN}📝 Atualizando arquivo .env...${NC}"

# Backup do .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo -e "${GREEN}✅ Backup criado!${NC}"

# Remover configurações antigas do WhatsApp se existirem
sed -i '/^WHATSAPP_VERIFY_TOKEN=/d' .env
sed -i '/^WHATSAPP_PHONE_ID=/d' .env
sed -i '/^WHATSAPP_TOKEN=/d' .env
sed -i '/^WHATSAPP_API_URL=/d' .env

# Adicionar novas configurações
echo "" >> .env
echo "# WhatsApp Webhook Configuration - $(date)" >> .env
echo "WHATSAPP_VERIFY_TOKEN=$VERIFY_TOKEN" >> .env
echo "WHATSAPP_PHONE_ID=$PHONE_ID" >> .env
echo "WHATSAPP_TOKEN=$WA_TOKEN" >> .env
echo "WHATSAPP_API_URL=https://graph.facebook.com/v18.0" >> .env

echo -e "${GREEN}✅ Arquivo .env atualizado!${NC}"

# Verificar configuração
echo ""
echo -e "${CYAN}🔍 Verificando configuração...${NC}"
echo ""
echo -e "WHATSAPP_VERIFY_TOKEN: ${GREEN}${VERIFY_TOKEN}${NC}"
echo -e "WHATSAPP_PHONE_ID: ${GREEN}${PHONE_ID:0:10}...${NC}"
echo -e "WHATSAPP_TOKEN: ${GREEN}${WA_TOKEN:0:15}...${NC}"
echo ""

# Verificar se PM2 está instalado
if command -v pm2 &> /dev/null; then
    echo -e "${CYAN}🔄 Reiniciando servidor com PM2...${NC}"
    pm2 restart atenmed || pm2 start ecosystem.config.js --env production
    echo -e "${GREEN}✅ Servidor reiniciado!${NC}"
else
    echo -e "${YELLOW}⚠️  PM2 não encontrado. Reinicie o servidor manualmente:${NC}"
    echo -e "   ${CYAN}npm start${NC}"
fi

# Obter domínio/IP
echo ""
echo -e "${CYAN}🌐 Configuração do Meta Developer${NC}"
echo ""

# Tentar detectar domínio do .env
DOMAIN=$(grep -E '^APP_URL=' .env | cut -d'=' -f2 | sed 's/"//g' | sed 's/http:\/\///' | sed 's/https:\/\///')

if [ -z "$DOMAIN" ]; then
    # Tentar obter IP público
    PUBLIC_IP=$(curl -s http://checkip.amazonaws.com)
    if [ ! -z "$PUBLIC_IP" ]; then
        DOMAIN="$PUBLIC_IP"
    else
        DOMAIN="seu-dominio.com.br"
    fi
fi

echo -e "${YELLOW}Configure no Meta Developer (https://developers.facebook.com/apps/):${NC}"
echo ""
echo -e "${CYAN}URL de callback:${NC}"
echo -e "  ${GREEN}https://${DOMAIN}/api/whatsapp/webhook${NC}"
echo ""
echo -e "${CYAN}Verificar token:${NC}"
echo -e "  ${GREEN}${VERIFY_TOKEN}${NC}"
echo ""

# Testar webhook localmente
echo -e "${CYAN}🧪 Testando webhook localmente...${NC}"
sleep 2

TEST_URL="http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=teste123"
RESPONSE=$(curl -s "$TEST_URL")

if [ "$RESPONSE" == "teste123" ]; then
    echo -e "${GREEN}✅ Webhook funcionando corretamente!${NC}"
else
    echo -e "${RED}❌ Webhook não respondeu corretamente${NC}"
    echo -e "${YELLOW}Resposta: ${RESPONSE}${NC}"
    echo -e "${YELLOW}Verifique se o servidor está rodando!${NC}"
fi

# Verificar SSL/HTTPS
echo ""
echo -e "${CYAN}🔒 Verificando HTTPS...${NC}"

if command -v nginx &> /dev/null; then
    if [ -d "/etc/letsencrypt/live" ]; then
        echo -e "${GREEN}✅ Nginx e SSL detectados!${NC}"
    else
        echo -e "${YELLOW}⚠️  Nginx encontrado, mas SSL não configurado${NC}"
        echo -e "${CYAN}Configure SSL com:${NC}"
        echo -e "  sudo certbot --nginx -d ${DOMAIN}"
    fi
else
    echo -e "${YELLOW}⚠️  Nginx não detectado${NC}"
    echo -e "${CYAN}O WhatsApp requer HTTPS! Configure Nginx com SSL.${NC}"
fi

# Verificar porta 443
echo ""
echo -e "${CYAN}🔥 Verificando firewall...${NC}"
if command -v ufw &> /dev/null; then
    UFW_STATUS=$(sudo ufw status | grep "443" | grep "ALLOW")
    if [ ! -z "$UFW_STATUS" ]; then
        echo -e "${GREEN}✅ Porta 443 (HTTPS) está aberta${NC}"
    else
        echo -e "${YELLOW}⚠️  Porta 443 pode estar bloqueada${NC}"
        echo -e "${CYAN}Abra a porta com:${NC}"
        echo -e "  sudo ufw allow 443/tcp"
    fi
else
    echo -e "${YELLOW}⚠️  UFW não detectado. Verifique o firewall manualmente.${NC}"
fi

# Comandos úteis
echo ""
echo "=========================================="
echo -e "${CYAN}📚 COMANDOS ÚTEIS${NC}"
echo "=========================================="
echo ""
echo -e "${YELLOW}Ver logs:${NC}"
echo -e "  pm2 logs atenmed"
echo -e "  tail -f logs/combined.log"
echo ""
echo -e "${YELLOW}Reiniciar servidor:${NC}"
echo -e "  pm2 restart atenmed"
echo ""
echo -e "${YELLOW}Testar webhook:${NC}"
echo -e "  curl \"http://localhost:3000/api/whatsapp/debug-webhook\""
echo ""
echo -e "${YELLOW}Testar externamente:${NC}"
echo -e "  curl \"https://${DOMAIN}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=teste\""
echo ""
echo "=========================================="
echo -e "${GREEN}✨ CONFIGURAÇÃO COMPLETA!${NC}"
echo "=========================================="
echo ""
echo -e "${CYAN}Próximos passos:${NC}"
echo -e "1. Acesse: ${YELLOW}https://developers.facebook.com/apps/${NC}"
echo -e "2. Configure o webhook com a URL e token acima"
echo -e "3. Clique em 'Verificar e salvar'"
echo -e "4. Acompanhe os logs: ${YELLOW}pm2 logs atenmed${NC}"
echo ""













