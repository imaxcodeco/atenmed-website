# 🔐 GitHub Secrets - Guia Completo para Deploy

**Domínio:** atenmed.com.br  
**Workflow:** `.github/workflows/deploy.yml`

---

## 📋 COMO CONFIGURAR

### **1. Acessar GitHub Secrets:**
1. Vá para: `https://github.com/seu-usuario/seu-repo`
2. Clique em **Settings**
3. No menu lateral: **Secrets and variables** → **Actions**
4. Clique em **New repository secret**
5. Preencha Nome e Valor
6. Clique em **Add secret**

---

## 🔑 SECRETS OBRIGATÓRIOS (15 secrets)

### **🌐 SERVIDOR (4 secrets):**

#### `SERVER_HOST`
```
Nome: SERVER_HOST
Valor: IP ou domínio do servidor
Exemplo: 3.129.206.231 ou atenmed.com.br
Descrição: IP público do servidor EC2/AWS
```

#### `SERVER_USER`
```
Nome: SERVER_USER
Valor: ubuntu
Descrição: Usuário SSH do servidor (geralmente 'ubuntu' na AWS)
```

#### `SERVER_SSH_KEY`
```
Nome: SERVER_SSH_KEY
Valor: Conteúdo completo da chave privada SSH (formato PEM)
Descrição: Chave privada para acesso SSH ao servidor

IMPORTANTE:
- Deve incluir -----BEGIN ... PRIVATE KEY----- e -----END ... PRIVATE KEY-----
- É a mesma chave que você usa para conectar: ssh -i chave.pem ubuntu@servidor
- Copie TODO o conteúdo do arquivo .pem
```

#### `SERVER_PORT` (Opcional)
```
Nome: SERVER_PORT
Valor: 22
Descrição: Porta SSH (padrão é 22, só configure se for diferente)
```

---

### **💾 BANCO DE DADOS (1 secret):**

#### `MONGODB_URI`
```
Nome: MONGODB_URI
Valor: String de conexão do MongoDB Atlas

Formato MongoDB Atlas:
mongodb+srv://usuario:senha@cluster.mongodb.net/atenmed?retryWrites=true&w=majority

Como obter no MongoDB Atlas:
1. Acesse: https://cloud.mongodb.com
2. Seu Cluster → Connect
3. "Connect your application"
4. Copiar a Connection String
5. Substituir <password> pela sua senha real
6. Adicionar nome do banco: /atenmed antes do ? (ou substituir o ? por /atenmed?)

Exemplo completo (seu caso):
mongodb+srv://ianmaxcodeco_atenmed:SUA_SENHA_REAL@cluster0.fcpsqdo.mongodb.net/atenmed?retryWrites=true&w=majority&appName=Cluster0

⚠️ IMPORTANTE:
- Usar MongoDB Atlas (não MongoDB local)
- String deve começar com mongodb+srv://
- Substituir <db_password> pela senha real do usuário
- Adicionar /atenmed antes do ? na string
- Se senha tiver caracteres especiais (@, #, $), codificar na URL
- Adicionar IP do servidor na whitelist do MongoDB Atlas (Network Access)

Descrição: String de conexão do MongoDB Atlas
```

---

### **🔒 SEGURANÇA (2 secrets):**

#### `JWT_SECRET`
```
Nome: JWT_SECRET
Valor: Senha forte de 32+ caracteres (gerar com comando abaixo)

Como gerar:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

Exemplo de saída:
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2

Descrição: Usado para assinar tokens JWT de autenticação
```

#### `SESSION_SECRET`
```
Nome: SESSION_SECRET
Valor: Outra senha forte DIFERENTE do JWT_SECRET (gerar com comando abaixo)

Como gerar:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

Descrição: Usado para proteger sessões
```

---

### **📧 EMAIL AWS SES (4 secrets):**

#### `EMAIL_HOST`
```
Nome: EMAIL_HOST
Valor: email-smtp.us-east-1.amazonaws.com

Regiões AWS comuns:
- us-east-1: email-smtp.us-east-1.amazonaws.com
- us-west-2: email-smtp.us-west-2.amazonaws.com
- eu-west-1: email-smtp.eu-west-1.amazonaws.com
- sa-east-1: email-smtp.sa-east-1.amazonaws.com (São Paulo)

Descrição: Host SMTP do AWS SES
```

#### `EMAIL_USER`
```
Nome: EMAIL_USER
Valor: SMTP username do AWS SES

Como obter:
1. AWS Console → SES → SMTP Settings
2. Create SMTP Credentials
3. Copiar "SMTP username"
4. Formato: AKIAIOSFODNN7EXAMPLE

Descrição: Usuário SMTP do AWS SES
```

#### `EMAIL_PASS`
```
Nome: EMAIL_PASS
Valor: SMTP password do AWS SES

Como obter:
1. Mesmo lugar do EMAIL_USER
2. Copiar "SMTP password"
3. ⚠️ Mostrada apenas UMA VEZ ao criar
4. Se perdeu, precisa criar novas credenciais

Descrição: Senha SMTP do AWS SES
```

#### `EMAIL_FROM`
```
Nome: EMAIL_FROM
Valor: AtenMed <contato@atenmed.com.br>

IMPORTANTE:
- Email deve estar verificado no SES
- Sair do Sandbox do SES para enviar para qualquer email
- Formato: Nome <email@dominio.com.br>

Descrição: Remetente padrão dos emails
```

---

### **💬 WHATSAPP BUSINESS API (4 secrets):**

#### `WHATSAPP_PHONE_ID`
```
Nome: WHATSAPP_PHONE_ID
Valor: Número ID do Meta

Como obter:
1. https://developers.facebook.com
2. Seu App → WhatsApp → Getting Started
3. Copiar "Phone number ID"
4. Formato: 123456789012345

Descrição: ID do número de telefone no Meta
```

#### `WHATSAPP_TOKEN`
```
Nome: WHATSAPP_TOKEN
Valor: Token de acesso permanente do Meta

Como gerar:
1. Meta for Developers → Seu App
2. WhatsApp → Getting Started
3. "Generate Access Token"
4. Selecionar permissões:
   - whatsapp_business_messaging
   - whatsapp_business_management
5. Copiar token permanente

Descrição: Token de autenticação da API do WhatsApp
```

#### `WHATSAPP_VERIFY_TOKEN`
```
Nome: WHATSAPP_VERIFY_TOKEN
Valor: String aleatória única

Como gerar:
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

Exemplo:
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

Descrição: Token para verificação do webhook (configurar no Meta também)
```

#### `WHATSAPP_APP_SECRET`
```
Nome: WHATSAPP_APP_SECRET
Valor: App Secret do Meta

Como obter:
1. Meta for Developers → Seu App
2. Settings → Basic
3. Mostrar "App Secret"
4. Copiar valor

Descrição: App Secret usado para validar assinaturas de webhook
```

---

### **📅 GOOGLE CALENDAR (2 secrets):**

#### `GOOGLE_CLIENT_ID`
```
Nome: GOOGLE_CLIENT_ID
Valor: Client ID do Google Cloud

Como obter:
1. https://console.cloud.google.com
2. Seu Projeto → APIs & Services → Credentials
3. OAuth 2.0 Client IDs
4. Copiar "Client ID"
5. Formato: 123456789-abcdefghijklmnop.apps.googleusercontent.com

Descrição: Client ID para autenticação OAuth do Google
```

#### `GOOGLE_CLIENT_SECRET`
```
Nome: GOOGLE_CLIENT_SECRET
Valor: Client Secret do Google

Como obter:
1. Mesmo local do Client ID
2. Copiar "Client Secret"
3. Formato: GOCSPX-abcdefghijklmnopqrstuvwxyz

Descrição: Client Secret para autenticação OAuth do Google
```

---

## ⚙️ SECRETS OPCIONAIS (mas recomendados)

### **🔴 REDIS (para fila de mensagens):**
```
Nome: REDIS_URL
Valor: redis://localhost:6379
Descrição: URL do Redis (opcional, melhora performance)
```

### **🐛 SENTRY (monitoramento de erros):**
```
Nome: SENTRY_DSN
Valor: https://xxx@xxx.ingest.sentry.io/xxx
Descrição: DSN do Sentry para rastreamento de erros
```

### **🤖 IA CONVERSACIONAL (opcional):**
```
Nome: GEMINI_API_KEY
Valor: AIza...
Descrição: Chave API do Google Gemini (opcional, para IA no WhatsApp)
```

---

## 📊 CHECKLIST DE CONFIGURAÇÃO

### **✅ Passo 1: Configurar Servidor**
- [ ] `SERVER_HOST` configurado
- [ ] `SERVER_USER` configurado (geralmente `ubuntu`)
- [ ] `SERVER_SSH_KEY` configurado (chave completa com BEGIN/END)
- [ ] Testar acesso SSH: `ssh -i chave.pem ubuntu@SERVER_HOST`

### **✅ Passo 2: Configurar Banco de Dados**
- [ ] `MONGODB_URI` configurado
- [ ] MongoDB rodando no servidor ou Atlas configurado
- [ ] Testar conexão do servidor ao MongoDB

### **✅ Passo 3: Configurar Segurança**
- [ ] `JWT_SECRET` gerado (comando Node.js)
- [ ] `SESSION_SECRET` gerado (diferente do JWT)
- [ ] Ambos têm 32+ caracteres

### **✅ Passo 4: Configurar Email (AWS SES)**
- [ ] Conta AWS criada
- [ ] SES configurado
- [ ] Email verificado no SES
- [ ] `EMAIL_HOST` configurado (região correta)
- [ ] `EMAIL_USER` criado no SES
- [ ] `EMAIL_PASS` copiado (mostrado apenas uma vez)
- [ ] `EMAIL_FROM` configurado
- [ ] Testar envio de email

### **✅ Passo 5: Configurar WhatsApp**
- [ ] App criado no Meta for Developers
- [ ] Número WhatsApp Business verificado
- [ ] `WHATSAPP_PHONE_ID` copiado
- [ ] `WHATSAPP_TOKEN` gerado (permanente)
- [ ] `WHATSAPP_VERIFY_TOKEN` gerado
- [ ] `WHATSAPP_APP_SECRET` copiado
- [ ] Webhook configurado no Meta

### **✅ Passo 6: Configurar Google Calendar**
- [ ] Projeto criado no Google Cloud
- [ ] Calendar API habilitada
- [ ] OAuth 2.0 Client criado
- [ ] `GOOGLE_CLIENT_ID` copiado
- [ ] `GOOGLE_CLIENT_SECRET` copiado
- [ ] Redirect URI configurado: `https://atenmed.com.br/api/auth/google/callback`

---

## 🚀 COMANDOS RÁPIDOS PARA GERAR VALORES

Cole no terminal para gerar os secrets que precisam de valores aleatórios:

```bash
echo "=== GERAR SECRETS ==="
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

## 📝 FORMATO DO SERVER_SSH_KEY

⚠️ **MUITO IMPORTANTE:** O `SERVER_SSH_KEY` deve ser a chave privada completa no formato PEM:

```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
(muitas linhas aqui)
...
-----END RSA PRIVATE KEY-----
```

**OU:**

```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQ...
(muitas linhas aqui)
...
-----END PRIVATE KEY-----
```

Como obter:
```bash
# No Windows (PowerShell):
Get-Content C:\caminho\para\sua-chave.pem | Set-Clipboard

# No Linux/Mac:
cat ~/.ssh/sua-chave.pem | pbcopy  # Mac
cat ~/.ssh/sua-chave.pem | xclip   # Linux
```

---

## 🧪 TESTAR DEPLOY

Após configurar todos os secrets:

### **1. Fazer Push para Trigger:**
```bash
git add .
git commit -m "test: trigger deploy"
git push origin main
```

### **2. Acompanhar no GitHub:**
- Vá para: `https://github.com/seu-usuario/seu-repo/actions`
- Clique no workflow "Deploy to Production"
- Acompanhe os logs em tempo real

### **3. Ou Executar Manualmente:**
1. GitHub → Actions
2. "Deploy to Production"
3. "Run workflow"
4. Selecione a branch (main)
5. "Run workflow"

### **4. Verificar Sucesso:**
```bash
# Health check
curl https://atenmed.com.br/health

# Verificar no servidor
ssh -i chave.pem ubuntu@SEU_SERVIDOR
pm2 status
pm2 logs atenmed --lines 50
```

---

## 🔍 TROUBLESHOOTING

### **❌ Erro: Permission denied (publickey)**
**Causa:** `SERVER_SSH_KEY` incorreto ou formato errado

**Solução:**
1. Verificar se chave tem BEGIN/END corretos
2. Testar chave manualmente: `ssh -i chave.pem ubuntu@SERVER_HOST`
3. Garantir que a chave pública está no `~/.ssh/authorized_keys` do servidor

### **❌ Erro: MongoDB connection failed**
**Causa:** `MONGODB_URI` incorreta ou MongoDB não acessível

**Solução:**
1. Verificar formato da URI
2. Testar conexão do servidor: `mongosh "SUA_URI"`
3. Verificar firewall/security groups (porta 27017)

### **❌ Erro: Invalid WhatsApp token**
**Causa:** Token expirado ou permissões incorretas

**Solução:**
1. Gerar novo token no Meta for Developers
2. Verificar permissões: `whatsapp_business_messaging`
3. Token deve ser permanente (não temporário)

### **❌ Erro: Health check failed**
**Causa:** Aplicação não iniciou corretamente

**Solução:**
1. Verificar logs no GitHub Actions
2. SSH no servidor: `pm2 logs atenmed`
3. Verificar se porta 3000 está aberta
4. Verificar se MongoDB está acessível

---

## ✅ RESUMO: 15 SECRETS OBRIGATÓRIOS

### **Servidor (4):**
1. `SERVER_HOST`
2. `SERVER_USER`
3. `SERVER_SSH_KEY`
4. `SERVER_PORT` (opcional)

### **Banco de Dados (1):**
5. `MONGODB_URI`

### **Segurança (2):**
6. `JWT_SECRET`
7. `SESSION_SECRET`

### **Email (4):**
8. `EMAIL_HOST`
9. `EMAIL_USER`
10. `EMAIL_PASS`
11. `EMAIL_FROM`

### **WhatsApp (4):**
12. `WHATSAPP_PHONE_ID`
13. `WHATSAPP_TOKEN`
14. `WHATSAPP_VERIFY_TOKEN`
15. `WHATSAPP_APP_SECRET`

### **Google Calendar (2):**
16. `GOOGLE_CLIENT_ID`
17. `GOOGLE_CLIENT_SECRET`

---

## 🎯 QUICK START

**Quer configurar rapidamente?**

1. Gere os secrets de segurança:
   ```bash
   node -e "console.log('JWT_SECRET:', require('crypto').randomBytes(32).toString('hex'))"
   node -e "console.log('SESSION_SECRET:', require('crypto').randomBytes(32).toString('hex'))"
   node -e "console.log('WHATSAPP_VERIFY_TOKEN:', require('crypto').randomBytes(16).toString('hex'))"
   ```

2. Configure os secrets no GitHub (Settings → Secrets → Actions)

3. Faça push:
   ```bash
   git push origin main
   ```

4. Acompanhe: `https://github.com/seu-usuario/seu-repo/actions`

---

**Última atualização:** Janeiro 2025  
**Workflow:** `.github/workflows/deploy.yml`

