# 🤖 Sistema de Agentes de IA - AtenMed

Sistema completo de criação e gerenciamento de agentes de inteligência artificial conversacional, similar ao Zaia.app.

## 🎯 Funcionalidades

### ✅ Implementado

- ✅ **Criação de Agentes**: Interface visual para criar e configurar agentes de IA
- ✅ **Templates Pré-configurados**: 5 templates prontos (Suporte, Vendas, Agendamento, Qualificação, Personalizado)
- ✅ **Personalização**: Configurar personalidade, tom, prompts do sistema
- ✅ **Multi-canal**: Suporte para WhatsApp, Instagram, Website (widget)
- ✅ **Knowledge Base**: Adicionar documentos e informações para o agente
- ✅ **Fluxos Conversacionais**: Criar fluxos de conversa personalizados
- ✅ **Analytics**: Estatísticas e métricas dos agentes
- ✅ **Qualificação de Leads**: Sistema integrado de captura de leads

### 🚧 Em Desenvolvimento

- ⏳ Editor visual de fluxos
- ⏳ Integração com Instagram
- ⏳ Dashboard de analytics completo
- ⏳ Sistema de sentiment analysis

## 📦 Estrutura

```
applications/ai-agents/
├── index.html          # Interface principal
├── styles.css          # Estilos
├── app.js             # Lógica da aplicação
├── widget.js          # Widget para embed em sites
└── README.md          # Este arquivo

models/
├── Agent.js           # Modelo de dados do agente
└── Conversation.js    # Modelo de conversas

routes/
└── agents.js          # Rotas da API

services/
└── agentService.js    # Serviço de processamento
```

## 🚀 Como Usar

### 1. Acessar a Interface

```
https://atenmed.com.br/ai-agents
```

ou

```
https://atenmed.com.br/agentes
```

### 2. Criar um Agente

1. Clique em "Novo Agente"
2. Escolha um template ou crie um personalizado
3. Configure:
   - Nome e descrição
   - Personalidade (nome, tom)
   - Prompt do sistema
   - Canais de integração
4. Salve o agente

### 3. Ativar o Agente

Após criar, clique no botão de ativar/pausar no card do agente.

### 4. Integrar no Site

Para adicionar o widget em um site, adicione este código antes do `</body>`:

```html
<script>
    window.AtenMedWidgetConfig = {
        agentId: 'SEU_AGENT_ID',
        position: 'bottom-right', // ou 'bottom-left', 'top-right', 'top-left'
        primaryColor: '#45a7b1',
        welcomeMessage: 'Olá! Como posso ajudar?'
    };
</script>
<script src="https://atenmed.com.br/apps/ai-agents/widget.js"></script>
```

## 📡 API Endpoints

### Listar Agentes
```
GET /api/agents
Authorization: Bearer {token}
```

### Criar Agente
```
POST /api/agents
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Meu Agente",
  "description": "Descrição do agente",
  "template": "suporte",
  "personality": {
    "name": "Assistente",
    "tone": "amigavel"
  },
  "aiConfig": {
    "systemPrompt": "Você é um assistente..."
  },
  "channels": {
    "whatsapp": { "enabled": true },
    "website": { "enabled": true }
  }
}
```

### Processar Mensagem
```
POST /api/agents/:id/chat
Content-Type: application/json

{
  "message": "Olá, preciso de ajuda",
  "conversationId": "optional",
  "userId": "user_123",
  "channel": "website"
}
```

### Obter Templates
```
GET /api/agents/templates/list
Authorization: Bearer {token}
```

## 🎨 Templates Disponíveis

### 1. Suporte
- Foco: Atendimento ao cliente
- Tom: Profissional
- Ideal para: Resolução de problemas, dúvidas

### 2. Vendas
- Foco: Qualificação e conversão
- Tom: Amigável
- Ideal para: Captação de leads, vendas

### 3. Agendamento
- Foco: Agendar consultas
- Tom: Amigável
- Ideal para: Clínicas, consultórios

### 4. Qualificação
- Foco: Coletar informações
- Tom: Profissional
- Ideal para: Qualificar leads

### 5. Personalizado
- Foco: Configuração livre
- Tom: Configurável
- Ideal para: Casos específicos

## 🔧 Configuração Avançada

### Personalidade

```javascript
{
  "name": "Maria",
  "tone": "amigavel", // formal, casual, amigavel, profissional, empatico
  "useEmojis": true,
  "responseLength": "media" // curta, media, longa
}
```

### Configuração de IA

```javascript
{
  "provider": "gemini", // gemini, openai, custom
  "model": "gemini-1.5-pro",
  "temperature": 0.7, // 0-1
  "maxTokens": 500,
  "systemPrompt": "Você é um assistente..."
}
```

### Knowledge Base

Adicione documentos à knowledge base do agente:

```javascript
POST /api/agents/:id/knowledge
{
  "title": "FAQ",
  "content": "Perguntas frequentes...",
  "type": "faq" // faq, documento, politica, procedimento
}
```

## 📊 Analytics

Acesse estatísticas do agente:

```
GET /api/agents/:id/stats
Authorization: Bearer {token}
```

Retorna:
- Total de conversas
- Total de mensagens
- Taxa de satisfação
- Leads gerados
- Tempo médio de resposta

## 🔗 Integrações

### WhatsApp
Configure no agente:
- Phone Number ID
- Webhook URL

### Website Widget
O widget é automaticamente gerado quando você habilita o canal "website".

### Instagram
Em breve...

## 🛠️ Desenvolvimento

### Estrutura de Dados

**Agent Model:**
- Informações básicas (nome, descrição)
- Personalidade e comportamento
- Configuração de IA
- Knowledge base
- Fluxos conversacionais
- Canais de integração
- Estatísticas

**Conversation Model:**
- Mensagens
- Status
- Lead gerado
- Satisfação
- Histórico completo

### Adicionar Novo Template

Edite `services/agentService.js` e adicione ao objeto `TEMPLATES`:

```javascript
meuTemplate: {
    name: 'Meu Template',
    description: 'Descrição...',
    personality: { ... },
    aiConfig: { ... },
    flows: [ ... ]
}
```

## 📝 Notas

- O sistema usa Google Gemini por padrão (configurar `GEMINI_API_KEY` no .env)
- As conversas são armazenadas no MongoDB
- O widget é responsivo e funciona em mobile
- Suporte a múltiplos agentes por clínica

## 🐛 Troubleshooting

**Agente não responde:**
- Verifique se está ativo
- Verifique se `GEMINI_API_KEY` está configurado
- Veja os logs do servidor

**Widget não aparece:**
- Verifique se o `agentId` está correto
- Verifique se o canal "website" está habilitado
- Verifique o console do navegador

**Erro de autenticação:**
- Verifique se o token JWT está válido
- Faça login novamente

## 🎉 Pronto!

Seu sistema de agentes de IA está funcionando! Crie seu primeiro agente e comece a automatizar conversas.

---

**Desenvolvido para AtenMed**  
**Versão 1.0 - Novembro 2024**

