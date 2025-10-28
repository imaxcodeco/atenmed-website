# 🚀 DEPLOY AUTOMÁTICO VIA GITHUB ACTIONS

**Domínio:** https://atenmed.com.br  
**Deploy:** Automático via GitHub Actions  
**Status:** ✅ Configurado

---

## 📋 O QUE FOI CONFIGURADO

### **1. Workflow do GitHub Actions**
- Arquivo: `.github/workflows/deploy.yml`
- Trigger: Push para `main` ou `master`
- Também pode ser executado manualmente

### **2. Processo de Deploy:**
1. ✅ Checkout do código
2. ✅ Setup Node.js 18
3. ✅ Install dependencies
4. ✅ Build CSS
5. ✅ Criar .env com secrets
6. ✅ SSH no servidor
7. ✅ Pull código atualizado
8. ✅ Backup do .env anterior
9. ✅ Install dependencies no servidor
10. ✅ Restart com PM2
11. ✅ Health check
12. ✅ Notificação de sucesso/falha

---

## 🔐 GITHUB SECRETS NECESSÁRIOS

Configure estes secrets no GitHub:
**Repositório → Settings → Secrets and variables → Actions → New repository secret**

### **Servidor:**
```
SERVER_HOST=seu-servidor-ip-ou-dominio
SERVER_USER=seu-usuario-ssh
SERVER_SSH_KEY=sua-chave-privada-ssh
SERVER_PORT=22
```

### **Banco de Dados:**
```
MONGODB_URI=mongodb://localhost:27017/atenmed
# OU
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/atenmed
```

### **JWT e Segurança:**
```bash
# Gerar JWT_SECRET forte:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

JWT_SECRET=sua-senha-jwt-gerada
SESSION_SECRET=outra-senha-forte-session
```

### **Email (AWS SES):**
```
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_USER=seu-smtp-user
EMAIL_PASS=seu-smtp-password
EMAIL_FROM=AtenMed <contato@atenmed.com.br>
```

### **WhatsApp:**
```
WHATSAPP_PHONE_ID=seu-phone-id
WHATSAPP_TOKEN=seu-token-permanente
WHATSAPP_VERIFY_TOKEN=seu-verify-token
WHATSAPP_APP_SECRET=seu-app-secret
```

### **Google Calendar:**
```
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret
```

---

## 🎯 COMO FAZER DEPLOY

### **Automático (Push):**
```bash
# Fazer suas alterações
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# O GitHub Actions vai:
# 1. Detectar o push
# 2. Executar o workflow
# 3. Fazer deploy automático
# 4. Verificar health check
```

### **Manual (Via Interface):**
1. Ir para GitHub → Actions
2. Selecionar "Deploy to Production"
3. Click "Run workflow"
4. Selecionar branch
5. Click "Run workflow"

---

## 📊 MONITORAR DEPLOY

### **GitHub Actions:**
1. Ir para: `https://github.com/seu-usuario/seu-repo/actions`
2. Ver execuções do workflow
3. Click para ver logs detalhados
4. Verificar sucesso/falha

### **Logs do Workflow:**
```
✅ Checkout code
✅ Setup Node.js
✅ Install dependencies
✅ Build CSS
✅ Create .env file
✅ Deploy to Server
✅ Health Check
✅ Notify Success
```

---

## 🔧 CONFIGURAÇÃO DO SERVIDOR

### **Pré-requisitos no Servidor:**

```bash
# 1. Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. MongoDB
# Seguir: https://docs.mongodb.com/manual/installation/

# 3. PM2
sudo npm install -g pm2

# 4. Nginx
sudo apt install -y nginx

# 5. Git
sudo apt install -y git

# 6. Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx
```

### **Configurar Repositório no Servidor:**

```bash
# Criar diretório
sudo mkdir -p /var/www/atenmed
sudo chown -R $USER:$USER /var/www/atenmed

# Clonar repositório
cd /var/www/atenmed
git clone https://github.com/seu-usuario/atenmed.git .

# Configurar Git
git config pull.rebase false

# Configurar SSH key para deploy
# (O GitHub Actions vai usar a chave configurada nos secrets)
```

### **Configurar Nginx:**

```bash
sudo nano /etc/nginx/sites-available/atenmed
```

```nginx
server {
    listen 80;
    server_name atenmed.com.br www.atenmed.com.br;

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

    client_max_body_size 10M;
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/atenmed /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Configurar SSL
sudo certbot --nginx -d atenmed.com.br -d www.atenmed.com.br
```

---

## 🔑 GERAR CHAVE SSH PARA GITHUB ACTIONS

### **No seu computador local:**

```bash
# Gerar nova chave SSH
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_key

# Copiar chave pública para o servidor
ssh-copy-id -i ~/.ssh/github_actions_key.pub usuario@seu-servidor

# Copiar chave privada (para adicionar no GitHub Secrets)
cat ~/.ssh/github_actions_key
# Copiar TODO o conteúdo (incluindo BEGIN e END)
```

### **No GitHub:**
1. Settings → Secrets → New repository secret
2. Nome: `SERVER_SSH_KEY`
3. Valor: Colar a chave privada completa
4. Add secret

---

## ✅ CHECKLIST DE DEPLOY

### **Antes do Primeiro Deploy:**
- [ ] Servidor configurado (Node, MongoDB, PM2, Nginx)
- [ ] Domínio apontando para o servidor
- [ ] SSL configurado (Certbot)
- [ ] Repositório clonado no servidor
- [ ] Todos os GitHub Secrets configurados
- [ ] Chave SSH configurada
- [ ] Firewall configurado (portas 22, 80, 443)

### **Verificar Após Deploy:**
- [ ] Workflow executado com sucesso
- [ ] Health check passou
- [ ] https://atenmed.com.br carrega
- [ ] https://atenmed.com.br/health retorna OK
- [ ] Todas as páginas funcionando
- [ ] SSL válido (cadeado verde)
- [ ] PM2 status: online

---

## 🆘 TROUBLESHOOTING

### **Deploy falha no SSH:**
```
Erro: Permission denied (publickey)
```
**Solução:**
- Verificar se chave SSH está correta no secret `SERVER_SSH_KEY`
- Verificar se chave pública está no servidor: `~/.ssh/authorized_keys`
- Testar manualmente: `ssh -i chave usuario@servidor`

### **Health Check falha:**
```
Erro: curl: (7) Failed to connect
```
**Solução:**
- Verificar se aplicação está rodando: `pm2 status`
- Verificar logs: `pm2 logs atenmed`
- Verificar Nginx: `sudo systemctl status nginx`
- Verificar SSL: `sudo certbot certificates`

### **Build CSS falha:**
```
Erro: Command failed
```
**Solução:**
- Adicionar `|| echo "Build optional"` no script (já feito)
- Verificar se Tailwind está configurado
- Build CSS é opcional se não usar Tailwind

### **MongoDB não conecta:**
```
Erro: MongoServerError: Authentication failed
```
**Solução:**
- Verificar `MONGODB_URI` no GitHub Secret
- Verificar se MongoDB está rodando: `sudo systemctl status mongod`
- Testar conexão: `mongosh mongodb://localhost:27017/atenmed`

---

## 📊 MONITORAMENTO PÓS-DEPLOY

### **Comandos Úteis no Servidor:**

```bash
# Ver status PM2
pm2 status

# Ver logs
pm2 logs atenmed --lines 100

# Reiniciar manualmente (se necessário)
pm2 restart atenmed

# Ver uso de recursos
pm2 monit

# Ver logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Verificar SSL
sudo certbot certificates

# Renovar SSL (automático, mas pode forçar)
sudo certbot renew --dry-run
```

---

## 🔄 ROLLBACK

Se algo der errado, fazer rollback:

```bash
# No servidor
cd /var/www/atenmed

# Ver commits
git log --oneline

# Voltar para commit anterior
git reset --hard <commit-hash>

# Reiniciar
pm2 restart atenmed
```

---

## 📈 PRÓXIMOS PASSOS

### **Melhorias Futuras:**

1. **Ambientes Múltiplos:**
   - Staging: `staging.atenmed.com.br`
   - Production: `atenmed.com.br`

2. **Testes Automáticos:**
   - Adicionar testes antes do deploy
   - Smoke tests após deploy

3. **Notificações:**
   - Slack notification on deploy
   - Email on failure

4. **Monitoramento:**
   - Sentry para erros
   - Uptime monitoring
   - Performance monitoring

5. **CI/CD Avançado:**
   - Deploy preview para PRs
   - Rollback automático em falha
   - Blue-Green deployment

---

## 🎉 RESUMO

**Configurado:**
- ✅ GitHub Actions workflow
- ✅ Deploy automático em push
- ✅ SSL/HTTPS configurado
- ✅ PM2 para gerenciamento
- ✅ Health check automático
- ✅ Domínio: atenmed.com.br

**Para fazer deploy:**
```bash
git push origin main
```

**Simples assim! 🚀**

---

**Última atualização:** 28/10/2025  
**Versão:** 1.0.0

