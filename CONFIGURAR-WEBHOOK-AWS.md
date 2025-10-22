# 🚀 Configurar Webhook WhatsApp no Servidor AWS

## ⚡ Guia Rápido (5 minutos)

### 1️⃣ **Conectar ao Servidor AWS**

```bash
ssh -i "C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem" ubuntu@3.129.206.231
```

### 2️⃣ **Ir para a pasta do projeto**

```bash
cd ~/AtenMed/Website
# ou
cd /var/www/atenmed
# ou o caminho onde está seu projeto
```

### 3️⃣ **Executar o script de configuração**

```bash
# Dar permissão de execução
chmod +x scripts/setup-webhook-aws.sh

# Executar
./scripts/setup-webhook-aws.sh
```

O script vai perguntar:

1. **Token de verificação**: Digite `atenmed_webhook_secure_2024`
2. **Phone ID**: Cole o Phone ID do Meta Developer
3. **Token API**: Cole o token de acesso do WhatsApp Business API

### 4️⃣ **Verificar se funcionou**

```bash
# Testar localmente
curl "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=atenmed_webhook_secure_2024&hub.challenge=teste123"
```

✅ Deve retornar: `teste123`

### 5️⃣ **Testar externamente**

```bash
# Se tiver domínio configurado
curl "https://atenmed.com.br/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=atenmed_webhook_secure_2024&hub.challenge=teste123"

# Ou com IP
curl "https://3.129.206.231/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=atenmed_webhook_secure_2024&hub.challenge=teste123"
```

### 6️⃣ **Configurar no Meta Developer**

Acesse: https://developers.facebook.com/apps/

Na seção **Webhook**:

- **URL de callback**: `https://atenmed.com.br/api/whatsapp/webhook`
  (ou `https://3.129.206.231/api/whatsapp/webhook` se não tiver domínio)
- **Verificar token**: `atenmed_webhook_secure_2024`

Clique em **"Verificar e salvar"**

---

## 🔧 Configuração Manual (se preferir)

### Passo 1: Editar o .env

```bash
# Editar arquivo .env
nano .env
```

Adicione/atualize estas linhas:

```env
WHATSAPP_VERIFY_TOKEN=atenmed_webhook_secure_2024
WHATSAPP_PHONE_ID=seu_phone_id_aqui
WHATSAPP_TOKEN=seu_token_aqui
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
```

Salvar: `Ctrl+O`, `Enter`, `Ctrl+X`

### Passo 2: Reiniciar o servidor

```bash
pm2 restart atenmed
# ou
pm2 restart all
```

### Passo 3: Verificar logs

```bash
pm2 logs atenmed
```

Você deve ver:
```
📱 WhatsApp Business Service inicializado
```

---

## 🔒 Verificar HTTPS/SSL

O WhatsApp **EXIGE HTTPS**. Verifique se está configurado:

### Verificar se Nginx está rodando

```bash
sudo systemctl status nginx
```

### Verificar se SSL está configurado

```bash
sudo ls -la /etc/letsencrypt/live/
```

### Se NÃO tiver SSL configurado:

```bash
# Instalar Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Configurar SSL (substitua pelo seu domínio)
sudo certbot --nginx -d atenmed.com.br -d www.atenmed.com.br

# Renovação automática
sudo certbot renew --dry-run
```

---

## 🔥 Verificar Firewall

```bash
# Ver status do firewall
sudo ufw status

# Se porta 443 não estiver aberta:
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp

# Na AWS, também verifique o Security Group:
# - Porta 80 (HTTP): 0.0.0.0/0
# - Porta 443 (HTTPS): 0.0.0.0/0
```

---

## 📊 Diagnóstico

### 1. Verificar configuração atual

```bash
curl http://localhost:3000/api/whatsapp/debug-webhook
```

### 2. Testar webhook localmente

```bash
curl "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=atenmed_webhook_secure_2024&hub.challenge=teste123"
```

### 3. Ver status do servidor

```bash
pm2 status
pm2 logs atenmed --lines 50
```

### 4. Ver logs do Nginx

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 5. Testar porta 443

```bash
sudo netstat -tlnp | grep :443
```

---

## 🐛 Solução de Problemas

### Problema 1: "Token inválido"

**Causa**: Token no `.env` diferente do Meta

**Solução**:
```bash
# Ver o token atual
grep WHATSAPP_VERIFY_TOKEN .env

# Editar se necessário
nano .env

# Reiniciar
pm2 restart atenmed
```

### Problema 2: "Connection refused"

**Causa**: Servidor não está rodando

**Solução**:
```bash
# Ver status
pm2 status

# Iniciar se necessário
pm2 start ecosystem.config.js --env production

# Ou
cd ~/AtenMed/Website
npm start
```

### Problema 3: "SSL required"

**Causa**: HTTPS não configurado

**Solução**:
```bash
# Instalar Certbot e configurar SSL
sudo certbot --nginx -d atenmed.com.br
```

### Problema 4: Servidor roda mas webhook não responde

**Causa**: Nginx não está redirecionando corretamente

**Solução**:
```bash
# Verificar configuração do Nginx
sudo nano /etc/nginx/sites-available/atenmed

# Deve ter algo assim:
location /api/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

# Testar configuração
sudo nginx -t

# Recarregar
sudo systemctl reload nginx
```

---

## 📋 Checklist Completo

Antes de configurar no Meta, verifique:

- [ ] Servidor está rodando (`pm2 status`)
- [ ] `.env` tem `WHATSAPP_VERIFY_TOKEN` configurado
- [ ] Token no `.env` é IGUAL ao que vai usar no Meta
- [ ] HTTPS/SSL está configurado (`certbot`)
- [ ] Porta 443 está aberta no firewall e Security Group da AWS
- [ ] Nginx está rodando e configurado corretamente
- [ ] Teste local funciona (`curl localhost:3000/api/whatsapp/webhook...`)
- [ ] Teste externo funciona (`curl https://atenmed.com.br/api/whatsapp/webhook...`)

---

## 🔄 Comandos Úteis

```bash
# Ver logs em tempo real
pm2 logs atenmed

# Reiniciar servidor
pm2 restart atenmed

# Ver status
pm2 status

# Ver uso de recursos
pm2 monit

# Verificar se Node está rodando
ps aux | grep node

# Ver configuração atual do webhook
curl http://localhost:3000/api/whatsapp/debug-webhook

# Testar webhook
curl "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=atenmed_webhook_secure_2024&hub.challenge=teste"
```

---

## 📞 Onde Obter os Tokens

### 1. WHATSAPP_PHONE_ID
1. Acesse: https://developers.facebook.com/apps/
2. Selecione seu app
3. Vá em **WhatsApp > Configurações da API**
4. Copie o **Phone Number ID**

### 2. WHATSAPP_TOKEN
1. No mesmo lugar acima
2. Gere um **Token de acesso**
3. Copie o token (começa com `EAA...`)

### 3. WHATSAPP_VERIFY_TOKEN
- Você escolhe! Use: `atenmed_webhook_secure_2024`
- Deve ser o mesmo no `.env` e no Meta Developer

---

## ✅ Teste Final

Depois de configurar tudo:

```bash
# 1. Teste local
curl "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=atenmed_webhook_secure_2024&hub.challenge=TESTE_OK"

# Deve retornar: TESTE_OK

# 2. Teste externo
curl "https://atenmed.com.br/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=atenmed_webhook_secure_2024&hub.challenge=TESTE_OK"

# Deve retornar: TESTE_OK

# 3. Ver logs
pm2 logs atenmed --lines 20
```

Se os dois testes retornarem `TESTE_OK`, pode configurar no Meta que vai funcionar! ✅

---

## 🆘 Precisa de Ajuda?

1. Execute o diagnóstico:
   ```bash
   ./scripts/setup-webhook-aws.sh
   ```

2. Veja os logs:
   ```bash
   pm2 logs atenmed
   ```

3. Teste manualmente com curl

4. Verifique se HTTPS está funcionando:
   ```bash
   curl -I https://atenmed.com.br
   ```

---

💡 **Dica de Ouro**: 
- Use `screen` ou `tmux` para manter o script rodando mesmo depois de desconectar do SSH
- Sempre verifique os logs após configurar: `pm2 logs atenmed`
- O token DEVE ser exatamente igual no `.env` e no Meta Developer



