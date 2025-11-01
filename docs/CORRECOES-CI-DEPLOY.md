# 🔧 Correções CI/CD - Deploy em Produção

## ❌ Problemas Identificados

### **1. Script `prepare` executando Husky**

- Erro: `husky: not found` durante `npm ci --production`
- Causa: Script `prepare` no `package.json` tentava instalar Husky, mas Husky não estava disponível no ambiente CI

### **2. Comando `--production` deprecated**

- Aviso: `npm warn config production Use '--omit=dev' instead`
- Causa: `--production` foi depreciado no npm 7+

### **3. Warnings de Engine**

- Vários pacotes requerem Node 20+, mas CI está usando Node 18
- Isso é apenas um warning, não bloqueia a instalação

---

## ✅ Correções Aplicadas

### **1. Script `prepare` ajustado**

**Antes:**

```json
"prepare": "husky"
```

**Depois:**

```json
"prepare": "node -e \"try { require('husky').install() } catch(e) {}\" || true"
```

**Benefício:** Script não falha se Husky não estiver disponível (comum em CI)

---

### **2. Comando npm atualizado**

**Antes:**

```bash
npm ci --production
```

**Depois:**

```bash
npm ci --omit=dev --ignore-scripts
```

**Benefício:**

- ✅ Usa comando não-deprecated (`--omit=dev`)
- ✅ `--ignore-scripts` evita executar `prepare` (e outros scripts) durante instalação
- ✅ Instalação mais rápida e confiável em CI

---

### **3. Workflows atualizados**

#### **`.github/workflows/deploy.yml`**

```yaml
- name: Install dependencies
  run: npm ci --omit=dev --ignore-scripts
```

#### **`.github/workflows/deploy-ec2.yml`**

```bash
npm ci --omit=dev --legacy-peer-deps --ignore-scripts
```

---

## 📋 O que cada flag faz

### **`--omit=dev`**

- Instala apenas dependências de produção
- Equivalente ao antigo `--production`
- Forma recomendada no npm 7+

### **`--ignore-scripts`**

- Não executa scripts definidos no `package.json`
- Evita executar `prepare`, `postinstall`, etc.
- Essencial em CI para evitar falhas com Husky

### **`--legacy-peer-deps`**

- Usado quando há conflitos de peer dependencies
- Mantido no workflow EC2 por compatibilidade

---

## 🎯 Resultado Esperado

Após essas correções:

- ✅ CI não deve mais falhar no `prepare` script
- ✅ Avisos de deprecation eliminados
- ✅ Instalação mais rápida (sem executar scripts desnecessários)
- ⚠️ Warnings de engine continuam (Node 18 vs Node 20), mas não bloqueiam

---

## 🔄 Próximas Melhorias (Opcional)

### **1. Atualizar Node.js no CI**

Se quiser eliminar warnings de engine:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v3
  with:
    node-version: '20' # Atualizar de '18' para '20'
```

**⚠️ Atenção:** Verificar compatibilidade do código com Node 20 antes!

### **2. Remover Husky de produção**

Se Husky só é necessário em desenvolvimento:

- Manter no `devDependencies` (já está)
- Script `prepare` já ajustado para não falhar

---

**Última atualização:** Janeiro 2025  
**Status:** ✅ Correções aplicadas e commitadas
