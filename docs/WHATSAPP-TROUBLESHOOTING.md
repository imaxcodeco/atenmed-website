# 🔧 WhatsApp Business API - Resolução de Problemas

## 🚨 Erro 403 Forbidden - SOLUCIONADO

### Problema
Ao tentar enviar mensagens ou configurar o webhook, você recebe erro **403 Forbidden**.

### Causas e Soluções

#### 1. ✅ Token Expirado ou Inválido

**Sintomas:**
- Erro 403 ao enviar mensagens
- Resposta da API: `"error": { "code": 190, "message": "Invalid OAuth access token" }`

**Solução:**

```bash
# 1. Gere um novo token PERMANENTE no Meta Developer
# Acesse: https://developers.facebook.com/apps/
# WhatsApp > API Setup > Gerar token permanente

# 2. Atualize o .env
nano .env

# 3. Substitua a linha:
WHATSAPP_TOKEN=seu_novo_token_aqui

# 4. Reinicie o servidor
pm2 restart atenmed

# 5. Teste
curl -X POST https://seu-dominio.com.br/api/whatsapp/send-test \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"phone": "5511999999999", "message": "Teste"}'
```

#### 2. ✅ Phone Number ID Incorreto

**Sintomas:**
- Erro 403 ao enviar mensagens
- Resposta: `"error": { "code": 100, "message": "Invalid parameter" }`

**Como obter o Phone Number ID correto:**

1. Acesse: https://developers.facebook.com/apps/
2. Selecione seu app
3. Vá em **WhatsApp** → **API Setup**
4. Copie o **Phone Number ID** (NÃO é o número de telefone!)
   - Exemplo correto: `123456789012345`
   - ❌ Errado: `+55 11 99999-9999`

```bash
# Atualize o .env
WHATSAPP_PHONE_ID=123456789012345  # ID numérico longo
```

#### 3. ✅ Permissões Insuficientes

**Sintomas:**
- Erro 403 em qualquer operação
- Resposta: `"error": { "code": 200, "message": "Permissions error" }`

**Solução:**

1. Acesse Meta Developer
2. Vá em **App Roles** → **Roles**
3. Adicione usuários com permissão de **Administrator** ou **Developer**
4. Vá em **WhatsApp** → **API Setup**
5. Verifique se tem acesso ao **Phone Number**

**Permissões necessárias:**
- ✅ `whatsapp_business_messaging`
- ✅ `whatsapp_business_management`

#### 4. ✅ Conta Não Verificada / Limitada

**Sintomas:**
- Erro 403 ao enviar para números que não estão na lista
- Resposta: `"error": { "code": 131031, "message": "Business account is restricted" }`

**Solução:**

**Modo Teste (Desenvolvimento):**
1. Acesse Meta Developer → WhatsApp → API Setup
2. Role até **"To"**
3. Adicione números de teste (máximo 5)
4. Envie código de verificação para cada número

**Modo Produção:**
1. Complete a verificação do seu negócio no Meta Business Manager
2. Siga o processo em: https://business.facebook.com/
3. Pode levar até 48 horas

#### 5. ✅ Rate Limiting da API

**Sintomas:**
- Erro 403 após enviar muitas mensagens
- Resposta: `"error": { "code": 131056, "message": "Rate limit hit" }`

**Limites da API:**
- **80 mensagens por segundo**
- **1.000 mensagens por minuto**
- **10.000 mensagens por hora** (contas não verificadas)
- **100.000 mensagens por dia** (contas verificadas)

**Solução:**

A nova versão V2 já implementa rate limiting automático!

```javascript
// O serviço V2 usa Bottleneck para respeitar os limites
// Configurado para 77 mensagens por segundo (margem de segurança)
```

Se ainda assim atingir o limite:
1. Aguarde alguns minutos
2. Use a fila de mensagens (habilite Redis)
3. Distribua envios ao longo do tempo

---

## 🔒 Erro 401 Unauthorized

### Causa
Token de autenticação completamente inválido ou ausente.

### Solução

```bash
# 1. Verifique se o token está configurado
cat .env | grep WHATSAPP_TOKEN

# 2. Se estiver vazio ou errado, configure:
nano .env
# Adicione: WHATSAPP_TOKEN=seu_token_aqui

# 3. Reinicie
pm2 restart atenmed
```

---

## 📛 Erro 400 Bad Request

### Causa
Parâmetros inválidos na requisição.

### Possíveis Problemas

#### Número de Telefone Inválido

```javascript
// ❌ ERRADO
const phone = "+55 (11) 99999-9999";
const phone = "11999999999"; // Sem código do país

// ✅ CORRETO
const phone = "5511999999999"; // Código do país + DDD + número
```

#### Mensagem Vazia ou Muito Longa

- Máximo: **4096 caracteres**
- Mínimo: **1 caractere**

```javascript
// ❌ ERRADO
await sendMessage(phone, ""); // Vazio
await sendMessage(phone, "a".repeat(5000)); // Muito longo

// ✅ CORRETO
await sendMessage(phone, "Olá! Tudo bem?");
```

---

## 🌐 Webhook Não Recebe Mensagens

### Diagnóstico

```bash
# 1. Teste a URL manualmente
curl "https://seu-dominio.com.br/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=SEU_TOKEN&hub.challenge=teste123"

# Deve retornar: teste123
```

### Checklist

- [ ] **HTTPS configurado** (certificado SSL válido)
  ```bash
  curl -I https://seu-dominio.com.br
  # Deve retornar 200 OK sem erros de SSL
  ```

- [ ] **URL acessível externamente**
  ```bash
  # De FORA do servidor
  curl https://seu-dominio.com.br/api/whatsapp/health
  ```

- [ ] **Porta 443 aberta**
  ```bash
  # No servidor
  sudo ufw status
  # Deve mostrar: 443/tcp ALLOW
  
  # Se não estiver aberta:
  sudo ufw allow 443/tcp
  ```

- [ ] **Token de verificação correto**
  ```bash
  # Verifique no .env
  grep WHATSAPP_VERIFY_TOKEN .env
  
  # Deve ser EXATAMENTE o mesmo que você colocou no Meta
  ```

- [ ] **Webhook inscrito em "messages"**
  - Meta Developer → WhatsApp → Configuração → Webhooks
  - Webhook fields: `messages` deve estar ✅ marcado

### Logs para Debug

```bash
# Ver logs em tempo real
pm2 logs atenmed

# Quando o Meta tentar verificar o webhook, você verá:
# 📱 Tentativa de verificação de webhook WhatsApp
#    Mode: subscribe
#    Token: ***...
#    Challenge: ...
# ✅ Webhook verificado com sucesso
```

---

## 📨 Mensagens Não Estão Sendo Entregues

### Verificar Status

O novo serviço V2 loga automaticamente o status das mensagens:

```bash
pm2 logs atenmed | grep "Status de mensagem"

# Possíveis status:
# - sent: Enviada para o WhatsApp
# - delivered: Entregue ao destinatário
# - read: Lida pelo destinatário
# - failed: Falhou ❌
```

### Causas Comuns

#### 1. Número Não Tem WhatsApp

```
Error: "RECIPIENT_NOT_REGISTERED"
```

**Solução:** Verifique se o número tem WhatsApp ativo.

#### 2. Número Bloqueou seu Negócio

```
Error: "CONTACT_BLOCKED"
```

**Solução:** Usuário bloqueou seu número. Não é possível enviar.

#### 3. Janela de 24h Expirou

Você só pode enviar mensagens de template fora da janela de 24h.

**Solução:**
- Dentro de 24h da última mensagem do usuário: qualquer mensagem
- Fora da janela: apenas templates aprovados pelo Meta

---

## 🔄 Sistema de Retry (V2)

A versão V2 implementa retry automático com **exponential backoff**:

```
Tentativa 1: Imediato
Tentativa 2: 2 segundos depois
Tentativa 3: 4 segundos depois
```

### Ver Mensagens na Fila (com Redis)

Se você tem Redis configurado, acesse:

```
https://seu-dominio.com.br/admin
```

Dashboard mostra:
- Mensagens na fila
- Mensagens processadas
- Mensagens que falharam
- Opção de reprocessar

---

## 🧪 Testar Tudo de Uma Vez

Use este script para testar toda a configuração:

```bash
#!/bin/bash

echo "=== TESTE DE CONFIGURAÇÃO WHATSAPP ==="

# 1. Health Check
echo "1. Health Check..."
curl -s https://seu-dominio.com.br/api/whatsapp/health | jq

# 2. Webhook Verification
echo "2. Webhook Verification..."
TOKEN=$(grep WHATSAPP_VERIFY_TOKEN .env | cut -d= -f2)
curl -s "https://seu-dominio.com.br/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=$TOKEN&hub.challenge=teste"

# 3. Config (Admin)
echo "3. Config Check..."
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://seu-dominio.com.br/api/whatsapp/config | jq

# 4. Teste de Envio
echo "4. Envio de Teste..."
curl -X POST https://seu-dominio.com.br/api/whatsapp/send-test \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phone": "SEU_NUMERO", "message": "Teste automático"}' | jq

echo "=== FIM DOS TESTES ==="
```

---

## 📞 Suporte Meta/WhatsApp

### Links Úteis

- **Developer Dashboard:** https://developers.facebook.com/apps/
- **Business Manager:** https://business.facebook.com/
- **Status da API:** https://status.fb.com/
- **Documentação:** https://developers.facebook.com/docs/whatsapp
- **Fórum de Suporte:** https://developers.facebook.com/community/

### Obter Ajuda do Meta

1. Acesse o Developer Dashboard
2. Selecione seu app
3. Canto superior direito: **"Get Support"**
4. Descreva seu problema com:
   - App ID
   - Phone Number ID
   - Código do erro
   - Timestamp do erro
   - Request ID (se disponível)

---

## 💡 Dicas Adicionais

### 1. Sempre Use HTTPS em Produção

```bash
# Verificar certificado SSL
sudo certbot certificates

# Renovar se necessário
sudo certbot renew
```

### 2. Monitore os Logs

```bash
# Ver apenas erros
pm2 logs atenmed --err

# Ver apenas erros do WhatsApp
pm2 logs atenmed | grep -i whatsapp | grep -i erro
```

### 3. Configure Alertas

Use um serviço como UptimeRobot para monitorar:

```
GET https://seu-dominio.com.br/api/whatsapp/health

Alerta se status != 200
```

### 4. Backup das Conversas

O estado das conversas é armazenado em memória. Em produção, considere:

- Salvar estado no Redis
- Persistir conversas importantes no MongoDB
- Fazer backup regular do banco

### 5. Rate Limiting Personalizado

Se precisar ajustar o rate limiting:

```javascript
// Em services/whatsappServiceV2.js

const limiter = new Bottleneck({
    reservoir: 80, // Número de mensagens por janela
    reservoirRefreshAmount: 80,
    reservoirRefreshInterval: 1000, // 1 segundo
    maxConcurrent: 10, // Requisições simultâneas
    minTime: 13 // Mínimo entre requisições (ms)
});
```

---

**Última atualização:** 27/10/2025  
**Versão:** 2.0  

**Precisa de mais ajuda?** Consulte `docs/WHATSAPP-V2-SETUP.md` para setup completo.









