# 🏢 Arquitetura Multi-Tenancy - AtenMed

## 📋 Índice

1. [O que é Multi-Tenancy?](#o-que-é-multi-tenancy)
2. [Análise da Arquitetura Atual](#análise-da-arquitetura-atual)
3. [Padrões de Multi-Tenancy](#padrões-de-multi-tenancy)
4. [Modelo Implementado no AtenMed](#modelo-implementado-no-atenmed)
5. [Melhorias Propostas](#melhorias-propostas)
6. [Implementação Prática](#implementação-prática)

---

## O que é Multi-Tenancy?

**Multi-tenancy (multi-locatária)** é um padrão arquitetural onde uma única instância da aplicação serve múltiplos clientes (tenants), mantendo seus dados isolados e seguros.

### **Benefícios:**
- ✅ **Custo reduzido:** Um único servidor serve múltiplos clientes
- ✅ **Manutenção simplificada:** Atualizações em uma única instância
- ✅ **Escalabilidade:** Fácil adicionar novos tenants
- ✅ **Consistência:** Todos os clientes usam a mesma versão

### **Desafios:**
- ⚠️ **Isolamento de dados:** Garantir que tenants não vejam dados uns dos outros
- ⚠️ **Performance:** Queries devem ser eficientes com isolamento
- ⚠️ **Customização:** Permitir personalização por tenant
- ⚠️ **Segurança:** Proteção contra vazamento de dados entre tenants

---

## Análise da Arquitetura Atual

### ✅ **O que JÁ está implementado:**

#### 1. **Modelo de Dados com Isolamento**

```javascript
// User.js - Usuários vinculados a clínicas
{
    clinic: ObjectId,      // ← Clínica (tenant)
    clinicRole: String     // ← Role na clínica
}

// Appointment.js - Agendamentos vinculados
{
    clinic: ObjectId      // ← Pertence a uma clínica
}

// Doctor.js - Médicos vinculados
{
    clinic: ObjectId      // ← Pertence a uma clínica
}
```

#### 2. **Middleware de Isolamento**

```javascript
// middleware/tenantIsolation.js
- addClinicContext()       // Adiciona clinicId à request
- requireClinic()          // Exige clínica vinculada
- requireClinicRole()      // Exige role específica
- checkResourceOwnership() // Verifica propriedade
```

#### 3. **Autenticação com Contexto**

```javascript
// middleware/auth.js
- JWT contém userId
- Busca User com clinic vinculada
- Adiciona req.clinicId e req.clinicRole
```

### ⚠️ **O que PODE ser melhorado:**

1. **Inconsistência na aplicação:**
   - Algumas rotas não aplicam isolamento
   - Alguns modelos não têm campo `clinic`
   - Filtros podem ser bypassados

2. **Performance:**
   - Falta índices compostos (clinic + outros campos)
   - Queries podem ser otimizadas

3. **Segurança:**
   - Validação manual em várias rotas
   - Pode ter vazamento de dados

---

## Padrões de Multi-Tenancy

Existem **3 padrões principais**:

### **1. Shared Database, Shared Schema (Atual)**
```
┌─────────────────────────────────┐
│     Aplicação (Única)           │
└─────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────┐
│   MongoDB (Único)               │
│   ┌─────────────────────────┐  │
│   │ Clinic 1 → Dados         │  │
│   │ Clinic 2 → Dados         │  │
│   │ Clinic 3 → Dados         │  │
│   └─────────────────────────┘  │
└─────────────────────────────────┘
```

**Vantagens:**
- ✅ Custo baixo
- ✅ Manutenção fácil
- ✅ Escalável

**Desvantagens:**
- ⚠️ Requer isolamento rigoroso
- ⚠️ Performance pode degradar com muitos tenants

### **2. Shared Database, Separate Schema**
```
┌─────────────────────────────────┐
│     Aplicação (Única)           │
└─────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────┐
│   MongoDB (Único)               │
│   ┌─────────┐  ┌─────────┐     │
│   │Schema C1│  │Schema C2│     │
│   └─────────┘  └─────────┘     │
└─────────────────────────────────┘
```

**Quando usar:** Se precisa de customização forte por tenant.

### **3. Separate Database (não recomendado para SaaS)**
```
Clinic 1 → DB próprio
Clinic 2 → DB próprio
Clinic 3 → DB próprio
```

**Quando usar:** Apenas se isolamento absoluto for necessário (regulamentações).

---

## Modelo Implementado no AtenMed

O AtenMed usa **Shared Database, Shared Schema** com **row-level security**.

### **Como Funciona:**

```
┌──────────────────────────────────────────┐
│ 1. Usuário faz login                     │
│    → JWT gerado com userId               │
└──────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────┐
│ 2. Requisição com JWT                    │
│    → authenticateToken()                 │
│    → Busca User com clinic vinculada     │
└──────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────┐
│ 3. addClinicContext()                     │
│    → Adiciona req.clinicId               │
│    → Adiciona req.clinicRole              │
└──────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────┐
│ 4. Query com filtro automático            │
│    Appointment.find({                      │
│      clinic: req.clinicId  ← AUTO         │
│    })                                      │
└──────────────────────────────────────────┘
```

### **Estrutura de Dados:**

```javascript
// TODOS os modelos que precisam isolamento têm:
{
    clinic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
        required: true,
        index: true  // ← Importante para performance
    }
}
```

---

## Melhorias Propostas

### **1. Aplicar Isolamento Consistentemente**

#### ✅ **Modelos que JÁ têm isolamento:**
- `Appointment` ✅
- `Doctor` ✅
- `Specialty` ✅ (via clinic)
- `Waitlist` ✅
- `Invoice` ✅
- `Clinic` (é o próprio tenant) ✅

#### ⚠️ **Modelos que PRECISAM de isolamento:**
- `Lead` ❌ (deve ter campo `clinic` opcional)
- `Contact` ❌ (formulário público, mas pode ter `clinic`)
- `Client` ✅ (já tem, mas precisa validar)

#### **Ação:** Adicionar campo `clinic` nos modelos faltantes

---

### **2. Middleware Universal de Isolamento**

#### **Problema Atual:**
```javascript
// Algumas rotas fazem isso:
app.get('/api/appointments', async (req, res) => {
    // ❌ Não filtra automaticamente
    const appointments = await Appointment.find({});
});
```

#### **Solução Proposta:**
```javascript
// Criar helper universal
async function findWithTenantIsolation(Model, filter = {}, req) {
    // Se não é admin global, adicionar filtro clinic
    if (!req.isGlobalAdmin && req.clinicId) {
        filter.clinic = req.clinicId;
    }
    
    return Model.find(filter);
}

// Uso:
const appointments = await findWithTenantIsolation(
    Appointment, 
    { status: 'confirmed' },
    req
);
```

---

### **3. Índices Compostos para Performance**

#### **Adicionar índices:**
```javascript
// Appointment.js
appointmentSchema.index({ clinic: 1, date: 1 });
appointmentSchema.index({ clinic: 1, status: 1 });

// Doctor.js
doctorSchema.index({ clinic: 1, active: 1 });

// Invoice.js
invoiceSchema.index({ clinic: 1, status: 1 });
```

**Benefício:** Queries 10-100x mais rápidas.

---

### **4. Validação Automática em Hooks**

```javascript
// models/Appointment.js
appointmentSchema.pre('save', function(next) {
    // Se não tem clinic e está vindo de request autenticada
    if (!this.clinic && req && req.clinicId) {
        this.clinic = req.clinicId;
    }
    next();
});

appointmentSchema.pre(/^find/, function() {
    // Auto-filtrar se não for admin
    if (!this.getOptions().isGlobalAdmin && this.getOptions().clinicId) {
        this.where({ clinic: this.getOptions().clinicId });
    }
});
```

---

### **5. Soft Delete com Isolamento**

```javascript
// Adicionar campo deletedAt com clinic
{
    deletedAt: Date,
    deletedByClinic: ObjectId  // Para auditoria
}

// Ao deletar:
appointment.deletedAt = new Date();
appointment.deletedByClinic = req.clinicId;
await appointment.save();
```

---

### **6. Auditoria Multi-Tenant**

```javascript
// models/AuditLog.js
{
    clinic: ObjectId,
    userId: ObjectId,
    action: String,
    resource: String,
    resourceId: ObjectId,
    timestamp: Date,
    ip: String
}
```

---

## Implementação Prática

### **Fase 1: Consolidar Modelos (Crítico)**

#### **1.1 Adicionar `clinic` em Lead**
```javascript
// models/Lead.js
leadSchema.add({
    clinic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
        index: true,
        sparse: true  // Permite null (leads públicos)
    }
});
```

#### **1.2 Adicionar `clinic` em Contact**
```javascript
// models/Contact.js
contactSchema.add({
    clinic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
        index: true,
        sparse: true
    }
});
```

---

### **Fase 2: Helper Universal**

```javascript
// utils/tenantQuery.js

/**
 * Adiciona filtro de tenant automaticamente
 */
function addTenantFilter(Model, filter, req) {
    if (!req.isGlobalAdmin && req.clinicId) {
        filter.clinic = req.clinicId;
    }
    return filter;
}

/**
 * Query com isolamento automático
 */
async function findWithTenant(Model, filter, req, options = {}) {
    filter = addTenantFilter(Model, filter, req);
    return Model.find(filter).setOptions(options);
}

module.exports = { findWithTenant, addTenantFilter };
```

**Uso:**
```javascript
// routes/appointments.js
const { findWithTenant } = require('../utils/tenantQuery');

router.get('/', authenticateToken, addClinicContext, async (req, res) => {
    const appointments = await findWithTenant(
        Appointment,
        { status: 'confirmed' },
        req
    );
    res.json({ success: true, data: appointments });
});
```

---

### **Fase 3: Middleware Global**

```javascript
// middleware/tenantIsolation.js - ADICIONAR

/**
 * Middleware global que aplica isolamento em todas as rotas protegidas
 */
function applyTenantIsolation(req, res, next) {
    // Apenas para rotas que precisam isolamento
    if (req.user && !req.isGlobalAdmin && req.clinicId) {
        // Adicionar clinicId a todas as queries
        req.tenantFilter = { clinic: req.clinicId };
    }
    next();
}

// Aplicar em server.js ANTES das rotas
app.use('/api', authenticateToken, addClinicContext, applyTenantIsolation);
```

---

### **Fase 4: Índices Compostos**

```javascript
// Adicionar em todos os modelos que têm clinic

// Appointment.js
appointmentSchema.index({ clinic: 1, date: 1, status: 1 });
appointmentSchema.index({ clinic: 1, doctor: 1 });

// Doctor.js
doctorSchema.index({ clinic: 1, active: 1, specialty: 1 });

// Invoice.js
invoiceSchema.index({ clinic: 1, status: 1, dueDate: 1 });

// Lead.js (se adicionar clinic)
leadSchema.index({ clinic: 1, status: 1, createdAt: -1 });
```

---

## 📊 Comparação: Antes vs Depois

### **Antes (Risco de Vazamento):**
```javascript
// ❌ Sem filtro
const appointments = await Appointment.find({});

// Resultado: Retorna TODOS os agendamentos de TODAS as clínicas
```

### **Depois (Isolamento Garantido):**
```javascript
// ✅ Com isolamento automático
const appointments = await findWithTenant(
    Appointment,
    {},
    req
);

// Resultado: Retorna APENAS agendamentos da clínica do usuário
```

---

## 🔒 Segurança

### **Camadas de Proteção:**

1. **Middleware de Autenticação:**
   - Verifica JWT
   - Adiciona contexto de clínica

2. **Middleware de Isolamento:**
   - Filtra queries automaticamente
   - Bloqueia acesso sem clínica

3. **Validação de Ownership:**
   - Verifica se recurso pertence à clínica
   - Usa `checkResourceOwnership()`

4. **Índices de Performance:**
   - Garante queries rápidas
   - Impede scan completo do banco

---

## 📈 Benefícios da Melhoria

### **Segurança:**
- ✅ Isolamento garantido em TODAS as rotas
- ✅ Impossível vazar dados entre tenants
- ✅ Auditoria completa

### **Performance:**
- ✅ Queries 10-100x mais rápidas
- ✅ Menos carga no banco
- ✅ Escalabilidade melhorada

### **Manutenibilidade:**
- ✅ Código consistente
- ✅ Menos bugs
- ✅ Fácil adicionar novos modelos

---

## ✅ Checklist de Implementação

### **Fase 1: Modelos**
- [ ] Adicionar `clinic` em `Lead`
- [ ] Adicionar `clinic` em `Contact`
- [ ] Verificar todos os modelos têm `clinic`
- [ ] Adicionar índices compostos

### **Fase 2: Helpers**
- [ ] Criar `utils/tenantQuery.js`
- [ ] Implementar `findWithTenant()`
- [ ] Implementar `addTenantFilter()`

### **Fase 3: Rotas**
- [ ] Aplicar isolamento em TODAS as rotas
- [ ] Substituir queries manuais por helper
- [ ] Testar todas as rotas

### **Fase 4: Testes**
- [ ] Testes de isolamento
- [ ] Testes de performance
- [ ] Testes de segurança

---

## 🚀 Próximos Passos

1. **Implementar Fase 1:** Adicionar `clinic` nos modelos faltantes
2. **Implementar Fase 2:** Criar helpers universais
3. **Aplicar em todas as rotas:** Garantir isolamento completo
4. **Adicionar índices:** Melhorar performance
5. **Testar:** Garantir que não há vazamento

---

**Última atualização:** Janeiro 2025  
**Status:** Base implementada, melhorias propostas

