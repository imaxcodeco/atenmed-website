// Dashboard JavaScript - AtenMed
// Funcionalidades modernas e responsivas

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

// Obter token JWT
function getAuthToken() {
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
}

// Criar headers com autenticação
function getAuthHeaders() {
    const token = getAuthToken();
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
        // Buscar leads (sem limit para evitar erro de validação)
        const leadsRes = await fetch('/api/leads');
        const leads = await leadsRes.json();
        console.log('Leads response:', leads);
        
        const totalLeads = leads.data?.pagination?.total || leads.data?.leads?.length || 0;
        
        // Buscar clientes (rota protegida - ignorar erro de autenticação)
        let totalClients = 0;
        try {
            const clientsRes = await fetch('/api/clients');
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
                                <button class="btn btn-secondary" onclick="viewLead('${lead._id || lead.id}')">
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
                                <button class="btn btn-secondary" onclick="viewContact('${contact._id || contact.id}')">
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

async function viewLead(leadId) {
    try {
        const response = await fetch(`/api/leads/${leadId}`, {
            headers: getAuthHeaders()
        });
        const result = await response.json();
        
        if (response.ok && result.success) {
            const lead = result.data;
            const details = `
                <strong>Nome:</strong> ${lead.nome}<br>
                <strong>Email:</strong> ${lead.email}<br>
                <strong>Telefone:</strong> ${lead.telefone}<br>
                <strong>Especialidade:</strong> ${lead.especialidade || 'Não informada'}<br>
                <strong>Status:</strong> ${lead.status}<br>
                <strong>Origem:</strong> ${lead.origem}<br>
                <strong>Data:</strong> ${new Date(lead.createdAt).toLocaleString('pt-BR')}
            `;
            showAlert(details, 'info');
        } else {
            showAlert('Lead não encontrado', 'error');
        }
    } catch (error) {
        console.error('Erro ao visualizar lead:', error);
        showAlert('Erro ao carregar detalhes do lead', 'error');
    }
}

async function viewContact(contactId) {
    try {
        const response = await fetch(`/api/contact/${contactId}`, {
            headers: getAuthHeaders()
        });
        const result = await response.json();
        
        if (response.ok && result.success) {
            const contact = result.data;
            const details = `
                <strong>Nome:</strong> ${contact.nome}<br>
                <strong>Email:</strong> ${contact.email}<br>
                <strong>Telefone:</strong> ${contact.telefone || 'Não informado'}<br>
                <strong>Assunto:</strong> ${contact.assunto}<br>
                <strong>Mensagem:</strong> ${contact.mensagem}<br>
                <strong>Data:</strong> ${new Date(contact.createdAt).toLocaleString('pt-BR')}
            `;
            showAlert(details, 'info');
        } else {
            showAlert('Contato não encontrado', 'error');
        }
    } catch (error) {
        console.error('Erro ao visualizar contato:', error);
        showAlert('Erro ao carregar detalhes do contato', 'error');
    }
}

async function viewClient(clientId) {
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
                <strong>Nome:</strong> ${client.name}<br>
                <strong>Email:</strong> ${client.email || 'Não informado'}<br>
                <strong>WhatsApp:</strong> ${client.whatsapp}<br>
                <strong>Tipo:</strong> ${client.businessType}<br>
                <strong>Aplicações:</strong> ${apps.join(', ') || 'Nenhuma'}<br>
                <strong>Status:</strong> ${client.status}<br>
                <strong>Data:</strong> ${new Date(client.createdAt).toLocaleString('pt-BR')}
            `;
            showAlert(details, 'info');
        } else {
            showAlert('Cliente não encontrado', 'error');
        }
    } catch (error) {
        console.error('Erro ao visualizar cliente:', error);
        showAlert('Erro ao carregar detalhes do cliente', 'error');
    }
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
            
            const selectedApp = document.querySelector('input[name="applications"]:checked').value;
            
            const formData = {
                name: document.getElementById('clientName').value,
                email: document.getElementById('clientEmail').value,
                whatsapp: document.getElementById('clientWhatsapp').value,
                businessType: document.getElementById('clientBusinessType').value,
                applications: {
                    automacaoAtendimento: selectedApp === 'whatsapp' || selectedApp === 'both',
                    agendamentoInteligente: selectedApp === 'agendamento' || selectedApp === 'both'
                },
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
    
    // Event listener para o botão de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Carregar dados iniciais
    loadDashboardData();
    loadLeads();
    loadContacts();
    loadClients();
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
    document.getElementById('changePasswordForm').reset();
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
    document.getElementById('registerAdminForm').reset();
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
document.getElementById('changePasswordForm').addEventListener('submit', async function(e) {
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
        const auth = getAuth();
        if (!auth) {
            window.location.href = '/site/login.html';
            return;
        }
        
        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth.token}`
            },
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
});

// Handle Register Admin Form
document.getElementById('registerAdminForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        nome: document.getElementById('adminName').value,
        email: document.getElementById('adminEmail').value,
        senha: document.getElementById('adminPassword').value,
        telefone: document.getElementById('adminPhone').value,
        departamento: document.getElementById('adminDepartment').value
    };
    
    try {
        const auth = getAuth();
        if (!auth) {
            window.location.href = '/site/login.html';
            return;
        }
        
        const response = await fetch('/api/auth/register-admin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth.token}`
            },
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
});
