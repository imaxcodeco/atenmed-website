╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║      🤖 AUTOMAÇÃO DE ATENDIMENTO PRONTA! ATIVAR AGORA! 🤖          ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ O QUE FOI IMPLEMENTADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Atendimento automático 24/7
✅ Menu interativo completo
✅ Agendamento de consultas
✅ Ver consultas agendadas
✅ Cancelar consultas
✅ Integração com Google Calendar
✅ Conversas naturais e humanizadas
✅ Suporte a IA conversacional (opcional)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 ATIVAR EM 3 PASSOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PASSO 1: FAZER DEPLOY
─────────────────────────────────────────────────────────────────────

# Conectar ao servidor
ssh -i "C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem" ubuntu@3.129.206.231

# Atualizar código
cd /var/www/atenmed
git pull origin reorganizacao-estrutura

# Reiniciar servidor
~/.nvm/versions/node/$(ls ~/.nvm/versions/node | tail -1)/bin/pm2 restart atenmed


PASSO 2: TESTAR
─────────────────────────────────────────────────────────────────────

# Do seu WhatsApp pessoal, envie para o número do Business:

oi

# O bot deve responder automaticamente com o menu!


PASSO 3: MONITORAR
─────────────────────────────────────────────────────────────────────

# Ver logs em tempo real
tail -f /var/www/atenmed/logs/combined.log


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 COMO FUNCIONA (EXEMPLO REAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usuário: "Oi"

Bot:
┌─────────────────────────────────────────────────────────────────┐
│ Bom dia! ☀️ Tudo bem? Aqui é da AtenMed!                       │
│                                                                 │
│ Em que posso te ajudar hoje? 😊                                │
│                                                                 │
│ 1️⃣ Quero marcar uma consulta                                   │
│ 2️⃣ Ver minhas consultas agendadas                              │
│ 3️⃣ Preciso cancelar uma consulta                               │
│ 4️⃣ Entrar na lista de espera                                   │
│ 5️⃣ Falar com alguém da equipe                                  │
│                                                                 │
│ É só digitar o número da opção!                                │
└─────────────────────────────────────────────────────────────────┘

Usuário: "1"

Bot:
┌─────────────────────────────────────────────────────────────────┐
│ Legal! Vamos agendar sua consulta! 📋                           │
│                                                                 │
│ Qual especialidade você precisa?                               │
│                                                                 │
│ 1️⃣ Cardiologia                                                 │
│ 2️⃣ Dermatologia                                                │
│ 3️⃣ Ortopedia                                                   │
│ 4️⃣ Pediatria                                                   │
│                                                                 │
│ Digite o número da especialidade!                              │
└─────────────────────────────────────────────────────────────────┘

... e continua até agendar!


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 COMANDOS QUE O USUÁRIO PODE USAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

oi, olá, menu       → Mostra menu principal
1                   → Agendar consulta
2                   → Ver consultas
3                   → Cancelar consulta
4                   → Lista de espera
5                   → Falar com humano
cancelar            → Cancela operação atual


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 O QUE ACONTECE NOS LOGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Quando alguém manda mensagem, você verá:

📬 Webhook recebido: 1 entradas
📨 Processando mensagem de 5511999999999
Processando conversa: estado=initial, mensagem=oi
✅ Mensagem enviada para 5511999999999


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚙️ CONFIGURAÇÕES OPCIONAIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Adicionar no .env do servidor (opcional):

# Informações de contato
SUPPORT_PHONE=(22) 99284-2996
SUPPORT_EMAIL=contato@atenmed.com.br

# IA Conversacional (opcional)
OPENAI_API_KEY=sk-...

# Redis para fila (opcional)
REDIS_URL=redis://localhost:6379


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 TESTAR ANTES DE ENVIAR MENSAGEM REAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# No seu computador local
npm run test-webhook-msg


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 POPULAR BANCO DE DADOS (SE NECESSÁRIO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Se não tiver especialidades e médicos cadastrados:

# No servidor
cd /var/www/atenmed
npm run init-db

# Ou popular com dados de exemplo
npm run seed-all


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🐛 SE ALGO DER ERRADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Verificar logs:
   tail -f /var/www/atenmed/logs/combined.log

2. Verificar se está rodando:
   ~/.nvm/versions/node/$(ls ~/.nvm/versions/node | tail -1)/bin/pm2 status

3. Reiniciar se necessário:
   ~/.nvm/versions/node/$(ls ~/.nvm/versions/node | tail -1)/bin/pm2 restart atenmed

4. Ver erros específicos:
   tail -f /var/www/atenmed/logs/error.log


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ ] Deploy feito (git pull + pm2 restart)
[ ] Servidor reiniciado e online
[ ] Campo "messages" habilitado no Meta
[ ] Teste de mensagem enviado
[ ] Bot respondeu com menu
[ ] Banco de dados tem especialidades e médicos
[ ] Logs sendo monitorados


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 DOCUMENTAÇÃO COMPLETA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para mais detalhes, leia:

⭐ docs/WHATSAPP-V2-SETUP.md     ← Guia completo e detalhado
   docs/WHATSAPP-BUSINESS-API-SETUP.md  ← Configuração do Meta


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 RESUMO: 3 COMANDOS E PRONTO!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ssh -i "C:\Users\Ian_1\Documents\AtenMed\site-atenmed.pem" ubuntu@3.129.206.231

cd /var/www/atenmed && git pull origin reorganizacao-estrutura

~/.nvm/versions/node/$(ls ~/.nvm/versions/node | tail -1)/bin/pm2 restart atenmed


Depois disso, envie "oi" do WhatsApp e veja a mágica acontecer! ✨


╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║         🚀 AUTOMAÇÃO COMPLETA! É SÓ ATIVAR! 🚀                      ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

