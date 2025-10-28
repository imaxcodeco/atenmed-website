# 🚀 QUICK START - AtenMed SaaS

## ⚡ **Comece Agora em 5 Minutos!**

---

## ✅ **PRÉ-REQUISITOS**

```bash
✓ Node.js instalado
✓ MongoDB rodando
✓ Variáveis de ambiente configuradas (.env)
```

---

## 🎯 **PASSO 1: Iniciar Servidor**

```bash
# Instalar dependências (se ainda não fez)
npm install

# Iniciar servidor
npm run dev

# OU em produção
npm start
```

✅ **Servidor rodando em:** `http://localhost:3000`

---

## 📋 **PASSO 2: Testar Captação de Leads**

### **Abrir página de planos:**
```
http://localhost:3000/planos
```

### **Preencher formulário:**
- Nome: Dr. João Silva
- Email: joao@teste.com.br
- WhatsApp: (11) 99999-9999
- Nome da Clínica: Clínica Teste
- Número de Médicos: 2-5
- Cidade: São Paulo - SP
- Plano: BASIC - R$ 99/mês

✅ **Lead criado automaticamente!**

---

## 📊 **PASSO 3: Ver Lead no CRM**

### **Abrir CRM:**
```
http://localhost:3000/crm
```

### **Você verá:**
- Lead aparece na coluna "🆕 Novos"
- MRR calculado
- Taxa de conversão
- Total de leads

### **Mover lead no pipeline:**
1. Clique em "Atualizar" no card
2. Selecione novo status: "📞 Contato Feito"
3. Adicione observação (opcional)
4. Salvar

✅ **Lead movido no funil!**

---

## 👤 **PASSO 4: Criar Usuário Admin (primeira vez)**

```bash
# Criar usuário admin global
node scripts/create-admin.js

# OU manualmente via API
curl -X POST http://localhost:3000/api/auth/register-admin \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Admin Sistema",
    "email": "admin@atenmed.com.br",
    "senha": "senha123",
    "telefone": "(11) 99999-9999"
  }'
```

✅ **Admin criado! Use para fazer login.**

---

## 🎉 **PASSO 5: Ativar Primeiro Cliente**

### **Via Script Interativo:**
```bash
node scripts/ativar-cliente.js
```

**Responda as perguntas:**
- Email do lead: joao@teste.com.br *(encontra automaticamente)*
- Nome da clínica: [Enter para usar do lead]
- Slug: [Enter para gerar automático]
- WhatsApp: [Enter para usar do lead]
- Plano: 2 (BASIC)

**O script faz TUDO automaticamente:**
- ✅ Cria clínica
- ✅ Cria usuário owner
- ✅ Vincula usuário à clínica 🔗
- ✅ Atualiza lead (status: fechado)
- ✅ Gera senha temporária
- ✅ Mostra email de boas-vindas

### **📋 Copie as credenciais mostradas:**
```
URL: http://localhost:3000/portal
Login: joao@teste.com.br
Senha: [senha gerada]
```

✅ **Cliente ativado e pronto para usar!**

---

## 🔐 **PASSO 6: Testar Portal do Cliente**

### **Fazer login:**
```
1. Acesse: http://localhost:3000/login
2. Email: joao@teste.com.br
3. Senha: [senha gerada no passo 5]
```

### **Acesse o portal:**
```
http://localhost:3000/portal
```

### **O que você verá:**
- ✅ Dashboard com estatísticas
- ✅ Link público da clínica
- ✅ Dados da clínica (editar)
- ✅ Personalização (cores, logo)
- ✅ Horários de atendimento
- ✅ Faturas (vazio ainda)
- ✅ Suporte

**IMPORTANTE:** Cliente vê APENAS dados da própria clínica! 🔒

---

## 💰 **PASSO 7: Gerar Primeira Fatura**

```bash
node scripts/gerar-faturas-mensais.js
```

**O script:**
- ✅ Busca clínicas ativas
- ✅ Gera fatura para o mês
- ✅ Vencimento dia 10
- ✅ Valor conforme plano

**Ver faturas criadas:**
```bash
# Via API
curl http://localhost:3000/api/invoices

# OU no portal do cliente em: Faturas
```

✅ **Sistema de faturamento funcionando!**

---

## 🔄 **CONFIGURAR AUTOMAÇÕES (Cron)**

### **Linux/Mac:**
```bash
crontab -e
```

**Adicionar:**
```cron
# Gerar faturas (dia 1 às 00h)
0 0 1 * * cd /path/to/atenmed && node scripts/gerar-faturas-mensais.js

# Verificar inadimplência (diariamente às 8h)
0 8 * * * cd /path/to/atenmed && node scripts/verificar-inadimplencia.js
```

### **Windows:**
Use o Agendador de Tarefas:
1. Abrir "Agendador de Tarefas"
2. Criar Tarefa Básica
3. Programa: `node`
4. Argumentos: `scripts/gerar-faturas-mensais.js`
5. Agendar: Mensal, dia 1, 00:00

✅ **Automações configuradas!**

---

## 🧪 **TESTAR CONTROLE DE INADIMPLÊNCIA**

### **Simular inadimplência:**
```bash
# Executar verificação manual
node scripts/verificar-inadimplencia.js
```

**O que acontece:**
- ✅ Faturas vencidas marcadas como "vencido"
- ✅ Clínicas com 15+ dias são suspensas
- ✅ Clínicas que pagaram são reativadas
- ✅ Lembretes enviados (3 dias antes do vencimento)

**Ver status da clínica:**
```
Portal → Dashboard → Status
```

✅ **Controle automático funcionando!**

---

## 📱 **TESTAR LIMITES DE PLANO**

### **Simular limite atingido:**

1. **Editar temporariamente** `middleware/subscriptionStatus.js`
2. **Forçar limite baixo:**
```javascript
// Para teste, mudar temporariamente:
const planLimits = limits[plan] || limits.free;
planLimits.appointments = 0; // Forçar limite
```

3. **Tentar criar agendamento:**
```bash
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{ ... }'
```

4. **Resposta esperada:**
```json
{
  "success": false,
  "error": "Limite de agendamentos atingido",
  "message": "Seu plano BASIC permite até 300 agendamentos por mês.",
  "code": "PLAN_LIMIT_REACHED",
  "suggestion": "Faça upgrade do seu plano para continuar"
}
```

✅ **Limites funcionando!**

---

## 🎯 **FLUXO COMPLETO DE TESTE**

### **1. Captação (1 min)**
- Acesse `/planos`
- Preencha formulário
- Submit

### **2. CRM (1 min)**
- Acesse `/crm`
- Veja lead
- Mova para "fechado"

### **3. Ativação (2 min)**
```bash
node scripts/ativar-cliente.js
```

### **4. Portal (1 min)**
- Login com credenciais
- Acesse `/portal`
- Personalize dados

### **5. Faturamento (30s)**
```bash
node scripts/gerar-faturas-mensais.js
```

✅ **Sistema testado end-to-end em 5 minutos!**

---

## 🆘 **PROBLEMAS COMUNS**

### **1. Erro "MongoDB not connected"**
```bash
# Iniciar MongoDB
mongod
# OU
brew services start mongodb-community
```

### **2. Erro "Token required"**
```bash
# Criar admin primeiro
node scripts/create-admin.js

# Fazer login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@atenmed.com.br", "senha": "senha123"}'

# Usar token retornado
```

### **3. Portal não carrega clínica**
```bash
# Verificar se usuário tem clinic vinculada
# Reativar cliente com script:
node scripts/ativar-cliente.js
```

### **4. Limites não funcionam**
```bash
# Verificar se middlewares estão aplicados no server.js
# Linhas 226-232
```

---

## 📊 **URLS IMPORTANTES**

### **Para Clientes:**
- 🌐 Landing: `http://localhost:3000/planos`
- 🔐 Login: `http://localhost:3000/login`
- 👤 Portal: `http://localhost:3000/portal`
- 🏥 Página Pública: `http://localhost:3000/clinica/{slug}`

### **Para Admin:**
- 📊 CRM: `http://localhost:3000/crm`
- 📈 Analytics: `http://localhost:3000/analytics`
- 🎛️ Dashboard: `http://localhost:3000/dashboard`
- 📱 WhatsApp: `http://localhost:3000/whatsapp`

### **APIs Principais:**
- `/api/leads` - Gestão de leads
- `/api/clinics` - Gestão de clínicas
- `/api/invoices` - Gestão de faturas
- `/api/auth` - Autenticação

---

## ✅ **CHECKLIST DE LANÇAMENTO**

### **Antes de Lançar:**
- [ ] MongoDB configurado em produção
- [ ] Variáveis de ambiente (.env) configuradas
- [ ] Cron jobs agendados
- [ ] Email SMTP configurado (opcional)
- [ ] WhatsApp Business API configurado
- [ ] Criar primeiro admin
- [ ] Testar fluxo completo
- [ ] Backup do banco configurado

### **Ao Lançar:**
- [ ] Divulgar link `/planos`
- [ ] Preparar material de vendas
- [ ] Definir processo de suporte
- [ ] Acompanhar métricas no `/crm`
- [ ] Monitorar logs

---

## 🎉 **PRONTO!**

Seu sistema SaaS está **100% funcional**!

### **Próximos Passos:**
1. ✅ Testar tudo (5 min)
2. ✅ Configurar domínio
3. ✅ Configurar SSL
4. ✅ Divulgar `/planos`
5. ✅ Começar a vender! 💰

---

**Boa sorte com o lançamento! 🚀**

