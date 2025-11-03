# 📧 Configurar Email - Guia Rápido

## ⚠️ PROBLEMA ATUAL

O sistema de email **não está configurado**, então emails não estão sendo enviados quando você cria uma clínica.

---

## ✅ SOLUÇÃO RÁPIDA (Escolha uma)

### **Opção 1: Configurar AWS SES (Recomendado para Produção)**

**Passo 1:** Acesse o AWS Console:

- https://console.aws.amazon.com/ses

**Passo 2:** Verifique seu email/domínio:

- Vá em "Verified identities" → "Create identity"
- Selecione "Email address" ou "Domain"
- Complete a verificação

**Passo 3:** Solicite sair do Sandbox:

- Vá em "Account dashboard" → "Request production access"
- Preencha o formulário (pedido pode levar 24h)

**Passo 4:** Crie credenciais SMTP:

- Vá em "SMTP settings" → "Create SMTP credentials"
- Anote o SMTP username e password

**Passo 5:** Configure no servidor:

Adicione no `.env` do servidor:

```bash
# Configure com suas credenciais AWS SES:
EMAIL_HOST=email-smtp.us-east-2.amazonaws.com  # ou sa-east-1 se em SP
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=SUA_CHAVE_DE_ACESSO_AQUI             # Exemplo: AKIAIOSFODNN7EXAMPLE
EMAIL_PASS=SUA_CHAVE_SECRETA_AQUI                # Exemplo: BjawsqNAkido/9EXAMPLExj7e1nKwk0PQ
EMAIL_FROM=AtenMed <contato@atenmed.com.br>
```

⚠️ **IMPORTANTE:**

- Substitua pelos seus valores reais da imagem acima
- Depois de configurar, **reinicie o servidor Node.js**

---

### **Opção 2: Usar Gmail para Testes (Desenvolvimento)**

Se você só quer testar rapidamente em desenvolvimento:

**Passo 1:** Ative "Permitir apps menos seguros" no Gmail OU gere uma senha de app:

- https://myaccount.google.com/apppasswords

**Passo 2:** Configure no `.env`:

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app
EMAIL_FROM=AtenMed <seu-email@gmail.com>
```

⚠️ **LIMITAÇÕES do Gmail:**

- Limite de 500 emails/dia
- Pode ir para spam
- NÃO recomendado para produção

---

### **Opção 3: Serviço Alternativo (SendGrid, Mailgun, etc.)**

Qualquer serviço SMTP funciona. Consulte a documentação deles para:

- SMTP Host
- Porta
- Credenciais

Configure no `.env` com os dados do serviço.

---

## 🧪 TESTAR CONFIGURAÇÃO

Após configurar as variáveis, teste:

1. **Reinicie o servidor Node.js**
2. **Acesse:** `https://atenmed.com.br/apps/admin/dashboard.html`
3. **Faça login como admin**
4. **Crie uma nova clínica** com email do proprietário
5. **Verifique** se o email chegou na caixa de entrada

---

## 📋 CHECKLIST DE CONFIGURAÇÃO

- [ ] Variáveis EMAIL\_\* configuradas no `.env`
- [ ] Servidor reiniciado após configurar
- [ ] Email/domínio verificado no AWS (se usar SES)
- [ ] Sandbox desabilitado no AWS (se usar SES)
- [ ] Credenciais SMTP criadas e válidas

---

## 🐛 TROUBLESHOOTING

### Email não chegou?

1. **Verifique os logs do servidor:**

   ```bash
   # No servidor, procure por:
   ✅ Email transporter inicializado
   📧 Email enviado: [ID] para [email]
   ```

2. **Verifique caixa de SPAM:** Primeiros emails podem ir para lá

3. **Teste a configuração manualmente:**
   - Acesse: `https://atenmed.com.br/api/test/email` (requer login admin)
   - Deve retornar sucesso

### Erro: "Email não configurado"

- Verifique se as variáveis estão no `.env`
- Verifique se o servidor foi reiniciado
- Verifique se não há erros de sintaxe no `.env`

### AWS SES: Still in sandbox

- Você precisa solicitar "production access"
- Enquanto está em sandbox, só pode enviar para emails verificados
- Solicite acesso: https://console.aws.amazon.com/ses

---

## 📞 PRECISA DE AJUDA?

- Consulte: `docs/AWS-SES-SETUP.md` (guia completo)
- Logs do servidor mostram erros específicos
- Teste endpoint: `/api/test/email` (requer admin)

---

**LEMBRE-SE:** Após configurar, **SEMPRE reinicie o servidor Node.js!**
