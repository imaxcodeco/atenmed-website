# 🚀 Configuração Automática do Meta WhatsApp

## 📱 **Como Funciona**

Agora você pode **gerar instruções automáticas** para configurar números WhatsApp no Meta diretamente pelo dashboard!

---

## ✨ **Nova Funcionalidade**

### **Botão "⚙️ Meta" em Cada Clínica**

Ao cadastrar uma clínica com número WhatsApp, você verá um botão azul **"⚙️ Meta"** que:

1. **Verifica automaticamente** se o número já está registrado no Meta
2. **Gera instruções passo a passo** personalizadas
3. **Fornece links diretos** para o Meta Developer Console
4. **Copia configurações prontas** (Webhook URL, Token, Número formatado)
5. **Estima tempo** de configuração (5-10 minutos)

---

## 🎯 **Como Usar**

### **Passo 1: Cadastrar Clínica**
```
1. Acesse: https://atenmed.com.br/dashboard/clinicas.html
2. Clique em "Nova Clínica"
3. Preencha os dados (incluindo número WhatsApp)
4. Salve a clínica
```

### **Passo 2: Clicar no Botão "⚙️ Meta"**
```
1. No card da clínica, clique no botão azul "⚙️ Meta"
2. Um modal abrirá com todas as instruções
```

### **Passo 3: Copiar Configurações**
```
O modal mostra:
✅ Número formatado para copiar (+55 11 98765-4321)
✅ Webhook URL completa
✅ Token de verificação
✅ Links diretos para o Meta
✅ Passo a passo detalhado
```

### **Passo 4: Executar no Meta**
```
1. Clique no botão "Abrir Meta Developer Console"
2. Copie e cole as configurações fornecidas
3. Verifique o número (SMS ou chamada)
4. Configure o webhook
5. Pronto! 🎉
```

---

## 🔧 **Detalhes Técnicos**

### **API Endpoints Criados:**

#### **GET /api/clinics/:id/meta-setup**
Retorna instruções personalizadas:
```json
{
  "success": true,
  "data": {
    "clinic": {
      "id": "...",
      "name": "Clínica Exemplo",
      "whatsapp": "11987654321"
    },
    "instructions": {
      "steps": [...],
      "estimatedTime": "5-10 minutos",
      "difficulty": "Fácil"
    },
    "quickConfig": {
      "phoneNumber": "+55 11 98765-4321",
      "webhookUrl": "https://atenmed.com.br/api/whatsapp/webhook",
      "verifyToken": "atenmed_webhook_2025"
    },
    "registrationStatus": {
      "registered": false,
      "message": "..."
    }
  }
}
```

#### **POST /api/clinics/:id/meta-register**
Tenta registrar número automaticamente (requer configuração):
```json
{
  "success": false,
  "data": {
    "manualRegistrationRequired": true,
    "message": "Configure META_ACCESS_TOKEN para registro automático"
  }
}
```

### **Serviço Criado:**
`services/metaWhatsappService.js`
- `generateMetaInstructions()` - Gera instruções
- `formatPhoneForMeta()` - Formata número
- `checkNumberRegistration()` - Verifica se registrado
- `registerNumberAutomatic()` - Tenta registrar (se configurado)
- `generateQuickConfig()` - Gera config pronta

---

## 🔐 **Registro Automático (Opcional)**

Se você quiser **automação completa** (sem copiar/colar), configure:

### **1. Obter Token de Longa Duração do Meta**
```bash
# Acesse:
https://developers.facebook.com/tools/accesstoken/

# Gere um token de longa duração (60 dias)
# Copie o token
```

### **2. Adicionar ao .env do Servidor**
```bash
# Conecte ao servidor
ssh -i "site-atenmed.pem" ubuntu@3.129.206.231

# Edite o .env
nano /var/www/atenmed/.env

# Adicione:
META_ACCESS_TOKEN=seu_token_aqui
WHATSAPP_BUSINESS_ACCOUNT_ID=seu_business_account_id
META_APP_ID=seu_app_id
```

### **3. Reiniciar Servidor**
```bash
pm2 restart atenmed
```

### **4. Agora o Botão "Meta" Tentará Registrar Automaticamente**
⚠️ **Nota:** Mesmo com automação, **verificação do número por SMS** ainda é necessária!

---

## ⚠️ **Limitações do Registro Automático**

Por mais que a API do Meta permita **tentar** registrar números automaticamente:

❌ **Você ainda precisa:**
1. Ter o número fisicamente disponível (para receber SMS)
2. Verificar manualmente o código SMS
3. Ter permissões corretas no Business Manager
4. Aguardar aprovação do Meta (pode levar horas)

✅ **Mas a plataforma facilita:**
1. Gerando todas as configurações automaticamente
2. Formatando o número corretamente
3. Fornecendo links diretos
4. Copiando tudo com um clique
5. Validando a configuração

---

## 🎯 **Fluxo Completo**

```
┌─────────────────────┐
│ Cadastrar Clínica   │
│ no Dashboard        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Clicar "⚙️ Meta"   │
│ no card da clínica  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Modal com           │
│ Instruções          │
│ + Configs           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Copiar número,      │
│ webhook URL,        │
│ verify token        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Abrir Meta          │
│ Developer Console   │
│ (link automático)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Colar configs       │
│ Verificar número    │
│ (SMS/chamada)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ ✅ Pronto!         │
│ Bot ativo!          │
└─────────────────────┘
```

---

## 🧪 **Testar Agora**

```bash
# 1. Acesse o dashboard
https://atenmed.com.br/dashboard/clinicas.html

# 2. Crie uma clínica de teste
Nome: Clínica Teste
WhatsApp: 11987654321

# 3. Clique no botão "⚙️ Meta"

# 4. Veja as instruções automáticas! 🎉
```

---

## 📞 **Exemplo de Modal Gerado**

```
╔════════════════════════════════════════╗
║   ⚙️ Configurar no Meta WhatsApp      ║
╠════════════════════════════════════════╣
║                                        ║
║   📱 Clínica Exemplo                   ║
║   Número: 11987654321                  ║
║                                        ║
║   ⚠️ Número precisa ser registrado     ║
║                                        ║
║   🔗 Links Rápidos:                    ║
║   [Abrir Meta Developer Console]       ║
║                                        ║
║   📋 Configurações para Copiar:        ║
║                                        ║
║   Número (formatado):                  ║
║   +55 11 98765-4321                    ║
║   [📋 Copiar Número]                   ║
║                                        ║
║   Webhook URL:                         ║
║   https://atenmed.com.br/api/...       ║
║   [📋 Copiar URL]                      ║
║                                        ║
║   Verify Token:                        ║
║   atenmed_webhook_2025                 ║
║   [📋 Copiar Token]                    ║
║                                        ║
║   📝 Passo a Passo:                    ║
║   1. Acessar Meta Developer Console    ║
║   2. Selecionar seu App WhatsApp       ║
║   3. Ir para Phone Numbers             ║
║   4. Adicionar Número                  ║
║   5. Verificar Número                  ║
║   6. Configurar Webhook                ║
║   7. Testar Configuração               ║
║                                        ║
║   ⏱️ Tempo estimado: 5-10 minutos      ║
║   💡 Dificuldade: Fácil                ║
║                                        ║
║   [Fechar]                             ║
╚════════════════════════════════════════╝
```

---

## ✅ **Vantagens**

✅ **Sem copiar/colar manual** de múltiplos lugares  
✅ **Links diretos** para cada passo  
✅ **Validação automática** do número  
✅ **Configurações sempre corretas**  
✅ **Formatação automática** do número  
✅ **Interface intuitiva**  
✅ **Tempo economizado**: de 20 min para 5 min  

---

## 🚀 **Próximos Passos**

Após configurar o número no Meta, **o bot já funciona automaticamente**:

1. Mensagens para aquele número → direcionadas para a clínica
2. Bot responde com o nome da clínica
3. Especialidades/médicos filtrados por clínica
4. Agendamentos vinculados à clínica correta

**Tudo automático!** 🎉

---

**Desenvolvido por AtenMed** 💙  
*Simplificando a gestão de clínicas no Brasil*

