/**
 * AtenMed - AI Agent Widget
 * Widget conversacional para embed em sites
 */

(function() {
    'use strict';
    
    // Configuração
    const WIDGET_CONFIG = {
        agentId: null,
        apiBase: '/api/agents',
        position: 'bottom-right',
        primaryColor: '#45a7b1',
        welcomeMessage: 'Olá! Como posso ajudar?'
    };
    
    // Estado
    let isOpen = false;
    let conversationId = null;
    let userId = null;
    
    // Criar widget
    function createWidget(config) {
        Object.assign(WIDGET_CONFIG, config);
        
        // Criar container
        const widgetContainer = document.createElement('div');
        widgetContainer.id = 'atenmed-ai-widget';
        widgetContainer.innerHTML = `
            <div class="atenmed-widget-button" id="atenmed-widget-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="white"/>
                </svg>
            </div>
            <div class="atenmed-widget-window" id="atenmed-widget-window">
                <div class="atenmed-widget-header">
                    <div class="atenmed-widget-header-info">
                        <h3>Assistente Virtual</h3>
                        <span class="atenmed-widget-status">Online</span>
                    </div>
                    <button class="atenmed-widget-close" id="atenmed-widget-close">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                        </svg>
                    </button>
                </div>
                <div class="atenmed-widget-messages" id="atenmed-widget-messages">
                    <div class="atenmed-widget-message atenmed-widget-message-bot">
                        <div class="atenmed-widget-message-content">
                            ${WIDGET_CONFIG.welcomeMessage}
                        </div>
                    </div>
                </div>
                <div class="atenmed-widget-input-container">
                    <input type="text" 
                           class="atenmed-widget-input" 
                           id="atenmed-widget-input" 
                           placeholder="Digite sua mensagem..."
                           autocomplete="off">
                    <button class="atenmed-widget-send" id="atenmed-widget-send">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        // Adicionar estilos
        injectStyles();
        
        // Adicionar ao body
        document.body.appendChild(widgetContainer);
        
        // Event listeners
        setupEventListeners();
        
        // Gerar userId único
        userId = generateUserId();
    }
    
    // Injetar estilos
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #atenmed-ai-widget {
                position: fixed;
                ${WIDGET_CONFIG.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
                ${WIDGET_CONFIG.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
                z-index: 9999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .atenmed-widget-button {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: ${WIDGET_CONFIG.primaryColor};
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s;
            }
            
            .atenmed-widget-button:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
            }
            
            .atenmed-widget-window {
                position: absolute;
                ${WIDGET_CONFIG.position.includes('right') ? 'right: 0;' : 'left: 0;'}
                bottom: 80px;
                width: 380px;
                height: 600px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                display: none;
                flex-direction: column;
                overflow: hidden;
            }
            
            .atenmed-widget-window.open {
                display: flex;
            }
            
            .atenmed-widget-header {
                background: ${WIDGET_CONFIG.primaryColor};
                color: white;
                padding: 1rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .atenmed-widget-header-info h3 {
                margin: 0;
                font-size: 1rem;
                font-weight: 600;
            }
            
            .atenmed-widget-status {
                font-size: 0.75rem;
                opacity: 0.9;
            }
            
            .atenmed-widget-close {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                padding: 0.25rem;
                display: flex;
                align-items: center;
            }
            
            .atenmed-widget-messages {
                flex: 1;
                overflow-y: auto;
                padding: 1rem;
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            
            .atenmed-widget-message {
                display: flex;
                max-width: 80%;
            }
            
            .atenmed-widget-message-user {
                align-self: flex-end;
            }
            
            .atenmed-widget-message-bot {
                align-self: flex-start;
            }
            
            .atenmed-widget-message-content {
                padding: 0.75rem 1rem;
                border-radius: 12px;
                word-wrap: break-word;
            }
            
            .atenmed-widget-message-user .atenmed-widget-message-content {
                background: ${WIDGET_CONFIG.primaryColor};
                color: white;
            }
            
            .atenmed-widget-message-bot .atenmed-widget-message-content {
                background: #f3f4f6;
                color: #1f2937;
            }
            
            .atenmed-widget-input-container {
                padding: 1rem;
                border-top: 1px solid #e5e7eb;
                display: flex;
                gap: 0.5rem;
            }
            
            .atenmed-widget-input {
                flex: 1;
                padding: 0.75rem;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                font-size: 0.875rem;
                outline: none;
            }
            
            .atenmed-widget-input:focus {
                border-color: ${WIDGET_CONFIG.primaryColor};
            }
            
            .atenmed-widget-send {
                width: 40px;
                height: 40px;
                border-radius: 8px;
                background: ${WIDGET_CONFIG.primaryColor};
                color: white;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            
            .atenmed-widget-send:hover {
                background: ${WIDGET_CONFIG.primaryColor}dd;
            }
            
            .atenmed-widget-send:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            @media (max-width: 480px) {
                .atenmed-widget-window {
                    width: calc(100vw - 40px);
                    height: calc(100vh - 100px);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Event listeners
    function setupEventListeners() {
        const btn = document.getElementById('atenmed-widget-btn');
        const closeBtn = document.getElementById('atenmed-widget-close');
        const sendBtn = document.getElementById('atenmed-widget-send');
        const input = document.getElementById('atenmed-widget-input');
        
        btn.addEventListener('click', toggleWidget);
        closeBtn.addEventListener('click', toggleWidget);
        sendBtn.addEventListener('click', sendMessage);
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // Toggle widget
    function toggleWidget() {
        const window = document.getElementById('atenmed-widget-window');
        isOpen = !isOpen;
        window.classList.toggle('open', isOpen);
        
        if (isOpen) {
            document.getElementById('atenmed-widget-input').focus();
        }
    }
    
    // Enviar mensagem
    async function sendMessage() {
        const input = document.getElementById('atenmed-widget-input');
        const sendBtn = document.getElementById('atenmed-widget-send');
        const messagesContainer = document.getElementById('atenmed-widget-messages');
        
        const message = input.value.trim();
        if (!message || !WIDGET_CONFIG.agentId) return;
        
        // Adicionar mensagem do usuário
        addMessage(message, 'user');
        input.value = '';
        sendBtn.disabled = true;
        
        // Mostrar typing indicator
        const typingId = showTyping();
        
        try {
            const response = await fetch(`${WIDGET_CONFIG.apiBase}/${WIDGET_CONFIG.agentId}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    conversationId,
                    userId,
                    channel: 'website'
                })
            });
            
            const data = await response.json();
            
            // Remover typing indicator
            removeTyping(typingId);
            
            if (data.success) {
                // Adicionar resposta do bot
                addMessage(data.response, 'bot');
                
                if (data.conversationId) {
                    conversationId = data.conversationId;
                }
            } else {
                addMessage('Desculpe, ocorreu um erro. Tente novamente.', 'bot');
            }
        } catch (error) {
            removeTyping(typingId);
            addMessage('Desculpe, não consegui processar sua mensagem. Tente novamente.', 'bot');
        } finally {
            sendBtn.disabled = false;
            input.focus();
        }
    }
    
    // Adicionar mensagem
    function addMessage(text, type) {
        const messagesContainer = document.getElementById('atenmed-widget-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `atenmed-widget-message atenmed-widget-message-${type}`;
        messageDiv.innerHTML = `
            <div class="atenmed-widget-message-content">${escapeHtml(text)}</div>
        `;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Mostrar typing
    function showTyping() {
        const messagesContainer = document.getElementById('atenmed-widget-messages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'atenmed-typing-indicator';
        typingDiv.className = 'atenmed-widget-message atenmed-widget-message-bot';
        typingDiv.innerHTML = `
            <div class="atenmed-widget-message-content">
                <span class="typing-dots">
                    <span>.</span><span>.</span><span>.</span>
                </span>
            </div>
        `;
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return 'atenmed-typing-indicator';
    }
    
    // Remover typing
    function removeTyping(id) {
        const typing = document.getElementById(id);
        if (typing) {
            typing.remove();
        }
    }
    
    // Gerar userId único
    function generateUserId() {
        let userId = localStorage.getItem('atenmed_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('atenmed_user_id', userId);
        }
        return userId;
    }
    
    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Inicializar quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (window.AtenMedWidgetConfig) {
                createWidget(window.AtenMedWidgetConfig);
            }
        });
    } else {
        if (window.AtenMedWidgetConfig) {
            createWidget(window.AtenMedWidgetConfig);
        }
    }
    
    // API pública
    window.AtenMedAIWidget = {
        init: createWidget,
        open: () => {
            if (!isOpen) toggleWidget();
        },
        close: () => {
            if (isOpen) toggleWidget();
        }
    };
})();

