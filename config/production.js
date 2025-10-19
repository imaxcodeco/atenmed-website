// Configurações específicas para produção - atenmed.com.br
module.exports = {
    // URLs do sistema
    baseUrl: 'https://atenmed.com.br',
    
    // CORS configurado para o domínio
    cors: {
        origin: [
            'https://atenmed.com.br',
            'https://www.atenmed.com.br'
        ],
        credentials: true
    },
    
    // Configurações de segurança
    security: {
        // Headers de segurança específicos para o domínio
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: [
                    "'self'", 
                    "'unsafe-inline'", 
                    "https://fonts.googleapis.com"
                ],
                fontSrc: [
                    "'self'", 
                    "https://fonts.gstatic.com"
                ],
                imgSrc: [
                    "'self'", 
                    "data:", 
                    "https:",
                    "https://atenmed.com.br"
                ],
                scriptSrc: ["'self'"],
                connectSrc: [
                    "'self'",
                    "https://atenmed.com.br"
                ]
            }
        }
    },
    
    // Configurações de email
    email: {
        from: 'AtenMed <contato@atenmed.com.br>',
        replyTo: 'contato@atenmed.com.br'
    },
    
    // URLs das aplicações
    apps: {
        whatsapp: 'https://atenmed.com.br/whatsapp',
        costMonitoring: 'https://atenmed.com.br/cost-monitoring',
        dashboard: 'https://atenmed.com.br/dashboard'
    },
    
    // Webhooks
    webhooks: {
        whatsapp: 'https://atenmed.com.br/webhook/whatsapp'
    },
    
    // Configurações de logging
    logging: {
        level: 'info',
        file: 'logs/production.log'
    }
};
