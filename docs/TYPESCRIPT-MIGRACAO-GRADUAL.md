# 🔷 Guia de Migração Gradual para TypeScript

## 📋 Estratégia de Migração

Migração **gradual** sem quebrar o código existente. JavaScript e TypeScript podem coexistir!

---

## ✅ Passo 1: Configuração Inicial

### **1.1 Instalar TypeScript**
```bash
npm install --save-dev typescript @types/node @types/express @types/mongoose @types/jsonwebtoken ts-node nodemon
```

### **1.2 Configurar tsconfig.json** ✅ (já criado)

### **1.3 Configurar nodemon para TypeScript**
```json
// nodemon.json
{
  "watch": ["**/*.ts", "**/*.js"],
  "ext": "ts,js",
  "exec": "ts-node server.ts || node server.js"
}
```

---

## 📝 Passo 2: Migrar por Camadas

### **Ordem Recomendada:**

1. **utils/** (mais simples, sem dependências)
2. **models/** (tipos bem definidos)
3. **middleware/** (lógica isolada)
4. **services/** (lógica de negócio)
5. **routes/** (último, depende de tudo)

---

## 🔧 Exemplos Práticos

### **Exemplo 1: Migrar Utils**

**Antes (JS):**
```javascript
// utils/validators.js
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}
```

**Depois (TS):**
```typescript
// utils/validators.ts
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}
```

---

### **Exemplo 2: Migrar Models**

**Antes (JS):**
```javascript
// models/Appointment.js
const appointmentSchema = new mongoose.Schema({
  patient: {
    name: { type: String, required: true }
  }
});
```

**Depois (TS):**
```typescript
// models/Appointment.ts
import mongoose from 'mongoose';

interface IAppointment extends mongoose.Document {
  patient: {
    name: string;
    email?: string;
    phone: string;
  };
  clinic: mongoose.Types.ObjectId;
  status: 'pendente' | 'confirmado' | 'cancelado';
}

const appointmentSchema = new mongoose.Schema<IAppointment>({
  patient: {
    name: { type: String, required: true }
  },
  // ...
});

export default mongoose.model<IAppointment>('Appointment', appointmentSchema);
```

---

### **Exemplo 3: Migrar Routes**

**Antes (JS):**
```javascript
// routes/appointments.js
router.get('/', async (req, res) => {
  const appointments = await Appointment.find({});
  res.json({ data: appointments });
});
```

**Depois (TS):**
```typescript
// routes/appointments.ts
import { Request, Response } from 'express';

router.get('/', async (req: Request, res: Response) => {
  const appointments = await Appointment.find({});
  res.json({ data: appointments });
});
```

---

## 🎯 Checklist de Migração

### **Fase 1: Setup**
- [x] Instalar TypeScript
- [x] Configurar tsconfig.json
- [ ] Configurar nodemon

### **Fase 2: Utils**
- [ ] Migrar utils/validators.js
- [ ] Migrar utils/logger.js
- [ ] Migrar utils/tenantQuery.js

### **Fase 3: Models**
- [ ] Migrar models/User.js
- [ ] Migrar models/Appointment.js
- [ ] Migrar models/Clinic.js

### **Fase 4: Services**
- [ ] Migrar services/emailService.js
- [ ] Migrar services/whatsappService.js

### **Fase 5: Routes**
- [ ] Migrar routes/appointments.js
- [ ] Migrar routes/auth.js

---

**Última atualização:** Janeiro 2025

