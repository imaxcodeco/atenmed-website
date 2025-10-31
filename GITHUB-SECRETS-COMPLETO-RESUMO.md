# 🔐 GitHub Secrets - O QUE PREENCHER (RESUMO COMPLETO)

## 📋 COMO ACESSAR

1. Vá para: `https://github.com/seu-usuario/seu-repo/settings/secrets/actions`
2. Clique em **"New repository secret"** para cada item abaixo
3. Preencha **Name** e **Secret**
4. Clique em **"Add secret"**

---

## 🔑 SECRETS OBRIGATÓRIOS (15 secrets)

### **🌐 SERVIDOR (4 secrets):**

#### **1. SERVER_HOST**
```
Name: SERVER_HOST
Secret: 3.129.206.231
```
*(ou o IP/domínio do seu servidor)*

#### **2. SERVER_USER**
```
Name: SERVER_USER
Secret: ubuntu
```
*(geralmente 'ubuntu' na AWS EC2)*

#### **3. SERVER_SSH_KEY**
```
Name: SERVER_SSH_KEY
Secret: [COLE AQUI TODO O CONTEÚDO DO ARQUIVO .pem]
```
**IMPORTANTE:** Cole a chave privada completa, incluindo:
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
(muitas linhas aqui)
...
-----END RSA PRIVATE KEY-----
```

#### **4. SERVER_PORT** (Opcional)
```
Name: SERVER_PORT
Secret: 22
```

---

### **🌐 URLS (2 secrets):**

#### **5. APP_URL**
```
Name: APP_URL
Secret: https://atenmed.com.br
```

#### **6. CORS_ORIGIN**
```
Name: CORS_ORIGIN
Secret: https://atenmed.com.br,https://www.atenmed.com.br
```
*(Domínios separados por vírgula, sem espaços)*

---

### **💾 BANCO DE DADOS (1 secret):**

#### **7. MONGODB_URI**
```
Name: MONGODB_URI
Secret: mongodb+srv://ianmaxcodeco_atenmed:Bia140917%23@cluster0.fcpsqdo.mongodb.net/atenmed?retryWrites=true&w=majority&appName=Cluster0
```
✅ **PRONTO! Use esta string exata!**

---

### **🔒 SEGURANÇA (2 secrets):**

#### **8. JWT_SECRET**
```
Name: JWT_SECRET
Secret: 64765ef5ff4699959819ad735c5b2ee62629b48aa38887ee965c273bf90935d7
```
*(Já gerado para você)*

#### **9. SESSION_SECRET**
```
Name: SESSION_SECRET
Secret: 02246cda2afb9ef2fc9329663fb5534c32b08f72422adb95260018b58d7f36de
```
*(Já gerado para você)*

---

### **📧 EMAIL AWS SES (4 secrets):**

#### **10. EMAIL_HOST**
```
Name: EMAIL_HOST
Secret: email-smtp.us-east-1.amazonaws.com
```
*(ou a região do seu SES)*

#### **11. EMAIL_USER**
```
Name: EMAIL_USER
Secret: [SEU SMTP USERNAME DO AWS SES]
```
*(Obter no AWS Console → SES → SMTP Settings)*

#### **12. EMAIL_PASS**
```
Name: EMAIL_PASS
Secret: [SEU SMTP PASSWORD DO AWS SES]
```
*(Obter junto com EMAIL_USER - mostrado apenas UMA VEZ)*

#### **13. EMAIL_FROM**
```
Name: EMAIL_FROM
Secret: AtenMed <contato@atenmed.com.br>
```

---

### **💬 WHATSAPP BUSINESS API (4 secrets):**

#### **14. WHATSAPP_PHONE_ID**
```
Name: WHATSAPP_PHONE_ID
Secret: [SEU PHONE NUMBER ID DO META]
```
*(Obter em: Meta for Developers → Seu App → WhatsApp → Getting Started)*

#### **15. WHATSAPP_TOKEN**
```
Name: WHATSAPP_TOKEN
Secret: [SEU TOKEN PERMANENTE DO META]
```
*(Gerar em: Meta for Developers → Seu App → WhatsApp → Generate Access Token)*

#### **16. WHATSAPP_VERIFY_TOKEN**
```
Name: WHATSAPP_VERIFY_TOKEN
Secret: d92257f908aa9ecfdedd94ff9d66ecd6
```
*(Já gerado para você)*

#### **17. WHATSAPP_APP_SECRET**
```
Name: WHATSAPP_APP_SECRET
Secret: [SEU APP SECRET DO META]
```
*(Obter em: Meta for Developers → Seu App → Settings → Basic → App Secret)*

---

### **📅 GOOGLE CALENDAR (2 secrets):**

#### **18. GOOGLE_CLIENT_ID**
```
Name: GOOGLE_CLIENT_ID
Secret: [SEU CLIENT ID DO GOOGLE CLOUD]
```
*(Obter em: Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs)*

#### **19. GOOGLE_CLIENT_SECRET**
```
Name: GOOGLE_CLIENT_SECRET
Secret: [SEU CLIENT SECRET DO GOOGLE CLOUD]
```
*(Obter junto com Client ID)*

---

## 📊 CHECKLIST RÁPIDO

### **✅ Já Prontos (Copie e Cole):**
- [x] `MONGODB_URI` - ✅ String completa já gerada
- [x] `JWT_SECRET` - ✅ Gerado
- [x] `SESSION_SECRET` - ✅ Gerado
- [x] `WHATSAPP_VERIFY_TOKEN` - ✅ Gerado

### **⚠️ Precisam Configurar:**
- [ ] `SERVER_HOST` - IP do servidor
- [ ] `SERVER_USER` - geralmente `ubuntu`
- [ ] `SERVER_SSH_KEY` - chave .pem completa
- [ ] `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` - AWS SES
- [ ] `WHATSAPP_PHONE_ID`, `WHATSAPP_TOKEN`, `WHATSAPP_APP_SECRET` - Meta
- [ ] `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google Cloud

---

## 🎯 ORDEM SUGERIDA PARA CONFIGURAR

### **1. Começar pelo Essencial (para fazer deploy funcionar):**
1. ✅ `MONGODB_URI` - Já está pronta!
2. ✅ `JWT_SECRET` - Já gerado
3. ✅ `SESSION_SECRET` - Já gerado
4. `SERVER_HOST` - Seu IP do servidor
5. `SERVER_USER` - `ubuntu`
6. `SERVER_SSH_KEY` - Chave .pem

### **2. Depois Adicionar (funcionalidades específicas):**
- Email (AWS SES) - 4 secrets
- WhatsApp - 4 secrets
- Google Calendar - 2 secrets

---

## 📝 RESUMO - STRINGS PRONTAS PARA COPIAR

### **MONGODB_URI (✅ PRONTO):**
```
mongodb+srv://ianmaxcodeco_atenmed:Bia140917%23@cluster0.fcpsqdo.mongodb.net/atenmed?retryWrites=true&w=majority&appName=Cluster0
```

### **JWT_SECRET (✅ PRONTO):**
```
64765ef5ff4699959819ad735c5b2ee62629b48aa38887ee965c273bf90935d7
```

### **SESSION_SECRET (✅ PRONTO):**
```
02246cda2afb9ef2fc9329663fb5534c32b08f72422adb95260018b58d7f36de
```

### **WHATSAPP_VERIFY_TOKEN (✅ PRONTO):**
```
d92257f908aa9ecfdedd94ff9d66ecd6
```

---

## 🚀 APÓS CONFIGURAR

Depois de configurar os secrets obrigatórios:
1. Faça commit e push
2. O deploy vai iniciar automaticamente
3. Acompanhe em: `https://github.com/seu-usuario/seu-repo/actions`

---

**Última atualização:** $(date)

