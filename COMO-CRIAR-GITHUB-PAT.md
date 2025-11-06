# Como Criar Personal Access Token (PAT) para Deploy

## Por que precisamos?

O deploy precisa fazer `git pull` no servidor, mas o repositório é privado. Precisamos de um token para autenticar.

---

## Passo a Passo

### 1. Criar Personal Access Token no GitHub

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Preencha:
   - **Note:** `AtenMed Deploy Token`
   - **Expiration:** Escolha uma expiração (recomendo 90 dias ou sem expiração)
   - **Scopes:** Marque apenas:
     - ✅ `repo` (Full control of private repositories)
4. Clique em **"Generate token"**
5. **COPIE O TOKEN** - você só verá uma vez!

### 2. Adicionar como Secret no GitHub

1. Acesse: https://github.com/imaxcodeco/atenmed-website/settings/secrets/actions
2. Clique em **"New repository secret"**
3. Preencha:
   - **Name:** `GITHUB_PAT`
   - **Secret:** Cole o token que você copiou
4. Clique em **"Add secret"**

---

## Pronto!

Depois de adicionar o secret `GITHUB_PAT`, o deploy deve funcionar automaticamente.

O workflow vai usar esse token para fazer `git pull` no servidor via HTTPS.

---

## Segurança

- ⚠️ **Nunca compartilhe o token**
- ⚠️ **Se o token vazar, revogue imediatamente**
- ⚠️ **Use tokens com escopo mínimo necessário**

---

## Testar

Após adicionar o secret, faça um push ou execute o workflow manualmente:

- GitHub → Actions → "Deploy to Production" → "Run workflow"
