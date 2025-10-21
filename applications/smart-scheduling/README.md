# 📅 Agendamento Inteligente - AtenMed

## Visão Geral

O **Agendamento Inteligente** é um módulo completo de gestão de consultas médicas integrado ao Google Calendar, desenvolvido para o ecossistema AtenMed.

### ✨ Funcionalidades Principais

- 🔄 **Sincronização em Tempo Real** com Google Calendar
- 📱 **Integração com WhatsApp** para agendamentos
- 🤖 **Verificação Automática de Disponibilidade**
- 📧 **Notificações por Email** e WhatsApp
- 👨‍⚕️ **Gestão de Múltiplos Médicos** e especialidades
- 🏥 **Suporte Multi-Clínicas**
- 📊 **Dashboard Administrativo** completo
- 🔐 **Autenticação OAuth 2.0** com Google

## 🚀 Como Funciona

### Para o Paciente (via WhatsApp)

1. Paciente envia mensagem para o WhatsApp da clínica
2. Bot apresenta lista de especialidades
3. Paciente escolhe especialidade e médico
4. Sistema busca horários disponíveis no Google Calendar
5. Paciente escolhe data e horário
6. Agendamento é criado automaticamente
7. Confirmação é enviada por WhatsApp e Email

### Para a Clínica (Dashboard)

1. Acesse `/agendamento` no navegador
2. Visualize todos os agendamentos em tempo real
3. Gerencie médicos e suas agendas
4. Configure horários de funcionamento
5. Acompanhe estatísticas e métricas

## 📦 Estrutura do Módulo

```
applications/smart-scheduling/
├── index.html                 # Interface administrativa
├── smart-scheduling.js        # JavaScript da interface
└── README.md                  # Esta documentação

models/
├── Clinic.js                  # Modelo de clínicas
├── Specialty.js               # Modelo de especialidades
├── Doctor.js                  # Modelo de médicos
└── Appointment.js             # Modelo de agendamentos

services/
└── googleCalendarService.js   # Serviço de integração Google Calendar

routes/
└── appointments.js            # Rotas da API de agendamento
```

## 🔧 Instalação e Configuração

### 1. Instalar Dependências

```bash
npm install googleapis
```

### 2. Configurar Google Calendar API

Siga o guia completo em: [`docs/GOOGLE-CALENDAR-SETUP.md`](../../docs/GOOGLE-CALENDAR-SETUP.md)

Resumo rápido:
1. Criar projeto no Google Cloud Console
2. Ativar Google Calendar API
3. Configurar OAuth consent screen
4. Criar credenciais OAuth 2.0
5. Adicionar credenciais no `.env`

### 3. Configurar Variáveis de Ambiente

```env
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret
GOOGLE_REDIRECT_URL=http://localhost:3000/api/auth/google/callback
```

### 4. Autenticar com Google

1. Inicie o servidor: `npm start`
2. Acesse: `http://localhost:3000/agendamento`
3. Vá na aba "Google Calendar"
4. Clique em "Autenticar com Google"
5. Autorize as permissões

### 5. Cadastrar Médicos

Use MongoDB para criar os médicos:

```javascript
db.doctors.insertOne({
    name: "Dr. João Silva",
    email: "joao@clinica.com",
    googleCalendarId: "calendario@gmail.com",
    specialties: [ObjectId("...")],
    clinic: ObjectId("..."),
    workingDays: [1, 2, 3, 4, 5], // Seg-Sex
    workingHours: { start: 9, end: 18 },
    slotDuration: 60,
    active: true,
    acceptsNewPatients: true
});
```

## 📡 API Endpoints

### Públicos (para WhatsApp/Site)

- `GET /api/appointments/clinics` - Listar clínicas
- `GET /api/appointments/clinics/:id/specialties` - Especialidades da clínica
- `GET /api/appointments/specialties/:id/doctors` - Médicos da especialidade
- `GET /api/appointments/availability?doctorId=X&date=YYYY-MM-DD` - Horários disponíveis
- `POST /api/appointments` - Criar agendamento

### Administrativos (requerem autenticação)

- `GET /api/appointments` - Listar agendamentos (com filtros)
- `GET /api/appointments/:id` - Detalhes do agendamento
- `PUT /api/appointments/:id/cancel` - Cancelar agendamento
- `GET /api/appointments/stats/overview` - Estatísticas

### Autenticação Google

- `GET /api/auth/google` - Iniciar autenticação
- `GET /api/auth/google/callback` - Callback OAuth
- `GET /api/auth/google/status` - Status da autenticação

## 💻 Exemplo de Uso via API

### Verificar Disponibilidade

```javascript
const response = await fetch(
    `/api/appointments/availability?doctorId=${doctorId}&date=2025-10-22`
);

const result = await response.json();
console.log(result.data.availableSlots);
// Output: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"]
```

### Criar Agendamento

```javascript
const response = await fetch('/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        patient: {
            name: "Maria Santos",
            phone: "(11) 98765-4321",
            email: "maria@exemplo.com"
        },
        doctorId: "675a1b2c3d4e5f6g7h8i9j0k",
        specialtyId: "675a1b2c3d4e5f6g7h8i9j0l",
        scheduledDate: "2025-10-22",
        scheduledTime: "10:00",
        notes: "Primeira consulta",
        source: "whatsapp"
    })
});

const result = await response.json();
console.log(result.data.googleEventLink);
// Link para o evento no Google Calendar
```

## 🔄 Integração com WhatsApp

```javascript
// Exemplo de fluxo no bot do WhatsApp

// 1. Listar especialidades
const specialties = await getSpecialties(clinicId);
bot.sendMessage("Escolha uma especialidade:", specialties);

// 2. Listar médicos
const doctors = await getDoctors(specialtyId);
bot.sendMessage("Escolha um médico:", doctors);

// 3. Buscar disponibilidade
const availability = await getAvailability(doctorId, date);
bot.sendMessage("Horários disponíveis:", availability);

// 4. Criar agendamento
const appointment = await createAppointment({
    patient: { name, phone, email },
    doctorId,
    specialtyId,
    scheduledDate,
    scheduledTime
});

bot.sendMessage(`✅ Consulta agendada para ${date} às ${time}!`);
```

## 📊 Modelos de Dados

### Appointment (Agendamento)

```javascript
{
    patient: {
        name: String,
        email: String,
        phone: String,
        cpf: String
    },
    doctor: ObjectId,
    specialty: ObjectId,
    clinic: ObjectId,
    scheduledDate: Date,
    scheduledTime: String, // "HH:MM"
    duration: Number, // minutos
    status: "pendente" | "confirmado" | "cancelado" | "concluido",
    googleEventId: String,
    googleCalendarId: String,
    notes: String,
    source: "whatsapp" | "site" | "telefone" | "admin"
}
```

### Doctor (Médico)

```javascript
{
    name: String,
    email: String,
    phone: String,
    crm: { number: String, state: String },
    specialties: [ObjectId],
    clinic: ObjectId,
    googleCalendarId: String, // ID do calendário no Google
    workingDays: [Number], // 0-6 (Dom-Sáb)
    workingHours: { start: Number, end: Number },
    slotDuration: Number, // minutos
    active: Boolean,
    acceptsNewPatients: Boolean
}
```

## 🎯 Roadmap

- [x] Integração com Google Calendar
- [x] Verificação de disponibilidade
- [x] Criação de agendamentos
- [x] Dashboard administrativo
- [ ] Integração com WhatsApp Business API
- [ ] Sistema de lembretes automáticos
- [ ] Confirmação de consultas
- [ ] Reagendamento de consultas
- [ ] Lista de espera
- [ ] Exportação de relatórios
- [ ] Integração com sistemas de prontuário eletrônico

## 🐛 Solução de Problemas

### Agendamento não aparece no Google Calendar

1. Verifique se está autenticado: `/api/auth/google/status`
2. Confirme se o `googleCalendarId` do médico está correto
3. Verifique os logs em `logs/combined.log`

### Erro "Horário não disponível"

1. Verifique se a data não está no passado
2. Confirme se o médico trabalha neste dia da semana
3. Verifique se está dentro do horário de funcionamento

### WhatsApp não consegue agendar

1. Verifique se as rotas da API estão acessíveis
2. Confirme formato dos dados enviados
3. Verifique logs de erro no servidor

## 📚 Documentação Adicional

- [Guia de Setup do Google Calendar](../../docs/GOOGLE-CALENDAR-SETUP.md)
- [API Reference - Google Calendar](https://developers.google.com/calendar/api)
- [Documentação do AtenMed](../../README.md)

## 🤝 Contribuindo

Para contribuir com melhorias:

1. Faça fork do projeto
2. Crie uma branch: `git checkout -b feature/melhoria`
3. Commit suas mudanças: `git commit -m 'Adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/melhoria`
5. Abra um Pull Request

## 📄 Licença

Este projeto faz parte do ecossistema AtenMed e está sob a licença MIT.

---

**Desenvolvido com ❤️ pela equipe AtenMed**

