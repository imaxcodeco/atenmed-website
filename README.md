# 🏥 AtenMed - Sistema de Gestão para Consultórios

Sistema completo de gestão e automação para consultórios médicos, desenvolvido com Node.js, Express e MongoDB.

## 🚀 Funcionalidades

### 📱 Frontend
- **Landing Page Responsiva** - Design moderno e profissional
- **Formulários Inteligentes** - Captura de leads e contatos
- **Dashboard Administrativo** - Interface completa de gestão
- **Sistema de Autenticação** - Login seguro com sessões

### 🔧 Backend
- **API RESTful** - Endpoints para leads, contatos e serviços
- **Autenticação JWT** - Sistema de segurança robusto
- **Integração com MongoDB** - Persistência de dados
- **Sistema de Email** - Notificações automáticas
- **Logs Estruturados** - Monitoramento completo

### 🎯 Serviços Oferecidos
- **Automação WhatsApp** - Chatbots inteligentes
- **Agendamento Online** - Sistema de marcação
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
- **Health Check**: https://atenmed.com.br/health

### Desenvolvimento Local
- **Site Principal**: http://localhost:3000/
- **WhatsApp Admin**: http://localhost:3000/whatsapp
- **Cost Monitoring**: http://localhost:3000/cost-monitoring
- **Admin Dashboard**: http://localhost:3000/dashboard

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

- [ ] Integração com WhatsApp Business API
- [ ] Sistema de pagamentos
- [ ] App mobile nativo
- [ ] Integração com Google Calendar
- [ ] Relatórios avançados
- [ ] Sistema de notificações push

---

**Desenvolvido com ❤️ pela equipe AtenMed**