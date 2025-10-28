# 🚀 GUIA DE DEPLOY - AtenMed SaaS

## 📋 PRÉ-REQUISITOS

### **Servidor:**
- Ubuntu 20.04+ ou similar
- 2GB RAM mínimo (4GB recomendado)
- 20GB disco
- Node.js 16+
- MongoDB 4.4+
- PM2 para gerenciamento de processos

### **Domínio:**
- Domínio registrado (ex: atenmed.com.br)
- Acesso ao DNS
- SSL/HTTPS (Let's Encrypt)

### **Contas Necessárias:**
- AWS SES (email)
- Meta Business (WhatsApp)
- Google Cloud (Calendar API)

---

## 🎯 OPÇÃO 1: DEPLOY RÁPIDO (Servidor Linux)

### **1. Conectar ao Servidor**

```bash
ssh usuario@seu-servidor.com
```

### **2. Instalar Dependências**

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Iniciar MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Instalar PM2
sudo npm install -g pm2

# Instalar Nginx
sudo apt install -y nginx

# Instalar Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx
```

### **3. Clonar Projeto**

```bash
cd /var/www
sudo git clone https://github.com/seu-usuario/atenmed.git
cd atenmed
sudo chown -R $USER:$USER .
```

### **4. Configurar Ambiente**

```bash
# Copiar exemplo
cp env.example .env

# Editar variáveis
nano .env
```

**Configurar `.env` de produção:**
```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# MongoDB
MONGODB_URI=mongodb://localhost:27017/atenmed

# JWT
JWT_SECRET=GERAR_SENHA_FORTE_AQUI
JWT_EXPIRES_IN=7d

# URLs
APP_URL=https://atenmed.com.br
CORS_ORIGIN=https://atenmed.com.br,https://www.atenmed.com.br

# Email (AWS SES)
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=seu-smtp-user
EMAIL_PASS=seu-smtp-password
EMAIL_FROM=AtenMed <contato@atenmed.com.br>

# WhatsApp
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_ID=seu-phone-id
WHATSAPP_TOKEN=seu-whatsapp-token
WHATSAPP_VERIFY_TOKEN=token-unico-seguro
WHATSAPP_APP_SECRET=seu-app-secret

# Google Calendar
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret
GOOGLE_REDIRECT_URL=https://atenmed.com.br/api/auth/google/callback

# Segurança
BCRYPT_ROUNDS=12
SESSION_SECRET=gerar-senha-forte

# Serviços
ENABLE_REMINDERS=true
ENABLE_WAITLIST=true

# Redis (opcional - para melhor performance)
REDIS_HOST=localhost
REDIS_PORT=6379

# Sentry (opcional - monitoramento)
SENTRY_DSN=seu-sentry-dsn
```

### **5. Instalar e Build**

```bash
npm install --production
npm run build:css
```

### **6. Criar Admin Inicial**

```bash
node scripts/create-admin.js
```

### **7. Iniciar com PM2**

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### **8. Configurar Nginx**

```bash
sudo nano /etc/nginx/sites-available/atenmed
```

**Adicionar:**
```nginx
server {
    listen 80;
    server_name atenmed.com.br www.atenmed.com.br;

    # Logs
    access_log /var/log/nginx/atenmed-access.log;
    error_log /var/log/nginx/atenmed-error.log;

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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Upload size
    client_max_body_size 10M;
}
```

**Ativar site:**
```bash
sudo ln -s /etc/nginx/sites-available/atenmed /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### **9. Configurar SSL (HTTPS)**

```bash
sudo certbot --nginx -d atenmed.com.br -d www.atenmed.com.br
```

### **10. Configurar Cron Jobs**

```bash
crontab -e
```

**Adicionar:**
```cron
# Gerar faturas mensais (dia 1 às 00:00)
0 0 1 * * cd /var/www/atenmed && /usr/bin/node scripts/gerar-faturas-mensais.js >> /var/log/atenmed-faturas.log 2>&1

# Verificar inadimplência (diariamente às 08:00)
0 8 * * * cd /var/www/atenmed && /usr/bin/node scripts/verificar-inadimplencia.js >> /var/log/atenmed-inadimplencia.log 2>&1

# Renovar SSL (automaticamente)
0 0 * * * certbot renew --quiet
```

### **11. Firewall**

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

## 🎯 OPÇÃO 2: DEPLOY COM DOCKER

### **1. Criar Dockerfile**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build:css

EXPOSE 3000

CMD ["npm", "start"]
```

### **2. Criar docker-compose.yml**

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/atenmed
    depends_on:
      - mongo
      - redis
    restart: unless-stopped

  mongo:
    image: mongo:6
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  mongo-data:
```

### **3. Deploy**

```bash
docker-compose up -d
```

---

## 🎯 OPÇÃO 3: DEPLOY NA AWS (EC2)

### **1. Criar Instância EC2**

- Tipo: t3.small (ou superior)
- SO: Ubuntu 20.04
- Armazenamento: 20GB SSD
- Security Group: 22, 80, 443

### **2. Conectar**

```bash
ssh -i sua-chave.pem ubuntu@ec2-xxx.amazonaws.com
```

### **3. Seguir Opção 1** (Deploy Rápido)

### **4. Configurar RDS (Opcional)**

Se quiser MongoDB gerenciado, use DocumentDB da AWS.

---

## 🎯 OPÇÃO 4: DEPLOY NA VERCEL/NETLIFY (Frontend)

Para hospedar apenas o frontend estático:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Atenção:** Backend deve estar em servidor Node.js (não funciona em Vercel)

---

## ✅ CHECKLIST PÓS-DEPLOY

### **1. Testar URLs:**
- [ ] https://atenmed.com.br (landing page)
- [ ] https://atenmed.com.br/planos (captação)
- [ ] https://atenmed.com.br/crm (CRM)
- [ ] https://atenmed.com.br/portal (portal cliente)
- [ ] https://atenmed.com.br/api/health (API)

### **2. Testar Funcionalidades:**
- [ ] Criar lead em `/planos`
- [ ] Ver lead em `/crm`
- [ ] Fazer login
- [ ] Ativar cliente teste
- [ ] Acessar portal
- [ ] Gerar fatura teste

### **3. Configurar Webhooks:**
- [ ] WhatsApp webhook: `https://atenmed.com.br/api/whatsapp/webhook`
- [ ] Google Calendar callback: `https://atenmed.com.br/api/auth/google/callback`

### **4. Monitoramento:**
- [ ] PM2 logs: `pm2 logs`
- [ ] Nginx logs: `tail -f /var/log/nginx/atenmed-*.log`
- [ ] Aplicação logs: `tail -f logs/combined.log`
- [ ] Cron logs: `tail -f /var/log/atenmed-*.log`

### **5. Backup:**
- [ ] Configurar backup diário do MongoDB
- [ ] Configurar backup do código
- [ ] Testar restauração

---

## 🔧 COMANDOS ÚTEIS

### **PM2:**
```bash
pm2 status              # Ver status
pm2 logs atenmed        # Ver logs
pm2 restart atenmed     # Reiniciar
pm2 stop atenmed        # Parar
pm2 delete atenmed      # Remover
pm2 monit               # Monitor em tempo real
```

### **Nginx:**
```bash
sudo systemctl status nginx   # Status
sudo systemctl restart nginx  # Reiniciar
sudo nginx -t                 # Testar config
sudo tail -f /var/log/nginx/error.log
```

### **MongoDB:**
```bash
sudo systemctl status mongod   # Status
sudo systemctl restart mongod  # Reiniciar
mongosh                        # Conectar
```

### **Logs:**
```bash
# PM2
pm2 logs --lines 100

# Aplicação
tail -f logs/combined.log

# Nginx
tail -f /var/log/nginx/atenmed-error.log

# Cron
tail -f /var/log/atenmed-faturas.log
```

---

## 🆘 TROUBLESHOOTING

### **Erro: Cannot connect to MongoDB**
```bash
sudo systemctl status mongod
sudo systemctl restart mongod
# Verificar .env MONGODB_URI
```

### **Erro: Port 3000 already in use**
```bash
pm2 delete atenmed
pm2 start ecosystem.config.js --env production
```

### **Erro: 502 Bad Gateway (Nginx)**
```bash
# Verificar se app está rodando
pm2 status

# Verificar logs
pm2 logs atenmed

# Reiniciar tudo
pm2 restart atenmed
sudo systemctl restart nginx
```

### **SSL não funciona**
```bash
sudo certbot renew --dry-run
sudo certbot renew
sudo systemctl restart nginx
```

---

## 📊 MONITORAMENTO E MANUTENÇÃO

### **Diário:**
- [ ] Ver logs de erro
- [ ] Verificar uso de memória: `pm2 monit`
- [ ] Verificar disco: `df -h`

### **Semanal:**
- [ ] Atualizar dependências: `npm update`
- [ ] Verificar backup do banco
- [ ] Revisar logs de inadimplência

### **Mensal:**
- [ ] Atualizar sistema: `sudo apt update && sudo apt upgrade`
- [ ] Revisar métricas de uso
- [ ] Analisar logs de erro

---

## 🔐 SEGURANÇA

### **Hardening:**
```bash
# Desabilitar root login
sudo nano /etc/ssh/sshd_config
# PermitRootLogin no

# Firewall
sudo ufw enable
sudo ufw status

# Fail2ban (proteção brute force)
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### **Variáveis Sensíveis:**
- ✅ NUNCA commitar `.env`
- ✅ Usar senhas fortes (20+ caracteres)
- ✅ Rotacionar tokens periodicamente
- ✅ Usar HTTPS everywhere

---

## 🎉 DEPLOY CONCLUÍDO!

Seu sistema está no ar em produção!

### **Próximos Passos:**
1. ✅ Divulgar URL
2. ✅ Monitorar logs
3. ✅ Configurar analytics
4. ✅ Criar primeiros clientes
5. ✅ Escalar conforme crescimento

---

**Precisa de ajuda?** Consulte este guia ou os logs do sistema.

**Boa sorte com o lançamento! 🚀**

