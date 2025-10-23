// Dashboard JavaScript - AtenMed
// Funcionalidades modernas e responsivas

// Verificar autenticação
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
    
    // Show selected section
    document.getElementById(sectionId).style.display = 'block';
    
    // Add active class to selected nav item
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
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
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Atualizar estatísticas
        document.getElementById('totalLeads').textContent = mockData.leads.length;
        document.getElementById('activeClients').textContent = '12';
        document.getElementById('conversionRate').textContent = '15%';
        document.getElementById('monthlyRevenue').textContent = 'R$ 45.000';
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showAlert('Erro ao carregar dados do dashboard', 'error');
    }
}

// Carregar leads
async function loadLeads() {
    try {
        const response = await fetch('/api/leads');
        const result = await response.json();
        
        if (response.ok) {
            displayLeads(result.data || mockData.leads);
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
                                <button class="btn btn-secondary" onclick="viewLead('${lead.id}')">
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
}

// Carregar contatos
async function loadContacts() {
    try {
        const response = await fetch('/api/contact');
        const result = await response.json();
        
        if (response.ok) {
            displayContacts(result.data || mockData.contacts);
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
                                <button class="btn btn-secondary" onclick="viewContact('${contact.id}')">
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
}

// Carregar clientes
async function loadClients() {
    try {
        const response = await fetch('/api/clients');
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
                        if (client.applications.automacaoAtendimento) apps.push('💬 Automação');
                        if (client.applications.agendamentoInteligente) apps.push('📅 Agendamento');
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
                                    <button class="btn btn-secondary" onclick="viewClient('${client._id}')" style="margin-right: 0.5rem;">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-danger" onclick="deleteClient('${client._id}')">
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

function showAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${message}
    `;
    
    document.querySelector('.main-content').insertBefore(alert, document.querySelector('.main-content').firstChild);
    
    setTimeout(() => alert.remove(), 5000);
}

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

function viewLead(leadId) {
    showAlert(`Visualizando lead ${leadId}...`, 'info');
}

function viewContact(contactId) {
    showAlert(`Visualizando contato ${contactId}...`, 'info');
}

function viewClient(clientId) {
    showAlert(`Visualizando cliente ${clientId}...`, 'info');
}

async function deleteClient(clientId) {
    if (!confirm('Tem certeza que deseja desativar este cliente?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/clients/${clientId}`, {
            method: 'DELETE'
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
        });
    });
    
    // Formulário de cliente
    const clientForm = document.getElementById('clientForm');
    if (clientForm) {
        clientForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById('clientName').value,
                email: document.getElementById('clientEmail').value,
                whatsapp: document.getElementById('clientWhatsapp').value,
                businessType: document.getElementById('clientBusinessType').value,
                applications: document.querySelector('input[name="applications"]:checked').value,
                notes: document.getElementById('clientNotes').value
            };
            
            try {
                const response = await fetch('/api/clients', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
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
    
    // Carregar dados iniciais
    loadDashboardData();
    loadLeads();
    loadContacts();
    loadClients();
});
