# ✅ CHECKLIST DE DEPLOY - AtenMed v2.0

## 📋 **ANTES DO DEPLOY**

### No GitHub (Concluído ✅)
- [x] Código commitado
- [x] Push para `reorganizacao-estrutura`
- [x] Scripts de deploy criados
- [x] Documentação completa

---

## 🖥️ **NO SERVIDOR AWS**

### 1. Preparação
- [ ] Conectar no servidor SSH
- [ ] Navegar para o diretório do projeto
- [ ] Fazer backup do .env atual
- [ ] Verificar se MongoDB está instalado

### 2. Atualizar Código
- [ ] `git checkout reorganizacao-estrutura`
- [ ] `git pull origin reorganizacao-estrutura`
- [ ] Verificar se todos os arquivos foram baixados

### 3. Instalar Dependências
- [ ] `npm install`
- [ ] Verificar se não houve erros
- [ ] Confirmar instalação de:
  - [ ] `axios` (IA)
  - [ ] `node-cron` (Lembretes)
  - [ ] `uuid` (Confirmações)
  - [ ] `googleapis` (Google Calendar)

### 4. Configurar .env
- [ ] Abrir com `nano .env`
- [ ] Adicionar/verificar:
  - [ ] `AI_PROVIDER=gemini`
  - [ ] `GEMINI_API_KEY=AIzaSyCYJKuN94hPx5evfqY_Zdh2-nfDov_WJm8`
  - [ ] `ENABLE_REMINDERS=true`
  - [ ] `ENABLE_WAITLIST=true`
  - [ ] `NODE_ENV=production`
  - [ ] `APP_URL=https://atenmed.com.br`
  - [ ] `MONGODB_URI` (verificar se está correto)
  - [ ] `JWT_SECRET` (verificar se está configurado)
  - [ ] `PORT=3000` (ou a porta que você usa)
- [ ] Salvar e sair (`Ctrl+O`, `Enter`, `Ctrl+X`)

### 5. Iniciar MongoDB
- [ ] `sudo systemctl status mongod` (verificar status)
- [ ] `sudo systemctl start mongod` (se não estiver rodando)
- [ ] `sudo systemctl enable mongod` (habilitar no boot)

### 6. Reiniciar Aplicação
- [ ] `pm2 stop atenmed`
- [ ] `pm2 delete atenmed`
- [ ] `pm2 start ecosystem.config.js --env production`
- [ ] `pm2 save`

### 7. Verificar Logs
- [ ] `pm2 logs atenmed`
- [ ] Verificar se aparece:
  - [ ] ✅ Conectado ao MongoDB
  - [ ] 🤖 AI Service inicializado com GEMINI
  - [ ] 📱 WhatsApp com IA conversacional habilitada!
  - [ ] 🔔 Reminder Service habilitado
  - [ ] 📋 Waitlist Service habilitado
- [ ] Não deve ter erros críticos

---

## 🧪 **TESTES PÓS-DEPLOY**

### Endpoints Básicos
- [ ] `curl https://atenmed.com.br/api/health`
  - Deve retornar: `{"status":"ok"}`
  
- [ ] `curl https://atenmed.com.br/api/whatsapp/health`
  - Deve retornar JSON com status da IA

### Páginas Web
- [ ] https://atenmed.com.br (Site principal)
- [ ] https://atenmed.com.br/dashboard (Dashboard Admin)
- [ ] https://atenmed.com.br/agendamento (Agendamento)
- [ ] https://atenmed.com.br/analytics (Analytics)

### Verificar no Navegador
- [ ] Site carrega corretamente
- [ ] Dashboard mostra dados
- [ ] Analytics mostra gráficos
- [ ] Console do navegador sem erros críticos

---

## 🔧 **CONFIGURAÇÕES OPCIONAIS**

### Google Calendar (Se ainda não configurado)
- [ ] Acessar https://atenmed.com.br/agendamento
- [ ] Fazer login como admin
- [ ] Clicar em "Conectar Google Calendar"
- [ ] Autorizar acesso à conta Google
- [ ] Verificar conexão bem-sucedida

### WhatsApp Business API (Se ainda não configurado)
- [ ] Acessar Meta for Developers
- [ ] Configurar Webhook:
  - [ ] URL: `https://atenmed.com.br/api/whatsapp/webhook`
  - [ ] Token: (valor de `WHATSAPP_VERIFY_TOKEN` no .env)
- [ ] Inscrever eventos:
  - [ ] `messages`
  - [ ] `message_status`
- [ ] Testar envio de mensagem

---

## 📊 **MONITORAMENTO**

### Comandos Úteis
- [ ] `pm2 status` - Ver status da aplicação
- [ ] `pm2 logs atenmed` - Ver logs em tempo real
- [ ] `pm2 monit` - Monitoramento com UI
- [ ] `pm2 restart atenmed` - Reiniciar se necessário

### Verificar Recursos
- [ ] `htop` ou `top` - CPU e Memória
- [ ] `df -h` - Espaço em disco
- [ ] `free -h` - Memória RAM

---

## 🚨 **TROUBLESHOOTING**

### Se algo der errado:

#### Aplicação não inicia
- [ ] Verificar logs: `pm2 logs atenmed --err`
- [ ] Verificar MongoDB: `sudo systemctl status mongod`
- [ ] Verificar porta: `lsof -i :3000`
- [ ] Verificar .env: `cat .env | grep -v "#"`

#### MongoDB não conecta
- [ ] Iniciar: `sudo systemctl start mongod`
- [ ] Ver logs: `sudo journalctl -u mongod -f`
- [ ] Verificar `MONGODB_URI` no .env

#### Porta 3000 em uso
- [ ] Encontrar processo: `lsof -i :3000`
- [ ] Matar processo: `kill -9 PID`
- [ ] Reiniciar PM2: `pm2 restart atenmed`

#### Permissões negadas
- [ ] Corrigir dono: `sudo chown -R $USER:$USER .`
- [ ] Corrigir permissões: `chmod -R 755 .`

---

## 📞 **SUPORTE**

### Documentação
- `DEPLOY-RAPIDO.md` - Guia rápido (5 min)
- `COMANDOS-DEPLOY-AWS.md` - Passo a passo completo
- `DEPLOY-AWS.md` - Documentação técnica detalhada

### Arquivos de Ajuda
- `IA-IMPLEMENTADA.md` - Sobre IA conversacional
- `FUNCIONALIDADES-COMPLETAS.md` - Todas as features
- `docs/WHATSAPP-BUSINESS-API-SETUP.md` - Setup WhatsApp
- `docs/GOOGLE-CALENDAR-SETUP.md` - Setup Google Calendar

---

## ✅ **DEPLOY CONCLUÍDO!**

Quando todos os itens estiverem marcados:

- [x] Código atualizado
- [x] Dependências instaladas
- [x] .env configurado
- [x] MongoDB rodando
- [x] Aplicação iniciada com PM2
- [x] Logs sem erros
- [x] Endpoints respondendo
- [x] Páginas web carregando

**🎉 AtenMed v2.0 está no ar!**

---

## 📈 **PRÓXIMOS PASSOS** (Opcional)

Após o deploy bem-sucedido:

1. **Seed do banco de dados** (dados de exemplo)
   ```bash
   node scripts/seed-scheduling.js
   ```

2. **Configurar SSL/HTTPS** (se ainda não tiver)
   - Let's Encrypt com Certbot
   - Configurar Nginx/Apache

3. **Configurar backup automático**
   - MongoDB dump diário
   - Backup dos arquivos

4. **Monitoramento avançado**
   - Configurar alertas
   - Integrar com serviços de monitoring

5. **Otimizações**
   - Configurar cache
   - CDN para assets estáticos
   - Compressão gzip

---

**Tempo estimado de deploy: 10-15 minutos**

*Boa sorte! 🚀*

