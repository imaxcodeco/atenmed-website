# 🚀 DEPLOY RÁPIDO - AtenMed v2.0 para AWS

## ⚡ **COMANDOS ESSENCIAIS** (copie e cole no servidor)

### 1️⃣ **Conectar no Servidor**
```bash
ssh usuario@atenmed.com.br
```

### 2️⃣ **Deploy Automático** (Recomendado)
```bash
cd /var/www/atenmed
git pull origin reorganizacao-estrutura
chmod +x deploy-to-aws.sh
./deploy-to-aws.sh
```

✅ **O script faz tudo automaticamente!**

---

## ⚙️ **CONFIGURAÇÃO PÓS-DEPLOY**

### Editar .env (OBRIGATÓRIO!)

```bash
nano .env
```

**Cole estas linhas:**

```bash
# IA Conversacional
AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSyCYJKuN94hPx5evfqY_Zdh2-nfDov_WJm8

# Serviços Automáticos
ENABLE_REMINDERS=true
ENABLE_WAITLIST=true
NODE_ENV=production
APP_URL=https://atenmed.com.br
```

**Salvar:** `Ctrl+O` → `Enter` → `Ctrl+X`

### Reiniciar Aplicação

```bash
pm2 restart atenmed
pm2 logs atenmed
```

---

## ✅ **VERIFICAÇÃO**

### Você deve ver nos logs:

```
✅ Conectado ao MongoDB
🤖 AI Service inicializado com GEMINI
📱 WhatsApp com IA conversacional habilitada!
🔔 Reminder Service habilitado
📋 Waitlist Service habilitado
```

### Testar endpoints:

```bash
curl https://atenmed.com.br/api/health
curl https://atenmed.com.br/api/whatsapp/health
```

---

## 🎯 **RESULTADO FINAL**

Depois do deploy, você terá:

✅ **IA Conversacional** (Gemini) - Conversas naturais no WhatsApp
✅ **Conversas Humanizadas** - Saudações personalizadas, emojis, delays
✅ **Dashboard Analytics** - Métricas e KPIs em tempo real
✅ **Lembretes Automáticos** - 24h e 1h antes das consultas
✅ **Confirmação de Consultas** - Via WhatsApp e link
✅ **Fila de Espera** - Notificação de vagas disponíveis
✅ **Agendamento Inteligente** - Integração com Google Calendar

---

## 📞 **URLs**

- **Site:** https://atenmed.com.br
- **Dashboard:** https://atenmed.com.br/dashboard
- **Agendamento:** https://atenmed.com.br/agendamento
- **Analytics:** https://atenmed.com.br/analytics

---

## 🐛 **Se Algo Der Errado**

```bash
# Ver logs de erro
pm2 logs atenmed --err

# Reiniciar tudo
pm2 restart atenmed

# Verificar MongoDB
sudo systemctl status mongod
sudo systemctl start mongod

# Verificar status
pm2 status
```

---

## 📚 **Documentação Completa**

- **COMANDOS-DEPLOY-AWS.md** - Passo a passo detalhado
- **DEPLOY-AWS.md** - Documentação completa
- **IA-IMPLEMENTADA.md** - Sobre a IA conversacional
- **FUNCIONALIDADES-COMPLETAS.md** - Todas as funcionalidades

---

**🎉 Sucesso no deploy!**

*Tempo estimado: 5-10 minutos*

