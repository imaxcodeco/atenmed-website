# 🛠️ Plano de Correção - AtenMed

**Baseado em:** RELATORIO-AUDITORIA.md  
**Data:** 29 de Outubro de 2025  
**Prioridade:** URGENTE

---

## 🎯 Objetivo

Corrigir todos os problemas críticos identificados na auditoria e implementar melhorias de segurança e qualidade.

---

## 📋 Checklist de Correções

### 🔴 CRÍTICO (Fazer Hoje)

- [ ] **#1** - Remover rota `/health` duplicada em `server.js`
- [ ] **#2** - Renomear `env.example` para `.env.example`
- [ ] **#3** - Decidir e consolidar rotas WhatsApp (V1 ou V2)
- [ ] **#4** - Corrigir validação de signature WhatsApp
- [ ] **#5** - Remover exposição de tokens em logs
- [ ] **#6** - Adicionar autenticação em rotas sensíveis
- [ ] **#7** - Adicionar validação de JWT_SECRET
- [ ] **#8** - Melhorar skip de rate limiter

### 🟡 IMPORTANTE (Esta Semana)

- [ ] **#9** - Substituir console.log por logger
- [ ] **#10** - Resolver TODOs críticos
- [ ] **#11** - Padronizar nomenclatura
- [ ] **#12** - Consolidar scripts de deploy
- [ ] **#13** - Melhorar exemplos de credenciais
- [ ] **#14** - Melhorar tratamento de erro MongoDB
- [ ] **#20** - Melhorar segurança de CORS
- [ ] **#21** - Adicionar validação de env vars
- [ ] **#23** - Adicionar indices no MongoDB

### 🔵 MELHORIAS (Próximo Sprint)

- [ ] **#16** - Adicionar testes automatizados
- [ ] **#17** - Melhorar estrutura de logs
- [ ] **#18** - Documentar API com Swagger
- [ ] **#19** - Implementar health checks robustos
- [ ] **#22** - Implementar retry logic MongoDB
- [ ] **#24** - Melhorar tratamento de erros assíncronos
- [ ] **#25** - Padronizar respostas de erro

---

## 🔧 Correções Detalhadas

### Correção #1: Remover Rota /health Duplicada

**Arquivo:** `server.js`

**Ação:** Remover a segunda definição (linhas 208-216)

```diff
// Manter apenas esta (linhas 197-205):
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
    });
});

-// Remover esta (linhas 208-216):
-app.get('/health', (req, res) => {
-    res.status(200).json({
-        status: 'OK',
-        timestamp: new Date().toISOString(),
-        uptime: process.uptime(),
-        environment: process.env.NODE_ENV,
-        version: '1.0.0'
-    });
-});
```

---

### Correção #2: Renomear env.example

**Comando:**
```bash
mv env.example .env.example
```

**Atualizar README.md:**
```diff
3. **Configure as variáveis de ambiente**
```bash
-cp env.example .env
+cp .env.example .env
# Edite o arquivo .env com suas configurações
```
```

---

### Correção #3: Consolidar Rotas WhatsApp

**Decisão:** Manter apenas `whatsappV2.js`

**Arquivos para REMOVER:**
```bash
rm routes/whatsapp.js
rm services/whatsappService.js
```

**Atualizar referências:**

Em qualquer arquivo que importe:
```diff
-const whatsappService = require('../services/whatsappService');
+const whatsappService = require('../services/whatsappServiceV2');
```

---

### Correção #4: Validação de Signature WhatsApp

**Arquivo:** `services/whatsappServiceV2.js` (linha 169)

```diff
function verifyWebhookSignature(rawBody, signature) {
    if (!WHATSAPP_APP_SECRET) {
        logger.warn('⚠️ WHATSAPP_APP_SECRET não configurado - pulando verificação de signature');
-       return true; // Em produção, deve retornar false
+       if (process.env.NODE_ENV === 'production') {
+           logger.error('❌ WHATSAPP_APP_SECRET obrigatório em produção');
+           return false;
+       }
+       return true; // Apenas em desenvolvimento
    }

    try {
        const expectedSignature = crypto
            .createHmac('sha256', WHATSAPP_APP_SECRET)
            .update(rawBody)
            .digest('hex');

        const signatureHash = signature.replace('sha256=', '');
        
        return crypto.timingSafeEqual(
            Buffer.from(signatureHash, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    } catch (error) {
        logger.error('Erro ao verificar signature do webhook:', error);
        return false;
    }
}
```

---

### Correção #5: Remover Exposição de Tokens

**Arquivo:** `routes/whatsapp.js` (REMOVER) ou atualizar antes de remover

Se precisar manter logs, use:

```diff
- logger.info(`   Token recebido: ${token}`);
- logger.info(`   Token esperado: ${process.env.WHATSAPP_VERIFY_TOKEN}`);
+ logger.info(`   Token recebido: ${token ? '***' + token.slice(-4) : 'null'}`);
+ logger.info(`   Token match: ${token === process.env.WHATSAPP_VERIFY_TOKEN}`);
```

---

### Correção #6: Adicionar Autenticação em Rotas

**Arquivo:** `routes/whatsapp.js` (linha 108) - SE NÃO FOR REMOVER

```diff
-router.post('/send', async (req, res) => {
+router.post('/send', authenticateToken, authorize('admin'), async (req, res) => {
```

**Arquivo:** `routes/whatsapp.js` (linha 143)

```diff
-router.get('/stats', async (req, res) => {
+router.get('/stats', authenticateToken, authorize('admin'), async (req, res) => {
```

---

### Correção #7: Validar JWT_SECRET em Produção

**Arquivo:** `server.js` (adicionar no início, após require('dotenv').config())

```javascript
// Validar variáveis de ambiente críticas
if (process.env.NODE_ENV === 'production') {
    const requiredEnvVars = [
        'MONGODB_URI',
        'JWT_SECRET',
        'WHATSAPP_TOKEN',
        'WHATSAPP_VERIFY_TOKEN',
        'WHATSAPP_APP_SECRET'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error('❌ Variáveis de ambiente obrigatórias não configuradas:');
        missingVars.forEach(varName => {
            console.error(`   - ${varName}`);
        });
        process.exit(1);
    }
}
```

---

### Correção #8: Melhorar Skip de Rate Limiter

**Arquivo:** `server.js` (linha 152)

```diff
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        error: 'Muitas requisições deste IP, tente novamente em 15 minutos.',
        retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false,
-   skip: (req) => req.path.startsWith('/api/whatsapp/webhook') || req.originalUrl.startsWith('/api/whatsapp/webhook')
+   skip: (req) => {
+       // Lista exata de endpoints que devem pular rate limit
+       const skipPaths = [
+           '/api/whatsapp/webhook'
+       ];
+       return skipPaths.includes(req.path);
+   }
});
```

---

### Correção #9: Substituir console.log

**Script para encontrar:**
```bash
grep -r "console\.log" --include="*.js" --exclude-dir=node_modules . > console-log-files.txt
```

**Substituir manualmente em cada arquivo:**

```diff
- console.log('Mensagem');
+ logger.info('Mensagem');

- console.error('Erro');
+ logger.error('Erro');

- console.warn('Aviso');
+ logger.warn('Aviso');
```

**Exceções permitidas:**
- Arquivos de teste (test-*.js)
- Scripts de setup (scripts/*.js) - pode manter console.log
- Arquivos de frontend (site/*.js, applications/**/*.js) - browser não tem logger

---

### Correção #10: Resolver TODOs Críticos

**1. middleware/subscriptionStatus.js linha 117**

```javascript
// Implementar contagem real
const appointmentCount = await Appointment.countDocuments({
    clinic: req.clinicId,
    status: { $in: ['scheduled', 'confirmed'] },
    createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    }
});

if (appointmentCount >= user.subscriptionPlan.limits.appointments) {
    return res.status(403).json({
        error: 'Limite de agendamentos atingido',
        limit: user.subscriptionPlan.limits.appointments,
        current: appointmentCount
    });
}
```

**2. middleware/subscriptionStatus.js linha 177**

```javascript
// Enviar notificação
const emailService = require('../services/emailService');
await emailService.sendSubscriptionExpiringEmail(user.email, user.subscriptionPlan.endDate);
```

---

### Correção #11: Padronizar Nomenclatura

**Criar um guia de estilo:**

```markdown
# Guia de Estilo - AtenMed

## Nomenclatura

- **Campos de Banco de Dados:** Inglês (camelCase)
  - ✅ `firstName`, `lastName`, `email`
  - ❌ `nome`, `sobrenome`, `senha`

- **Funções:** Inglês (camelCase)
  - ✅ `getUserById`, `createAppointment`
  - ❌ `buscarUsuario`, `criarAgendamento`

- **Variáveis:** Inglês (camelCase)
  - ✅ `userData`, `isActive`
  - ❌ `dadosUsuario`, `estaAtivo`
```

**Migração gradual:**
1. Novos campos sempre em inglês
2. Manter compatibilidade com campos antigos (aliases)
3. Depreciar campos antigos gradualmente

---

### Correção #12: Consolidar Scripts de Deploy

**Estrutura recomendada:**

```
scripts/
├── deploy/
│   ├── deploy.js           # Script principal
│   ├── aws.js              # Deploy específico AWS
│   ├── windows.js          # Deploy específico Windows
│   └── utils.js            # Funções compartilhadas
└── archived/               # Scripts antigos
    ├── deploy-old-1.sh
    └── ...
```

**Mover arquivos antigos:**
```bash
mkdir scripts/archived
mv deploy*.sh scripts/archived/
mv deploy*.ps1 scripts/archived/
```

---

### Correção #20: Melhorar CORS

**Arquivo:** `server.js` (linha 112)

```diff
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
            'https://atenmed.com.br',
            'https://www.atenmed.com.br',
            'http://localhost:3000',
            'http://localhost:8000'
        ];
        
-       // Permitir requests sem origin (webhooks, curl, Postman, server-to-server)
        if (!origin) {
-           return callback(null, true);
+           // Permitir apenas em desenvolvimento
+           if (process.env.NODE_ENV !== 'production') {
+               return callback(null, true);
+           }
+           // Em produção, verificar se é um webhook conhecido
+           const userAgent = req.get('user-agent') || '';
+           const isKnownWebhook = userAgent.includes('Meta') || userAgent.includes('WhatsApp');
+           if (isKnownWebhook) {
+               return callback(null, true);
+           }
+           return callback(new Error('Origin não permitido'));
        }
        
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200
};
```

---

### Correção #21: Validação de Variáveis de Ambiente

**Criar:** `config/validate-env.js`

```javascript
const logger = require('../utils/logger');

const requiredEnvVars = {
    production: [
        'NODE_ENV',
        'PORT',
        'MONGODB_URI',
        'JWT_SECRET',
        'WHATSAPP_TOKEN',
        'WHATSAPP_VERIFY_TOKEN',
        'WHATSAPP_APP_SECRET',
        'EMAIL_HOST',
        'EMAIL_USER',
        'EMAIL_PASS'
    ],
    development: [
        'NODE_ENV',
        'PORT',
        'JWT_SECRET'
    ]
};

function validateEnv() {
    const env = process.env.NODE_ENV || 'development';
    const required = requiredEnvVars[env] || requiredEnvVars.development;
    
    const missing = required.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
        logger.error(`❌ Variáveis de ambiente obrigatórias não configuradas (${env}):`);
        missing.forEach(varName => {
            logger.error(`   - ${varName}`);
        });
        
        if (env === 'production') {
            process.exit(1);
        } else {
            logger.warn('⚠️ Continuando em modo desenvolvimento...');
        }
    } else {
        logger.info(`✅ Todas as variáveis de ambiente configuradas (${env})`);
    }
}

module.exports = validateEnv;
```

**Usar em `server.js`:**

```javascript
require('dotenv').config();
const validateEnv = require('./config/validate-env');

// Validar variáveis de ambiente
validateEnv();
```

---

### Correção #23: Adicionar Índices no MongoDB

**Arquivo:** `models/Appointment.js`

```javascript
// Adicionar após a definição do schema, antes do module.exports

// Índices para otimização de queries
appointmentSchema.index({ clinic: 1, scheduledDate: 1 });
appointmentSchema.index({ doctor: 1, scheduledDate: 1 });
appointmentSchema.index({ 'patient.phone': 1 });
appointmentSchema.index({ status: 1, scheduledDate: 1 });
appointmentSchema.index({ source: 1 });
```

**Arquivo:** `models/User.js`

```javascript
// Já tem alguns índices, adicionar:
userSchema.index({ clinic: 1, role: 1 });
userSchema.index({ email: 1, ativo: 1 });
```

**Arquivo:** `models/Clinic.js`

```javascript
// Adicionar:
clinicSchema.index({ slug: 1 });
clinicSchema.index({ 'contact.whatsapp': 1 });
clinicSchema.index({ active: 1 });
```

---

## 🚀 Ordem de Execução

### Fase 1: Crítico (Hoje - 2 horas)
1. Correção #1 (5 min)
2. Correção #2 (2 min)
3. Correção #4 (10 min)
4. Correção #5 (5 min)
5. Correção #6 (10 min)
6. Correção #7 (15 min)
7. Correção #8 (10 min)
8. Testar e commitar

### Fase 2: Importante (Esta Semana - 1 dia)
1. Correção #3 (1 hora - decisão + testes)
2. Correção #9 (2 horas - buscar e substituir)
3. Correção #20 (30 min)
4. Correção #21 (1 hora)
5. Correção #23 (30 min)
6. Testar e commitar

### Fase 3: Melhorias (Próximo Sprint)
1. Correções #16-#19 (1 semana)
2. Correções #22, #24, #25 (3 dias)

---

## 🧪 Testes Após Correções

### Testar Manualmente

```bash
# 1. Health check
curl http://localhost:3000/health

# 2. WhatsApp webhook verification
curl "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=SEU_TOKEN&hub.challenge=CHALLENGE_STRING"

# 3. Rate limiting
for i in {1..101}; do curl http://localhost:3000/api/services; done

# 4. Autenticação
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{"to":"123", "message":"test"}'
# Deve retornar 401 Unauthorized
```

### Verificar Logs

```bash
tail -f logs/combined.log
# Não deve aparecer tokens completos
# Deve aparecer apenas últimos 4 caracteres mascarados
```

---

## 📊 Checklist Final

Antes de fazer deploy:

- [ ] Todas as correções críticas aplicadas
- [ ] Testes manuais passaram
- [ ] Logs verificados (sem tokens expostos)
- [ ] Variáveis de ambiente validadas
- [ ] README.md atualizado
- [ ] CHANGELOG.md atualizado
- [ ] Code review feito
- [ ] Backup do banco de dados
- [ ] Deploy em staging testado
- [ ] Monitoramento configurado

---

## 📝 Comandos Úteis

### Backup antes de mudanças
```bash
git checkout -b fix/security-improvements
git add -A
git commit -m "Backup antes das correções"
```

### Verificar mudanças
```bash
git diff
git status
```

### Reverter se necessário
```bash
git reset --hard HEAD
```

---

## 🆘 Suporte

Se encontrar problemas durante as correções:

1. **Verificar logs:** `tail -f logs/combined.log`
2. **Verificar status:** `pm2 status` (se usando PM2)
3. **Restart:** `pm2 restart atenmed` ou `npm run dev`
4. **Rollback:** `git reset --hard <commit-anterior>`

---

**Próximo passo:** Começar pela Fase 1 (Correções Críticas)

**Responsável:** [ATRIBUIR]  
**Prazo:** [DEFINIR]  
**Reviewer:** [DEFINIR]

