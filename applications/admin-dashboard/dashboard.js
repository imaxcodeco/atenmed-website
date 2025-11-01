// Dashboard JavaScript - AtenMed
// Funcionalidades modernas e responsivas

// Inicializar event listeners quando o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

// Configurar todos os event listeners (compatível com CSP)
function setupEventListeners() {
    // Botões de ações rápidas
    const btnNovoCliente = document.getElementById('btnNovoCliente');
    if (btnNovoCliente) {
        btnNovoCliente.addEventListener('click', () => showSection('clients'));
    }
    
    const btnAtualizarDados = document.getElementById('btnAtualizarDados');
    if (btnAtualizarDados) {
        btnAtualizarDados.addEventListener('click', refreshData);
    }
    
    const btnExportarRelatorio = document.getElementById('btnExportarRelatorio');
    if (btnExportarRelatorio) {
        btnExportarRelatorio.addEventListener('click', exportData);
    }
    
    const btnConfiguracoes = document.getElementById('btnConfiguracoes');
    if (btnConfiguracoes) {
        btnConfiguracoes.addEventListener('click', () => showSection('settings'));
    }
    
    // Botões de atualizar
    const btnAtualizarClientes = document.getElementById('btnAtualizarClientes');
    if (btnAtualizarClientes) {
        btnAtualizarClientes.addEventListener('click', loadClients);
    }
    
    const btnAtualizarLeads = document.getElementById('btnAtualizarLeads');
    if (btnAtualizarLeads) {
        btnAtualizarLeads.addEventListener('click', refreshLeads);
    }
    
    const btnAtualizarContatos = document.getElementById('btnAtualizarContatos');
    if (btnAtualizarContatos) {
        btnAtualizarContatos.addEventListener('click', refreshContacts);
    }
    
    console.log('Event listeners configurados com sucesso!');
}

// Verificar autenticação e obter token
function checkAuth() {
    const auth = localStorage.getItem('atenmed_auth');
    if (!auth) {
        window.location.href = '/site/login.html';
        return false;
    }
    
    try {
        const authData = JSON.parse(auth);
        const loginTime = new Date(authData.loginTime);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        
        if (hoursDiff >= 24) {
            localStorage.removeItem('atenmed_auth');
            window.location.href = '/site/login.html';
            return false;
        }
        
        return true;
    } catch (error) {
        localStorage.removeItem('atenmed_auth');
        window.location.href = '/site/login.html';
        return false;
    }
}

// API Base URL (definir globalmente antes dos outros scripts)
if (typeof window.API_BASE === 'undefined') {
    window.API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3000/api'
        : (window.location.hostname === 'atenmed.com.br' || window.location.hostname === 'www.atenmed.com.br')
        ? 'https://atenmed.com.br/api'
        : '/api';
}

// Obter token JWT (definir globalmente antes dos outros scripts)
window.getAuthToken = function() {
    try {
        const auth = localStorage.getItem('atenmed_auth');
        if (auth) {
            const authData = JSON.parse(auth);
            return authData.token;
        }
    } catch (error) {
        console.error('Erro ao obter token:', error);
    }
    return null;
};

// Criar headers com autenticação
function getAuthHeaders() {
    const token = window.getAuthToken();
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// Logout
function logout() {
    localStorage.removeItem('atenmed_auth');
    window.location.href = '/site/login.html';
}

// Navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section (verificar se existe antes de mostrar)
    const section = document.getElementById(sectionId);
    if (!section) {
        console.error(`Seção "${sectionId}" não encontrada no HTML`);
        return;
    }
    
    section.style.display = 'block';
    
    // Add active class to selected nav item
    const navItem = document.querySelector(`[data-section="${sectionId}"]`);
    if (navItem) {
        navItem.classList.add('active');
    }
    
    // Carregar dados quando a seção for ativada
    if (sectionId === 'clinics' && typeof loadClinics === 'function') {
        setTimeout(() => loadClinics(), 100);
    }
    if (sectionId === 'doctors' && typeof loadDoctors === 'function') {
        setTimeout(() => loadDoctors(), 100);
    }
    if (sectionId === 'specialties' && typeof loadSpecialties === 'function') {
        setTimeout(() => loadSpecialties(), 100);
    }
}

// Dados mockados para demonstração
const mockData = {
    leads: [
        { id: 1, nome: 'Dr. João Silva', email: 'joao@clinica.com', telefone: '(11) 99999-9999', especialidade: 'cardiologia', status: 'novo', createdAt: '2024-01-15T10:30:00Z' },
        { id: 2, nome: 'Dra. Maria Santos', email: 'maria@clinica.com', telefone: '(11) 88888-8888', especialidade: 'dermatologia', status: 'contatado', createdAt: '2024-01-15T09:15:00Z' },
        { id: 3, nome: 'Dr. Carlos Mendes', email: 'carlos@clinica.com', telefone: '(11) 77777-7777', especialidade: 'pediatria', status: 'qualificado', createdAt: '2024-01-14T16:45:00Z' }
    ],
    contacts: [
        { id: 1, nome: 'Ana Costa', email: 'ana@email.com', assunto: 'Dúvida sobre serviços', status: 'novo', createdAt: '2024-01-15T11:20:00Z' },
        { id: 2, nome: 'Pedro Lima', email: 'pedro@email.com', assunto: 'Orçamento para automação', status: 'respondido', createdAt: '2024-01-15T08:30:00Z' }
    ]
};

// Carregar dados do dashboard
async function loadDashboardData() {
    try {
        // Buscar leads (sem limit para evitar erro de validação)
        const leadsRes = await fetch('/api/leads');
        const leads = await leadsRes.json();
        console.log('Leads response:', leads);
        
        const totalLeads = leads.data?.pagination?.total || leads.data?.leads?.length || 0;
        
        // Buscar clientes (rota protegida)
        let totalClients = 0;
        try {
            const clientsRes = await fetch('/api/clients', {
                method: 'GET',
                headers: getAuthHeaders()
            });
            if (clientsRes.ok) {
                const clients = await clientsRes.json();
                console.log('Clients response:', clients);
                totalClients = Array.isArray(clients.data) ? clients.data.length : 0;
            }
        } catch (err) {
            console.warn('Erro ao buscar clientes:', err);
        }
        
        // Buscar contatos
        let totalContacts = 0;
        try {
            const contactsRes = await fetch('/api/contact');
            const contacts = await contactsRes.json();
            console.log('Contacts response:', contacts);
            totalContacts = contacts.data?.contatos?.length || (Array.isArray(contacts.data) ? contacts.data.length : 0);
        } catch (err) {
            console.warn('Erro ao buscar contatos:', err);
        }
        
        // Calcular taxa de conversão
        const conversionRate = totalLeads > 0 ? Math.round((totalClients / totalLeads) * 100) : 0;
        
        // Atualizar UI
        document.getElementById('totalLeads').textContent = totalLeads;
        document.getElementById('activeClients').textContent = totalClients;
        document.getElementById('conversionRate').textContent = `${conversionRate}%`;
        document.getElementById('monthlyRevenue').textContent = totalContacts;
        
        console.log('✅ Dashboard atualizado:', { totalLeads, totalClients, totalContacts, conversionRate });
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados do dashboard:', error);
        // Manter valores padrão em caso de erro
        document.getElementById('totalLeads').textContent = '0';
        document.getElementById('activeClients').textContent = '0';
        document.getElementById('conversionRate').textContent = '0%';
        document.getElementById('monthlyRevenue').textContent = '0';
    }
}

// Carregar leads
async function loadLeads() {
    try {
        const response = await fetch('/api/leads');
        const result = await response.json();
        
        if (response.ok && result.success) {
            displayLeads(result.data.leads || mockData.leads);
        } else {
            displayLeads(mockData.leads);
        }
    } catch (error) {
        console.error('Erro ao carregar leads:', error);
        displayLeads(mockData.leads);
    }
}

// Exibir leads
function displayLeads(leads) {
    const content = document.getElementById('leadsContent');
    
    if (leads.length === 0) {
        content.innerHTML = '<div class="loading">Nenhum lead encontrado</div>';
        return;
    }
    
    const table = `
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Especialidade</th>
                        <th>Status</th>
                        <th>Data</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${leads.map(lead => `
                        <tr>
                            <td><strong>${lead.nome}</strong></td>
                            <td>${lead.email}</td>
                            <td>${lead.especialidade}</td>
                            <td><span class="badge badge-${getStatusClass(lead.status)}">${lead.status}</span></td>
                            <td>${new Date(lead.createdAt).toLocaleDateString('pt-BR')}</td>
                            <td>
                                <button class="btn btn-secondary btn-view-lead" data-lead-id="${lead._id || lead.id}" style="margin-right: 0.5rem;">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-danger btn-delete-lead" data-lead-id="${lead._id || lead.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    content.innerHTML = table;
    
    // Adicionar event listeners aos botões de visualizar lead
    content.querySelectorAll('.btn-view-lead').forEach(btn => {
        btn.addEventListener('click', function() {
            const leadId = this.getAttribute('data-lead-id');
            if (leadId) {
                viewLead(leadId);
            }
        });
    });
    
    // Adicionar event listeners aos botões de excluir lead
    content.querySelectorAll('.btn-delete-lead').forEach(btn => {
        btn.addEventListener('click', function() {
            const leadId = this.getAttribute('data-lead-id');
            if (leadId) {
                deleteLead(leadId);
            }
        });
    });
}

// Carregar contatos
async function loadContacts() {
    try {
        const response = await fetch('/api/contact');
        const result = await response.json();
        
        if (response.ok && result.success) {
            displayContacts(result.data.contatos || result.data || mockData.contacts);
        } else {
            displayContacts(mockData.contacts);
        }
    } catch (error) {
        console.error('Erro ao carregar contatos:', error);
        displayContacts(mockData.contacts);
    }
}

// Exibir contatos
function displayContacts(contacts) {
    const content = document.getElementById('contactsContent');
    
    // Se contacts não for array, tentar extrair array de dentro dele
    if (!Array.isArray(contacts)) {
        contacts = contacts?.contatos || [];
    }
    
    if (contacts.length === 0) {
        content.innerHTML = '<div class="loading">Nenhum contato encontrado</div>';
        return;
    }
    
    const table = `
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Assunto</th>
                        <th>Status</th>
                        <th>Data</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${contacts.map(contact => `
                        <tr>
                            <td><strong>${contact.nome}</strong></td>
                            <td>${contact.email}</td>
                            <td>${contact.assunto}</td>
                            <td><span class="badge badge-${getStatusClass(contact.status)}">${contact.status}</span></td>
                            <td>${new Date(contact.createdAt).toLocaleDateString('pt-BR')}</td>
                            <td>
                                <button class="btn btn-secondary btn-view-contact" data-contact-id="${contact._id || contact.id}">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    content.innerHTML = table;
    
    // Adicionar event listeners aos botões de visualizar contato
    content.querySelectorAll('.btn-view-contact').forEach(btn => {
        btn.addEventListener('click', function() {
            const contactId = this.getAttribute('data-contact-id');
            if (contactId) {
                viewContact(contactId);
            }
        });
    });
}

// Carregar clientes
async function loadClients() {
    try {
        const response = await fetch('/api/clients', {
            method: 'GET',
            headers: getAuthHeaders()
        });
        const result = await response.json();
        
        if (response.ok && result.success) {
            displayClients(result.data);
        } else {
            document.getElementById('clientsContent').innerHTML = 
                '<div class="loading">Nenhum cliente encontrado</div>';
        }
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        document.getElementById('clientsContent').innerHTML = 
            '<div class="loading" style="color: var(--danger);">Erro ao carregar clientes</div>';
    }
}

// Exibir clientes
function displayClients(clients) {
    const content = document.getElementById('clientsContent');
    
    if (!clients || clients.length === 0) {
        content.innerHTML = '<div class="loading">Nenhum cliente cadastrado ainda</div>';
        return;
    }
    
    const table = `
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>WhatsApp</th>
                        <th>Tipo</th>
                        <th>Aplicações</th>
                        <th>Status</th>
                        <th>Cadastro</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${clients.map(client => {
                        const apps = [];
                        if (client.applications?.automacaoAtendimento) apps.push('💬 Automação');
                        if (client.applications?.agendamentoInteligente) apps.push('📅 Agendamento');
                        const appsText = apps.join('<br>') || 'Nenhuma';
                        
                        const businessTypeMap = {
                            'clinica': 'Clínica',
                            'consultorio': 'Consultório',
                            'hospital': 'Hospital',
                            'laboratorio': 'Laboratório',
                            'farmacia': 'Farmácia',
                            'outros': 'Outros'
                        };
                        
                        return `
                            <tr>
                                <td>
                                    <strong>${client.name}</strong>
                                    ${client.email ? `<br><small style="color: var(--gray-500);">${client.email}</small>` : ''}
                                </td>
                                <td>${client.whatsapp}</td>
                                <td>${businessTypeMap[client.businessType] || client.businessType}</td>
                                <td>${appsText}</td>
                                <td><span class="badge badge-${getStatusClass(client.status)}">${client.status}</span></td>
                                <td>${new Date(client.createdAt).toLocaleDateString('pt-BR')}</td>
                                <td>
                                    <button class="btn btn-secondary btn-view-client" data-client-id="${client._id}" style="margin-right: 0.5rem;">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-danger btn-delete-client" data-client-id="${client._id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    content.innerHTML = table;
    
    // Adicionar event listeners aos botões de clientes
    content.querySelectorAll('.btn-view-client').forEach(btn => {
        btn.addEventListener('click', function() {
            const clientId = this.getAttribute('data-client-id');
            if (clientId) {
                viewClient(clientId);
            }
        });
    });
    
    content.querySelectorAll('.btn-delete-client').forEach(btn => {
        btn.addEventListener('click', function() {
            const clientId = this.getAttribute('data-client-id');
            if (clientId) {
                deleteClient(clientId);
            }
        });
    });
}

// Funções auxiliares
function getStatusClass(status) {
    const statusMap = {
        'novo': 'info',
        'contatado': 'warning',
        'qualificado': 'success',
        'respondido': 'success',
        'ativo': 'success',
        'inativo': 'danger'
    };
    return statusMap[status] || 'info';
}

// Função showAlert global para uso por outros scripts
window.showAlert = function(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${message}
    `;
    
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.insertBefore(alert, mainContent.firstChild);
        setTimeout(() => alert.remove(), 5000);
    }
};

// Função para exibir modal com detalhes
window.showDetailsModal = function(title, content, type = 'info') {
    // Remover modal existente se houver
    const existingModal = document.getElementById('detailsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Criar modal
    const modal = document.createElement('div');
    modal.id = 'detailsModal';
    modal.className = 'modal show';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2>
                    <i class="fas fa-${type === 'info' ? 'info-circle' : type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
                    ${title}
                </h2>
                <button class="modal-close" id="closeDetailsModal">&times;</button>
            </div>
            <div class="modal-body" style="padding: 1.5rem;">
                <div style="line-height: 1.8; color: var(--gray-700);">
                    ${content}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" id="confirmDetailsModal">OK</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners para fechar
    const closeBtn = document.getElementById('closeDetailsModal');
    const confirmBtn = document.getElementById('confirmDetailsModal');
    
    const closeModal = () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    };
    
    closeBtn.addEventListener('click', closeModal);
    confirmBtn.addEventListener('click', closeModal);
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
};

// Função para exibir modal de confirmação customizado
window.showConfirmModal = function(message, onConfirm, title = 'Confirmar ação') {
    return new Promise((resolve) => {
        // Remover modal existente se houver
        const existingModal = document.getElementById('confirmModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Criar modal
        const modal = document.createElement('div');
        modal.id = 'confirmModal';
        modal.className = 'modal show';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 450px;">
                <div class="modal-header">
                    <h2>
                        <i class="fas fa-exclamation-triangle" style="color: var(--warning);"></i>
                        ${title}
                    </h2>
                    <button class="modal-close" id="closeConfirmModal">&times;</button>
                </div>
                <div class="modal-body" style="padding: 1.5rem;">
                    <p style="font-size: 1rem; line-height: 1.6; color: var(--gray-700); margin: 0;">
                        ${message}
                    </p>
                </div>
                <div class="modal-footer" style="display: flex; gap: 0.75rem; justify-content: flex-end;">
                    <button class="btn btn-secondary" id="cancelConfirmModal">Cancelar</button>
                    <button class="btn btn-danger" id="confirmConfirmModal">
                        <i class="fas fa-check"></i>
                        Confirmar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        const closeBtn = document.getElementById('closeConfirmModal');
        const cancelBtn = document.getElementById('cancelConfirmModal');
        const confirmBtn = document.getElementById('confirmConfirmModal');
        
        const closeModal = (confirmed = false) => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
                if (confirmed && onConfirm) {
                    onConfirm();
                }
                resolve(confirmed);
            }, 300);
        };
        
        closeBtn.addEventListener('click', () => closeModal(false));
        cancelBtn.addEventListener('click', () => closeModal(false));
        confirmBtn.addEventListener('click', () => closeModal(true));
        
        // Fechar ao clicar fora (apenas se clicar no backdrop)
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(false);
            }
        });
        
        // Fechar com ESC
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                closeModal(false);
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    });
};

// Funções de ação
function refreshData() {
    loadDashboardData();
    loadLeads();
    loadContacts();
    loadClients();
    showAlert('Dados atualizados com sucesso!', 'success');
}

function exportData() {
    showAlert('Funcionalidade de exportação em desenvolvimento...', 'warning');
}

// Funções globais para uso via onclick
window.viewLead = async function(leadId) {
    try {
        const response = await fetch(`/api/leads/${leadId}`, {
            headers: getAuthHeaders()
        });
        const result = await response.json();
        
        if (response.ok && result.success) {
            const lead = result.data;
            const details = `
                <p><strong>Nome:</strong> ${lead.nome || 'Não informado'}</p>
                <p><strong>Email:</strong> ${lead.email || 'Não informado'}</p>
                <p><strong>Telefone:</strong> ${lead.telefone || 'Não informado'}</p>
                <p><strong>Especialidade:</strong> ${lead.especialidade || 'Não informada'}</p>
                <p><strong>Status:</strong> <span class="badge badge-${getStatusClass(lead.status)}">${lead.status}</span></p>
                <p><strong>Origem:</strong> ${lead.origem || 'Não informada'}</p>
                <p><strong>Data:</strong> ${lead.createdAt ? new Date(lead.createdAt).toLocaleString('pt-BR') : 'Não informada'}</p>
            `;
            showDetailsModal('Detalhes do Lead', details, 'info');
        } else {
            showAlert('Lead não encontrado', 'error');
        }
    } catch (error) {
        console.error('Erro ao visualizar lead:', error);
        showAlert('Erro ao carregar detalhes do lead', 'error');
    }
}

window.viewContact = async function(contactId) {
    try {
        const response = await fetch(`/api/contact/${contactId}`, {
            headers: getAuthHeaders()
        });
        const result = await response.json();
        
        if (response.ok && result.success) {
            const contact = result.data;
            const details = `
                <p><strong>Nome:</strong> ${contact.nome || 'Não informado'}</p>
                <p><strong>Email:</strong> ${contact.email || 'Não informado'}</p>
                <p><strong>Telefone:</strong> ${contact.telefone || 'Não informado'}</p>
                <p><strong>Assunto:</strong> ${contact.assunto || 'Não informado'}</p>
                <p><strong>Mensagem:</strong><br>${contact.mensagem || 'Não informada'}</p>
                <p><strong>Data:</strong> ${contact.createdAt ? new Date(contact.createdAt).toLocaleString('pt-BR') : 'Não informada'}</p>
            `;
            showDetailsModal('Detalhes do Contato', details, 'info');
        } else {
            showAlert('Contato não encontrado', 'error');
        }
    } catch (error) {
        console.error('Erro ao visualizar contato:', error);
        showAlert('Erro ao carregar detalhes do contato', 'error');
    }
}

window.viewClient = async function(clientId) {
    try {
        const response = await fetch(`/api/clients/${clientId}`, {
            headers: getAuthHeaders()
        });
        const result = await response.json();
        
        if (response.ok && result.success) {
            const client = result.data;
            const apps = [];
            if (client.applications?.automacaoAtendimento) apps.push('💬 Automação WhatsApp');
            if (client.applications?.agendamentoInteligente) apps.push('📅 Agendamento Inteligente');
            
            const details = `
                <p><strong>Nome:</strong> ${client.name || 'Não informado'}</p>
                <p><strong>Email:</strong> ${client.email || 'Não informado'}</p>
                <p><strong>WhatsApp:</strong> ${client.whatsapp || 'Não informado'}</p>
                <p><strong>Tipo:</strong> ${client.businessType || 'Não informado'}</p>
                <p><strong>Aplicações:</strong> ${apps.join(', ') || 'Nenhuma'}</p>
                <p><strong>Status:</strong> <span class="badge badge-${getStatusClass(client.status)}">${client.status}</span></p>
                <p><strong>Data:</strong> ${client.createdAt ? new Date(client.createdAt).toLocaleString('pt-BR') : 'Não informada'}</p>
            `;
            showDetailsModal('Detalhes do Cliente', details, 'info');
        } else {
            showAlert('Cliente não encontrado', 'error');
        }
    } catch (error) {
        console.error('Erro ao visualizar cliente:', error);
        showAlert('Erro ao carregar detalhes do cliente', 'error');
    }
}

window.deleteClient = async function(clientId) {
    const confirmed = await showConfirmModal(
        'Tem certeza que deseja desativar este cliente?',
        null,
        'Desativar Cliente'
    );
    
    if (!confirmed) {
        return;
    }
    
    try {
        const response = await fetch(`/api/clients/${clientId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showAlert('Cliente desativado com sucesso!', 'success');
            loadClients();
        } else {
            showAlert(result.error || 'Erro ao desativar cliente', 'error');
        }
    } catch (error) {
        console.error('Erro ao desativar cliente:', error);
        showAlert('Erro ao desativar cliente', 'error');
    }
}

window.deleteLead = async function(leadId) {
    const confirmed = await showConfirmModal(
        'Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita.',
        null,
        'Excluir Lead'
    );
    
    if (!confirmed) {
        return;
    }
    
    try {
        const response = await fetch(`/api/leads/${leadId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showAlert('Lead excluído com sucesso!', 'success');
            // Recarregar leads e atualizar estatísticas
            loadLeads();
            loadDashboardData(); // Atualiza as estatísticas
        } else {
            showAlert(result.error || 'Erro ao excluir lead', 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir lead:', error);
        showAlert('Erro ao excluir lead', 'error');
    }
}

// Controlar exibição do campo de calendário
function toggleCalendarField() {
    const selectedApp = document.querySelector('input[name="applications"]:checked');
    const calendarField = document.getElementById('calendarSelectionField');
    
    if (selectedApp && (selectedApp.value === 'agendamento' || selectedApp.value === 'both')) {
        calendarField.style.display = 'block';
    } else {
        calendarField.style.display = 'none';
    }
}

// Atualizar leads
function refreshLeads() {
    document.getElementById('leadsContent').innerHTML = '<div class="loading"><div class="spinner"></div>Atualizando leads...</div>';
    loadLeads();
}

// Atualizar contatos
function refreshContacts() {
    document.getElementById('contactsContent').innerHTML = '<div class="loading"><div class="spinner"></div>Atualizando contatos...</div>';
    loadContacts();
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;
    
    // Add navigation event listeners
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            showSection(section);
            
            // Carregar gráficos quando abrir Analytics
            if (section === 'analytics' && typeof initAnalytics === 'function') {
                setTimeout(() => initAnalytics(), 100);
            }
        });
    });
    
    // Formulário de cliente
    const clientForm = document.getElementById('clientForm');
    if (clientForm) {
        clientForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const selectedAppRadio = document.querySelector('input[name="applications"]:checked');
            if (!selectedAppRadio) {
                showAlert('Por favor, selecione pelo menos uma aplicação', 'error');
                return;
            }
            const selectedApp = selectedAppRadio.value;
            
            const formData = {
                name: document.getElementById('clientName').value,
                email: document.getElementById('clientEmail').value,
                whatsapp: document.getElementById('clientWhatsapp').value,
                businessType: document.getElementById('clientBusinessType').value,
                applications: {
                    automacaoAtendimento: selectedApp === 'automacao' || selectedApp === 'both',
                    agendamentoInteligente: selectedApp === 'agendamento' || selectedApp === 'both'
                },
                notes: document.getElementById('clientNotes').value
            };
            
            try {
                const response = await fetch('/api/clients', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    showAlert('Cliente adicionado com sucesso!', 'success');
                    document.getElementById('clientForm').reset();
                    loadClients();
                } else {
                    showAlert(result.error || 'Erro ao adicionar cliente', 'error');
                }
            } catch (error) {
                console.error('Erro ao adicionar cliente:', error);
                showAlert('Erro ao adicionar cliente. Verifique sua conexão.', 'error');
            }
        });
    }
    
    // Adicionar event listeners para os radio buttons
    document.querySelectorAll('input[name="applications"]').forEach(radio => {
        radio.addEventListener('change', toggleCalendarField);
    });
    
    // Event listener para o botão de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Event listeners para os formulários de configurações
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePassword);
    }
    
    const registerAdminForm = document.getElementById('registerAdminForm');
    if (registerAdminForm) {
        registerAdminForm.addEventListener('submit', handleRegisterAdmin);
    }
    
    // Event listeners para os botões de abrir modais
    const btnChangePassword = document.getElementById('btnChangePassword');
    if (btnChangePassword) {
        btnChangePassword.addEventListener('click', openChangePasswordModal);
    }
    
    const btnRegisterAdmin = document.getElementById('btnRegisterAdmin');
    if (btnRegisterAdmin) {
        btnRegisterAdmin.addEventListener('click', openRegisterAdminModal);
    }
    
    // Event listeners para os botões de fechar modais
    const closeChangePasswordBtn = document.getElementById('closeChangePasswordBtn');
    if (closeChangePasswordBtn) {
        closeChangePasswordBtn.addEventListener('click', closeChangePasswordModal);
    }
    
    const cancelChangePasswordBtn = document.getElementById('cancelChangePasswordBtn');
    if (cancelChangePasswordBtn) {
        cancelChangePasswordBtn.addEventListener('click', closeChangePasswordModal);
    }
    
    const closeRegisterAdminBtn = document.getElementById('closeRegisterAdminBtn');
    if (closeRegisterAdminBtn) {
        closeRegisterAdminBtn.addEventListener('click', closeRegisterAdminModal);
    }
    
    const cancelRegisterAdminBtn = document.getElementById('cancelRegisterAdminBtn');
    if (cancelRegisterAdminBtn) {
        cancelRegisterAdminBtn.addEventListener('click', closeRegisterAdminModal);
    }
    
    // Carregar dados iniciais
    loadDashboardData();
    loadLeads();
    loadContacts();
    loadClients();
    
    // Event listeners para clínicas (se a função existir)
    if (typeof setupClinicsListeners === 'function') {
        setupClinicsListeners();
    }
});

// === MODAL FUNCTIONS ===

// Alterar Senha
function openChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    modal.classList.add('show');
    modal.style.display = 'flex';
}

function closeChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
    const form = document.getElementById('changePasswordForm');
    if (form) form.reset();
}

// Cadastrar Admin
function openRegisterAdminModal() {
    const modal = document.getElementById('registerAdminModal');
    modal.classList.add('show');
    modal.style.display = 'flex';
}

function closeRegisterAdminModal() {
    const modal = document.getElementById('registerAdminModal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
    const form = document.getElementById('registerAdminForm');
    if (form) form.reset();
}

// Fechar modais ao clicar fora
window.addEventListener('click', function(e) {
    const changePasswordModal = document.getElementById('changePasswordModal');
    const registerAdminModal = document.getElementById('registerAdminModal');
    
    if (e.target === changePasswordModal) {
        closeChangePasswordModal();
    }
    if (e.target === registerAdminModal) {
        closeRegisterAdminModal();
    }
});

// === FORM HANDLERS ===

// Handle Change Password Form
async function handleChangePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validar se as senhas coincidem
    if (newPassword !== confirmPassword) {
        showAlert('As senhas não coincidem', 'error');
        return;
    }
    
    // Validar tamanho mínimo
    if (newPassword.length < 6) {
        showAlert('A nova senha deve ter pelo menos 6 caracteres', 'error');
        return;
    }
    
    try {
        const token = window.getAuthToken();
        if (!token) {
            window.location.href = '/site/login.html';
            return;
        }
        
        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                senhaAtual: currentPassword,
                novaSenha: newPassword
            })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showAlert('Senha alterada com sucesso!', 'success');
            closeChangePasswordModal();
        } else {
            showAlert(result.error || 'Erro ao alterar senha', 'error');
        }
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        showAlert('Erro ao alterar senha. Tente novamente.', 'error');
    }
}

// Handle Register Admin Form
async function handleRegisterAdmin(e) {
    e.preventDefault();
    
    const formData = {
        nome: document.getElementById('adminName').value,
        email: document.getElementById('adminEmail').value,
        senha: document.getElementById('adminPassword').value,
        telefone: document.getElementById('adminPhone').value,
        departamento: document.getElementById('adminDepartment').value
    };
    
    try {
        const token = window.getAuthToken();
        if (!token) {
            window.location.href = '/site/login.html';
            return;
        }
        
        const response = await fetch('/api/auth/register-admin', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showAlert(`Usuário ${result.data.nome} cadastrado com sucesso!`, 'success');
            closeRegisterAdminModal();
        } else if (response.status === 409) {
            showAlert('E-mail já cadastrado no sistema', 'error');
        } else {
            showAlert(result.error || 'Erro ao cadastrar usuário', 'error');
        }
    } catch (error) {
        console.error('Erro ao cadastrar admin:', error);
        showAlert('Erro ao cadastrar usuário. Tente novamente.', 'error');
    }
}
