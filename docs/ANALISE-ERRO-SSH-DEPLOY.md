# 🔍 Análise: Por que SSH parou de funcionar?

## 🤔 Contexto

**Antes:** Deploy SSH funcionava normalmente  
**Agora:** `ssh: handshake failed: EOF`

---

## 🎯 Causas Prováveis

### **1. Action `@master` instável (MAIS PROVÁVEL)**

**Problema:**

```yaml
uses: appleboy/ssh-action@master # ← Usa versão instável
```

**O que acontece:**

- `@master` pega sempre a versão mais recente (não fixada)
- Se houver update com bug, quebra o deploy
- Não é uma boa prática em CI/CD

**Solução:**

```yaml
uses: appleboy/ssh-action@v1.0.3 # ← Versão fixa e estável
```

✅ **Aplicado neste commit**

---

### **2. Timeout muito curto (20m pode não ser suficiente)**

Adicionamos `command_timeout: 20m` recentemente, mas isso pode causar problemas se:

- Conexão lenta
- npm install demora muito
- Servidor está sobrecarregado

**Possível solução:** Aumentar para 30m se continuar falhando.

---

### **3. Problema temporário no servidor**

Possíveis causas temporárias:

- Servidor reiniciou e SSH não iniciou corretamente
- Firewall temporariamente bloqueou GitHub IPs
- Carga alta no servidor
- Limite de conexões SSH atingido

**Como verificar:**

```bash
# SSH manualmente no servidor
ssh seu-usuario@seu-servidor

# Verificar status do SSH
sudo systemctl status sshd

# Ver tentativas de conexão falhadas
sudo tail -50 /var/log/auth.log | grep ssh
```

---

### **4. Mudanças recentes no workflow**

Commits recentes que podem ter impactado:

1. **c0b8090** - Otimizar deploy para evitar timeout
   - Adicionou `command_timeout: 20m`
   - Mudou lógica de `npm ci` vs `npm install`

2. **9d11a4f** - Corrigir build CSS no CI
   - Mudou ordem de instalação de dependências

3. **b5b12d6** - Corrigir workflow CI para produção
   - Mudou para `--omit=dev --ignore-scripts`

**Nenhuma dessas mudanças deveria quebrar SSH**, mas pode ter sido coincidência.

---

## 🔧 Correções Aplicadas

### **1. Fixar versão da action SSH**

```yaml
# Antes (instável)
uses: appleboy/ssh-action@master

# Depois (estável)
uses: appleboy/ssh-action@v1.0.3
```

### **2. Manter command_timeout**

```yaml
command_timeout: 20m # Suficiente para a maioria dos deploys
```

---

## 📊 Comparação de Versões

### **appleboy/ssh-action versões:**

| Versão    | Status      | Recomendação                       |
| --------- | ----------- | ---------------------------------- |
| `@master` | ❌ Instável | Nunca usar em produção             |
| `@v1.0.3` | ✅ Estável  | **Recomendado**                    |
| `@v1.0.0` | ✅ Estável  | Funciona, mas v1.0.3 tem correções |

---

## 🎯 Próximos Passos

### **Se o erro persistir após essa correção:**

1. **Verificar se servidor está acessível:**

   ```bash
   ping seu-servidor.com
   ```

2. **Testar SSH manualmente:**

   ```bash
   ssh -vvv seu-usuario@seu-servidor
   # -vvv = muito verbose, mostra detalhes da conexão
   ```

3. **Verificar logs do servidor:**

   ```bash
   # No servidor
   sudo tail -f /var/log/auth.log
   ```

4. **Verificar GitHub Secrets:**
   - Acessar: https://github.com/imaxcodeco/atenmed-website/settings/secrets/actions
   - Confirmar que `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY` existem

5. **Testar com IP direto (se usar domínio):**
   ```yaml
   host: 198.51.100.42 # Testar com IP direto
   ```

---

## 💡 Por que `@master` é problemático?

**Exemplo de problema real:**

```
Dia 1: @master funciona (versão 1.0.2)
↓
Dia 2: Maintainer faz push de versão 1.0.3-beta com bug
↓
Dia 3: Seu deploy quebra porque @master agora é 1.0.3-beta
↓
Dia 4: Você não mudou nada no código, mas deploy não funciona! 🤯
```

**Com versão fixa:**

```
Sempre usa v1.0.3 → Deploy consistente ✅
```

---

## 🔐 Diferença entre este workflow e deploy-ec2.yml

### **deploy.yml (este arquivo):**

```yaml
uses: appleboy/ssh-action@master # ← Problemático
```

### **deploy-ec2.yml:**

```yaml
uses: appleboy/ssh-action@v1.0.3 # ← Correto
```

**Nota:** O `deploy-ec2.yml` já usava versão fixa! Por isso provavelmente não teve esse problema.

---

## ✅ Resumo

**Causa provável:** Action `@master` pegou versão com bug  
**Solução:** Fixar em `@v1.0.3` (versão estável testada)  
**Status:** ✅ Correção aplicada neste commit

---

**Última atualização:** Janeiro 2025  
**Status:** 🟡 Aguardando próximo deploy para confirmar correção
