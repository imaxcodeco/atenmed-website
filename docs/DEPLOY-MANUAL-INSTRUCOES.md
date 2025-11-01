# 📝 Instruções: Deploy Manual - Links do Rodapé

## ✅ Status do Código

**Importante:** O código dos links do rodapé já está correto e commitado no GitHub!

**Commits aplicados:**

- `c7188e8` - Organizar links legais no rodapé
- `site/assets/css/style.css` - Estilos organizados

---

## 🚫 Por que o deploy automático está desabilitado?

O deploy automático via SSH está temporariamente desabilitado porque:

- GitHub Secrets de SSH não estão configurados
- Erro: `ssh: handshake failed: EOF`

Isso **não afeta o código** - as mudanças estão todas corretas.

---

## 🎯 Opções para Aplicar as Mudanças em Produção

### **Opção 1: Deploy Manual via SSH (Mais Rápido)**

Se você tem acesso SSH ao servidor:

```bash
# 1. Conectar ao servidor
ssh seu-usuario@seu-servidor

# 2. Ir para o diretório do projeto
cd /var/www/atenmed
# ou
cd ~/atenmed

# 3. Fazer pull das mudanças
git pull origin main

# 4. Reiniciar aplicação (se necessário)
pm2 restart atenmed
# ou
pm2 reload ecosystem.config.js --env production
```

**Pronto!** Os links do rodapé estarão organizados.

---

### **Opção 2: Configurar GitHub Secrets para Deploy Automático**

Para reativar deploy automático:

#### **1. Acessar GitHub Secrets:**

https://github.com/imaxcodeco/atenmed-website/settings/secrets/actions

#### **2. Adicionar os seguintes Secrets:**

**Básicos (obrigatórios):**

- `SERVER_HOST` - IP ou domínio do servidor (ex: `123.45.67.89` ou `servidor.com`)
- `SERVER_USER` - Usuário SSH (ex: `ubuntu`, `root`, `seu-usuario`)
- `SERVER_SSH_KEY` - Chave privada SSH completa (incluindo `-----BEGIN` e `-----END`)

**Opcional:**

- `SERVER_PORT` - Porta SSH (padrão: 22)

#### **3. Como obter a chave SSH:**

```bash
# Gerar nova chave (recomendado)
ssh-keygen -t ed25519 -C "github-deploy-atenmed"
# Salvar em: ~/.ssh/atenmed_deploy
# Não definir senha (deixar vazio)

# Ver chave privada (para GitHub Secret)
cat ~/.ssh/atenmed_deploy

# Ver chave pública (para adicionar no servidor)
cat ~/.ssh/atenmed_deploy.pub
```

#### **4. Adicionar chave pública no servidor:**

```bash
# Conectar no servidor
ssh seu-usuario@seu-servidor

# Adicionar chave pública ao authorized_keys
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5... github-deploy-atenmed" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

#### **5. Reativar deploy automático:**

Depois de configurar os Secrets, edite `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main
      - master
  workflow_dispatch:
```

---

### **Opção 3: Deploy Manual via GitHub UI**

Mesmo com o push desabilitado, você pode fazer deploy manual:

1. Acessar: https://github.com/imaxcodeco/atenmed-website/actions
2. Clicar em "Deploy to Production"
3. Clicar em "Run workflow"
4. Selecionar branch "main"
5. Clicar em "Run workflow"

**Nota:** Isso só funciona se os Secrets SSH estiverem configurados.

---

## 📋 Checklist

### **Para aplicar mudanças agora (rápido):**

- [ ] SSH manualmente no servidor
- [ ] `cd /var/www/atenmed` ou `cd ~/atenmed`
- [ ] `git pull origin main`
- [ ] `pm2 restart atenmed`
- [ ] Verificar site: https://atenmed.com.br

### **Para configurar deploy automático (depois):**

- [ ] Gerar chave SSH
- [ ] Adicionar chave pública no servidor
- [ ] Adicionar chave privada no GitHub Secret
- [ ] Adicionar `SERVER_HOST` e `SERVER_USER` nos Secrets
- [ ] Reativar push trigger no workflow

---

## 🎨 O que foi corrigido nos links do rodapé?

### **Antes:**

Links desorganizados, sem espaçamento adequado

### **Depois:**

```css
.footer-legal {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
}
```

**Resultado:**

- ✅ Links alinhados horizontalmente
- ✅ Espaçamento consistente
- ✅ Separadores visuais (`|`)
- ✅ Responsivo: em mobile, links ficam em coluna

---

## 🆘 Ajuda

### **Se não tem acesso SSH:**

Você precisa solicitar:

- Acesso SSH ao servidor
- Ou credenciais para configurar GitHub Secrets

### **Se tem acesso SSH mas não sabe usar:**

```bash
# Exemplo completo
ssh usuario@123.45.67.89
# Digite a senha quando solicitado
cd /var/www/atenmed
git pull origin main
pm2 restart atenmed
exit
```

---

## 📞 Resumo

**O código está pronto!** ✅

Você só precisa:

1. **Fazer deploy manual via SSH** (opção mais rápida), ou
2. **Configurar GitHub Secrets** para deploy automático funcionar

**Arquivos modificados:**

- `site/assets/css/style.css` - Estilos do rodapé organizados
- `site/index.html` - Links já estavam corretos

---

**Última atualização:** Janeiro 2025  
**Status:** 🟡 Código pronto, aguardando deploy
