# ⚡ COMANDOS RÁPIDOS - PÓS DEPLOY

Referência rápida dos comandos mais usados após o deploy.

---

## 🎯 GERENCIAR APLICAÇÃO

```powershell
# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs atenmed

# Parar logs (Ctrl+C)

# Reiniciar aplicação
pm2 restart atenmed

# Parar aplicação
pm2 stop atenmed

# Iniciar aplicação
pm2 start atenmed

# Deletar do PM2
pm2 delete atenmed

# Monitor interativo (CPU, memória)
pm2 monit

# Ver informações detalhadas
pm2 describe atenmed

# Salvar configuração atual
pm2 save

# Ver lista de processos
pm2 list
```

---

## 👤 GERENCIAR USUÁRIOS E CLIENTES

```powershell
# Criar primeiro admin
node scripts/create-admin.js

# Ativar novo cliente (onboarding)
node scripts/ativar-cliente.js

# Cadastrar clínica para WhatsApp
node scripts/cadastrar-clinica-whatsapp.js

# Testar multi-clínica
node scripts/testar-multi-clinica.js
```

---

## 💰 FATURAMENTO

```powershell
# Gerar faturas do mês (executar dia 1º)
node scripts/gerar-faturas-mensais.js

# Verificar inadimplência (executar diariamente)
node scripts/verificar-inadimplencia.js
```

---

## 🗄️ BANCO DE DADOS

```powershell
# Inicializar banco (criar índices)
node scripts/init-db.js

# Popular com dados de teste
node scripts/seed-all.js

# Conectar ao MongoDB
mongosh

# Ver databases
show dbs

# Usar database
use atenmed

# Ver collections
show collections

# Ver todos os usuários
db.users.find().pretty()

# Ver todas as clínicas
db.clinics.find().pretty()

# Ver leads
db.leads.find().pretty()

# Contar documentos
db.users.countDocuments()
db.clinics.countDocuments()
db.leads.countDocuments()
```

---

## 📊 LOGS

```powershell
# PM2 logs em tempo real
pm2 logs atenmed

# PM2 logs (últimas 100 linhas)
pm2 logs atenmed --lines 100

# Ver log da aplicação (Windows)
Get-Content logs\combined.log -Tail 50

# Ver log de erros (Windows)
Get-Content logs\error.log -Tail 50

# Limpar logs antigos (Windows)
Remove-Item logs\*.log -Force

# Linux: Ver logs
tail -f logs/combined.log
tail -f logs/error.log
```

---

## 🌐 TESTAR APIs

```powershell
# Health check
curl http://localhost:3000/health

# Ou com Invoke-WebRequest
Invoke-WebRequest -Uri http://localhost:3000/health -UseBasicParsing

# Ver status code
(Invoke-WebRequest -Uri http://localhost:3000/health -UseBasicParsing).StatusCode

# Listar todas as clínicas (precisa token)
$token = "seu-token-jwt-aqui"
$headers = @{ Authorization = "Bearer $token" }
Invoke-WebRequest -Uri http://localhost:3000/api/clinics -Headers $headers -UseBasicParsing

# Criar lead via API
$body = @{
    nome = "Teste"
    email = "teste@teste.com"
    telefone = "11999999999"
    planoInteresse = "basic"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3000/api/leads `
    -Method POST `
    -Body $body `
    -ContentType "application/json" `
    -UseBasicParsing
```

---

## 🚀 DEPLOY E ATUALIZAÇÃO

```powershell
# Deploy completo (Windows)
.\deploy-windows-simple.ps1

# Deploy completo (Linux)
./deploy-producao.sh

# Atualizar código e reiniciar
git pull
npm install
npm run build:css
pm2 restart atenmed

# Ver versão do Node
node -v

# Ver versão do npm
npm -v

# Limpar cache do npm
npm cache clean --force

# Reinstalar dependências
Remove-Item node_modules -Recurse -Force
npm install
```

---

## 🔧 MANUTENÇÃO

```powershell
# Ver uso de disco
# Windows:
Get-PSDrive C

# Linux:
df -h

# Ver uso de memória
# Windows:
Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 10

# Linux:
free -h

# Ver portas em uso (Windows)
netstat -ano | findstr :3000

# Linux:
lsof -i :3000

# Matar processo na porta 3000 (Windows)
# 1. Ver PID: netstat -ano | findstr :3000
# 2. Matar: taskkill /PID numero_do_pid /F

# Linux:
kill -9 $(lsof -t -i:3000)
```

---

## 🛠️ DESENVOLVIMENTO

```powershell
# Modo desenvolvimento (auto-reload)
npm run dev

# Build CSS
npm run build:css

# Watch CSS (rebuilda ao salvar)
npm run watch:css

# Testes
npm test

# Ver dependências desatualizadas
npm outdated

# Atualizar dependências
npm update

# Auditar vulnerabilidades
npm audit

# Corrigir vulnerabilidades
npm audit fix
```

---

## 🔐 SEGURANÇA

```powershell
# Gerar JWT_SECRET forte (Node)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Ou com OpenSSL (se disponível)
openssl rand -base64 32

# Ver variáveis de ambiente (cuidado!)
Get-Content .env

# Testar se .env está seguro (não deve aparecer no Git)
git status

# Ver o que seria commitado
git add --dry-run .
```

---

## 📦 BACKUP

```powershell
# Backup manual do MongoDB
mongodump --db atenmed --out backups/manual-$(Get-Date -Format "yyyyMMdd_HHmmss")

# Restaurar backup
mongorestore --db atenmed backups/pasta-do-backup/atenmed

# Backup do código e .env
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Compress-Archive -Path . -DestinationPath "backups/codigo-$timestamp.zip"
```

---

## 🌐 ABRIR NO NAVEGADOR

```powershell
# Landing page
Start-Process "http://localhost:3000"

# Planos
Start-Process "http://localhost:3000/planos"

# CRM
Start-Process "http://localhost:3000/crm"

# Portal
Start-Process "http://localhost:3000/portal"

# Health
Start-Process "http://localhost:3000/health"
```

---

## 🆘 EMERGÊNCIA - SISTEMA FORA DO AR

```powershell
# 1. Ver status do PM2
pm2 status

# 2. Ver logs de erro
pm2 logs atenmed --err --lines 50

# 3. Verificar MongoDB
mongosh --eval "db.adminCommand('ping')"

# 4. Reiniciar tudo
pm2 restart atenmed

# 5. Se não resolver, deletar e iniciar novamente
pm2 delete atenmed
pm2 start ecosystem.config.js --env production

# 6. Se ainda não resolver, rodar direto
node server.js
# (Ctrl+C para parar)

# 7. Ver o que está usando a porta 3000
netstat -ano | findstr :3000
# Matar o processo se necessário
taskkill /PID numero_do_pid /F
```

---

## 📞 SUPORTE RÁPIDO

### **Erro: Cannot connect to MongoDB**
```powershell
# Windows: Verificar se MongoDB está rodando
Get-Process mongod

# Se não estiver, iniciar
mongod --dbpath C:\data\db

# Linux:
sudo systemctl status mongod
sudo systemctl start mongod
```

### **Erro: Port 3000 already in use**
```powershell
# Ver o que está usando
netstat -ano | findstr :3000

# Matar processo
taskkill /PID numero_do_pid /F

# Ou mudar porta no .env
# PORT=3001
```

### **Erro: Module not found**
```powershell
# Reinstalar dependências
npm install
```

### **Erro: JWT malformed**
```powershell
# Fazer login novamente
# O token pode ter expirado ou ser inválido
```

---

## 🎯 ATALHOS ÚTEIS

```powershell
# Alias úteis (adicionar ao perfil do PowerShell)
function pm2-status { pm2 status }
function pm2-logs { pm2 logs atenmed }
function pm2-restart { pm2 restart atenmed }
function open-app { Start-Process "http://localhost:3000" }

# Usar:
pm2-status
pm2-logs
pm2-restart
open-app
```

---

**Salve este arquivo para referência rápida!** 📌

