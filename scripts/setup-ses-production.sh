#!/bin/bash

# Script: Setup AWS SES para Produção
# Guia interativo para configurar SES
# Uso: bash scripts/setup-ses-production.sh

echo "📧 CONFIGURAÇÃO AWS SES PARA PRODUÇÃO"
echo "======================================"
echo ""

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "⚠️  Arquivo .env não encontrado!"
    echo "   Criando a partir de env.production.example..."
    if [ -f env.production.example ]; then
        cp env.production.example .env
        echo "   ✅ Arquivo .env criado"
    else
        echo "   ❌ env.production.example não encontrado"
        exit 1
    fi
fi

echo "1️⃣ Verificar Domínio no SES"
echo "   Acesse: https://console.aws.amazon.com/ses/"
echo "   - Vá em 'Verified identities'"
echo "   - Verifique se seu domínio está 'Verified'"
echo ""
read -p "Domínio verificado? (s/n): " domain_verified

if [ "$domain_verified" != "s" ]; then
    echo "⚠️  Configure a verificação do domínio primeiro!"
    echo "   Veja: docs/AWS-SES-SETUP.md"
    exit 1
fi

echo ""
echo "2️⃣ Verificar Status do Sandbox"
echo "   Acesse: https://console.aws.amazon.com/ses/"
echo "   - Vá em 'Account dashboard'"
echo "   - Verifique se está 'Approved' para produção"
echo ""
read -p "Está aprovado para produção? (s/n): " approved

if [ "$approved" != "s" ]; then
    echo "⚠️  Você precisa sair do sandbox!"
    echo "   - Vá em 'Account dashboard' → 'Request production access'"
    echo "   - Preencha o formulário"
    echo "   - Aguarde aprovação (24-48h)"
    echo ""
    read -p "Deseja continuar mesmo assim? (s/n): " continue_anyway
    if [ "$continue_anyway" != "s" ]; then
        exit 1
    fi
fi

echo ""
echo "3️⃣ Obter Credenciais SMTP"
echo "   Acesse: https://console.aws.amazon.com/ses/"
echo "   - Vá em 'SMTP settings'"
echo "   - Clique em 'Create SMTP credentials'"
echo "   - Guarde o username e password"
echo ""

read -p "Digite o SMTP Hostname (ex: email-smtp.sa-east-1.amazonaws.com): " smtp_host
read -p "Digite o SMTP Port (587 ou 465): " smtp_port
read -p "Digite o SMTP Username: " smtp_user
read -p "Digite o SMTP Password: " smtp_pass
read -p "Digite o Email From (ex: AtenMed <contato@atenmed.com.br>): " email_from

echo ""
echo "4️⃣ Configurando arquivo .env..."

# Atualizar .env
sed -i.bak "s|EMAIL_HOST=.*|EMAIL_HOST=$smtp_host|" .env
sed -i.bak "s|EMAIL_PORT=.*|EMAIL_PORT=$smtp_port|" .env
sed -i.bak "s|EMAIL_USER=.*|EMAIL_USER=$smtp_user|" .env
sed -i.bak "s|EMAIL_PASS=.*|EMAIL_PASS=$smtp_pass|" .env
sed -i.bak "s|EMAIL_FROM=.*|EMAIL_FROM=$email_from|" .env

if [ "$smtp_port" == "587" ]; then
    sed -i.bak "s|EMAIL_SECURE=.*|EMAIL_SECURE=false|" .env
elif [ "$smtp_port" == "465" ]; then
    sed -i.bak "s|EMAIL_SECURE=.*|EMAIL_SECURE=true|" .env
fi

echo "   ✅ Variáveis atualizadas no .env"
echo ""

# Limpar backup
rm -f .env.bak

echo "5️⃣ Testando configuração..."
echo ""

node scripts/test-email-ses.js

echo ""
echo "✅ CONFIGURAÇÃO COMPLETA!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Verifique se o email de teste chegou"
echo "   2. Monitore bounces/complaints no SES"
echo "   3. Configure notificações SNS (opcional)"
echo ""

