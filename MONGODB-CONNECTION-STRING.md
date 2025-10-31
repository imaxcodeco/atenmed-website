# 🔐 MongoDB Atlas - String de Conexão Completa

## ✅ SUA SENHA ESTÁ CONFIGURADA!

**Usuário:** `ianmaxcodeco_atenmed`  
**Senha:** `Bia140917#`  
**Cluster:** `cluster0.fcpsqdo.mongodb.net`  
**Banco:** `atenmed`

---

## 📝 STRING DE CONEXÃO COMPLETA

### **Para GitHub Secret `MONGODB_URI`:**

```
mongodb+srv://ianmaxcodeco_atenmed:Bia140917%23@cluster0.fcpsqdo.mongodb.net/atenmed?retryWrites=true&w=majority&appName=Cluster0
```

⚠️ **IMPORTANTE:** O `#` na senha foi codificado como `%23` na URL!

---

## 🔍 EXPLICAÇÃO

### **Senha com Caracteres Especiais:**

A senha `Bia140917#` contém o caractere `#`, que precisa ser codificado na URL:

- `#` → `%23`

### **String Montada:**

```
mongodb+srv://
  ianmaxcodeco_atenmed    ← Usuário
  :                        ← Separador
  Bia140917%23            ← Senha (com # codificado)
  @                        ← Separador
  cluster0.fcpsqdo.mongodb.net  ← Cluster
  /atenmed                 ← Banco de dados
  ?retryWrites=true&w=majority&appName=Cluster0  ← Parâmetros
```

---

## ✅ COMO CONFIGURAR NO GITHUB

### **1. Acessar GitHub Secrets:**
- Vá para: `https://github.com/seu-usuario/seu-repo/settings/secrets/actions`
- Clique em **"New repository secret"**

### **2. Preencher:**
- **Name:** `MONGODB_URI`
- **Secret:** Cole a string completa abaixo:

```
mongodb+srv://ianmaxcodeco_atenmed:Bia140917%23@cluster0.fcpsqdo.mongodb.net/atenmed?retryWrites=true&w=majority&appName=Cluster0
```

### **3. Salvar:**
- Clique em **"Add secret"**

---

## ⚠️ IMPORTANTE - WHITELIST DE IPs

Antes de fazer deploy, certifique-se de que o IP do servidor está na whitelist do MongoDB Atlas:

1. **Acessar MongoDB Atlas:**
   - https://cloud.mongodb.com
   - Network Access

2. **Adicionar IP:**
   - **"Add IP Address"**
   - Para produção: Adicione o IP do seu servidor EC2
   - Para testes: Pode usar `0.0.0.0/0` (permitir qualquer IP - **não recomendado para produção**)

3. **Aguardar alguns minutos** para as mudanças serem aplicadas

---

## 🧪 TESTAR CONEXÃO

### **Opção 1: Script Automático**
```bash
node scripts/testar-mongodb-atlas.js "Bia140917#"
```

### **Opção 2: Node.js Direto**
```javascript
const mongoose = require('mongoose');
const uri = 'mongodb+srv://ianmaxcodeco_atenmed:Bia140917%23@cluster0.fcpsqdo.mongodb.net/atenmed?retryWrites=true&w=majority';

mongoose.connect(uri)
  .then(() => console.log('✅ Conectado!'))
  .catch(err => console.error('❌ Erro:', err));
```

---

## 📋 CHECKLIST

Antes de fazer deploy:

- [x] Senha identificada: `Bia140917#`
- [x] String de conexão gerada (com `#` codificado como `%23`)
- [ ] Secret `MONGODB_URI` configurado no GitHub
- [ ] IP do servidor adicionado na whitelist do MongoDB Atlas
- [ ] Conexão testada com sucesso

---

## 🔐 SEGURANÇA

⚠️ **ATENÇÃO:** Este arquivo contém a senha em texto claro. Após configurar no GitHub:

1. **NÃO commitar este arquivo no Git**
2. **Remover ou proteger este arquivo**
3. **A senha já está salva no GitHub Secrets (seguro)**

---

**Última atualização:** $(date)

