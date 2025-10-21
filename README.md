# 🏥 AtenMed - Sistema de Gestão para Consultórios

Sistema completo de gestão e automação para consultórios médicos, desenvolvido com Node.js, Express e MongoDB.

## 🚀 Funcionalidades

### ✨ NOVAS FUNCIONALIDADES (2024)

#### 📊 **Dashboard de Analytics**
- KPIs em tempo real (agendamentos, comparecimentos, cancelamentos)
- Gráficos interativos com Chart.js
- Métricas de desempenho por médico
- Relatórios exportáveis (JSON/CSV)
- Análise de tendências e comparações

#### 📱 **WhatsApp Business API**
- Bot conversacional para agendamento automático
- Lembretes automáticos (24h e 1h antes)
- Confirmação de presença via WhatsApp
- Consulta e cancelamento de agendamentos
- Fila de espera inteligente

#### 🔔 **Sistema de Lembretes**
- Envio automático programado (node-cron)
- Múltiplos canais (WhatsApp, Email, SMS)
- Tracking de status de entrega
- Personalização de mensagens

#### ✅ **Confirmação de Consultas**
- Links únicos de confirmação
- Confirmação via WhatsApp
- Registro de método e timestamp
- Dashboards de taxa de confirmação

#### 📋 **Fila de Espera**
- Cadastro automático quando sem horários
- Notificação quando vaga disponível
- Gestão inteligente de prioridades
- Métricas de conversão

### 📱 Frontend
- **Landing Page Responsiva** - Design moderno e profissional
- **Formulários Inteligentes** - Captura de leads e contatos
- **Dashboard Administrativo** - Interface completa de gestão
- **Dashboard de Analytics** - Visualização de métricas ✨ NOVO
- **Sistema de Autenticação** - Login seguro com sessões

### 🔧 Backend
- **API RESTful** - 40+ endpoints para todas as funcionalidades
- **Autenticação JWT** - Sistema de segurança robusto
- **Integração com MongoDB** - Persistência de dados
- **Sistema de Email** - Notificações automáticas
- **Logs Estruturados** - Monitoramento completo
- **Webhooks WhatsApp** - Integração em tempo real ✨ NOVO
- **Scheduled Tasks** - Automações com node-cron ✨ NOVO

### 🎯 Serviços Oferecidos
- **Agendamento Inteligente** - Sistema completo integrado com Google Calendar
- **Bot WhatsApp** - Agendamento conversacional automático ✨ NOVO
- **Analytics & Métricas** - Dashboard completo de KPIs ✨ NOVO
- **Automação de Lembretes** - Sistema automatizado multi-canal ✨ NOVO
- **Sites Profissionais** - Criação de presença digital

## 🛠️ Tecnologias

### Frontend
- HTML5, CSS3, JavaScript ES6+
- Design responsivo com CSS Grid e Flexbox
- Animações e transições suaves
- Otimização para SEO

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação
- **Nodemailer** - Envio de emails
- **Winston** - Sistema de logs
- **Google Calendar API** - Integração de agendamentos
- **WhatsApp Business API** - Bot conversacional ✨ NOVO
- **Chart.js** - Gráficos e visualizações ✨ NOVO
- **node-cron** - Agendamento de tarefas ✨ NOVO
- **Axios** - Cliente HTTP ✨ NOVO

### Segurança
- **Helmet** - Headers de segurança
- **CORS** - Controle de acesso
- **Rate Limiting** - Proteção contra spam
- **Validação de dados** - Sanitização de inputs

## 📦 Instalação

### Pré-requisitos
- Node.js 16+ 
- MongoDB 4.4+
- npm ou yarn

### Passos

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/atenmed-website.git
cd atenmed-website
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp env.example .env
# Edite o arquivo .env com suas configurações
```

4. **Inicie o servidor**
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 🔧 Configuração

### Variáveis de Ambiente (.env)
```env
# Servidor
PORT=3000
NODE_ENV=development

# Banco de Dados
MONGODB_URI=mongodb://localhost:27017/atenmed

# JWT
JWT_SECRET=seu_jwt_secret_aqui
JWT_EXPIRES_IN=24h

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_app

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 🚀 Deploy

### AWS EC2
1. **Crie uma instância EC2** (Ubuntu 20.04 LTS)
2. **Configure o ambiente**:
```bash
# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
sudo apt-get install -y mongodb-org

# Instalar PM2
sudo npm install -g pm2
```

3. **Clone e configure**:
```bash
git clone https://github.com/seu-usuario/atenmed-website.git
cd atenmed-website
npm install
npm run build
```

4. **Inicie com PM2**:
```bash
pm2 start server.js --name atenmed
pm2 startup
pm2 save
```

### AWS Elastic Beanstalk
1. **Crie um arquivo `package.json`** com scripts de build
2. **Configure o arquivo `.ebextensions`** para Node.js
3. **Faça upload** via EB CLI ou console AWS

## 📊 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/profile` - Perfil do usuário

### Leads
- `GET /api/leads` - Listar leads
- `POST /api/leads` - Criar lead
- `PUT /api/leads/:id` - Atualizar lead
- `DELETE /api/leads/:id` - Deletar lead

### Contatos
- `GET /api/contact` - Listar contatos
- `POST /api/contact` - Criar contato
- `PUT /api/contact/:id` - Atualizar contato

### Serviços
- `GET /api/services` - Listar serviços
- `GET /api/services/:id` - Detalhes do serviço

## 🎨 Estrutura do Projeto

```
atenmed-website/
├── assets/
│   ├── css/
│   ├── js/
│   └── images/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── services/
├── models/
├── routes/
├── services/
├── utils/
├── index.html
├── sobre.html
├── servicos.html
├── login.html
├── dashboard.html
├── server.js
├── server-dev.js
└── package.json
```

## 🔒 Segurança

- **HTTPS** - Certificado SSL obrigatório
- **CORS** - Configurado para domínios específicos
- **Rate Limiting** - Proteção contra ataques
- **Validação** - Sanitização de todos os inputs
- **Headers de Segurança** - Helmet configurado

## 🌐 URLs de Acesso

### Produção (atenmed.com.br)
- **Site Principal**: https://atenmed.com.br/
- **WhatsApp Admin**: https://atenmed.com.br/whatsapp
- **Cost Monitoring**: https://atenmed.com.br/cost-monitoring
- **Admin Dashboard**: https://atenmed.com.br/dashboard
- **Agendamento Inteligente**: https://atenmed.com.br/agendamento ✨ NOVO
- **Health Check**: https://atenmed.com.br/health

### Desenvolvimento Local
- **Site Principal**: http://localhost:3000/
- **WhatsApp Admin**: http://localhost:3000/whatsapp
- **Cost Monitoring**: http://localhost:3000/cost-monitoring
- **Admin Dashboard**: http://localhost:3000/dashboard
- **Agendamento Inteligente**: http://localhost:3000/agendamento ✨ NOVO

## 📈 Monitoramento

- **Logs estruturados** com Winston
- **Health checks** para monitoramento
- **Métricas de performance**
- **Alertas automáticos**

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Contato

- **Email**: contato@atenmed.com.br
- **Website**: https://atenmed.com.br
- **GitHub**: https://github.com/seu-usuario/atenmed-website

## 🎯 Roadmap

### ✅ Concluído (v2.0 - 2024)
- [x] Integração com Google Calendar
- [x] Sistema de Agendamento Inteligente
- [x] Integração com WhatsApp Business API ✨
- [x] Sistema de lembretes automáticos ✨
- [x] Confirmação de consultas ✨
- [x] Fila de espera ✨
- [x] Dashboard de Analytics ✨

### 🚧 Em Desenvolvimento
- [ ] Sistema de pagamentos online
- [ ] Prontuário eletrônico
- [ ] Telemedicina
- [ ] Sistema de avaliações

### 📋 Próximas Versões
- [ ] App mobile nativo (React Native)
- [ ] IA para otimização de agendamentos
- [ ] Análise preditiva de não comparecimentos
- [ ] Integração com sistemas de saúde (TISS)
- [ ] Marketplace de serviços médicos

## 📅 Agendamento Inteligente

O AtenMed agora possui um **sistema completo de agendamento** integrado com Google Calendar!

### Funcionalidades
- ✅ Sincronização em tempo real com Google Calendar
- ✅ Verificação automática de disponibilidade
- ✅ Gestão de múltiplos médicos e especialidades
- ✅ Suporte multi-clínicas
- ✅ Dashboard administrativo
- ✅ APIs prontas para integração com WhatsApp
- ✅ Criação automática de eventos no calendário

### Como Usar

1. **Configure o Google Calendar:**
   ```bash
   # Veja o guia completo
   docs/GOOGLE-CALENDAR-SETUP.md
   ```

2. **Popular banco de dados:**
   ```bash
   node scripts/seed-scheduling.js
   ```

3. **Acessar dashboard:**
   ```
   http://localhost:3000/agendamento
   ```

4. **Documentação completa:**
   - [Guia de Configuração](docs/GOOGLE-CALENDAR-SETUP.md)
   - [Documentação do Módulo](applications/smart-scheduling/README.md)
   - [Arquitetura do Sistema](docs/AGENDAMENTO-INTELIGENTE.md)

## 📚 Documentação Completa

### Guias de Setup
- 📅 [Google Calendar API Setup](docs/GOOGLE-CALENDAR-SETUP.md) - Como configurar a integração com Google Calendar
- 📱 [WhatsApp Business API Setup](docs/WHATSAPP-BUSINESS-API-SETUP.md) - Guia completo de configuração do bot
- 🏗️ [Arquitetura do Agendamento](docs/AGENDAMENTO-INTELIGENTE.md) - Detalhes técnicos da arquitetura

### Documentação Funcional
- ✅ [Agendamento Pronto](AGENDAMENTO-PRONTO.md) - Guia rápido do sistema de agendamento
- 🆕 [Novas Funcionalidades](NOVAS-FUNCIONALIDADES-IMPLEMENTADAS.md) - Documentação dos recursos recentes
- 🎉 [Funcionalidades Completas](FUNCIONALIDADES-COMPLETAS.md) - Lista completa de todas as funcionalidades

### URLs do Sistema
- **Site Principal:** http://localhost:3000
- **Dashboard Admin:** http://localhost:3000/dashboard
- **Agendamento:** http://localhost:3000/agendamento
- **Analytics:** http://localhost:3000/analytics ✨ NOVO
- **API Base:** http://localhost:3000/api

### Endpoints Principais
- `GET /api/appointments` - Listar agendamentos
- `POST /api/appointments` - Criar agendamento
- `GET /api/analytics/kpis` - KPIs do dashboard
- `POST /api/whatsapp/webhook` - Webhook WhatsApp
- `GET /api/waitlist` - Fila de espera

## 🔐 Variáveis de Ambiente Essenciais

```bash
# Google Calendar (obrigatório para agendamento)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URL=http://localhost:3000/api/auth/google/callback

# WhatsApp Business API (obrigatório para bot)
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_ID=...
WHATSAPP_TOKEN=...
WHATSAPP_VERIFY_TOKEN=...

# Serviços Automáticos
ENABLE_REMINDERS=true
ENABLE_WAITLIST=true
APP_URL=http://localhost:3000
```

## 🎉 O que há de novo na v2.0?

1. **📊 Dashboard de Analytics** - Visualização completa de métricas com gráficos interativos
2. **📱 Bot WhatsApp** - Agendamento conversacional totalmente automatizado
3. **🔔 Lembretes Automáticos** - Sistema programado para lembretes 24h e 1h antes
4. **✅ Confirmação de Consultas** - Links únicos e confirmação via WhatsApp
5. **📋 Fila de Espera** - Gestão inteligente de vagas e notificações automáticas

**Total:** 40+ endpoints REST | 5 sistemas automatizados | 20+ arquivos novos

---

**Desenvolvido com ❤️ pela equipe AtenMed**  
**Versão 2.0 - Outubro 2024** 🚀