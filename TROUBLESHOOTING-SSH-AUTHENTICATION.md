# 🔧 Troubleshooting - SSH Authentication ainda falhando

## ❌ ERRO PERSISTENTE

Mesmo após corrigir, ainda dá erro:
```
ssh: handshake failed: ssh: unable to authenticate, attempted methods [none publickey]
```

---

## 🔍 POSSÍVEIS CAUSAS

### **1. Chave Pública Não Corresponde à Privada**

A chave pública no servidor **DEVE** corresponder à chave privada no GitHub Secret.

**Verificar no servidor:**
```bash
cat ~/.ssh/authorized_keys
```

**Deve mostrar:**
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCbeXSRSdJGR7c5+u93YXEEEmaYofPhtVOtQifGggbu7IvU1kxN4pMWNefZCTnvAqMhJn2RARGtzHrQUrkilFvMhZV1YVy83H0M4tRAlnXPkyL17tRHlaVH5+GCOPM+3t6fmzwCAQW3x1os4608QaMp0/+13xLhLgY9IHIv9FnDCjmT9xMY9SOoE8dExa76JouTHRDnXHpLicmWZ+cmHkkirCks3buOTVezRC2xttpLtOXZmbDod1huDUw5aXfYMlqG9MyQYCaFOWNX52yW2qMBRUipIBRlTFUBI8XjiIgojTVnEXNC2We2z4c1nkxKj1tAE8LQhZ9ZQ6Xqyf1dJhkh
```

**Verificar se corresponde:**
```powershell
# No Windows, gerar chave pública novamente:
ssh-keygen -y -f C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem
```

A linha gerada **DEVE ser IGUAL** à que está no servidor!

---

### **2. Usuário Incorreto**

O GitHub Actions está tentando conectar com qual usuário?

**Verificar no GitHub Secret:**
- `SERVER_USER` deve ser: `ubuntu`

**Mas pode ser outro usuário no seu servidor!**

**Verificar no servidor:**
```bash
whoami
```

**Se for diferente de `ubuntu`, atualize o secret `SERVER_USER`!**

---

### **3. Permissões Incorretas**

**No servidor, verificar permissões:**
```bash
ls -la ~/.ssh/
```

**Deve mostrar:**
```
drwx------ 2 ubuntu ubuntu 4096 ... .ssh
-rw------- 1 ubuntu ubuntu   XXX ... authorized_keys
```

**Se não estiver assim, corrigir:**
```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chown ubuntu:ubuntu ~/.ssh/authorized_keys
```

---

### **4. Arquivo authorized_keys com Formato Errado**

**Verificar no servidor:**
```bash
cat ~/.ssh/authorized_keys
```

**Deve ser:**
- ✅ **Uma única linha** (não várias)
- ✅ Começa com `ssh-rsa`
- ✅ Sem espaços extras no início/fim
- ✅ Sem quebras de linha no meio

**Se tiver problemas, recriar:**
```bash
# Limpar e recriar:
> ~/.ssh/authorized_keys
nano ~/.ssh/authorized_keys
# (Colar APENAS a linha ssh-rsa, sem quebras)
chmod 600 ~/.ssh/authorized_keys
```

---

### **5. IP ou Porta Incorretos**

**Verificar secrets no GitHub:**
- `SERVER_HOST` - Deve ser o IP correto
- `SERVER_PORT` - Deve ser `22` (ou porta SSH do servidor)

**Testar localmente:**
```powershell
ssh -i C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem ubuntu@3.129.206.231 -p 22
```

Se funcionar local mas não no GitHub = problema com o secret.

---

## 🔧 SOLUÇÃO PASSO A PASSO

### **PASSO 1: Verificar Chave Pública no Servidor**

```bash
# No servidor:
cat ~/.ssh/authorized_keys | head -c 100
```

**Deve começar com:** `ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCbeXSRSdJGR7c5`

### **PASSO 2: Gerar Chave Pública Novamente no Windows**

```powershell
ssh-keygen -y -f C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem
```

**Copiar a linha completa**

### **PASSO 3: Comparar**

A linha gerada no Windows **DEVE ser IGUAL** à que está no servidor.

**Se diferente:**
1. Substituir no servidor:
   ```bash
   nano ~/.ssh/authorized_keys
   # Deletar tudo, colar a nova chave
   ```
2. Verificar permissões:
   ```bash
   chmod 600 ~/.ssh/authorized_keys
   ```

### **PASSO 4: Verificar Usuário**

```bash
# No servidor:
whoami
echo $HOME
```

**Confirme que é `ubuntu` ou atualize o secret `SERVER_USER`**

### **PASSO 5: Testar Localmente**

```powershell
# No Windows:
ssh -i C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem ubuntu@3.129.206.231
```

**Se funcionar local mas não no GitHub = problema com o secret no GitHub**

---

## 🔄 RECRIAR SECRET SERVER_SSH_KEY

Se nada funcionar, pode ser que o secret no GitHub esteja corrompido:

1. **Gerar chave pública novamente:**
   ```powershell
   Get-Content C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem | Set-Clipboard
   ```

2. **No GitHub:**
   - Deletar secret `SERVER_SSH_KEY` antigo
   - Criar novo com o conteúdo completo do .pem

3. **Garantir que inclui BEGIN e END**

---

## ✅ CHECKLIST COMPLETO

- [ ] Chave pública no servidor corresponde à privada
- [ ] Arquivo `authorized_keys` tem apenas UMA linha
- [ ] Permissões corretas (600 para authorized_keys, 700 para .ssh)
- [ ] Usuário correto (`ubuntu` ou o que estiver configurado)
- [ ] IP e porta corretos nos secrets
- [ ] Teste local funcionando
- [ ] Secret `SERVER_SSH_KEY` no GitHub está completo

---

**Vamos verificar cada ponto sistematicamente! 🔍**

