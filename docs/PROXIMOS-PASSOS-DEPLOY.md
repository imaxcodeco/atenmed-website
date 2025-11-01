# ✅ Chave SSH Criada! - Próximos Passos

## 🎉 Sucesso!

A chave SSH foi gerada com sucesso:

- **Chave privada:** `C:\Users\Ian_1\.ssh\atenmed_deploy`
- **Chave pública:** `C:\Users\Ian_1\.ssh\atenmed_deploy.pub`

---

## 📋 Próximos Passos

### **Passo 1: Adicionar Chave Pública no Servidor** 🖥️

#### **1.1 Copiar chave pública**

A chave pública foi exibida no terminal. Ela começa com:

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA...
```

Copie **TODA** a linha.

#### **1.2 Conectar no servidor**

```bash
ssh seu-usuario@seu-servidor
# Exemplo: ssh ubuntu@123.45.67.89
```

#### **1.3 Adicionar chave ao servidor**

No servidor, execute:

```bash
# Adicionar chave pública
echo "cole-sua-chave-publica-aqui" >> ~/.ssh/authorized_keys

# Ajustar permissões
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# Verificar se foi adicionada
cat ~/.ssh/authorized_keys
```

#### **1.4 Sair do servidor**

```bash
exit
```

---

### **Passo 2: Testar Nova Chave** 🧪

De volta no seu computador Windows:

```powershell
ssh -i C:\Users\Ian_1\.ssh\atenmed_deploy seu-usuario@seu-servidor
```

**Resultado esperado:**

- ✅ Conecta sem pedir senha
- ❌ Se pedir senha, revisar Passo 1

---

### **Passo 3: Configurar GitHub Secrets** 🔐

#### **3.1 Acessar configuração**

Abrir: https://github.com/imaxcodeco/atenmed-website/settings/secrets/actions

#### **3.2 Adicionar SERVER_HOST**

1. Clicar em **"New repository secret"**
2. **Name:** `SERVER_HOST`
3. **Value:** IP ou domínio do servidor
   - Exemplo: `198.51.100.42`
   - Ou: `servidor.atenmed.com.br`
4. **"Add secret"**

#### **3.3 Adicionar SERVER_USER**

1. **"New repository secret"**
2. **Name:** `SERVER_USER`
3. **Value:** Usuário SSH
   - Exemplo: `ubuntu`
   - Ou: `root`
4. **"Add secret"**

#### **3.4 Adicionar SERVER_SSH_KEY**

1. No PowerShell, copiar chave privada:

   ```powershell
   Get-Content C:\Users\Ian_1\.ssh\atenmed_deploy | Set-Clipboard
   ```

   (Chave privada agora está na área de transferência)

2. No GitHub:
   - **"New repository secret"**
   - **Name:** `SERVER_SSH_KEY`
   - **Value:** Colar (Ctrl+V) - deve incluir:
     ```
     -----BEGIN OPENSSH PRIVATE KEY-----
     ... várias linhas ...
     -----END OPENSSH PRIVATE KEY-----
     ```
   - **"Add secret"**

---

### **Passo 4: Verificar Secrets Configurados** ✅

Depois de adicionar os 3 Secrets, você deve ver:

```
SERVER_HOST      Updated X minutes ago
SERVER_USER      Updated X minutes ago
SERVER_SSH_KEY   Updated X minutes ago
```

---

### **Passo 5: Reativar Deploy Automático** 🚀

**Quando os Secrets estiverem configurados**, me avise para reativar o workflow!

Ou você mesmo pode reativar editando `.github/workflows/deploy.yml`:

```yaml
on:
  push: # ← Descomentar estas 4 linhas
    branches:
      - main
      - master
  workflow_dispatch:
```

---

## 🎯 Resumo Rápido

1. ✅ **Chave gerada** - Feito!
2. ⏳ **Adicionar chave pública no servidor** - Próximo
3. ⏳ **Testar conexão SSH**
4. ⏳ **Adicionar 3 Secrets no GitHub**
5. ⏳ **Reativar workflow**
6. ⏳ **Testar deploy automático**

---

## 🆘 Ajuda

### **Como ver as chaves novamente?**

**Chave pública:**

```powershell
Get-Content C:\Users\Ian_1\.ssh\atenmed_deploy.pub
```

**Chave privada:**

```powershell
Get-Content C:\Users\Ian_1\.ssh\atenmed_deploy
```

### **Como copiar chave para área de transferência?**

**Chave pública:**

```powershell
Get-Content C:\Users\Ian_1\.ssh\atenmed_deploy.pub | Set-Clipboard
```

**Chave privada:**

```powershell
Get-Content C:\Users\Ian_1\.ssh\atenmed_deploy | Set-Clipboard
```

### **Qual chave vai onde?**

| Chave                          | Onde usar                           |
| ------------------------------ | ----------------------------------- |
| `atenmed_deploy.pub` (pública) | Servidor (`~/.ssh/authorized_keys`) |
| `atenmed_deploy` (privada)     | GitHub Secret (`SERVER_SSH_KEY`)    |

---

## 📞 Próximo Passo

**Agora você precisa:**

1. Conectar no servidor via SSH
2. Adicionar a chave pública lá

**Tem acesso SSH ao servidor?**

- ✅ Sim → Siga o Passo 1 acima
- ❌ Não → Precisa obter acesso ou pedir para alguém adicionar a chave

---

**Última atualização:** Janeiro 2025  
**Status:** ✅ Chave SSH criada - Aguardando configuração no servidor
