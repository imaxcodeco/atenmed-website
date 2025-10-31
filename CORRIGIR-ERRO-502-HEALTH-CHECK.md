# 🔧 Corrigir Erro 502 - Health Check Falhou

## ✅ PROGRESSO!

**Deploy SSH funcionou!** O código foi enviado ao servidor. Agora precisamos fazer a aplicação funcionar.

## ❌ ERRO ATUAL

```
curl: (22) The requested URL returned error: 502
```

**502 Bad Gateway** = A aplicação não está respondendo ou Nginx não está configurado.

---

## 🔍 POSSÍVEIS CAUSAS

### **1. Aplicação Não Está Rodando**

O PM2 pode não ter iniciado a aplicação corretamente.

**Verificar no servidor:**
```bash
# Conectar:
ssh -i C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem ubuntu@3.129.206.231

# Verificar PM2:
pm2 status
pm2 logs atenmed --lines 50
```

**Se não estiver rodando:**
```bash
cd /var/www/atenmed || cd ~/atenmed || cd /home/ubuntu/atenmed-website
pm2 start ecosystem.config.js --env production
pm2 save
```

---

### **2. Nginx Não Configurado**

Se você não tem Nginx configurado, a aplicação pode estar rodando mas não acessível via HTTPS.

**Verificar Nginx:**
```bash
# Verificar se Nginx está rodando:
sudo systemctl status nginx

# Se não estiver instalado/configurado:
sudo apt update
sudo apt install nginx -y
```

**Configurar Nginx (se necessário):**
```bash
sudo nano /etc/nginx/sites-available/atenmed
```

**Conteúdo básico:**
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
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Ativar:**
```bash
sudo ln -s /etc/nginx/sites-available/atenmed /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### **3. Aplicação Crashou ao Iniciar**

Pode ter erro no código ou variáveis de ambiente faltando.

**Verificar logs:**
```bash
pm2 logs atenmed --lines 100
```

**Verificar .env:**
```bash
cd /var/www/atenmed || cd ~/atenmed
cat .env | head -20
```

---

### **4. Porta 3000 Não Acessível**

A aplicação pode estar rodando mas não na porta correta ou bloqueada por firewall.

**Verificar:**
```bash
# Ver processos na porta 3000:
sudo lsof -i :3000

# Testar localmente no servidor:
curl http://localhost:3000/health
```

---

## 🔧 SOLUÇÃO PASSO A PASSO

### **PASSO 1: Conectar e Verificar Status**

```bash
ssh -i C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem ubuntu@3.129.206.231

# Verificar onde o código foi clonado:
ls -la /var/www/atenmed
ls -la ~/atenmed
ls -la /home/ubuntu/atenmed-website

# Ir para o diretório correto:
cd [diretório onde está o código]
```

### **PASSO 2: Verificar PM2**

```bash
pm2 status

# Se não estiver rodando ou com erro:
pm2 logs atenmed --lines 100

# Se precisar reiniciar:
pm2 restart atenmed

# Se não existir, iniciar:
pm2 start ecosystem.config.js --env production
pm2 save
```

### **PASSO 3: Verificar .env**

```bash
cat .env

# Verificar se tem todas as variáveis:
# - MONGODB_URI
# - JWT_SECRET
# - etc.
```

### **PASSO 4: Testar Localmente no Servidor**

```bash
# Testar se aplicação responde:
curl http://localhost:3000/health

# Se funcionar local, o problema é Nginx/firewall
# Se não funcionar, ver logs do PM2
```

### **PASSO 5: Verificar Nginx (Se Precisar)**

```bash
# Verificar status:
sudo systemctl status nginx

# Ver configuração:
sudo cat /etc/nginx/sites-enabled/atenmed

# Se não existir, criar (veja configuração acima)
```

---

## 🧪 TESTE RÁPIDO

Execute no servidor:

```bash
# 1. Verificar PM2:
pm2 status

# 2. Ver logs:
pm2 logs atenmed --lines 50

# 3. Testar local:
curl http://localhost:3000/health

# 4. Se funcionar local, verificar Nginx:
sudo systemctl status nginx
curl https://atenmed.com.br/health
```

---

## ✅ CHECKLIST

- [ ] Código foi clonado/atualizado no servidor
- [ ] PM2 está rodando (`pm2 status`)
- [ ] Aplicação sem erros nos logs (`pm2 logs`)
- [ ] `.env` configurado com todas variáveis
- [ ] Teste local funciona (`curl localhost:3000/health`)
- [ ] Nginx configurado e rodando (se usando)
- [ ] Porta 3000 acessível
- [ ] Firewall permite porta 80/443

---

## 🚀 DEPOIS DE CORRIGIR

1. **Teste local no servidor:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Teste público:**
   ```bash
   curl https://atenmed.com.br/health
   ```

3. **Execute deploy novamente** no GitHub Actions (deve passar no Health Check)

---

**O deploy SSH está funcionando! Agora só precisamos fazer a aplicação responder! 🚀**

