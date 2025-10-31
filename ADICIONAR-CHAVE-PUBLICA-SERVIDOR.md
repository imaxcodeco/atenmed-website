# 🔑 Adicionar Chave Pública ao Servidor

## ✅ SUA CHAVE PÚBLICA (Já Copiada!)

A chave pública foi gerada e copiada para o clipboard.

**Formato:**
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCbeXSRSdJGR7c5+u93YXEEEmaYofPhtVOtQifGggbu7IvU1kxN4pMWNefZCTnvAqMhJn2RARGtzHrQUrkilFvMhZV1YVy83H0M4tRAlnXPkyL17tRHlaVH5+GCOPM+3t6fmzwCAQW3x1os4608QaMp0/+13xLhLgY9IHIv9FnDCjmT9xMY9SOoE8dExa76JouTHRDnXHpLicmWZ+cmHkkirCks3buOTVezRC2xttpLtOXZmbDod1huDUw5aXfYMlqG9MyQYCaFOWNX52yW2qMBRUipIBRlTFUBI8XjiIgojTVnEXNC2We2z4c1nkxKj1tAE8LQhZ9ZQ6Xqyf1dJhkh
```

---

## 🚀 COMO ADICIONAR AO SERVIDOR

### **OPÇÃO 1: Se Você Consegue Conectar ao Servidor**

Se você tem outra forma de conectar (senha, outra chave, ou console AWS):

```bash
# 1. Conectar ao servidor:
ssh ubuntu@3.129.206.231
# (ou use o método que você usa)

# 2. Criar pasta .ssh (se não existir):
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 3. Abrir arquivo authorized_keys:
nano ~/.ssh/authorized_keys

# 4. COLAR a chave pública (Ctrl+V ou botão direito)
# (A chave já está no seu clipboard!)

# 5. Salvar: Ctrl+X, depois Y, depois Enter

# 6. Ajustar permissões:
chmod 600 ~/.ssh/authorized_keys

# 7. Verificar:
cat ~/.ssh/authorized_keys
# Deve mostrar a chave que você colou
```

---

### **OPÇÃO 2: Via AWS EC2 Console (Se Não Consegue Conectar)**

1. **Acessar AWS Console:**
   - https://console.aws.amazon.com
   - EC2 → Instances

2. **Conectar via Session Manager ou EC2 Instance Connect:**
   - Selecione sua instância
   - "Connect"
   - Escolha método de conexão

3. **No terminal do servidor, executar:**
   ```bash
   mkdir -p ~/.ssh
   chmod 700 ~/.ssh
   nano ~/.ssh/authorized_keys
   ```

4. **Colar a chave pública** (que está no seu clipboard)

5. **Salvar e ajustar permissões:**
   ```bash
   chmod 600 ~/.ssh/authorized_keys
   ```

---

### **OPÇÃO 3: Usando SSH Local (Se Tiver Outra Chave Funcionando)**

Se você tem outra chave que funciona:

```bash
# 1. Copiar chave pública usando ssh-copy-id:
ssh-copy-id -i C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem.pub ubuntu@3.129.206.231

# OU manualmente após conectar:
cat public-key.pub >> ~/.ssh/authorized_keys
```

---

## 🧪 TESTAR DEPOIS DE ADICIONAR

Após adicionar a chave pública ao servidor:

```powershell
# Testar conexão:
ssh -i C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem ubuntu@3.129.206.231
```

**Se conectar sem pedir senha = ✅ Funcionou!**

---

## ✅ DEPOIS DE FUNCIONAR

1. **Teste local está OK** (conexão SSH funciona)
2. **Execute deploy novamente** no GitHub Actions
3. **Deploy deve funcionar!** 🚀

---

## 📝 RESUMO DOS COMANDOS

**No servidor (após conectar):**
```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# (Cole a chave pública aqui - Ctrl+V)
# (Salvar: Ctrl+X, Y, Enter)
chmod 600 ~/.ssh/authorized_keys
```

**Teste local:**
```powershell
ssh -i C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem ubuntu@3.129.206.231
```

---

**A chave pública está no seu clipboard! Basta colar no servidor! 📋**

