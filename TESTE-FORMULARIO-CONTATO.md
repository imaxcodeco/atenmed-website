# 📧 Guia de Teste - Formulário de Contato

## ✅ Status da Implementação

**Data de Deploy:** 23 de Outubro de 2025
**Última Atualização:** 16:35 UTC

### **Funcionalidades Implementadas:**

1. ✅ Página de contato funcional
2. ✅ Envio de email automático para `contato@atenmed.com.br`
3. ✅ Criação automática de Lead na dashboard
4. ✅ Credenciais AWS SES configuradas e seguras
5. ✅ Validação de formulário em tempo real
6. ✅ Design responsivo e moderno

---

## 🧪 Como Testar

### **1. Acessar a Página de Contato**

URL: **https://atenmed.com.br/contato.html**

### **2. Preencher o Formulário**

**Dados de Teste Sugeridos:**

```
Nome Completo: João Silva
Email: joao.silva@example.com
Telefone: (11) 98765-4321
Empresa: Clínica Saúde Total
Categoria: Vendas
Assunto: Interesse em automação de agendamentos
Mensagem: Olá, gostaria de conhecer mais sobre os serviços de automação de WhatsApp e agendamento inteligente para minha clínica.
```

### **3. Enviar**

Clique em **"Enviar Mensagem"**

**Você verá:**
- ⏳ Botão mudará para "Enviando..." com spinner
- ✅ Mensagem de sucesso: "Mensagem enviada com sucesso! Entraremos em contato em breve."
- 🔄 Formulário será resetado

---

## 📬 Verificar Resultados

### **A. Email Recebido**

**Verifique:** `contato@atenmed.com.br`

**O email conterá:**
- ✅ Assunto: "📧 Novo Contato: João Silva - Interesse em automação de agendamentos"
- ✅ Badge de prioridade (colorido)
- ✅ Todas as informações do formulário organizadas
- ✅ Botão para acessar a dashboard
- ✅ Alerta de ação recomendada (responder em 24h)

**Nota:** Se o email não chegar, verifique:
- Caixa de spam
- Credenciais AWS SES no `.env`
- Logs do servidor: `ssh ... "pm2 logs atenmed"`

### **B. Lead na Dashboard**

**Acesse:** https://atenmed.com.br/apps/admin/dashboard.html

**Login:** Use suas credenciais de admin

**Verifique:**
1. Vá para seção "Leads"
2. Procure pelo lead "João Silva"
3. Confirme os dados:
   - Nome: João Silva
   - Email: joao.silva@example.com
   - Telefone: (11) 98765-4321
   - Origem: **formulario-contato**
   - Status: **novo**
   - Interesse: **alto** (porque categoria = vendas)
   - Observações: contém assunto + mensagem

### **C. Banco de Dados (MongoDB)**

**Verifique dois registros criados:**

1. **Collection: contacts**
   - Documento com todos os dados do formulário
   
2. **Collection: leads**
   - Lead criado automaticamente
   - Campo `contatoId` aponta para o contato original

---

## 🔧 Troubleshooting

### **Problema: Email não chegou**

**Verificar:**
```bash
ssh -i "site-atenmed.pem" ubuntu@3.129.206.231
cd atenmed-website
cat .env | grep EMAIL
```

**Deve mostrar:**
```
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=AKIASQE66RF7IMQLPN4G
EMAIL_PASS=BBZ/bI/IfwAB29GGdh+ihyERKZWq8zE1V4xzsKZ87Txn
EMAIL_FROM=AtenMed <contato@atenmed.com.br>
EMAIL_SECURE=false
```

**Se estiver diferente, atualize:**
```bash
nano .env
# Faça as correções
pm2 restart atenmed
```

### **Problema: Lead não apareceu na dashboard**

**Verificar logs:**
```bash
pm2 logs atenmed --lines 50 | grep -E '(Lead|contact)'
```

**Procure por:**
- `✅ Lead criado automaticamente`
- `ℹ️ Lead já existe para o email`
- Erros de validação

### **Problema: Erro ao enviar formulário**

**Abra o Console do navegador (F12) e procure por:**
- Erros de CORS
- Erros de validação
- Mensagens de erro da API

**Verificar se a API está respondendo:**
```bash
curl https://atenmed.com.br/health
```

---

## 📊 Logs do Sistema

### **Ver logs em tempo real:**
```bash
ssh -i "site-atenmed.pem" ubuntu@3.129.206.231
pm2 logs atenmed --lines 100
```

### **Filtrar por tipo:**
```bash
pm2 logs atenmed | grep 'Email'   # Logs de email
pm2 logs atenmed | grep 'Lead'    # Logs de lead
pm2 logs atenmed | grep 'error'   # Erros
```

---

## 🔐 Segurança

### **Credenciais AWS SES:**

✅ **Rotacionadas em:** 23/10/2025
✅ **Removidas do GitHub:** Sim
✅ **Armazenadas em:** `.env` (não versionado)
✅ **GitGuardian alerta:** Resolvido

**Usuário IAM:** contato-atenmed
**Access Key:** AKIASQE66RF7IMQLPN4G

---

## 🎯 Fluxo Completo

```
1. Usuário preenche formulário em /contato.html
          ↓
2. JavaScript faz POST /api/contact
          ↓
3. Backend valida dados
          ↓
4. Salva no MongoDB (collection: contacts)
          ↓
5. Envia email para contato@atenmed.com.br
          ↓
6. Verifica se lead já existe (por email)
          ↓
7. Cria novo lead (collection: leads)
          ↓
8. Vincula lead ao contato (contatoId)
          ↓
9. Retorna sucesso para o frontend
          ↓
10. Usuário vê mensagem de confirmação
```

---

## 📞 Contatos do Sistema

**Email de Notificações:** contato@atenmed.com.br
**Dashboard Admin:** https://atenmed.com.br/apps/admin/dashboard.html
**Página de Contato:** https://atenmed.com.br/contato.html
**API Health Check:** https://atenmed.com.br/health

---

## ✅ Checklist de Teste

- [ ] Acessar página de contato
- [ ] Preencher formulário completo
- [ ] Enviar e confirmar mensagem de sucesso
- [ ] Verificar email em contato@atenmed.com.br
- [ ] Logar na dashboard
- [ ] Confirmar lead criado na seção "Leads"
- [ ] Verificar dados do lead estão corretos
- [ ] Testar com categoria "vendas" (interesse alto)
- [ ] Testar com categoria "duvida" (interesse médio)
- [ ] Testar envio duplicado (mesmo email)
- [ ] Confirmar que não cria lead duplicado

---

## 🚀 Próximos Passos (Opcional)

1. **Email de confirmação para o usuário**
   - Enviar cópia do contato para o email informado
   
2. **Notificação WhatsApp**
   - Avisar admin via WhatsApp quando receber lead de vendas
   
3. **Dashboard de métricas**
   - Gráfico de contatos por categoria
   - Taxa de conversão de leads
   
4. **Integração CRM**
   - Sincronizar leads com sistema externo
   
5. **Auto-resposta inteligente**
   - IA responde perguntas frequentes automaticamente

---

**Última atualização:** 23/10/2025 16:35 UTC
**Versão:** 1.0.0
**Status:** ✅ Produção

