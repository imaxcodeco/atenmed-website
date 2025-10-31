# 🔧 Corrigir Erro SSH no Deploy

## ❌ ERRO ENCONTRADO

```
Error: can't connect without a private SSH key or password
Error: Process completed with exit code 1.
```

## 🔍 CAUSA DO PROBLEMA

O GitHub Actions não conseguiu conectar ao servidor porque o secret `SERVER_SSH_KEY` não está configurado ou está incorreto.

---

## ✅ SOLUÇÃO

### **1. Verificar se SERVER_SSH_KEY Existe:**

1. Acesse: `https://github.com/imaxcodeco/atenmed-website/settings/secrets/actions`
2. Procure por `SERVER_SSH_KEY` na lista
3. Se **NÃO existir**, precisa criar

### **2. Obter a Chave SSH (.pem):**

A chave SSH é o arquivo `.pem` que você usa para conectar ao servidor.

**Provavelmente está em:**
```
C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem
```

### **3. Adicionar no GitHub Secrets:**

1. **Abra o arquivo .pem** no Notepad ou editor de texto
2. **Copie TODO o conteúdo**, incluindo:
   ```
   -----BEGIN RSA PRIVATE KEY-----
   MIIEpAIBAAKCAQEA...
   (todas as linhas aqui)
   ...
   -----END RSA PRIVATE KEY-----
   ```

3. **No GitHub:**
   - Settings → Secrets → Actions
   - "New repository secret"
   - **Name:** `SERVER_SSH_KEY`
   - **Secret:** Cole TODO o conteúdo do arquivo .pem
   - Clique em "Add secret"

### **4. Verificar Outros Secrets Necessários:**

Certifique-se de que também configurou:

- [x] `SERVER_HOST` - IP do servidor (ex: `3.129.206.231`)
- [x] `SERVER_USER` - Usuário SSH (ex: `ubuntu`)
- [x] `SERVER_SSH_KEY` - Conteúdo completo do arquivo .pem ← **ESTE ESTÁ FALTANDO!**
- [ ] `SERVER_PORT` - Porta SSH (opcional, padrão: `22`)

---

## 📋 COMO COPIAR A CHAVE .pem (Windows)

### **Opção 1: PowerShell**
```powershell
# Visualizar conteúdo:
Get-Content C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem

# Copiar para clipboard:
Get-Content C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem | Set-Clipboard
```

### **Opção 2: Notepad**
1. Clique com botão direito no arquivo `.pem`
2. "Abrir com" → "Notepad"
3. Ctrl+A (selecionar tudo)
4. Ctrl+C (copiar)
5. Colar no GitHub Secret

---

## ⚠️ IMPORTANTE - FORMATO DA CHAVE

A chave **DEVE** incluir as linhas de início e fim:

```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
(muitas linhas aqui)
...
-----END RSA PRIVATE KEY-----
```

**OU:**

```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQ...
(muitas linhas aqui)
...
-----END PRIVATE KEY-----
```

---

## 🧪 TESTAR A CHAVE

Antes de adicionar no GitHub, teste se a chave funciona:

```bash
# No PowerShell:
ssh -i C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem ubuntu@3.129.206.231
```

Se conectar, a chave está correta!

---

## 🔄 APÓS CORRIGIR

1. Adicione o secret `SERVER_SSH_KEY` no GitHub
2. Verifique os outros secrets (`SERVER_HOST`, `SERVER_USER`)
3. Faça um novo push OU:
   - Vá para: Actions → "Deploy to Production"
   - Clique em "Run workflow"
   - Selecione branch `main`
   - "Run workflow"

---

## 📝 CHECKLIST RÁPIDO

- [ ] Arquivo `.pem` encontrado
- [ ] Conteúdo do `.pem` copiado (com BEGIN e END)
- [ ] Secret `SERVER_SSH_KEY` criado no GitHub
- [ ] Secret `SERVER_HOST` configurado
- [ ] Secret `SERVER_USER` configurado (geralmente `ubuntu`)
- [ ] Teste SSH local funcionando
- [ ] Novo deploy executado

---

**Depois de corrigir, o deploy deve funcionar! 🚀**

