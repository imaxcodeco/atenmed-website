# 🔄 Guia de Migração: WhatsApp Business API → Evolution API

## 📋 Visão Geral

Este guia explica como migrar do **WhatsApp Business API oficial** (Meta/Facebook) para a **Evolution API**, uma alternativa open-source que não requer aprovação da Meta.

## 🎯 Por que migrar?

### Vantagens da Evolution API:
- ✅ **Sem aprovação da Meta** - Funciona imediatamente
- ✅ **Sem custos de mensagens** - Gratuito (exceto servidor)
- ✅ **Mais flexível** - Controle total sobre a instância
- ✅ **Múltiplas instâncias** - Pode ter várias contas
- ✅ **QR Code simples** - Conecta como WhatsApp Web

### Desvantagens:
- ⚠️ **Não oficial** - Pode ter riscos de bloqueio
- ⚠️ **Requer servidor próprio** - Precisa hospedar a Evolution API
- ⚠️ **Manutenção** - Você é responsável pela infraestrutura

## 🚀 Passo 1: Instalar Evolution API

### Opção A: Docker (Recomendado)

```bash
# Clone o repositório
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api

# Configure o .env
cp .env.example .env
nano .env

# Configure:
# - DATABASE_URL (MongoDB)
# - REDIS_URL (Redis)
# - SERVER_URL (URL do seu servidor)
# - API_KEY (chave de autenticação)

# Inicie com Docker Compose
docker-compose up -d
```

### Opção B: Serviço Gerenciado

Você pode usar serviços como:
- **Evolution API Cloud** (se disponível)
- **Serviços de hospedagem** que oferecem Evolution API

## 🔧 Passo 2: Configurar no AtenMed

### 1. Variáveis de Ambiente

Adicione ao seu arquivo `.env`:

```bash
# Evolution API - OBRIGATÓRIO
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua_chave_api_aqui
EVOLUTION_INSTANCE_NAME=atenmed-main

# Evolution API - Webhook (URL pública do seu servidor)
EVOLUTION_WEBHOOK_URL=https://atenmed.com.br/api/whatsapp-evolution/webhook

# Desabilitar WhatsApp Business API oficial (opcional)
# WHATSAPP_TOKEN=
# WHATSAPP_PHONE_ID=
```

### 2. Obter API Key

1. Acesse o painel da Evolution API (geralmente em `http://seu-servidor:8080`)
2. Vá em **Configurações** → **API Keys**
3. Crie uma nova API Key
4. Copie e cole no `.env` como `EVOLUTION_API_KEY`

### 3. Criar Instância

A instância será criada automaticamente na primeira conexão, ou você pode criar manualmente:

```bash
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: sua_chave_api" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "atenmed-main",
    "token": "token_opcional",
    "qrcode": true
  }'
```

## 📱 Passo 3: Conectar WhatsApp

### Via Interface Web

1. Acesse: `https://atenmed.com.br/api/whatsapp-evolution/qrcode` (requer autenticação)
2. Escaneie o QR Code com seu WhatsApp
3. Aguarde a conexão

### Via API

```bash
# Obter QR Code
curl -X GET http://localhost:8080/instance/connect/atenmed-main \
  -H "apikey: sua_chave_api"

# Verificar status
curl -X GET http://localhost:8080/instance/fetchInstances \
  -H "apikey: sua_chave_api"
```

## 🔄 Passo 4: Migrar Código

### Atualizar Serviços

Os serviços que usam WhatsApp precisam ser atualizados:

#### reminderService.js

```javascript
// ANTES (WhatsApp Business API)
const whatsappService = require('./whatsappServiceV2');
await whatsappService.sendMessage(phone, message);

// DEPOIS (Evolution API)
const whatsappEvolutionService = require('./whatsappEvolutionService');
await whatsappEvolutionService.sendMessage(phone, message);
```

#### waitlistService.js

Mesma alteração acima.

### Atualizar Rotas

As rotas antigas continuam funcionando, mas você pode migrar gradualmente:

```javascript
// Rotas antigas (ainda funcionam)
app.use('/api/whatsapp', whatsappRoutes);

// Novas rotas (Evolution API)
app.use('/api/whatsapp-evolution', whatsappEvolutionRoutes);
```

## 🧪 Passo 5: Testar

### 1. Testar Envio de Mensagem

```bash
curl -X POST https://atenmed.com.br/api/whatsapp-evolution/send \
  -H "Authorization: Bearer seu_token" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "text": "Teste de mensagem"
  }'
```

### 2. Verificar Webhook

Envie uma mensagem para o número conectado e verifique os logs:

```bash
pm2 logs atenmed | grep "Evolution API"
```

### 3. Testar Lembretes

Crie um agendamento de teste e verifique se os lembretes são enviados.

## 🔍 Troubleshooting

### Instância não conecta

1. Verifique se a Evolution API está rodando:
   ```bash
   docker ps | grep evolution
   ```

2. Verifique os logs:
   ```bash
   docker logs evolution-api
   ```

3. Tente gerar novo QR Code:
   ```bash
   curl -X GET http://localhost:8080/instance/connect/atenmed-main \
     -H "apikey: sua_chave_api"
   ```

### Mensagens não chegam

1. Verifique o status da instância:
   ```bash
   curl -X GET http://localhost:8080/instance/fetchInstances \
     -H "apikey: sua_chave_api"
   ```
   
   Status deve ser `"open"`

2. Verifique se o webhook está configurado:
   ```bash
   curl -X GET http://localhost:8080/webhook/find/atenmed-main \
     -H "apikey: sua_chave_api"
   ```

3. Verifique os logs do servidor:
   ```bash
   pm2 logs atenmed
   ```

### Erro 401 Unauthorized

- Verifique se `EVOLUTION_API_KEY` está correto no `.env`
- Verifique se a API Key está válida na Evolution API

### Erro 404 Not Found

- Verifique se `EVOLUTION_API_URL` está correto
- Verifique se a instância existe:
  ```bash
  curl -X GET http://localhost:8080/instance/fetchInstances \
    -H "apikey: sua_chave_api"
  ```

## 📊 Comparação de Funcionalidades

| Funcionalidade | WhatsApp Business API | Evolution API |
|---------------|---------------------|---------------|
| Aprovação Meta | ✅ Necessária | ❌ Não precisa |
| Custo por mensagem | 💰 Sim | ✅ Grátis |
| Rate Limits | ⚠️ Sim | ✅ Flexível |
| Múltiplas instâncias | ❌ Limitado | ✅ Ilimitado |
| QR Code | ❌ Não | ✅ Sim |
| Webhook | ✅ Sim | ✅ Sim |
| Mídia | ✅ Sim | ✅ Sim |
| Status oficial | ✅ Oficial | ⚠️ Não oficial |

## 🔒 Segurança

### Boas Práticas:

1. **Use HTTPS** para o webhook
2. **Proteja a API Key** - nunca exponha no frontend
3. **Use autenticação** nas rotas de gerenciamento
4. **Monitore logs** regularmente
5. **Backup** das configurações

## 📝 Checklist de Migração

- [ ] Evolution API instalada e rodando
- [ ] Variáveis de ambiente configuradas
- [ ] Instância criada
- [ ] WhatsApp conectado (QR Code escaneado)
- [ ] Webhook configurado
- [ ] Teste de envio funcionando
- [ ] Teste de recebimento funcionando
- [ ] Lembretes funcionando
- [ ] Agendamentos via WhatsApp funcionando
- [ ] Logs sendo monitorados

## 🆘 Suporte

Para problemas ou dúvidas:
- **Documentação Evolution API**: https://doc.evolution-api.com
- **GitHub**: https://github.com/EvolutionAPI/evolution-api
- **Email**: contato@atenmed.com.br

---

**Última atualização:** Dezembro 2024

