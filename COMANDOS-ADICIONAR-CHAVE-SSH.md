# 🔑 Comandos para Adicionar Chave SSH no Servidor

## ✅ Chave já copiada para área de transferência!

A chave pública já está no clipboard do Windows.

---

## 🖥️ No Servidor (via SSH)

Você está conectado no servidor via:

```bash
ssh -i C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem ubuntu@3.129.206.231
```

### **Execute estes comandos no servidor:**

```bash
# 1. Verificar se diretório .ssh existe
ls -la ~/.ssh

# 2. Criar diretório se não existir
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 3. Adicionar chave pública
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFwNOxL9PDlSY4oY4+cszpQdJDzJrqty5pDp9T87gG2X github-deploy-atenmed" >> ~/.ssh/authorized_keys

# 4. Ajustar permissões (IMPORTANTE!)
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# 5. Verificar se foi adicionada
cat ~/.ssh/authorized_keys

# 6. Sair do servidor
exit
```

---

## 🧪 Testar Nova Chave

Depois de adicionar, teste no Windows:

```powershell
ssh -i C:\Users\Ian_1\.ssh\atenmed_deploy ubuntu@3.129.206.231
```

**Resultado esperado:**

- ✅ Conecta sem pedir senha!
- ❌ Se pedir senha → revisar comandos acima

---

## 📝 Próximos Passos (Depois da Chave Adicionada)

### 1. Configurar GitHub Secrets

Acessar: https://github.com/imaxcodeco/atenmed-website/settings/secrets/actions

Adicionar:

**SERVER_HOST:**

```
3.129.206.231
```

**SERVER_USER:**

```
ubuntu
```

**SERVER_SSH_KEY:**

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBcDTsS/Tw5UmOKGOPnLM6UHSQ8ya6rcuaQ6fU/O4BtlwAAAJifRmxkn0Zs
ZAAAAAtzc2gtZWQyNTUxOQAAACBcDTsS/Tw5UmOKGOPnLM6UHSQ8ya6rcuaQ6fU/O4Btlw
AAAEDxmiBbHkTQIh9gSYEPBtUDKG+o8JQuQjS1N203W8WtTlwNOxL9PDlSY4oY4+cszpQd
JDzJrqty5pDp9T87gG2XAAAAFWdpdGh1Yi1kZXBsb3ktYXRlbm1lZA==
-----END OPENSSH PRIVATE KEY-----
```

### 2. Reativar Deploy Automático

Avisar-me quando os Secrets estiverem configurados!

---

## 🎯 Resumo dos Dados do Servidor

```
Host: 3.129.206.231
User: ubuntu
Port: 22 (padrão)
SSH Key: C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem
```
