# 📁 Estrutura do Projeto AtenMed

## 🏗️ Organização Atual

O projeto foi reorganizado para separar claramente o site principal das aplicações específicas:

```
AtenMed/
├── site/                           # Site principal (marketing/institucional)
│   ├── assets/                     # Assets do site (CSS, JS, imagens)
│   │   ├── css/
│   │   ├── images/
│   │   └── js/
│   ├── index.html                  # Página inicial
│   ├── login.html                  # Página de login
│   ├── servicos.html               # Página de serviços
│   ├── sobre.html                  # Página sobre
│   ├── robots.txt                  # SEO
│   └── sitemap.xml                 # SEO
│
├── applications/                   # Aplicações específicas
│   ├── whatsapp-automation/        # Sistema de automação WhatsApp
│   │   ├── whatsapp-admin.html     # Interface administrativa
│   │   ├── WHATSAPP-AUTOMATION.md  # Documentação
│   │   └── WHATSAPP-BUSINESS-API-SETUP.md
│   │
│   ├── cost-monitoring/            # Monitoramento de custos
│   │   └── cost-monitoring.html    # Interface de monitoramento
│   │
│   └── admin-dashboard/            # Dashboard administrativo
│       ├── dashboard.html          # Dashboard principal
│       └── test-form.html          # Formulários de teste
│
├── backend/                        # Backend (mantido na raiz)
├── config/                         # Configurações
├── models/                         # Modelos de dados
├── routes/                         # Rotas da API
├── services/                       # Serviços
├── scripts/                        # Scripts de inicialização
├── middleware/                     # Middleware
├── utils/                          # Utilitários
├── logs/                           # Logs do sistema
├── server.js                       # Servidor principal
├── package.json                    # Dependências
└── README.md                       # Documentação principal
```

## 🌐 URLs de Acesso

### Site Principal
- **Homepage**: `http://localhost:3000/`
- **Login**: `http://localhost:3000/login.html`
- **Serviços**: `http://localhost:3000/servicos.html`
- **Sobre**: `http://localhost:3000/sobre.html`

### Aplicações
- **WhatsApp Admin**: `http://localhost:3000/whatsapp`
- **Cost Monitoring**: `http://localhost:3000/cost-monitoring`
- **Admin Dashboard**: `http://localhost:3000/dashboard`

### Assets
- **Site Assets**: `http://localhost:3000/assets/` (aponta para `site/assets/`)
- **App Assets**: `http://localhost:3000/apps/{app-name}/` (para assets específicos de cada app)

## 🔧 Configuração do Servidor

O servidor (`server.js`) foi configurado para:

1. **Servir o site principal** em `/`
2. **Servir aplicações específicas** em rotas dedicadas
3. **Manter compatibilidade** com assets existentes
4. **API endpoints** permanecem em `/api/`

### Rotas Estáticas Configuradas:
```javascript
// Site principal
app.use('/site', express.static('site'));

// Aplicações
app.use('/apps/whatsapp', express.static('applications/whatsapp-automation'));
app.use('/apps/cost-monitoring', express.static('applications/cost-monitoring'));
app.use('/apps/admin', express.static('applications/admin-dashboard'));

// Assets (compatibilidade)
app.use('/assets', express.static('site/assets'));
```

## 📝 Vantagens da Nova Estrutura

### ✅ Separação Clara
- Site institucional separado das aplicações
- Cada aplicação tem sua própria pasta
- Facilita manutenção e desenvolvimento

### ✅ Escalabilidade
- Fácil adicionar novas aplicações
- Cada app pode ter seus próprios assets
- Estrutura modular e organizada

### ✅ Deploy Independente
- Possibilidade de deploy separado do site
- Aplicações podem ser desenvolvidas independentemente
- Facilita CI/CD

### ✅ Organização
- Código mais limpo e organizado
- Fácil localização de arquivos
- Estrutura profissional

## 🚀 Como Adicionar Nova Aplicação

1. **Criar pasta**: `applications/nova-app/`
2. **Adicionar arquivos** da aplicação
3. **Configurar rota** no `server.js`:
   ```javascript
   app.use('/apps/nova-app', express.static('applications/nova-app'));
   ```
4. **Adicionar rota específica** (opcional):
   ```javascript
   app.get('/nova-app', (req, res) => {
       res.sendFile(path.join(__dirname, 'applications/nova-app/index.html'));
   });
   ```

## 📋 Próximos Passos

- [ ] Testar todas as funcionalidades após reorganização
- [ ] Atualizar documentação de deploy
- [ ] Configurar CI/CD para nova estrutura
- [ ] Otimizar carregamento de assets
- [ ] Implementar lazy loading para aplicações

---

**Estrutura reorganizada em**: 19/10/2025
**Versão**: 2.0.0
