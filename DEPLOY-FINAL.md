# 🚀 Deploy Final - AtenMed AWS

## ✅ Pré-requisitos Completados

- [x] MongoDB Atlas configurado
- [x] Google Calendar OAuth configurado
- [x] Código commitado no GitHub (branch: `reorganizacao-estrutura`)
- [x] Warnings do Mongoose corrigidos

---

## 📋 Passos para Deploy no AWS

### 1️⃣ Conectar ao Servidor AWS via SSH

```bash
ssh -i "sua-chave.pem" ubuntu@ec2-seu-ip.compute.amazonaws.com
```

Ou se já tiver configurado no ~/.ssh/config:
```bash
ssh atenmed
```

---

### 2️⃣ Navegar até o Diretório do Projeto

```bash
cd /var/www/atenmed
```

---

### 3️⃣ Fazer Pull das Mudanças do GitHub

```bash
# Fazer backup do .env atual (tem as credenciais de produção)
sudo cp .env .env.backup-producao

# Verificar branch atual
git branch

# Se não estiver no branch reorganizacao-estrutura, mudar:
sudo git fetch origin
sudo git checkout reorganizacao-estrutura

# Fazer pull das mudanças
sudo git pull origin reorganizacao-estrutura
```

---

### 4️⃣ Atualizar o Arquivo .env para Produção

```bash
# Editar o .env
sudo nano .env
```

**Variáveis importantes para atualizar:**

```bash
# Ambiente
NODE_ENV=production

# MongoDB Atlas (copiar exatamente)
MONGODB_URI=mongodb+srv://ianmaxcodeco_atenmed:Bia140917%23@cluster0.fcpsqdo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# Google Calendar OAuth (USAR AS CREDENCIAIS QUE VOCÊ JÁ TEM)
GOOGLE_CLIENT_ID=350840859703-xxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_REDIRECT_URL=https://atenmed.com.br/api/auth/google/callback

# AI (Gemini) (USAR SUA API KEY)
AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# App URL
APP_URL=https://atenmed.com.br

# CORS
CORS_ORIGIN=https://atenmed.com.br,https://www.atenmed.com.br

# Habilitar serviços automáticos
ENABLE_REMINDERS=true
ENABLE_WAITLIST=true
```

**Salvar:** `Ctrl + O` → Enter → `Ctrl + X`

---

### 5️⃣ Instalar/Atualizar Dependências

```bash
# Instalar novas dependências (se houver)
sudo npm install

# Verificar se tudo está OK
npm list --depth=0
```

---

### 6️⃣ Reiniciar PM2

```bash
# Verificar status atual
pm2 status

# Reiniciar a aplicação
pm2 restart atenmed

# Ver logs em tempo real
pm2 logs atenmed --lines 50
```

---

### 7️⃣ Verificar se o Servidor Está Funcionando

```bash
# Verificar se está rodando na porta 3000
netstat -tlnp | grep :3000

# Testar endpoint de saúde
curl http://localhost:3000/health

# Ver logs
pm2 logs atenmed --lines 100
```

---

### 8️⃣ Testar no Navegador

Acesse: **https://atenmed.com.br**

Endpoints para testar:
- `https://atenmed.com.br/health` - Status do servidor
- `https://atenmed.com.br/dashboard` - Dashboard admin
- `https://atenmed.com.br/agendamento` - Agendamento inteligente
- `https://atenmed.com.br/analytics` - Analytics dashboard
- `https://atenmed.com.br/api/auth/google` - Autenticação Google Calendar

---

## 🔧 Comandos Úteis

### Ver logs em tempo real:
```bash
pm2 logs atenmed --lines 100
```

### Reiniciar se houver erro:
```bash
pm2 restart atenmed
```

### Parar o servidor:
```bash
pm2 stop atenmed
```

### Ver métricas:
```bash
pm2 monit
```

### Verificar processos:
```bash
pm2 list
```

---

## 🐛 Troubleshooting

### Se o servidor não iniciar:

1. **Verificar logs de erro:**
```bash
pm2 logs atenmed --err --lines 50
```

2. **Verificar se o MongoDB está conectando:**
```bash
pm2 logs atenmed | grep MongoDB
```

3. **Verificar se a porta 3000 está livre:**
```bash
sudo lsof -i :3000
```

4. **Reiniciar do zero:**
```bash
pm2 delete atenmed
pm2 start ecosystem.config.js --env production
```

---

## ✅ Checklist Final

- [ ] Conectado ao servidor AWS via SSH
- [ ] Pull do GitHub feito com sucesso
- [ ] Arquivo .env atualizado com credenciais de produção
- [ ] Dependências instaladas
- [ ] PM2 reiniciado
- [ ] Logs verificados (sem erros)
- [ ] MongoDB conectado com sucesso
- [ ] Site https://atenmed.com.br acessível
- [ ] Dashboard funcionando
- [ ] APIs respondendo

---

## 🎉 Após o Deploy

### Testar Funcionalidades:

1. **Agendamento Inteligente:**
   - Acessar https://atenmed.com.br/agendamento
   - Criar uma clínica teste
   - Adicionar especialidade
   - Cadastrar médico
   - Testar agendamento

2. **Google Calendar:**
   - Acessar https://atenmed.com.br/api/auth/google
   - Autorizar acesso
   - Verificar se calendários aparecem

3. **WhatsApp (quando configurar):**
   - Configurar WHATSAPP_TOKEN e WHATSAPP_PHONE_ID no .env
   - Reiniciar PM2
   - Testar webhook

---

## 📞 Suporte

Se tiver problemas:
1. Verificar logs: `pm2 logs atenmed`
2. Verificar .env tem todas as variáveis
3. Verificar MongoDB Atlas está acessível
4. Reiniciar: `pm2 restart atenmed`

---

**✨ Boa sorte com o deploy!**

