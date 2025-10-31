# 🔧 Corrigir Erro de Autenticação SSH

## ❌ ERRO ATUAL

```
ssh: handshake failed: ssh: unable to authenticate, attempted methods [none publickey], 
no supported methods remain
```

## 🔍 O QUE ISSO SIGNIFICA

- ✅ A chave SSH está sendo lida (não dá mais erro de "sem chave")
- ❌ Mas a **chave pública não está autorizada** no servidor
- ❌ O servidor não reconhece a chave privada que você está usando

---

## ✅ SOLUÇÃO

### **OPÇÃO 1: Adicionar Chave Pública ao Servidor (Recomendado)**

A chave pública precisa estar no arquivo `~/.ssh/authorized_keys` do servidor.

#### **Passo 1: Gerar Chave Pública a Partir da Privada**

```powershell
# No seu Windows, instalar ssh-keygen se não tiver
# (geralmente vem com Git)

# Gerar chave pública a partir da privada:
ssh-keygen -y -f C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem > public-key.pub

# Ver o conteúdo:
Get-Content public-key.pub
```

#### **Passo 2: Copiar Chave Pública para o Servidor**

```bash
# Conectar ao servidor:
ssh -i C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem ubuntu@3.129.206.231

# Se conectar, fazer:
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Copiar a chave pública (que você gerou acima):
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAA..." >> ~/.ssh/authorized_keys

# Ou editar manualmente:
nano ~/.ssh/authorized_keys
# (cole a chave pública aqui)

# Ajustar permissões:
chmod 600 ~/.ssh/authorized_keys
```

---

### **OPÇÃO 2: Verificar se Chave Pública Já Existe**

Pode ser que a chave pública já esteja no servidor, mas com formato diferente.

```bash
# Conectar ao servidor:
ssh -i C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem ubuntu@3.129.206.231

# Ver chaves existentes:
cat ~/.ssh/authorized_keys

# Se não existir o arquivo ou estiver vazio, criar:
mkdir -p ~/.ssh
chmod 700 ~/.ssh
```

---

### **OPÇÃO 3: Usar ssh-copy-id (Mais Fácil)**

```powershell
# No Windows, se tiver OpenSSH instalado:
ssh-copy-id -i C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem ubuntu@3.129.206.231
```

**OU manualmente:**

```powershell
# 1. Gerar chave pública:
ssh-keygen -y -f C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem

# 2. Copiar a saída (linha ssh-rsa...)

# 3. Conectar e adicionar:
ssh -i C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem ubuntu@3.129.206.231

# 4. No servidor:
echo "COLE_A_CHAVE_PUBLICA_AQUI" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

---

## 🧪 TESTAR CONEXÃO LOCAL

Antes de tentar o deploy, teste localmente:

```powershell
# Testar se a chave funciona:
ssh -i C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem ubuntu@3.129.206.231
```

**Se conectar = chave está correta, só precisa autorizar no servidor**  
**Se não conectar = verificar chave ou permissões do arquivo .pem**

---

## 📋 PASSOS COMPLETOS

### **1. Gerar Chave Pública:**

```powershell
ssh-keygen -y -f C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem
```

**Copie a linha que começa com `ssh-rsa`**

### **2. Conectar ao Servidor (se ainda conseguir):**

```powershell
ssh -i C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem ubuntu@3.129.206.231
```

### **3. Adicionar Chave Pública:**

```bash
# No servidor:
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys

# Cole a chave pública (a linha ssh-rsa...)
# Salvar: Ctrl+X, Y, Enter

# Ajustar permissões:
chmod 600 ~/.ssh/authorized_keys
```

### **4. Testar Novamente:**

```powershell
# Desconectar e testar:
ssh -i C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem ubuntu@3.129.206.231
```

**Se conectar sem pedir senha = está funcionando!**

### **5. Testar Deploy:**

Voltar ao GitHub Actions e executar deploy novamente.

---

## ⚠️ PROBLEMAS COMUNS

### **Erro: "Permission denied (publickey)"**

- Chave pública não está no servidor
- Permissões incorretas (`~/.ssh` deve ser 700, `authorized_keys` deve ser 600)

### **Erro: "ssh: connect to host... Connection refused"**

- Servidor não está acessível
- Firewall bloqueando porta 22
- IP incorreto

### **Erro: "No such file or directory"**

- Pasta `.ssh` não existe → criar com `mkdir -p ~/.ssh`

---

## 🔑 GERAR CHAVE PÚBLICA RAPIDAMENTE

Script para gerar e copiar:

```powershell
# Gerar chave pública e copiar para clipboard:
ssh-keygen -y -f C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem | Set-Clipboard
Write-Host "Chave pública copiada! Cole no servidor em ~/.ssh/authorized_keys"
```

---

## ✅ CHECKLIST

- [ ] Chave pública gerada a partir da privada
- [ ] Conectado ao servidor (mesmo que com outro método)
- [ ] Pasta `~/.ssh` criada no servidor
- [ ] Chave pública adicionada em `~/.ssh/authorized_keys`
- [ ] Permissões corretas (700 para .ssh, 600 para authorized_keys)
- [ ] Teste local funcionando (ssh sem senha)
- [ ] Deploy testado novamente

---

**Depois de corrigir, o deploy deve funcionar! 🚀**

