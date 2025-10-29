# 🎯 Setup do Webhook WhatsApp - Guia Visual

## 🚀 Acesso Rápido ao Servidor

```bash
ssh -i "C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem" ubuntu@3.129.206.231
```

---

## ⚡ Método 1: Script Automático (Recomendado)

### Passo a Passo:

```bash
# 1. Entrar na pasta do projeto
cd /var/www/atenmed  # ou cd ~/AtenMed/Website

# 2. Dar permissão ao script
chmod +x scripts/setup-webhook-aws.sh

# 3. Executar
./scripts/setup-webhook-aws.sh
```

### O script vai pedir:

1. **Token de verificação**: `atenmed_webhook_secure_2024`
2. **Phone ID**: Cole o Phone ID do Meta Developer
3. **Token API**: Cole o token de acesso do WhatsApp

### ✅ Pronto! O script configura tudo automaticamente.

---

## 🔧 Método 2: Manual (Se o script não funcionar)

### 1️⃣ Editar o arquivo .env

```bash
nano .env
```

Adicione no final:

```env
# WhatsApp Webhook
WHATSAPP_VERIFY_TOKEN=atenmed_webhook_secure_2024
WHATSAPP_PHONE_ID=seu_phone_id_aqui
WHATSAPP_TOKEN=seu_token_aqui
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
```

**Salvar**: `Ctrl+O` → `Enter` → `Ctrl+X`

### 2️⃣ Reiniciar o servidor

```bash
pm2 restart atenmed
```

### 3️⃣ Ver os logs

```bash
pm2 logs atenmed
```

Procure por:
```
✅ WhatsApp Business Service inicializado
```

---

## 🧪 Testar a Configuração

### Teste Local (dentro do servidor):

```bash
curl "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=atenmed_webhook_secure_2024&hub.challenge=TESTE_OK"
```

**✅ Deve retornar**: `TESTE_OK`

### Teste Externo (com domínio):

```bash
curl "https://atenmed.com.br/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=atenmed_webhook_secure_2024&hub.challenge=TESTE_OK"
```

**✅ Deve retornar**: `TESTE_OK`

---

## 🌐 Configurar no Meta Developer

### 1. Acesse:
👉 https://developers.facebook.com/apps/

### 2. Selecione seu App WhatsApp

### 3. Vá em: **WhatsApp** → **Configuração**

### 4. Na seção **Webhook**, configure:

| Campo | Valor |
|-------|-------|
| **URL de callback** | `https://atenmed.com.br/api/whatsapp/webhook` |
| **Verificar token** | `atenmed_webhook_secure_2024` |

### 5. Clique em **"Verificar e salvar"**

### ✅ Sucesso!

Você verá uma mensagem de confirmação.

---

## 📊 Onde Obter os Tokens

### 🔑 WHATSAPP_PHONE_ID

1. Acesse: https://developers.facebook.com/apps/
2. Selecione seu app
3. **WhatsApp** → **Configurações da API**
4. Copie o **Phone Number ID**

### 🔑 WHATSAPP_TOKEN

1. No mesmo lugar acima
2. Clique em **"Gerar Token"**
3. Copie o token (começa com `EAA...`)

### 🔑 WHATSAPP_VERIFY_TOKEN

✨ Você escolhe! Use: `atenmed_webhook_secure_2024`

---

## 🔍 Diagnóstico

### Ver configuração atual:

```bash
curl http://localhost:3000/api/whatsapp/debug-webhook
```

### Ver status do servidor:

```bash
pm2 status
```

### Ver logs em tempo real:

```bash
pm2 logs atenmed
```

### Ver o token configurado:

```bash
grep WHATSAPP_VERIFY_TOKEN .env
```

---

## 🔒 Verificar HTTPS/SSL

O WhatsApp **EXIGE HTTPS**!

### Verificar se SSL está configurado:

```bash
sudo ls -la /etc/letsencrypt/live/
```

### Se não tiver SSL:

```bash
# Instalar Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Configurar SSL
sudo certbot --nginx -d atenmed.com.br -d www.atenmed.com.br
```

---

## 🔥 Verificar Firewall

### No servidor:

```bash
sudo ufw status
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp
```

### Na AWS (Security Group):

1. Acesse o Console da AWS
2. EC2 → Security Groups
3. Verifique se estas portas estão abertas:
   - **80** (HTTP): `0.0.0.0/0`
   - **443** (HTTPS): `0.0.0.0/0`

---

## 🐛 Problemas Comuns

### ❌ "Token inválido"

**Causa**: Token no `.env` diferente do Meta

**Solução**:
```bash
# Ver o token
grep WHATSAPP_VERIFY_TOKEN .env

# Copie EXATAMENTE este token para o Meta Developer
```

### ❌ "Connection refused"

**Causa**: Servidor não está rodando

**Solução**:
```bash
pm2 restart atenmed
pm2 status
```

### ❌ "SSL required"

**Causa**: HTTPS não configurado

**Solução**:
```bash
sudo certbot --nginx -d atenmed.com.br
```

### ❌ Webhook não responde

**Causa**: Nginx não está redirecionando

**Solução**:
```bash
# Ver configuração
sudo nano /etc/nginx/sites-available/atenmed

# Testar
sudo nginx -t

# Recarregar
sudo systemctl reload nginx
```

---

## ✅ Checklist Final

Antes de configurar no Meta:

- [ ] Servidor rodando (`pm2 status` mostra "online")
- [ ] `.env` configurado com `WHATSAPP_VERIFY_TOKEN`
- [ ] Token no `.env` = Token que vai usar no Meta
- [ ] HTTPS/SSL configurado (`certbot`)
- [ ] Porta 443 aberta no firewall
- [ ] Security Group da AWS com portas 80 e 443 abertas
- [ ] Nginx rodando (`sudo systemctl status nginx`)
- [ ] Teste local passou (curl localhost)
- [ ] Teste externo passou (curl https://)

---

## 🎉 Quando Funcionar

Você verá nos logs:

```
📱 Tentativa de verificação de webhook WhatsApp
   Mode: subscribe
   Token recebido: atenmed_webhook_secure_2024
   Token esperado: atenmed_webhook_secure_2024
   Challenge: ...
✅ Webhook verificado com sucesso
```

---

## 📞 Comandos Úteis

```bash
# Ver logs
pm2 logs atenmed

# Reiniciar
pm2 restart atenmed

# Status
pm2 status

# Ver config
curl http://localhost:3000/api/whatsapp/debug-webhook

# Testar webhook
curl "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=atenmed_webhook_secure_2024&hub.challenge=teste"

# Ver token configurado
grep WHATSAPP_VERIFY_TOKEN .env

# Editar .env
nano .env
```

---

## 🆘 Precisa de Ajuda?

Execute o diagnóstico completo:

```bash
./scripts/setup-webhook-aws.sh
```

Ou veja os logs:

```bash
pm2 logs atenmed --lines 50
```

---

## 💡 Dica de Ouro

**A causa #1 de erro é o token estar diferente!**

Para garantir que sejam iguais:

1. No servidor, execute:
   ```bash
   grep WHATSAPP_VERIFY_TOKEN .env
   ```

2. Copie o resultado **exatamente**

3. Cole no Meta Developer

4. Salve!

✅ Pronto!

---

## 📚 Documentação Completa

- **Guia Rápido**: `TESTE-WEBHOOK-RAPIDO.md`
- **Solução Completa**: `SOLUCAO-WEBHOOK-WHATSAPP.md`
- **Comandos SSH**: `COMANDO-RAPIDO-SSH.txt`
- **Config AWS**: `CONFIGURAR-WEBHOOK-AWS.md`

---

**Última atualização**: $(date)








