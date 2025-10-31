# 🔐 Configuração MongoDB Atlas - AtenMed

## 📋 SUA STRING DE CONEXÃO

A string que você forneceu:
```
mongodb+srv://ianmaxcodeco_atenmed:<db_password>@cluster0.fcpsqdo.mongodb.net/?appName=Cluster0
```

---

## ✅ COMO CONFIGURAR CORRETAMENTE

### **1. Substituir a Senha**

Substitua `<db_password>` pela senha real do seu usuário no MongoDB Atlas.

**Exemplo:**
```
mongodb+srv://ianmaxcodeco_atenmed:MinhaSenha123@cluster0.fcpsqdo.mongodb.net/?appName=Cluster0
```

### **2. Adicionar Nome do Banco**

Adicione `/atenmed` antes do `?` na string:

**String FINAL correta:**
```
mongodb+srv://ianmaxcodeco_atenmed:MinhaSenha123@cluster0.fcpsqdo.mongodb.net/atenmed?appName=Cluster0
```

**OU com parâmetros adicionais (recomendado):**
```
mongodb+srv://ianmaxcodeco_atenmed:MinhaSenha123@cluster0.fcpsqdo.mongodb.net/atenmed?retryWrites=true&w=majority&appName=Cluster0
```

---

## 🔑 CONFIGURAR NO GITHUB SECRETS

### **Passo a Passo:**

1. **Acessar GitHub Secrets:**
   - Vá para: `https://github.com/seu-usuario/seu-repo/settings/secrets/actions`
   - Clique em **"New repository secret"**

2. **Preencher:**
   - **Name:** `MONGODB_URI`
   - **Secret:** Cole a string completa (com senha real e `/atenmed`)

3. **Exemplo do Secret:**
   ```
   mongodb+srv://ianmaxcodeco_atenmed:SUA_SENHA_REAL@cluster0.fcpsqdo.mongodb.net/atenmed?retryWrites=true&w=majority
   ```

---

## ⚠️ ATENÇÕES IMPORTANTES

### **1. Senha com Caracteres Especiais:**

Se sua senha tiver caracteres especiais (`@`, `#`, `$`, `%`, etc.), eles precisam ser codificados na URL:

| Caractere | Código URL |
|-----------|------------|
| `@`       | `%40`      |
| `#`       | `%23`      |
| `$`       | `%24`      |
| `%`       | `%25`      |
| `&`       | `%26`      |
| `+`       | `%2B`      |
| `=`       | `%3D`      |

**Exemplo:** Se sua senha é `Senha@123`
```
Senha%40123
```

### **2. Whitelist de IPs:**

No MongoDB Atlas, você precisa adicionar o IP do seu servidor na whitelist:

1. MongoDB Atlas → **Network Access**
2. **Add IP Address**
3. Adicionar IP do servidor OU `0.0.0.0/0` (permitir qualquer IP - apenas para desenvolvimento)

**Para produção:** Use o IP específico do servidor

### **3. Verificar Usuário:**

Certifique-se de que o usuário `ianmaxcodeco_atenmed`:
- ✅ Existe no MongoDB Atlas
- ✅ Tem senha configurada
- ✅ Tem permissões adequadas (read/write)

---

## 🧪 TESTAR CONEXÃO

### **Teste Local (Antes de fazer deploy):**

```bash
# Criar arquivo .env.local
echo "MONGODB_URI=mongodb+srv://ianmaxcodeco_atenmed:SUA_SENHA@cluster0.fcpsqdo.mongodb.net/atenmed?retryWrites=true&w=majority" > .env.test

# Testar conexão com Node.js
node -e "
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.test' });
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado ao MongoDB Atlas!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  });
"
```

### **Verificar após Deploy:**

```bash
# No servidor
pm2 logs atenmed | grep -i mongodb

# Deve aparecer:
# 🗄️ MongoDB conectado: cluster0-shard-00-00.fcpsqdo.mongodb.net
```

---

## 📝 RESUMO

### **String para GitHub Secret `MONGODB_URI`:**

```
mongodb+srv://ianmaxcodeco_atenmed:SUA_SENHA_REAL@cluster0.fcpsqdo.mongodb.net/atenmed?retryWrites=true&w=majority
```

**Onde:**
- `ianmaxcodeco_atenmed` - seu usuário (✅ já está correto)
- `SUA_SENHA_REAL` - substituir pela senha real
- `cluster0.fcpsqdo.mongodb.net` - seu cluster (✅ já está correto)
- `/atenmed` - nome do banco de dados (✅ adicionado)
- `?retryWrites=true&w=majority` - parâmetros recomendados

---

## ✅ CHECKLIST

Antes de fazer deploy:

- [ ] Senha do usuário MongoDB Atlas configurada
- [ ] String de conexão testada localmente
- [ ] `/atenmed` adicionado na string
- [ ] IP do servidor adicionado na whitelist do Atlas
- [ ] Secret `MONGODB_URI` configurado no GitHub
- [ ] String sem caracteres `<db_password>` (senha real)

---

**Última atualização:** $(date)

