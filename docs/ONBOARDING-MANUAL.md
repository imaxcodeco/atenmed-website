# 📋 Manual de Onboarding - AtenMed SaaS

## 🎯 Objetivo
Este guia documenta o processo completo para ativar um novo cliente após fechamento da venda.

---

## ✅ Checklist de Ativação

### **Pré-requisitos**
- [ ] Venda fechada no CRM (status: `fechado`)
- [ ] Plano contratado definido (basic/pro/enterprise)
- [ ] Dados do cliente coletados
- [ ] Pagamento da primeira fatura confirmado (ou boleto enviado)

---

## 🚀 Processo de Ativação (20-30 minutos)

### **PASSO 1: Criar Clínica no Sistema**

#### Via API (Recomendado):
```bash
curl -X POST http://localhost:3000/api/clinics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -d '{
    "name": "Clínica do Dr. João",
    "slug": "clinica-dr-joao",
    "contact": {
      "whatsapp": "+5511999999999",
      "email": "contato@clinica.com.br",
      "phone": "(11) 9999-9999"
    },
    "address": {
      "street": "Rua Exemplo",
      "number": "123",
      "neighborhood": "Centro",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01000-000"
    },
    "workingHours": {
      "start": 8,
      "end": 18,
      "formatted": "Seg-Sex: 8h às 18h"
    },
    "subscription": {
      "plan": "basic",
      "status": "active",
      "startDate": "2024-11-01",
      "autoRenew": true
    },
    "branding": {
      "primaryColor": "#45a7b1",
      "secondaryColor": "#184354"
    },
    "active": true
  }'
```

#### Via Script Auxiliar:
```bash
node scripts/ativar-cliente.js
```
*Siga as instruções interativas do script*

---

### **PASSO 2: Criar Usuário Owner da Clínica**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -d '{
    "nome": "Dr. João Silva",
    "email": "joao@clinica.com.br",
    "senha": "senhaTemporaria123!",
    "role": "admin",
    "telefone": "(11) 99999-9999",
    "departamento": "administracao"
  }'
```

**⚠️ IMPORTANTE:**
- Anotar a senha temporária gerada
- Instruir o cliente a trocar a senha no primeiro acesso

---

### **PASSO 3: Vincular Usuário à Clínica** 

*NOTA: Este passo será automatizado quando implementarmos multi-tenancy*

```bash
# Atualizar Lead com clinicaId
curl -X PUT http://localhost:3000/api/leads/LEAD_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -d '{
    "clinicaId": "ID_DA_CLINICA_CRIADA",
    "status": "fechado"
  }'
```

---

### **PASSO 4: Configurar WhatsApp Business (se contratado)**

#### 4.1 - Verificar Número no Meta Business
1. Acessar [Meta Business Suite](https://business.facebook.com/)
2. Ir em WhatsApp > Números de Telefone
3. Adicionar ou verificar o número do cliente
4. Aguardar aprovação (geralmente instantânea)

#### 4.2 - Configurar Webhook
```bash
# Atualizar clínica com Phone ID do WhatsApp
curl -X PUT http://localhost:3000/api/clinics/CLINIC_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -d '{
    "contact": {
      "whatsapp": "+5511999999999",
      "whatsappPhoneId": "PHONE_ID_DO_META"
    },
    "features": {
      "whatsappBot": true
    }
  }'
```

#### 4.3 - Testar Envio
```bash
curl -X POST http://localhost:3000/api/whatsapp/send-test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -d '{
    "phone": "+5511999999999",
    "message": "🎉 Bem-vindo ao AtenMed! Seu WhatsApp está configurado e funcionando."
  }'
```

---

### **PASSO 5: Configurar Google Calendar (se contratado)**

#### 5.1 - Obter Consentimento OAuth
1. Enviar link para o cliente: `https://atenmed.com.br/api/auth/google`
2. Cliente faz login com Google Workspace
3. Autoriza acesso ao calendário
4. Sistema armazena tokens automaticamente

#### 5.2 - Listar e Configurar Calendários
```bash
# Listar calendários disponíveis
curl http://localhost:3000/api/google/calendars \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN"

# Atualizar clínica com Calendar ID
curl -X PUT http://localhost:3000/api/clinics/CLINIC_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -d '{
    "config": {
      "googleCalendarId": "calendario@group.calendar.google.com"
    },
    "features": {
      "onlineBooking": true
    }
  }'
```

#### 5.3 - Testar Agendamento
- Acessar: `https://atenmed.com.br/clinica/SLUG-DA-CLINICA`
- Fazer um agendamento de teste
- Verificar se aparece no Google Calendar

---

### **PASSO 6: Personalizar Página da Clínica**

#### 6.1 - Upload de Logo
*Via dashboard do cliente (após login)*

#### 6.2 - Configurar Cores
```bash
curl -X PUT http://localhost:3000/api/clinics/CLINIC_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -d '{
    "branding": {
      "primaryColor": "#1E88E5",
      "secondaryColor": "#0D47A1",
      "accentColor": "#64B5F6"
    }
  }'
```

#### 6.3 - Configurar Horários
```bash
curl -X PUT http://localhost:3000/api/clinics/CLINIC_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -d '{
    "workingHours": {
      "monday": { "start": "08:00", "end": "18:00", "closed": false },
      "tuesday": { "start": "08:00", "end": "18:00", "closed": false },
      "wednesday": { "start": "08:00", "end": "18:00", "closed": false },
      "thursday": { "start": "08:00", "end": "18:00", "closed": false },
      "friday": { "start": "08:00", "end": "18:00", "closed": false },
      "saturday": { "start": "08:00", "end": "12:00", "closed": false },
      "sunday": { "closed": true }
    }
  }'
```

---

### **PASSO 7: Criar Primeira Fatura**

```bash
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -d '{
    "clinic": "ID_DA_CLINICA",
    "referenceMonth": "2024-11",
    "plan": "basic",
    "amount": 99.00,
    "dueDate": "2024-12-10",
    "status": "pendente",
    "notes": "Primeira fatura - Bem-vindo ao AtenMed!"
  }'
```

**Enviar fatura por email:**
- Gerar PDF (via sistema ou manualmente)
- Enviar para email do cliente
- Incluir instruções de pagamento (PIX, boleto, transferência)

---

### **PASSO 8: Enviar Credenciais e Boas-Vindas**

#### Email de Boas-Vindas:
```
Assunto: 🎉 Bem-vindo ao AtenMed! Suas credenciais de acesso

Olá Dr(a). [Nome],

Sua clínica está ativa no AtenMed! 🚀

📌 SEUS DADOS DE ACESSO:
━━━━━━━━━━━━━━━━━━━━━━
🌐 URL: https://atenmed.com.br/portal
📧 Login: [email@cliente.com]
🔑 Senha temporária: [senhaTemporaria123!]

⚠️ IMPORTANTE: Altere sua senha no primeiro acesso!

━━━━━━━━━━━━━━━━━━━━━━

📱 SUA PÁGINA PÚBLICA:
https://atenmed.com.br/clinica/[slug-da-clinica]

Compartilhe este link com seus pacientes!

━━━━━━━━━━━━━━━━━━━━━━

✅ O QUE ESTÁ ATIVO:
• Agendamento online 24/7
• WhatsApp automatizado
• Lembretes automáticos
• Google Calendar sincronizado
• Página personalizada

━━━━━━━━━━━━━━━━━━━━━━

📚 PRÓXIMOS PASSOS:
1. Fazer login e trocar senha
2. Adicionar logo e personalizar cores
3. Cadastrar médicos e especialidades
4. Testar um agendamento
5. Compartilhar link nas redes sociais

━━━━━━━━━━━━━━━━━━━━━━

💰 FATURA:
Plano: [Nome do Plano] - R$ [Valor]/mês
Vencimento: [Data]
[Link para fatura/boleto]

━━━━━━━━━━━━━━━━━━━━━━

🎓 TREINAMENTO:
Agendamos uma call de onboarding para [Data/Hora]
Link da reunião: [Link Zoom/Meet]

━━━━━━━━━━━━━━━━━━━━━━

💬 SUPORTE:
📱 WhatsApp: (11) 99999-9999
📧 Email: suporte@atenmed.com.br
🕐 Horário: Seg-Sex, 9h-18h

Qualquer dúvida, estamos à disposição!

Bem-vindo à família AtenMed! 🏥❤️

Abraços,
Equipe AtenMed
```

---

### **PASSO 9: Agendar Call de Onboarding**

**Agenda da Call (30-45 minutos):**

1. **Boas-vindas** (5 min)
   - Apresentação da equipe
   - Confirmar que recebeu as credenciais
   
2. **Tour pela Plataforma** (15 min)
   - Dashboard do cliente
   - Como gerenciar agendamentos
   - Configurações da clínica
   - Personalização visual
   
3. **Funcionalidades Principais** (15 min)
   - Agendamento online: como funciona
   - WhatsApp automático: exemplos de conversas
   - Lembretes: quando são enviados
   - Google Calendar: sincronização
   
4. **Perguntas e Respostas** (5 min)

5. **Próximos Passos** (5 min)
   - Cadastrar médicos
   - Compartilhar link da página
   - Acompanhar estatísticas
   - Suporte disponível

---

### **PASSO 10: Atualizar CRM**

```bash
# Marcar lead como ativado
curl -X PUT http://localhost:3000/api/leads/LEAD_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -d '{
    "status": "fechado",
    "clinicaId": "ID_DA_CLINICA",
    "observacoes": "Cliente ativado em [data]. Call de onboarding realizada."
  }'
```

---

## 📊 Métricas de Sucesso

**Time to Value (TTV):** Tempo até cliente fazer primeiro agendamento
- Meta: < 7 dias

**Onboarding Completion Rate:** % de clientes que completam configuração
- Meta: > 90%

**First Month Churn:** % que cancela no primeiro mês
- Meta: < 5%

---

## 🆘 Troubleshooting

### Problema: WhatsApp não envia mensagens
**Solução:**
1. Verificar se Phone ID está correto
2. Verificar se token não expirou
3. Testar endpoint `/api/whatsapp/health`
4. Verificar logs do servidor

### Problema: Google Calendar não sincroniza
**Solução:**
1. Verificar se tokens OAuth são válidos
2. Refazer autenticação OAuth
3. Verificar permissões do calendário
4. Testar endpoint `/api/auth/google/status`

### Problema: Cliente não recebe email
**Solução:**
1. Verificar caixa de spam
2. Verificar se email está correto no cadastro
3. Verificar configuração SMTP
4. Reenviar credenciais manualmente

---

## 📞 Contatos de Suporte

**Emergências (Clientes VIP):**
- Telefone: (11) 99999-9999
- Email: urgente@atenmed.com.br

**Suporte Técnico:**
- Email: suporte@atenmed.com.br
- WhatsApp: (11) 98888-8888
- Horário: Seg-Sex, 9h-18h

**Comercial:**
- Email: vendas@atenmed.com.br
- WhatsApp: (11) 97777-7777

---

## 🔄 Processo de Renovação

1. **Dia 1 do mês:** Fatura gerada automaticamente
2. **Dia 5:** Email de lembrete enviado
3. **Dia 10:** Vencimento da fatura
4. **Dia 13:** 2º lembrete (3 dias após vencimento)
5. **Dia 17:** 3º lembrete (7 dias após vencimento)
6. **Dia 25:** Suspensão do serviço (15 dias de atraso)
7. **Dia 40:** Desativação completa (30 dias de atraso)

---

## ✅ Checklist Final de Ativação

Antes de considerar o onboarding completo, verificar:

- [ ] Clínica criada no sistema
- [ ] Usuário owner criado e senha enviada
- [ ] WhatsApp configurado e testado
- [ ] Google Calendar configurado e testado
- [ ] Página pública acessível
- [ ] Primeira fatura enviada
- [ ] Email de boas-vindas enviado
- [ ] Call de onboarding agendada e realizada
- [ ] Cliente fez login na plataforma
- [ ] Cliente cadastrou pelo menos 1 médico
- [ ] Primeiro agendamento de teste realizado
- [ ] CRM atualizado (lead marcado como fechado)
- [ ] Suporte informado sobre novo cliente

---

**Documento criado em:** Outubro 2024  
**Última atualização:** Outubro 2024  
**Versão:** 1.0

