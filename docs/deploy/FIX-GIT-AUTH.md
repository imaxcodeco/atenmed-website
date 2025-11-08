# 🔧 Como Corrigir Autenticação Git no Servidor

## Problema
O servidor não consegue fazer pull porque o GitHub PAT está inválido ou expirado.

## Solução Rápida

### Opção 1: Atualizar PAT no GitHub Secrets (Recomendado)

1. **Gerar novo PAT no GitHub:**
   - Acesse: https://github.com/settings/tokens
   - Clique em "Generate new token" → "Generate new token (classic)"
   - Nome: `AtenMed Deploy`
   - Expiração: `90 days` (ou `No expiration`)
   - Permissões: Marque `repo` (todas as sub-permissões)
   - Clique em "Generate token"
   - **COPIE O TOKEN** (só aparece uma vez!)

2. **Atualizar no GitHub Secrets:**
   - Acesse: https://github.com/imaxcodeco/atenmed-website/settings/secrets/actions
   - Encontre `GITHUB_PAT`
   - Clique em "Update"
   - Cole o novo token
   - Salve

3. **Fazer novo deploy:**
   - Vá em Actions → "Deploy to Production" → "Run workflow"

### Opção 2: Configurar Git no Servidor Manualmente

Execute no servidor:

```bash
cd /var/www/atenmed

# 1. Configurar git com novo token
git remote set-url origin https://SEU_NOVO_TOKEN@github.com/imaxcodeco/atenmed-website.git

# 2. Testar
git fetch origin

# 3. Atualizar código
git reset --hard origin/main

# 4. Verificar
git log -1 --oneline
ls -la applications/ai-agents/index.html

# 5. Reiniciar
npm install --production --legacy-peer-deps --ignore-scripts
pm2 restart atenmed --update-env
```

### Opção 3: Usar SSH (Mais Seguro)

```bash
# No servidor, gerar chave SSH
ssh-keygen -t ed25519 -C "deploy@atenmed"
cat ~/.ssh/id_ed25519.pub

# Copiar a chave pública e adicionar no GitHub:
# https://github.com/settings/keys → "New SSH key"

# Configurar git para usar SSH
cd /var/www/atenmed
git remote set-url origin git@github.com:imaxcodeco/atenmed-website.git
git fetch origin
git reset --hard origin/main
```

## Verificar se Funcionou

```bash
cd /var/www/atenmed
git log -1 --oneline
# Deve mostrar commit recente com "fix: Adicionar console.log..."

ls -la applications/ai-agents/index.html
# Deve existir o arquivo

grep -n "ai-agents" server.js
# Deve mostrar as rotas

pm2 logs atenmed --lines 20
# Deve mostrar: "📌 [SERVER START] Registrando rotas..."
```

