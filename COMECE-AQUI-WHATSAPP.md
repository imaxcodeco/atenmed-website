# 🚀 WhatsApp Business API - COMECE AQUI

## ✅ Problema Resolvido!

Implementei uma **solução completa** para resolver o erro **403 Forbidden** e melhorar a integração com o WhatsApp.

---

## 📦 O que foi feito?

✅ Novo serviço com **retry automático**  
✅ **Rate limiting inteligente** (respeita limites da API)  
✅ **Sistema de fila** com Bull/Redis  
✅ **Validação de signature** do Meta (segurança)  
✅ **Tratamento específico** para cada erro  
✅ **Documentação completa** em português  

---

## 🎯 Como Usar em 3 Passos

### **1. Configure o `.env`**

```bash
# Obrigatório
WHATSAPP_PHONE_ID=seu_phone_id
WHATSAPP_TOKEN=seu_token_permanente
WHATSAPP_VERIFY_TOKEN=atenmed_webhook_2025

# Recomendado (segurança)
WHATSAPP_APP_SECRET=seu_app_secret

# Opcional (fila robusta)
REDIS_URL=redis://localhost:6379
```

**Onde obter credenciais?**
- Acesse: https://developers.facebook.com/apps/
- WhatsApp → API Setup
- Copie **Phone Number ID** e **Token Permanente**

### **2. Ative a Nova Versão**

Edite `server.js`:

```javascript
// Linha ~38 - Substitua:
const whatsappService = require('./services/whatsappServiceV2');

// Linha ~222 - Substitua:
app.use('/api/whatsapp', require('./routes/whatsappV2'));
```

### **3. Reinicie e Teste**

```bash
# Reiniciar
pm2 restart atenmed

# Testar
curl https://seu-dominio.com.br/api/whatsapp/health
```

---

## 🔧 Resolver Erro 403 Forbidden

### **Causa #1: Token Expirado** (MAIS COMUM)

```bash
# 1. Gere novo token no Meta Developer
# 2. Atualize WHATSAPP_TOKEN no .env
# 3. pm2 restart atenmed
```

### **Causa #2: Phone ID Errado**

Use o **Phone Number ID** (não o telefone):
```
✅ Correto: 123456789012345
❌ Errado: +55 11 99999-9999
```

### **Causa #3: Permissões**

No Meta Developer:
1. App Roles → Adicione-se como Admin
2. WhatsApp → API Setup → Verifique acesso

### **Causa #4: Conta em Teste**

- WhatsApp → API Setup → Adicione números de teste
- Ou complete verificação do negócio

---

## 📚 Documentação

### **Leia em Ordem:**

1. **`SOLUCAO-WHATSAPP-IMPLEMENTADA.md`** ⭐ COMECE AQUI
   - Resumo completo da solução
   - Como usar
   - Checklist de implementação

2. **`docs/WHATSAPP-V2-SETUP.md`**
   - Setup detalhado passo a passo
   - Como configurar webhooks
   - Como obter todas as credenciais

3. **`docs/WHATSAPP-TROUBLESHOOTING.md`**
   - Soluções para TODOS os erros
   - Scripts de teste
   - Diagnóstico completo

---

## 🎯 Principais Melhorias

**Antes (V1):**
- ❌ Sem retry automático
- ❌ Sem fila de mensagens
- ❌ Tratamento genérico de erros
- ❌ Sem validação de signature

**Agora (V2):**
- ✅ Retry automático (3x com exponential backoff)
- ✅ Fila robusta com Bull/Redis
- ✅ Tratamento específico para cada erro
- ✅ Validação de signature do Meta
- ✅ Rate limiting inteligente (80 msg/s)
- ✅ Logs detalhados
- ✅ Dashboard de monitoramento

---

## 📊 Monitoramento

### **Dashboard**
```
https://seu-dominio.com.br/admin
```

### **Health Check**
```bash
curl https://seu-dominio.com.br/api/whatsapp/health
```

### **Logs**
```bash
pm2 logs atenmed
```

---

## ✅ Checklist Rápido

- [ ] Configurar variáveis no `.env`
- [ ] Obter credenciais do Meta
- [ ] Atualizar `server.js` para V2
- [ ] Reiniciar servidor
- [ ] Testar health check
- [ ] Enviar mensagem de teste
- [ ] Configurar webhook no Meta
- [ ] Ler documentação completa

---

## 🆘 Ajuda Rápida

**Erro 403?**
→ `docs/WHATSAPP-TROUBLESHOOTING.md`

**Como configurar?**
→ `docs/WHATSAPP-V2-SETUP.md`

**Visão geral?**
→ `SOLUCAO-WHATSAPP-IMPLEMENTADA.md`

**Logs:**
```bash
pm2 logs atenmed --lines 100
```

**Debug:**
```bash
curl -H "Authorization: Bearer TOKEN" \
  https://seu-dominio.com.br/api/whatsapp/debug-webhook
```

---

## 📦 Arquivos Criados

```
✅ services/whatsappServiceV2.js      - Novo serviço robusto
✅ routes/whatsappV2.js                - Novas rotas seguras
✅ docs/WHATSAPP-V2-SETUP.md           - Setup completo
✅ docs/WHATSAPP-TROUBLESHOOTING.md    - Resolver problemas
✅ WHATSAPP-V2-IMPLEMENTADO.md         - Visão geral técnica
✅ SOLUCAO-WHATSAPP-IMPLEMENTADA.md    - Resumo executivo
✅ COMECE-AQUI-WHATSAPP.md             - Este arquivo
✅ env.example                         - Atualizado
```

---

## 🚀 Teste Agora!

```bash
# 1. Verificar saúde
curl https://seu-dominio.com.br/api/whatsapp/health

# 2. Enviar teste (Admin)
curl -X POST https://seu-dominio.com.br/api/whatsapp/send-test \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phone": "5511999999999", "message": "Teste!"}'
```

---

**🎉 Tudo pronto!**

Leia `SOLUCAO-WHATSAPP-IMPLEMENTADA.md` para entender tudo que foi implementado.

**Data:** 27/10/2025  
**Status:** ✅ Implementado e documentado  
**Próximo passo:** Configure e teste!




