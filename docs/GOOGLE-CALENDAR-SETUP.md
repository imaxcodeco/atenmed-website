# 📅 Configuração do Google Calendar API - AtenMed

## 📋 Visão Geral

Este guia detalha como configurar a integração do Google Calendar com o sistema de Agendamento Inteligente do AtenMed. Com esta integração, o sistema poderá:

- ✅ Verificar horários disponíveis em calendários do Google
- ✅ Criar eventos de consultas automaticamente
- ✅ Sincronizar agendamentos com Google Calendar
- ✅ Gerenciar múltiplos médicos e suas agendas
- ✅ Enviar notificações automáticas aos pacientes

## 🚀 Passo a Passo

### 1. Criar Projeto no Google Cloud Console

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Faça login com sua conta Google
3. Crie um novo projeto:
   - Clique em **"Select a Project"** no topo
   - Clique em **"New Project"**
   - Nome do projeto: `AtenMed Agendamento` (ou nome de sua preferência)
   - Clique em **"Create"**

### 2. Ativar Google Calendar API

1. Com o projeto selecionado, vá para o menu lateral
2. Navegue até: **APIs & Services** → **Library**
3. Procure por **"Google Calendar API"**
4. Clique em **"Enable"** para ativar a API

### 3. Configurar OAuth Consent Screen

1. Vá para: **APIs & Services** → **OAuth consent screen**
2. Selecione **"External"** (para uso público) ou **"Internal"** (apenas para sua organização)
3. Clique em **"Create"**

4. **Preencha as informações:**
   - **App name**: AtenMed Agendamento Inteligente
   - **User support email**: seu-email@exemplo.com
   - **App logo**: (opcional) logo do AtenMed
   - **Application home page**: https://atenmed.com.br
   - **Authorized domains**: atenmed.com.br
   - **Developer contact information**: seu-email@exemplo.com

5. Clique em **"Save and Continue"**

6. **Adicionar Scopes (Escopos):**
   - Clique em **"Add or Remove Scopes"**
   - Adicione os seguintes scopes:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
   - Clique em **"Update"** e depois **"Save and Continue"**

7. **Test users** (apenas para modo de teste):
   - Adicione os emails que poderão testar o aplicativo
   - Clique em **"Save and Continue"**

8. Revise e clique em **"Back to Dashboard"**

### 4. Criar Credenciais OAuth 2.0

1. Vá para: **APIs & Services** → **Credentials**
2. Clique em **"Create Credentials"** → **"OAuth client ID"**
3. **Application type**: Web application
4. **Name**: AtenMed Calendar Integration

5. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://atenmed.com.br
   ```

6. **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/google/callback
   https://atenmed.com.br/api/auth/google/callback
   ```

7. Clique em **"Create"**

8. **Copie as credenciais:**
   - Client ID (exemplo: `123456789-abc123.apps.googleusercontent.com`)
   - Client Secret (exemplo: `GOCSPX-abc123xyz`)

### 5. Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp env.example .env
   ```

2. Edite o arquivo `.env` e adicione as credenciais:
   ```env
   # Google Calendar API
   GOOGLE_CLIENT_ID=SEU_CLIENT_ID_AQUI.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=SEU_CLIENT_SECRET_AQUI
   GOOGLE_REDIRECT_URL=http://localhost:3000/api/auth/google/callback
   ```

3. Para produção, altere a URL de redirecionamento:
   ```env
   GOOGLE_REDIRECT_URL=https://atenmed.com.br/api/auth/google/callback
   ```

### 6. Criar Calendários Compartilhados para Médicos

Para cada médico que utilizará o sistema:

1. **Opção A: Usar o calendário pessoal do médico**
   - Acesse [Google Calendar](https://calendar.google.com)
   - Clique em "Configurações" → "Configurações para meu calendário"
   - Copie o **ID do Calendário** (exemplo: `medico@gmail.com`)

2. **Opção B: Criar calendário compartilhado dedicado** (Recomendado)
   - No Google Calendar, clique em **+** ao lado de "Outros calendários"
   - Selecione **"Criar novo calendário"**
   - **Nome**: Dr. João Silva - Consultas
   - **Descrição**: Agenda de consultas do Dr. João Silva
   - **Fuso horário**: (UTC-03:00) Brasília
   - Clique em **"Criar calendário"**

3. **Compartilhar o calendário:**
   - Vá em "Configurações" → "Configurações para meus calendários"
   - Selecione o calendário criado
   - Vá em "Compartilhar com pessoas específicas"
   - Adicione o email da aplicação (ou mantenha privado se usar OAuth)
   - Permissão: **"Fazer alterações em eventos"**
   - Salve

4. **Copiar ID do Calendário:**
   - Na mesma tela, role até "Integrar calendário"
   - Copie o **ID do Calendário** (exemplo: `abc123@group.calendar.google.com`)

### 7. Autenticar o Sistema

1. Inicie o servidor AtenMed:
   ```bash
   npm start
   ```

2. Acesse a interface de agendamento:
   ```
   http://localhost:3000/agendamento
   ```

3. Vá para a aba **"Google Calendar"**

4. Clique em **"Autenticar com Google"**

5. **Faça login com a conta Google** que tem acesso aos calendários

6. **Autorize as permissões** solicitadas:
   - Ver, editar, compartilhar e excluir permanentemente todos os calendários
   - Ver e editar eventos em todos os seus calendários

7. Após autorizar, você será redirecionado de volta ao sistema

8. ✅ **Autenticação concluída!** O sistema agora pode acessar o Google Calendar

### 8. Cadastrar Médicos no Sistema

1. Acesse o MongoDB e crie os documentos:

```javascript
// Conectar ao MongoDB
use atenmed;

// 1. Criar uma Clínica
db.clinics.insertOne({
    name: "Clínica Coração Saudável",
    description: "Clínica especializada em cardiologia",
    address: {
        street: "Av. Paulista",
        number: "1000",
        neighborhood: "Bela Vista",
        city: "São Paulo",
        state: "SP",
        zipCode: "01310-100"
    },
    contact: {
        phone: "(11) 3000-0000",
        email: "contato@clinica.com.br",
        whatsapp: "(11) 99999-9999"
    },
    workingHours: { start: 8, end: 18 },
    slotDuration: 60,
    active: true,
    settings: {
        allowWeekends: false,
        autoConfirmAppointments: true,
        sendEmailNotifications: true,
        sendWhatsAppNotifications: true
    }
});

// 2. Criar uma Especialidade
db.specialties.insertOne({
    name: "Cardiologia",
    clinic: ObjectId("ID_DA_CLINICA_ACIMA"),
    description: "Especialidade médica que cuida do coração",
    color: "#45a7b1",
    icon: "❤️",
    active: true,
    defaultDuration: 60
});

// 3. Criar um Médico
db.doctors.insertOne({
    name: "Dr. João Silva",
    email: "joao.silva@clinica.com.br",
    phone: "(11) 98888-8888",
    crm: {
        number: "123456",
        state: "SP"
    },
    specialties: [ObjectId("ID_DA_ESPECIALIDADE_ACIMA")],
    clinic: ObjectId("ID_DA_CLINICA_ACIMA"),
    googleCalendarId: "abc123@group.calendar.google.com", // ID do calendário do Google
    googleCalendarEmail: "calendario@gmail.com",
    workingDays: [1, 2, 3, 4, 5], // Segunda a Sexta
    workingHours: { start: 9, end: 18 },
    slotDuration: 60,
    active: true,
    acceptsNewPatients: true,
    bio: "Cardiologista com 15 anos de experiência",
    notifications: {
        email: true,
        whatsapp: true
    }
});
```

### 9. Testar Agendamento

1. **Via API (para testar manualmente):**

```bash
# 1. Verificar disponibilidade
curl -X GET "http://localhost:3000/api/appointments/availability?doctorId=ID_DO_MEDICO&date=2025-10-22"

# 2. Criar agendamento
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "patient": {
      "name": "Maria Santos",
      "phone": "(11) 98765-4321",
      "email": "maria@exemplo.com"
    },
    "doctorId": "ID_DO_MEDICO",
    "specialtyId": "ID_DA_ESPECIALIDADE",
    "scheduledDate": "2025-10-22",
    "scheduledTime": "10:00",
    "notes": "Primeira consulta",
    "source": "whatsapp"
  }'
```

2. **Via WhatsApp (próximo passo):**
   - O bot do WhatsApp utilizará essas mesmas APIs
   - O paciente escolherá: Clínica → Especialidade → Médico → Data → Horário
   - O sistema criará automaticamente o agendamento

## 🔧 Solução de Problemas

### Erro: "Access blocked: This app's request is invalid"

**Causa**: OAuth consent screen não configurado corretamente

**Solução**:
1. Volte ao Google Cloud Console
2. Configure corretamente o OAuth consent screen
3. Adicione seu email como test user (se em modo de teste)

### Erro: "redirect_uri_mismatch"

**Causa**: URL de redirecionamento não autorizada

**Solução**:
1. Verifique se a URL em `.env` está correta
2. Adicione a URL exata em "Authorized redirect URIs" nas credenciais OAuth
3. Certifique-se de não ter espaços ou barras extras

### Erro: "Calendar not found"

**Causa**: ID do calendário inválido ou sem permissão

**Solução**:
1. Verifique se o ID do calendário está correto
2. Certifique-se de que a conta autenticada tem acesso ao calendário
3. Se for calendário compartilhado, verifique as permissões

### Erro: "Insufficient permissions"

**Causa**: Scopes necessários não foram autorizados

**Solução**:
1. Revogue o acesso atual: https://myaccount.google.com/permissions
2. Adicione os scopes corretos no OAuth consent screen
3. Autentique novamente pelo sistema

## 📊 Fluxo de Agendamento

```
1. Paciente inicia conversa no WhatsApp
   ↓
2. Bot apresenta opções de clínicas
   ↓
3. Paciente escolhe clínica
   ↓
4. Bot lista especialidades disponíveis
   ↓
5. Paciente escolhe especialidade
   ↓
6. Bot lista médicos da especialidade
   ↓
7. Paciente escolhe médico
   ↓
8. Sistema consulta Google Calendar (API Freebusy)
   ↓
9. Bot apresenta datas e horários disponíveis
   ↓
10. Paciente escolhe data e horário
    ↓
11. Sistema cria evento no Google Calendar
    ↓
12. Sistema salva agendamento no MongoDB
    ↓
13. Bot confirma agendamento
    ↓
14. Paciente recebe confirmação por email (opcional)
```

## 🔐 Segurança e Melhores Práticas

1. **Nunca compartilhe suas credenciais OAuth**
   - Mantenha o `.env` fora do controle de versão
   - Use variáveis de ambiente em produção

2. **Use calendários dedicados para cada médico**
   - Não use calendários pessoais
   - Facilita gerenciamento e auditoria

3. **Monitore o uso da API**
   - Google Calendar tem limites de quota
   - Implemente cache quando possível

4. **Backup dos agendamentos**
   - Mantenha cópia no MongoDB
   - Não dependa apenas do Google Calendar

5. **Teste em ambiente de desenvolvimento primeiro**
   - Use o modo de teste do OAuth
   - Valide todas as funcionalidades antes de produção

## 📱 Próximos Passos

1. ✅ Integrar com WhatsApp Business API
2. ✅ Implementar sistema de lembretes automáticos
3. ✅ Adicionar confirmação de consultas
4. ✅ Dashboard de analytics
5. ✅ Exportação de relatórios

## 📚 Recursos Adicionais

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google Calendar API Quota](https://developers.google.com/calendar/api/guides/quota)
- [Google Calendar API Reference](https://developers.google.com/calendar/api/v3/reference)

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs do sistema: `logs/combined.log`
2. Consulte esta documentação
3. Entre em contato com o suporte: contato@atenmed.com.br

---

**Desenvolvido com ❤️ pela equipe AtenMed**

