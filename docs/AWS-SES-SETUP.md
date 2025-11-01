# 📧 Guia Completo: Configuração AWS SES em Produção

Este guia detalha todos os passos para configurar o Amazon Simple Email Service (SES) para envio de emails em produção.

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Criar Conta AWS e Acessar SES](#passo-1-criar-conta-aws)
3. [Verificar Identidade de Email](#passo-2-verificar-identidade-de-email)
4. [Sair do Sandbox (OBRIGATÓRIO para produção)](#passo-3-sair-do-sandbox)
5. [Criar Credenciais SMTP](#passo-4-criar-credenciais-smtp)
6. [Configurar Variáveis de Ambiente](#passo-5-configurar-variáveis-de-ambiente)
7. [Testar Configuração](#passo-6-testar-configuração)
8. [Troubleshooting](#troubleshooting)

---

## Pré-requisitos

- ✅ Conta AWS (pode criar gratuita em https://aws.amazon.com)
- ✅ Domínio próprio (ex: atenmed.com.br)
- ✅ Acesso ao DNS do domínio
- ✅ Documento de identidade (para sair do sandbox)

---

## Passo 1: Criar Conta AWS

### 1.1 Acessar AWS Console

1. Acesse: https://aws.amazon.com
2. Clique em "Criar uma Conta AWS"
3. Preencha os dados necessários
4. Verifique seu email e número de telefone
5. Escolha um plano de suporte (iniciante gratuito)

### 1.2 Acessar SES

1. Após criar a conta, acesse o Console AWS: https://console.aws.amazon.com
2. No campo de busca, digite "SES" ou "Simple Email Service"
3. Selecione "Amazon SES" no menu de serviços

⚠️ **IMPORTANTE:** Por padrão, você estará na região **us-east-1 (N. Virginia)**. Para produção no Brasil, considere usar **sa-east-1 (São Paulo)** para menor latência.

---

## Passo 2: Verificar Identidade de Email

Você precisa verificar seu domínio ou email para poder enviar emails.

### Opção A: Verificar Domínio Completo (RECOMENDADO)

Permite enviar de qualquer email do domínio (ex: contato@atenmed.com.br, suporte@atenmed.com.br).

1. **No console SES, vá em "Verified identities"**
2. **Clique em "Create identity"**
3. **Selecione "Domain"**
4. **Digite seu domínio** (ex: `atenmed.com.br`)
5. **Clique em "Create identity"**

#### 2.1 Configurar DNS

O SES fornecerá registros DNS para adicionar:

**Exemplo de registros:**
```
Tipo: TXT
Nome: atenmed.com.br
Valor: (fornecido pelo SES)

Tipo: CNAME
Nome: _amazonses.atenmed.com.br
Valor: (fornecido pelo SES)
```

**Como adicionar no DNS:**

1. Acesse o painel do seu provedor de DNS (ex: Cloudflare, Route53, Registro.br)
2. Adicione os registros TXT e CNAME conforme fornecido pelo SES
3. Aguarde propagação (pode levar até 48h, geralmente < 1h)
4. No SES, clique em "Refresh" para verificar

✅ **Verificação bem-sucedida:** Status mudará para "Verified"

### Opção B: Verificar Email Individual (TESTE)

Apenas para testes iniciais.

1. **No console SES, vá em "Verified identities"**
2. **Clique em "Create identity"**
3. **Selecione "Email address"**
4. **Digite o email** (ex: `contato@atenmed.com.br`)
5. **Verifique a caixa de entrada e clique no link de verificação**

---

## Passo 3: Sair do Sandbox (OBRIGATÓRIO para produção)

⚠️ **CRÍTICO:** Por padrão, o SES está em modo "Sandbox", que permite enviar APENAS para emails verificados. Para produção, você DEVE sair do sandbox.

### 3.1 O que o Sandbox permite:
- ✅ Enviar apenas para emails que você verificou
- ❌ NÃO permite enviar para qualquer email
- ❌ Limite de 200 emails/dia
- ❌ Limite de 1 email/segundo

### 3.2 Sair do Sandbox:

1. **No console SES, vá em "Account dashboard"**
2. **Procure por "Sending limits" ou "Production access"**
3. **Clique em "Request production access"**
4. **Preencha o formulário:**

#### Informações Necessárias:

**Use case:**
- Tipo: "Transactional emails"
- Descrição: Descreva como usará o SES
  ```
  Exemplo: "Sistema de gestão médica que envia emails transacionais:
  - Confirmações de agendamento
  - Lembretes de consultas
  - Notificações de faturas
  - Boas-vindas para novos clientes
  Esperamos enviar ~1000 emails/dia inicialmente."
  ```

**Website URL:** 
- Ex: `https://atenmed.com.br`

**Acknowledgment:**
- ✅ Li e aceito os termos de uso
- ✅ Não enviarei spam
- ✅ Só enviarei para usuários que optaram por receber

**Contact information:**
- Endereço completo da empresa
- Número de telefone
- Website da empresa

**Additional details:**
- Descreva seus processos de opt-in
- Explique como gerencia bounces/complaints

5. **Clique em "Submit"**

### 3.3 Tempo de Aprovação

- ⏱️ Geralmente: **24-48 horas**
- ✅ Você receberá um email de aprovação
- ✅ Status mudará para "Approved" no dashboard

⚠️ **Dica:** Seja detalhado no formulário. Aprovações são geralmente rápidas se tudo estiver claro.

---

## Passo 4: Criar Credenciais SMTP

### 4.1 Criar IAM User (Recomendado)

Para segurança, crie um usuário IAM específico para SES:

1. **Acesse IAM Console:** https://console.aws.amazon.com/iam
2. **Vá em "Users" → "Create user"**
3. **Nome do usuário:** `ses-smtp-user`
4. **Selecione "Attach policies directly"**
5. **Procure e selecione:** `AmazonSESFullAccess`
6. **Clique em "Next" → "Create user"**

### 4.2 Gerar Credenciais SMTP

1. **No console SES, vá em "SMTP settings"**
2. **Clique em "Create SMTP credentials"**
3. **Selecione o usuário IAM criado** (ou crie um novo)
4. **Clique em "Create"**
5. **IMPORTANTE: Baixe e guarde as credenciais:**
   - SMTP username
   - SMTP password

⚠️ **ATENÇÃO:** A senha SMTP só é exibida UMA VEZ. Guarde em local seguro!

**Formato das credenciais:**
```
SMTP Endpoint: email-smtp.us-east-1.amazonaws.com (ou sa-east-1 para São Paulo)
Port: 587 (TLS) ou 465 (SSL)
Username: AKIAXXXXXXXXXXXXXXXX
Password: (senha gerada pelo SES)
```

### 4.3 Regiões do SES

Escolha a região mais próxima:

| Região | Endpoint | Código |
|--------|----------|--------|
| **São Paulo** (Recomendado BR) | email-smtp.sa-east-1.amazonaws.com | sa-east-1 |
| N. Virginia | email-smtp.us-east-1.amazonaws.com | us-east-1 |
| Oregon | email-smtp.us-west-2.amazonaws.com | us-west-2 |
| Irlanda | email-smtp.eu-west-1.amazonaws.com | eu-west-1 |

---

## Passo 5: Configurar Variáveis de Ambiente

### 5.1 Adicionar ao arquivo `.env`

```env
# ===== EMAIL - AWS SES =====
EMAIL_HOST=email-smtp.sa-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=AKIAXXXXXXXXXXXXXXXX
EMAIL_PASS=SUA_SENHA_SMTP_AQUI
EMAIL_FROM=AtenMed <contato@atenmed.com.br>
```

**Explicação:**
- `EMAIL_HOST`: Endpoint SMTP da região escolhida
- `EMAIL_PORT`: 587 (TLS - recomendado) ou 465 (SSL)
- `EMAIL_SECURE`: `false` para porta 587 (usa STARTTLS), `true` para 465 (SSL direto)
- `EMAIL_USER`: Username SMTP gerado
- `EMAIL_PASS`: Password SMTP gerado
- `EMAIL_FROM`: Email e nome do remetente

### 5.2 Verificar Configuração no Código

O código já está configurado em `services/emailService.js`. Certifique-se de que:

✅ As variáveis estão corretas no `.env`  
✅ O arquivo `.env` está no diretório raiz  
✅ O `.env` está no `.gitignore` (nunca commite!)

---

## Passo 6: Testar Configuração

### 6.1 Teste Rápido via Script

Execute o script de teste:

```bash
node scripts/test-email-ses.js
```

Este script:
- ✅ Testa conexão SMTP
- ✅ Envia email de teste
- ✅ Verifica se email chegou

### 6.2 Teste Manual via Código

```bash
node -e "const email = require('./services/emailService'); email.testEmailConfiguration().then(console.log).catch(console.error)"
```

### 6.3 Verificar Logs

Após enviar, verifique:
1. **Console do Node.js:** Deve mostrar "✅ Email enviado"
2. **Caixa de entrada:** Email deve chegar em alguns segundos
3. **SES Console:** Vá em "Sending statistics" para ver estatísticas

---

## Troubleshooting

### ❌ Erro: "Email not verified"

**Causa:** Tentando enviar para email não verificado (no sandbox)

**Solução:**
- Verifique o email destinatário OU
- Saia do sandbox (Passo 3)

---

### ❌ Erro: "Invalid credentials"

**Causa:** Credenciais SMTP incorretas

**Soluções:**
1. Verifique `EMAIL_USER` e `EMAIL_PASS` no `.env`
2. Certifique-se de copiar a senha completa (pode ter caracteres especiais)
3. Recrie as credenciais SMTP se necessário

---

### ❌ Erro: "Connection timeout"

**Causa:** Problema de rede ou endpoint incorreto

**Soluções:**
1. Verifique se `EMAIL_HOST` está correto para a região
2. Verifique se a porta está correta (587 ou 465)
3. Teste conectividade: `telnet email-smtp.sa-east-1.amazonaws.com 587`

---

### ❌ Erro: "Daily sending quota exceeded"

**Causa:** Atingiu limite de envio (200/dia no sandbox)

**Soluções:**
- Aguarde 24h OU
- Saia do sandbox para limites maiores

---

### ❌ Email não chega (sem erro)

**Possíveis causas:**
1. **Email em spam:** Verifique pasta de spam
2. **Bounce:** Verifique "Bounce notifications" no SES
3. **Complaint:** Verifique "Complaint notifications" no SES
4. **Ainda no sandbox:** Verifique se saiu do sandbox

**Verificações:**
```bash
# No console SES:
- Vá em "Sending statistics"
- Verifique "Bounces" e "Complaints"
- Configure SNS para receber notificações
```

---

### ❌ "Sender email not verified"

**Causa:** O email em `EMAIL_FROM` não está verificado

**Solução:**
- Verifique o domínio OU email no SES (Passo 2)
- Certifique-se de que `EMAIL_FROM` usa um email verificado

---

## 📊 Monitoramento e Estatísticas

### Configurar Notificações SNS (Recomendado)

1. **Criar tópico SNS:**
   - Console SNS → "Topics" → "Create topic"
   - Nome: `ses-bounces-complaints`

2. **Configurar em SES:**
   - SES → "Configuration" → "Notifications"
   - Configure:
     - **Bounces:** Enviar para SNS topic
     - **Complaints:** Enviar para SNS topic
     - **Deliveries:** (opcional) Para tracking

3. **Receber notificações:**
   - Adicione email/endpoint ao SNS topic para receber alertas

---

## 📈 Limites e Custos

### Limites (Após sair do sandbox)

- **Taxa inicial:** Geralmente 50.000 emails/dia
- **Pode aumentar:** Solicitar aumento via AWS Support
- **Velocidade:** Geralmente 14 emails/segundo (pode aumentar)

### Custos (Região sa-east-1 - São Paulo)

- **Primeiros 62.000 emails/mês:** **GRÁTIS** (dentro do tier gratuito AWS)
- **Após 62.000:** $0.10 por 1.000 emails
- **Armazenamento de emails:** (se usar) $0.10 por GB/mês

**Exemplo:**
- 10.000 emails/mês: **GRÁTIS**
- 100.000 emails/mês: ~$3.80 USD

---

## ✅ Checklist Final

Antes de considerar configurado:

- [ ] Conta AWS criada e acessível
- [ ] Domínio ou email verificado no SES
- [ ] Solicitação de saída do sandbox enviada
- [ ] Aprovação recebida (status "Approved")
- [ ] Credenciais SMTP criadas e salvas
- [ ] Variáveis de ambiente configuradas no `.env`
- [ ] Teste de envio bem-sucedido
- [ ] Notificações SNS configuradas (opcional, mas recomendado)
- [ ] Monitoramento de bounces/complaints ativo

---

## 🔒 Segurança

### Boas Práticas:

1. ✅ **Use usuário IAM dedicado** para SES (não use root)
2. ✅ **Rotacione credenciais** periodicamente (a cada 90 dias)
3. ✅ **Use Secrets Manager** (AWS) para guardar senhas (opcional, avançado)
4. ✅ **Monitore bounces/complaints** regularmente
5. ✅ **Mantenha taxa de bounce < 5%** e complaints < 0.1%
6. ✅ **Nunca commite credenciais** no código

---

## 📚 Recursos Adicionais

- **Documentação oficial:** https://docs.aws.amazon.com/ses/
- **Best Practices:** https://docs.aws.amazon.com/ses/latest/dg/best-practices.html
- **Pricing:** https://aws.amazon.com/ses/pricing/
- **Status:** https://status.aws.amazon.com/ (verificar se SES está operacional)

---

**Última atualização:** Janeiro 2025  
**Próxima revisão:** Após configuração em produção

