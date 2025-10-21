# 📅 Seleção de Google Calendar ao Cadastrar Clientes

## 🎯 Nova Funcionalidade Implementada!

Agora, ao cadastrar um cliente que usará o **Agendamento Inteligente** (ou **Ambas** as aplicações), o sistema exibe automaticamente um campo para **selecionar a agenda do Google Calendar** que será usada para esse cliente.

---

## ✨ Como Funciona

### 1. **Campo Dinâmico**
- O campo de seleção de agenda **aparece automaticamente** quando você seleciona:
  - 📅 **Agendamento Inteligente**
  - 🚀 **Ambas as Aplicações**
  
- O campo **fica oculto** quando você seleciona:
  - 💬 **Apenas Automação de Atendimento**

### 2. **Carregamento Automático de Agendas**
Quando o campo aparece, o sistema:
- ✅ Busca todas as agendas da conta Google autenticada
- ✅ Exibe as agendas em um dropdown
- ✅ Marca a agenda principal (se houver)
- ✅ Aplica cores personalizadas de cada agenda

### 3. **Autenticação Google**
Se ainda não houver autenticação com o Google Calendar:
- ⚠️ Uma mensagem amarela aparece informando
- 🔗 Link direto para autenticar com o Google
- 🔄 Após autenticar, basta recarregar a página

### 4. **Salvamento Automático**
Quando o cliente é cadastrado:
- ✅ O ID da agenda selecionada é salvo automaticamente
- ✅ Fica armazenado em `config.agendamento.googleCalendarId`
- ✅ Pronto para ser usado nas operações de agendamento

---

## 🖥️ Como Usar (Passo a Passo)

### **Passo 1: Autenticar com Google Calendar**
**⚠️ Importante: Faça isso ANTES de cadastrar clientes com agendamento**

1. Abra uma nova aba no navegador
2. Acesse: `https://atenmed.com.br/api/auth/google`
3. Faça login com sua conta Google
4. Autorize o AtenMed a acessar seu Google Calendar
5. Você verá uma tela de confirmação ✅

### **Passo 2: Cadastrar Cliente**
1. Acesse `https://atenmed.com.br/dashboard`
2. Clique na aba **"👥 Clientes"**
3. Preencha os dados do cliente:
   - Nome
   - Email (opcional)
   - WhatsApp
   - Tipo de Negócio

4. **Selecione a aplicação:**
   - Se escolher **"Agendamento Inteligente"** ou **"Ambas"**, um novo campo aparecerá ⬇️

5. **Selecione a Agenda:**
   - Escolha a agenda do Google Calendar
   - Exemplo: "Agenda Dr. João", "Clínica Principal", etc.

6. Adicione observações (opcional)

7. Clique em **"➕ Adicionar Cliente e Configurar Aplicações"**

8. **Pronto!** ✅ Cliente cadastrado com a agenda configurada

---

## 🔧 Detalhes Técnicos

### **Backend**

#### Novo Endpoint: `GET /api/google/calendars`
Retorna todas as agendas disponíveis na conta Google autenticada.

**Resposta de Sucesso:**
```json
{
  "success": true,
  "data": [
    {
      "id": "primary",
      "summary": "Minha Agenda",
      "description": "",
      "primary": true,
      "backgroundColor": "#9fe1e7",
      "foregroundColor": "#000000",
      "accessRole": "owner"
    },
    {
      "id": "clinica@group.calendar.google.com",
      "summary": "Clínica Principal",
      "description": "Agenda compartilhada da clínica",
      "primary": false,
      "backgroundColor": "#a4bdfc",
      "foregroundColor": "#000000",
      "accessRole": "owner"
    }
  ],
  "total": 2
}
```

**Resposta se Não Autenticado:**
```json
{
  "success": false,
  "error": "Google Calendar não autenticado",
  "needsAuth": true,
  "authUrl": "/api/auth/google"
}
```

#### Serviço: `googleCalendarService.listCalendars()`
Novo método adicionado ao serviço que:
- Usa a API `calendar.calendarList.list()`
- Retorna dados formatados e limpos
- Trata erros de autenticação

#### API de Clientes Atualizada
**Endpoint:** `POST /api/clients`

Agora aceita o campo `googleCalendarId`:
```json
{
  "name": "Clínica Saúde Total",
  "email": "contato@clinica.com.br",
  "whatsapp": "+5511999999999",
  "businessType": "clinica",
  "applications": "both",
  "googleCalendarId": "clinica@group.calendar.google.com",  // ← NOVO
  "notes": "Cliente VIP"
}
```

**Salvamento:**
- Se `applications` for `agendamento` ou `both`
- E `googleCalendarId` for fornecido
- Salva em: `client.config.agendamento.googleCalendarId`

### **Frontend**

#### HTML - Campo Dinâmico
```html
<div id="calendarSelectionField" style="display: none;">
    <label>📅 Selecione a Agenda do Google Calendar *</label>
    
    <!-- Mensagem de autenticação (se necessário) -->
    <div id="calendarAuthMessage" style="display: none;">
        ⚠️ Você precisa autenticar com o Google Calendar primeiro.
        <a href="/api/auth/google" target="_blank">Clique aqui</a>
    </div>
    
    <!-- Dropdown de agendas -->
    <select id="clientGoogleCalendar" required>
        <option value="">Carregando calendários...</option>
    </select>
</div>
```

#### JavaScript - Funções Principais

**1. `loadGoogleCalendars()`**
- Busca agendas da API
- Popula o dropdown
- Trata autenticação necessária
- Aplica cores das agendas

**2. `toggleCalendarField()`**
- Mostra/oculta campo baseado na aplicação selecionada
- Carrega agendas se necessário
- Define campo como required/optional

**3. Event Listeners**
```javascript
// Quando mudar a seleção de aplicação
appRadios.forEach(radio => {
    radio.addEventListener('change', toggleCalendarField);
});

// Ao submeter, inclui googleCalendarId
if (selectedApp === 'agendamento' || selectedApp === 'both') {
    formData.googleCalendarId = document.getElementById('clientGoogleCalendar').value;
}
```

---

## 📊 Fluxo Completo

```
1. Usuário seleciona "Agendamento" ou "Ambas"
         ↓
2. Campo de calendário aparece
         ↓
3. JavaScript chama /api/google/calendars
         ↓
4. Backend verifica autenticação
         ↓
5a. Se autenticado: Retorna lista de agendas
         ↓
6a. Frontend popula dropdown
         ↓
7a. Usuário seleciona agenda
         ↓
8a. Submete formulário com googleCalendarId
         ↓
9a. Backend salva em config.agendamento.googleCalendarId

5b. Se NÃO autenticado: Retorna needsAuth: true
         ↓
6b. Frontend mostra mensagem de autenticação
         ↓
7b. Usuário clica no link de autenticação
         ↓
8b. OAuth flow completo
         ↓
9b. Usuário volta ao dashboard e tenta novamente
```

---

## 🎨 Interface Visual

### **Antes de Selecionar**
```
┌─────────────────────────────────────────────────────┐
│  Aplicações *                                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│
│  │ ○ Automação  │ │ ○ Agendamento│ │ ○ Ambas      ││
│  └──────────────┘ └──────────────┘ └──────────────┘│
└─────────────────────────────────────────────────────┘
```

### **Após Selecionar "Agendamento" ou "Ambas"**
```
┌─────────────────────────────────────────────────────┐
│  Aplicações *                                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│
│  │ ○ Automação  │ │ ● Agendamento│ │ ○ Ambas      ││
│  └──────────────┘ └──────────────┘ └──────────────┘│
│                                                     │
│  📅 Selecione a Agenda do Google Calendar *        │
│  ┌─────────────────────────────────────────────┐  │
│  │ ▼ Minha Agenda (Principal)                  │  │
│  │   Clínica Principal                         │  │
│  │   Dr. João - Cardiologia                    │  │
│  │   Consultório Particular                    │  │
│  └─────────────────────────────────────────────┘  │
│  Selecione a agenda que será usada para este cliente│
└─────────────────────────────────────────────────────┘
```

### **Se Não Autenticado**
```
┌─────────────────────────────────────────────────────┐
│  📅 Selecione a Agenda do Google Calendar *        │
│  ┌─────────────────────────────────────────────┐  │
│  │ ⚠️ Você precisa autenticar com o Google      │  │
│  │    Calendar primeiro. Clique aqui para        │  │
│  │    autenticar                                 │  │
│  └─────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────┐  │
│  │ Autenticação necessária                     │  │
│  └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## ✅ Validações

### **Frontend**
- ✅ Campo obrigatório quando "Agendamento" ou "Ambas" selecionado
- ✅ Campo opcional quando apenas "Automação" selecionado
- ✅ Carregamento lazy (só carrega ao exibir o campo)
- ✅ Tratamento de erros de conexão
- ✅ Feedback visual (loading, erro, sucesso)

### **Backend**
- ✅ `googleCalendarId` é opcional no endpoint
- ✅ Validação: se fornecido, não pode ser string vazia
- ✅ Só salva se aplicação de agendamento estiver ativa
- ✅ Integração com modelo Client existente

---

## 🧪 Como Testar

### **1. Testar Autenticação**
```bash
# Abrir no navegador:
https://atenmed.com.br/api/auth/google
```
- Fazer login com conta Google
- Autorizar o AtenMed
- Verificar se vê tela de sucesso ✅

### **2. Testar Listagem de Agendas**
```bash
# Abrir no navegador (após autenticar):
https://atenmed.com.br/api/google/calendars
```
- Deve retornar JSON com lista de agendas
- Verificar se suas agendas aparecem

### **3. Testar Cadastro Completo**
1. Acesse `https://atenmed.com.br/dashboard`
2. Aba "Clientes"
3. Preencha formulário
4. Selecione "Agendamento Inteligente"
5. Verifique se campo de agenda aparece
6. Selecione uma agenda
7. Submeta formulário
8. Verifique sucesso e atualização da lista

### **4. Verificar no Banco**
```javascript
// No MongoDB, verificar:
db.clients.findOne({ whatsapp: "+5511999999999" })

// Deve conter:
{
  ...
  config: {
    agendamento: {
      googleCalendarId: "clinica@group.calendar.google.com"
    }
  }
}
```

---

## 🚀 Benefícios

1. **Experiência do Usuário**
   - ✅ Sem configuração manual
   - ✅ Interface intuitiva
   - ✅ Feedback visual claro

2. **Automação**
   - ✅ Sem necessidade de copiar/colar IDs
   - ✅ Validação em tempo real
   - ✅ Integração perfeita

3. **Segurança**
   - ✅ OAuth 2.0 do Google
   - ✅ Apenas agendas acessíveis são exibidas
   - ✅ Validação no backend

4. **Escalabilidade**
   - ✅ Suporta múltiplas agendas
   - ✅ Cada cliente pode ter sua própria agenda
   - ✅ Fácil de gerenciar

---

## 📝 Próximos Passos Sugeridos

1. **Exibir Agenda na Lista de Clientes**
   - Mostrar nome da agenda na tabela
   - Ícone colorido da agenda

2. **Editar Agenda do Cliente**
   - Permitir trocar agenda depois de cadastrado
   - Histórico de trocas

3. **Validação de Permissões**
   - Verificar se agenda ainda está acessível
   - Alertar se agenda foi removida/descompartilhada

4. **Dashboard por Agenda**
   - Visualizar todos os clientes por agenda
   - Estatísticas de uso por agenda

---

## 🎉 Status

✅ **100% Implementado e Funcionando**  
🌐 **Disponível em:** https://atenmed.com.br/dashboard  
📅 **Data:** 21/10/2025  
🚀 **Pronto para uso em produção!**

---

**Teste agora:** Acesse o dashboard, autentique com o Google e cadastre um cliente com agendamento! 😊

