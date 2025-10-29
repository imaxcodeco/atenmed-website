# 🔧 Solução para Erro de Webhook WhatsApp

## ❌ Problema
"Não foi possível validar a URL de callback ou o token de verificação"

## ✅ Solução Passo a Passo

### 1. **Verificar Token de Verificação**

Abra seu arquivo `.env` e adicione/atualize:

```env
WHATSAPP_VERIFY_TOKEN=atenmed_webhook_secure_2024
```

⚠️ **IMPORTANTE**: O token no `.env` DEVE SER EXATAMENTE IGUAL ao token que você colocou na interface do Meta!

### 2. **Verificar se o Servidor Está Rodando**

```bash
# Rode o servidor
npm start
```

Verifique se você vê:
```
🚀 Servidor AtenMed rodando na porta 3000
```

### 3. **Testar o Webhook Localmente**

Abra o navegador e acesse:
```
http://localhost:3000/api/whatsapp/debug-webhook
```

Você deve ver suas configurações atuais, incluindo o token.

### 4. **Expor o Servidor para a Internet**

O WhatsApp precisa acessar seu servidor. Se estiver desenvolvendo localmente, use o **ngrok**:

#### Instalando ngrok:
```bash
# Download em: https://ngrok.com/download
# Ou via npm:
npm install -g ngrok

# Rodar:
ngrok http 3000
```

Você verá algo como:
```
Forwarding: https://abc123.ngrok.io -> http://localhost:3000
```

### 5. **Configurar no Meta Developer**

Use a URL do ngrok (ou seu domínio real em produção):

```
URL de callback: https://abc123.ngrok.io/api/whatsapp/webhook
Verificar token: atenmed_webhook_secure_2024
```

### 6. **Testar a Verificação Manualmente**

Abra o navegador e teste:
```
https://abc123.ngrok.io/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=atenmed_webhook_secure_2024&hub.challenge=teste123
```

✅ Se funcionar, você verá: `teste123`

## 🔍 Diagnóstico de Problemas

### Verificar Logs
Quando o WhatsApp tentar verificar, você verá nos logs do servidor:
```
📱 Tentativa de verificação de webhook WhatsApp
   Mode: subscribe
   Token recebido: atenmed_webhook_secure_2024
   Token esperado: atenmed_webhook_secure_2024
   Challenge: ...
✅ Webhook verificado com sucesso
```

### Problemas Comuns

#### ❌ Token não bate
```
Token recebido: atenmed_webhook_secure_2024
Token esperado: outro_token_diferente
```
**Solução**: Corrija o `.env` para usar o mesmo token da interface do Meta.

#### ❌ Servidor não responde
```
ERR_CONNECTION_REFUSED
```
**Solução**: Verifique se o servidor está rodando e o ngrok está ativo.

#### ❌ HTTPS obrigatório
```
URL must be HTTPS
```
**Solução**: Use ngrok (desenvolvimento) ou configure SSL no seu servidor (produção).

## 📋 Checklist Final

- [ ] `.env` tem `WHATSAPP_VERIFY_TOKEN` correto
- [ ] Servidor está rodando (`npm start`)
- [ ] ngrok está expondo o servidor (desenvolvimento)
- [ ] Token no Meta é EXATAMENTE o mesmo do `.env`
- [ ] URL de callback está correta: `https://SEU_DOMINIO/api/whatsapp/webhook`
- [ ] Testou manualmente no navegador e funcionou

## 🌐 Produção (AWS/VPS)

Se já estiver em produção com domínio próprio:

1. **Certifique-se de ter SSL (HTTPS)**
   - Nginx com Let's Encrypt
   - Certificado SSL válido

2. **URL de callback em produção:**
   ```
   https://atenmed.com.br/api/whatsapp/webhook
   ```

3. **Verificar se porta está aberta**
   ```bash
   sudo ufw status
   sudo ufw allow 443/tcp  # HTTPS
   ```

4. **Testar do servidor:**
   ```bash
   curl https://atenmed.com.br/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=atenmed_webhook_secure_2024&hub.challenge=teste
   ```

## 🆘 Precisa de Ajuda?

Execute este comando para diagnóstico completo:
```bash
curl http://localhost:3000/api/whatsapp/debug-webhook
```

Ou abra no navegador:
```
http://localhost:3000/api/whatsapp/debug-webhook
```

## 📞 Endpoint de Debug

Criamos um endpoint especial para te ajudar. Acesse:
```
GET /api/whatsapp/debug-webhook
```

Retorna:
```json
{
  "success": true,
  "debug": {
    "env_token": "atenmed_webhook_secure_2024",
    "env_token_length": 28,
    "env_phone_id": "Configurado",
    "env_token_wpp": "Configurado"
  }
}
```

---

**Dica de Ouro**: 💡
A causa mais comum do erro é o token estar diferente. Copie e cole o token do `.env` diretamente na interface do Meta (ou vice-versa) para garantir que sejam idênticos!








