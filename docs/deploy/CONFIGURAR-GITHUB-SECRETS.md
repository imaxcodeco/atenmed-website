# 🔐 CONFIGURAR GITHUB SECRETS PARA DEPLOY

**Domínio:** atenmed.com.br  
**Deploy:** GitHub Actions

---

## 📋 PASSO A PASSO

### **1. Acessar GitHub Secrets:**

1. Ir para: `https://github.com/SEU-USUARIO/SEU-REPO`
2. Click em **Settings** (no repositório)
3. No menu lateral: **Secrets and variables** → **Actions**
4. Click em **New repository secret**

---

## 🔑 SECRETS PARA CONFIGURAR

### **SERVIDOR (4 secrets):**

#### `SERVER_HOST`
```
Descrição: IP ou domínio do servidor
Valor: seu-servidor-ip ou atenmed.com.br
Exemplo: 192.168.1.100
```

#### `SERVER_USER`
```
Descrição: Usuário SSH do servidor
Valor: ubuntu (ou seu usuário)
Exemplo: ubuntu
```

#### `SERVER_SSH_KEY`
```
Descrição: Chave SSH privada para acesso
Valor: Conteúdo completo da chave privada

Como gerar:
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions
# Copiar chave pública para servidor:
ssh-copy-id -i ~/.ssh/github_actions.pub usuario@servidor
# Copiar chave privada (TODO o conteúdo):
cat ~/.ssh/github_actions
# Colar no secret (incluindo BEGIN e END)
```

#### `SERVER_PORT` (Opcional)
```
Descrição: Porta SSH (padrão 22)
Valor: 22
```

---

### **BANCO DE DADOS (1 secret):**

#### `MONGODB_URI`
```
Descrição: URL de conexão do MongoDB
Valor: mongodb://localhost:27017/atenmed

OU para MongoDB Atlas:
mongodb+srv://usuario:senha@cluster.mongodb.net/atenmed?retryWrites=true&w=majority
```

---

### **SEGURANÇA (2 secrets):**

#### `JWT_SECRET`
```
Descrição: Senha para JWT tokens
Valor: Gerar senha forte de 32+ caracteres

Como gerar:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

Exemplo:
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

#### `SESSION_SECRET`
```
Descrição: Senha para sessões
Valor: Outra senha forte diferente do JWT_SECRET

Como gerar:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### **EMAIL AWS SES (4 secrets):**

#### `EMAIL_HOST`
```
Descrição: Host SMTP do AWS SES
Valor: email-smtp.us-east-1.amazonaws.com

Regiões comuns:
- us-east-1: email-smtp.us-east-1.amazonaws.com
- us-west-2: email-smtp.us-west-2.amazonaws.com
- eu-west-1: email-smtp.eu-west-1.amazonaws.com
- sa-east-1: email-smtp.sa-east-1.amazonaws.com
```

#### `EMAIL_USER`
```
Descrição: Usuário SMTP do AWS SES
Valor: Obter no console AWS SES

Como obter:
1. AWS Console → SES → SMTP Settings
2. Create SMTP Credentials
3. Copiar SMTP Username
```

#### `EMAIL_PASS`
```
Descrição: Senha SMTP do AWS SES
Valor: Obter junto com EMAIL_USER

Atenção:
- Mostrada apenas UMA VEZ ao criar
- Se perdeu, criar novas credenciais
```

#### `EMAIL_FROM`
```
Descrição: Remetente padrão dos emails
Valor: AtenMed <contato@atenmed.com.br>

Atenção:
- Email deve estar verificado no SES
- Sair do Sandbox do SES para enviar para qualquer email
```

---

### **WHATSAPP (4 secrets):**

#### `WHATSAPP_PHONE_ID`
```
Descrição: Phone Number ID do Meta
Valor: Obter no Meta for Developers

Como obter:
1. https://developers.facebook.com
2. Seu App → WhatsApp → Getting Started
3. Copiar "Phone number ID"
```

#### `WHATSAPP_TOKEN`
```
Descrição: Token de acesso permanente
Valor: Gerar no Meta for Developers

Como gerar:
1. Meta for Developers → Seu App
2. WhatsApp → Getting Started
3. Generate Access Token
4. Selecionar permissões necessárias
5. Copiar token permanente
```

#### `WHATSAPP_VERIFY_TOKEN`
```
Descrição: Token para verificação de webhook
Valor: Criar string aleatória única

Como criar:
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

Exemplo:
a1b2c3d4e5f6g7h8
```

#### `WHATSAPP_APP_SECRET`
```
Descrição: App Secret do Meta
Valor: Obter no Meta for Developers

Como obter:
1. Meta for Developers → Seu App
2. Settings → Basic
3. Mostrar "App Secret"
4. Copiar valor
```

---

### **GOOGLE CALENDAR (2 secrets):**

#### `GOOGLE_CLIENT_ID`
```
Descrição: Client ID do Google Cloud
Valor: Obter no Google Cloud Console

Como obter:
1. https://console.cloud.google.com
2. Seu Projeto → APIs & Services → Credentials
3. OAuth 2.0 Client IDs
4. Copiar Client ID
```

#### `GOOGLE_CLIENT_SECRET`
```
Descrição: Client Secret do Google
Valor: Obter junto com Client ID

Como obter:
1. Mesmo local do Client ID
2. Copiar Client Secret
```

---

## ✅ CHECKLIST COMPLETO

Marque conforme configura:

### **Servidor:**
- [ ] `SERVER_HOST` configurado
- [ ] `SERVER_USER` configurado
- [ ] `SERVER_SSH_KEY` configurado
- [ ] Chave SSH testada: `ssh -i chave usuario@servidor`

### **Banco de Dados:**
- [ ] `MONGODB_URI` configurado
- [ ] MongoDB rodando no servidor
- [ ] Conexão testada

### **Segurança:**
- [ ] `JWT_SECRET` gerado e configurado
- [ ] `SESSION_SECRET` gerado e configurado
- [ ] Senhas com 32+ caracteres

### **Email:**
- [ ] `EMAIL_HOST` configurado
- [ ] `EMAIL_USER` configurado
- [ ] `EMAIL_PASS` configurado
- [ ] `EMAIL_FROM` configurado
- [ ] Email verificado no SES
- [ ] SES fora do Sandbox (se necessário)

### **WhatsApp:**
- [ ] `WHATSAPP_PHONE_ID` configurado
- [ ] `WHATSAPP_TOKEN` configurado
- [ ] `WHATSAPP_VERIFY_TOKEN` configurado
- [ ] `WHATSAPP_APP_SECRET` configurado
- [ ] App Meta criado e configurado

### **Google Calendar:**
- [ ] `GOOGLE_CLIENT_ID` configurado
- [ ] `GOOGLE_CLIENT_SECRET` configurado
- [ ] Projeto Google Cloud criado
- [ ] Calendar API habilitada
- [ ] Redirect URI configurado

---

## 🧪 TESTAR CONFIGURAÇÃO

Após configurar todos os secrets:

### **1. Testar Deploy Manual:**
1. GitHub → Actions
2. "Deploy to Production" workflow
3. "Run workflow"
4. Aguardar execução
5. Verificar logs

### **2. Verificar Sucesso:**
```bash
# Acessar servidor
ssh usuario@servidor

# Verificar PM2
pm2 status

# Ver logs
pm2 logs atenmed --lines 50

# Testar aplicação
curl http://localhost:3000/health
```

### **3. Testar Domínio:**
```bash
# Teste local
curl https://atenmed.com.br/health

# No navegador
https://atenmed.com.br
https://atenmed.com.br/planos
https://atenmed.com.br/crm
https://atenmed.com.br/portal
```

---

## 🆘 TROUBLESHOOTING

### **Secret não aparece:**
- Verificar se está em "Actions" (não "Dependabot")
- Nome do secret é case-sensitive
- Recarregar página

### **SSH falha:**
```
Error: Permission denied (publickey)
```
**Solução:**
1. Verificar formato da chave (BEGIN/END corretos)
2. Testar chave manualmente
3. Verificar permissões no servidor

### **MongoDB não conecta:**
```
MongoServerError: Authentication failed
```
**Solução:**
1. Verificar formato da URI
2. Verificar credenciais
3. Verificar se MongoDB está rodando
4. Verificar firewall

### **Email não envia:**
```
SMTP error
```
**Solução:**
1. Verificar credenciais SES
2. Verificar se email está verificado
3. Verificar se está fora do Sandbox
4. Testar credenciais manualmente

---

## 📊 COMANDO RÁPIDO PARA GERAR SENHAS

Cole no terminal:

```bash
echo "=== SENHAS PARA GITHUB SECRETS ==="
echo ""
echo "JWT_SECRET:"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
echo ""
echo "SESSION_SECRET:"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
echo ""
echo "WHATSAPP_VERIFY_TOKEN:"
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
echo ""
echo "=== COPIE OS VALORES ACIMA ==="
```

---

## ✅ TUDO CONFIGURADO?

Se todos os secrets estão configurados:

```bash
# Fazer commit e push
git add .
git commit -m "feat: configuração de deploy via GitHub Actions"
git push origin main

# O deploy vai iniciar automaticamente!
```

**Acompanhe em:** `https://github.com/seu-usuario/seu-repo/actions`

---

**Boa sorte com o deploy! 🚀**

**Última atualização:** 28/10/2025

