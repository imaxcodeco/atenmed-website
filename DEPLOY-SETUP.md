# 🚀 Configuração de Deploy Automático

## 📋 Pré-requisitos

Para configurar o deploy automático, você precisa configurar os seguintes secrets no GitHub:

### Secrets do GitHub (Settings > Secrets and variables > Actions)

1. **EC2_HOST**: IP ou domínio do seu servidor EC2
2. **EC2_USERNAME**: Usuário SSH (geralmente `ubuntu`)
3. **EC2_SSH_KEY**: Chave SSH privada para acesso ao servidor
4. **EC2_PORT**: Porta SSH (geralmente `22`)

## 🔧 Configuração no Servidor AWS EC2

### 1. Instalar Node.js e PM2

```bash
# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2

# Instalar MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 2. Configurar Nginx

```bash
# Instalar Nginx
sudo apt update
sudo apt install nginx

# Configurar proxy reverso
sudo nano /etc/nginx/sites-available/atenmed
```

Conteúdo do arquivo de configuração do Nginx:

```nginx
server {
    listen 80;
    server_name seu-dominio.com.br;

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
}
```

```bash
# Ativar configuração
sudo ln -s /etc/nginx/sites-available/atenmed /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Configurar SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com.br

# Testar renovação automática
sudo certbot renew --dry-run
```

### 4. Configurar Sistema de Serviço

```bash
# Criar arquivo de serviço do systemd
sudo nano /etc/systemd/system/atenmed.service
```

Conteúdo do arquivo de serviço:

```ini
[Unit]
Description=AtenMed Node.js Application
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/atenmed-website
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Ativar serviço
sudo systemctl daemon-reload
sudo systemctl enable atenmed
sudo systemctl start atenmed
sudo systemctl status atenmed
```

## 🔑 Configuração das Chaves SSH

### 1. Gerar Chave SSH no Servidor

```bash
# No servidor EC2
ssh-keygen -t rsa -b 4096 -C "atenmed-deploy"
# Salvar em /home/ubuntu/.ssh/id_rsa_atenmed
```

### 2. Configurar GitHub Deploy Key

```bash
# Copiar chave pública
cat /home/ubuntu/.ssh/id_rsa_atenmed.pub
```

Adicionar esta chave como Deploy Key no GitHub:
- Vá para Settings > Deploy keys
- Adicione a chave pública
- Marque "Allow write access"

### 3. Configurar SSH Config

```bash
# No servidor EC2
nano /home/ubuntu/.ssh/config
```

```ssh
Host github.com
    HostName github.com
    User git
    IdentityFile /home/ubuntu/.ssh/id_rsa_atenmed
    IdentitiesOnly yes
```

## 📝 Configuração do Projeto

### 1. Clonar Repositório

```bash
# No servidor EC2
cd /home/ubuntu
git clone https://github.com/imaxcodeco/atenmed-website.git
cd atenmed-website
```

### 2. Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env
nano .env
```

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/atenmed
JWT_SECRET=seu-jwt-secret-super-seguro
```

### 3. Instalar Dependências e Inicializar

```bash
npm ci --production
npm run init-db
```

## 🚀 Testando o Deploy

### 1. Fazer Push para Main

```bash
# No seu computador local
git checkout main
git merge reorganizacao-estrutura
git push origin main
```

### 2. Verificar Deploy

```bash
# Verificar logs do GitHub Actions
# Verificar se o serviço está rodando
sudo systemctl status atenmed

# Testar endpoint
curl http://localhost:3000/health
```

## 🔍 Monitoramento

### Logs do Sistema

```bash
# Logs do serviço
sudo journalctl -u atenmed -f

# Logs da aplicação
tail -f logs/combined.log
```

### Monitoramento com PM2 (Alternativa)

```bash
# Usar PM2 em vez do systemd
pm2 start ecosystem.config.js --env production
pm2 startup
pm2 save
```

## 🛠️ Troubleshooting

### Problemas Comuns

1. **Erro de permissão SSH**: Verificar chaves SSH e configuração
2. **Serviço não inicia**: Verificar logs com `sudo journalctl -u atenmed`
3. **Porta ocupada**: Verificar com `sudo netstat -tlnp | grep :3000`
4. **MongoDB não conecta**: Verificar se o serviço está rodando

### Comandos Úteis

```bash
# Reiniciar serviço
sudo systemctl restart atenmed

# Ver status
sudo systemctl status atenmed

# Ver logs em tempo real
sudo journalctl -u atenmed -f

# Testar conectividade
curl -f http://localhost:3000/health
```

---

**Configuração de deploy automático concluída!** 🎉

Agora, sempre que você fizer push para a branch `main`, o GitHub Actions irá automaticamente fazer deploy no seu servidor AWS EC2.
