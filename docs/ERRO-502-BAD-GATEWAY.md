# 🚨 Erro 502 Bad Gateway - Servidor Fora do Ar

## 📊 Status do Servidor

**Erro:** `502 Bad Gateway - nginx/1.18.0 (Ubuntu)`  
**URL:** https://atenmed.com.br  
**Status:** 🔴 **SERVIDOR FORA DO AR**

---

## 🔍 O que significa 502 Bad Gateway?

**502 Bad Gateway** = Nginx está rodando, mas a **aplicação Node.js não está respondendo**

**Possíveis causas:**

1. ❌ Aplicação Node.js não está rodando
2. ❌ PM2 crashou ou não iniciou
3. ❌ Aplicação travou ou fechou
4. ❌ Servidor reiniciou e PM2 não iniciou automaticamente
5. ❌ Erro de código que derrubou a aplicação

---

## 🚑 Primeira Ação: Verificar Status da Aplicação

### **Conectar no servidor e verificar:**

```bash
# 1. Conectar no servidor
ssh -i C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem ubuntu@3.129.206.231

# 2. Verificar se PM2 está rodando
pm2 status

# 3. Ver logs de erro
pm2 logs atenmed --lines 50
```

**Se PM2 não estiver rodando:**

```bash
# Iniciar aplicação
cd /var/www/atenmed
# ou
cd ~/atenmed

pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

**Se PM2 estiver rodando mas com erro:**

```bash
# Ver logs detalhados
pm2 logs atenmed --err --lines 100

# Tentar reiniciar
pm2 restart atenmed --update-env
```

---

## 🔧 Solução Rápida

### **Script de recuperação completo:**

```bash
# Conectar no servidor
ssh -i C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem ubuntu@3.129.206.231

# Navegar para diretório do projeto
cd /var/www/atenmed || cd ~/atenmed

# Verificar PM2
pm2 status

# Se não estiver rodando, iniciar
if ! pm2 describe atenmed > /dev/null 2>&1; then
    echo "🚀 Iniciando aplicação..."
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup
else
    echo "🔄 Reiniciando aplicação..."
    pm2 restart atenmed --update-env
fi

# Aguardar alguns segundos
sleep 5

# Verificar status
pm2 status
pm2 logs atenmed --lines 20

# Testar aplicação localmente
curl http://localhost:3000/health

# Sair
exit
```

---

## 🎯 Checklist de Diagnóstico

Execute no servidor:

```bash
# 1. Verificar se servidor está online
ping -c 3 8.8.8.8

# 2. Verificar Node.js
node --version
npm --version

# 3. Verificar PM2
pm2 --version
pm2 status

# 4. Verificar processos Node
ps aux | grep node

# 5. Verificar porta 3000
netstat -tlnp | grep :3000
# ou
ss -tlnp | grep :3000

# 6. Verificar Nginx
sudo systemctl status nginx

# 7. Verificar logs do Nginx
sudo tail -f /var/log/nginx/error.log
```

---

## 🔍 Verificar Últimas Mudanças

Pode ser que o deploy automático tenha tentado atualizar e quebrado:

```bash
# Ver últimos commits
cd /var/www/atenmed || cd ~/atenmed
git log --oneline -10

# Ver se há mudanças não commitadas
git status

# Verificar última tentativa de deploy
pm2 logs atenmed --err --lines 100 | grep -i "error\|failed\|fatal"
```

---

## 💡 Soluções Comuns

### **Problema 1: Porta 3000 em uso**

```bash
# Ver o que está usando porta 3000
sudo lsof -i :3000

# Matar processo
kill -9 <PID>

# Reiniciar PM2
pm2 restart atenmed
```

### **Problema 2: Aplicação crashou por erro de código**

```bash
# Ver logs de erro
pm2 logs atenmed --err --lines 100

# Se houver erro óbvio, corrigir código e fazer pull
cd /var/www/atenmed || cd ~/atenmed
git pull origin main
pm2 restart atenmed --update-env
```

### **Problema 3: Node_modules corrompido**

```bash
# Reinstalar dependências
cd /var/www/atenmed || cd ~/atenmed
npm ci --production --ignore-scripts
pm2 restart atenmed
```

### **Problema 4: Variáveis de ambiente corrompidas**

```bash
# Verificar .env existe
ls -la .env

# Ver conteúdo (cuidado com secrets!)
cat .env

# Verificar se está correto
```

### **Problema 5: Servidor reiniciou e PM2 não iniciou**

```bash
# Configurar PM2 para iniciar automaticamente
pm2 startup

# Seguir instruções exibidas (geralmente um comando sudo)
# Depois:
pm2 save
```

---

## 🚀 Restart Completo

Se nada funcionar, reinício completo:

```bash
# Conectar
ssh -i C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem ubuntu@3.129.206.231

# Parar tudo
pm2 stop all
pm2 delete all

# Reconstruir
cd /var/www/atenmed || cd ~/atenmed
git pull origin main
npm ci --production --ignore-scripts
npm run build:css || echo "Build optional"

# Iniciar
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# Verificar
pm2 status
curl http://localhost:3000/health

# Sair
exit
```

---

## 📞 Próximos Passos

1. ✅ **Conectar no servidor agora**
2. ✅ **Verificar status com `pm2 status`**
3. ✅ **Ver logs com `pm2 logs atenmed --lines 50`**
4. ✅ **Aplicar solução apropriada**
5. ✅ **Testar site: https://atenmed.com.br**

---

## 🔗 Links Úteis

- **Servidor:** 3.129.206.231
- **Usuário:** ubuntu
- **SSH Key:** C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem
- **Diretório:** /var/www/atenmed ou ~/atenmed

---

**Status:** 🔴 **URGENTE** - Servidor fora do ar  
**Ação:** Conectar no servidor e verificar PM2
