# 📅 Agendamento Inteligente - AtenMed

## 🎯 Visão Geral do Sistema

O **Agendamento Inteligente** é uma solução completa de gestão de consultas médicas que integra:

- ✅ **Google Calendar API** - Sincronização em tempo real
- ✅ **MongoDB** - Banco de dados robusto
- ✅ **WhatsApp Integration Ready** - Pronto para integrar com bot
- ✅ **API RESTful** - Endpoints completos e documentados
- ✅ **Dashboard Administrativo** - Interface web moderna

## 📊 Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    PACIENTES                                │
│         (WhatsApp, Site, Telefone, Presencial)             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  API ATENMED                                │
│  /api/appointments/availability - Verifica disponibilidade │
│  /api/appointments - Cria agendamento                       │
│  /api/appointments/:id - Gerencia agendamento              │
└──────────┬──────────────────────┬───────────────────────────┘
           │                      │
           ▼                      ▼
┌──────────────────────┐  ┌──────────────────────┐
│   GOOGLE CALENDAR    │  │      MONGODB         │
│                      │  │                      │
│ - Agenda dos médicos │  │ - Clínicas           │
│ - Verificar horários │  │ - Especialidades     │
│ - Criar eventos      │  │ - Médicos            │
│ - Notificações       │  │ - Agendamentos       │
└──────────────────────┘  └──────────────────────┘
```

## 🗂️ Estrutura de Arquivos Criados

### Modelos (MongoDB)

1. **`models/Clinic.js`** - Modelo de Clínicas
   - Nome, endereço, contato
   - Horário de funcionamento
   - Configurações de agendamento

2. **`models/Specialty.js`** - Modelo de Especialidades
   - Nome, descrição, cor, ícone
   - Clínica associada
   - Duração padrão das consultas

3. **`models/Doctor.js`** - Modelo de Médicos
   - Dados pessoais e profissionais (CRM)
   - Especialidades e clínica
   - **Google Calendar ID** (essencial!)
   - Dias e horários de trabalho
   - Configurações de disponibilidade
   - Estatísticas de agendamentos

4. **`models/Appointment.js`** - Modelo de Agendamentos
   - Dados do paciente (nome, telefone, email, CPF)
   - Médico, especialidade e clínica
   - Data, hora e duração
   - Status do agendamento
   - **Google Event ID** (sincronização)
   - Histórico de alterações
   - Sistema de confirmações e lembretes

### Serviços

5. **`services/googleCalendarService.js`** - Integração Google Calendar
   - Autenticação OAuth 2.0
   - Verificar horários disponíveis (Freebusy API)
   - Criar eventos no calendário
   - Atualizar eventos
   - Cancelar eventos
   - Listar eventos

### Rotas da API

6. **`routes/appointments.js`** - Rotas de Agendamento
   
   **Rotas Públicas (para WhatsApp/Site):**
   - `GET /api/appointments/clinics` - Listar clínicas
   - `GET /api/appointments/clinics/:id/specialties` - Especialidades
   - `GET /api/appointments/specialties/:id/doctors` - Médicos
   - `GET /api/appointments/availability` - Horários disponíveis
   - `POST /api/appointments` - Criar agendamento
   
   **Rotas Administrativas (autenticadas):**
   - `GET /api/appointments` - Listar agendamentos
   - `GET /api/appointments/:id` - Detalhes do agendamento
   - `PUT /api/appointments/:id/cancel` - Cancelar agendamento
   - `GET /api/appointments/stats/overview` - Estatísticas

### Interface Administrativa

7. **`applications/smart-scheduling/index.html`** - Dashboard Web
   - Visão geral com estatísticas
   - Lista de agendamentos com filtros
   - Gestão de médicos
   - Configuração do Google Calendar
   - Interface responsiva e moderna

8. **`applications/smart-scheduling/smart-scheduling.js`** - JavaScript
   - Comunicação com API
   - Atualização em tempo real
   - Gestão de estado
   - Validações e tratamento de erros

### Documentação

9. **`docs/GOOGLE-CALENDAR-SETUP.md`** - Guia de Configuração
   - Passo a passo completo
   - Configuração do Google Cloud Console
   - Criação de credenciais OAuth
   - Autenticação do sistema
   - Solução de problemas

10. **`applications/smart-scheduling/README.md`** - Documentação do Módulo
    - Visão geral e funcionalidades
    - Instalação e configuração
    - Exemplos de uso
    - API Reference
    - Troubleshooting

### Configuração

11. **`env.example`** - Variáveis de Ambiente
    ```env
    GOOGLE_CLIENT_ID=...
    GOOGLE_CLIENT_SECRET=...
    GOOGLE_REDIRECT_URL=...
    ```

12. **`package.json`** - Dependências
    - Adicionado `googleapis: ^159.0.0`

13. **`server.js`** - Servidor Principal
    - Rotas de autenticação Google
    - Rotas da aplicação de agendamento
    - Inicialização do Google Calendar Service

## 🔄 Fluxo de Agendamento Completo

### 1. Configuração Inicial (Uma vez)

```bash
# 1. Instalar dependências
npm install

# 2. Configurar Google Calendar API
# Seguir: docs/GOOGLE-CALENDAR-SETUP.md

# 3. Adicionar credenciais no .env
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-secret

# 4. Iniciar servidor
npm start

# 5. Autenticar com Google
# Acessar: http://localhost:3000/agendamento
# Clicar em "Autenticar com Google"

# 6. Cadastrar clínicas, especialidades e médicos no MongoDB
```

### 2. Fluxo do Paciente (via WhatsApp)

```
1. Paciente → "Quero marcar consulta"
   ↓
2. Bot → Lista de clínicas
   ↓
3. Paciente → Escolhe clínica
   ↓
4. Bot → Lista de especialidades
   API: GET /api/appointments/clinics/{id}/specialties
   ↓
5. Paciente → Escolhe especialidade
   ↓
6. Bot → Lista de médicos
   API: GET /api/appointments/specialties/{id}/doctors
   ↓
7. Paciente → Escolhe médico
   ↓
8. Bot → "Qual data prefere?"
   ↓
9. Paciente → Informa data
   ↓
10. Bot → Busca horários disponíveis
    API: GET /api/appointments/availability?doctorId=X&date=YYYY-MM-DD
    → Sistema consulta Google Calendar (Freebusy API)
    → Retorna apenas horários livres
   ↓
11. Bot → "Horários disponíveis: 9h, 10h, 14h, 15h"
   ↓
12. Paciente → Escolhe horário
   ↓
13. Bot → Cria agendamento
    API: POST /api/appointments
    → Valida disponibilidade novamente
    → Cria evento no Google Calendar
    → Salva no MongoDB
    → Retorna confirmação
   ↓
14. Bot → "✅ Consulta agendada! Dr. João Silva, 22/10/2025 às 10h"
    → Envia email de confirmação (opcional)
```

### 3. Administração (Dashboard)

```
1. Admin acessa /agendamento
   ↓
2. Visualiza estatísticas em tempo real
   - Agendamentos hoje
   - Confirmados / Pendentes / Cancelados
   ↓
3. Pode filtrar agendamentos por:
   - Data
   - Status
   - Médico
   - Clínica
   ↓
4. Gerenciar médicos:
   - Adicionar novo médico
   - Vincular Google Calendar ID
   - Configurar horários de trabalho
   ↓
5. Cancelar agendamentos:
   - Remove do Google Calendar
   - Atualiza status no MongoDB
   - Notifica paciente (futuro)
```

## 📝 Exemplo de Dados

### Clínica

```javascript
{
    "_id": ObjectId("..."),
    "name": "Clínica Coração Saudável",
    "address": {
        "street": "Av. Paulista",
        "number": "1000",
        "city": "São Paulo",
        "state": "SP"
    },
    "workingHours": { "start": 8, "end": 18 },
    "slotDuration": 60,
    "active": true
}
```

### Especialidade

```javascript
{
    "_id": ObjectId("..."),
    "name": "Cardiologia",
    "clinic": ObjectId("..."), // Referência à clínica
    "color": "#45a7b1",
    "icon": "❤️",
    "active": true,
    "defaultDuration": 60
}
```

### Médico

```javascript
{
    "_id": ObjectId("..."),
    "name": "Dr. João Silva",
    "email": "joao@clinica.com",
    "phone": "(11) 98888-8888",
    "crm": { "number": "123456", "state": "SP" },
    "specialties": [ObjectId("...")], // Array de especialidades
    "clinic": ObjectId("..."),
    "googleCalendarId": "calendario@gmail.com", // ⚠️ IMPORTANTE
    "workingDays": [1, 2, 3, 4, 5], // Segunda a Sexta
    "workingHours": { "start": 9, "end": 18 },
    "slotDuration": 60, // 60 minutos por consulta
    "active": true,
    "acceptsNewPatients": true
}
```

### Agendamento

```javascript
{
    "_id": ObjectId("..."),
    "patient": {
        "name": "Maria Santos",
        "phone": "(11) 98765-4321",
        "email": "maria@exemplo.com"
    },
    "doctor": ObjectId("..."),
    "specialty": ObjectId("..."),
    "clinic": ObjectId("..."),
    "scheduledDate": ISODate("2025-10-22T00:00:00Z"),
    "scheduledTime": "10:00",
    "duration": 60,
    "status": "confirmado",
    "googleEventId": "abc123xyz", // ID do evento no Google
    "googleCalendarId": "calendario@gmail.com",
    "notes": "Primeira consulta",
    "source": "whatsapp",
    "createdAt": ISODate("2025-10-20T10:30:00Z")
}
```

## 🚀 Como Testar

### Teste Manual via API

```bash
# 1. Verificar disponibilidade
curl "http://localhost:3000/api/appointments/availability?doctorId=675...&date=2025-10-22"

# Resposta:
{
    "success": true,
    "data": {
        "date": "2025-10-22",
        "doctor": {
            "id": "675...",
            "name": "Dr. João Silva"
        },
        "availableSlots": ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"],
        "totalSlots": 7,
        "slotDuration": 60
    }
}

# 2. Criar agendamento
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "patient": {
      "name": "Maria Santos",
      "phone": "(11) 98765-4321",
      "email": "maria@exemplo.com"
    },
    "doctorId": "675...",
    "specialtyId": "675...",
    "scheduledDate": "2025-10-22",
    "scheduledTime": "10:00",
    "source": "whatsapp"
  }'

# Resposta:
{
    "success": true,
    "message": "Agendamento criado com sucesso",
    "data": {
        "id": "675...",
        "patient": { "name": "Maria Santos", ... },
        "scheduledDate": "2025-10-22T00:00:00.000Z",
        "scheduledTime": "10:00",
        "status": "confirmado",
        "googleEventLink": "https://calendar.google.com/calendar/event?eid=..."
    }
}
```

## 🔐 Segurança

- ✅ Autenticação OAuth 2.0 com Google
- ✅ Validação de dados com express-validator
- ✅ Rate limiting nas rotas da API
- ✅ Sanitização de inputs (XSS, MongoDB injection)
- ✅ Verificação dupla de disponibilidade (evita double booking)
- ✅ Logs estruturados com Winston
- ✅ Gestão segura de tokens OAuth

## 🎯 Próximos Passos

1. **Integração WhatsApp Business API**
   - Criar bot conversacional
   - Implementar fluxo de agendamento
   - Sistema de notificações

2. **Sistema de Lembretes**
   - Lembrete 24h antes (WhatsApp/Email)
   - Lembrete 1h antes (WhatsApp/SMS)
   - Confirmação automática

3. **Funcionalidades Avançadas**
   - Reagendamento de consultas
   - Lista de espera
   - Recorrência de consultas
   - Prontuário eletrônico integrado

4. **Analytics e Relatórios**
   - Taxa de comparecimento
   - Horários mais procurados
   - Médicos mais agendados
   - Exportação para Excel/PDF

## 📞 Suporte

Para dúvidas ou problemas:

1. Consulte a documentação em `docs/GOOGLE-CALENDAR-SETUP.md`
2. Verifique os logs em `logs/combined.log`
3. Entre em contato: contato@atenmed.com.br

---

**Sistema desenvolvido com ❤️ pela equipe AtenMed**

**Versão:** 1.0.0  
**Data:** Outubro 2025  
**Status:** ✅ Pronto para integração com WhatsApp

