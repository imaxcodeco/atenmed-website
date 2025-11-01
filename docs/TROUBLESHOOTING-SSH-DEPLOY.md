# 🔧 Troubleshooting: SSH Deploy Falhou

## ❌ Erro Identificado

```
ssh: handshake failed: EOF
Error: Process completed with exit code 1.
```

**Significado:** A conexão SSH não conseguiu ser estabelecida.

---

## 🔍 Causas Possíveis

### **1. GitHub Secrets não configurados**

- `SERVER_HOST` não definido ou vazio
- `SERVER_USER` não definido ou vazio
- `SERVER_SSH_KEY` não definido ou incorreto

### **2. Servidor não acessível**

- IP/domínio incorreto
- Firewall bloqueando conexão
- Servidor offline

### **3. Chave SSH incorreta**

- Formato da chave errado
- Chave não corresponde ao servidor
- Permissões incorretas

### **4. Porta SSH incorreta**

- Porta padrão 22 não disponível
- `SERVER_PORT` configurado errado

---

## ✅ Checklist de Diagnóstico

### **Passo 1: Verificar se Secrets estão configurados**

Acesse: https://github.com/imaxcodeco/atenmed-website/settings/secrets/actions

**Secrets necessários:**

- [ ] `SERVER_HOST` - IP ou domínio do servidor (ex: `123.45.67.89`)
- [ ] `SERVER_USER` - Usuário SSH (ex: `ubuntu`, `root`, `seu-usuario`)
- [ ] `SERVER_SSH_KEY` - Chave privada SSH completa
- [ ] `SERVER_PORT` - Porta SSH (opcional, padrão: 22)

---

### **Passo 2: Verificar formato da chave SSH**

A chave SSH deve estar no formato correto:

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
NhAAAAAwEAAQAAAYEA1234567890abcdefghijklmnopqrstuvwxyz...
... (várias linhas) ...
-----END OPENSSH PRIVATE KEY-----
```

**⚠️ Importante:**

- Incluir `-----BEGIN` e `-----END`
- Copiar chave completa, sem cortar nada
- Não adicionar espaços extras
- É a chave **PRIVADA**, não a pública (.pub)

---

### **Passo 3: Testar conexão SSH manualmente**

No seu computador, teste a conexão:

```bash
# Usando chave SSH
ssh -i /caminho/para/sua/chave usuario@seu-servidor.com

# Ou se a chave já está no ssh-agent
ssh usuario@seu-servidor.com
```

**Se funcionar localmente mas falhar no GitHub:**

- Problema está na configuração dos Secrets
- Verifique se copiou a chave correta

**Se não funcionar localmente:**

- Problema está no servidor ou nas credenciais
- Verifique servidor, firewall, e chave SSH

---

### **Passo 4: Gerar nova chave SSH (se necessário)**

Se a chave atual não funciona, gere uma nova:

```bash
# No seu computador local
ssh-keygen -t ed25519 -C "github-deploy-atenmed"

# Salvar em: ~/.ssh/atenmed_deploy
# Não definir senha (deixar vazio para deploy automático)
```

**Adicionar chave pública ao servidor:**

```bash
# Copiar chave pública
cat ~/.ssh/atenmed_deploy.pub

# No servidor, adicionar ao authorized_keys
# SSH no servidor e executar:
echo "ssh-ed25519 AAAAC3NzaC... github-deploy-atenmed" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

**Adicionar chave privada ao GitHub Secret:**

```bash
# Copiar chave privada completa
cat ~/.ssh/atenmed_deploy
```

Copie TODO o conteúdo (incluindo BEGIN e END) e cole no Secret `SERVER_SSH_KEY`.

---

## 🎯 Solução Rápida

Se você **NÃO tem acesso SSH configurado**, há duas opções:

### **Opção 1: Desabilitar deploy automático (temporário)**

Comentar o workflow até configurar SSH:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  # push:
  #   branches:
  #     - main
  workflow_dispatch: # Deploy manual apenas
```

### **Opção 2: Deploy manual com script**

Usar o script de deploy manual:

```bash
# No servidor, via SSH manual
cd /var/www/atenmed
git pull origin main
npm install --legacy-peer-deps --ignore-scripts
npm run build:css
npm prune --omit=dev --legacy-peer-deps
pm2 reload ecosystem.config.js --env production
```

---

## 📋 Exemplo de Configuração Correta

### **GitHub Secrets:**

```
SERVER_HOST = 198.51.100.42
SERVER_USER = ubuntu
SERVER_PORT = 22
SERVER_SSH_KEY = -----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAA...
(chave completa aqui)
-----END OPENSSH PRIVATE KEY-----
```

### **Workflow (.github/workflows/deploy.yml):**

```yaml
- name: Deploy to Server
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.SERVER_HOST }}
    username: ${{ secrets.SERVER_USER }}
    key: ${{ secrets.SERVER_SSH_KEY }}
    port: ${{ secrets.SERVER_PORT || 22 }}
    command_timeout: 20m
```

---

## 🔐 Segurança

**Boas práticas:**

- ✅ Usar chave SSH específica para deploy (não sua chave pessoal)
- ✅ Chave sem senha (passphrase) para deploy automático
- ✅ Configurar usuário com permissões limitadas (não root)
- ✅ Usar firewall para permitir SSH apenas de IPs conhecidos
- ✅ Considerar usar GitHub Actions self-hosted runner

---

## 🆘 Se nada funcionar

1. **Verificar logs do servidor:**

   ```bash
   # No servidor
   sudo tail -f /var/log/auth.log  # Ubuntu/Debian
   sudo tail -f /var/log/secure     # CentOS/RHEL
   ```

2. **Testar com debug:**

   ```bash
   ssh -vvv usuario@servidor  # Muito verbose
   ```

3. **Verificar se sshd está rodando:**

   ```bash
   sudo systemctl status sshd
   ```

4. **Verificar firewall:**
   ```bash
   sudo ufw status  # Ubuntu
   sudo firewall-cmd --list-all  # CentOS
   ```

---

## 📞 Próximos Passos

1. **Verificar Secrets no GitHub** (link acima)
2. **Testar SSH localmente** antes de tentar deploy
3. **Se necessário, gerar nova chave SSH**
4. **Ou desabilitar deploy automático temporariamente**

---

**Última atualização:** Janeiro 2025  
**Status:** 🔴 Deploy SSH falhando - aguardando configuração
