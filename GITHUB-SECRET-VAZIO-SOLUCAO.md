# 🔧 GitHub Secret Parece Vazio - Solução

## ❓ O PROBLEMA

Você preenche o secret no GitHub, mas quando volta, parece vazio.

## ✅ EXPLICAÇÃO

**ISSO É NORMAL!** O GitHub **intencionalmente NÃO mostra** o valor dos secrets depois de salvar por **segurança**.

### **O que você VÊ:**
```
SERVER_SSH_KEY    ●●●●●●●●●●  (apenas pontos)
```

### **O que isso significa:**
- ✅ O secret **está salvo** corretamente
- ✅ O valor **não foi perdido**
- ✅ O GitHub apenas **oculta** o valor por segurança
- ❌ Você **não consegue ver** o valor (por design)

---

## 🔍 COMO VERIFICAR SE ESTÁ SALVO

### **1. Verificar na Lista:**

1. Acesse: `https://github.com/imaxcodeco/atenmed-website/settings/secrets/actions`
2. **Procure por `SERVER_SSH_KEY` na lista**
3. Se aparecer = **ESTÁ SALVO!** ✅

### **2. Testar com Deploy:**

A **única forma real** de saber se está correto é **testar**:

1. Vá para: Actions → "Deploy to Production"
2. "Run workflow"
3. Se **não der erro de SSH** = Está funcionando! ✅

---

## 🛠️ COPIAR CHAVE CORRETAMENTE

Use o script que criei para copiar automaticamente:

```powershell
.\scripts\copiar-chave-ssh.ps1
```

**OU manualmente:**

```powershell
# Copiar chave para clipboard:
Get-Content C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem -Raw | Set-Clipboard
```

Depois:
1. Cole no GitHub (Ctrl+V)
2. Verifique que o campo **tem conteúdo** (antes de salvar você vê)
3. Clique em "Add secret"
4. **Depois não vai ver mais** (isso é normal!)

---

## ⚠️ PROBLEMAS COMUNS

### **1. Campo Vazio ao Colar:**

**Solução:** Tente copiar novamente:
```powershell
# Use -Raw para manter formatação:
Get-Content C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem -Raw | Set-Clipboard
```

### **2. Chave Não Funciona no Deploy:**

**Possíveis causas:**
- Chave incompleta (faltam linhas BEGIN ou END)
- Caracteres especiais corrompidos
- Chave de outro servidor

**Solução:**
1. Delete o secret antigo
2. Recrie copiando a chave COMPLETA
3. Teste novamente

### **3. Ainda Dá Erro "can't connect":**

Verifique outros secrets:
- `SERVER_HOST` - IP correto?
- `SERVER_USER` - geralmente `ubuntu`
- `SERVER_PORT` - 22 (opcional)

---

## ✅ CHECKLIST FINAL

- [ ] Chave copiada COMPLETA (com BEGIN e END)
- [ ] Secret `SERVER_SSH_KEY` aparece na LISTA de secrets
- [ ] Campo estava PREENCHIDO antes de salvar
- [ ] Teste de deploy executado
- [ ] Não dá erro de SSH nos logs

---

## 🎯 RESUMO

**GitHub Secrets são OCULTOS por design!**

- ✅ Se aparece na lista = Está salvo
- ✅ Se deploy funciona = Está correto
- ❌ Você nunca vai ver o valor depois (é seguro assim!)

**Confie no processo e teste com o deploy!** 🚀

