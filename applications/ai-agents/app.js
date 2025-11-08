// Configuração
const API_BASE = '/api/agents';
let currentView = 'dashboard';
let currentAgent = null;
let authToken = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticação
    authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    // Tentar obter token do localStorage do AtenMed
    if (!authToken) {
        try {
            const atenmedAuth = localStorage.getItem('atenmed_auth');
            if (atenmedAuth) {
                const authData = JSON.parse(atenmedAuth);
                authToken = authData.token;
                // Salvar também no formato esperado
                localStorage.setItem('authToken', authToken);
            }
        } catch (e) {
            console.error('Erro ao ler autenticação:', e);
        }
    }
    
    if (!authToken) {
        // Salvar URL atual para retornar após login
        const currentUrl = window.location.pathname + window.location.search;
        sessionStorage.setItem('returnUrl', currentUrl);
        // Redirecionar para login com parâmetro de retorno
        window.location.href = `/login?returnUrl=${encodeURIComponent(currentUrl)}`;
        return;
    }
    
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupEventListeners();
    loadDashboard();
    loadTemplates();
    loadWhiteLabel();
}

// Navegação
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;
            switchView(view);
        });
    });
}

function switchView(viewName) {
    // Atualizar navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === viewName) {
            item.classList.add('active');
        }
    });
    
    // Atualizar views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
        targetView.classList.add('active');
        currentView = viewName;
        
        // Carregar dados da view
        switch(viewName) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'agents':
                loadAgents();
                break;
            case 'templates':
                loadTemplates();
                break;
            case 'conversations':
                loadConversations();
                setupConversationFilters();
                break;
            case 'analytics':
                loadAnalytics();
                break;
        }
    }
}

// Event Listeners
function setupEventListeners() {
    // Botão novo agente
    document.querySelectorAll('.btn-new-agent').forEach(btn => {
        btn.addEventListener('click', () => openAgentEditor());
    });
    
    // Busca de agentes
    const searchInput = document.getElementById('search-agents');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
}

// Dashboard
async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            updateDashboardStats(data.agents || []);
            updateRecentAgents(data.agents || []);
        }
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

function updateDashboardStats(agents) {
    const activeAgents = agents.filter(a => a.active && a.status === 'active').length;
    document.getElementById('total-agents').textContent = activeAgents;
    
    // TODO: Carregar outras estatísticas da API
    document.getElementById('total-conversations').textContent = '0';
    document.getElementById('total-leads').textContent = '0';
    document.getElementById('satisfaction-rate').textContent = '0%';
}

function updateRecentAgents(agents) {
    const container = document.getElementById('recent-agents');
    if (!container) return;
    
    const recent = agents.slice(0, 5);
    
    if (recent.length === 0) {
        container.innerHTML = '<p class="text-gray-500">Nenhum agente criado ainda</p>';
        return;
    }
    
    container.innerHTML = recent.map(agent => `
        <div class="agent-item" onclick="openAgentEditor('${agent._id}')">
            <div>
                <h4>${agent.name}</h4>
                <p class="text-sm text-gray-600">${agent.description || 'Sem descrição'}</p>
            </div>
            <span class="agent-status ${agent.status}">${agent.status}</span>
        </div>
    `).join('');
}

// Agentes
async function loadAgents() {
    try {
        const response = await fetch(`${API_BASE}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            renderAgents(data.agents || []);
        }
    } catch (error) {
        console.error('Erro ao carregar agentes:', error);
    }
}

function renderAgents(agents) {
    const container = document.getElementById('agents-grid');
    if (!container) return;
    
    if (agents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-robot" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                <h3>Nenhum agente criado</h3>
                <p>Crie seu primeiro agente de IA para começar</p>
                <button class="btn-primary btn-new-agent" style="margin-top: 1rem;">
                    <i class="fas fa-plus"></i> Criar Agente
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = agents.map(agent => `
        <div class="agent-card" onclick="openAgentEditor('${agent._id}')">
            <div class="agent-card-header">
                <h3>${agent.name}</h3>
                <p>${agent.description || 'Sem descrição'}</p>
            </div>
            <div class="agent-card-body">
                <div class="agent-info">
                    <span><i class="fas fa-layer-group"></i> ${agent.template}</span>
                    <span><i class="fas fa-comments"></i> ${agent.stats?.totalConversations || 0} conversas</span>
                </div>
            </div>
            <div class="agent-card-footer">
                <span class="agent-status ${agent.status}">
                    <i class="fas fa-circle"></i> ${agent.status}
                </span>
                <div class="agent-actions">
                    ${agent.channels?.whatsapp?.enabled ? `
                        <button class="btn-icon" onclick="event.stopPropagation(); connectWhatsApp('${agent._id}')" title="Conectar WhatsApp">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                    ` : ''}
                    <button class="btn-icon" onclick="event.stopPropagation(); toggleAgent('${agent._id}', ${agent.active})">
                        <i class="fas fa-${agent.active ? 'pause' : 'play'}"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Templates
async function loadTemplates() {
    try {
        const response = await fetch(`${API_BASE}/templates/list`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            renderTemplates(data.templates || []);
        }
    } catch (error) {
        console.error('Erro ao carregar templates:', error);
    }
}

function renderTemplates(templates) {
    const container = document.getElementById('templates-grid');
    if (!container) return;
    
    const templateIcons = {
        suporte: 'headset',
        vendas: 'handshake',
        agendamento: 'calendar',
        qualificacao: 'user-check',
        personalizado: 'sliders-h'
    };
    
    container.innerHTML = templates.map(template => `
        <div class="template-card" onclick="createAgentFromTemplate('${template.id}')">
            <div class="template-icon">
                <i class="fas fa-${templateIcons[template.id] || 'robot'}"></i>
            </div>
            <h3>${template.name}</h3>
            <p>${template.description}</p>
            <button class="btn-primary" style="width: 100%;">
                Usar Template
            </button>
        </div>
    `).join('');
}

// Editor de Agente
async function openAgentEditor(agentId = null) {
    const modal = document.getElementById('agent-editor-modal');
    const title = document.getElementById('modal-title');
    const content = document.getElementById('agent-editor-content');
    
    if (agentId) {
        // Carregar agente existente
        try {
            const response = await fetch(`${API_BASE}/${agentId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                currentAgent = data.agent;
                title.textContent = `Editar: ${data.agent.name}`;
                renderAgentEditor(data.agent);
            }
        } catch (error) {
            console.error('Erro ao carregar agente:', error);
        }
    } else {
        // Novo agente
        currentAgent = null;
        title.textContent = 'Novo Agente';
        renderAgentEditor();
    }
    
    modal.classList.add('active');
}

function renderAgentEditor(agent = null) {
    const content = document.getElementById('agent-editor-content');
    const testBtn = document.getElementById('test-agent-btn');
    
    // Mostrar/ocultar botão de teste
    if (testBtn) {
        testBtn.style.display = agent?._id ? 'inline-block' : 'none';
    }
    
    // Resetar knowledge items
    window.currentKnowledgeItems = agent?.knowledgeBase?.documents || [];
    
    content.innerHTML = `
        <form id="agent-form">
            <div class="form-group">
                <label class="form-label">Nome do Agente</label>
                <input type="text" class="form-input" name="name" value="${agent?.name || ''}" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Descrição</label>
                <textarea class="form-textarea" name="description">${agent?.description || ''}</textarea>
            </div>
            
            <div class="form-group">
                <label class="form-label">Template</label>
                <select class="form-select" name="template">
                    <option value="personalizado" ${agent?.template === 'personalizado' ? 'selected' : ''}>Personalizado</option>
                    <option value="suporte" ${agent?.template === 'suporte' ? 'selected' : ''}>Suporte</option>
                    <option value="vendas" ${agent?.template === 'vendas' ? 'selected' : ''}>Vendas</option>
                    <option value="agendamento" ${agent?.template === 'agendamento' ? 'selected' : ''}>Agendamento</option>
                    <option value="qualificacao" ${agent?.template === 'qualificacao' ? 'selected' : ''}>Qualificação</option>
                </select>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Nome da Personalidade</label>
                    <input type="text" class="form-input" name="personality.name" value="${agent?.personality?.name || 'Assistente'}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Tom</label>
                    <select class="form-select" name="personality.tone">
                        <option value="formal" ${agent?.personality?.tone === 'formal' ? 'selected' : ''}>Formal</option>
                        <option value="casual" ${agent?.personality?.tone === 'casual' ? 'selected' : ''}>Casual</option>
                        <option value="amigavel" ${agent?.personality?.tone === 'amigavel' ? 'selected' : ''}>Amigável</option>
                        <option value="profissional" ${agent?.personality?.tone === 'profissional' ? 'selected' : ''}>Profissional</option>
                        <option value="empatico" ${agent?.personality?.tone === 'empatico' ? 'selected' : ''}>Empático</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">O que você quer que o agente faça?</label>
                <textarea class="form-textarea" id="agent-description-input" rows="3" placeholder="Ex: Quero um agente que atenda clientes de uma clínica médica, seja simpático e ajude com agendamentos...">${agent?.description || ''}</textarea>
                <small class="form-help">Descreva de forma simples o que o agente deve fazer</small>
                <button type="button" class="btn-secondary" onclick="generatePromptWithAI()" id="generate-prompt-btn" style="margin-top: 0.5rem;">
                    <i class="fas fa-magic"></i> Gerar Prompt com IA
                </button>
            </div>
            
            <div class="form-group" id="generated-prompt-group" style="${agent?.aiConfig?.systemPrompt ? '' : 'display: none;'}">
                <label class="form-label">Prompt do Sistema (Gerado pela IA)</label>
                <textarea class="form-textarea" name="aiConfig.systemPrompt" id="system-prompt-textarea" rows="8">${agent?.aiConfig?.systemPrompt || ''}</textarea>
                <small class="form-help">Você pode editar o prompt gerado se necessário</small>
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" name="channels.whatsapp.enabled" ${agent?.channels?.whatsapp?.enabled ? 'checked' : ''}>
                    Habilitar WhatsApp
                </label>
                <small class="form-help">Conecte via QR Code após salvar o agente</small>
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" name="channels.website.enabled" ${agent?.channels?.website?.enabled ? 'checked' : ''}>
                    Habilitar Widget no Site
                </label>
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" name="channels.instagram.enabled" ${agent?.channels?.instagram?.enabled ? 'checked' : ''}>
                    Habilitar Instagram
                </label>
                <small class="form-help">Configure após salvar o agente</small>
            </div>
            
            <div class="form-group">
                <h3 style="margin-top: 2rem; margin-bottom: 1rem;">Knowledge Base</h3>
                <div id="knowledge-base-list">
                    ${agent?.knowledgeBase?.documents?.map((doc, idx) => `
                        <div class="knowledge-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: 0.5rem; margin-bottom: 0.5rem;">
                            <div>
                                <strong>${doc.title}</strong>
                                <small style="display: block; color: var(--gray-600);">${doc.type}</small>
                            </div>
                            <button type="button" class="btn-secondary" onclick="removeKnowledgeItem(${idx})" style="padding: 0.25rem 0.5rem;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `).join('') || ''}
                </div>
                <button type="button" class="btn-secondary" onclick="addKnowledgeItem()" style="margin-top: 0.5rem;">
                    <i class="fas fa-plus"></i> Adicionar Documento
                </button>
                <button type="button" class="btn-secondary" onclick="addKnowledgeURL()" style="margin-top: 0.5rem; margin-left: 0.5rem;">
                    <i class="fas fa-link"></i> Adicionar URL
                </button>
            </div>
        </form>
    `;
    
    // Armazenar knowledge base items
    window.currentKnowledgeItems = agent?.knowledgeBase?.documents || [];
}

// Gerar prompt com IA
async function generatePromptWithAI() {
    const descriptionInput = document.getElementById('agent-description-input');
    const promptTextarea = document.getElementById('system-prompt-textarea');
    const promptGroup = document.getElementById('generated-prompt-group');
    const generateBtn = document.getElementById('generate-prompt-btn');
    
    const description = descriptionInput?.value?.trim();
    
    if (!description) {
        alert('Por favor, descreva o que você quer que o agente faça antes de gerar o prompt.');
        descriptionInput?.focus();
        return;
    }
    
    // Desabilitar botão e mostrar loading
    if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
    }
    
    try {
        // Obter dados do formulário
        const form = document.getElementById('agent-form');
        const formData = new FormData(form);
        
        const response = await fetch(`${API_BASE}/generate-prompt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                description: description,
                agentName: formData.get('name') || '',
                personality: {
                    name: formData.get('personality.name') || 'Assistente',
                    tone: formData.get('personality.tone') || 'profissional'
                },
                template: formData.get('template') || 'personalizado'
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.prompt) {
            // Preencher o textarea com o prompt gerado
            if (promptTextarea) {
                promptTextarea.value = data.prompt;
            }
            
            // Mostrar o grupo do prompt gerado
            if (promptGroup) {
                promptGroup.style.display = 'block';
                promptGroup.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            
            // Mostrar mensagem de sucesso
            showNotification('✅ Prompt gerado com sucesso! Você pode editá-lo se necessário.', 'success');
        } else {
            throw new Error(data.error || 'Erro ao gerar prompt');
        }
        
    } catch (error) {
        console.error('Erro ao gerar prompt:', error);
        showNotification('❌ Erro ao gerar prompt: ' + (error.message || 'Erro desconhecido'), 'error');
    } finally {
        // Reabilitar botão
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fas fa-magic"></i> Gerar Prompt com IA';
        }
    }
}

// Função auxiliar para mostrar notificações
function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Remover após 5 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Adicionar animações CSS via JavaScript se não existirem
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

function addKnowledgeItem() {
    const title = prompt('Título do documento:');
    if (!title) return;
    
    const content = prompt('Conteúdo:');
    if (!content) return;
    
    if (!window.currentKnowledgeItems) {
        window.currentKnowledgeItems = [];
    }
    
    window.currentKnowledgeItems.push({
        title,
        content,
        type: 'documento'
    });
    
    updateKnowledgeBaseList();
}

function addKnowledgeURL() {
    const url = prompt('URL para fazer crawl:');
    if (!url) return;
    
    if (!window.currentKnowledgeItems) {
        window.currentKnowledgeItems = [];
    }
    
    window.currentKnowledgeItems.push({
        title: url,
        url: url,
        type: 'documento',
        pending: true
    });
    
    updateKnowledgeBaseList();
}

function removeKnowledgeItem(index) {
    if (window.currentKnowledgeItems) {
        window.currentKnowledgeItems.splice(index, 1);
        updateKnowledgeBaseList();
    }
}

function updateKnowledgeBaseList() {
    const container = document.getElementById('knowledge-base-list');
    if (!container) return;
    
    container.innerHTML = (window.currentKnowledgeItems || []).map((doc, idx) => `
        <div class="knowledge-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--gray-50); border-radius: 0.5rem; margin-bottom: 0.5rem;">
            <div>
                <strong>${doc.title}</strong>
                <small style="display: block; color: var(--gray-600);">${doc.type} ${doc.pending ? '(pendente)' : ''}</small>
            </div>
            <button type="button" class="btn-secondary" onclick="removeKnowledgeItem(${idx})" style="padding: 0.25rem 0.5rem;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

window.addKnowledgeItem = addKnowledgeItem;
window.addKnowledgeURL = addKnowledgeURL;
window.removeKnowledgeItem = removeKnowledgeItem;

function closeAgentEditor() {
    const modal = document.getElementById('agent-editor-modal');
    modal.classList.remove('active');
    currentAgent = null;
}

async function saveAgent() {
    const form = document.getElementById('agent-form');
    const formData = new FormData(form);
    
    // Obter prompt do textarea (pode ter sido gerado pela IA)
    const promptTextarea = document.getElementById('system-prompt-textarea');
    const systemPrompt = promptTextarea?.value || formData.get('aiConfig.systemPrompt') || '';
    
    // Obter descrição do campo de descrição
    const descriptionInput = document.getElementById('agent-description-input');
    const description = descriptionInput?.value || formData.get('description') || '';
    
    const agentData = {
        name: formData.get('name'),
        description: description,
        template: formData.get('template'),
        personality: {
            name: formData.get('personality.name'),
            tone: formData.get('personality.tone')
        },
        aiConfig: {
            systemPrompt: systemPrompt
        },
        channels: {
            whatsapp: {
                enabled: formData.get('channels.whatsapp.enabled') === 'on'
            },
            website: {
                enabled: formData.get('channels.website.enabled') === 'on'
            },
            instagram: {
                enabled: formData.get('channels.instagram.enabled') === 'on'
            }
        },
        knowledgeBase: {
            enabled: true,
            documents: window.currentKnowledgeItems || []
        }
    };
    
    try {
        const url = currentAgent 
            ? `${API_BASE}/${currentAgent._id}`
            : API_BASE;
        
        const method = currentAgent ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(agentData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeAgentEditor();
            loadAgents();
            if (currentView === 'dashboard') {
                loadDashboard();
            }
            alert('Agente salvo com sucesso!');
        } else {
            alert('Erro ao salvar agente: ' + (data.error || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao salvar agente:', error);
        alert('Erro ao salvar agente');
    }
}

function createAgentFromTemplate(templateId) {
    // Criar agente com template
    openAgentEditor();
    // TODO: Preencher formulário com dados do template
}

async function toggleAgent(agentId, currentStatus) {
    const endpoint = currentStatus ? 'pause' : 'activate';
    
    try {
        const response = await fetch(`${API_BASE}/${agentId}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadAgents();
        }
    } catch (error) {
        console.error('Erro ao alterar status:', error);
    }
}

// Conversas
let currentConversationPage = 1;
let currentConversationFilters = {};

async function loadConversations() {
    try {
        const params = new URLSearchParams({
            page: currentConversationPage,
            limit: 20,
            ...currentConversationFilters
        });
        
        const response = await fetch(`/api/conversations?${params}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            renderConversations(data.conversations || []);
            renderConversationPagination(data.pagination);
            
            // Carregar agentes para filtro
            if (document.getElementById('filter-agent').options.length === 1) {
                loadAgentsForFilter();
            }
        }
    } catch (error) {
        console.error('Erro ao carregar conversas:', error);
    }
}

function renderConversations(conversations) {
    const container = document.getElementById('conversations-list');
    if (!container) return;
    
    if (conversations.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center p-4">Nenhuma conversa encontrada</p>';
        return;
    }
    
    container.innerHTML = conversations.map(conv => {
        const lastMessage = conv.messages[conv.messages.length - 1];
        const preview = lastMessage?.content?.substring(0, 50) || 'Sem mensagens';
        const timeAgo = formatTimeAgo(new Date(conv.lastMessageAt));
        
        return `
            <div class="conversation-item" onclick="openConversation('${conv._id}')" data-id="${conv._id}">
                <div class="conversation-item-header">
                    <div>
                        <div class="conversation-item-name">${conv.userName || conv.userPhone || 'Usuário'}</div>
                        <div class="conversation-item-meta">
                            <span><i class="fas fa-robot"></i> ${conv.agent?.name || 'Agente'}</span>
                            <span><i class="fas fa-${getChannelIcon(conv.channel)}"></i> ${conv.channel}</span>
                        </div>
                    </div>
                    <span class="conversation-badge ${conv.status}">${conv.status}</span>
                </div>
                <div class="conversation-item-preview">${preview}...</div>
                <div class="conversation-item-meta" style="margin-top: 0.5rem;">
                    <span>${timeAgo}</span>
                    ${conv.leadGenerated ? '<span class="conversation-badge">Lead</span>' : ''}
                    ${conv.important ? '<span class="conversation-badge" style="background: #fef3c7; color: #92400e;">⭐ Importante</span>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

function renderConversationPagination(pagination) {
    const container = document.getElementById('conversations-pagination');
    if (!container || !pagination) return;
    
    container.innerHTML = `
        <div class="pagination-info">
            Mostrando ${(pagination.page - 1) * pagination.limit + 1} - ${Math.min(pagination.page * pagination.limit, pagination.total)} de ${pagination.total}
        </div>
        <div class="pagination-buttons">
            <button class="pagination-btn" onclick="changeConversationPage(${pagination.page - 1})" ${pagination.page === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i> Anterior
            </button>
            <button class="pagination-btn" onclick="changeConversationPage(${pagination.page + 1})" ${pagination.page >= pagination.pages ? 'disabled' : ''}>
                Próxima <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    `;
}

async function openConversation(conversationId) {
    try {
        // Marcar como ativa
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-id="${conversationId}"]`)?.classList.add('active');
        
        // Carregar detalhes
        const response = await fetch(`/api/conversations/${conversationId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            renderConversationDetail(data.conversation);
        }
    } catch (error) {
        console.error('Erro ao abrir conversa:', error);
    }
}

function renderConversationDetail(conversation) {
    const container = document.getElementById('conversation-detail');
    if (!container) return;
    
    container.innerHTML = `
        <div class="conversation-detail-header">
            <div class="conversation-detail-info">
                <h3>${conversation.userName || conversation.userPhone || 'Usuário'}</h3>
                <div class="conversation-detail-meta">
                    <span><i class="fas fa-robot"></i> ${conversation.agent?.name || 'Agente'}</span>
                    <span><i class="fas fa-${getChannelIcon(conversation.channel)}"></i> ${conversation.channel}</span>
                    <span><i class="fas fa-clock"></i> ${formatTimeAgo(new Date(conversation.lastMessageAt))}</span>
                    ${conversation.leadGenerated ? '<span><i class="fas fa-user-plus"></i> Lead gerado</span>' : ''}
                </div>
            </div>
            <div class="conversation-detail-actions">
                <button class="btn-secondary" onclick="handOffConversation('${conversation._id}')" title="Transferir para humano">
                    <i class="fas fa-user"></i>
                </button>
                <button class="btn-secondary" onclick="addNoteToConversation('${conversation._id}')" title="Adicionar anotação">
                    <i class="fas fa-sticky-note"></i>
                </button>
                <button class="btn-secondary" onclick="exportConversation('${conversation._id}')" title="Exportar">
                    <i class="fas fa-download"></i>
                </button>
                ${conversation.status !== 'archived' ? `
                    <button class="btn-secondary" onclick="archiveConversation('${conversation._id}')" title="Arquivar">
                        <i class="fas fa-archive"></i>
                    </button>
                ` : ''}
            </div>
        </div>
        <div class="conversation-messages">
            ${conversation.messages.map(msg => `
                <div class="conversation-message ${msg.role}">
                    <div>
                        <div class="conversation-message-content">${escapeHtml(msg.content)}</div>
                        <div class="conversation-message-time">${formatTime(new Date(msg.timestamp))}</div>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="conversation-detail-footer">
            <input type="text" class="form-input" placeholder="Adicionar anotação..." id="conversation-note-input">
            <button class="btn-primary" onclick="saveConversationNote('${conversation._id}')">
                <i class="fas fa-plus"></i> Anotação
            </button>
        </div>
    `;
    
    // Scroll para última mensagem
    const messagesContainer = container.querySelector('.conversation-messages');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function changeConversationPage(page) {
    currentConversationPage = page;
    loadConversations();
}

function setupConversationFilters() {
    const statusFilter = document.getElementById('filter-status');
    const agentFilter = document.getElementById('filter-agent');
    const channelFilter = document.getElementById('filter-channel');
    const searchInput = document.getElementById('search-conversations');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            currentConversationFilters.status = e.target.value || undefined;
            currentConversationPage = 1;
            loadConversations();
        });
    }
    
    if (agentFilter) {
        agentFilter.addEventListener('change', (e) => {
            currentConversationFilters.agentId = e.target.value || undefined;
            currentConversationPage = 1;
            loadConversations();
        });
    }
    
    if (channelFilter) {
        channelFilter.addEventListener('change', (e) => {
            currentConversationFilters.channel = e.target.value || undefined;
            currentConversationPage = 1;
            loadConversations();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            currentConversationFilters.search = e.target.value || undefined;
            currentConversationPage = 1;
            loadConversations();
        }, 500));
    }
}

async function loadAgentsForFilter() {
    try {
        const response = await fetch('/api/agents', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.agents) {
            const select = document.getElementById('filter-agent');
            data.agents.forEach(agent => {
                const option = document.createElement('option');
                option.value = agent._id;
                option.textContent = agent.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar agentes para filtro:', error);
    }
}

async function handOffConversation(conversationId) {
    if (!confirm('Transferir esta conversa para atendimento humano?')) return;
    
    try {
        const response = await fetch(`/api/conversations/${conversationId}/handoff`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                message: 'Conversa transferida para atendimento humano'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Conversa transferida com sucesso!');
            openConversation(conversationId);
        }
    } catch (error) {
        console.error('Erro ao transferir conversa:', error);
        alert('Erro ao transferir conversa');
    }
}

async function archiveConversation(conversationId) {
    if (!confirm('Arquivar esta conversa?')) return;
    
    try {
        const response = await fetch(`/api/conversations/${conversationId}/archive`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadConversations();
        }
    } catch (error) {
        console.error('Erro ao arquivar conversa:', error);
    }
}

async function exportConversation(conversationId) {
    try {
        const response = await fetch(`/api/conversations/${conversationId}/export?format=json`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversa-${conversationId}.json`;
        a.click();
    } catch (error) {
        console.error('Erro ao exportar conversa:', error);
    }
}

async function saveConversationNote(conversationId) {
    const input = document.getElementById('conversation-note-input');
    const note = input?.value.trim();
    
    if (!note) return;
    
    try {
        const response = await fetch(`/api/conversations/${conversationId}/notes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ note })
        });
        
        const data = await response.json();
        
        if (data.success) {
            input.value = '';
            openConversation(conversationId);
        }
    } catch (error) {
        console.error('Erro ao adicionar anotação:', error);
    }
}

function getChannelIcon(channel) {
    const icons = {
        website: 'globe',
        whatsapp: 'whatsapp',
        instagram: 'instagram',
        email: 'envelope',
        other: 'comment'
    };
    return icons[channel] || 'comment';
}

function formatTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return date.toLocaleDateString('pt-BR');
}

function formatTime(date) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Analytics
/* global Chart */
let analyticsCharts = {};

async function loadAnalytics() {
    try {
        const period = document.getElementById('analytics-period')?.value || 30;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));
        
        const params = new URLSearchParams({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });
        
        // Carregar todas as métricas
        const [metricsRes, dailyRes, agentsRes, channelsRes, trendsRes, hourlyRes, satisfactionRes, intentsRes, responseTimeRes] = await Promise.all([
            fetch(`/api/analytics/metrics?${params}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }),
            fetch(`/api/analytics/daily?${params}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }),
            fetch(`/api/analytics/agents?${params}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }),
            fetch(`/api/analytics/channels?${params}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }),
            fetch(`/api/analytics/trends?days=${period}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }),
            fetch(`/api/analytics/hourly?${params}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }),
            fetch(`/api/analytics/satisfaction?${params}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }),
            fetch(`/api/analytics/intents?${params}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            }),
            fetch(`/api/analytics/response-time?${params}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            })
        ]);
        
        const metrics = await metricsRes.json();
        const daily = await dailyRes.json();
        const agents = await agentsRes.json();
        const channels = await channelsRes.json();
        const trends = await trendsRes.json();
        const hourly = await hourlyRes.json();
        const satisfaction = await satisfactionRes.json();
        const intents = await intentsRes.json();
        const responseTime = await responseTimeRes.json();
        
        if (metrics.success) {
            renderAnalytics(
                metrics.metrics, 
                daily.data, 
                agents.agents, 
                channels.channels, 
                trends.trends,
                hourly.data,
                satisfaction.metrics,
                intents.intents,
                responseTime.metrics
            );
        }
    } catch (error) {
        console.error('Erro ao carregar analytics:', error);
    }
}

function renderAnalytics(metrics, dailyData, agents, channels, trends, hourlyData, satisfactionMetrics, intents, responseTimeMetrics) {
    const container = document.querySelector('#analytics-view .analytics-content');
    if (!container) return;
    
    container.innerHTML = `
        <div class="analytics-stats-grid">
            <div class="stat-card">
                <div class="stat-icon blue">
                    <i class="fas fa-comments"></i>
                </div>
                <div class="stat-content">
                    <h3>${metrics.totalConversations || 0}</h3>
                    <p>Total de Conversas</p>
                    <small style="color: ${trends.conversations > 0 ? 'var(--success)' : 'var(--danger)'};">
                        ${trends.conversations > 0 ? '↑' : '↓'} ${Math.abs(trends.conversations)}%
                    </small>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green">
                    <i class="fas fa-envelope"></i>
                </div>
                <div class="stat-content">
                    <h3>${metrics.totalMessages || 0}</h3>
                    <p>Total de Mensagens</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange">
                    <i class="fas fa-user-plus"></i>
                </div>
                <div class="stat-content">
                    <h3>${metrics.leadsGenerated || 0}</h3>
                    <p>Leads Gerados</p>
                    <small>Taxa: ${metrics.conversionRate || 0}%</small>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="stat-content">
                    <h3>${metrics.avgResponseTime || 0}s</h3>
                    <p>Tempo Médio de Resposta</p>
                </div>
            </div>
        </div>
        
        <div class="analytics-charts">
            <div class="chart-card">
                <h3>Mensagens por Dia</h3>
                <canvas id="messages-chart"></canvas>
            </div>
            <div class="chart-card">
                <h3>Conversas por Canal</h3>
                <canvas id="channels-chart"></canvas>
            </div>
            <div class="chart-card">
                <h3>Performance por Agente</h3>
                <canvas id="agents-chart"></canvas>
            </div>
            <div class="chart-card">
                <h3>Taxa de Conversão</h3>
                <canvas id="conversion-chart"></canvas>
            </div>
            <div class="chart-card">
                <h3>Atividade por Hora do Dia</h3>
                <canvas id="hourly-chart"></canvas>
            </div>
            <div class="chart-card">
                <h3>Distribuição de Satisfação</h3>
                <canvas id="satisfaction-chart"></canvas>
            </div>
            <div class="chart-card">
                <h3>Top Intenções Detectadas</h3>
                <canvas id="intents-chart"></canvas>
            </div>
            <div class="chart-card">
                <h3>Tempo de Resposta</h3>
                <div id="response-time-stats" style="padding: 1rem;">
                    ${responseTimeMetrics ? `
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                            <div>
                                <strong>Média:</strong> ${responseTimeMetrics.avg}s
                            </div>
                            <div>
                                <strong>Mediana:</strong> ${responseTimeMetrics.median}s
                            </div>
                            <div>
                                <strong>Mínimo:</strong> ${responseTimeMetrics.min}s
                            </div>
                            <div>
                                <strong>Máximo:</strong> ${responseTimeMetrics.max}s
                            </div>
                            <div>
                                <strong>P95:</strong> ${responseTimeMetrics.p95}s
                            </div>
                            <div>
                                <strong>Total:</strong> ${responseTimeMetrics.total}
                            </div>
                        </div>
                    ` : '<p>Sem dados</p>'}
                </div>
            </div>
        </div>
    `;
    
    // Renderizar gráficos
    renderMessagesChart(dailyData);
    renderChannelsChart(channels);
    renderAgentsChart(agents);
    renderConversionChart(dailyData);
    if (hourlyData) renderHourlyChart(hourlyData);
    if (satisfactionMetrics) renderSatisfactionChart(satisfactionMetrics);
    if (intents) renderIntentsChart(intents);
}

function renderMessagesChart(dailyData) {
    const ctx = document.getElementById('messages-chart');
    if (!ctx) return;
    
    if (analyticsCharts.messages) {
        analyticsCharts.messages.destroy();
    }
    
    analyticsCharts.messages = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dailyData.map(d => new Date(d.date).toLocaleDateString('pt-BR')),
            datasets: [{
                label: 'Mensagens',
                data: dailyData.map(d => d.messages),
                borderColor: 'rgb(69, 167, 177)',
                backgroundColor: 'rgba(69, 167, 177, 0.1)',
                tension: 0.4
            }, {
                label: 'Conversas',
                data: dailyData.map(d => d.conversations),
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function renderChannelsChart(channels) {
    const ctx = document.getElementById('channels-chart');
    if (!ctx) return;
    
    if (analyticsCharts.channels) {
        analyticsCharts.channels.destroy();
    }
    
    analyticsCharts.channels = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: channels.map(c => c.channel),
            datasets: [{
                data: channels.map(c => c.conversations),
                backgroundColor: [
                    'rgb(69, 167, 177)',
                    'rgb(16, 185, 129)',
                    'rgb(245, 158, 11)',
                    'rgb(239, 68, 68)'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function renderAgentsChart(agents) {
    const ctx = document.getElementById('agents-chart');
    if (!ctx) return;
    
    if (analyticsCharts.agents) {
        analyticsCharts.agents.destroy();
    }
    
    analyticsCharts.agents = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: agents.map(a => a.agentName),
            datasets: [{
                label: 'Conversas',
                data: agents.map(a => a.conversations),
                backgroundColor: 'rgba(69, 167, 177, 0.8)'
            }, {
                label: 'Leads',
                data: agents.map(a => a.leads),
                backgroundColor: 'rgba(16, 185, 129, 0.8)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function renderConversionChart(dailyData) {
    const ctx = document.getElementById('conversion-chart');
    if (!ctx) return;
    
    if (analyticsCharts.conversion) {
        analyticsCharts.conversion.destroy();
    }
    
    const conversionRates = dailyData.map(d => {
        return d.conversations > 0 ? ((d.leads / d.conversations) * 100).toFixed(1) : 0;
    });
    
    analyticsCharts.conversion = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dailyData.map(d => new Date(d.date).toLocaleDateString('pt-BR')),
            datasets: [{
                label: 'Taxa de Conversão (%)',
                data: conversionRates,
                borderColor: 'rgb(245, 158, 11)',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function renderHourlyChart(hourlyData) {
    const ctx = document.getElementById('hourly-chart');
    if (!ctx) return;
    
    if (analyticsCharts.hourly) {
        analyticsCharts.hourly.destroy();
    }
    
    analyticsCharts.hourly = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hourlyData.map(d => `${d.hour}:00`),
            datasets: [{
                label: 'Conversas',
                data: hourlyData.map(d => d.conversations),
                backgroundColor: 'rgba(69, 167, 177, 0.8)'
            }, {
                label: 'Mensagens',
                data: hourlyData.map(d => d.messages),
                backgroundColor: 'rgba(16, 185, 129, 0.8)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function renderSatisfactionChart(satisfactionMetrics) {
    const ctx = document.getElementById('satisfaction-chart');
    if (!ctx) return;
    
    if (analyticsCharts.satisfaction) {
        analyticsCharts.satisfaction.destroy();
    }
    
    analyticsCharts.satisfaction = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['1 ⭐', '2 ⭐', '3 ⭐', '4 ⭐', '5 ⭐'],
            datasets: [{
                label: 'Avaliações',
                data: [
                    satisfactionMetrics.distribution[1] || 0,
                    satisfactionMetrics.distribution[2] || 0,
                    satisfactionMetrics.distribution[3] || 0,
                    satisfactionMetrics.distribution[4] || 0,
                    satisfactionMetrics.distribution[5] || 0
                ],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(251, 191, 36, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(34, 197, 94, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function renderIntentsChart(intents) {
    const ctx = document.getElementById('intents-chart');
    if (!ctx) return;
    
    if (analyticsCharts.intents) {
        analyticsCharts.intents.destroy();
    }
    
    analyticsCharts.intents = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: intents.map(i => i.intent),
            datasets: [{
                data: intents.map(i => i.count),
                backgroundColor: [
                    'rgba(69, 167, 177, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(236, 72, 153, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(251, 146, 60, 0.8)',
                    'rgba(168, 85, 247, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Utilitários
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function handleSearch(e) {
    const query = e.target.value;
    // TODO: Implementar busca
    loadAgents();
}

function refreshDashboard() {
    loadDashboard();
}

// Conectar WhatsApp via QR Code
async function connectWhatsApp(agentId) {
    try {
        // Criar modal para QR Code
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'whatsapp-qr-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Conectar WhatsApp</h2>
                    <button class="modal-close" onclick="closeWhatsAppModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div id="whatsapp-connection-status">
                        <div class="loading-spinner">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>Gerando QR Code...</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="closeWhatsAppModal()">Fechar</button>
                    <button class="btn-primary" onclick="checkWhatsAppStatus('${agentId}')">
                        <i class="fas fa-sync-alt"></i> Verificar Status
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Iniciar conexão
        const response = await fetch(`/api/whatsapp-web/connect/${agentId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (data.connected) {
                // Já está conectado
                document.getElementById('whatsapp-connection-status').innerHTML = `
                    <div class="connection-success">
                        <i class="fas fa-check-circle" style="font-size: 3rem; color: var(--success); margin-bottom: 1rem;"></i>
                        <h3>WhatsApp Conectado!</h3>
                        <p><strong>Número:</strong> ${data.phoneNumber}</p>
                        <p><strong>Nome:</strong> ${data.name || 'N/A'}</p>
                    </div>
                `;
            } else {
                // Mostrar QR Code
                document.getElementById('whatsapp-connection-status').innerHTML = `
                    <div class="qr-code-container">
                        <h3>Escaneie o QR Code com seu WhatsApp</h3>
                        <ol style="text-align: left; margin: 1rem 0;">
                            <li>Abra o WhatsApp no seu celular</li>
                            <li>Vá em Configurações > Aparelhos conectados</li>
                            <li>Toque em "Conectar um aparelho"</li>
                            <li>Escaneie este QR Code</li>
                        </ol>
                        <div class="qr-code-image">
                            <img src="${data.qrImage}" alt="QR Code WhatsApp" style="max-width: 300px; border: 2px solid var(--gray-300); border-radius: 8px;">
                        </div>
                        <p style="margin-top: 1rem; color: var(--gray-600); font-size: 0.875rem;">
                            O QR Code expira em alguns minutos. Se expirar, clique em "Verificar Status" para gerar um novo.
                        </p>
                    </div>
                `;
                
                // Iniciar polling para verificar status
                startWhatsAppStatusPolling(agentId);
            }
        } else {
            document.getElementById('whatsapp-connection-status').innerHTML = `
                <div class="connection-error">
                    <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: var(--danger); margin-bottom: 1rem;"></i>
                    <h3>Erro ao conectar</h3>
                    <p>${data.error || 'Erro desconhecido'}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao conectar WhatsApp:', error);
        alert('Erro ao conectar WhatsApp: ' + error.message);
    }
}

// Polling para verificar status
let whatsappPollingInterval = null;

function startWhatsAppStatusPolling(agentId) {
    // Limpar intervalo anterior
    if (whatsappPollingInterval) {
        clearInterval(whatsappPollingInterval);
    }
    
    // Verificar a cada 2 segundos
    whatsappPollingInterval = setInterval(async () => {
        await checkWhatsAppStatus(agentId);
    }, 2000);
}

async function checkWhatsAppStatus(agentId) {
    try {
        const response = await fetch(`/api/whatsapp-web/status/${agentId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.connected) {
            // Conectado!
            clearInterval(whatsappPollingInterval);
            whatsappPollingInterval = null;
            
            document.getElementById('whatsapp-connection-status').innerHTML = `
                <div class="connection-success">
                    <i class="fas fa-check-circle" style="font-size: 3rem; color: var(--success); margin-bottom: 1rem;"></i>
                    <h3>WhatsApp Conectado com Sucesso!</h3>
                    <p><strong>Número:</strong> ${data.phoneNumber}</p>
                    <p><strong>Nome:</strong> ${data.name || 'N/A'}</p>
                    <p style="margin-top: 1rem; color: var(--success);">
                        Seu agente já está pronto para receber mensagens!
                    </p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao verificar status:', error);
    }
}

function closeWhatsAppModal() {
    const modal = document.getElementById('whatsapp-qr-modal');
    if (modal) {
        modal.remove();
    }
    
    if (whatsappPollingInterval) {
        clearInterval(whatsappPollingInterval);
        whatsappPollingInterval = null;
    }
}

// Exportar funções globais
window.openAgentEditor = openAgentEditor;
window.closeAgentEditor = closeAgentEditor;
window.saveAgent = saveAgent;
window.toggleAgent = toggleAgent;
window.createAgentFromTemplate = createAgentFromTemplate;
window.refreshDashboard = refreshDashboard;
window.connectWhatsApp = connectWhatsApp;
window.checkWhatsAppStatus = checkWhatsAppStatus;
window.closeWhatsAppModal = closeWhatsAppModal;
window.openConversation = openConversation;
window.changeConversationPage = changeConversationPage;
window.handOffConversation = handOffConversation;
window.archiveConversation = archiveConversation;
window.exportConversation = exportConversation;
window.saveConversationNote = saveConversationNote;
window.loadAnalytics = loadAnalytics;

// Testar Agente
let testConversationHistory = [];

async function testAgent(agentId) {
    if (!agentId) {
        alert('Salve o agente primeiro para testar');
        return;
    }
    
    // Criar modal de teste
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'agent-test-modal';
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h2>Testar Agente</h2>
                <button class="modal-close" onclick="closeTestModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="test-conversation" id="test-conversation">
                    <div class="test-message test-message-bot">
                        <div class="test-message-content">
                            Olá! Sou o assistente. Como posso ajudar?
                        </div>
                    </div>
                </div>
                <div class="test-input-container">
                    <input type="text" class="form-input" id="test-message-input" placeholder="Digite uma mensagem de teste..." onkeypress="if(event.key==='Enter') sendTestMessage('${agentId}')">
                    <button class="btn-primary" onclick="sendTestMessage('${agentId}')">
                        <i class="fas fa-paper-plane"></i> Enviar
                    </button>
                    <button class="btn-secondary" onclick="clearTestConversation()">
                        <i class="fas fa-trash"></i> Limpar
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Focar no input
    setTimeout(() => {
        document.getElementById('test-message-input')?.focus();
    }, 100);
    
    // Resetar histórico
    testConversationHistory = [];
}

async function sendTestMessage(agentId) {
    const input = document.getElementById('test-message-input');
    const message = input?.value.trim();
    
    if (!message) return;
    
    // Adicionar mensagem do usuário
    addTestMessage(message, 'user');
    input.value = '';
    
    // Mostrar typing
    const typingId = showTestTyping();
    
    try {
        const response = await fetch(`/api/agents/${agentId}/test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                message,
                conversationHistory: testConversationHistory
            })
        });
        
        const data = await response.json();
        
        removeTestTyping(typingId);
        
        if (data.success) {
            // Adicionar resposta
            addTestMessage(data.response, 'bot');
            
            // Atualizar histórico
            testConversationHistory.push(
                { isUser: true, text: message },
                { isUser: false, text: data.response }
            );
        } else {
            addTestMessage('Erro ao processar mensagem', 'error');
        }
    } catch (error) {
        removeTestTyping(typingId);
        addTestMessage('Erro ao testar agente: ' + error.message, 'error');
    }
}

function addTestMessage(text, type) {
    const container = document.getElementById('test-conversation');
    if (!container) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `test-message test-message-${type}`;
    messageDiv.innerHTML = `
        <div class="test-message-content">${escapeHtml(text)}</div>
    `;
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

function showTestTyping() {
    const container = document.getElementById('test-conversation');
    if (!container) return null;
    
    const typingDiv = document.createElement('div');
    typingDiv.id = 'test-typing';
    typingDiv.className = 'test-message test-message-bot';
    typingDiv.innerHTML = `
        <div class="test-message-content">
            <span class="typing-dots">...</span>
        </div>
    `;
    container.appendChild(typingDiv);
    container.scrollTop = container.scrollHeight;
    return 'test-typing';
}

function removeTestTyping(id) {
    const typing = document.getElementById(id);
    if (typing) typing.remove();
}

function clearTestConversation() {
    const container = document.getElementById('test-conversation');
    if (container) {
        container.innerHTML = `
            <div class="test-message test-message-bot">
                <div class="test-message-content">
                    Olá! Sou o assistente. Como posso ajudar?
                </div>
            </div>
        `;
    }
    testConversationHistory = [];
}

function closeTestModal() {
    const modal = document.getElementById('agent-test-modal');
    if (modal) {
        modal.remove();
    }
    testConversationHistory = [];
}

window.testAgent = testAgent;
window.sendTestMessage = sendTestMessage;
window.clearTestConversation = clearTestConversation;
window.closeTestModal = closeTestModal;

// White Label
async function saveWhiteLabelSettings() {
    const logo = document.getElementById('logo-upload')?.files[0];
    const primaryColor = document.getElementById('primary-color')?.value;
    const platformName = document.getElementById('platform-name')?.value;
    
    // Salvar no localStorage (ou enviar para API)
    localStorage.setItem('whiteLabel', JSON.stringify({
        primaryColor,
        platformName,
        logo: logo ? await fileToBase64(logo) : null
    }));
    
    // Aplicar mudanças
    if (primaryColor) {
        document.documentElement.style.setProperty('--primary', primaryColor);
    }
    
    alert('Configurações salvas!');
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Carregar white label ao iniciar
function loadWhiteLabel() {
    const saved = localStorage.getItem('whiteLabel');
    if (saved) {
        const config = JSON.parse(saved);
        if (config.primaryColor) {
            document.documentElement.style.setProperty('--primary', config.primaryColor);
        }
        if (config.platformName) {
            document.querySelector('.sidebar-header h1').textContent = config.platformName;
        }
    }
}

window.saveWhiteLabelSettings = saveWhiteLabelSettings;

