# 📱 Configuração WhatsApp Business API

## 🎯 Objetivo

Configurar a integração com WhatsApp Business API para automatizar:
- Confirmações de consultas
- Lembretes automáticos
- Respostas a perguntas frequentes
- Notificações de agendamento

---

## 📋 Pré-requisitos

1. Conta Meta for Developers
2. WhatsApp Business Account
3. Número de telefone verificado
4. Domínio verificado (atenmed.com.br)

---

## 🚀 Passo a Passo

### 1. Criar App no Meta for Developers

1. Acesse: https://developers.facebook.com/apps/
2. Clique em "Create App"
3. Escolha "Business" como tipo
4. Nome do App: "AtenMed WhatsApp"
5. Email de contato: contato@atenmed.com.br

### 2. Adicionar Produto WhatsApp

1. No dashboard do app, clique em "Add Product"
2. Selecione "WhatsApp" → "Set Up"
3. Em "Quick Start", siga as etapas

### 3. Obter Credenciais

Você precisará de 3 informações:

#### Phone Number ID
```
Localização: WhatsApp → API Setup → Phone Number ID
Exemplo: 123456789012345
```

#### Access Token
```
Localização: WhatsApp → API Setup → Temporary Access Token
⚠️ IMPORTANTE: Gere um token permanente depois!
```

#### Verify Token (Webhook)
```
Crie um token aleatório e seguro
Exemplo: atenmed_verify_token_2024_XyZ123
```

### 4. Configurar Webhook

1. No Meta for Developers:
   - WhatsApp → Configuration → Edit
   - Callback URL: `https://atenmed.com.br/api/whatsapp/webhook`
   - Verify Token: `seu-verify-token-aqui`
   - Subscribe to: messages

2. No servidor AWS, configure o `.env`:

```bash
# WhatsApp Business API
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_ID=123456789012345
WHATSAPP_TOKEN=seu-access-token-aqui
WHATSAPP_VERIFY_TOKEN=atenmed_verify_token_2024_XyZ123
```

### 5. Testar Configuração

```bash
# Via terminal no servidor
node test-webhook.js
```

Ou acesse:
```
https://atenmed.com.br/api/whatsapp/status
```

---

## 🧪 Testar Envio de Mensagem

```bash
curl -X POST https://atenmed.com.br/api/whatsapp/send-test \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511987654321",
    "message": "Teste de mensagem do AtenMed!"
  }'
```

---

## 📚 Recursos

- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Webhook Setup](https://developers.facebook.com/docs/whatsapp/webhooks)
- [Message Templates](https://developers.facebook.com/docs/whatsapp/message-templates)

---

## ⚠️ Limitações e Custos

- **Modo Sandbox**: 100 mensagens/dia (GRÁTIS)
- **Produção**: Pago por conversa
- **Templates**: Necessário aprovação do Meta
- **Número Verificado**: Obrigatório para produção

---

## 🔧 Troubleshooting

### Webhook não está recebendo mensagens
1. Verifique se o webhook está configurado corretamente
2. Teste manualmente: `https://atenmed.com.br/api/whatsapp/webhook?hub.verify_token=SEU_TOKEN&hub.challenge=TEST`
3. Verifique logs: `pm2 logs atenmed`

### Mensagens não estão sendo enviadas
1. Verifique o token de acesso
2. Confirme o Phone Number ID
3. Verifique se o número de destino está em formato internacional (+5511...)

