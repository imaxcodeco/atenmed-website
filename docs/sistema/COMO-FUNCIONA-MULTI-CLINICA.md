# 🏥 Como Funciona o Sistema Multi-Clínica WhatsApp

## 📱 Como o WhatsApp da Clínica Recebe as Automações?

### **Conceito Importante:**

O **WhatsApp Business API** funciona como uma **centralizadora**. Você cadastra todos os números no mesmo app WhatsApp Business, e o sistema identifica automaticamente qual clínica está sendo contatada.

---

## 🔄 Fluxo Completo:

```
Cliente envia mensagem → WhatsApp Business API → Webhook AtenMed → Sistema identifica a clínica → Resposta personalizada
```

### **Passo a Passo do Fluxo:**

1. **Cliente manda mensagem** para o WhatsApp da Clínica A (ex: `11 98765-4321`)
2. **WhatsApp Business API** recebe a mensagem
3. **Meta envia webhook** para `https://atenmed.com.br/api/whatsapp/webhook`
4. **Sistema AtenMed identifica:**
   - Número que **recebeu** a mensagem: `11 98765-4321`
   - Busca no banco: Qual clínica tem esse número?
   - Encontra: "Clínica A"
5. **Resposta personalizada:**
   - Nome da clínica: "Clínica A"
   - Apenas médicos da Clínica A
   - Apenas especialidades da Clínica A
6. **Agendamento** vinculado à Clínica A

---

## ⚙️ Como Configurar (Passo a Passo)

### **Passo 1: Cadastrar Clínica no Sistema**

1. Acesse: `https://atenmed.com.br/apps/admin/clinicas.html`
2. Clique em **"+ Nova Clínica"**
3. Preencha:
   - **Nome:** Clínica São Paulo
   - **WhatsApp:** `11987654321` (ou qualquer formato)
   - Outros dados...
4. ✅ Marque **"Habilitar Bot WhatsApp"**
5. ✅ Marque **"Clínica Ativa"**
6. Salvar

**Importante:** O número WhatsApp cadastrado aqui é o que o sistema vai usar para identificar a clínica!

---

### **Passo 2: Adicionar Número no WhatsApp Business API**

#### **Opção A: WhatsApp Business API (Cloud API - Recomendado)**

1. **Acesse:** https://developers.facebook.com/apps/
2. **Selecione** seu app WhatsApp Business
3. **Vá em:** WhatsApp > Phone Numbers
4. **Adicione o número** da clínica:
   - Clique em **"Add phone number"**
   - Insira: `+55 11 98765-4321`
   - Verifique o número (SMS ou chamada)
5. **Configure o mesmo webhook** para todos os números:
   - Callback URL: `https://atenmed.com.br/api/whatsapp/webhook`
   - Verify Token: `atenmed_webhook_2025`
   - Subscribe to: `messages`

#### **Opção B: WhatsApp Business API (On-Premise)**

Se você usa API própria, configure todos os números para apontar para o mesmo webhook.

---

### **Passo 3: Configurar Médicos e Especialidades**

Para que a clínica tenha médicos disponíveis:

```javascript
// No MongoDB ou via script
db.doctors.insertOne({
  name: "Dr. João Silva",
  clinic: ObjectId("507f1f77bcf86cd799439011"), // ID da clínica
  specialties: [ObjectId("specialtyId")],
  active: true,
  crm: {
    number: "123456",
    state: "SP"
  }
});
```

**Importante:** Vincule os médicos à clínica usando o campo `clinic`!

---

## 🧪 Como Testar e Verificar

### **Teste 1: Verificar se a Clínica Está Cadastrada**

```bash
# Via API
curl -H "Authorization: Bearer SEU_TOKEN" \
  https://atenmed.com.br/api/clinics

# Ou acesse:
https://atenmed.com.br/apps/admin/clinicas.html
```

**Deve mostrar:**
- Nome da clínica
- Número WhatsApp
- Status: Ativa
- Bot WhatsApp: Habilitado

---

### **Teste 2: Enviar Mensagem de Teste**

1. **Do seu celular**, envie mensagem para o número da clínica:
   ```
   Oi
   ```

2. **O bot deve responder:**
   ```
   Boa tarde! Tudo bem? Aqui é da Clínica São Paulo!
   Como posso te ajudar hoje?
   
   1 Quero marcar uma consulta
   2 Ver minhas consultas agendadas
   ...
   ```

**Note:** O nome da clínica aparece na mensagem!

---

### **Teste 3: Verificar Logs do Sistema**

```bash
# Conectar ao servidor
ssh -i "C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem" ubuntu@3.129.206.231

# Ver logs em tempo real
pm2 logs atenmed --lines 100

# Filtrar logs de identificação de clínica
pm2 logs atenmed | grep "Clinica identificada"
```

**Deve aparecer:**
```
Mensagem recebida de 5511999999999: oi
Clinica identificada: Clínica São Paulo (507f1f77bcf86cd799439011)
Direcionada para: Clínica São Paulo
```

---

### **Teste 4: Verificar Webhook**

```bash
# Testar webhook
curl "https://atenmed.com.br/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=atenmed_webhook_2025&hub.challenge=TEST123"

# Deve retornar:
TEST123
```

---

## 🔍 Como o Sistema Identifica a Clínica?

### **Código Implementado:**

```javascript
// services/whatsappServiceV2.js

async function identifyClinicByNumber(toNumber) {
    // Limpar número
    const cleanNumber = toNumber.replace(/\D/g, '');
    
    // Buscar no banco de dados
    const clinic = await Clinic.findOne({
        'contact.whatsapp': new RegExp(cleanNumber, 'i'),
        active: true
    });
    
    if (clinic) {
        logger.info(`Clinica identificada: ${clinic.name}`);
        return clinic;
    }
    
    return null; // Clínica não encontrada
}

// Quando recebe mensagem
async function handleIncomingMessage(message, webhookMetadata) {
    // Pega o número que RECEBEU a mensagem
    const toNumber = webhookMetadata?.phone_number_id || WHATSAPP_PHONE_ID;
    
    // Identifica qual clínica
    const clinic = await identifyClinicByNumber(toNumber);
    
    if (clinic) {
        // Mensagem personalizada com nome da clínica
        await sendWelcomeMessage(phoneNumber, clinic);
        
        // Filtra médicos da clínica
        await listSpecialties(phoneNumber, clinic._id);
    }
}
```

---

## 📊 Estrutura do Webhook

Quando o Meta envia mensagem, vem assim:

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "metadata": {
          "phone_number_id": "123456789", // ← Número que RECEBEU
          "display_phone_number": "+55 11 98765-4321"
        },
        "messages": [{
          "from": "5511999999999", // ← Número que ENVIOU
          "text": {
            "body": "Oi"
          }
        }]
      }
    }]
  }]
}
```

**O sistema usa:**
- `phone_number_id` → Para identificar a clínica
- `from` → Para identificar o paciente

---

## ⚠️ Problemas Comuns e Soluções

### **Problema 1: Bot não identifica a clínica**

**Sintoma:**
```
Mensagem recebida de 5511999999999: oi
Nenhuma clinica encontrada para o numero: 11987654321
```

**Solução:**
1. Verificar se a clínica está **ativa**
2. Verificar se o número está **correto** no cadastro
3. O sistema remove caracteres especiais automaticamente

```javascript
// Testa no MongoDB
db.clinics.find({ 'contact.whatsapp': /11987654321/i })
```

---

### **Problema 2: Mensagem não chega no webhook**

**Sintoma:** Nenhum log aparece quando envia mensagem

**Solução:**
1. Verificar se o webhook está configurado no Meta
2. Testar webhook manualmente:
   ```bash
   curl -X POST https://atenmed.com.br/api/whatsapp/webhook \
     -H "Content-Type: application/json" \
     -d '{
       "object": "whatsapp_business_account",
       "entry": [{
         "changes": [{
           "value": {
             "metadata": {"phone_number_id": "11987654321"},
             "messages": [{
               "from": "5511999999999",
               "text": {"body": "teste"}
             }]
           }
         }]
       }]
     }'
   ```

---

### **Problema 3: Resposta genérica ao invés de personalizada**

**Sintoma:** Bot responde "AtenMed" ao invés do nome da clínica

**Causa:** Clínica não foi identificada

**Solução:**
1. Verificar formato do número no banco
2. Verificar se `phone_number_id` está vindo no webhook
3. Verificar logs:
   ```bash
   pm2 logs atenmed | grep -i "clinica"
   ```

---

## 📱 Cenário Real de Uso

### **Clínica 1 - São Paulo:**
- **Número:** `+55 11 98765-4321`
- **Cadastrado no sistema:** `11987654321`
- **Médicos:** Dr. João (Cardiologia), Dra. Maria (Ortopedia)

### **Clínica 2 - Rio de Janeiro:**
- **Número:** `+55 21 99999-8888`
- **Cadastrado no sistema:** `21999998888`
- **Médicos:** Dr. Pedro (Pediatria), Dra. Ana (Clínica Geral)

### **Conversa Real:**

**Cliente 1 (manda para 11 98765-4321):**
```
Cliente: Oi
Bot: Boa tarde! Tudo bem? Aqui é da Clínica São Paulo!
     Como posso te ajudar?
     
Cliente: 1 (marcar consulta)
Bot: Legal! Vamos agendar sua consulta!
     Qual especialidade voce precisa?
     
     1 Cardiologia
     2 Ortopedia
     
Cliente: 1
Bot: Otimo! Temos 1 profissional disponivel:
     
     1 Dr. João Silva
        CRM: 123456/SP
```

**Cliente 2 (manda para 21 99999-8888):**
```
Cliente: Oi
Bot: Boa tarde! Tudo bem? Aqui é da Clínica Rio de Janeiro!
     Como posso te ajudar?
     
Cliente: 1
Bot: Legal! Vamos agendar sua consulta!
     Qual especialidade voce precisa?
     
     1 Pediatria
     2 Clínica Geral
```

**Viu a diferença?** Cada clínica tem sua própria automação personalizada!

---

## ✅ Checklist de Verificação

- [ ] Clínica cadastrada no sistema com número WhatsApp
- [ ] Clínica marcada como "Ativa"
- [ ] Bot WhatsApp habilitado para a clínica
- [ ] Número adicionado no WhatsApp Business API (Meta)
- [ ] Webhook configurado para o número
- [ ] Médicos vinculados à clínica no banco de dados
- [ ] Especialidades cadastradas
- [ ] Teste: Enviar "Oi" para o número da clínica
- [ ] Verificação: Nome da clínica aparece na resposta
- [ ] Verificação: Apenas médicos da clínica aparecem

---

## 🎯 Resumo

**Como funciona:**
1. Você cadastra várias clínicas no sistema
2. Cada clínica tem seu próprio número WhatsApp
3. Todos os números apontam para o mesmo webhook
4. O sistema identifica automaticamente qual clínica pelo número que recebeu
5. Resposta personalizada com nome e dados da clínica
6. Agendamento vinculado à clínica correta

**É como ter vários bots, mas usando um único sistema!** 🚀

---

**Dúvidas?** Consulte os logs ou teste com mensagens reais!

**Última atualização:** 28 de outubro de 2025

