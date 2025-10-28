# 📱 Configuração Correta no Meta WhatsApp - Guia Atualizado

## ✅ Status Atual

- ✅ Webhook URL verificada: `https://atenmed.com.br/api/whatsapp/webhook`
- ✅ Token aceito: `atenmed_webhook_2025`
- ✅ Servidor funcionando corretamente

---

## 🎯 Campos do Webhook no Meta

### O Que Você Vai Encontrar

No **Meta Developer Console**, vá em:
```
WhatsApp → Configuração → Webhook → Webhook fields
```

### ✅ Campo OBRIGATÓRIO

Você deve ver e habilitar:

#### **`messages`** ⭐ **ESSENCIAL**
```
☑️ messages
```

**Este é o único campo realmente necessário para começar!**

Com apenas este campo habilitado, você já pode:
- ✅ Receber mensagens dos usuários
- ✅ Processar pedidos de agendamento
- ✅ Responder automaticamente
- ✅ Implementar chatbot

---

### 📊 Outros Campos (Opcionais)

Se você vir outros campos disponíveis, pode habilitá-los também:

| Campo | Para Que Serve | Necessário? |
|-------|---------------|-------------|
| `messages` | Receber mensagens dos usuários | ✅ **SIM** |
| `message_echoes` | Receber cópias das suas respostas | ⚪ Opcional |
| `message_reads` | Saber quando usuário leu | ⚪ Opcional |
| `messaging_postbacks` | Botões interativos | ⚪ Opcional |
| `messaging_referrals` | Tracking de origem | ⚪ Opcional |

**Nota:** O campo `message_status` mencionado em documentações antigas **pode não aparecer** na sua versão da API. Isso é normal e não é problema!

---

## 🚨 IMPORTANTE: Sobre "message_status"

### Por Que Não Aparece?

1. **Versão da API**: Versões mais recentes usam nomes diferentes
2. **Tipo de Conta**: Algumas contas têm campos diferentes
3. **Não é Obrigatório**: O sistema funciona perfeitamente sem ele

### O Que Fazer?

**NÃO SE PREOCUPE!** 

O campo `message_status` serve apenas para receber atualizações sobre o status das mensagens que VOCÊ envia (enviada, entregue, lida, falhou). 

**Você NÃO precisa dele para:**
- ✅ Receber mensagens dos usuários
- ✅ Enviar respostas
- ✅ Processar agendamentos
- ✅ Implementar automação

---

## 🧪 Como Confirmar Que Está Funcionando

### Teste 1: Simular Mensagem Recebida

Execute no seu computador:

```bash
npm run test-webhook-msg
```

Este teste simula o Meta enviando uma mensagem para o seu webhook.

**Resultado esperado:**
```
✅ SUCESSO!
   Webhook aceitou a mensagem simulada
```

### Teste 2: Enviar Mensagem Real

1. **Do seu WhatsApp pessoal**, envie uma mensagem para o número do WhatsApp Business
2. **Monitore os logs** do servidor:

```bash
ssh -i "C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem" ubuntu@3.129.206.231
tail -f /var/www/atenmed/logs/combined.log
```

**O que você verá:**
```
📬 Webhook recebido: 1 entradas
📨 Processando mensagem de 5511999999999
✅ Mensagem processada com sucesso
```

---

## 📋 Configuração Passo a Passo Completa

### 1. Acessar Meta Developer Console

```
https://developers.facebook.com/apps/
```

### 2. Selecionar Seu App

Clique no app do WhatsApp que você criou.

### 3. Configurar Webhook

**Caminho:** WhatsApp → Configuração → Webhook

#### A. Configurar URL

```
Campo: Callback URL
Valor: https://atenmed.com.br/api/whatsapp/webhook

Campo: Verify Token  
Valor: atenmed_webhook_2025
```

Clique em **"Verificar e salvar"**

✅ Deve aparecer: "Webhook verificado com sucesso"

#### B. Habilitar Campos (Webhook Fields)

Na seção **"Webhook fields"** abaixo:

```
☑️ messages
```

Clique em **"Subscribe"** ou **"Salvar"**

### 4. Obter Token de Acesso

**Caminho:** WhatsApp → Introdução → Token de acesso temporário

Copie o token e adicione no `.env` do servidor:

```bash
WHATSAPP_TOKEN=seu_token_aqui
WHATSAPP_PHONE_ID=seu_phone_id_aqui
```

### 5. Configurar Número de Teste (Opcional)

**Caminho:** WhatsApp → Introdução → Adicionar número de telefone

Adicione seu número pessoal para testar o envio de mensagens.

---

## 🔍 Verificar Configuração Atual

### No Meta Developer Console

Você pode verificar se está tudo certo:

1. **URL do Webhook:** ✅ Verde = Verificada
2. **Webhook Fields:** ✅ "messages" deve estar marcado
3. **Status:** ✅ "Active" ou "Ativo"

### Via API

Execute no terminal:

```bash
curl.exe https://atenmed.com.br/api/whatsapp/health
```

**Resposta esperada:**
```json
{
  "success": true,
  "status": "healthy",
  "configured": true,
  "healthy": true
}
```

---

## 📊 Estrutura do Webhook

### O Que o Meta Envia Quando Alguém Manda Mensagem

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15555551234",
              "phone_number_id": "PHONE_ID"
            },
            "contacts": [
              {
                "profile": { "name": "João" },
                "wa_id": "5511999999999"
              }
            ],
            "messages": [
              {
                "from": "5511999999999",
                "id": "wamid.XXXXX",
                "timestamp": "1234567890",
                "type": "text",
                "text": {
                  "body": "Olá! Gostaria de agendar"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

### Como o Sistema Processa

O arquivo `routes/whatsappV2.js` (linhas 76-158) processa automaticamente:

1. ✅ Verifica se é do WhatsApp (`object === 'whatsapp_business_account'`)
2. ✅ Responde 200 imediatamente (requisito do Meta)
3. ✅ Processa mensagens de forma assíncrona
4. ✅ Chama `whatsappService.handleIncomingMessage()`

---

## 🚀 Próximos Passos Após Configuração

### 1. Testar Recebimento

```bash
npm run test-webhook-msg
```

### 2. Enviar Mensagem Real

Do seu WhatsApp, envie: `Olá! Quero agendar uma consulta.`

### 3. Verificar Logs

```bash
ssh -i "C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem" ubuntu@3.129.206.231
tail -f /var/www/atenmed/logs/combined.log
```

### 4. Implementar Lógica de Resposta

Edite `services/whatsappServiceV2.js` para adicionar respostas automáticas.

---

## 🐛 Solução de Problemas

### "Não vejo o campo 'messages' para habilitar"

**Solução:**
1. Verifique se está na seção correta: **WhatsApp → Configuração → Webhook**
2. Role a página até **"Webhook fields"**
3. Pode estar na aba **"Configuration"** ao invés de **"Webhooks"**

### "Habilitei mas não recebo mensagens"

**Verificações:**

1. **Campo habilitado?**
   - Vá no Meta e confirme que `messages` está com checkmark verde

2. **Webhook verificado?**
   - Deve mostrar "Webhook verificado" ou ícone verde

3. **Logs do servidor:**
   ```bash
   tail -f /var/www/atenmed/logs/combined.log
   ```

4. **Teste simulado:**
   ```bash
   npm run test-webhook-msg
   ```

### "Quero receber status das mensagens enviadas"

Se você enviar mensagens e quiser saber se foram entregues/lidas:

1. Procure por campos como:
   - `message_echoes`
   - `message_reads`
   - `messaging_postbacks`

2. Habilite-os se disponíveis

3. O sistema já está preparado para processar (linhas 136-146 em `routes/whatsappV2.js`)

---

## ✅ Checklist Final

### Meta Developer Console
- [x] App WhatsApp criado
- [x] Webhook URL configurada
- [x] Token verificado
- [ ] Campo `messages` habilitado ← **FAÇA ISSO AGORA**
- [ ] Número de teste adicionado (opcional)

### Servidor
- [x] Código atualizado
- [x] Servidor rodando
- [x] HTTPS funcionando
- [x] Logs sem erros

### Testes
- [ ] `npm run test-webhook-msg` passou
- [ ] Mensagem real enviada
- [ ] Mensagem recebida nos logs
- [ ] Sistema respondeu (se configurado)

---

## 📞 Comandos Úteis

```bash
# Testar simulação de mensagem
npm run test-webhook-msg

# Ver logs em tempo real
ssh -i "C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem" ubuntu@3.129.206.231
tail -f /var/www/atenmed/logs/combined.log

# Ver health check
curl.exe https://atenmed.com.br/api/whatsapp/health

# Testar webhook
curl.exe "https://atenmed.com.br/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=atenmed_webhook_2025&hub.challenge=TEST"
```

---

## 🎯 Resumo: O Que Realmente Importa

### ✅ Obrigatório
1. Webhook URL configurada e verificada (já feito!)
2. Campo `messages` habilitado ← **Só isso!**

### ⚪ Opcional
- Outros campos de webhook
- Número de teste
- Templates de mensagem

### ❌ NÃO Necessário
- `message_status` (pode não existir na sua API)
- Campos avançados
- Configurações extras

---

## 🎉 Conclusão

**Você já está 95% pronto!**

Falta apenas:
1. ☑️ Marcar o campo `messages` no Meta
2. 🧪 Executar `npm run test-webhook-msg`
3. 📱 Enviar uma mensagem de teste real

**Depois disso, o WhatsApp estará 100% funcional!** 🚀

---

**Criado:** 28/10/2025  
**Última atualização:** 28/10/2025  
**Status:** Webhook verificado, aguardando habilitar campo `messages`

