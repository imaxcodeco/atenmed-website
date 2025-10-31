# 🚀 DEPLOY RÁPIDO - WINDOWS

Guia simplificado para fazer deploy local no Windows para testes ou desenvolvimento.

---

## 📋 PRÉ-REQUISITOS

### **Instalar:**
1. **Node.js 18+**: https://nodejs.org
2. **MongoDB Community**: https://www.mongodb.com/try/download/community
3. **Git**: https://git-scm.com/download/win

### **Verificar instalações:**
```powershell
node -v
npm -v
mongod --version
git --version
```

---

## ⚡ DEPLOY EM 5 MINUTOS

### **1. Clonar ou Abrir Projeto**

Se já está no diretório do projeto, pule para o passo 2.

```powershell
cd C:\Users\Ian_1\Documents\AtenMed\Website
```

### **2. Iniciar MongoDB**

Abra um novo terminal PowerShell e execute:

```powershell
# Criar diretório de dados (primeira vez)
mkdir C:\data\db

# Iniciar MongoDB
mongod --dbpath C:\data\db
```

**Deixe este terminal aberto!**

### **3. Configurar Ambiente**

No terminal do projeto:

```powershell
# Copiar exemplo de .env
copy env.example .env

# Editar .env com Notepad
notepad .env
```

**Mínimo necessário no .env:**
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/atenmed
JWT_SECRET=mudar-para-senha-forte-aqui
APP_URL=http://localhost:3000
```

### **4. Instalar Dependências**

```powershell
npm install
```

### **5. Build CSS**

```powershell
npm run build:css
```

### **6. Inicializar Banco**

```powershell
node scripts/init-db.js
```

### **7. Criar Admin**

```powershell
node scripts/create-admin.js
```

Quando solicitado:
- **Nome:** Seu Nome
- **Email:** admin@atenmed.com.br
- **Senha:** senha123 (ou qualquer senha)

### **8. Iniciar Servidor**

**Opção A - Modo Desenvolvimento (com reload automático):**
```powershell
npm run dev
```

**Opção B - Com PM2 (recomendado):**
```powershell
# Instalar PM2 globalmente (primeira vez)
npm install -g pm2

# Iniciar com PM2
pm2 start ecosystem.config.js

# Ver logs
pm2 logs

# Ver status
pm2 status
```

### **9. Testar**

Abra o navegador em:
- **Landing:** http://localhost:3000
- **Planos:** http://localhost:3000/planos
- **CRM:** http://localhost:3000/crm
- **Portal:** http://localhost:3000/portal
- **API Health:** http://localhost:3000/health

---

## 🚀 DEPLOY AUTOMATIZADO

Se tudo estiver configurado, use o script automatizado:

```powershell
# Executar script de deploy
.\deploy-windows.ps1
```

Este script:
- ✅ Verifica pré-requisitos
- ✅ Cria backup
- ✅ Instala dependências
- ✅ Faz build
- ✅ Inicia com PM2
- ✅ Verifica se está rodando

---

## 📝 COMANDOS ÚTEIS

### **PM2:**
```powershell
pm2 status              # Ver status de todas as aplicações
pm2 logs atenmed        # Ver logs em tempo real
pm2 restart atenmed     # Reiniciar aplicação
pm2 stop atenmed        # Parar aplicação
pm2 delete atenmed      # Remover aplicação do PM2
pm2 monit               # Monitor interativo
```

### **Desenvolvimento:**
```powershell
npm run dev             # Iniciar em modo desenvolvimento
npm run build:css       # Compilar CSS
npm test                # Rodar testes
```

### **MongoDB:**
```powershell
# Conectar ao MongoDB
mongosh

# Ver databases
show dbs

# Usar database
use atenmed

# Ver collections
show collections

# Ver usuários
db.users.find()
```

### **Scripts úteis:**
```powershell
# Criar admin
node scripts/create-admin.js

# Inicializar banco
node scripts/init-db.js

# Cadastrar clínica
node scripts/ativar-cliente.js

# Gerar faturas
node scripts/gerar-faturas-mensais.js

# Verificar inadimplência
node scripts/verificar-inadimplencia.js
```

---

## 🔧 TROUBLESHOOTING

### **MongoDB não inicia**
```powershell
# Verificar se já está rodando
Get-Process mongod

# Se já estiver rodando, parar
Stop-Process -Name mongod

# Iniciar novamente
mongod --dbpath C:\data\db
```

### **Porta 3000 em uso**
```powershell
# Ver o que está usando a porta
netstat -ano | findstr :3000

# Matar processo (substitua PID)
taskkill /PID numero_do_pid /F

# OU mudar porta no .env
# PORT=3001
```

### **Erro ao instalar dependências**
```powershell
# Limpar cache
npm cache clean --force

# Remover node_modules e reinstalar
Remove-Item -Recurse -Force node_modules
npm install
```

### **PM2 não funciona**
```powershell
# Reinstalar PM2
npm uninstall -g pm2
npm install -g pm2

# OU rodar direto com Node
npm run dev
```

### **Build CSS falha**
```powershell
# Instalar Tailwind manualmente
npm install -D tailwindcss postcss autoprefixer

# Tentar build novamente
npm run build:css
```

---

## 📊 APÓS O DEPLOY

### **1. Testar Funcionalidades:**

```powershell
# Abrir navegador em cada URL e testar:
start http://localhost:3000          # Landing
start http://localhost:3000/planos   # Captação
start http://localhost:3000/crm      # CRM (precisa login)
start http://localhost:3000/portal   # Portal (precisa login)
```

### **2. Criar Cliente Teste:**

```powershell
node scripts/ativar-cliente.js
```

Preencha os dados:
- Nome da clínica: Clínica Teste
- Email do dono: clinica@teste.com
- Senha: senha123
- Plano: basic

### **3. Fazer Login:**

Acesse http://localhost:3000/crm e faça login com:
- Email: admin@atenmed.com.br (ou o que criou)
- Senha: (a que você definiu)

### **4. Testar Pipeline:**

1. Acesse http://localhost:3000/planos
2. Preencha o formulário
3. Volte ao CRM
4. Veja o lead aparecer
5. Arraste para as etapas

---

## 🎯 PRÓXIMOS PASSOS

Após o deploy local funcionando:

1. ✅ Configurar WhatsApp Business API (ver `docs/WHATSAPP-V2-SETUP.md`)
2. ✅ Configurar Google Calendar (ver `docs/GOOGLE-CALENDAR-SETUP.md`)
3. ✅ Configurar email AWS SES
4. ✅ Testar todas as features
5. ✅ Fazer deploy em servidor de produção (ver `GUIA-DEPLOY.md`)

---

## 🆘 PRECISA DE AJUDA?

- **Logs da aplicação:** `pm2 logs` ou ver `logs/combined.log`
- **Logs do MongoDB:** Ver no terminal onde o mongod está rodando
- **Testar API:** Use Postman ou Thunder Client
- **Verificar health:** http://localhost:3000/health

---

## 🎉 TUDO FUNCIONANDO?

Se tudo estiver ok, você verá:
- ✅ PM2 status: **online**
- ✅ Health check: **{"status":"ok"}**
- ✅ Landing page abre
- ✅ Login funciona

**Parabéns! Sistema rodando localmente! 🚀**

---

**Dica:** Para parar tudo:
```powershell
pm2 stop all
# E parar o MongoDB no terminal dele (Ctrl+C)
```

