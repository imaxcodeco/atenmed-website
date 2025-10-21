# 📱 WhatsApp Business API - Guia de Configuração

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Configuração no Facebook](#configuração-no-facebook)
4. [Configuração no AtenMed](#configuração-no-atenmed)
5. [Configurar Webhook](#configurar-webhook)
6. [Testando a Integração](#testando-a-integração)
7. [Fluxo de Conversa](#fluxo-de-conversa)
8. [Comandos Disponíveis](#comandos-disponíveis)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O AtenMed integra com a **WhatsApp Business API** oficial da Meta (Facebook) para permitir:

- ✅ **Agendamento de consultas via WhatsApp** (bot conversacional)
- ✅ **Envio de lembretes automáticos** 24h e 1h antes da consulta
- ✅ **Confirmação de presença** via WhatsApp
- ✅ **Consulta de agendamentos** existentes
- ✅ **Cancelamento e reagendamento**
- ✅ **Fila de espera** para horários indisponíveis

---

## 📋 Pré-requisitos

### Necessário:

1. **Conta no Facebook Business Manager**
   - Acesse: [business.facebook.com](https://business.facebook.com)
   - Crie uma conta empresarial

2. **Número de telefone dedicado para WhatsApp Business**
   - Não pode estar sendo usado em nenhum WhatsApp (normal ou Business)
   - Recomendado: número virtual/empresarial

3. **Servidor com HTTPS ativo**
   - Necessário para receber webhooks
   - Pode usar ngrok para desenvolvimento

---

## 🚀 Configuração no Facebook

### Passo 1: Criar um App no Meta for Developers

1. Acesse [developers.facebook.com](https://developers.facebook.com)
2. Clique em **"Meus Apps"** → **"Criar App"**
3. Escolha o tipo: **"Negócios"**
4. Preencha:
   - Nome do app: `AtenMed WhatsApp`
   - Email de contato
   - Conta empresarial

### Passo 2: Adicionar o Produto WhatsApp

1. No painel do app, clique em **"Adicionar Produto"**
2. Selecione **"WhatsApp"** → **"Configurar"**
3. Siga o processo de configuração:
   - Selecione ou crie uma conta WhatsApp Business
   - Adicione um número de telefone

### Passo 3: Obter Credenciais

#### 3.1. Token de Acesso Temporário (Para Testes)

1. No painel WhatsApp → **"Começar"**
2. Copie o **Access Token** (válido por 24h)
3. Copie o **Phone Number ID**

#### 3.2. Token de Acesso Permanente (Produção)

1. Vá em **"Configurações"** → **"Básico"**
2. Copie o **App Secret**
3. Vá em **"Tokens de Acesso do Sistema"**
4. Gere um token permanente com as permissões:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`

### Passo 4: Verificar o Número

1. No painel WhatsApp, clique em **"Adicionar Número de Telefone"**
2. Escolha o método de verificação (SMS ou chamada)
3. Insira o código recebido
4. Aguarde aprovação (pode levar algumas horas)

---

## ⚙️ Configuração no AtenMed

### 1. Variáveis de Ambiente

Edite o arquivo `.env`:

```bash
# WhatsApp Business API Configuration
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_ID=123456789012345  # Phone Number ID do Meta
WHATSAPP_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Token de Acesso
WHATSAPP_VERIFY_TOKEN=atenmed_verify_token_2024  # Crie um token único
```

**Como obter cada valor:**

| Variável | Onde encontrar |
|----------|---------------|
| `WHATSAPP_PHONE_ID` | Meta → WhatsApp → Começar → Phone Number ID |
| `WHATSAPP_TOKEN` | Meta → WhatsApp → Configurações → Token de Acesso |
| `WHATSAPP_VERIFY_TOKEN` | Você cria um aleatório (ex: `atenmed_2024_secure_token`) |

### 2. Instalar Dependências

```bash
npm install
```

### 3. Iniciar o Servidor

```bash
npm start
```

---

## 🔗 Configurar Webhook

O webhook permite que o WhatsApp envie mensagens dos usuários para o seu servidor.

### Desenvolvimento Local (ngrok)

1. **Instalar ngrok:**
   ```bash
   npm install -g ngrok
   ```

2. **Expor servidor local:**
   ```bash
   ngrok http 3000
   ```

3. **Copiar URL HTTPS:**
   ```
   https://xxxx-xxx-xxx-xxx-xxx.ngrok-free.app
   ```

### Configurar no Meta

1. Vá em **Meta for Developers** → Seu App → **WhatsApp** → **Configuração**

2. Em **"Webhook"**, clique em **"Configurar"**

3. Preencha:
   - **URL de Callback:** `https://seu-dominio.com/api/whatsapp/webhook`
   - **Token de Verificação:** O mesmo valor que você colocou em `WHATSAPP_VERIFY_TOKEN`

4. Clique em **"Verificar e Salvar"**

5. Em **"Campos do Webhook"**, inscreva-se em:
   - ✅ `messages` (para receber mensagens)
   - ✅ `message_status` (para status de entrega)

### Produção

Configure o webhook para:
```
https://atenmed.com.br/api/whatsapp/webhook
```

---

## 🧪 Testando a Integração

### 1. Verificar Status da API

```bash
curl http://localhost:3000/api/whatsapp/health
```

Resposta esperada:
```json
{
  "success": true,
  "status": "configured",
  "message": "WhatsApp Business API está configurado"
}
```

### 2. Testar Envio de Mensagem

```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "message": "Olá! Teste de mensagem da AtenMed."
  }'
```

### 3. Testar Webhook

1. No Meta for Developers, vá em **WhatsApp** → **Configuração**
2. Role até **"Números de Telefone de Teste"**
3. Adicione seu número pessoal
4. Envie uma mensagem para o número configurado no WhatsApp

Você deverá receber uma resposta automática do bot!

---

## 💬 Fluxo de Conversa

### Estrutura do Bot

```
Início
  ├─ 1. Agendar Consulta
  │    ├─ Escolher Clínica
  │    ├─ Escolher Especialidade
  │    ├─ Escolher Médico
  │    ├─ Escolher Data
  │    ├─ Escolher Horário
  │    ├─ Informar Nome
  │    └─ Confirmar
  │
  ├─ 2. Consultar Agendamento
  │    └─ Mostrar agendamentos
  │
  ├─ 3. Cancelar Agendamento
  │    └─ Informar código → Cancelar
  │
  ├─ 4. Fila de Espera
  │    └─ Mesma árvore de agendamento
  │
  └─ 5. Falar com Atendente
       └─ Transferir para humano
```

### Exemplo de Conversa Real

```
👤 Usuário: oi
🤖 Bot: 👋 Olá! Bem-vindo à AtenMed!

Como posso ajudá-lo hoje?
1️⃣ Agendar consulta
2️⃣ Consultar agendamento
3️⃣ Cancelar agendamento
4️⃣ Entrar na fila de espera
5️⃣ Falar com atendente

👤 Usuário: 1

🤖 Bot: 🏥 Escolha a clínica:
1️⃣ AtenMed Centro
   📍 Rua Principal, 123
2️⃣ AtenMed Sul
   📍 Av. Paulista, 456

👤 Usuário: 1

🤖 Bot: 🩺 Escolha a especialidade:
1️⃣ Cardiologia
2️⃣ Clínica Geral
3️⃣ Odontologia

👤 Usuário: 2

🤖 Bot: 👨‍⚕️ Escolha o médico:
1️⃣ Dr. João Silva
2️⃣ Dra. Maria Oliveira
0️⃣ Qualquer médico disponível

👤 Usuário: 1

🤖 Bot: 📅 Consulta com Dr. João Silva
Por favor, informe a data desejada no formato DD/MM/AAAA:
Exemplo: 25/12/2024

👤 Usuário: 15/11/2024

🤖 Bot: 🕐 Horários disponíveis para 15/11/2024:
1️⃣ 09:00
2️⃣ 10:00
3️⃣ 14:00
4️⃣ 15:00

👤 Usuário: 2

🤖 Bot: 👤 Por favor, informe o nome completo do paciente:

👤 Usuário: João da Silva Santos

🤖 Bot: 📋 RESUMO DO AGENDAMENTO

👤 Paciente: João da Silva Santos
📞 Telefone: 5511999999999
🏥 Clínica: AtenMed Centro
🩺 Especialidade: Clínica Geral
👨‍⚕️ Médico: Dr. João Silva
📅 Data: 15/11/2024
🕐 Horário: 10:00

Confirmar agendamento?
1️⃣ Sim, confirmar
2️⃣ Não, cancelar

👤 Usuário: 1

🤖 Bot: ✅ AGENDAMENTO CONFIRMADO!

🎫 Código: A1B2C3

📅 Data: 15/11/2024
🕐 Horário: 10:00
🏥 Clínica: AtenMed Centro
👨‍⚕️ Médico: Dr. João Silva

Você receberá lembretes automáticos 24h e 1h antes da consulta.

Para cancelar ou reagendar, digite menu.

Até breve! 👋
```

---

## 🎮 Comandos Disponíveis

### Comandos Globais (funcionam em qualquer momento)

| Comando | Ação |
|---------|------|
| `menu` | Volta ao menu principal |
| `início` | Volta ao menu principal |
| `iniciar` | Volta ao menu principal |
| `cancelar` | Cancela a operação atual |

---

## 🔧 Troubleshooting

### ❌ Webhook não verifica

**Possíveis causas:**
- Token de verificação incorreto
- URL do webhook inacessível
- Firewall bloqueando requisições

**Solução:**
```bash
# 1. Verificar se o servidor está rodando
curl http://localhost:3000/api/whatsapp/health

# 2. Testar endpoint do webhook manualmente
curl "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=SEU_TOKEN&hub.challenge=12345"

# Deve retornar: 12345
```

### ❌ Mensagens não chegam no servidor

**Verificar:**
1. Webhook está inscrito nos eventos `messages`
2. Token de verificação está correto
3. URL está acessível externamente (usar ngrok para dev)
4. Logs do servidor (`npm run logs`)

### ❌ Não consigo enviar mensagens

**Possíveis causas:**
- Token expirado (tokens temporários duram 24h)
- Phone Number ID incorreto
- Número não verificado

**Solução:**
```bash
# Testar com curl
curl -X POST "https://graph.facebook.com/v18.0/SEU_PHONE_ID/messages" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "5511999999999",
    "type": "text",
    "text": { "body": "Teste" }
  }'
```

### ❌ Erro 403 Forbidden

- Verifique se o número está verificado
- Confirme que o Business Account está ativo
- Gere um novo token de acesso

---

## 📊 Monitoramento

### Verificar estatísticas

```bash
curl http://localhost:3000/api/whatsapp/stats
```

### Logs em tempo real

```bash
npm run logs
```

### Visualizar conversas ativas

As sessões são mantidas em memória por 30 minutos de inatividade.

---

## 🚀 Próximos Passos

1. ✅ Configure o webhook no Meta
2. ✅ Teste o bot enviando mensagens
3. ✅ Configure lembretes automáticos
4. ✅ Ative a fila de espera
5. 📊 Monitore métricas no dashboard de analytics

---

## 📚 Recursos Adicionais

- [Documentação Oficial WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Meta for Developers Console](https://developers.facebook.com)
- [Postman Collection para WhatsApp API](https://www.postman.com/meta)

---

## 🆘 Suporte

Em caso de dúvidas:
- 📧 Email: contato@atenmed.com.br
- 📱 WhatsApp: +55 11 99999-9999
- 🌐 Documentação: [docs.atenmed.com.br](https://docs.atenmed.com.br)

---

**AtenMed** - Organização Inteligente para Consultórios 🏥

