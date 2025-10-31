/**
 * AtenMed - Agendamento Inteligente
 * JavaScript para interface administrativa
 */

// Configuração da API
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000/api'
    : window.location.hostname === 'atenmed.com.br' || window.location.hostname === 'www.atenmed.com.br'
    ? 'https://atenmed.com.br/api'
    : '/api';

// Estado da aplicação
let currentTab = 'appointments';
let authToken = localStorage.getItem('atenmed_token');

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Agendamento Inteligente inicializado');
    
    // Carregar estatísticas
    loadStats();
    
    // Carregar agendamentos
    loadAppointments();
    
    // Configurar listeners
    setupFormListeners();
    
    // Configurar filtro de data para hoje
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('filterDate').value = today;
});

// ===== GESTÃO DE TABS =====
function switchTab(tabName) {
    // Atualizar tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Atualizar conteúdo
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`).classList.add('active');
    
    currentTab = tabName;
    
    // Carregar dados da tab
    switch(tabName) {
        case 'appointments':
            loadAppointments();
            break;
        case 'doctors':
            loadDoctors();
            break;
        case 'specialties':
            loadSpecialties();
            break;
        case 'clinics':
            loadClinics();
            break;
        case 'google':
            checkGoogleAuth();
            break;
    }
}

// ===== ESTATÍSTICAS =====
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/appointments/stats/overview`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Erro ao carregar estatísticas');
        }
        
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('statToday').textContent = result.data.today || 0;
            document.getElementById('statConfirmed').textContent = result.data.confirmed || 0;
            document.getElementById('statPending').textContent = result.data.pending || 0;
            document.getElementById('statCanceled').textContent = result.data.canceled || 0;
        }
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        // Não mostrar erro, apenas log
    }
}

// ===== AGENDAMENTOS =====
async function loadAppointments() {
    const tableBody = document.getElementById('appointmentsTableBody');
    tableBody.innerHTML = '<tr><td colspan="6" class="loading">Carregando agendamentos</td></tr>';
    
    try {
        // Construir query params
        const params = new URLSearchParams();
        
        const date = document.getElementById('filterDate').value;
        if (date) params.append('date', date);
        
        const status = document.getElementById('filterStatus').value;
        if (status) params.append('status', status);
        
        const response = await fetch(`${API_BASE_URL}/appointments?${params}`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Erro ao carregar agendamentos');
        }
        
        const result = await response.json();
        
        if (result.success && result.data.appointments.length > 0) {
            tableBody.innerHTML = result.data.appointments.map(appointment => `
                <tr>
                    <td>
                        ${formatDate(appointment.scheduledDate)}<br>
                        <small style="color: var(--text-secondary);">${appointment.scheduledTime}</small>
                    </td>
                    <td>
                        <strong>${appointment.patient.name}</strong><br>
                        <small style="color: var(--text-secondary);">${appointment.patient.phone}</small>
                    </td>
                    <td>${appointment.doctor?.name || 'N/A'}</td>
                    <td>
                        <span class="badge badge-info">${appointment.specialty?.name || 'N/A'}</span>
                    </td>
                    <td>${getStatusBadge(appointment.status)}</td>
                    <td>
                        <button class="btn btn-secondary" onclick="viewAppointment('${appointment._id}')" 
                                style="padding: 0.5rem; font-size: 0.875rem;">
                            👁️ Ver
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <div class="empty-state-icon">📅</div>
                        <p>Nenhum agendamento encontrado</p>
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--error-color); padding: 2rem;">
                    ❌ Erro ao carregar agendamentos. Por favor, tente novamente.
                </td>
            </tr>
        `;
    }
}

async function viewAppointment(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
            headers: getAuthHeaders()
        });
        
        const result = await response.json();
        
        if (result.success) {
            const appt = result.data;
            alert(`
Detalhes do Agendamento

Paciente: ${appt.patient.name}
Telefone: ${appt.patient.phone}
Email: ${appt.patient.email || 'Não informado'}

Data: ${formatDate(appt.scheduledDate)}
Horário: ${appt.scheduledTime}

Médico: ${appt.doctor?.name}
Especialidade: ${appt.specialty?.name}
Clínica: ${appt.clinic?.name}

Status: ${appt.status}

${appt.notes ? `Observações: ${appt.notes}` : ''}
            `);
        }
    } catch (error) {
        console.error('Erro ao buscar agendamento:', error);
        showAlert('Erro ao buscar detalhes do agendamento', 'error');
    }
}

// ===== MÉDICOS =====
async function loadDoctors() {
    const tableBody = document.getElementById('doctorsTableBody');
    tableBody.innerHTML = '<tr><td colspan="6" class="loading">Carregando médicos</td></tr>';
    
    try {
        // Como não temos rota específica, vamos usar uma abordagem temporária
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <div class="empty-state-icon">👨‍⚕️</div>
                    <p>Use o formulário acima para adicionar médicos</p>
                    <small style="color: var(--text-secondary);">
                        Os médicos serão listados aqui após serem cadastrados
                    </small>
                </td>
            </tr>
        `;
    } catch (error) {
        console.error('Erro ao carregar médicos:', error);
    }
}

function showAddDoctorForm() {
    document.getElementById('addDoctorForm').style.display = 'block';
}

function hideAddDoctorForm() {
    document.getElementById('addDoctorForm').style.display = 'none';
    document.getElementById('doctorForm').reset();
}

function setupFormListeners() {
    // Formulário de médico
    const doctorForm = document.getElementById('doctorForm');
    if (doctorForm) {
        doctorForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(doctorForm);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                googleCalendarId: formData.get('googleCalendarId'),
                crm: {
                    number: formData.get('crm'),
                    state: 'SP' // Default
                },
                bio: formData.get('bio'),
                active: true,
                acceptsNewPatients: true
            };
            
            try {
                // Aqui você precisaria criar uma rota para adicionar médicos
                showAlert('Funcionalidade em desenvolvimento. Adicione médicos via MongoDB diretamente.', 'warning');
                hideAddDoctorForm();
            } catch (error) {
                console.error('Erro ao salvar médico:', error);
                showAlert('Erro ao salvar médico', 'error');
            }
        });
    }
}

// ===== ESPECIALIDADES =====
async function loadSpecialties() {
    console.log('Carregar especialidades - em desenvolvimento');
}

// ===== CLÍNICAS =====
async function loadClinics() {
    console.log('Carregar clínicas - em desenvolvimento');
}

// ===== GOOGLE CALENDAR =====
async function checkGoogleAuth() {
    const statusDiv = document.getElementById('googleAuthStatus');
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/google/status`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const result = await response.json();
            
            if (result.authenticated) {
                statusDiv.innerHTML = `
                    <div class="alert alert-success">
                        <strong>✅ Autenticado com sucesso!</strong><br>
                        O sistema está conectado ao Google Calendar e pronto para criar agendamentos.
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
    }
}

function authenticateGoogle() {
    // Redirecionar para autenticação do Google
    window.location.href = `${API_BASE_URL}/auth/google`;
}

// ===== UTILITÁRIOS =====
function getAuthHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    return headers;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function getStatusBadge(status) {
    const statusMap = {
        'pendente': { class: 'warning', text: '⏳ Pendente' },
        'confirmado': { class: 'success', text: '✅ Confirmado' },
        'em-atendimento': { class: 'info', text: '🏥 Em Atendimento' },
        'concluido': { class: 'success', text: '✔️ Concluído' },
        'cancelado': { class: 'error', text: '❌ Cancelado' },
        'nao-compareceu': { class: 'error', text: '⚠️ Não Compareceu' }
    };
    
    const statusInfo = statusMap[status] || { class: 'info', text: status };
    return `<span class="badge badge-${statusInfo.class}">${statusInfo.text}</span>`;
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '10000';
    alertDiv.style.maxWidth = '400px';
    alertDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function logout() {
    localStorage.removeItem('atenmed_token');
    window.location.href = '/login.html';
}

// Atualizar estatísticas a cada 30 segundos
setInterval(loadStats, 30000);

