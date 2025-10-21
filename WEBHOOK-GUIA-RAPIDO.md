# ⚡ Guia Rápido: Webhook WhatsApp (5 Minutos)

## 🎯 Configuração Expressa

### 1️⃣ No Servidor (2 min)

```bash
# SSH no servidor
ssh -i "sua-chave.pem" ubuntu@3.129.206.231

# Editar .env
cd /var/www/atenmed
sudo nano .env
```

**Adicione:**
```env
WHATSAPP_VERIFY_TOKEN=atenmed_webhook_secure_2024
```

**Salve:** `Ctrl+X` → `Y` → `Enter`

```bash
# Reiniciar
pm2 restart atenmed
```

---

### 2️⃣ No Meta for Developers (3 min)

**1. Acessar:**
- https://developers.facebook.com/
- My Apps → Seu App → WhatsApp → Configuration

**2. Editar Webhook:**
- Clique em **"Edit"**
- **Callback URL:** `https://atenmed.com.br/api/whatsapp/webhook`
- **Verify Token:** `atenmed_webhook_secure_2024`
- Clique em **"Verify and Save"**

**3. Subscrever Campos:**
- Campo **"messages"** → Clique em **"Subscribe"**
- Campo **"message_status"** → Clique em **"Subscribe"** (opcional)

---

### 3️⃣ Testar

**Opção A - Painel:**
```
https://atenmed.com.br/whatsapp-test
→ Enviar mensagem de teste
```

**Opção B - WhatsApp:**
```
Envie mensagem do seu celular → Bot responde
```

**Opção C - Logs:**
```bash
pm2 logs atenmed
# Procure: "📥 Mensagem recebida"
```

---

## ✅ Checklist de 30 Segundos

- [ ] Token no `.env`
- [ ] PM2 reiniciado
- [ ] Webhook verificado no Meta
- [ ] Campo "messages" subscrito
- [ ] Teste bem-sucedido

**Todos OK? Webhook funcionando! 🎉**

---

## 🆘 Problemas?

### ❌ Webhook não verifica
```bash
# Checar token
cat .env | grep VERIFY_TOKEN

# Reiniciar
pm2 restart atenmed

# Testar URL
curl https://atenmed.com.br/api/whatsapp/webhook
```

### ❌ Bot não responde
```
1. Campo "messages" subscrito? ✅
2. PM2 rodando? pm2 status ✅
3. Logs sem erro? pm2 logs ✅
```

---

## 📖 Guia Completo

Para mais detalhes, veja:
```
CONFIGURACAO-WEBHOOK-WHATSAPP.md
```

---

**Tempo total:** ~5 minutos ⏱️  
**Dificuldade:** Fácil 🟢

