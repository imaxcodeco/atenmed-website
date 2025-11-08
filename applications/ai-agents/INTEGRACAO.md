# 🔗 Guia de Integração - Widget de Agentes IA

## 📋 Integração Rápida

### Para Sites Externos

Adicione este código antes do `</body>` do seu site:

```html
<script>
    window.AtenMedWidgetConfig = {
        agentId: 'SEU_AGENT_ID_AQUI',
        position: 'bottom-right', // bottom-right, bottom-left, top-right, top-left
        primaryColor: '#45a7b1',
        welcomeMessage: 'Olá! Como posso ajudar?'
    };
</script>
<script src="https://atenmed.com.br/apps/ai-agents/widget.js"></script>
```

### Para Sites no AtenMed

Se você está integrando em uma página do próprio AtenMed (como a página pública da clínica), use caminhos relativos:

```html
<script>
    window.AtenMedWidgetConfig = {
        agentId: 'SEU_AGENT_ID_AQUI',
        position: 'bottom-right',
        primaryColor: '#45a7b1',
        welcomeMessage: 'Olá! Como posso ajudar?'
    };
</script>
<script src="/apps/ai-agents/widget.js"></script>
```

## 🔑 Como Obter o Agent ID

1. Acesse: https://atenmed.com.br/ai-agents
2. Faça login
3. Crie ou selecione um agente
4. O ID do agente está na URL ou você pode copiá-lo do código do agente

## ⚙️ Configurações Disponíveis

```javascript
{
    agentId: 'string (obrigatório)',      // ID do agente
    position: 'string',                    // Posição do widget
    primaryColor: 'string',               // Cor principal (hex)
    welcomeMessage: 'string',             // Mensagem de boas-vindas
    apiBase: 'string (opcional)'          // Base da API (padrão: /api/agents)
}
```

## 📱 Exemplo Completo

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Meu Site</title>
</head>
<body>
    <h1>Bem-vindo ao meu site</h1>
    
    <!-- Conteúdo do site -->
    
    <!-- Widget AtenMed AI -->
    <script>
        window.AtenMedWidgetConfig = {
            agentId: '507f1f77bcf86cd799439011',
            position: 'bottom-right',
            primaryColor: '#45a7b1',
            welcomeMessage: 'Olá! Sou o assistente virtual. Como posso ajudar?'
        };
    </script>
    <script src="https://atenmed.com.br/apps/ai-agents/widget.js"></script>
</body>
</html>
```

## 🎨 Personalização

### Cores

Use qualquer cor em formato hexadecimal:

```javascript
primaryColor: '#FF5733'  // Laranja
primaryColor: '#9B59B6'  // Roxo
primaryColor: '#2ECC71'  // Verde
```

### Posições

- `bottom-right` - Canto inferior direito (padrão)
- `bottom-left` - Canto inferior esquerdo
- `top-right` - Canto superior direito
- `top-left` - Canto superior esquerdo

## 🔒 Segurança

O widget faz requisições para:
- `https://atenmed.com.br/api/agents/{agentId}/chat`

Certifique-se de que:
- O agente está ativo
- O canal "website" está habilitado no agente
- CORS está configurado corretamente (já configurado no servidor)

## 📊 Tracking

O widget automaticamente:
- Gera um ID único para cada usuário (armazenado em localStorage)
- Mantém histórico de conversas
- Rastreia satisfação (quando implementado)

## 🐛 Troubleshooting

**Widget não aparece:**
- Verifique se o `agentId` está correto
- Verifique o console do navegador para erros
- Certifique-se de que o agente está ativo

**Erro 404:**
- Verifique se a URL do script está correta: `https://atenmed.com.br/apps/ai-agents/widget.js`

**Erro de CORS:**
- O servidor já está configurado para aceitar requisições do widget
- Se persistir, verifique as configurações de CORS no servidor

**Agente não responde:**
- Verifique se o agente está ativo no painel
- Verifique se o canal "website" está habilitado
- Verifique os logs do servidor

## 📞 Suporte

Para dúvidas ou problemas:
- Email: contato@atenmed.com.br
- WhatsApp: (22) 99284-2996

---

**Última atualização:** Novembro 2024

