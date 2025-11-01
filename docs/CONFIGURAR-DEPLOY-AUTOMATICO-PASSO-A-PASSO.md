# 🚀 Configurar Deploy Automático - Passo a Passo

## 📋 Informações Necessárias

Antes de começar, você precisa ter:

- ✅ Acesso ao servidor (via SSH)
- ✅ IP ou domínio do servidor
- ✅ Usuário SSH (ex: `ubuntu`, `root`, `seu-usuario`)
- ✅ Chave SSH ou senha

---

## 🎯 Passo 1: Verificar Acesso ao Servidor

### **1.1 Testar conexão SSH atual**

Tente conectar manualmente:

```bash
ssh seu-usuario@seu-servidor.com
# ou
ssh seu-usuario@123.45.67.89
```

**Se conectar com sucesso:**

- ✅ Ótimo! Seu servidor está acessível
- Anote: usuário, IP/domínio, porta (geralmente 22)

**Se não conectar:**

- Verifique IP/domínio
- Verifique se servidor está online
- Verifique firewall

---

## 🔑 Passo 2: Gerar Chave SSH para GitHub Actions

### **2.1 Gerar nova chave (recomendado)**

No seu computador local:

```bash
# Gerar chave ED25519 (mais segura e rápida)
ssh-keygen -t ed25519 -C "github-deploy-atenmed"

# Quando perguntar onde salvar:
# Digite: ~/.ssh/atenmed_deploy
Enter file in which to save the key: ~/.ssh/atenmed_deploy

# Quando perguntar por senha (passphrase):
# DEIXE VAZIO (apenas pressione Enter 2x)
Enter passphrase (empty for no passphrase): [Enter]
Enter same passphrase again: [Enter]
```

**Resultado:**

- Chave privada: `~/.ssh/atenmed_deploy`
- Chave pública: `~/.ssh/atenmed_deploy.pub`

### **2.2 Ver as chaves geradas**

```bash
# Ver chave PÚBLICA (para adicionar no servidor)
cat ~/.ssh/atenmed_deploy.pub
# Resultado: ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... github-deploy-atenmed

# Ver chave PRIVADA (para GitHub Secret)
cat ~/.ssh/atenmed_deploy
# Resultado:
# -----BEGIN OPENSSH PRIVATE KEY-----
# b3BlbnNzaC1rZXktdjEAAAAABG5vbmU...
# -----END OPENSSH PRIVATE KEY-----
```

**⚠️ Importante:**

- Chave pública → vai no servidor
- Chave privada → vai no GitHub Secret

---

## 🖥️ Passo 3: Adicionar Chave Pública no Servidor

### **3.1 Copiar chave pública**

```bash
cat ~/.ssh/atenmed_deploy.pub
```

Copie TODO o conteúdo (começa com `ssh-ed25519 AAAA...`)

### **3.2 Conectar no servidor**

```bash
ssh seu-usuario@seu-servidor
```

### **3.3 Adicionar chave ao authorized_keys**

No servidor:

```bash
# Criar diretório .ssh se não existir
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Adicionar chave pública
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... github-deploy-atenmed" >> ~/.ssh/authorized_keys

# Ajustar permissões
chmod 600 ~/.ssh/authorized_keys

# Verificar conteúdo
cat ~/.ssh/authorized_keys
```

### **3.4 Testar nova chave**

No seu computador local (nova janela terminal):

```bash
ssh -i ~/.ssh/atenmed_deploy seu-usuario@seu-servidor
```

**Se conectar sem pedir senha:** ✅ Perfeito!  
**Se pedir senha:** ❌ Algo está errado, revise os passos

---

## 🔐 Passo 4: Configurar GitHub Secrets

### **4.1 Acessar configuração de Secrets**

Abra: https://github.com/imaxcodeco/atenmed-website/settings/secrets/actions

### **4.2 Adicionar SERVER_HOST**

1. Clique em **"New repository secret"**
2. **Name:** `SERVER_HOST`
3. **Value:** IP ou domínio do servidor
   - Exemplo: `198.51.100.42`
   - Ou: `servidor.atenmed.com.br`
4. Clique em **"Add secret"**

### **4.3 Adicionar SERVER_USER**

1. Clique em **"New repository secret"**
2. **Name:** `SERVER_USER`
3. **Value:** Usuário SSH
   - Exemplo: `ubuntu`
   - Ou: `root`
   - Ou: seu usuário
4. Clique em **"Add secret"**

### **4.4 Adicionar SERVER_SSH_KEY**

1. No terminal, copiar chave privada COMPLETA:

   ```bash
   cat ~/.ssh/atenmed_deploy
   ```

2. Copiar **TODO** o conteúdo, incluindo:

   ```
   -----BEGIN OPENSSH PRIVATE KEY-----
   b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
   ... (várias linhas) ...
   -----END OPENSSH PRIVATE KEY-----
   ```

3. No GitHub:
   - Clique em **"New repository secret"**
   - **Name:** `SERVER_SSH_KEY`
   - **Value:** Cole a chave privada completa
   - Clique em **"Add secret"**

### **4.5 Adicionar SERVER_PORT (opcional)**

Se sua porta SSH não é 22:

1. Clique em **"New repository secret"**
2. **Name:** `SERVER_PORT`
3. **Value:** Sua porta (ex: `2222`)
4. Clique em **"Add secret"**

---

## ✅ Passo 5: Reativar Deploy Automático

### **5.1 Editar workflow**

Arquivo: `.github/workflows/deploy.yml`

**Mudar de:**

```yaml
on:
  # push:
  #   branches:
  #     - main
  #     - master
  workflow_dispatch:
```

**Para:**

```yaml
on:
  push:
    branches:
      - main
      - master
  workflow_dispatch:
```

### **5.2 Commitar mudança**

```bash
git add .github/workflows/deploy.yml
git commit -m "Reativar deploy automático - Secrets configurados"
git push origin main
```

---

## 🧪 Passo 6: Testar Deploy

### **6.1 Fazer um push de teste**

```bash
# Fazer uma pequena mudança
echo "# Deploy automático configurado" >> README.md
git add README.md
git commit -m "Testar deploy automático"
git push origin main
```

### **6.2 Verificar GitHub Actions**

1. Acessar: https://github.com/imaxcodeco/atenmed-website/actions
2. Ver o workflow rodando
3. Aguardar conclusão

### **6.3 Resultado esperado**

✅ **Sucesso:**

- Deploy completa sem erros
- Aplicação reinicia
- Health check passa
- Site atualizado

❌ **Erro:**

- Ver logs no GitHub Actions
- Verificar mensagem de erro
- Consultar troubleshooting abaixo

---

## 🔍 Troubleshooting

### **Erro: "Permission denied (publickey)"**

**Causa:** Chave pública não foi adicionada corretamente no servidor

**Solução:**

```bash
# No servidor, verificar authorized_keys
cat ~/.ssh/authorized_keys

# Verificar permissões
ls -la ~/.ssh/authorized_keys
# Deve ser: -rw------- (600)

# Corrigir se necessário
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### **Erro: "Host key verification failed"**

**Causa:** Primeira conexão, servidor não está em known_hosts

**Solução:** Adicionar no workflow:

```yaml
with:
  host: ${{ secrets.SERVER_HOST }}
  username: ${{ secrets.SERVER_USER }}
  key: ${{ secrets.SERVER_SSH_KEY }}
  port: ${{ secrets.SERVER_PORT || 22 }}
  command_timeout: 20m
  script: |
    # Aceitar host key automaticamente
    ssh-keyscan -H ${{ secrets.SERVER_HOST }} >> ~/.ssh/known_hosts 2>/dev/null || true

    # ... resto do script
```

### **Erro: "Connection timeout"**

**Causa:** Servidor não acessível ou firewall bloqueando

**Solução:**

1. Verificar se servidor está online
2. Verificar firewall do servidor
3. Adicionar IPs do GitHub Actions ao whitelist:
   - https://api.github.com/meta (ver `actions` IPs)

### **Erro: "npm install demorou muito"**

**Causa:** Timeout muito curto

**Solução:** Aumentar timeout:

```yaml
command_timeout: 30m # Aumentar para 30 minutos
```

---

## 📋 Checklist Final

Antes de reativar deploy automático:

- [ ] Testei SSH manualmente e funciona
- [ ] Gerei nova chave SSH
- [ ] Adicionei chave pública no servidor (`~/.ssh/authorized_keys`)
- [ ] Verifiquei permissões (600 para authorized_keys, 700 para .ssh)
- [ ] Testei nova chave localmente (`ssh -i ~/.ssh/atenmed_deploy`)
- [ ] Adicionei `SERVER_HOST` no GitHub Secrets
- [ ] Adicionei `SERVER_USER` no GitHub Secrets
- [ ] Adicionei `SERVER_SSH_KEY` no GitHub Secrets (chave PRIVADA completa)
- [ ] (Opcional) Adicionei `SERVER_PORT` se não for 22
- [ ] Reativei push trigger no workflow
- [ ] Fiz push de teste

---

## 🎉 Sucesso!

Depois de configurar tudo:

1. ✅ Cada push em `main` dispara deploy automático
2. ✅ Código é baixado no servidor
3. ✅ Dependências são instaladas
4. ✅ CSS é compilado
5. ✅ PM2 reinicia aplicação
6. ✅ Health check confirma sucesso

**Os links do rodapé estarão organizados automaticamente!** 🎨

---

## 🆘 Precisa de Ajuda?

Se algo não funcionar:

1. Verificar logs em: https://github.com/imaxcodeco/atenmed-website/actions
2. Consultar `docs/TROUBLESHOOTING-SSH-DEPLOY.md`
3. Testar SSH manualmente antes

---

**Última atualização:** Janeiro 2025  
**Status:** 📝 Guia completo passo a passo
