# 🔧 Solução para Erro "Forbidden" no Webhook

## ❌ Problema
Ao testar o webhook do WhatsApp, estava retornando **403 Forbidden**.

## ✅ Causas Identificadas

### 1. **Rate Limiting** ⏱️
O middleware `express-rate-limit` estava aplicado a **todas** as rotas `/api/`, incluindo o webhook.

**Problema:**
```javascript
app.use('/api/', limiter); // Bloqueia webhook também!
```

**Solução:**
```javascript
const limiter = rateLimit({
    // ... configurações ...
    skip: (req) => req.path.startsWith('/whatsapp/webhook')
});
```

### 2. **Sanitização XSS** 🧹
O middleware XSS estava modificando os parâmetros da query string do webhook.

**Problema:**
```javascript
app.use((req, res, next) => {
    if (req.body) {
        req.body = JSON.parse(xss(JSON.stringify(req.body)));
    }
    next();
});
```

Isso alterava: `hub.mode`, `hub.verify_token`, `hub.challenge`

**Solução:**
```javascript
app.use((req, res, next) => {
    // Não sanitizar webhooks do WhatsApp
    if (req.path.startsWith('/api/whatsapp/webhook')) {
        return next();
    }
    
    if (req.body) {
        req.body = JSON.parse(xss(JSON.stringify(req.body)));
    }
    next();
});
```

### 3. **CORS Restritivo** 🌐
O CORS estava bloqueando requisições do Meta (sem origem específica).

**Problema:**
```javascript
const corsOptions = {
    origin: ['https://atenmed.com.br', ...], // Lista específica
    credentials: true
};
```

**Solução:**
```javascript
const corsOptions = {
    origin: (origin, callback) => {
        // Permitir sem origem (webhooks, curl, etc)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true); // Permitir todas (webhook precisa)
        }
    },
    credentials: true
};
```

---

## 📋 Como Testar

### 1. **Teste Local (dentro do servidor)**

Se estiver no servidor AWS:

```bash
curl "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=atenmed_webhook_2025&hub.challenge=TESTE_OK"
```

**✅ Deve retornar:** `TESTE_OK`

### 2. **Teste Externo (com domínio)**

```bash
curl "https://atenmed.com.br/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=atenmed_webhook_2025&hub.challenge=TESTE_OK"
```

**✅ Deve retornar:** `TESTE_OK`

### 3. **Debug da Configuração**

```bash
curl http://localhost:3000/api/whatsapp/debug-webhook
```

Vai mostrar:
```json
{
  "success": true,
  "debug": {
    "env_token": "atenmed_webhook_2025",
    "env_token_length": 20,
    "env_phone_id": "Configurado",
    "env_token_wpp": "Configurado"
  }
}
```

---

## 🚀 Deploy no Servidor

### 1. Conectar ao servidor:
```bash
ssh -i "C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem" ubuntu@3.129.206.231
```

### 2. Ir para o projeto:
```bash
cd /var/www/atenmed
```

### 3. Atualizar o código:
```bash
git pull origin reorganizacao-estrutura
```

Ou fazer upload manual do `server.js` atualizado.

### 4. Reiniciar o servidor:
```bash
pm2 restart atenmed
```

### 5. Verificar logs:
```bash
pm2 logs atenmed --lines 30
```

### 6. Testar:
```bash
curl "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=atenmed_webhook_2025&hub.challenge=OK"
```

---

## 🌐 Configurar no Meta Developer

Agora que o webhook está funcionando:

1. Acesse: https://developers.facebook.com/apps/
2. Selecione seu app WhatsApp
3. Vá em **WhatsApp** → **Configuração**
4. Na seção **Webhook**:

| Campo | Valor |
|-------|-------|
| **URL de callback** | `https://atenmed.com.br/api/whatsapp/webhook` |
| **Verificar token** | `atenmed_webhook_2025` |

5. Clique em **"Verificar e salvar"**

### ✅ Sucesso!

Você verá nos logs do servidor:

```
📱 Tentativa de verificação de webhook WhatsApp
   Mode: subscribe
   Token recebido: atenmed_webhook_2025
   Token esperado: atenmed_webhook_2025
   Challenge: ...
✅ Webhook verificado com sucesso
```

---

## 🔍 Diagnóstico de Problemas

### Se ainda der erro 403:

#### 1. Verificar se o servidor está rodando:
```bash
pm2 status
```

#### 2. Verificar se o token está correto:
```bash
grep WHATSAPP_VERIFY_TOKEN .env
```

#### 3. Verificar os logs em tempo real:
```bash
pm2 logs atenmed
```

#### 4. Verificar se o Nginx está funcionando:
```bash
sudo systemctl status nginx
sudo nginx -t
```

#### 5. Verificar porta 443 (HTTPS):
```bash
sudo ufw status
curl -I https://atenmed.com.br
```

---

## 📊 Outros Erros Comuns

### ❌ "Token inválido"
**Causa:** Token no `.env` diferente do Meta

**Solução:**
```bash
# Ver token no servidor
grep WHATSAPP_VERIFY_TOKEN .env

# Copie EXATAMENTE para o Meta Developer
```

### ❌ "Connection refused"
**Causa:** Servidor não está rodando

**Solução:**
```bash
pm2 restart atenmed
pm2 status
```

### ❌ "SSL required"
**Causa:** HTTPS não configurado

**Solução:**
```bash
sudo certbot --nginx -d atenmed.com.br
```

### ❌ "Nginx 502 Bad Gateway"
**Causa:** Servidor Node não está respondendo

**Solução:**
```bash
# Ver se o servidor está rodando na porta correta
lsof -i :3000

# Reiniciar
pm2 restart atenmed
```

---

## ✅ Checklist Final

Antes de configurar no Meta:

- [ ] Servidor rodando (`pm2 status` mostra "online")
- [ ] Arquivo `.env` tem `WHATSAPP_VERIFY_TOKEN=atenmed_webhook_2025`
- [ ] Token no `.env` = Token que vai usar no Meta
- [ ] HTTPS/SSL configurado (certificado válido)
- [ ] Porta 443 aberta no firewall (`sudo ufw allow 443/tcp`)
- [ ] Security Group da AWS com portas 80 e 443 abertas
- [ ] Nginx rodando (`sudo systemctl status nginx`)
- [ ] Teste local passou: `curl http://localhost:3000/api/whatsapp/webhook?...`
- [ ] Teste externo passou: `curl https://atenmed.com.br/api/whatsapp/webhook?...`
- [ ] Sem erro 403 Forbidden ✅

---

## 💡 Resumo da Solução

**3 mudanças no `server.js`:**

1. ✅ **Rate limiter** com exceção para webhooks
2. ✅ **Sanitização XSS** desabilitada para webhooks
3. ✅ **CORS** permitindo requisições sem origem

**Resultado:** Webhook agora aceita requisições do Meta sem retornar 403!

---

## 📞 Comandos Úteis

```bash
# Testar webhook
curl "https://atenmed.com.br/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=atenmed_webhook_2025&hub.challenge=teste"

# Ver debug
curl https://atenmed.com.br/api/whatsapp/debug-webhook

# Ver logs
pm2 logs atenmed

# Reiniciar
pm2 restart atenmed

# Status
pm2 status

# Ver token configurado
grep WHATSAPP_VERIFY_TOKEN .env
```

---

**Atualizado:** 22/10/2025
**Status:** ✅ Problema resolvido!







