# 🌐 APP_URL e CORS_ORIGIN - Como Preencher

## 📋 O QUE SÃO

### **APP_URL:**
URL base do seu site/aplicação. Usada para gerar links completos em emails, notificações, etc.

### **CORS_ORIGIN:**
Lista de domínios permitidos para fazer requisições à API. Segurança contra acesso não autorizado.

---

## ✅ VALORES PARA GITHUB SECRETS

### **1. APP_URL**

```
Name: APP_URL
Secret: https://atenmed.com.br
```

**Explicação:**
- URL completa do seu site (com `https://`)
- Sem barra no final (`/`)
- Usado em:
  - Links de confirmação de agendamento
  - Links de cancelamento
  - Links em emails
  - Links de listas de espera

---

### **2. CORS_ORIGIN**

```
Name: CORS_ORIGIN
Secret: https://atenmed.com.br,https://www.atenmed.com.br
```

**Explicação:**
- Lista de domínios separados por vírgula (sem espaços)
- Inclui versão COM e SEM `www`
- Permite que seu frontend faça requisições à API
- Em produção, **apenas** seus domínios (segurança)

**Formato:**
```
https://atenmed.com.br,https://www.atenmed.com.br
```

**OU se você tiver outros domínios/subdomínios:**
```
https://atenmed.com.br,https://www.atenmed.com.br,https://app.atenmed.com.br
```

---

## 📝 COMO ADICIONAR NO GITHUB

### **Passo a Passo:**

1. **Acessar GitHub Secrets:**
   - Vá para: `https://github.com/seu-usuario/seu-repo/settings/secrets/actions`
   - Clique em **"New repository secret"**

2. **Adicionar APP_URL:**
   - **Name:** `APP_URL`
   - **Secret:** `https://atenmed.com.br`
   - Clique em **"Add secret"**

3. **Adicionar CORS_ORIGIN:**
   - **Name:** `CORS_ORIGIN`
   - **Secret:** `https://atenmed.com.br,https://www.atenmed.com.br`
   - Clique em **"Add secret"**

---

## ⚠️ IMPORTANTE

### **Para APP_URL:**
- ✅ Use sempre `https://` (não `http://`)
- ✅ Sem barra no final (`/`)
- ✅ Domínio completo (com ou sem `www`)

### **Para CORS_ORIGIN:**
- ✅ Separe domínios por vírgula (sem espaços)
- ✅ Inclua versão com `www` e sem `www`
- ✅ Use `https://` em produção
- ❌ Não inclua `http://localhost` em produção

---

## 🔍 COMO FUNCIONA

### **APP_URL é usado em:**

1. **Emails de Confirmação:**
   ```
   ${APP_URL}/confirmar/${appointmentId}
   ```

2. **Links de Cancelamento:**
   ```
   ${APP_URL}/cancelar/${appointmentId}
   ```

3. **Links de Lista de Espera:**
   ```
   ${APP_URL}/agendar-vaga/${waitlistId}
   ```

4. **Google Calendar Callback:**
   ```
   ${APP_URL}/api/auth/google/callback
   ```

### **CORS_ORIGIN é usado para:**

- Permitir que seu frontend faça requisições AJAX/Fetch
- Bloquear requisições de outros domínios (segurança)
- Permitir requisições de webhooks conhecidos (Meta/WhatsApp)

---

## 🧪 EXEMPLO COMPLETO

### **Se você tem múltiplos domínios:**

```
Name: APP_URL
Secret: https://atenmed.com.br

Name: CORS_ORIGIN
Secret: https://atenmed.com.br,https://www.atenmed.com.br,https://app.atenmed.com.br
```

### **Se você tem apenas um domínio (recomendado):**

```
Name: APP_URL
Secret: https://atenmed.com.br

Name: CORS_ORIGIN
Secret: https://atenmed.com.br,https://www.atenmed.com.br
```

---

## ✅ CHECKLIST

- [ ] `APP_URL` configurado: `https://atenmed.com.br`
- [ ] `CORS_ORIGIN` configurado: `https://atenmed.com.br,https://www.atenmed.com.br`
- [ ] Valores sem espaços extras
- [ ] Sem barras no final da URL
- [ ] Usando `https://` (não `http://`)

---

## 📝 VALORES FINAIS PARA COPIAR

### **APP_URL:**
```
https://atenmed.com.br
```

### **CORS_ORIGIN:**
```
https://atenmed.com.br,https://www.atenmed.com.br
```

---

**Última atualização:** $(date)

