# 📚 ÍNDICE DA DOCUMENTAÇÃO - AtenMed SaaS

Guia rápido para navegar pela documentação do projeto.

---

## 🚀 COMEÇAR AQUI

### **Para Quem Acabou de Fazer Deploy:**
1. ✅ **[RESUMO-DEPLOY-FINAL.md](RESUMO-DEPLOY-FINAL.md)** - Resumo do deploy realizado
2. ✅ **[PRONTO-PARA-LANCAR.md](PRONTO-PARA-LANCAR.md)** - Confirmação de que está pronto
3. ✅ **[COMANDOS-RAPIDOS-DEPLOY.md](COMANDOS-RAPIDOS-DEPLOY.md)** - Comandos úteis

### **Para Fazer Deploy pela Primeira Vez:**
1. **[CHECKLIST-PRE-DEPLOY.md](CHECKLIST-PRE-DEPLOY.md)** - Checklist antes de fazer deploy
2. **[DEPLOY-RAPIDO-WINDOWS.md](DEPLOY-RAPIDO-WINDOWS.md)** - Deploy local (Windows)
3. **[GUIA-DEPLOY.md](GUIA-DEPLOY.md)** - Deploy completo (Linux/Docker/AWS)

### **Para Entender o Sistema:**
1. **[SISTEMA-SAAS-COMPLETO.md](SISTEMA-SAAS-COMPLETO.md)** - Documentação completa do SaaS
2. **[QUICK-START-SAAS.md](QUICK-START-SAAS.md)** - Início rápido
3. **[README.md](README.md)** - Visão geral do projeto

---

## 📋 DOCUMENTAÇÃO POR CATEGORIA

### **🚀 Deploy e Infraestrutura**

| Documento | Descrição | Quando Usar |
|-----------|-----------|-------------|
| [GUIA-DEPLOY.md](GUIA-DEPLOY.md) | Guia completo com 4 opções de deploy | Deploy em produção (Linux) |
| [DEPLOY-RAPIDO-WINDOWS.md](DEPLOY-RAPIDO-WINDOWS.md) | Deploy simplificado para Windows | Deploy local ou desenvolvimento |
| [CHECKLIST-PRE-DEPLOY.md](CHECKLIST-PRE-DEPLOY.md) | Checklist de 10 categorias | Antes de qualquer deploy |
| [DEPLOY-COMPLETO.md](DEPLOY-COMPLETO.md) | Resumo do deploy anterior | Referência histórica |
| [RESUMO-DEPLOY-FINAL.md](RESUMO-DEPLOY-FINAL.md) | Resumo do último deploy | Conferir status atual |
| [COMANDOS-RAPIDOS-DEPLOY.md](COMANDOS-RAPIDOS-DEPLOY.md) | Referência de comandos | No dia a dia |
| [deploy-windows-simple.ps1](deploy-windows-simple.ps1) | Script de deploy Windows | Automatizar deploy local |
| [deploy-producao.sh](deploy-producao.sh) | Script de deploy Linux | Automatizar deploy produção |
| [env.production.example](env.production.example) | Exemplo de .env para produção | Configurar variáveis |

### **📊 Sistema SaaS**

| Documento | Descrição | Quando Usar |
|-----------|-----------|-------------|
| [SISTEMA-SAAS-COMPLETO.md](SISTEMA-SAAS-COMPLETO.md) | Documentação completa do SaaS | Entender todo o sistema |
| [QUICK-START-SAAS.md](QUICK-START-SAAS.md) | Início rápido | Primeiros passos |
| [PRONTO-PARA-LANCAR.md](PRONTO-PARA-LANCAR.md) | Checklist de lançamento | Antes de ir ao ar |
| [COMO-FUNCIONA-MULTI-CLINICA.md](COMO-FUNCIONA-MULTI-CLINICA.md) | Sistema multi-tenant | Entender isolamento |
| [RESUMO-IMPLEMENTACAO-SAAS.md](RESUMO-IMPLEMENTACAO-SAAS.md) | Resumo do que foi feito | Visão geral das features |

### **👥 Onboarding e CRM**

| Documento | Descrição | Quando Usar |
|-----------|-----------|-------------|
| [docs/ONBOARDING-MANUAL.md](docs/ONBOARDING-MANUAL.md) | Processo de 10 etapas | Ativar novo cliente |
| [GUIA-MULTI-CLINICA-DASHBOARD.md](GUIA-MULTI-CLINICA-DASHBOARD.md) | Dashboard multi-clínica | Gerenciar múltiplas clínicas |

### **🔧 Configurações e Integrações**

| Documento | Descrição | Quando Usar |
|-----------|-----------|-------------|
| [docs/WHATSAPP-V2-SETUP.md](docs/WHATSAPP-V2-SETUP.md) | Configurar WhatsApp Business | Integrar WhatsApp |
| [docs/GOOGLE-CALENDAR-SETUP.md](docs/GOOGLE-CALENDAR-SETUP.md) | Configurar Google Calendar | Integrar Calendar |
| [CONFIGURACAO-META-WHATSAPP.md](CONFIGURACAO-META-WHATSAPP.md) | Configurar Meta API | Detalhes Meta |
| [CONFIGURACAO-WEBHOOK-WHATSAPP.md](CONFIGURACAO-WEBHOOK-WHATSAPP.md) | Webhook do WhatsApp | Configurar webhook |
| [CONFIGURAR-GEMINI.md](CONFIGURAR-GEMINI.md) | IA conversacional | Habilitar IA |

### **🔍 Troubleshooting**

| Documento | Descrição | Quando Usar |
|-----------|-----------|-------------|
| [docs/WHATSAPP-TROUBLESHOOTING.md](docs/WHATSAPP-TROUBLESHOOTING.md) | Problemas com WhatsApp | WhatsApp não funciona |
| [SOLUCAO-FORBIDDEN-WEBHOOK.md](SOLUCAO-FORBIDDEN-WEBHOOK.md) | Erro 403 no webhook | Webhook recusado |
| [SOLUCAO-WEBHOOK-WHATSAPP.md](SOLUCAO-WEBHOOK-WHATSAPP.md) | Problemas gerais webhook | Webhook não recebe |

### **📖 Referência Técnica**

| Documento | Descrição | Quando Usar |
|-----------|-----------|-------------|
| [README.md](README.md) | Visão geral do projeto | Entender o projeto |
| [ESTRUTURA-PROJETO.md](ESTRUTURA-PROJETO.md) | Estrutura de pastas | Navegar no código |
| [FRAMEWORKS-IMPLEMENTADOS.md](FRAMEWORKS-IMPLEMENTADOS.md) | Tecnologias usadas | Entender stack |
| [FUNCIONALIDADES-COMPLETAS.md](FUNCIONALIDADES-COMPLETAS.md) | Lista de features | Ver o que tem |

---

## 🎯 FLUXOS COMUNS

### **1️⃣ Fazer Deploy pela Primeira Vez (Windows)**

```
1. Ler: CHECKLIST-PRE-DEPLOY.md
2. Seguir: DEPLOY-RAPIDO-WINDOWS.md
3. Executar: deploy-windows-simple.ps1
4. Conferir: RESUMO-DEPLOY-FINAL.md
5. Usar: COMANDOS-RAPIDOS-DEPLOY.md
```

### **2️⃣ Fazer Deploy em Produção (Linux)**

```
1. Ler: CHECKLIST-PRE-DEPLOY.md
2. Configurar: env.production.example → .env
3. Seguir: GUIA-DEPLOY.md
4. Executar: deploy-producao.sh
5. Testar: todas as URLs
```

### **3️⃣ Ativar Novo Cliente**

```
1. Ler: docs/ONBOARDING-MANUAL.md
2. Executar: node scripts/ativar-cliente.js
3. Preencher dados da clínica
4. Enviar credenciais ao cliente
5. Cliente acessa: /portal
```

### **4️⃣ Configurar WhatsApp**

```
1. Ler: docs/WHATSAPP-V2-SETUP.md
2. Criar app no Meta for Developers
3. Obter Phone ID e Token
4. Configurar no .env
5. Testar envio
6. Se problemas: docs/WHATSAPP-TROUBLESHOOTING.md
```

### **5️⃣ Configurar Google Calendar**

```
1. Ler: docs/GOOGLE-CALENDAR-SETUP.md
2. Criar projeto no Google Cloud
3. Habilitar Calendar API
4. Criar credenciais OAuth
5. Configurar no .env
6. Testar autenticação
```

### **6️⃣ Resolver Problemas**

```
Aplicação não inicia:
→ pm2 logs atenmed
→ COMANDOS-RAPIDOS-DEPLOY.md (seção Emergência)

WhatsApp não funciona:
→ docs/WHATSAPP-TROUBLESHOOTING.md

Webhook retorna 403:
→ SOLUCAO-FORBIDDEN-WEBHOOK.md

Outros problemas:
→ COMANDOS-RAPIDOS-DEPLOY.md (seção Suporte Rápido)
```

---

## 📁 ESTRUTURA DE PASTAS

```
/
├── applications/          # Aplicações frontend
│   ├── crm-pipeline/     # CRM Kanban
│   ├── clinic-portal/    # Portal do cliente
│   └── ...
├── docs/                  # Documentação técnica
│   ├── ONBOARDING-MANUAL.md
│   ├── WHATSAPP-V2-SETUP.md
│   └── GOOGLE-CALENDAR-SETUP.md
├── models/               # Modelos MongoDB
│   ├── User.js
│   ├── Clinic.js
│   ├── Lead.js
│   └── Invoice.js
├── routes/               # Rotas da API
│   ├── leads.js
│   ├── invoices.js
│   └── ...
├── scripts/              # Scripts utilitários
│   ├── ativar-cliente.js
│   ├── gerar-faturas-mensais.js
│   └── verificar-inadimplencia.js
├── middleware/           # Middlewares
│   ├── auth.js
│   ├── subscriptionStatus.js
│   └── tenantIsolation.js
├── site/                 # Site público
│   └── planos.html
└── server.js            # Servidor principal
```

---

## 🔗 LINKS RÁPIDOS

### **URLs do Sistema (Local):**
- Landing: http://localhost:3000
- Planos: http://localhost:3000/planos
- CRM: http://localhost:3000/crm
- Portal: http://localhost:3000/portal
- Health: http://localhost:3000/health

### **Comandos Mais Usados:**
```powershell
pm2 status                    # Ver status
pm2 logs atenmed              # Ver logs
pm2 restart atenmed           # Reiniciar
node scripts/create-admin.js  # Criar admin
node scripts/ativar-cliente.js # Onboarding
```

### **Scripts de Deploy:**
```powershell
# Windows
.\deploy-windows-simple.ps1

# Linux
./deploy-producao.sh
```

---

## 📞 SUPORTE

### **Dúvidas Gerais:**
1. Procure no índice acima
2. Use Ctrl+F para buscar palavra-chave
3. Consulte COMANDOS-RAPIDOS-DEPLOY.md

### **Problemas Técnicos:**
1. Ver logs: `pm2 logs atenmed`
2. Consultar: COMANDOS-RAPIDOS-DEPLOY.md (seção Emergência)
3. Verificar: docs/WHATSAPP-TROUBLESHOOTING.md (se WhatsApp)

### **Dúvidas sobre Deploy:**
1. CHECKLIST-PRE-DEPLOY.md
2. GUIA-DEPLOY.md (opções completas)
3. DEPLOY-RAPIDO-WINDOWS.md (local)

---

## ✅ STATUS ATUAL DO PROJETO

### **✅ 100% Completo para Lançamento:**
- [x] Landing Page de Captação
- [x] CRM / Pipeline de Vendas
- [x] Onboarding Manual
- [x] Portal do Cliente
- [x] Sistema de Faturas
- [x] Controle de Inadimplência
- [x] Multi-tenancy
- [x] Limites por Plano
- [x] Deploy Automatizado
- [x] Documentação Completa

### **⏳ Opcional (Não Bloqueia Lançamento):**
- [ ] Emails de Relacionamento
- [ ] FAQ Detalhado
- [ ] Guias em Vídeo
- [ ] Material de Vendas

---

## 🎉 CONCLUSÃO

**O sistema está 100% pronto para lançar!**

Consulte este índice sempre que precisar encontrar alguma documentação.

---

**Última atualização:** 28/10/2025  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para Produção

