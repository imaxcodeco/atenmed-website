# 🚀 README - Deploy Final AtenMed

## ✅ **O QUE FOI IMPLEMENTADO**

### **Alta Prioridade** ✅
- [x] Script para criar usuário admin
- [x] Configuração AWS SES (Email SMTP)
- [x] Seeds de dados de exemplo
- [x] Serviço completo de email

### **Média Prioridade** ✅
- [x] Documentação WhatsApp API
- [x] Documentação Google Calendar API
- [x] SEO básico (robots.txt, sitemap.xml)
- [x] Guias de configuração detalhados

### **Baixa Prioridade** ✅
- [x] Swagger/OpenAPI configurado
- [x] Testes automatizados estruturados
- [x] Documentação API completa

---

## 🎯 **PRÓXIMOS PASSOS NO SERVIDOR**

### 1. Conectar ao AWS e Atualizar Código

```bash
ssh -i "site-atenmed.pem" ubuntu@3.129.206.231
cd atenmed-website
git pull origin reorganizacao-estrutura
npm install
```

### 2. Atualizar .env com Configurações de Email

```bash
nano .env
```

Adicionar/atualizar:
```env
# AWS SES Email
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=AKIASQE66RF7DQ4UBE73
EMAIL_PASS=BIyaVqK6BlCvUOEq+kc4Z7ZjQmPz2ZKIUQsIQ/9kg0G9
EMAIL_FROM=AtenMed <contato@atenmed.com.br>
EMAIL_SECURE=false
```

### 3. Criar Usuário Administrador

```bash
node scripts/create-admin.js
```

**Credenciais criadas:**
- Email: `admin@atenmed.com.br`
- Senha: `admin123`
- Role: `admin`

### 4. Popular Banco com Dados de Exemplo

```bash
node scripts/seed-all.js
```

**Dados criados:**
- 3 Clientes (Dr. Carlos, Dra. Ana, Dr. Roberto)
- 3 Leads (Dra. Mariana, Dr. Paulo, Dra. Juliana)
- 2 Contatos (Fernando, Patricia)

### 5. Reiniciar Aplicação

```bash
pm2 restart atenmed
pm2 logs atenmed
```

### 6. Testar Email (Opcional)

```bash
# Via curl
curl https://atenmed.com.br/api/test/email \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

---

## 🌐 **ACESSOS**

### **Website**
- Site Principal: https://atenmed.com.br
- Sobre: https://atenmed.com.br/sobre.html
- Serviços: https://atenmed.com.br/servicos.html

### **Dashboard Admin**
- URL: https://atenmed.com.br/site/login.html
- Email: `admin@atenmed.com.br`
- Senha: `admin123`

### **API Documentation**
- Swagger UI: https://atenmed.com.br/api-docs
- Sitemap: https://atenmed.com.br/sitemap.xml
- Robots: https://atenmed.com.br/robots.txt

---

## 📋 **CONFIGURAÇÕES PENDENTES** (Opcionais)

### **WhatsApp Business API**
1. Seguir guia: `docs/SETUP-WHATSAPP.md`
2. Obter credenciais no Meta for Developers
3. Configurar webhook
4. Testar envio de mensagens

### **Google Calendar**
1. Seguir guia: `docs/SETUP-GOOGLE-CALENDAR.md`
2. Criar projeto no Google Cloud
3. Ativar Calendar API
4. Configurar OAuth 2.0
5. Fazer primeira autenticação

### **IA Conversacional Gemini** (GRÁTIS)
```bash
# Obter API key: https://makersuite.google.com/app/apikey
AI_PROVIDER=gemini
GEMINI_API_KEY=sua-api-key-aqui
```

---

## 🔧 **COMANDOS ÚTEIS**

### **Logs**
```bash
pm2 logs atenmed           # Ver logs em tempo real
pm2 logs atenmed --lines 100  # Últimas 100 linhas
```

### **Status**
```bash
pm2 status                 # Status de todos os processos
pm2 monit                  # Monitor interativo
```

### **Restart**
```bash
pm2 restart atenmed        # Reiniciar aplicação
pm2 reload atenmed         # Reload sem downtime
```

### **Banco de Dados**
```bash
# Criar admin novamente (se necessário)
node scripts/create-admin.js

# Repopular dados
node scripts/seed-all.js
```

---

## 📊 **FEATURES DISPONÍVEIS**

### **Email** ✅
- [x] AWS SES configurado
- [x] Templates profissionais
- [x] Email de boas-vindas
- [x] Email de contato
- [x] Email de agendamento

### **Dashboard** ✅
- [x] Login/Logout funcional
- [x] Design moderno e responsivo
- [x] Logo da AtenMed
- [x] Fundo branco limpo
- [x] Gestão de clientes, leads e contatos

### **SEO** ✅
- [x] Sitemap.xml
- [x] Robots.txt
- [x] Meta tags otimizadas
- [x] URLs amigáveis

### **API** ✅
- [x] RESTful completa
- [x] Autenticação JWT
- [x] Documentação Swagger
- [x] Testes estruturados
- [x] Rate limiting
- [x] Segurança (Helmet, CORS, XSS)

---

## ⚠️ **IMPORTANTE**

1. **Altere a senha do admin** no primeiro login
2. **Backup do .env** antes de qualquer alteração
3. **Teste os emails** após configuração
4. **Monitore os logs** após restart
5. **Configure WhatsApp e Calendar** conforme necessidade

---

## 📞 **SUPORTE**

- Email: contato@atenmed.com.br
- Docs WhatsApp: `docs/SETUP-WHATSAPP.md`
- Docs Calendar: `docs/SETUP-GOOGLE-CALENDAR.md`
- API Docs: https://atenmed.com.br/api-docs

---

**🎉 Sistema completo e pronto para produção!**

