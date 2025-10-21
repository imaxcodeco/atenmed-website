# 🔗 Guia Completo: Configurar Webhooks do WhatsApp Business API

## 🎯 O Que São Webhooks?

Webhooks são **"notificações automáticas"** que o WhatsApp envia para o seu servidor quando algo acontece, como:
- 📥 Nova mensagem recebida
- ✅ Mensagem entregue
- 👁️ Mensagem lida
- ❌ Falha no envio

**Sem webhook = Seu bot não recebe mensagens!**

---

## 📋 Pré-requisitos

Antes de configurar o webhook, certifique-se de ter:

- ✅ Conta no Meta for Developers
- ✅ App criado com WhatsApp integrado
- ✅ Servidor em produção (não localhost!)
- ✅ HTTPS obrigatório (HTTP não funciona!)
- ✅ Domínio configurado: `https://atenmed.com.br`

---

## 🚀 Passo 1: Preparar o Servidor

### 1.1 - Verificar se o Servidor Está Online

```bash
# Teste se sua URL está acessível:
curl https://atenmed.com.br/api/whatsapp/webhook
```

**Resposta esperada:** `403 Forbidden` ou similar (normal, webhook ainda não está verificado)

### 1.2 - Definir o Verify Token

No seu servidor AWS, edite o arquivo `.env`:

```bash
ssh -i "sua-chave.pem" ubuntu@3.129.206.231
cd /var/www/atenmed
sudo nano .env
```

Adicione ou verifique esta linha:

```env
WHATSAPP_VERIFY_TOKEN=atenmed_webhook_2024_secure_v1
```

**⚠️ IMPORTANTE:**
- Use uma senha forte e única
- Guarde bem este token - você vai precisar no Meta
- **NÃO compartilhe** este token publicamente

**Salvar:**
- `Ctrl + X` → `Y` → `Enter`

### 1.3 - Reiniciar o Servidor

```bash
pm2 restart atenmed
```

**Verificar se funcionou:**

```bash
pm2 logs atenmed --lines 20
```

Deve aparecer:
```
✅ Servidor iniciado na porta 3000
✅ WhatsApp Service inicializado
```

---

## 🌐 Passo 2: Configurar no Meta for Developers

### 2.1 - Acessar o Dashboard

1. Acesse: https://developers.facebook.com/
2. Clique em **"My Apps"**
3. Selecione seu app (ex: "AtenMed WhatsApp")

### 2.2 - Ir para Configuração do WhatsApp

```
Dashboard do App
    ↓
Menu Lateral → "WhatsApp"
    ↓
Clique em "Configuration"
```

Você verá uma tela como esta:

```
┌────────────────────────────────────────────────┐
│ WhatsApp Business API - Configuration         │
├────────────────────────────────────────────────┤
│                                                │
│ 📱 Phone Number                                │
│    +5511999999999                              │
│    [Manage Phone Number]                       │
│                                                │
│ 🔗 Webhook                                     │
│    Callback URL: [____________________] [Edit] │
│    Verify Token: [____________________]        │
│                                                │
│ 📊 Webhook Fields                              │
│    □ messages                                  │
│    □ message_status                            │
│                                                │
└────────────────────────────────────────────────┘
```

### 2.3 - Clicar em "Edit" no Webhook

Na seção **"Webhook"**, você verá:

- **Callback URL:** (vazio ou URL antiga)
- **Verify Token:** (vazio ou token antigo)

Clique no botão **"Edit"** ao lado de "Callback URL"

---

## ⚙️ Passo 3: Preencher os Dados do Webhook

### 3.1 - Tela de Configuração

Aparecerá um modal como este:

```
┌──────────────────────────────────────────┐
│  Edit Webhook                        [X] │
├──────────────────────────────────────────┤
│                                          │
│  Callback URL *                          │
│  ┌────────────────────────────────────┐  │
│  │ https://                           │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Verify Token *                          │
│  ┌────────────────────────────────────┐  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│            [Cancel]  [Verify and Save]   │
│                                          │
└──────────────────────────────────────────┘
```

### 3.2 - Preencher Callback URL

**Cole esta URL exata:**

```
https://atenmed.com.br/api/whatsapp/webhook
```

**⚠️ ATENÇÃO:**
- ✅ Deve começar com `https://` (HTTPS obrigatório!)
- ✅ Sem espaços antes ou depois
- ✅ Sem barra `/` no final
- ❌ **NÃO use** `http://` (não funciona!)
- ❌ **NÃO use** `localhost` (não funciona!)

### 3.3 - Preencher Verify Token

**Cole o MESMO token que você colocou no `.env`:**

```
atenmed_webhook_2024_secure_v1
```

**⚠️ Deve ser EXATAMENTE IGUAL ao que está no `.env`**

### 3.4 - Clicar em "Verify and Save"

Clique no botão verde **"Verify and Save"**

---

## ✅ Passo 4: Verificação Automática

### 4.1 - O Que Acontece?

Quando você clica em "Verify and Save", o Meta faz uma chamada para o seu servidor:

```
Meta → GET https://atenmed.com.br/api/whatsapp/webhook
      ?hub.mode=subscribe
      &hub.verify_token=atenmed_webhook_2024_secure_v1
      &hub.challenge=123456789
```

### 4.2 - O Que Seu Servidor Faz?

```javascript
// routes/whatsapp.js já está configurado!

1. Recebe a requisição
2. Compara o token enviado com o do .env
3. Se for igual → Retorna o challenge
4. Se for diferente → Retorna erro 403
```

### 4.3 - Resultados Possíveis

#### ✅ **SUCESSO:**

```
┌──────────────────────────────────────────┐
│  ✅ Webhook verified successfully!       │
│                                          │
│  Your webhook is now configured and      │
│  ready to receive notifications.         │
│                                          │
│            [OK]                          │
└──────────────────────────────────────────┘
```

**Parabéns! Webhook configurado! 🎉**

#### ❌ **ERRO - Token Inválido:**

```
┌──────────────────────────────────────────┐
│  ❌ Webhook verification failed           │
│                                          │
│  The verify token doesn't match.         │
│  Please check your settings.             │
│                                          │
│            [Try Again]                   │
└──────────────────────────────────────────┘
```

**Solução:**
1. Verifique se o token no `.env` está correto
2. Verifique se reiniciou o servidor: `pm2 restart atenmed`
3. Tente novamente

#### ❌ **ERRO - URL Não Acessível:**

```
┌──────────────────────────────────────────┐
│  ❌ Webhook verification failed           │
│                                          │
│  Could not connect to your server.       │
│  Please check the URL and try again.     │
│                                          │
│            [Try Again]                   │
└──────────────────────────────────────────┘
```

**Solução:**
1. Teste manualmente: `curl https://atenmed.com.br/api/whatsapp/webhook`
2. Verifique se o servidor está rodando: `pm2 status`
3. Verifique firewall/security groups no AWS
4. Certifique-se que está usando HTTPS

---

## 📊 Passo 5: Configurar Campos do Webhook

### 5.1 - Por Que Configurar?

Após verificar o webhook, você precisa dizer **QUAIS eventos** quer receber.

### 5.2 - Campos Disponíveis

Na mesma página "Configuration", role até **"Webhook Fields"**:

```
┌────────────────────────────────────────────┐
│ 📊 Webhook Fields                          │
├────────────────────────────────────────────┤
│                                            │
│ Select the fields you want to subscribe:  │
│                                            │
│ ☑ messages                  [Subscribe]   │
│   Receive new messages from users          │
│                                            │
│ □ message_status           [Subscribe]   │
│   Receive message delivery status          │
│                                            │
│ □ messaging_handovers      [Subscribe]   │
│   Receive handover notifications           │
│                                            │
└────────────────────────────────────────────┘
```

### 5.3 - Campos Recomendados

#### **1. messages** ⭐ **OBRIGATÓRIO**
- ✅ Marque este campo!
- Recebe mensagens enviadas pelos usuários
- **Sem este campo, seu bot não recebe nada!**

**Clique em "Subscribe" ao lado de "messages"**

#### **2. message_status** (Opcional, mas útil)
- ✅ Recomendado
- Recebe notificações de entrega e leitura
- Útil para métricas e analytics

**Clique em "Subscribe" ao lado de "message_status"**

### 5.4 - Após Assinar

Quando assinado com sucesso, você verá:

```
☑ messages                    ✅ Subscribed
☑ message_status              ✅ Subscribed
```

---

## 🧪 Passo 6: Testar o Webhook

### 6.1 - Enviar Mensagem de Teste

Agora vamos testar se está funcionando!

**Opção 1: Pelo Painel de Teste**

```
1. Acesse: https://atenmed.com.br/whatsapp-test
2. Preencha o formulário:
   - Número: +5511999999999
   - Mensagem: "Teste webhook"
3. Clique em "Enviar"
```

**Opção 2: Pelo WhatsApp Diretamente**

```
1. No seu celular, abra o WhatsApp
2. Envie mensagem para o número do WhatsApp Business
3. Aguarde resposta automática do bot
```

### 6.2 - Verificar Logs do Servidor

```bash
ssh -i "sua-chave.pem" ubuntu@3.129.206.231
pm2 logs atenmed --lines 50
```

**Procure por estas mensagens:**

```
✅ Webhook verificado com sucesso
📱 Tentativa de verificação de webhook WhatsApp
📥 Mensagem recebida de +5511999999999
🤖 Processando mensagem: "Teste webhook"
💬 Bot respondeu para +5511999999999
```

### 6.3 - Testar no Meta Tools

O Meta tem uma ferramenta para testar webhooks:

```
1. Vá para: Configuration → Webhook
2. Role até encontrar "Test"
3. Selecione "messages"
4. Clique em "Test"
```

Você receberá uma mensagem de teste no seu servidor!

---

## 🔍 Passo 7: Verificar se Está Funcionando

### Checklist Rápido:

- [ ] Webhook verificado com sucesso no Meta? ✅
- [ ] Campo "messages" assinado? ✅
- [ ] Servidor AWS rodando? `pm2 status` → online ✅
- [ ] Logs mostram mensagens recebidas? ✅
- [ ] Bot responde automaticamente? ✅

**Se todos marcados = FUNCIONANDO! 🎉**

---

## 🔧 Solução de Problemas

### ❌ Problema 1: "Webhook verification failed"

**Sintoma:** Não consegue salvar o webhook no Meta

**Causas Possíveis:**

1. **Token diferente**
   ```bash
   # Verifique o token no servidor:
   cat /var/www/atenmed/.env | grep VERIFY_TOKEN
   
   # Deve ser IGUAL ao que colocou no Meta
   ```

2. **Servidor não está rodando**
   ```bash
   pm2 status
   # Se não estiver "online", faça:
   pm2 restart atenmed
   ```

3. **URL incorreta**
   - Verifique se digitou: `https://atenmed.com.br/api/whatsapp/webhook`
   - Sem espaços, sem barra final

4. **Firewall bloqueando**
   ```bash
   # Teste se está acessível:
   curl https://atenmed.com.br/api/whatsapp/webhook
   
   # Deve retornar algo, não erro de conexão
   ```

### ❌ Problema 2: "Webhook funcionou, mas não recebo mensagens"

**Sintoma:** Webhook verificado, mas bot não responde

**Solução:**

1. **Verificar se subscreveu o campo "messages"**
   - Vá em Configuration → Webhook Fields
   - Confirme que "messages" está com ✅ Subscribed

2. **Verificar logs do servidor**
   ```bash
   pm2 logs atenmed --lines 100
   
   # Procure por:
   # - "📥 Mensagem recebida"
   # - Erros ou warnings
   ```

3. **Verificar se o número está no sandbox**
   - Se usando número de teste, adicione destinatários
   - Vá em: API Setup → To → Manage phone numbers

### ❌ Problema 3: "Connection timeout"

**Sintoma:** Erro de timeout ao verificar webhook

**Solução:**

1. **Verificar DNS**
   ```bash
   nslookup atenmed.com.br
   # Deve retornar o IP do seu servidor
   ```

2. **Verificar Security Group no AWS**
   - Porta 443 (HTTPS) deve estar aberta
   - Aceitar tráfego de IPs do Meta:
     - `157.240.0.0/16`
     - `31.13.24.0/21`
     - `66.220.144.0/20`

3. **Verificar Nginx**
   ```bash
   sudo systemctl status nginx
   # Deve estar "active (running)"
   ```

### ❌ Problema 4: "SSL Certificate Error"

**Sintoma:** Erro de certificado SSL

**Solução:**

1. **Renovar certificado SSL**
   ```bash
   sudo certbot renew
   sudo systemctl reload nginx
   ```

2. **Verificar validade**
   ```bash
   echo | openssl s_client -connect atenmed.com.br:443 2>/dev/null | openssl x509 -noout -dates
   ```

---

## 📝 Estrutura do Webhook (Para Desenvolvedores)

### Request de Verificação (GET)

```http
GET /api/whatsapp/webhook?
  hub.mode=subscribe&
  hub.verify_token=atenmed_webhook_2024_secure_v1&
  hub.challenge=1234567890

Host: atenmed.com.br
```

### Response Esperada

```http
HTTP/1.1 200 OK
Content-Type: text/plain

1234567890
```

### Request de Mensagem (POST)

```http
POST /api/whatsapp/webhook
Host: atenmed.com.br
Content-Type: application/json

{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "BUSINESS_ACCOUNT_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "5511999999999",
          "phone_number_id": "PHONE_NUMBER_ID"
        },
        "contacts": [{
          "profile": {
            "name": "João Silva"
          },
          "wa_id": "5511888888888"
        }],
        "messages": [{
          "from": "5511888888888",
          "id": "wamid.HBgLNTU...",
          "timestamp": "1698765432",
          "text": {
            "body": "Olá, preciso agendar uma consulta"
          },
          "type": "text"
        }]
      },
      "field": "messages"
    }]
  }]
}
```

### Response Esperada

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Webhook recebido e processado"
}
```

---

## ✅ Checklist Final

Antes de considerar concluído, verifique:

**No Meta for Developers:**
- [ ] App criado ✅
- [ ] WhatsApp adicionado ao app ✅
- [ ] Número de telefone verificado ✅
- [ ] Webhook URL configurada: `https://atenmed.com.br/api/whatsapp/webhook` ✅
- [ ] Verify Token configurado ✅
- [ ] Webhook verificado com sucesso ✅
- [ ] Campo "messages" subscrito ✅
- [ ] Campo "message_status" subscrito (opcional) ✅

**No Servidor AWS:**
- [ ] `.env` com `WHATSAPP_VERIFY_TOKEN` ✅
- [ ] `.env` com `WHATSAPP_PHONE_ID` ✅
- [ ] `.env` com `WHATSAPP_TOKEN` ✅
- [ ] Servidor rodando: `pm2 status` → online ✅
- [ ] Nginx rodando: `systemctl status nginx` → active ✅
- [ ] SSL válido (HTTPS funcionando) ✅
- [ ] Security Group permitindo porta 443 ✅

**Teste Final:**
- [ ] Enviar mensagem do celular para o bot ✅
- [ ] Bot responde automaticamente ✅
- [ ] Logs mostram mensagem recebida ✅
- [ ] Painel de teste mostra status "Conectado" ✅

---

## 🎉 Pronto!

Se todos os itens estão marcados: **PARABÉNS!** 🎊

Seu webhook está **100% configurado e funcionando!**

### 🚀 Próximos Passos:

1. **Teste conversas reais** - Envie diferentes tipos de mensagens
2. **Monitore logs** - `pm2 logs atenmed` para acompanhar
3. **Use o painel** - https://atenmed.com.br/whatsapp-test
4. **Adicione clientes** - Comece a usar em produção!

---

## 📚 Links Úteis

- **Documentação Oficial:** https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
- **Webhook Testing Tool:** https://webhook.site (para debug)
- **Meta Business Help:** https://business.facebook.com/help
- **Painel de Teste AtenMed:** https://atenmed.com.br/whatsapp-test

---

**Criado em:** 21/10/2025  
**Versão:** 1.0.0  
**Status:** ✅ Testado e Funcionando


