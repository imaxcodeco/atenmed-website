#!/bin/bash

# AtenMed EC2 Deployment Script
echo "🚀 Iniciando deploy do AtenMed na AWS EC2..."

# Update system
echo "📦 Atualizando sistema..."
sudo apt-get update -y
sudo apt-get upgrade -y

# Install Node.js 18
echo "📦 Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
echo "📦 Instalando PM2..."
sudo npm install -g pm2

# Install MongoDB
echo "📦 Instalando MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start and enable MongoDB
echo "📦 Configurando MongoDB..."
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
echo "📦 Instalando Nginx..."
sudo apt-get install -y nginx

# Configure Nginx
echo "📦 Configurando Nginx..."
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

# Enable site
sudo ln -s /etc/nginx/sites-available/atenmed /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# Clone repository
echo "📦 Clonando repositório..."
cd /home/ubuntu
git clone https://github.com/imaxcodeco/atenmed-website.git
cd atenmed-website

# Install dependencies
echo "📦 Instalando dependências..."
npm install

# Create logs directory
mkdir -p logs

# Create .env file
echo "📦 Configurando variáveis de ambiente..."
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

# Start application with PM2
echo "📦 Iniciando aplicação..."
pm2 start ecosystem.config.js --env production
pm2 startup
pm2 save

# Install SSL with Let's Encrypt (optional)
echo "📦 Para instalar SSL, execute:"
echo "sudo apt-get install -y certbot python3-certbot-nginx"
echo "sudo certbot --nginx -d seu-dominio.com"

echo "✅ Deploy concluído!"
echo "🌐 Acesse: http://$(curl -s ifconfig.me)"
echo "📊 Monitor: pm2 monit"
echo "📋 Logs: pm2 logs atenmed"
