# 🚀 Guia de Configuração para Produção - AtenMed

Este guia detalha todos os passos necessários para colocar o AtenMed em produção de forma segura e robusta.

---

## 📋 Checklist Pré-Deploy

### ✅ **1. Segurança**

#### **1.1 Gerar Secrets Fortes**
```bash
# Execute o script para gerar secrets seguros
node scripts/generate-secrets.js

# Copie os valores gerados para o arquivo .env
# NUNCA commite o arquivo .env no Git!
```

**Variáveis obrigatórias:**
- `JWT_SECRET` - Mínimo 32 caracteres (use o script)
- `SESSION_SECRET` - Mínimo 32 caracteres (use o script)
- `WHATSAPP_VERIFY_TOKEN` - Token único para webhook

#### **1.2 Configurar CORS**
No arquivo `.env`:
```env
# Em produção, liste apenas seus domínios
CORS_ORIGIN=https://atenmed.com.br,https://www.atenmed.com.br

# NÃO use wildcards (*) em produção!
```

#### **1.3 Variáveis de Ambiente**
Copie `env.production.example` para `.env` e preencha:
```bash
cp env.production.example .env
```

**IMPORTANTE:**
- ✅ `.env` está no `.gitignore`
- ✅ Nunca commite secrets no código
- ✅ Use gerenciador de senhas para guardar secrets
- ✅ Rotacione secrets periodicamente (a cada 90 dias)

---

### ✅ **2. Email (AWS SES)**

#### **2.1 Configurar AWS SES**

1. **Criar conta AWS e acessar SES:**
   - Acesse: https://console.aws.amazon.com/ses/
   - Verifique seu domínio de email
   - Crie credenciais SMTP

2. **Sair do Sandbox:**
   - No console SES, vá em "Account Dashboard"
   - Clique em "Request production access"
   - Preencha o formulário de solicitação

3. **Obter credenciais SMTP:**
   ```bash
   # As credenciais aparecerão no console SES
   EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
   EMAIL_PORT=587
   EMAIL_USER=seu-smtp-user-aqui
   EMAIL_PASS=seu-smtp-password-aqui
   EMAIL_FROM=AtenMed <contato@atenmed.com.br>
   ```

4. **Testar configuração:**
   ```bash
   # Criar script de teste
   node -e "const email = require('./services/emailService'); email.testEmailConfiguration().then(console.log)"
   ```

#### **2.2 Alternativas ao AWS SES**
- **SendGrid** (mais fácil para começar)
- **Mailgun** (bom para desenvolvimento)
- **Resend** (moderno e simples)

---

### ✅ **3. Banco de Dados (MongoDB)**

#### **3.1 MongoDB Atlas (Recomendado)**

1. **Criar cluster:**
   - Acesse: https://www.mongodb.com/cloud/atlas
   - Crie cluster gratuito (M0) para começar
   - Configure IP whitelist (0.0.0.0/0 para servidor, ou IP específico)

2. **Obter connection string:**
   ```env
   MONGODB_URI=mongodb+srv://usuario:senha@cluster0.xxxxx.mongodb.net/atenmed?retryWrites=true&w=majority
   ```

3. **Criar usuário de banco:**
   - No Atlas, vá em "Database Access"
   - Crie usuário com permissões de leitura/escrita
   - Salve credenciais em local seguro

#### **3.2 Backup Automático**

**Opção 1: MongoDB Atlas (Automático)**
- Clusters pagos têm backup automático
- Configure retention policy

**Opção 2: Script Manual** (veja `scripts/backup-mongodb.js`)

---

### ✅ **4. Monitoramento**

#### **4.1 Health Check Endpoint**

O sistema já possui endpoint de health check:
```
GET /api/health
```

**Monitore:**
- Uptime Robot (gratuito): https://uptimerobot.com
- Pingdom
- StatusCake

Configure para verificar a cada 5 minutos.

#### **4.2 Sentry (Erros)**

1. **Criar conta:**
   - Acesse: https://sentry.io
   - Crie projeto Node.js
   - Copie DSN

2. **Configurar:**
   ```env
   SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
   ```

3. **Instalar:**
   ```bash
   npm install @sentry/node
   ```

4. **Integrar no server.js:**
   ```javascript
   if (process.env.SENTRY_DSN) {
       const Sentry = require('@sentry/node');
       Sentry.init({ dsn: process.env.SENTRY_DSN });
   }
   ```

#### **4.3 Logs**

**PM2 Logs:**
```bash
pm2 logs atenmed --lines 100
pm2 monit
```

**Logs estruturados:**
- Logs salvos em `logs/`
- Rotacionam automaticamente
- Use `tail -f logs/combined.log` para acompanhar

---

### ✅ **5. Process Manager (PM2)**

#### **5.1 Configuração Básica**
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
pm2 start server.js --name atenmed

# Configurar para iniciar no boot
pm2 startup
pm2 save
```

#### **5.2 Arquivo de Configuração**

Crie `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'atenmed',
    script: 'server.js',
    instances: 2, // ou 'max' para usar todos os CPUs
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '500M'
  }]
};
```

**Iniciar com configuração:**
```bash
pm2 start ecosystem.config.js
```

---

### ✅ **6. Servidor Web (Nginx)**

#### **6.1 Instalar Nginx**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# Iniciar
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### **6.2 Configurar Proxy Reverso**

Crie `/etc/nginx/sites-available/atenmed`:
```nginx
server {
    listen 80;
    server_name atenmed.com.br www.atenmed.com.br;

    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name atenmed.com.br www.atenmed.com.br;

    # Certificado SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/atenmed.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/atenmed.com.br/privkey.pem;

    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy para Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache para assets estáticos
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        root /var/www/atenmed/public;
    }
}
```

**Ativar:**
```bash
sudo ln -s /etc/nginx/sites-available/atenmed /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### ✅ **7. SSL/HTTPS (Let's Encrypt)**

#### **7.1 Instalar Certbot**
```bash
sudo apt install certbot python3-certbot-nginx
```

#### **7.2 Obter Certificado**
```bash
sudo certbot --nginx -d atenmed.com.br -d www.atenmed.com.br
```

#### **7.3 Renovação Automática**
Certbot configura renovação automática. Teste:
```bash
sudo certbot renew --dry-run
```

---

### ✅ **8. Firewall (UFW)**

```bash
# Permitir SSH (IMPORTANTE!)
sudo ufw allow 22/tcp

# Permitir HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Ativar firewall
sudo ufw enable
sudo ufw status
```

---

### ✅ **9. Scripts Úteis**

#### **9.1 Backup do Banco**
```bash
# Executar manualmente
node scripts/backup-mongodb.js

# Agendar com cron (diariamente às 2h)
0 2 * * * node /path/to/atenmed/scripts/backup-mongodb.js
```

#### **9.2 Verificação de Inadimplência**
```bash
# Já configurado para enviar emails
# Agendar com cron (diariamente às 8h)
0 8 * * * node /path/to/atenmed/scripts/verificar-inadimplencia.js
```

#### **9.3 Limpeza de Logs**
```bash
# Agendar semanalmente
0 0 * * 0 find /path/to/atenmed/logs -name "*.log" -mtime +30 -delete
```

---

### ✅ **10. Variáveis de Ambiente (.env)**

**Template completo:**
```env
# ===== AMBIENTE =====
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# ===== URLs =====
APP_URL=https://atenmed.com.br
CORS_ORIGIN=https://atenmed.com.br,https://www.atenmed.com.br

# ===== BANCO DE DADOS =====
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/atenmed

# ===== SEGURANÇA =====
JWT_SECRET=GERADO_PELO_SCRIPT_GENERATE_SECRETS
SESSION_SECRET=GERADO_PELO_SCRIPT_GENERATE_SECRETS

# ===== EMAIL (AWS SES) =====
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=SEU_SMTP_USER
EMAIL_PASS=SEU_SMTP_PASSWORD
EMAIL_FROM=AtenMed <contato@atenmed.com.br>

# ===== WHATSAPP =====
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_ID=SEU_PHONE_ID
WHATSAPP_TOKEN=SEU_TOKEN_PERMANENTE
WHATSAPP_VERIFY_TOKEN=GERADO_PELO_SCRIPT
WHATSAPP_APP_SECRET=SEU_APP_SECRET

# ===== GOOGLE CALENDAR =====
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret
GOOGLE_REDIRECT_URL=https://atenmed.com.br/api/auth/google/callback

# ===== MONITORAMENTO =====
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# ===== RECURSOS =====
ENABLE_REMINDERS=true
ENABLE_WAITLIST=true
ENABLE_WHATSAPP=true
ENABLE_GOOGLE_CALENDAR=true
```

---

## 🧪 Testes Pós-Deploy

### **1. Health Check**
```bash
curl https://atenmed.com.br/api/health
# Deve retornar: {"status":"ok",...}
```

### **2. Testar Login**
- Acesse: https://atenmed.com.br/login
- Faça login com credenciais de admin
- Verifique se redireciona corretamente

### **3. Testar Endpoints**
```bash
# Listar leads (público)
curl https://atenmed.com.br/api/leads

# Criar lead
curl -X POST https://atenmed.com.br/api/leads \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste","email":"teste@test.com","telefone":"11999999999"}'
```

### **4. Testar Email**
- Crie um lead novo
- Verifique se email de confirmação foi enviado
- Verifique se email interno foi enviado

---

## 📊 Monitoramento Contínuo

### **Métricas Importantes:**
- ✅ Uptime (deve ser > 99.9%)
- ✅ Tempo de resposta (< 500ms)
- ✅ Taxa de erro (< 0.1%)
- ✅ Uso de memória (< 80%)
- ✅ Uso de CPU (< 80%)

### **Alertas Configurar:**
- ⚠️ Servidor fora do ar
- ⚠️ Erro 500 frequente
- ⚠️ Alta latência
- ⚠️ Banco de dados desconectado
- ⚠️ Email não está sendo enviado

---

## 🔒 Segurança Adicional

### **1. Rate Limiting**
Já implementado no Express. Verifique limites em `server.js`.

### **2. Helmet.js**
Já configurado para headers de segurança.

### **3. Validação de Entrada**
Todos os endpoints usam `express-validator`.

### **4. Autenticação**
- JWT com expiração
- Refresh tokens (se implementado)
- Senhas hasheadas com bcrypt

---

## 📝 Documentação Legal

### **Arquivos Necessários:**
1. ✅ Termos de Uso (`/termos`)
2. ✅ Política de Privacidade (`/privacidade`) - LGPD
3. ✅ Contrato de Serviço (para clientes)

### **LGPD - Pontos Importantes:**
- Consentimento explícito ao coletar dados
- Direito ao esquecimento
- Portabilidade de dados
- Notificação de vazamento

---

## 🚨 Troubleshooting

### **Servidor não inicia:**
```bash
# Verificar logs
pm2 logs atenmed --err

# Verificar variáveis de ambiente
node scripts/validate-env.js

# Verificar porta em uso
sudo lsof -i :3000
```

### **Email não envia:**
```bash
# Testar configuração
node -e "require('./services/emailService').testEmailConfiguration().then(console.log)"

# Verificar credenciais AWS SES
# Verificar se está no sandbox ainda
```

### **Banco desconectado:**
```bash
# Verificar connection string
# Testar conexão manual
mongo "mongodb+srv://..."

# Verificar IP whitelist no Atlas
```

---

## ✅ Checklist Final

Antes de considerar produção:

- [ ] Secrets fortes gerados e configurados
- [ ] CORS configurado apenas para domínios permitidos
- [ ] AWS SES configurado e testado (fora do sandbox)
- [ ] MongoDB Atlas configurado com backup
- [ ] Health check configurado em monitoramento externo
- [ ] Sentry configurado para captura de erros
- [ ] PM2 configurado para iniciar no boot
- [ ] Nginx configurado como proxy reverso
- [ ] SSL/HTTPS configurado (Let's Encrypt)
- [ ] Firewall configurado
- [ ] Scripts de backup agendados
- [ ] Scripts de manutenção agendados
- [ ] Testes pós-deploy realizados
- [ ] Documentação legal criada
- [ ] Logs sendo monitorados

---

**Última atualização:** Janeiro 2025  
**Próxima revisão:** Após primeiro deploy em produção

