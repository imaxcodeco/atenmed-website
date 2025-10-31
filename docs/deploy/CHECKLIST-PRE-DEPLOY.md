# ✅ CHECKLIST PRÉ-DEPLOY - AtenMed SaaS

Use este checklist antes de fazer o deploy para garantir que tudo está configurado corretamente.

---

## 📋 1. AMBIENTE E INFRAESTRUTURA

### **Servidor:**
- [ ] Servidor Linux/Windows preparado (2GB+ RAM)
- [ ] Node.js 16+ instalado
- [ ] MongoDB instalado e rodando
- [ ] PM2 instalado (`npm install -g pm2`)
- [ ] Nginx instalado (para produção Linux)
- [ ] Firewall configurado (portas 22, 80, 443)
- [ ] Espaço em disco suficiente (20GB+)

### **Domínio e DNS:**
- [ ] Domínio registrado
- [ ] DNS apontando para o servidor
- [ ] SSL/HTTPS configurado (Certbot/Let's Encrypt)
- [ ] Subdomínios configurados (se necessário)

---

## 🔧 2. CONFIGURAÇÃO DO PROJETO

### **Código:**
- [ ] Último código do repositório baixado
- [ ] Branch correta (main/master)
- [ ] Sem código de teste/debug comentado
- [ ] `.gitignore` configurado (não commitar `.env`)

### **Variáveis de Ambiente (.env):**

#### **Obrigatórias:**
- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`
- [ ] `MONGODB_URI` (URL de produção)
- [ ] `JWT_SECRET` (senha forte, 32+ caracteres)
- [ ] `APP_URL` (URL do domínio, ex: https://atenmed.com.br)
- [ ] `CORS_ORIGIN` (domínios permitidos)

#### **Email (AWS SES):**
- [ ] `EMAIL_HOST`
- [ ] `EMAIL_PORT=587`
- [ ] `EMAIL_USER` (SMTP user)
- [ ] `EMAIL_PASS` (SMTP password)
- [ ] `EMAIL_FROM` (remetente padrão)

#### **WhatsApp Business API:**
- [ ] `WHATSAPP_API_URL=https://graph.facebook.com/v18.0`
- [ ] `WHATSAPP_PHONE_ID` (Phone Number ID da Meta)
- [ ] `WHATSAPP_TOKEN` (Token permanente)
- [ ] `WHATSAPP_VERIFY_TOKEN` (token único para webhook)
- [ ] `WHATSAPP_APP_SECRET` (App Secret da Meta)

#### **Google Calendar:**
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `GOOGLE_REDIRECT_URL` (callback URL)

#### **Segurança:**
- [ ] `BCRYPT_ROUNDS=12`
- [ ] `SESSION_SECRET` (senha forte)

#### **Opcional (Recomendado):**
- [ ] `REDIS_HOST` (para cache)
- [ ] `REDIS_PORT=6379`
- [ ] `SENTRY_DSN` (monitoramento de erros)

### **Dependências:**
- [ ] `package.json` atualizado
- [ ] `package-lock.json` commitado
- [ ] Todas as dependências instaladas: `npm install --production`

### **Build:**
- [ ] CSS compilado: `npm run build:css`
- [ ] Assets otimizados
- [ ] Sem erros de linter

---

## 🗄️ 3. BANCO DE DADOS

### **MongoDB:**
- [ ] MongoDB rodando
- [ ] Database criada
- [ ] Índices criados: `node scripts/init-db.js`
- [ ] Backup configurado
- [ ] Usuário admin criado: `node scripts/create-admin.js`

### **Seeds (Opcional):**
- [ ] Clínicas de teste criadas (se necessário)
- [ ] Especialidades populadas
- [ ] Dados iniciais carregados

---

## 🔐 4. INTEGRAÇÕES E APIs

### **WhatsApp Business API:**
- [ ] App criado no Meta for Developers
- [ ] Phone Number configurado
- [ ] Token permanente gerado
- [ ] Webhook configurado: `https://seu-dominio.com/api/whatsapp/webhook`
- [ ] Webhook verificado (código 200)
- [ ] Mensagem de teste enviada

### **Google Calendar:**
- [ ] Projeto criado no Google Cloud Console
- [ ] Calendar API habilitada
- [ ] Credenciais OAuth 2.0 criadas
- [ ] Redirect URI configurado
- [ ] Teste de autenticação realizado

### **Email (AWS SES):**
- [ ] Conta AWS criada
- [ ] SES configurado
- [ ] Remetente verificado
- [ ] Sandbox removido (modo produção)
- [ ] Email de teste enviado

---

## 🔒 5. SEGURANÇA

### **Senhas e Tokens:**
- [ ] JWT_SECRET forte (32+ caracteres aleatórios)
- [ ] Senhas fortes para admin
- [ ] Tokens rotacionados
- [ ] `.env` NUNCA commitado no Git

### **Servidor:**
- [ ] SSH configurado (chaves, não senha)
- [ ] Root login desabilitado
- [ ] Fail2ban instalado (proteção brute force)
- [ ] Firewall ativo (UFW no Linux)
- [ ] Portas desnecessárias fechadas

### **Aplicação:**
- [ ] HTTPS/SSL ativo
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo
- [ ] Headers de segurança configurados
- [ ] Validação de entrada em todas as rotas

---

## 🚀 6. DEPLOY

### **Preparação:**
- [ ] Backup do código anterior
- [ ] Backup do banco de dados
- [ ] Diretórios criados (logs, uploads, backups)

### **Deploy:**
- [ ] Código no servidor
- [ ] Dependências instaladas
- [ ] Build executado
- [ ] PM2 configurado: `pm2 start ecosystem.config.js --env production`
- [ ] PM2 salvo: `pm2 save`
- [ ] PM2 startup configurado: `pm2 startup`

### **Nginx (Linux):**
- [ ] Virtual host configurado
- [ ] Proxy reverso para porta 3000
- [ ] SSL configurado
- [ ] Redirecionamento HTTP → HTTPS
- [ ] Nginx testado: `sudo nginx -t`
- [ ] Nginx reiniciado: `sudo systemctl restart nginx`

---

## 🔍 7. TESTES PÓS-DEPLOY

### **URLs:**
- [ ] https://seu-dominio.com → Landing page carrega
- [ ] https://seu-dominio.com/planos → Página de planos
- [ ] https://seu-dominio.com/crm → CRM (com login)
- [ ] https://seu-dominio.com/portal → Portal do cliente (com login)
- [ ] https://seu-dominio.com/api/health → Retorna status OK

### **Funcionalidades:**
- [ ] Criar conta de lead em `/planos`
- [ ] Lead aparece em `/crm`
- [ ] Login funciona
- [ ] Criar clínica via script: `node scripts/ativar-cliente.js`
- [ ] Acessar portal do cliente
- [ ] Ver estatísticas no portal
- [ ] Enviar mensagem WhatsApp de teste
- [ ] Receber webhook do WhatsApp
- [ ] Agendar consulta
- [ ] Receber notificação por email

### **Performance:**
- [ ] Tempo de resposta < 2s
- [ ] Memória estável (sem leaks)
- [ ] CPU < 70% em idle
- [ ] Logs sem erros críticos

---

## 📊 8. MONITORAMENTO

### **Logs:**
- [ ] PM2 logs configurados: `pm2 logs`
- [ ] Logs da aplicação: `logs/combined.log`
- [ ] Logs do Nginx (se Linux): `/var/log/nginx/`
- [ ] Rotação de logs configurada

### **Alertas:**
- [ ] Sentry configurado (monitoramento de erros)
- [ ] Alertas de downtime
- [ ] Alertas de uso de disco/memória
- [ ] Email de notificação configurado

### **Cron Jobs:**
- [ ] Faturamento mensal: `0 0 1 * * node scripts/gerar-faturas-mensais.js`
- [ ] Verificação de inadimplência: `0 8 * * * node scripts/verificar-inadimplencia.js`
- [ ] Backup diário do MongoDB
- [ ] Renovação SSL automática (Certbot)

---

## 📚 9. DOCUMENTAÇÃO

### **Usuário:**
- [ ] Guia de uso básico
- [ ] FAQ para clientes
- [ ] Vídeos tutoriais (opcional)

### **Técnica:**
- [ ] README.md atualizado
- [ ] Documentação de API (Swagger)
- [ ] Guia de troubleshooting
- [ ] Contatos de suporte

---

## 🎯 10. LANÇAMENTO

### **Pré-Lançamento:**
- [ ] Teste completo de ponta a ponta
- [ ] Simular jornada do usuário
- [ ] Testar em diferentes navegadores
- [ ] Testar em mobile
- [ ] Teste de carga (opcional)

### **Lançamento:**
- [ ] Anúncio do lançamento
- [ ] Marketing/divulgação ativo
- [ ] Suporte disponível
- [ ] Monitoramento ativo (primeiras 24h)

### **Pós-Lançamento:**
- [ ] Coletar feedback dos primeiros usuários
- [ ] Monitorar logs e erros
- [ ] Ajustar conforme necessário
- [ ] Planejar próximas features

---

## ✅ COMANDOS FINAIS

Antes de marcar como "pronto":

```bash
# 1. Verificar se tudo está rodando
pm2 status

# 2. Ver logs em tempo real
pm2 logs atenmed --lines 50

# 3. Testar health check
curl https://seu-dominio.com/api/health

# 4. Monitorar recursos
pm2 monit

# 5. Verificar firewall
sudo ufw status  # Linux
```

---

## 🆘 EM CASO DE PROBLEMA

**Aplicação não inicia:**
```bash
pm2 logs atenmed  # Ver erro
node server.js    # Rodar direto para ver erro
```

**502 Bad Gateway:**
```bash
pm2 restart atenmed
sudo systemctl restart nginx
```

**Banco não conecta:**
```bash
sudo systemctl status mongod
sudo systemctl restart mongod
```

---

## 🎉 TUDO CERTO?

Se todos os itens estão marcados, você está pronto para o deploy!

**Execute:**
- **Windows:** `.\deploy-windows.ps1`
- **Linux:** `./deploy-producao.sh`

Boa sorte com o lançamento! 🚀

