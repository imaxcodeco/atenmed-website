# 🚀 COMANDOS PARA DEPLOY NO SERVIDOR AWS

> **Execute estes comandos no seu servidor AWS (atenmed.com.br)**

---

## 📋 **PASSO A PASSO COMPLETO**

### 1️⃣ **Conectar no Servidor AWS**

```bash
# No seu terminal local
ssh -i sua-chave.pem usuario@atenmed.com.br

# OU se usa usuário/senha
ssh usuario@atenmed.com.br
```

---

### 2️⃣ **Navegar para o Projeto**

```bash
# Ajuste o caminho se necessário
cd /var/www/atenmed

# OU
cd /home/usuario/atenmed

# OU onde estiver o projeto
cd ~/Website
```

---

### 3️⃣ **Fazer Backup do .env**

```bash
# Backup do .env atual
cp .env .env.backup.$(date +%Y%m%d)

# Verificar backup
ls -la .env*
```

---

### 4️⃣ **Atualizar Código do GitHub**

```bash
# Verificar branch atual
git branch

# Mudar para a branch correta
git checkout reorganizacao-estrutura

# Atualizar código
git pull origin reorganizacao-estrutura
```

---

### 5️⃣ **Instalar Novas Dependências**

```bash
# Instalar todas as dependências
npm install

# Deve instalar:
# - axios (IA)
# - node-cron (lembretes)
# - uuid (confirmações)
# E outras...
```

---

### 6️⃣ **Configurar .env de Produção**

```bash
# Abrir .env para editar
nano .env
```

**Adicione/atualize estas linhas:**

```bash
# IA Conversacional (GRÁTIS!)
AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSyCYJKuN94hPx5evfqY_Zdh2-nfDov_WJm8

# Google Calendar (se já tiver configurado)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URL=https://atenmed.com.br/api/auth/google/callback

# WhatsApp Business API (se já tiver configurado)
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_ID=...
WHATSAPP_TOKEN=...
WHATSAPP_VERIFY_TOKEN=atenmed_verify_token_2024

# Serviços Automáticos (HABILITAR EM PRODUÇÃO!)
ENABLE_REMINDERS=true
ENABLE_WAITLIST=true
APP_URL=https://atenmed.com.br

# Ambiente
NODE_ENV=production
PORT=3000
```

**Para salvar no nano:**
- `Ctrl + O` (salvar)
- `Enter` (confirmar)
- `Ctrl + X` (sair)

---

### 7️⃣ **Verificar MongoDB**

```bash
# Ver se MongoDB está rodando
sudo systemctl status mongod

# Se não estiver, iniciar
sudo systemctl start mongod

# Habilitar no boot
sudo systemctl enable mongod
```

---

### 8️⃣ **Reiniciar Aplicação com PM2**

```bash
# Ver status atual
pm2 status

# Parar aplicação
pm2 stop atenmed

# Deletar processo antigo
pm2 delete atenmed

# Iniciar nova versão
pm2 start ecosystem.config.js --env production

# Salvar configuração
pm2 save

# Ver status
pm2 status
```

---

### 9️⃣ **Verificar Logs**

```bash
# Ver logs em tempo real
pm2 logs atenmed

# Ver últimas 50 linhas
pm2 logs atenmed --lines 50

# Ver apenas erros
pm2 logs atenmed --err

# Parar de ver logs
Ctrl + C
```

**Você deve ver estas mensagens:**

```
✅ Conectado ao MongoDB
🤖 AI Service inicializado com GEMINI
📱 WhatsApp com IA conversacional habilitada!
🔔 Reminder Service habilitado
📋 Waitlist Service habilitado
✅ Servidor AtenMed rodando na porta 3000
```

---

### 🔟 **Testar Endpoints**

```bash
# Health check geral
curl https://atenmed.com.br/api/health

# WhatsApp + IA
curl https://atenmed.com.br/api/whatsapp/health

# Analytics
curl https://atenmed.com.br/api/analytics/kpis

# Agendamento
curl https://atenmed.com.br/agendamento
```

---

## 🎯 **CONFIGURAÇÕES PÓS-DEPLOY**

### Configurar Webhook do WhatsApp

1. Acesse: https://developers.facebook.com/apps/
2. Seu App → WhatsApp → Configuração
3. Em "Webhook":
   - **URL de Callback:** `https://atenmed.com.br/api/whatsapp/webhook`
   - **Token de Verificação:** `atenmed_verify_token_2024` (ou o que você configurou)
4. Inscrever em eventos:
   - ✅ `messages`
   - ✅ `message_status`

### Autenticar Google Calendar

1. Acesse: `https://atenmed.com.br/agendamento`
2. Faça login como admin
3. Clique em "Conectar Google Calendar"
4. Autorize o acesso

---

## 🐛 **TROUBLESHOOTING**

### Erro: Porta 3000 em uso

```bash
# Encontrar processo
lsof -i :3000

# OU
sudo netstat -tulpn | grep :3000

# Matar processo
kill -9 PID_DO_PROCESSO

# Reiniciar PM2
pm2 restart atenmed
```

### Erro: MongoDB não conecta

```bash
# Verificar se está rodando
sudo systemctl status mongod

# Ver logs do MongoDB
sudo journalctl -u mongod -f

# Reiniciar MongoDB
sudo systemctl restart mongod
```

### Erro: Permissões

```bash
# Corrigir dono das pastas
sudo chown -R $USER:$USER /caminho/projeto

# Corrigir permissões
chmod -R 755 /caminho/projeto

# Criar pasta de logs
mkdir -p logs
chmod 755 logs
```

### Aplicação crashando

```bash
# Ver logs de erro
pm2 logs atenmed --err --lines 100

# Reiniciar
pm2 restart atenmed

# Ver monitoramento
pm2 monit
```

---

## ✅ **CHECKLIST FINAL**

Verifique se tudo está OK:

- [ ] Código atualizado do GitHub
- [ ] `.env` configurado com todas as variáveis
- [ ] MongoDB rodando
- [ ] `npm install` executado
- [ ] PM2 reiniciado com sucesso
- [ ] Logs sem erros
- [ ] `/api/health` retorna OK
- [ ] `/api/whatsapp/health` mostra IA habilitada
- [ ] Webhook WhatsApp configurado
- [ ] Google Calendar autenticado
- [ ] SSL/HTTPS funcionando

---

## 🎉 **DEPLOY CONCLUÍDO!**

Se tudo estiver ✅, o AtenMed v2.0 está no ar com:

- 🤖 IA Conversacional (Gemini)
- 💬 Conversas Humanizadas
- 📊 Dashboard de Analytics
- 🔔 Lembretes Automáticos
- ✅ Confirmação de Consultas
- 📋 Fila de Espera

**Acesse:**
- Site: https://atenmed.com.br
- Dashboard: https://atenmed.com.br/dashboard
- Agendamento: https://atenmed.com.br/agendamento
- Analytics: https://atenmed.com.br/analytics

---

## 📞 **MONITORAMENTO**

Para monitorar a aplicação:

```bash
# Status
pm2 status

# Logs em tempo real
pm2 logs atenmed

# Métricas
pm2 monit

# Reiniciar se necessário
pm2 restart atenmed
```

---

**Sucesso no deploy!** 🚀

