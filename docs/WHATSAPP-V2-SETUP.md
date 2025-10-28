# 🚀 WhatsApp Business API V2 - Setup Completo

## 📋 O que mudou?

A nova versão (V2) do serviço de WhatsApp inclui:

✅ **Retry Logic** - Tenta novamente automaticamente em caso de falha  
✅ **Fila de Mensagens** - Sistema de queue com Bull/Redis  
✅ **Rate Limiting Inteligente** - Respeita limites da API do WhatsApp (80 msg/s)  
✅ **Validação de Signature** - Verifica autenticidade dos webhooks do Meta  
✅ **Tratamento de Erros Específicos** - Mensagens claras para cada tipo de erro  
✅ **Logs Detalhados** - Melhor visibilidade do que está acontecendo  

---

## 🔧 Configuração Inicial

### 1. **Variáveis de Ambiente**

Adicione ao seu arquivo `.env`:

```bash
# WhatsApp Business API - OBRIGATÓRIO
WHATSAPP_PHONE_ID=seu_phone_id_aqui
WHATSAPP_TOKEN=seu_token_permanente_aqui
WHATSAPP_VERIFY_TOKEN=atenmed_webhook_2025

# WhatsApp Business API - RECOMENDADO (Segurança)
WHATSAPP_APP_SECRET=seu_app_secret_aqui

# API URL (opcional - default: v18.0)
WHATSAPP_API_URL=https://graph.facebook.com/v18.0

# Redis (opcional - para fila de mensagens)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
# OU
REDIS_URL=redis://localhost:6379
```

### 2. **Como obter as credenciais?**

#### A) WHATSAPP_PHONE_ID e WHATSAPP_TOKEN

1. Acesse: https://developers.facebook.com/apps/
2. Selecione seu app (ou crie um novo)
3. Adicione o produto **WhatsApp** se ainda não tiver
4. Vá em **WhatsApp** → **API Setup**
5. Você verá:
   - **Phone Number ID** → copie para `WHATSAPP_PHONE_ID`
   - **Temporary Access Token** → gere um token **permanente** e copie para `WHATSAPP_TOKEN`

#### B) WHATSAPP_VERIFY_TOKEN

Você mesmo define! É qualquer string segura que será usada para verificar o webhook.

Exemplo: `atenmed_webhook_2025`

#### C) WHATSAPP_APP_SECRET (Recomendado)

1. No Meta Developer, vá em **Configurações** → **Básico**
2. Procure por **App Secret**
3. Clique em **Mostrar** e copie o valor
4. Cole em `WHATSAPP_APP_SECRET`

⚠️ **IMPORTANTE**: Em produção, o App Secret é **obrigatório** para validar a autenticidade dos webhooks!

---

## 🌐 Configurar Webhook no Meta

### Passo 1: URL e Token

1. Acesse: https://developers.facebook.com/apps/
2. Selecione seu app
3. Vá em **WhatsApp** → **Configuração**
4. Na seção **Webhooks**, clique em **Editar**
5. Configure:

| Campo | Valor |
|-------|-------|
| **URL de callback** | `https://seu-dominio.com.br/api/whatsapp/webhook` |
| **Verificar token** | O valor que você colocou em `WHATSAPP_VERIFY_TOKEN` |

6. Clique em **Verificar e salvar**

### Passo 2: Inscrever em Eventos

Ainda na página de Webhooks, role até **Webhook fields** e inscreva-se em:

- ✅ `messages` - Para receber mensagens dos usuários
- ✅ `message_status` - Para saber se suas mensagens foram entregues

---

## ✅ Testar a Configuração

### 1. Health Check

```bash
curl https://seu-dominio.com.br/api/whatsapp/health
```

**Resposta esperada:**
```json
{
  "success": true,
  "status": "healthy",
  "healthy": true,
  "issues": null,
  "stats": {
    "activeSessions": 0,
    "queueEnabled": true,
    "rateLimiterActive": true,
    "configured": true
  }
}
```

### 2. Verificar Configuração (Admin)

```bash
curl -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  https://seu-dominio.com.br/api/whatsapp/config
```

### 3. Enviar Mensagem de Teste (Admin)

```bash
curl -X POST https://seu-dominio.com.br/api/whatsapp/send-test \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511999999999",
    "message": "Teste de mensagem!"
  }'
```

### 4. Testar Webhook Localmente

Você pode simular uma mensagem recebida para testar o fluxo:

```bash
curl -X POST https://seu-dominio.com.br/api/whatsapp/test-webhook \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "5511999999999",
    "message": "oi"
  }'
```

---

## 🚨 Resolver Erros Comuns

### ❌ Erro 403 Forbidden

**Causas possíveis:**

1. **Token inválido ou expirado**
   - Solução: Gere um novo token permanente no Meta Developer
   - Verifique se copiou o token correto para `WHATSAPP_TOKEN`

2. **Phone Number ID incorreto**
   - Solução: Verifique se o `WHATSAPP_PHONE_ID` está correto
   - Certifique-se de usar o Phone Number ID, não o número de telefone

3. **Permissões insuficientes**
   - Solução: No Meta Developer, verifique as permissões do seu app
   - Necessário: `whatsapp_business_messaging` e `whatsapp_business_management`

4. **Rate limiting atingido**
   - Solução: Aguarde alguns minutos e tente novamente
   - A nova versão já implementa retry automático

### ❌ Erro 401 Unauthorized

**Causa:** Token de autenticação inválido

**Solução:**
```bash
# 1. Gere um novo token no Meta Developer
# 2. Atualize o .env
echo 'WHATSAPP_TOKEN=seu_novo_token_aqui' >> .env

# 3. Reinicie o servidor
pm2 restart atenmed
```

### ❌ Webhook não recebe mensagens

**Diagnóstico:**

```bash
# 1. Verifique se o webhook foi validado
curl https://seu-dominio.com.br/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=SEU_VERIFY_TOKEN&hub.challenge=teste

# Deve retornar: teste
```

**Checklist:**
- [ ] HTTPS configurado corretamente (certificado SSL válido)
- [ ] URL acessível externamente
- [ ] Porta 443 aberta no firewall
- [ ] Token de verificação correto
- [ ] Inscrito nos eventos corretos (messages)

### ❌ Erro "WABA_RATE_LIMIT_HIT"

**Causa:** Você atingiu o limite de 80 mensagens por segundo da API

**Solução:** A nova versão já implementa rate limiting automático. Se ainda ocorrer:

1. Verifique se está usando a versão V2 do serviço
2. Certifique-se de que o Bottleneck está instalado:
   ```bash
   npm list bottleneck
   ```
3. Ajuste o rate limiting se necessário (padrão: 77 req/s)

### ❌ Erro "RECIPIENT_NOT_REGISTERED"

**Causa:** O número de telefone não está registrado no WhatsApp

**Solução:**
1. Verifique se o número está no formato correto: `5511999999999` (código do país + DDD + número)
2. Certifique-se de que o número possui WhatsApp ativo
3. Teste com seu próprio número primeiro

---

## 📊 Monitoramento

### Ver Logs em Tempo Real

```bash
# PM2
pm2 logs atenmed --lines 50

# Ou arquivos de log
tail -f logs/combined.log
```

### Estatísticas do Serviço

```bash
curl -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  https://seu-dominio.com.br/api/whatsapp/stats
```

### Health Check Contínuo

Configure um monitor (como UptimeRobot) para verificar a cada 5 minutos:

```
GET https://seu-dominio.com.br/api/whatsapp/health
```

---

## 🔒 Segurança

### 1. Validação de Signature (OBRIGATÓRIO em Produção)

Configure o `WHATSAPP_APP_SECRET` para validar que os webhooks realmente vêm do Meta.

Sem isso, qualquer pessoa pode enviar webhooks falsos para seu servidor!

### 2. Rate Limiting

Já configurado automaticamente. Limita requisições para proteger seu servidor.

### 3. Logs

Evite logar tokens ou informações sensíveis. A nova versão já faz isso automaticamente.

---

## 🚀 Deploy em Produção

### 1. Variáveis de Ambiente

```bash
# No servidor
nano .env

# Adicione todas as variáveis (veja seção "Configuração Inicial")
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Reiniciar Serviço

```bash
pm2 restart atenmed
pm2 save
```

### 4. Verificar

```bash
# Status do PM2
pm2 status

# Health check
curl https://seu-dominio.com.br/api/whatsapp/health

# Logs
pm2 logs atenmed --lines 30
```

---

## 🆚 Migração de V1 para V2

A V2 é **retrocompatível** com a V1. Você pode migrar gradualmente:

### Opção 1: Substituir Completamente

```javascript
// No server.js, substitua:
const whatsappService = require('./services/whatsappService');
// Por:
const whatsappService = require('./services/whatsappServiceV2');

// E nas rotas:
app.use('/api/whatsapp', require('./routes/whatsappV2'));
```

### Opção 2: Testar em Paralelo

```javascript
// Manter ambas as versões:
app.use('/api/whatsapp', require('./routes/whatsapp')); // V1
app.use('/api/whatsapp-v2', require('./routes/whatsappV2')); // V2

// Configurar webhook para /api/whatsapp-v2/webhook
```

---

## 📞 Suporte

### Problema não resolvido?

1. **Verifique os logs:**
   ```bash
   pm2 logs atenmed --lines 100
   ```

2. **Execute o debug:**
   ```bash
   curl -H "Authorization: Bearer TOKEN" \
     https://seu-dominio.com.br/api/whatsapp/debug-webhook
   ```

3. **Health check:**
   ```bash
   curl https://seu-dominio.com.br/api/whatsapp/health
   ```

### Recursos Úteis

- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Meta Business Suite](https://business.facebook.com/)
- [Status da API](https://status.fb.com/)

---

## ✨ Features Avançadas

### Fila de Mensagens com Redis

Se você tem Redis instalado, a fila é habilitada automaticamente:

```bash
# Verificar se a fila está ativa
curl -H "Authorization: Bearer TOKEN" \
  https://seu-dominio.com.br/api/whatsapp/stats
```

**Vantagens:**
- ✅ Retry automático em caso de falha
- ✅ Não perde mensagens se o servidor reiniciar
- ✅ Priorização de mensagens
- ✅ Dashboard de monitoramento

### Dashboard de Filas (Bull Board)

Acesse: `https://seu-dominio.com.br/admin`

Você poderá:
- Ver mensagens na fila
- Ver mensagens processadas
- Ver mensagens que falharam
- Reprocessar mensagens manualmente

---

**Atualizado:** 27/10/2025  
**Versão:** 2.0  
**Status:** ✅ Pronto para produção



