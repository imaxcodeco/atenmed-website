# 🚀 Guia de Deploy - AtenMed na AWS EC2

## 📋 Pré-requisitos

- Conta AWS ativa
- Acesso ao AWS Console
- Chave SSH (criar no EC2)

## 🔧 Passo a Passo

### 1. Criar Instância EC2

1. **Acesse AWS Console** → EC2 → Launch Instance
2. **Configurações:**
   - **Nome**: `atenmed-production`
   - **AMI**: Ubuntu Server 20.04 LTS (Free Tier)
   - **Instance Type**: t3.micro (Free Tier)
   - **Key Pair**: Criar nova chave SSH
   - **Security Group**: Configurar portas:
     - SSH (22): Seu IP
     - HTTP (80): 0.0.0.0/0
     - HTTPS (443): 0.0.0.0/0
     - Custom TCP (3000): 0.0.0.0/0

### 2. Conectar via SSH

```bash
# Baixar chave SSH do AWS Console
# Conectar na instância
ssh -i atenmed-key.pem ubuntu@SEU-IP-EC2
```

### 3. Deploy Automático

```bash
# Baixar script de deploy
wget https://raw.githubusercontent.com/imaxcodeco/atenmed-website/main/deploy-ec2.sh

# Tornar executável
chmod +x deploy-ec2.sh

# Executar deploy
./deploy-ec2.sh
```

### 4. Deploy Manual (Alternativo)

```bash
# 1. Atualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Instalar PM2
sudo npm install -g pm2

# 4. Instalar MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# 5. Instalar Nginx
sudo apt install -y nginx

# 6. Configurar Nginx
sudo tee /etc/nginx/sites-available/atenmed > /dev/null <<EOF
server {
    listen 80;
    server_name _;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 7. Ativar site
sudo ln -s /etc/nginx/sites-available/atenmed /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# 8. Clonar repositório
cd /home/ubuntu
git clone https://github.com/imaxcodeco/atenmed-website.git
cd atenmed-website

# 9. Instalar dependências
npm install

# 10. Configurar variáveis de ambiente
cat > .env <<EOF
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/atenmed
JWT_SECRET=atenmed_jwt_secret_production_$(date +%s)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_app
CORS_ORIGIN=http://localhost:3000
EOF

# 11. Iniciar aplicação
pm2 start ecosystem.config.js --env production
pm2 startup
pm2 save
```

## 🔧 Comandos Úteis

### Gerenciar Aplicação
```bash
# Ver status
pm2 status

# Ver logs
pm2 logs atenmed

# Reiniciar
pm2 restart atenmed

# Parar
pm2 stop atenmed

# Monitor
pm2 monit
```

### Gerenciar Nginx
```bash
# Testar configuração
sudo nginx -t

# Reiniciar
sudo systemctl restart nginx

# Status
sudo systemctl status nginx
```

### Gerenciar MongoDB
```bash
# Status
sudo systemctl status mongod

# Reiniciar
sudo systemctl restart mongod

# Conectar
mongo
```

## 🌐 Configurar Domínio (Opcional)

### 1. Configurar DNS
- Aponte seu domínio para o IP da EC2
- Exemplo: `atenmed.com.br` → `IP-DA-EC2`

### 2. Instalar SSL
```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d atenmed.com.br

# Renovação automática
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoramento

### Health Check
```bash
# Verificar se aplicação está rodando
curl http://localhost:3000/health

# Verificar logs
pm2 logs atenmed --lines 50
```

### Backup
```bash
# Backup do MongoDB
mongodump --db atenmed --out /home/ubuntu/backup/

# Backup do código
tar -czf atenmed-backup-$(date +%Y%m%d).tar.gz /home/ubuntu/atenmed-website/
```

## 🚨 Troubleshooting

### Aplicação não inicia
```bash
# Verificar logs
pm2 logs atenmed

# Verificar portas
sudo netstat -tlnp | grep :3000

# Verificar dependências
npm install
```

### Nginx não funciona
```bash
# Testar configuração
sudo nginx -t

# Verificar logs
sudo tail -f /var/log/nginx/error.log
```

### MongoDB não conecta
```bash
# Verificar status
sudo systemctl status mongod

# Verificar logs
sudo tail -f /var/log/mongodb/mongod.log
```

## 📈 Otimizações

### Performance
```bash
# Otimizar PM2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Segurança
```bash
# Configurar firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 🎯 URLs de Acesso

- **Aplicação**: http://SEU-IP-EC2
- **Dashboard**: http://SEU-IP-EC2/dashboard.html
- **Login**: http://SEU-IP-EC2/login.html
- **API**: http://SEU-IP-EC2/api

## 📞 Suporte

- **Logs**: `pm2 logs atenmed`
- **Status**: `pm2 status`
- **Monitor**: `pm2 monit`
- **Health**: `curl http://localhost:3000/health`
