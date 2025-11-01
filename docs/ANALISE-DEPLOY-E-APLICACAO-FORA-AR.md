# 🔍 Análise: Falhas de Deploy e Aplicação Fora do Ar

## 🎯 Descoberta Importante

**Você descobriu a causa raiz!** 🎯

---

## 🔄 O Ciclo Vicioso

### **O que aconteceu:**

1. **Aplicação estava rodando normalmente** ✅
2. **Deploy falhou** (por vários motivos que corrigimos)
3. **Durante tentativas de deploy**, algo quebrou os `node_modules`
4. **Aplicação crashou** por MODULE_NOT_FOUND
5. **PM2 tentou reiniciar** 15x, todas falharam
6. **Site ficou offline** com erro 502 Bad Gateway
7. **Próximos deploys continuavam falhando** porque tentavam atualizar um servidor já quebrado

### **Resultado:**

- 🔴 Servidor offline
- 🔴 Deploys falhando
- 🔴 Aplicação em loop de erro

---

## ✅ Solução

### **1. Primeiro: Corrigir Aplicação no Servidor**

Como estamos fazendo agora:

```bash
cd /var/www/atenmed
rm -rf node_modules
npm ci --production --legacy-peer-deps --ignore-scripts
pm2 stop atenmed
pm2 delete atenmed
pm2 start ecosystem.config.js --env production
pm2 save
```

**Objetivo:** Colocar aplicação online novamente.

### **2. Depois: Deploy Automático Começará a Funcionar**

Uma vez que a aplicação estiver online:

- ✅ Health check passará
- ✅ Deploys futuros funcionarão
- ✅ Mudanças (ex: links do rodapé) serão aplicadas

---

## 📊 Timeline Reconstruída

**Antes (funcionando):**

- ✅ Aplicação rodando
- ✅ Deploy funcionando
- ✅ Site online

**Quando começou a quebrar:**

1. Corrigimos várias coisas no CI/CD (build, scripts, etc)
2. Deploys falharam por timeout, SSH, etc
3. `node_modules` se corrompeu em alguma tentativa
4. Aplicação crashou

**Estado atual:**

- 🔴 Aplicação offline
- 🔴 PM2 em loop de erro
- 🔴 Site com 502

**Após correção (agora):**

- ⏳ Reinstalando módulos
- ⏳ Reiniciando aplicação
- ✅ Em breve: Site online novamente

---

## 🎯 Lições Aprendidas

### **1. Sempre verificar aplicação antes de mudar deploy**

**Antes de**:

- Mudar workflows de CI/CD
- Alterar build scripts
- Modificar dependências

**Sempre**:

- ✅ Verificar se aplicação está estável
- ✅ Testar em dev primeiro
- ✅ Fazer backup de `node_modules` se necessário

### **2. Deploy rola é perigoso se aplicação estiver quebrada**

**Problema:**

- Deploy tentou atualizar código
- Mas `node_modules` já estava corrompido
- Deploy instalou coisas erradas
- Aplicação crashou de vez

**Solução:**

- ✅ Health check no início do deploy
- ✅ Rollback automático se falhar
- ✅ Verificar integridade antes de continuar

### **3. Monitoramento é essencial**

**Falta:**

- ❌ Alertas quando aplicação cai
- ❌ Notificação de PM2 restart loops
- ❌ Monitoramento de uptime

**Adicionar no futuro:**

- ✅ Uptime monitoring (UptimeRobot, Pingdom)
- ✅ Alertas via email/SMS
- ✅ Dashboard de saúde do servidor

---

## 🔧 Melhorias Futuras para Workflow

### **Adicionar ao `.github/workflows/deploy.yml`:**

```yaml
- name: Pre-deploy Health Check
  run: |
    echo "Verificando se aplicação está online..."
    curl -f https://atenmed.com.br/health || {
      echo "⚠️ Aplicação está offline! Deploy cancelado."
      exit 1
    }

- name: Deploy to Server
  # ... deploy normal ...

- name: Post-deploy Health Check
  run: |
    echo "Verificando se aplicação voltou online..."
    for i in {1..10}; do
      if curl -f https://atenmed.com.br/health; then
        echo "✅ Aplicação online!"
        exit 0
      fi
      echo "Tentativa $i/10..."
      sleep 10
    done
    echo "❌ Aplicação não voltou online após deploy!"
    exit 1
```

### **Adicionar rollback automático:**

```yaml
- name: Rollback on Failure
  if: failure()
  run: |
    echo "Rollbacking..."
    ssh -i ... "cd /var/www/atenmed && git checkout HEAD~1 && pm2 restart atenmed"
```

---

## 📝 Checklist de Recuperação

### **Para restaurar aplicação:**

- [ ] Conectar no servidor via SSH
- [ ] Ir para `/var/www/atenmed`
- [ ] `rm -rf node_modules` (limpar corrompido)
- [ ] `npm ci --production --legacy-peer-deps` (reinstalar)
- [ ] `pm2 delete atenmed` (limpar processo)
- [ ] `pm2 start ecosystem.config.js --env production` (reiniciar)
- [ ] `pm2 save` (salvar configuração)
- [ ] `curl http://localhost:3000/health` (testar)
- [ ] Verificar site: https://atenmed.com.br

### **Depois de restaurar:**

- [ ] Configurar GitHub Secrets (se não configurado)
- [ ] Testar deploy manual via GitHub UI
- [ ] Verificar se health check passa
- [ ] Configurar monitoramento
- [ ] Testar deploy automático

---

## 🎉 Resultado Esperado

**Após correção:**

1. ✅ Aplicação rodando normalmente
2. ✅ Site online: https://atenmed.com.br
3. ✅ PM2 estável (não reinicia)
4. ✅ Deploys automáticos funcionando
5. ✅ Links do rodapé organizados
6. ✅ Próximas mudanças deployando automaticamente

---

## 🔗 Comandos Rápidos de Recuperação

### **Se precisar recuperar novamente:**

```bash
# Conectar
ssh -i C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem ubuntu@3.129.206.231

# Recuperar
cd /var/www/atenmed
rm -rf node_modules
npm ci --production --legacy-peer-deps --ignore-scripts
pm2 delete atenmed
pm2 start ecosystem.config.js --env production
pm2 save

# Verificar
pm2 status
curl http://localhost:3000/health

# Sair
exit
```

---

**Última atualização:** Janeiro 2025  
**Status:** 🔄 Em recuperação
