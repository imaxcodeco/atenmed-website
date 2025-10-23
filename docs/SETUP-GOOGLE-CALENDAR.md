# 📅 Configuração Google Calendar API

## 🎯 Objetivo

Integrar o Google Calendar para:
- Agendamento automático de consultas
- Prevenção de conflitos de horários
- Sincronização bidirecional
- Visualização de disponibilidade

---

## 📋 Pré-requisitos

1. Conta Google (Gmail)
2. Google Cloud Project
3. Calendário do Google configurado

---

## 🚀 Passo a Passo

### 1. Criar Projeto no Google Cloud

1. Acesse: https://console.cloud.google.com/
2. Clique em "Select a project" → "New Project"
3. Nome: "AtenMed"
4. Clique em "Create"

### 2. Ativar Google Calendar API

1. No menu lateral: "APIs & Services" → "Library"
2. Busque por "Google Calendar API"
3. Clique em "Enable"

### 3. Criar Credenciais OAuth 2.0

1. "APIs & Services" → "Credentials"
2. "Create Credentials" → "OAuth client ID"
3. Configure a tela de consentimento primeiro:
   - "Configure Consent Screen"
   - User Type: External
   - App name: AtenMed
   - User support email: contato@atenmed.com.br
   - Developer contact: contato@atenmed.com.br
   - Save and Continue

4. Criar OAuth Client ID:
   - Application type: Web application
   - Name: AtenMed Web
   - Authorized redirect URIs:
     - `https://atenmed.com.br/api/auth/google/callback`
     - `http://localhost:3000/api/auth/google/callback` (dev)
   - Create

5. Copie as credenciais:
   - Client ID
   - Client Secret

### 4. Configurar .env

```bash
# Google Calendar API
GOOGLE_CLIENT_ID=350840859703-xxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
GOOGLE_REDIRECT_URL=https://atenmed.com.br/api/auth/google/callback
```

### 5. Autenticar pela Primeira Vez

1. Acesse: https://atenmed.com.br/api/auth/google
2. Faça login com a conta do Google
3. Autorize o acesso ao Calendar
4. O sistema armazenará o token automaticamente

### 6. Configurar Calendários Compartilhados (Opcional)

Para múltiplos médicos:

```bash
DOCTOR_CALENDAR_1=medico1@gmail.com
DOCTOR_CALENDAR_2=calendario-compartilhado-id@group.calendar.google.com
```

---

## 🧪 Testar Integração

### Via Dashboard
```
https://atenmed.com.br/apps/agendamento/
```

### Via API
```bash
curl https://atenmed.com.br/api/calendar/availability \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

---

## 📚 Funcionalidades Disponíveis

### 1. Verificar Disponibilidade
```javascript
GET /api/calendar/availability?date=2024-10-25
```

### 2. Criar Agendamento
```javascript
POST /api/appointments
{
  "patientName": "João Silva",
  "patientEmail": "joao@email.com",
  "date": "2024-10-25",
  "time": "14:00",
  "duration": 30
}
```

### 3. Listar Agendamentos
```javascript
GET /api/appointments?start=2024-10-25&end=2024-10-31
```

---

## 🔧 Troubleshooting

### Token expirado
O sistema renova automaticamente. Se não funcionar:
1. Delete tokens salvos
2. Acesse `/api/auth/google` novamente
3. Autorize novamente

### Calendário não aparece
1. Verifique se compartilhou o calendário com o email correto
2. Confirme permissões (mínimo: "Make changes to events")
3. Aguarde até 5 minutos para sincronização

### Erro de permissão
Verifique os escopos OAuth:
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/calendar.events`

---

## ⚠️ Limites e Quotas

- **Grátis**: 1.000.000 requisições/dia
- **Rate Limit**: 10 requisições/segundo
- **Webhook**: Renovar a cada 7 dias

---

## 📋 Checklist de Configuração

- [ ] Projeto criado no Google Cloud
- [ ] Calendar API ativada
- [ ] OAuth 2.0 credentials criadas
- [ ] Redirect URIs configuradas
- [ ] `.env` atualizado com credentials
- [ ] Primeira autenticação realizada
- [ ] Teste de disponibilidade funcionando
- [ ] Teste de criação de evento funcionando

