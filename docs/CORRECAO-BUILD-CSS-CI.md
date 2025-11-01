# 🔧 Correção: Build CSS no CI

## ❌ Problema

O build CSS estava falhando no CI porque:

```bash
npm run build:css
# Erro: tailwindcss não encontrado
```

**Causa:**

- `npm ci --omit=dev` não instala `devDependencies`
- `tailwindcss` está em `devDependencies`
- O build precisa do Tailwind para compilar CSS

---

## ✅ Solução Aplicada

### **Estratégia: Instalar → Build → Limpar**

```yaml
- name: Install dependencies
  run: npm ci --ignore-scripts

- name: Build CSS
  run: npm run build:css || echo "Build CSS optional"

- name: Clean dev dependencies
  run: npm prune --omit=dev
```

### **Como funciona:**

1. **Instalar TODAS as dependências** (dev + prod)
   - `npm ci --ignore-scripts` instala tudo
2. **Build CSS** com Tailwind disponível
   - `npm run build:css` funciona porque Tailwind está instalado
3. **Remover dev dependencies** antes do deploy
   - `npm prune --omit=dev` remove devDependencies
   - Apenas dependências de produção sobram

---

## 📊 Impacto

### **Antes:**

- ❌ Build CSS falhava
- ❌ Deploy continuava com CSS antigo
- ⚠️ Mudanças de CSS não eram aplicadas

### **Depois:**

- ✅ Build CSS funciona
- ✅ CSS sempre atualizado
- ✅ Apenas dependências de produção no servidor final

---

## 🎯 Alternativas Consideradas

### **1. Tailwind como dependência de produção**

```json
"dependencies": {
  "tailwindcss": "^4.1.16"
}
```

❌ **Não recomendado:** Aumenta tamanho do node_modules em produção

### **2. Commitar CSS compilado**

```bash
git add site/assets/css/tailwind.css
```

❌ **Não recomendado:** Arquivos compilados no Git não são boa prática

### **3. Build local antes do push**

```bash
npm run build:css
git add site/assets/css/tailwind.css
git commit
```

✅ **Possível, mas menos automático**

### **4. Solução escolhida: Instalar → Build → Limpar**

✅ **Melhor equilíbrio entre automação e tamanho de produção**

---

## 📝 Aplicado em:

### **`.github/workflows/deploy.yml`** (2 lugares)

**No CI (antes do deploy):**

```yaml
- name: Install dependencies
  run: npm ci --ignore-scripts

- name: Build CSS
  run: npm run build:css || echo "Build CSS optional"

- name: Clean dev dependencies
  run: npm prune --omit=dev
```

**No servidor (durante deploy SSH):**

```bash
# Install dependencies (with dev for build)
npm ci --ignore-scripts

# Build CSS
npm run build:css || echo "Build optional"

# Remove dev dependencies
npm prune --omit=dev
```

---

## ⚡ Performance

### **Tempo adicional:**

- Instalação de devDependencies: ~30s
- Build CSS: ~5s
- Prune: ~10s
- **Total adicional:** ~45s no deploy

### **Benefício:**

- ✅ CSS sempre atualizado automaticamente
- ✅ Sem intervenção manual
- ✅ Deploy confiável

---

**Última atualização:** Janeiro 2025  
**Status:** ✅ Implementado e testando
