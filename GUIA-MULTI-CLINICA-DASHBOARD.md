# 🏥 Guia do Sistema Multi-Clínica com Dashboard Visual

## ✅ Sistema Implementado com Sucesso!

O sistema multi-clínica foi implementado e está funcionando perfeitamente em produção!

## 📋 O Que Foi Implementado

### 1. **Dashboard Visual de Gerenciamento**
   - Interface completa para cadastrar e gerenciar clínicas
   - Localização: `https://atenmed.com.br/applications/admin-dashboard/clinicas.html`
   
### 2. **Sistema Multi-Clínica no WhatsApp**
   - Cada clínica tem seu próprio número WhatsApp
   - O sistema identifica automaticamente qual clínica está sendo contatada
   - Automação personalizada para cada clínica

### 3. **API Completa**
   - CRUD completo de clínicas
   - Rotas protegidas por autenticação

## 🚀 Como Usar

### **Passo 1: Acessar o Dashboard**

1. Acesse: `https://atenmed.com.br/applications/admin-dashboard/clinicas.html`
2. Faça login com suas credenciais de administrador

### **Passo 2: Cadastrar uma Clínica**

1. Clique no botão verde **"+ Nova Clínica"**
2. Preencha os dados:
   - **Nome da Clínica** (obrigatório)
   - **Número WhatsApp** (obrigatório) - Ex: `11987654321` ou `(11) 98765-4321`
   - Telefone fixo (opcional)
   - Email (opcional)
   - Endereço completo
   - Cidade e Estado
   - Horário de funcionamento
   - ✅ Habilitar Bot WhatsApp
   - ✅ Clínica Ativa

3. Clique em **"Salvar Clínica"**

### **Passo 3: Configurar o Número no WhatsApp Business API**

No Meta Developer Console:

1. Acesse: https://developers.facebook.com/apps/
2. Selecione seu app WhatsApp
3. Vá em **"WhatsApp" > "Phone Numbers"**
4. Adicione o número da clínica como um número verificado
5. Configure o webhook (se necessário):
   - URL: `https://atenmed.com.br/api/whatsapp/webhook`
   - Token: `atenmed_webhook_2025`

## 🔄 Como Funciona

### **Fluxo de Identificação Automática**

```
1. Cliente manda mensagem para número da clínica
                    ↓
2. WhatsApp API recebe e identifica o número destinatário
                    ↓
3. Sistema busca clínica pelo número no banco de dados
                    ↓
4. Automação personalizada com nome da clínica
                    ↓
5. Lista apenas médicos/especialidades da clínica
                    ↓
6. Agendamento vinculado à clínica correta
```

### **Personalização por Clínica**

Cada clínica recebe:
- ✅ Mensagens de boas-vindas personalizadas com nome da clínica
- ✅ Lista apenas especialidades disponíveis na clínica
- ✅ Lista apenas médicos da clínica
- ✅ Agendamentos vinculados à clínica correta

## 📊 Estatísticas no Dashboard

O dashboard mostra:
- **Total de Clínicas** cadastradas
- **Clínicas Ativas**
- **WhatsApp Habilitado** (quantas clínicas têm bot ativo)

## 🛠️ Gerenciar Clínicas

### **Editar Clínica**
1. Clique em **"Editar"** no card da clínica
2. Modifique os dados
3. Salve as alterações

### **Ativar/Desativar Clínica**
- Clique no botão **"Ativar/Desativar"**
- Clínicas inativas não recebem automação

### **Excluir Clínica**
- Clique em **"Excluir"**
- Confirme a exclusão
- ⚠️ **ATENÇÃO:** Esta ação é permanente!

## 📱 Testando o Sistema

### **Teste 1: Enviar mensagem para o número da clínica**

```
Você: Oi
Bot: Boa tarde! Tudo bem? Aqui e da *Nome da Clínica*!
     Como posso ajudar voce hoje?
     
     1 Marcar consulta
     2 Ver minhas consultas
     3 Remarcar consulta
     4 Cancelar consulta
     5 Falar com alguem
```

### **Teste 2: Verificar especialidades filtradas**

Quando você escolhe "Marcar consulta", o sistema mostra apenas:
- Especialidades que têm médicos na clínica
- Médicos que trabalham na clínica

## 🔐 Segurança

- ✅ Todas as rotas administrativas protegidas com autenticação JWT
- ✅ Webhook verificado com signature do Meta
- ✅ Rate limiting para proteção contra abuso
- ✅ Sanitização de dados

## 📝 Estrutura do Banco de Dados

### **Modelo de Clínica**

```javascript
{
  name: "Clínica São Paulo",
  contact: {
    whatsapp: "11987654321",  // Usado para identificação
    phone: "1133334444",
    email: "contato@clinica.com.br"
  },
  address: {
    street: "Rua das Flores, 123",
    city: "São Paulo",
    state: "SP"
  },
  hours: {
    start: 8,  // 8h
    end: 18    // 18h
  },
  whatsappBot: {
    enabled: true
  },
  active: true
}
```

## 🎯 Próximos Passos

Para expandir o sistema:

1. **Cadastrar Médicos**
   - Vincule médicos às clínicas no banco de dados
   - Use o campo `clinic` no modelo Doctor

2. **Cadastrar Especialidades**
   - Adicione especialidades ao sistema
   - Vincule médicos às especialidades

3. **Configurar Google Calendar** (opcional)
   - Configure credenciais do Google Calendar
   - Agendamentos serão sincronizados automaticamente

## 💡 Dicas

- **Formato do número WhatsApp**: Aceita qualquer formato (com ou sem símbolos)
  - ✅ `11987654321`
  - ✅ `(11) 98765-4321`
  - ✅ `+55 11 98765-4321`
  
- **Nome da clínica**: Aparece nas mensagens do bot
- **Horários**: Use 0-23 (formato 24h)

## 🐛 Troubleshooting

### **Problema: Clínica não recebe mensagens**
- Verifique se o número está correto
- Confirme que `whatsappBot.enabled = true`
- Confirme que `active = true`
- Verifique os logs: `pm2 logs atenmed`

### **Problema: Bot responde mas não filtra por clínica**
- Verifique se há médicos cadastrados para a clínica
- Confirme o vínculo entre médicos e clínica no banco de dados

### **Problema: Não consigo acessar o dashboard**
- Verifique suas credenciais de admin
- Confirme que está logado no sistema

## 📞 Suporte

Se precisar de ajuda:
1. Verifique os logs: `pm2 logs atenmed`
2. Teste o webhook: `curl https://atenmed.com.br/health`
3. Entre em contato com o suporte técnico

---

**Status:** ✅ Sistema em Produção
**Última Atualização:** 28 de outubro de 2025
**Versão:** 2.0.0

