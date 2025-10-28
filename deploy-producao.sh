#!/bin/bash

###############################################################################
# SCRIPT DE DEPLOY AUTOMATIZADO - AtenMed SaaS
#
# Este script automatiza o deploy completo do sistema em produção
#
# Uso: ./deploy-producao.sh
###############################################################################

set -e # Parar em caso de erro

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

###############################################################################
# VERIFICAÇÕES PRÉ-DEPLOY
###############################################################################

log "🚀 Iniciando processo de deploy..."

# Verificar se está na pasta correta
if [ ! -f "package.json" ]; then
    error "package.json não encontrado. Execute este script na raiz do projeto!"
fi

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    error "Node.js não está instalado!"
fi

info "Node.js version: $(node -v)"

# Verificar se MongoDB está rodando
if ! command -v mongod &> /dev/null; then
    warning "MongoDB não encontrado. Certifique-se de que está instalado e rodando."
fi

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    warning "PM2 não instalado. Instalando..."
    sudo npm install -g pm2
fi

###############################################################################
# BACKUP
###############################################################################

log "📦 Criando backup..."

# Criar diretório de backup
BACKUP_DIR="backups/$(date +'%Y%m%d_%H%M%S')"
mkdir -p "$BACKUP_DIR"

# Backup do banco de dados
if command -v mongodump &> /dev/null; then
    info "Fazendo backup do MongoDB..."
    mongodump --db atenmed --out "$BACKUP_DIR/mongodb" 2>/dev/null || warning "Backup do MongoDB falhou"
fi

# Backup do .env atual
if [ -f ".env" ]; then
    cp .env "$BACKUP_DIR/.env.backup"
    info "Backup do .env criado"
fi

log "✅ Backup concluído em: $BACKUP_DIR"

###############################################################################
# ATUALIZAR CÓDIGO
###############################################################################

log "📥 Atualizando código..."

# Git pull (se estiver usando Git)
if [ -d ".git" ]; then
    git fetch origin
    git pull origin main || git pull origin master
    info "Código atualizado via Git"
else
    warning "Não é um repositório Git. Pulando atualização via Git."
fi

###############################################################################
# INSTALAR DEPENDÊNCIAS
###############################################################################

log "📦 Instalando dependências..."

npm install --production

log "✅ Dependências instaladas"

###############################################################################
# BUILD
###############################################################################

log "🔨 Fazendo build..."

# Build CSS
npm run build:css || warning "Build CSS falhou"

log "✅ Build concluído"

###############################################################################
# VERIFICAR .ENV
###############################################################################

log "🔧 Verificando variáveis de ambiente..."

if [ ! -f ".env" ]; then
    error ".env não encontrado! Copie env.example e configure antes de fazer deploy."
fi

# Verificar variáveis críticas
required_vars=(
    "NODE_ENV"
    "MONGODB_URI"
    "JWT_SECRET"
    "APP_URL"
)

for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env; then
        error "Variável $var não encontrada no .env!"
    fi
done

# Verificar se NODE_ENV está em production
if ! grep -q "^NODE_ENV=production" .env; then
    warning "NODE_ENV não está configurado para 'production'"
    read -p "Continuar mesmo assim? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

log "✅ Variáveis de ambiente OK"

###############################################################################
# CRIAR LOGS DIRECTORY
###############################################################################

log "📁 Criando diretórios necessários..."

mkdir -p logs
mkdir -p uploads
mkdir -p backups

log "✅ Diretórios criados"

###############################################################################
# DEPLOY COM PM2
###############################################################################

log "🚀 Fazendo deploy com PM2..."

# Verificar se aplicação já está rodando
if pm2 describe atenmed &> /dev/null; then
    info "Aplicação encontrada. Fazendo reload..."
    pm2 reload atenmed --update-env
else
    info "Primeira vez. Iniciando aplicação..."
    pm2 start ecosystem.config.js --env production
fi

# Salvar configuração PM2
pm2 save

# Configurar startup (se ainda não configurado)
pm2 startup | tail -n 1 | bash || warning "Já configurado para startup"

log "✅ Deploy com PM2 concluído"

###############################################################################
# CONFIGURAR CRON JOBS
###############################################################################

log "⏰ Configurando cron jobs..."

# Caminho absoluto do projeto
PROJECT_PATH=$(pwd)

# Criar arquivo temporário com cron jobs
cat > /tmp/atenmed-cron << EOF
# AtenMed - Cron Jobs

# Gerar faturas mensais (dia 1 às 00:00)
0 0 1 * * cd $PROJECT_PATH && /usr/bin/node scripts/gerar-faturas-mensais.js >> /var/log/atenmed-faturas.log 2>&1

# Verificar inadimplência (diariamente às 08:00)
0 8 * * * cd $PROJECT_PATH && /usr/bin/node scripts/verificar-inadimplencia.js >> /var/log/atenmed-inadimplencia.log 2>&1

EOF

# Adicionar ao crontab (se não existir)
if ! crontab -l 2>/dev/null | grep -q "atenmed-faturas"; then
    (crontab -l 2>/dev/null; cat /tmp/atenmed-cron) | crontab -
    info "Cron jobs adicionados"
else
    info "Cron jobs já configurados"
fi

rm /tmp/atenmed-cron

log "✅ Cron jobs configurados"

###############################################################################
# VERIFICAÇÕES PÓS-DEPLOY
###############################################################################

log "🔍 Verificando deploy..."

sleep 3

# Verificar se PM2 está rodando
if ! pm2 describe atenmed &> /dev/null; then
    error "Aplicação não está rodando no PM2!"
fi

# Verificar status
PM2_STATUS=$(pm2 describe atenmed | grep "status" | awk '{print $4}')
if [ "$PM2_STATUS" != "online" ]; then
    error "Aplicação não está online! Status: $PM2_STATUS"
fi

# Verificar porta
if lsof -Pi :3000 -sTCP:LISTEN -t &> /dev/null ; then
    info "Porta 3000 está respondendo"
else
    warning "Porta 3000 não está respondendo"
fi

log "✅ Verificações concluídas"

###############################################################################
# LIMPAR CACHE E ARQUIVOS TEMPORÁRIOS
###############################################################################

log "🧹 Limpando arquivos temporários..."

# Limpar cache npm
npm cache clean --force 2>/dev/null || true

# Limpar logs antigos (> 30 dias)
find logs/ -name "*.log" -mtime +30 -delete 2>/dev/null || true

log "✅ Limpeza concluída"

###############################################################################
# RESUMO
###############################################################################

log "═══════════════════════════════════════════════════════════"
log "   ✅ DEPLOY CONCLUÍDO COM SUCESSO!"
log "═══════════════════════════════════════════════════════════"
echo ""
info "📊 Status da Aplicação:"
pm2 describe atenmed | grep -E "status|uptime|memory|restarts"
echo ""
info "📝 Logs:"
echo "   PM2 logs: pm2 logs atenmed"
echo "   App logs: tail -f logs/combined.log"
echo ""
info "🔗 URLs:"
echo "   API: http://localhost:3000"
echo "   Health: http://localhost:3000/health"
echo "   CRM: http://localhost:3000/crm"
echo "   Portal: http://localhost:3000/portal"
echo ""
info "🛠️  Comandos úteis:"
echo "   Ver logs: pm2 logs atenmed"
echo "   Reiniciar: pm2 restart atenmed"
echo "   Status: pm2 status"
echo "   Monitor: pm2 monit"
echo ""
info "📦 Backup salvo em: $BACKUP_DIR"
echo ""
log "═══════════════════════════════════════════════════════════"

log "🎉 Sistema pronto para uso!"

# Sugestões pós-deploy
warning "⚠️  NÃO ESQUEÇA:"
echo "   1. Configurar Nginx (se ainda não fez)"
echo "   2. Configurar SSL/HTTPS com Certbot"
echo "   3. Configurar firewall (ufw)"
echo "   4. Testar todas as funcionalidades"
echo "   5. Criar primeiro usuário admin"
echo ""

log "👋 Deploy finalizado!"

