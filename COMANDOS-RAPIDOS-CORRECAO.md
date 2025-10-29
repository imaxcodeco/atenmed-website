# ⚡ Comandos Rápidos - Correção de Issues

**Para desenvolvedores que querem corrigir AGORA**

---

## 🚀 Opção 1: Correção Automática (2 minutos)

```bash
# 1. Backup automático + Correções
node scripts/fix-critical-issues.js

# 2. Revisar mudanças
git diff

# 3. Testar
npm run dev

# 4. Se tudo OK, commitar
git add -A
git commit -m "fix: correções críticas de segurança"
```

---

## 🛠️ Opção 2: Correção Manual (30 minutos)

### Criar Branch
```bash
git checkout -b fix/security-critical
git add -A
git commit -m "backup antes de correções"
```

### Correção #1: Rota /health Duplicada
```bash
# Abrir server.js e remover LINHAS 208-216
# Manter apenas a primeira definição (linhas 197-205)
```

### Correção #2: Renomear env.example
```bash
mv env.example .env.example

# Atualizar README.md:
# Trocar "cp env.example .env" por "cp .env.example .env"
```

### Correção #4: Validação WhatsApp
Editar `services/whatsappServiceV2.js` linha 169:

```javascript
if (!WHATSAPP_APP_SECRET) {
    logger.warn('⚠️ WHATSAPP_APP_SECRET não configurado');
    if (process.env.NODE_ENV === 'production') {
        logger.error('❌ WHATSAPP_APP_SECRET obrigatório em produção');
        return false;
    }
    logger.info('ℹ️ Aceitando webhook sem signature (apenas desenvolvimento)');
    return true;
}
```

### Correção #5: Tokens em Logs
Editar `routes/whatsapp.js` linhas 34-35:

```javascript
logger.info(`   Token recebido: ${token ? '***' + token.slice(-4) : 'null'}`);
logger.info(`   Token match: ${token === process.env.WHATSAPP_VERIFY_TOKEN}`);
```

### Correção #7: Validar JWT_SECRET
Adicionar em `server.js` após `require('dotenv').config()`:

```javascript
// Validar variáveis de ambiente críticas em produção
if (process.env.NODE_ENV === 'production') {
    const requiredEnvVars = [
        'MONGODB_URI',
        'JWT_SECRET',
        'WHATSAPP_TOKEN',
        'WHATSAPP_VERIFY_TOKEN',
        'WHATSAPP_APP_SECRET'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error('❌ Variáveis de ambiente obrigatórias não configuradas:');
        missingVars.forEach(varName => console.error(`   - ${varName}`));
        process.exit(1);
    }
}
```

### Correção #8: Rate Limiter
Editar `server.js` linha 152:

```javascript
skip: (req) => {
    const skipPaths = ['/api/whatsapp/webhook'];
    return skipPaths.includes(req.path);
}
```

### Commitar
```bash
git add -A
git commit -m "fix: correções críticas de segurança

- Remove rota /health duplicada
- Renomeia env.example para .env.example
- Corrige validação de signature WhatsApp
- Remove exposição de tokens em logs
- Adiciona validação de JWT_SECRET em produção
- Melhora skip de rate limiter"

git push origin fix/security-critical
```

---

## 🧪 Testes Rápidos

```bash
# 1. Iniciar servidor
npm run dev

# Em outro terminal:

# 2. Health check (não deve estar duplicado)
curl http://localhost:3000/health

# 3. Testar autenticação (deve retornar 401)
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{"to":"123","message":"test"}'

# 4. Verificar logs (não deve ter tokens)
tail -f logs/combined.log | grep -i "token"

# 5. Testar rate limit
for i in {1..101}; do curl -s http://localhost:3000/api/services > /dev/null; echo "$i"; done
# Após 100 deve retornar erro 429
```

---

## 🚨 Se Algo Der Errado

### Reverter Tudo
```bash
# Voltar para estado anterior
git reset --hard HEAD~1

# OU voltar para branch backup
git checkout <nome-branch-backup>
```

### Reverter Arquivo Específico
```bash
git checkout HEAD -- server.js
git checkout HEAD -- services/whatsappServiceV2.js
```

---

## 📊 Checklist Rápido

Após correções, verificar:

- [ ] `curl http://localhost:3000/health` funciona
- [ ] Logs não mostram tokens completos
- [ ] Rotas sensíveis exigem autenticação
- [ ] Rate limiting funciona após 100 requests
- [ ] Servidor inicia normalmente
- [ ] Variáveis de ambiente validadas

---

## 🎯 One-Liner Completo

Para quem quer fazer tudo de uma vez:

```bash
git checkout -b fix/security && \
node scripts/fix-critical-issues.js && \
npm run dev &
SERVER_PID=$! && \
sleep 5 && \
curl http://localhost:3000/health && \
kill $SERVER_PID && \
git add -A && \
git commit -m "fix: correções críticas automáticas" && \
echo "✅ Correções aplicadas! Revise com: git diff HEAD~1"
```

---

## 📱 Notificar Equipe

Após correções, enviar mensagem:

```
🔒 Correções de Segurança Aplicadas

✅ 8 vulnerabilidades críticas corrigidas
✅ Código testado e funcionando
✅ Branch: fix/security-critical

Próximos passos:
1. Code review necessário
2. Deploy em staging
3. Validação QA
4. Deploy em produção

PR: [link]
```

---

**Tempo total: 2-30 minutos**  
**Prioridade: URGENTE**  
**Status: Pronto para executar**

