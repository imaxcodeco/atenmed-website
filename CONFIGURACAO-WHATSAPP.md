# 📱 Guia Completo: Configuração do WhatsApp Business API

## 🎯 Visão Geral

Este guia mostra **passo a passo** como configurar o WhatsApp Business API para funcionar com o AtenMed.

---

## 📋 O Que Você Vai Precisar

1. **Conta no Meta for Developers** (Facebook)
2. **Número de telefone** (não pode estar registrado no WhatsApp pessoal)
3. **Página do Facebook** (será vinculada ao WhatsApp Business)
4. **Cartão de crédito** (para verificação, mas tem crédito grátis inicial)

**⏱️ Tempo estimado:** 30-45 minutos

---

## 🚀 Passo 1: Criar Conta Meta for Developers

1. Acesse: https://developers.facebook.com/
2. Clique em **"Get Started"** ou **"Começar"**
3. Faça login com sua conta Facebook
4. Aceite os termos e complete seu perfil

**✅ Pronto!** Você agora tem acesso ao Meta for Developers

---

## 📱 Passo 2: Criar um App no Facebook

1. No dashboard, clique em **"My Apps"** → **"Create App"**
2. Escolha o tipo: **"Business"**
3. Preencha:
   - **App Name:** AtenMed WhatsApp (ou o nome que preferir)
   - **App Contact Email:** seu@email.com
   - **Business Portfolio:** Crie um novo ou selecione existente
4. Clique em **"Create App"**

**✅ App criado com sucesso!**

---

## 💬 Passo 3: Adicionar WhatsApp ao App

1. No dashboard do seu app, procure **"WhatsApp"**
2. Clique em **"Set up"** ou **"Configurar"**
3. Escolha **"Embedding"** (integração própria)

### 3.1 - Criar uma WhatsApp Business Account

1. Clique em **"Create a Business Account"**
2. Preencha os dados da sua empresa:
   - Nome da empresa
   - Endereço
   - Site (opcional)
3. Aceite os termos
4. Clique em **"Continue"**

### 3.2 - Adicionar um Número de Telefone

**⚠️ IMPORTANTE:** O número NÃO pode estar cadastrado no WhatsApp pessoal!

#### Opção A: Usar Número de Teste (Recomendado para começar)
1. O Meta fornece um número de teste automaticamente
2. Você pode enviar mensagens para até 5 números cadastrados
3. **Perfeito para testar!**

#### Opção B: Adicionar Seu Número Real
1. Clique em **"Add Phone Number"**
2. Digite seu número com código do país: `+55 11 99999-9999`
3. Escolha método de verificação: **SMS** ou **Chamada**
4. Digite o código recebido
5. **✅ Número verificado!**

**Anote os seguintes dados:**
- **Phone Number ID** (aparece na tela)
- **WhatsApp Business Account ID**

---

## 🔑 Passo 4: Gerar Token de Acesso

### 4.1 - Token Temporário (24h) - Para Testar

1. Na página do WhatsApp, vá até **"API Setup"**
2. Você verá um **"Temporary Access Token"**
3. **Copie este token!** ✂️
4. ⏰ **Expira em 24 horas** - bom apenas para testes

### 4.2 - Token Permanente (Recomendado para Produção)

1. Vá em **"Tools" → "Graph API Explorer"** (menu lateral)
2. No topo, selecione seu App
3. Clique em **"User or Page"**
4. Selecione **"System User Access Token"**

#### Criar System User:

1. Vá em **"Business Settings"** (ícone de engrenagem)
2. No menu lateral: **"Users" → "System Users"**
3. Clique em **"Add"**
4. Nome: `AtenMed API User`
5. Role: **Admin**
6. Clique em **"Create System User"**

#### Gerar Token Permanente:

1. Clique no system user criado
2. Clique em **"Generate New Token"**
3. Selecione seu App
4. Marque as permissões:
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`
5. Defina expiração: **"Never"** (Nunca expira)
6. Clique em **"Generate Token"**
7. **⚠️ COPIE E GUARDE BEM!** Não será mostrado novamente

---

## ⚙️ Passo 5: Configurar no AtenMed

### 5.1 - Conectar via SSH no Servidor AWS

```bash
ssh -i "sua-chave.pem" ubuntu@seu-servidor
```

### 5.2 - Editar o Arquivo .env

```bash
cd /var/www/atenmed
sudo nano .env
```

### 5.3 - Adicionar as Variáveis de Ambiente

Adicione estas linhas no arquivo `.env`:

```env
# WhatsApp Business API
WHATSAPP_PHONE_ID=123456789012345
WHATSAPP_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WHATSAPP_VERIFY_TOKEN=atenmed_webhook_2024_secure
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
```

**Onde encontrar cada valor:**

- `WHATSAPP_PHONE_ID`: Na página **"API Setup"** do WhatsApp no Meta
- `WHATSAPP_TOKEN`: O token que você gerou no Passo 4
- `WHATSAPP_VERIFY_TOKEN`: Crie uma senha única (você vai usar no webhook)
- `WHATSAPP_API_URL`: Deixe como está (versão mais recente da API)

**Salvar e sair:**
- Pressione `Ctrl + X`
- Digite `Y` para confirmar
- Pressione `Enter`

### 5.4 - Reiniciar o Servidor

```bash
pm2 restart atenmed
```

**✅ Configuração completa!**

---

## 🌐 Passo 6: Configurar Webhook

O webhook permite que o Meta envie mensagens recebidas para o seu servidor.

### 6.1 - Na interface do Meta for Developers

1. Vá em **"Configuration"** (menu lateral do WhatsApp)
2. Em **"Webhook"**, clique em **"Edit"**

3. Preencha:
   - **Callback URL:** `https://atenmed.com.br/api/whatsapp/webhook`
   - **Verify Token:** O mesmo que você colocou em `WHATSAPP_VERIFY_TOKEN`

4. Clique em **"Verify and Save"**

### 6.2 - Assinar Campos do Webhook

1. Logo abaixo, em **"Webhook fields"**
2. Marque o campo: **`messages`**
3. Clique em **"Subscribe"**

**✅ Webhook configurado!**

Agora o Meta vai enviar todas as mensagens recebidas para o seu servidor.

---

## 🧪 Passo 7: Testar a Configuração

### 7.1 - Acessar o Painel de Teste

```
https://atenmed.com.br/whatsapp-test
```

### 7.2 - Verificar Status

1. O painel vai carregar automaticamente
2. Verifique se mostra: **"✅ Conectado"**
3. Se mostrar **"❌ Desconectado"**, verifique:
   - Variáveis de ambiente no `.env`
   - Se reiniciou o servidor PM2
   - Logs do servidor: `pm2 logs atenmed`

### 7.3 - Enviar Mensagem de Teste

1. No painel, vá até **"💬 Enviar Mensagem de Teste"**
2. Digite um número de telefone (com +55): `+5511999999999`
3. Digite uma mensagem: `Olá! Este é um teste do AtenMed.`
4. Clique em **"📤 Enviar Mensagem de Teste"**

**Se estiver usando número de teste do Meta:**
- Você precisa cadastrar o número de destino primeiro
- Vá em **"API Setup"** → **"To"** → **"Manage phone numbers"**
- Adicione o número de destino
- Envie código de verificação
- Depois teste novamente

### 7.4 - Verificar Mensagem Recebida

1. A mensagem deve aparecer no WhatsApp do destinatário
2. Se funcionar: **🎉 SUCESSO!**
3. Se não funcionar: verifique os logs

---

## 📊 Como Saber se Está Funcionando?

### 1. **Painel de Teste**
- Acesse: `https://atenmed.com.br/whatsapp-test`
- Status deve mostrar **"✅ Conectado"**
- Clientes ativos devem aparecer na lista

### 2. **Logs do Servidor**
```bash
ssh -i "sua-chave.pem" ubuntu@seu-servidor
pm2 logs atenmed
```

Você deve ver mensagens como:
```
✅ WhatsApp Service inicializado
📱 Webhook verificado com sucesso
📤 Mensagem enviada para +5511999999999
📥 Mensagem recebida de +5511999999999
```

### 3. **Teste Real**
1. Adicione um cliente no dashboard com WhatsApp ativo
2. Envie uma mensagem do seu celular para o número do WhatsApp Business
3. Verifique se o bot responde automaticamente

---

## 🔍 Solução de Problemas

### ❌ "Webhook verification failed"

**Problema:** O Meta não consegue verificar seu webhook

**Solução:**
1. Certifique-se que o `WHATSAPP_VERIFY_TOKEN` no `.env` está correto
2. Verifique se o servidor está rodando: `pm2 status`
3. Teste se a rota está acessível: `curl https://atenmed.com.br/api/whatsapp/webhook`
4. Verifique firewall/segurança do AWS

### ❌ "Invalid Phone Number"

**Problema:** Número de telefone em formato errado

**Solução:**
- Use formato internacional: `+5511999999999` (sem espaços, traços ou parênteses)
- Apenas números depois do `+`
- Inclua o código do país (+55 para Brasil)

### ❌ "Unsupported post request"

**Problema:** Token de acesso inválido ou expirado

**Solução:**
1. Gere um novo token permanente (Passo 4.2)
2. Atualize o `WHATSAPP_TOKEN` no `.env`
3. Reinicie o servidor: `pm2 restart atenmed`

### ❌ "Connection refused" ou "Timeout"

**Problema:** Problema de rede ou firewall

**Solução:**
1. Verifique se o servidor está acessível publicamente
2. Verifique configuração do Security Group no AWS:
   - Porta 443 (HTTPS) deve estar aberta
   - Permitir tráfego de IPs do Meta
3. Verifique se o Nginx está rodando: `sudo systemctl status nginx`

### ❌ "Rate limit exceeded"

**Problema:** Muitas mensagens enviadas em pouco tempo

**Solução:**
- Com número de teste: máximo 250 mensagens/dia
- Com número verificado: até 1.000 mensagens/dia (inicial)
- Solicite aumento de limite no Meta for Developers

---

## 💰 Custos

### **Número de Teste (Grátis)**
- ✅ Completamente gratuito
- ✅ 250 conversas/mês
- ✅ Perfeito para desenvolvimento
- ❌ Só envia para 5 números cadastrados

### **Número Verificado**
- 💵 **Conversas de entrada:** GRÁTIS
- 💵 **Conversas de saída:** A partir de $0.01 USD por conversa
- 🎁 Meta oferece créditos iniciais grátis
- 📈 Preço varia por país

**Uma "conversa" = janela de 24h com o usuário**

---

## 📚 Recursos Adicionais

### **Documentação Oficial:**
- WhatsApp Business API: https://developers.facebook.com/docs/whatsapp
- Graph API Reference: https://developers.facebook.com/docs/graph-api

### **Ferramentas Úteis:**
- Graph API Explorer: https://developers.facebook.com/tools/explorer
- Webhook Tester: https://webhook.site (para testar webhooks)

### **Suporte:**
- Community Forum: https://developers.facebook.com/community
- Business Help Center: https://business.facebook.com/help

---

## ✅ Checklist de Configuração

Use esta lista para garantir que tudo está configurado:

- [ ] Conta criada no Meta for Developers
- [ ] App criado no Facebook
- [ ] WhatsApp Business Account criada
- [ ] Número de telefone adicionado e verificado
- [ ] Token de acesso gerado (temporário ou permanente)
- [ ] Phone Number ID anotado
- [ ] Variáveis de ambiente configuradas no `.env`
- [ ] Servidor reiniciado com `pm2 restart atenmed`
- [ ] Webhook configurado e verificado
- [ ] Campos do webhook assinados (`messages`)
- [ ] Teste de mensagem realizado com sucesso
- [ ] Painel de teste mostra status "✅ Conectado"

---

## 🎉 Próximos Passos

Agora que o WhatsApp está configurado:

1. **Adicione Clientes**
   - Vá em `https://atenmed.com.br/dashboard`
   - Aba "Clientes"
   - Cadastre clientes com aplicações WhatsApp

2. **Personalize Mensagens**
   - Edite `services/whatsappService.js`
   - Customize as mensagens de boas-vindas
   - Ajuste o fluxo de conversação

3. **Configure Horários**
   - No modelo `Client.js`
   - Configure horários de atendimento
   - Mensagens fora do horário

4. **Monitore Atividade**
   - Acesse `https://atenmed.com.br/whatsapp-test`
   - Veja mensagens em tempo real
   - Acompanhe estatísticas

---

## 🆘 Precisa de Ajuda?

Se encontrar problemas:

1. **Verifique os logs:** `pm2 logs atenmed --lines 50`
2. **Teste a API diretamente:** Use Graph API Explorer
3. **Consulte a documentação:** Links acima
4. **Verifique o painel de teste:** `https://atenmed.com.br/whatsapp-test`

---

**Configurado com sucesso?** 🎊  
Agora você tem um sistema completo de WhatsApp integrado ao AtenMed!

**Data:** 21/10/2025  
**Versão:** 1.0.0

