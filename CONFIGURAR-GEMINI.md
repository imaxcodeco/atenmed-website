# 🤖 Configurar Google Gemini AI para WhatsApp

## ✨ O que o Gemini faz no sistema?

O Google Gemini transforma o atendimento WhatsApp em **conversas naturais e humanizadas**!

### **Recursos Implementados:**

✅ **Conversas Ultra-Humanizadas**
- "Maria", a atendente virtual com personalidade brasileira, jovem e simpática
- Respostas naturais e empáticas
- Linguagem casual: "a gente", "pra", "tá", "né"
- Expressões brasileiras: "opa", "show", "legal"

✅ **Detecção Inteligente de Intenção**
- Entende "to com dor nas costas" → Sugere ortopedia
- Detecta urgências automaticamente
- Identifica quando o paciente quer agendar sem precisar digitar número

✅ **Respostas Contextuais**
- Lembra do nome do paciente
- Mantém histórico da conversa
- Adapta respostas baseado no contexto

✅ **Extração Automática de Informações**
- Extrai nomes automaticamente
- Identifica especialidades médicas
- Gera respostas empáticas para sintomas

---

## 🚀 Como Ativar (Passo a Passo)

### **Passo 1: Obter API Key do Google Gemini**

1. **Acesse:** https://makersuite.google.com/app/apikey
2. **Faça login** com sua conta Google
3. Clique em **"Create API Key"** ou **"Get API Key"**
4. **Copie** a chave que será gerada (algo como: `AIzaSyC...`)

### **Passo 2: Configurar no Servidor**

#### **Opção A: Variável de Ambiente (Recomendado)**

```bash
# Conectar ao servidor
ssh -i "C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem" ubuntu@3.129.206.231

# Ir para o diretório do projeto
cd /var/www/atenmed

# Editar o arquivo .env
nano .env

# Adicionar a linha (substitua pela sua chave):
GEMINI_API_KEY=AIzaSyC_SuaChaveAqui

# Opcional: Escolher modelo (padrão: gemini-1.5-pro)
GEMINI_MODEL=gemini-1.5-pro

# Salvar: Ctrl+O, Enter, Ctrl+X

# Reiniciar aplicação
pm2 restart atenmed

# Verificar logs
pm2 logs atenmed --lines 50
```

#### **Opção B: Via GitHub Secrets (Deploy Automático)**

1. Acesse: https://github.com/seu-usuario/atenmed-website/settings/secrets/actions
2. Clique em **"New repository secret"**
3. Nome: `GEMINI_API_KEY`
4. Valor: Sua chave API
5. Salvar

---

## 📊 Verificar se Está Funcionando

### **1. Verificar Logs**

```bash
pm2 logs atenmed --lines 100 | grep -i gemini
```

**Deve aparecer:**
```
🤖 AI Service inicializado com GEMINI gemini-1.5-pro
💬 Modo de conversa humanizada ATIVADO
```

### **2. Testar no WhatsApp**

Envie uma mensagem natural (não use números):

```
Você: oi, to com dor nas costas
Bot: Puxa, sinto muito pela dor! Vamos cuidar disso. 
     Acho que ortopedia seria ideal pra voce. 
     Quer que eu veja os horarios disponiveis?
```

**Sem Gemini** (resposta padrão):
```
Bot: Ops! Nao entendi...
     Digite o *numero* da opcao que voce quer:
     1 - Marcar consulta
```

**Com Gemini** (resposta natural):
```
Bot: Oi! Tudo bem? Sou a Maria, da AtenMed! 
     Em que posso te ajudar hoje?
```

---

## ⚙️ Configurações Avançadas

### **Variáveis de Ambiente Disponíveis:**

```bash
# API Key (OBRIGATÓRIA)
GEMINI_API_KEY=AIzaSyC...

# Modelo (OPCIONAL - padrão: gemini-1.5-pro)
GEMINI_MODEL=gemini-1.5-pro
# Opções: gemini-pro, gemini-1.5-pro, gemini-1.5-flash

# Habilitar/Desabilitar IA (OPCIONAL - padrão: true se tiver key)
AI_ENABLED=true
```

### **Modelos Disponíveis:**

| Modelo | Velocidade | Qualidade | Custo | Recomendado |
|--------|------------|-----------|-------|-------------|
| `gemini-1.5-pro` | Média | Excelente | Médio | ✅ Sim |
| `gemini-1.5-flash` | Rápida | Boa | Baixo | Para alto volume |
| `gemini-pro` | Rápida | Boa | Baixo | Legado |

---

## 💡 Exemplos de Conversas Humanizadas

### **Exemplo 1: Agendamento Natural**

```
Paciente: oi
Maria: Oi! Tudo bem? Sou a Maria, da AtenMed! Em que posso te ajudar hoje?

Paciente: to sentindo muita dor no peito
Maria: Puxa, sinto muito! Dor no peito é algo sério. 
       Vou te conectar com um cardiologista. 
       Temos horarios disponiveis. Me passa seu nome completo?

Paciente: João Silva
Maria: Prazer, João! Vamos ver os horarios pra voce...
```

### **Exemplo 2: Dúvidas**

```
Paciente: quanto custa uma consulta?
Maria: Boa pergunta! Os valores variam por especialidade. 
       Quer que eu transfira voce pra alguem da equipe 
       que pode te passar os precos certinhos?

Paciente: sim
Maria: Perfeito! Ja vou chamar alguem pra te ajudar!
```

### **Exemplo 3: Empatia**

```
Paciente: to muito preocupado, to com febre há 3 dias
Maria: Entendo sua preocupacao! Febre prolongada merece atencao. 
       Vamos marcar uma consulta urgente com clinico geral. 
       Qual seria o melhor dia pra voce?
```

---

## 🔍 Monitoramento e Estatísticas

### **Ver Estatísticas da IA**

```bash
# Acessar rota de status
curl https://atenmed.com.br/api/whatsapp/stats

# Resposta:
{
  "ai": {
    "provider": "Gemini",
    "model": "gemini-1.5-pro",
    "enabled": true,
    "totalRequests": 150,
    "successfulRequests": 147,
    "failedRequests": 3,
    "successRate": "98.0%"
  }
}
```

---

## 🎯 Custos do Gemini

### **Preços (muito baixos!):**

- **Gemini 1.5 Pro:**
  - Input: $3.50 por milhão de tokens
  - Output: $10.50 por milhão de tokens
  
- **Gemini 1.5 Flash:**
  - Input: $0.35 por milhão de tokens
  - Output: $1.05 por milhão de tokens

### **Estimativa Real:**

- **1 conversa típica:** ~500 tokens = $0.002 (menos de 1 centavo!)
- **1000 conversas/mês:** ~$2 USD
- **10.000 conversas/mês:** ~$20 USD

**Cota Gratuita do Google:**
- 60 requisições por minuto
- Grátis até certo limite (generoso)

---

## 🛠️ Troubleshooting

### **Problema: IA não está respondendo**

**Solução:**
```bash
# Verificar se a key está configurada
cd /var/www/atenmed
cat .env | grep GEMINI_API_KEY

# Se não aparecer, adicionar:
echo "GEMINI_API_KEY=SuaChaveAqui" >> .env

# Reiniciar
pm2 restart atenmed
```

### **Problema: Erro "API key not valid"**

**Causas:**
1. Chave incorreta ou expirada
2. Cota excedida
3. API não habilitada

**Solução:**
1. Gere nova chave em: https://makersuite.google.com/app/apikey
2. Verifique cota em: https://console.cloud.google.com/

### **Problema: Respostas muito lentas**

**Solução:**
```bash
# Trocar para modelo mais rápido
nano /var/www/atenmed/.env

# Mudar para:
GEMINI_MODEL=gemini-1.5-flash

pm2 restart atenmed
```

---

## 📈 Próximas Melhorias Planejadas

- [ ] Suporte a imagens (enviar fotos de exames)
- [ ] Análise de sentimento para detectar urgências
- [ ] Múltiplos idiomas
- [ ] Integração com histórico médico
- [ ] Sugestões de tratamento baseado em sintomas

---

## ✅ Checklist de Ativação

- [ ] Obter API Key do Google Gemini
- [ ] Adicionar `GEMINI_API_KEY` no `.env`
- [ ] Reiniciar aplicação com `pm2 restart atenmed`
- [ ] Verificar logs: `pm2 logs atenmed`
- [ ] Testar conversa natural no WhatsApp
- [ ] Monitorar estatísticas

---

**🎉 Pronto! Seu WhatsApp agora tem IA conversacional ultra-humanizada!**

**Dúvidas?** Consulte os logs ou entre em contato com o suporte técnico.

---

**Última atualização:** 28 de outubro de 2025  
**Versão:** 2.0.0 - Gemini Powered

