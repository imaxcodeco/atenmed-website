# 📱 Integração WhatsApp via QR Code

## 🎯 Como Funciona

O AtenMed agora oferece integração com WhatsApp via QR Code, similar ao Zaia.app! Conecte seu agente de IA ao WhatsApp com apenas **um clique**.

## ⚠️ Importante: API Não Oficial

Esta integração usa a biblioteca `whatsapp-web.js`, que é uma **API não oficial** do WhatsApp. Isso significa:

- ✅ **Vantagens:**
  - Conexão rápida e simples (um clique)
  - Não precisa de aprovação do Meta/Facebook
  - Funciona imediatamente
  - Gratuito

- ⚠️ **Riscos:**
  - Pode ser bloqueado pelo WhatsApp
  - Não é suportado oficialmente
  - Pode parar de funcionar a qualquer momento
  - Recomendado para uso pessoal/testes

## 🚀 Como Conectar

### Passo 1: Criar/Ativar Agente

1. Acesse: `https://atenmed.com.br/ai-agents`
2. Crie um novo agente ou edite um existente
3. Marque a opção **"Habilitar WhatsApp"**
4. Salve o agente

### Passo 2: Conectar via QR Code

1. No card do agente, clique no ícone do WhatsApp 📱
2. Um QR Code será gerado automaticamente
3. Abra o WhatsApp no seu celular
4. Vá em **Configurações > Aparelhos conectados**
5. Toque em **"Conectar um aparelho"**
6. Escaneie o QR Code exibido na tela
7. Aguarde a confirmação de conexão

### Passo 3: Pronto!

Após escanear, o sistema detectará automaticamente a conexão e seu agente estará pronto para receber e responder mensagens!

## 🔧 Funcionalidades

### ✅ O que funciona:

- Receber mensagens do WhatsApp
- Responder automaticamente usando o agente de IA
- Manter histórico de conversas
- Múltiplos agentes (um por clínica)
- Conexão persistente (não precisa reconectar sempre)

### 📋 Limitações:

- Não funciona com grupos (apenas conversas individuais)
- Pode ser bloqueado se enviar muitas mensagens
- Requer que o WhatsApp Web esteja ativo no servidor
- Não suporta mídia (por enquanto)

## 🛠️ Troubleshooting

### QR Code não aparece

1. Verifique se o agente está ativo
2. Verifique se o canal WhatsApp está habilitado
3. Tente desconectar e conectar novamente
4. Verifique os logs do servidor

### Conexão caiu

1. Clique novamente no ícone do WhatsApp
2. Escaneie o novo QR Code
3. A sessão é salva, então pode reconectar facilmente

### Mensagens não chegam

1. Verifique se o WhatsApp está conectado (status no card do agente)
2. Verifique se o agente está ativo
3. Verifique os logs do servidor
4. Teste enviando uma mensagem manual

### Erro ao enviar mensagem

- Pode ser bloqueio temporário do WhatsApp
- Aguarde alguns minutos e tente novamente
- Não envie muitas mensagens em pouco tempo

## 🔒 Segurança

- As sessões são armazenadas localmente no servidor
- Cada clínica tem sua própria sessão isolada
- As mensagens são processadas através dos agentes de IA configurados
- Não compartilhamos dados com terceiros

## 📊 Status da Conexão

Você pode verificar o status da conexão:

- **Verde**: Conectado e funcionando
- **Amarelo**: QR Code gerado, aguardando escaneamento
- **Vermelho**: Desconectado ou erro

## 🔄 Alternativa: API Oficial

Se precisar de uma solução mais estável e profissional, você pode usar a **WhatsApp Business API oficial**:

1. Crie uma conta no Meta for Developers
2. Configure um app WhatsApp Business
3. Obtenha Phone ID e Token
4. Configure no `.env` do servidor
5. Use a integração oficial (já implementada)

A API oficial é mais estável, mas requer aprovação e pode ter custos.

## 💡 Dicas

1. **Use um número dedicado**: Não use seu número pessoal principal
2. **Teste primeiro**: Conecte e teste antes de usar em produção
3. **Monitore**: Acompanhe o status da conexão regularmente
4. **Backup**: Considere ter a API oficial como backup

## 📞 Suporte

Para problemas ou dúvidas:
- Email: contato@atenmed.com.br
- WhatsApp: (22) 99284-2996

---

**Última atualização:** Novembro 2024

