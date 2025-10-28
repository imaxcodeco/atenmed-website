# 🚀 Teste Rápido do Webhook WhatsApp

## ⚡ Solução Rápida (3 minutos)

### 1️⃣ Instale as dependências
```bash
npm install
```

### 2️⃣ Configure o arquivo .env
Abra o arquivo `.env` e adicione/atualize estas linhas:

```env
# Token que você colocou na interface do Meta
WHATSAPP_VERIFY_TOKEN=atenmed_webhook_secure_2024

# Seus tokens do WhatsApp Business
WHATSAPP_PHONE_ID=seu_phone_id_aqui
WHATSAPP_TOKEN=seu_token_aqui
```

⚠️ **ATENÇÃO**: O `WHATSAPP_VERIFY_TOKEN` DEVE SER EXATAMENTE igual ao que você colocou na interface do Meta!

### 3️⃣ Inicie o servidor
```bash
npm start
```

### 4️⃣ Execute o diagnóstico
Abra outro terminal e rode:
```bash
npm run test-webhook
```

Você verá um relatório completo mostrando:
- ✅ Configurações corretas
- ❌ O que falta configurar
- 📋 Instruções passo a passo

## 🔧 Desenvolvimento Local

Para testar localmente com o WhatsApp:

### 1. Instale o ngrok
```bash
npm install -g ngrok
```

### 2. Exponha seu servidor
```bash
ngrok http 3000
```

Você verá algo como:
```
Forwarding: https://abc123.ngrok.io -> http://localhost:3000
```

### 3. Configure no Meta Developer

Vá para: https://developers.facebook.com/apps/

Na seção **Webhook**:
- **URL de callback**: `https://abc123.ngrok.io/api/whatsapp/webhook`
- **Verificar token**: `atenmed_webhook_secure_2024` (o mesmo do seu `.env`)

### 4. Clique em "Verificar e salvar"

✅ Deve funcionar!

## 🐛 Solução de Problemas

### Erro: "Não foi possível validar a URL"

**Causa mais comum**: Token diferente

**Solução**:
1. Abra seu `.env`
2. Copie o valor de `WHATSAPP_VERIFY_TOKEN`
3. Cole EXATAMENTE no campo "Verificar token" do Meta
4. Tente novamente

### Erro: "Connection refused"

**Solução**:
1. Verifique se o servidor está rodando: `npm start`
2. Verifique se o ngrok está ativo: `ngrok http 3000`

### Token não está sendo lido

**Solução**:
1. Reinicie o servidor depois de mudar o `.env`
2. Verifique se não tem espaços extras no token
3. Execute: `npm run test-webhook` para diagnóstico

## 📊 Endpoints de Diagnóstico

### Ver configuração atual
```bash
curl http://localhost:3000/api/whatsapp/debug-webhook
```

Ou abra no navegador:
```
http://localhost:3000/api/whatsapp/debug-webhook
```

### Testar webhook manualmente
```bash
curl "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=atenmed_webhook_secure_2024&hub.challenge=teste123"
```

Deve retornar: `teste123`

## 🌐 Produção

Se já estiver em produção:

### 1. Configure o .env no servidor
```bash
# SSH no seu servidor
ssh usuario@atenmed.com.br

# Edite o .env
nano .env

# Adicione:
WHATSAPP_VERIFY_TOKEN=atenmed_webhook_secure_2024
WHATSAPP_PHONE_ID=seu_phone_id
WHATSAPP_TOKEN=seu_token
```

### 2. Reinicie o servidor
```bash
pm2 restart atenmed
```

### 3. Configure no Meta Developer
- **URL de callback**: `https://atenmed.com.br/api/whatsapp/webhook`
- **Verificar token**: `atenmed_webhook_secure_2024`

### 4. Teste no servidor
```bash
curl "https://atenmed.com.br/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=atenmed_webhook_secure_2024&hub.challenge=teste"
```

## 📝 Logs

Ver logs em tempo real:
```bash
# PM2
pm2 logs atenmed

# Arquivo
tail -f logs/combined.log
```

Quando o WhatsApp verificar, você verá:
```
📱 Tentativa de verificação de webhook WhatsApp
✅ Webhook verificado com sucesso
```

## ✅ Checklist Final

- [ ] `.env` configurado com `WHATSAPP_VERIFY_TOKEN`
- [ ] Token no `.env` é IGUAL ao do Meta
- [ ] Servidor rodando (`npm start`)
- [ ] ngrok expondo porta 3000 (dev) ou HTTPS configurado (prod)
- [ ] Executou `npm run test-webhook` e passou
- [ ] Testou manualmente com curl e retornou o challenge
- [ ] Configurou no Meta e clicou em "Verificar e salvar"

## 🆘 Ainda com problemas?

1. Execute o diagnóstico completo:
   ```bash
   npm run test-webhook
   ```

2. Leia a documentação completa:
   ```bash
   cat SOLUCAO-WEBHOOK-WHATSAPP.md
   ```

3. Verifique os logs:
   ```bash
   npm run logs
   ```

---

💡 **Dica**: 99% dos problemas são resolvidos garantindo que o token no `.env` seja EXATAMENTE igual ao token na interface do Meta. Copie e cole para ter certeza!







