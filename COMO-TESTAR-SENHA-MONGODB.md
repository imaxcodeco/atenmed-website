# 🔐 Como Testar Senha do MongoDB Atlas

Você esqueceu a senha? Aqui estão várias formas de testar e recuperar!

---

## 🚀 OPÇÃO 1: Usar Script Automático (Recomendado)

### **1. Executar o Script:**

```bash
node scripts/testar-mongodb-atlas.js
```

O script vai pedir a senha para testar.

### **2. Ou passar a senha diretamente:**

```bash
node scripts/testar-mongodb-atlas.js "sua-senha-aqui"
```

### **3. O que o script faz:**
- ✅ Testa a conexão com MongoDB Atlas
- ✅ Mostra se a senha está correta
- ✅ Lista as coleções do banco
- ✅ Gera a string de conexão completa se funcionar

---

## 🔄 OPÇÃO 2: Redefinir Senha no MongoDB Atlas

Se você realmente não sabe a senha, **redefina no MongoDB Atlas**:

### **Passo a Passo:**

1. **Acessar MongoDB Atlas:**
   - Vá para: https://cloud.mongodb.com
   - Faça login na sua conta

2. **Ir para Database Access:**
   - No menu lateral: **Database Access**
   - Ou: https://cloud.mongodb.com/v2#/security/database/users

3. **Encontrar seu usuário:**
   - Procure por: `ianmaxcodeco_atenmed`
   - Clique no usuário

4. **Redefinir Senha:**
   - Clique em **"Edit"** ou **"..."** → **"Edit"**
   - Clique em **"Edit Password"**
   - Digite uma nova senha forte
   - Salve

5. **Testar Nova Senha:**
   ```bash
   node scripts/testar-mongodb-atlas.js "nova-senha-aqui"
   ```

---

## 🧪 OPÇÃO 3: Testar Manualmente com Node.js

### **Criar arquivo temporário `test-mongo.js`:**

```javascript
const mongoose = require('mongoose');

const password = 'SUA_SENHA_AQUI'; // Substituir pela senha
const connectionString = `mongodb+srv://ianmaxcodeco_atenmed:${encodeURIComponent(password)}@cluster0.fcpsqdo.mongodb.net/atenmed?retryWrites=true&w=majority`;

mongoose.connect(connectionString)
  .then(() => {
    console.log('✅ CONECTADO! Senha está correta!');
    console.log('\nString de conexão:');
    console.log(connectionString);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ ERRO:', err.message);
    if (err.message.includes('authentication')) {
      console.error('Senha incorreta!');
    }
    process.exit(1);
  });
```

### **Executar:**
```bash
node test-mongo.js
```

---

## 🔍 OPÇÃO 4: Verificar Senha no .env (Se Tiver)

Se você já configurou no `.env` antes:

### **1. Verificar arquivo .env:**
```bash
# Windows (PowerShell):
Get-Content .env | Select-String "MONGODB_URI"

# Linux/Mac:
grep MONGODB_URI .env
```

### **2. Se encontrar, extrair senha:**
A senha estará na string entre `:` e `@`:
```
mongodb+srv://usuario:SENHA_AQUI@cluster...
```

---

## 🔑 OPÇÃO 5: Criar Novo Usuário no MongoDB Atlas

Se não conseguir a senha, crie um novo usuário:

### **Passo a Passo:**

1. **MongoDB Atlas → Database Access**
2. **"Add New Database User"**
3. **Preencher:**
   - Authentication Method: `Password`
   - Username: `atenmed_app` (ou outro nome)
   - Password: Criar senha forte
   - Database User Privileges: `Read and write to any database`

4. **Usar novo usuário:**
   ```
   mongodb+srv://atenmed_app:NOVA_SENHA@cluster0.fcpsqdo.mongodb.net/atenmed?retryWrites=true&w=majority
   ```

---

## ⚠️ PROBLEMAS COMUNS

### **Erro: "authentication failed"**
- ❌ Senha incorreta
- ✅ **Solução:** Redefina a senha no MongoDB Atlas

### **Erro: "IP not whitelisted"**
- ❌ Seu IP não está autorizado
- ✅ **Solução:** MongoDB Atlas → Network Access → Add IP Address

### **Erro: "timeout"**
- ❌ Problema de rede ou cluster offline
- ✅ **Solução:** Verificar internet e status do cluster

### **Senha com Caracteres Especiais**
Se sua senha tem `@`, `#`, `$`, etc.:

**Codificar na URL:**
```javascript
const encoded = encodeURIComponent('Senha@123');
// Resultado: Senha%40123
```

---

## 📋 CHECKLIST

- [ ] Senha testada com script
- [ ] Conexão bem-sucedida
- [ ] String de conexão gerada
- [ ] IP adicionado na whitelist
- [ ] Secret `MONGODB_URI` configurado no GitHub

---

## 🎯 RESULTADO ESPERADO

Quando a senha estiver correta, você verá:

```
✅ SUCESSO! Conexão estabelecida!
   Host: cluster0-shard-00-00.fcpsqdo.mongodb.net
   Database: atenmed
   Status: Conectado

📊 Coleções encontradas: X

✅ Teste concluído com sucesso!

📝 String de conexão para usar:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
mongodb+srv://ianmaxcodeco_atenmed:SUA_SENHA@cluster0.fcpsqdo.mongodb.net/atenmed?retryWrites=true&w=majority
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

**💡 Dica:** Se você esqueceu completamente a senha, a melhor opção é **redefinir no MongoDB Atlas** (Opção 2). É mais rápido e seguro do que tentar adivinhar!

