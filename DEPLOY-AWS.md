# 🚀 DEPLOY AWS - AtenMed

> **Domínio:** atenmed.com.br  
> **Última atualização:** Outubro 2024

---

## 📋 PRÉ-REQUISITOS

- ✅ Servidor AWS EC2 rodando
- ✅ MongoDB configurado (local ou Atlas)
- ✅ Node.js 16+ instalado
- ✅ PM2 instalado
- ✅ Nginx configurado
- ✅ SSL/HTTPS ativo

---

## 🔄 PROCESSO DE DEPLOY

### 1. **Preparar Código Localmente**

```bash
# Garantir que .env não está commitado
git add .
git commit -m "Nova versão com IA conversacional e melhorias"
git push origin main
```

### 2. **Conectar no Servidor AWS**

```bash
ssh -i sua-chave.pem usuario@atenmed.com.br
```

### 3. **Atualizar Código no Servidor**

```bash
cd /caminho/do/projeto/AtenMed/Website

# Fazer backup
cp .env .env.backup

# Atualizar código
git pull origin main

# Instalar novas dependências
npm install

# Restaurar .env se necessário
# (caso tenha sido sobrescrito)
```

### 4. **Configurar Variáveis de Ambiente**

Edite o arquivo `.env` no servidor:

```bash
nano .env
```

**Variáveis essenciais para produção:**

```bash
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/atenmed

# Google Calendar
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URL=https://atenmed.com.br/api/auth/google/callback

# WhatsApp Business API
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_ID=...
WHATSAPP_TOKEN=...
WHATSAPP_VERIFY_TOKEN=...

# IA Conversacional (GRÁTIS!)
AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSyCYJKuN94hPx5evfqY_Zdh2-nfDov_WJm8

# Serviços Automáticos
ENABLE_REMINDERS=true
ENABLE_WAITLIST=true
APP_URL=https://atenmed.com.br
```

### 5. **Verificar Integridade**

```bash
# Testar se inicia sem erros
npm start

# Se estiver OK, parar (Ctrl+C)
```

### 6. **Reiniciar com PM2**

```bash
# Parar processo atual
pm2 stop atenmed

# Reiniciar
pm2 restart atenmed

# OU deletar e iniciar novamente
pm2 delete atenmed
pm2 start ecosystem.config.js --env production

# Salvar configuração
pm2 save

# Ver logs
pm2 logs atenmed --lines 50
```

### 7. **Verificar Status**

```bash
# Status do PM2
pm2 status

# Logs em tempo real
pm2 logs atenmed

# Monitoramento
pm2 monit
```

### 8. **Testar Endpoints**

```bash
# Health check
curl https://atenmed.com.br/api/health

# WhatsApp + IA
curl https://atenmed.com.br/api/whatsapp/health

# Analytics
curl https://atenmed.com.br/api/analytics/kpis
```

---

## 🔧 TROUBLESHOOTING

### Erro: Porta já em uso

```bash
# Encontrar processo
lsof -i :3000

# Matar processo
kill -9 PID

# OU reiniciar PM2
pm2 restart atenmed
```

### Erro: MongoDB não conecta

```bash
# Verificar se MongoDB está rodando
sudo systemctl status mongod

# Iniciar MongoDB
sudo systemctl start mongod

# Habilitar no boot
sudo systemctl enable mongod
```

### Erro: Certificado SSL

```bash
# Renovar certbot
sudo certbot renew

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Erro: Permissões

```bash
# Corrigir permissões da pasta
sudo chown -R $USER:$USER /caminho/projeto
chmod -R 755 /caminho/projeto
```

### Logs não aparecem

```bash
# Criar pasta de logs
mkdir -p logs
touch logs/.gitkeep

# Verificar permissões
chmod 755 logs
```

---

## 📊 MONITORAMENTO

### PM2 Monitoring

```bash
# Ver métricas
pm2 monit

# Ver logs específicos
pm2 logs atenmed --lines 100

# Reiniciar automaticamente em caso de crash
pm2 startup
pm2 save
```

### Logs da Aplicação

```bash
# Logs combinados
tail -f logs/combined.log

# Apenas erros
tail -f logs/error.log

# Último erro
cat logs/error.log | tail -20
```

---

## 🔒 SEGURANÇA

### Firewall

```bash
# Permitir apenas portas necessárias
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### Variáveis Sensíveis

**NUNCA commitar:**
- ✅ `.env` está no `.gitignore`
- ✅ `tokens/` está no `.gitignore`
- ✅ `logs/*.log` está no `.gitignore`

### Backup

```bash
# Backup do banco (semanal)
mongodump --db atenmed --out /backup/mongo/$(date +%Y%m%d)

# Backup do .env
cp .env .env.$(date +%Y%m%d).backup
```

---

## 🎯 CHECKLIST DE DEPLOY

- [ ] Código atualizado no GitHub
- [ ] `.env` configurado no servidor
- [ ] MongoDB rodando
- [ ] `npm install` executado
- [ ] PM2 reiniciado
- [ ] Logs verificados
- [ ] Health checks OK
- [ ] WhatsApp webhook configurado
- [ ] IA testada
- [ ] SSL ativo
- [ ] Backup realizado

---

## 📱 CONFIGURAR WEBHOOK WHATSAPP

No Meta for Developers, configure:

**URL de Callback:**
```
https://atenmed.com.br/api/whatsapp/webhook
```

**Token de Verificação:**
```
Use o valor de WHATSAPP_VERIFY_TOKEN do .env
```

**Eventos inscritos:**
- ✅ messages
- ✅ message_status

---

## 🆕 NOVAS FUNCIONALIDADES NESTE DEPLOY

### ✅ IA Conversacional
- Gemini API integrado (GRÁTIS!)
- Entende linguagem natural
- Respostas contextuais

### ✅ Conversas Humanizadas
- Tom casual e amigável
- Variação de mensagens
- Delays de digitação

### ✅ Sistema de Lembretes
- Automático com node-cron
- 24h e 1h antes
- Múltiplos canais

### ✅ Confirmação de Consultas
- Links únicos
- Via WhatsApp
- Tracking completo

### ✅ Fila de Espera
- Notificações automáticas
- Gestão inteligente
- Métricas de conversão

### ✅ Dashboard de Analytics
- KPIs em tempo real
- Gráficos interativos
- Exportação de dados

---

## 📞 SUPORTE

**Em caso de problemas:**

1. Ver logs: `pm2 logs atenmed`
2. Verificar status: `pm2 status`
3. Reiniciar: `pm2 restart atenmed`
4. Checar MongoDB: `sudo systemctl status mongod`

---

## 🎉 SUCESSO!

Após o deploy, acesse:

- **Site:** https://atenmed.com.br
- **Dashboard:** https://atenmed.com.br/dashboard
- **Agendamento:** https://atenmed.com.br/agendamento
- **Analytics:** https://atenmed.com.br/analytics

**Tudo funcionando? Deploy concluído com sucesso!** 🚀

---

**AtenMed v2.0** - Outubro 2024

