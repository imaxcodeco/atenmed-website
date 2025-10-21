# 🤖 IA Conversacional - WhatsApp Bot

## 🎯 Visão Geral

O bot do WhatsApp agora possui **inteligência artificial conversacional** integrada, permitindo entender linguagem natural e gerar respostas contextuais como um humano real!

### ✨ O que a IA faz?

1. **Entende linguagem natural** - Não precisa digitar apenas números
2. **Analisa intenções** - Compreende o que o usuário quer fazer
3. **Gera respostas contextuais** - Responde de forma inteligente
4. **Aprende com contexto** - Usa histórico da conversa
5. **Fallback inteligente** - Quando não entende, passa para humano

---

## 🔧 Provedores de IA Suportados

### 1. **OpenAI (GPT-3.5/GPT-4)** ⭐ Recomendado

**Características:**
- Mais inteligente e preciso
- Respostas mais naturais
- Melhor compreensão de contexto
- Pago (mas barato!)

**Custo:** ~$0.002 por 1000 mensagens (GPT-3.5-turbo)

**Como obter API Key:**
1. Acesse: [platform.openai.com](https://platform.openai.com)
2. Crie uma conta
3. Vá em "API Keys"
4. Crie uma nova chave
5. Adicione créditos (mínimo $5)

### 2. **Google Gemini** 🆓 Gratuito!

**Características:**
- Completamente gratuito
- Até 60 requisições por minuto
- Boa qualidade de respostas
- Integração simples

**Custo:** GRÁTIS! ✨

**Como obter API Key:**
1. Acesse: [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Faça login com conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada

---

## ⚙️ Configuração

### Passo 1: Escolher Provedor

Edite o arquivo `.env`:

```bash
# Escolha: 'openai' ou 'gemini'
AI_PROVIDER=gemini
```

### Passo 2: Configurar API Keys

**Para OpenAI:**
```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-3.5-turbo  # ou gpt-4 para melhor qualidade
```

**Para Gemini (Gratuito):**
```bash
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxx
```

### Passo 3: Reiniciar Servidor

```bash
npm start
```

**Pronto!** A IA estará ativa! 🎉

---

## 💬 Exemplos de Uso

### Antes (Sem IA) ❌

```
Bot: Em que posso te ajudar hoje?
     1️⃣ Quero marcar uma consulta
     2️⃣ Ver minhas consultas

User: sim

Bot: Ops! Não entendi direito... 😅
     Pode escolher uma opção de 1 a 5?
```

### Depois (Com IA) ✅

```
Bot: Em que posso te ajudar hoje?
     1️⃣ Quero marcar uma consulta
     2️⃣ Ver minhas consultas

User: sim

Bot: Legal! Vamos lá então... 😊
     Onde você prefere ser atendido?
     1️⃣ AtenMed Centro
```

---

## 🎭 Exemplos Reais de Conversação

### Exemplo 1: Linguagem Natural

```
User: oi, quero marcar consulta

Bot: Oi! 😊 Legal, vamos marcar uma consulta!
     Onde você prefere ser atendido?
     1️⃣ AtenMed Centro
     2️⃣ AtenMed Sul
```

### Exemplo 2: Confirmação Natural

```
User: pode ser

Bot: Show! Bora então! 👍
     Qual especialidade você precisa?
```

### Exemplo 3: Pergunta Fora do Contexto

```
User: quanto custa a consulta?

Bot: Boa pergunta! Os valores variam por especialidade... 
     Vou te passar pra alguém da equipe que pode te informar 
     certinho! Aguarda só um pouquinho! 😊
     
     [Transfer para atendente humano]
```

### Exemplo 4: Saudação Casual

```
User: e aí, blz?

Bot: E aí! Tudo certo! 😊 
     Como posso te ajudar hoje? Quer marcar uma consulta?
```

---

## 🧠 Como Funciona?

### Arquitetura do Sistema Híbrido

```
Mensagem do Usuário
       ↓
[Análise de Intenção com IA]
       ↓
   ┌────────┴────────┐
   │                 │
Intenção         Número
Detectada        (1-5)
   │                 │
   ↓                 ↓
[Mapear para      [Fluxo
 Ação do Fluxo]    Direto]
       ↓
[Fluxo Estruturado de Agendamento]
       ↓
[IA Gera Resposta Personalizada]
       ↓
  Resposta ao Usuário
```

### Fluxo Detalhado

1. **Recebe mensagem do usuário**
   ```javascript
   "quero marcar consulta"
   ```

2. **IA analisa intenção**
   ```javascript
   analyzeIntent("quero marcar consulta")
   // Retorna: "agendar"
   ```

3. **Mapeia para ação**
   ```javascript
   if (intent === 'agendar') action = '1';
   ```

4. **Executa fluxo estruturado**
   ```javascript
   // Continua no fluxo normal de agendamento
   ```

5. **IA gera resposta se necessário**
   ```javascript
   // Para perguntas fora do fluxo
   processMessage(userMessage, history)
   ```

---

## 🎯 Análise de Intenções

A IA classifica automaticamente o que o usuário quer fazer:

| Intenção | Exemplos de Frases | Ação |
|----------|-------------------|------|
| `agendar` | "quero marcar", "preciso de consulta", "agendar" | Inicia agendamento |
| `consultar` | "ver minhas consultas", "quando é minha consulta" | Busca agendamentos |
| `cancelar` | "quero desmarcar", "cancelar consulta" | Processo de cancelamento |
| `confirmar` | "sim", "ok", "confirmo", "pode ser" | Confirma ação atual |
| `negar` | "não", "nao quero", "cancela" | Nega ação atual |
| `ajuda` | "preciso de ajuda", "falar com alguém" | Transfere para humano |
| `saudacao` | "oi", "olá", "bom dia" | Responde saudação |
| `numero` | "1", "2", "3" | Usa fluxo estruturado |
| `outro` | Qualquer outra coisa | IA tenta responder |

---

## 📊 Estatísticas da IA

### Verificar Status

```bash
GET http://localhost:3000/api/whatsapp/health
```

**Resposta:**
```json
{
  "success": true,
  "status": "configured",
  "message": "WhatsApp Business API está configurado",
  "ai": {
    "enabled": true,
    "provider": "gemini",
    "successRate": "98.5%"
  }
}
```

### Ver Estatísticas Detalhadas

```bash
GET http://localhost:3000/api/whatsapp/ai-stats
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "provider": "gemini",
    "enabled": true,
    "totalRequests": 1250,
    "successfulRequests": 1232,
    "failedRequests": 18,
    "successRate": "98.6%",
    "avgResponseTime": 850
  }
}
```

---

## 🎨 Personalização da IA

### Contexto do Sistema

O comportamento da IA é definido em `services/aiService.js`:

```javascript
const SYSTEM_CONTEXT = `Você é um assistente virtual amigável da AtenMed.

PERSONALIDADE:
- Seja extremamente amigável e empático
- Use linguagem casual brasileira
- Seja breve e direto
- Use emojis contextuais

RESTRIÇÕES:
- NUNCA marque consultas diretamente
- NÃO invente horários ou disponibilidade
- Se não souber, ofereça ajuda humana
```

### Customizar Personalidade

Edite o `SYSTEM_CONTEXT` para mudar:
- Tom de voz (formal/informal)
- Expressões usadas
- Nível de detalhe
- Restrições e regras

---

## 💡 Dicas de Uso

### ✅ Melhores Práticas

1. **Use Gemini para começar** (é grátis!)
2. **Monitore os custos** se usar OpenAI
3. **Teste bastante** antes de ir para produção
4. **Revise o SYSTEM_CONTEXT** para sua marca
5. **Configure timeout** adequado

### ⚠️ Limitações

1. **IA não marca consultas sozinha** - apenas coleta informações
2. **Não verifica disponibilidade** - usa o sistema estruturado
3. **Pode não entender tudo** - tem fallback para humano
4. **Requer internet** - chamadas à API externas
5. **Tem latência** - ~1-2 segundos de resposta

---

## 🔒 Segurança e Privacidade

### Dados Enviados para IA

A IA recebe apenas:
- ✅ Mensagens do usuário
- ✅ Histórico da conversa (últimas 10 mensagens)
- ✅ Contexto do sistema (personalidade)

**NÃO** recebe:
- ❌ Dados sensíveis (CPF, etc)
- ❌ Informações médicas
- ❌ Dados de pagamento
- ❌ Senhas ou tokens

### Política de Retenção

- **OpenAI:** 30 dias (depois apaga)
- **Gemini:** Não armazena dados pessoais

---

## 📈 Comparação de Provedores

| Característica | OpenAI GPT-3.5 | OpenAI GPT-4 | Google Gemini |
|----------------|----------------|--------------|---------------|
| **Custo** | $0.002/1k msgs | $0.03/1k msgs | GRATUITO ✨ |
| **Qualidade** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Velocidade** | ~1s | ~2s | ~1.5s |
| **Limite** | Ilimitado* | Ilimitado* | 60 req/min |
| **Contexto** | 4k tokens | 8k tokens | 30k tokens |

*Com créditos disponíveis

### Recomendação

- **Começando?** → Use Gemini (grátis!)
- **Produção pequena?** → GPT-3.5 (barato e bom)
- **Máxima qualidade?** → GPT-4 (caro mas perfeito)

---

## 🐛 Troubleshooting

### IA não está respondendo

1. **Verifique a API Key:**
   ```bash
   echo $OPENAI_API_KEY  # ou $GEMINI_API_KEY
   ```

2. **Teste o health check:**
   ```bash
   curl http://localhost:3000/api/whatsapp/health
   ```

3. **Veja os logs:**
   ```bash
   npm run logs
   ```

### Respostas estranhas/incorretas

1. **Revise o SYSTEM_CONTEXT** em `aiService.js`
2. **Teste com diferentes temperaturas** (0.3-0.9)
3. **Aumente o max_tokens** se respostas cortadas

### Erros de API

**OpenAI:**
- `401 Unauthorized` → API Key inválida
- `429 Too Many Requests` → Limite excedido
- `insufficient_quota` → Sem créditos

**Gemini:**
- `400 Bad Request` → Formato inválido
- `429 Resource Exhausted` → Limite de 60/min
- `403 Permission Denied` → API Key inválida

---

## 🚀 Próximas Melhorias

### Em Desenvolvimento:
- [ ] Cache de respostas comuns (reduzir custos)
- [ ] Detecção de sentimento do usuário
- [ ] Recomendações proativas
- [ ] Suporte a múltiplos idiomas

### Futuro:
- [ ] Fine-tuning de modelo específico para saúde
- [ ] Integração com base de conhecimento
- [ ] Respostas em áudio (Text-to-Speech)
- [ ] Análise de feedback automática

---

## 📚 Recursos Adicionais

### Documentação das APIs

- [OpenAI API Docs](https://platform.openai.com/docs/api-reference)
- [Google Gemini Docs](https://ai.google.dev/docs)

### Tutoriais

- [Como criar API Key OpenAI](https://platform.openai.com/docs/quickstart)
- [Gemini Quickstart](https://ai.google.dev/tutorials/quickstart)

---

## 🎉 Conclusão

Com IA conversacional, seu WhatsApp Bot agora:

✅ Entende linguagem natural  
✅ Responde de forma inteligente  
✅ Parece um humano de verdade  
✅ Melhora satisfação do cliente  
✅ Reduz necessidade de intervenção humana  

**Resultado:** Experiência muito mais natural e eficiente! 🚀

---

**AtenMed** - Tecnologia + Humanização! 🤖💚

