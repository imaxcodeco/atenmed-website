# 🚀 Implementar Solução do Webhook - AGORA!

## ✅ O QUE FOI FEITO

Encontrei e **corrigi** o problema do **403 Forbidden**!

### 🔧 3 Correções no `server.js`:

1. ✅ **Rate Limiter** - Webhook excluído do rate limiting
2. ✅ **Sanitização XSS** - Desabilitada para webhooks
3. ✅ **CORS** - Permitindo requisições do Meta

---

## 📋 OPÇÃO 1: Deploy Completo (Recomendado)

### Passo 1: Preparar Localmente

```bash
# No seu computador local (Windows)

# 1. Ver mudanças
git status

# 2. Adicionar arquivos modificados
git add server.js package.json

# 3. Adicionar documentação
git add SOLUCAO-FORBIDDEN-WEBHOOK.md RESUMO-SOLUCAO-403.md COMANDOS-FINAIS.txt test-webhook-local.js

# 4. Commitar
git commit -m "Fix: Corrigir erro 403 Forbidden no webhook do WhatsApp

- Excluir webhook do rate limiting
- Desabilitar sanitização XSS para webhooks
- Configurar CORS para permitir requisições do Meta
- Adicionar script de teste local
- Documentar solução completa"

# 5. Enviar para o repositório
git push origin reorganizacao-estrutura
```

### Passo 2: Deploy no Servidor

```bash
# 1. Conectar ao servidor
ssh -i "C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem" ubuntu@3.129.206.231

# 2. Ir para o projeto
cd /var/www/atenmed

# 3. Fazer backup do server.js atual (segurança)
cp server.js server.js.backup

# 4. Puxar mudanças do Git
git pull origin reorganizacao-estrutura

# 5. Reiniciar servidor
pm2 restart atenmed

# 6. Verificar logs
pm2 logs atenmed --lines 20
```

### Passo 3: Testar

```bash
# Ainda no servidor AWS

# Teste local
curl "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=atenmed_webhook_2025&hub.challenge=OK"

# Deve retornar: OK

# Teste externo
curl "https://atenmed.com.br/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=atenmed_webhook_2025&hub.challenge=OK"

# Deve retornar: OK
```

---

## 📋 OPÇÃO 2: Upload Manual (Mais Rápido)

Se preferir não usar Git:

### Passo 1: Upload do Arquivo

1. **Abra WinSCP** ou outro cliente SFTP
2. **Conecte ao servidor:**
   - Host: `3.129.206.231`
   - Usuário: `ubuntu`
   - Key: `C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem`
3. **Navegue até:** `/var/www/atenmed/`
4. **Faça backup** do `server.js` atual (renomeie para `server.js.backup`)
5. **Envie** o novo `server.js` do seu computador local

### Passo 2: Reiniciar Servidor

```bash
# Conectar via SSH
ssh -i "C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem" ubuntu@3.129.206.231

# Ir para o projeto
cd /var/www/atenmed

# Reiniciar
pm2 restart atenmed

# Verificar
pm2 status
pm2 logs atenmed --lines 20
```

### Passo 3: Testar

```bash
# Teste local
curl "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=atenmed_webhook_2025&hub.challenge=OK"

# Teste externo
curl "https://atenmed.com.br/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=atenmed_webhook_2025&hub.challenge=OK"
```

---

## 📋 OPÇÃO 3: Testar Localmente Primeiro

Antes de fazer deploy, teste localmente:

### Passo 1: Iniciar Servidor Local

```bash
# No seu computador (Windows)
npm start
```

### Passo 2: Executar Teste

```bash
# Em outro terminal
npm run test-webhook-local
```

**Resultado Esperado:**
```
╔════════════════════════════════════════════════════════════════╗
║                     ✅ TESTE APROVADO                          ║
╚════════════════════════════════════════════════════════════════╝
```

### Passo 3: Deploy

Se o teste local passar, faça deploy usando **Opção 1** ou **Opção 2** acima.

---

## 🌐 Configurar no Meta Developer

Após deploy bem-sucedido:

1. **Acesse:** https://developers.facebook.com/apps/

2. **Selecione** seu app WhatsApp

3. **Navegue:** WhatsApp → Configuração → Webhook

4. **Configure:**
   ```
   URL de callback: https://atenmed.com.br/api/whatsapp/webhook
   Verificar token: atenmed_webhook_2025
   ```

5. **Clique:** "Verificar e salvar"

### ✅ Quando Funcionar:

Você verá no Meta:
```
✅ Webhook verificado com sucesso!
```

Nos logs do servidor:
```
📱 Tentativa de verificação de webhook WhatsApp
✅ Webhook verificado com sucesso
```

---

## 🐛 Se Algo Der Errado

### Erro: "403 Forbidden" ainda aparece

**Verificações:**

```bash
# 1. Confirmar que o server.js foi atualizado
grep "skip.*whatsapp/webhook" server.js
# Deve retornar uma linha com o código do skip

# 2. Verificar se o servidor reiniciou
pm2 status
# Status deve ser "online" com uptime recente (poucos minutos)

# 3. Ver logs de erro
pm2 logs atenmed --err --lines 50
```

### Erro: "Connection Refused"

```bash
# Verificar se servidor está rodando
pm2 status

# Se não estiver, iniciar
pm2 start ecosystem.config.js --env production

# Verificar porta
netstat -tulpn | grep 3000
```

### Erro: "SSL Required"

```bash
# Verificar certificado SSL
sudo certbot certificates

# Se expirado, renovar
sudo certbot renew

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 📞 Comandos Rápidos de Diagnóstico

```bash
# Ver configuração atual
curl http://localhost:3000/api/whatsapp/debug-webhook

# Ver logs em tempo real
pm2 logs atenmed

# Ver status
pm2 status

# Ver token configurado
grep WHATSAPP_VERIFY_TOKEN .env

# Testar webhook
curl "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=atenmed_webhook_2025&hub.challenge=OK"
```

---

## ✅ Checklist de Implementação

### Antes do Deploy:
- [ ] Testei localmente com `npm run test-webhook-local`
- [ ] O teste local passou (retornou ✅ TESTE APROVADO)
- [ ] Fiz commit das mudanças (opcional)

### Durante o Deploy:
- [ ] Conectei ao servidor AWS via SSH
- [ ] Fiz backup do server.js atual
- [ ] Atualizei o código (Git ou upload manual)
- [ ] Reiniciei o servidor com `pm2 restart atenmed`
- [ ] Verifiquei que está rodando com `pm2 status`

### Testes no Servidor:
- [ ] Teste local passou (curl localhost)
- [ ] Teste externo passou (curl https://atenmed.com.br)
- [ ] Logs mostram servidor funcionando
- [ ] Não há erros nos logs

### Configuração Meta:
- [ ] Acessei Meta Developer
- [ ] Configurei URL do webhook
- [ ] Configurei token (atenmed_webhook_2025)
- [ ] Cliquei em "Verificar e salvar"
- [ ] Meta confirmou verificação ✅

---

## 🎉 Próximos Passos Após Sucesso

1. **Testar envio de mensagens:**
   - Enviar mensagem de teste via WhatsApp
   - Verificar se o servidor recebe

2. **Monitorar logs:**
   ```bash
   pm2 logs atenmed
   ```

3. **Configurar webhooks fields no Meta:**
   - Marcar: messages, message_status

4. **Testar fluxo completo:**
   - Agendar consulta via WhatsApp
   - Verificar se salvou no banco
   - Confirmar criação no Google Calendar

---

## 📚 Documentação Completa

| Arquivo | Para que serve |
|---------|----------------|
| `SOLUCAO-FORBIDDEN-WEBHOOK.md` | Explicação técnica completa |
| `RESUMO-SOLUCAO-403.md` | Resumo executivo |
| `COMANDOS-FINAIS.txt` | Comandos prontos para copiar/colar |
| `IMPLEMENTAR-AGORA.md` | Este arquivo - guia de implementação |
| `test-webhook-local.js` | Script de teste local |

---

## 💡 Dica Final

**Escolha uma opção e execute agora!**

Recomendo:
1. **Se tem experiência com Git:** Use Opção 1 (mais profissional)
2. **Se quer mais rápido:** Use Opção 2 (upload manual)
3. **Se tem dúvidas:** Use Opção 3 (teste local primeiro)

**O problema está resolvido no código, só falta fazer deploy!** 🚀

---

**Criado:** 22/10/2025
**Tempo estimado:** 5-10 minutos
**Dificuldade:** Fácil ⭐


