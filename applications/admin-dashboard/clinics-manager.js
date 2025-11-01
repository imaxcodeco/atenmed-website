/**
 * AtenMed - Clinics Manager
 * Gerenciamento de clínicas integrado ao dashboard
 */

// API Base URL (usar sempre window.window.API_BASE para evitar conflitos)
(function() {
    if (typeof window.window.API_BASE === 'undefined') {
        window.window.API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:3000/api'
            : (window.location.hostname === 'atenmed.com.br' || window.location.hostname === 'www.atenmed.com.br')
            ? 'https://atenmed.com.br/api'
            : '/api';
    }
})();

// Estado
let clinics = [];
let editingClinicId = null;

// Configurar event listeners para clínicas
function setupClinicsListeners() {
    // Botão nova clínica na seção de clínicas
    const btnAddClinica = document.getElementById('btnAddClinica');
    if (btnAddClinica) {
        btnAddClinica.addEventListener('click', openClinicModal);
    }
    
    // Botão nova clínica nas ações rápidas
    const btnNovaClinica = document.getElementById('btnNovaClinica');
    if (btnNovaClinica) {
        btnNovaClinica.addEventListener('click', openClinicModal);
    }
    
    // Botão fechar modal
    const closeClinicModal = document.getElementById('closeClinicModal');
    if (closeClinicModal) {
        closeClinicModal.addEventListener('click', closeClinicModalFunc);
    }
    
    const cancelClinicBtn = document.getElementById('cancelClinicBtn');
    if (cancelClinicBtn) {
        cancelClinicBtn.addEventListener('click', closeClinicModalFunc);
    }
    
    // Formulário de clínica
    const clinicForm = document.getElementById('clinicForm');
    if (clinicForm) {
        clinicForm.addEventListener('submit', saveClinic);
    }
    
    // Modal - fechar ao clicar fora
    const modal = document.getElementById('clinicModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'clinicModal') {
                closeClinicModalFunc();
            }
        });
    }
    
    // Carregar clínicas quando a seção for aberta
    const clinicsNav = document.querySelector('[data-section="clinics"]');
    if (clinicsNav) {
        clinicsNav.addEventListener('click', () => {
            setTimeout(() => loadClinics(), 100);
        });
    }
}

// Função global para abrir modal (chamada pelo onclick)
window.openClinicModal = function(clinicIdOrEvent = null) {
    // Tratar caso receba evento em vez de ID
    let clinicId = null;
    if (clinicIdOrEvent && typeof clinicIdOrEvent === 'string') {
        clinicId = clinicIdOrEvent;
    } else if (clinicIdOrEvent && clinicIdOrEvent.target) {
        // Se recebeu um evento, ignorar
        clinicId = null;
    }
    
    editingClinicId = clinicId;
    const modal = document.getElementById('clinicModal');
    const modalTitle = document.getElementById('clinicModalTitle');
    const form = document.getElementById('clinicForm');
    
    if (!modal || !form) return;
    
    // Resetar formulário
    form.reset();
    document.getElementById('clinicId').value = '';
    editingClinicId = null;
    
    // Se for edição, carregar dados
    if (clinicId) {
        editingClinicId = clinicId;
        loadClinicData(clinicId);
        if (modalTitle) modalTitle.textContent = 'Editar Clínica';
    } else {
        if (modalTitle) modalTitle.textContent = 'Nova Clínica';
        // Valores padrão
        const startHour = document.getElementById('clinicStartHour');
        const endHour = document.getElementById('clinicEndHour');
        const whatsappBot = document.getElementById('clinicWhatsAppBot');
        const active = document.getElementById('clinicActive');
        
        if (startHour) startHour.value = 8;
        if (endHour) endHour.value = 18;
        if (whatsappBot) whatsappBot.checked = true;
        if (active) active.checked = true;
    }
    
    modal.classList.add('show');
    modal.style.display = 'flex';
};

function closeClinicModalFunc() {
    const modal = document.getElementById('clinicModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
        const form = document.getElementById('clinicForm');
        if (form) form.reset();
        editingClinicId = null;
    }
}

// Carregar dados de uma clínica para edição
async function loadClinicData(clinicId) {
    // Validar que clinicId é uma string válida
    if (!clinicId || typeof clinicId !== 'string' || clinicId === '[object PointerEvent]') {
        console.error('ID de clínica inválido:', clinicId);
        return;
    }
    
    try {
        const token = getAuthToken();
        if (!token) return;
        
        const response = await fetch(`${window.API_BASE}/clinics/${clinicId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Erro ao carregar clínica');
        }
        
        const result = await response.json();
        const clinic = result.data || result;
        
        // Preencher formulário
        document.getElementById('clinicId').value = clinic._id;
        document.getElementById('clinicName').value = clinic.name || '';
        document.getElementById('clinicWhatsApp').value = clinic.contact?.whatsapp || '';
        document.getElementById('clinicPhone').value = clinic.contact?.phone || '';
        document.getElementById('clinicEmail').value = clinic.contact?.email || '';
        document.getElementById('clinicDescription').value = clinic.description || '';
        document.getElementById('clinicAddress').value = clinic.address?.street || '';
        document.getElementById('clinicCity').value = clinic.address?.city || '';
        document.getElementById('clinicState').value = clinic.address?.state || '';
        document.getElementById('clinicStartHour').value = clinic.workingHours?.start || 8;
        document.getElementById('clinicEndHour').value = clinic.workingHours?.end || 18;
        document.getElementById('clinicWhatsAppBot').checked = clinic.features?.whatsappBot !== false;
        document.getElementById('clinicActive').checked = clinic.active !== false;
        
    } catch (error) {
        console.error('Erro ao carregar clínica:', error);
        showAlert('Erro ao carregar dados da clínica', 'error');
    }
}

// Salvar clínica
async function saveClinic(event) {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    
    try {
        const token = getAuthToken();
        if (!token) return;
        
        const clinicId = document.getElementById('clinicId').value;
        
        // Preparar dados
        const addressParts = document.getElementById('clinicAddress').value.split(',');
        
        const data = {
            name: document.getElementById('clinicName').value,
            description: document.getElementById('clinicDescription').value,
            contact: {
                whatsapp: document.getElementById('clinicWhatsApp').value.replace(/\D/g, ''),
                phone: document.getElementById('clinicPhone').value.replace(/\D/g, ''),
                email: document.getElementById('clinicEmail').value
            },
            address: {
                street: addressParts[0] || document.getElementById('clinicAddress').value,
                city: document.getElementById('clinicCity').value,
                state: document.getElementById('clinicState').value.toUpperCase()
            },
            workingHours: {
                start: parseInt(document.getElementById('clinicStartHour').value),
                end: parseInt(document.getElementById('clinicEndHour').value),
                formatted: `Seg-Sex: ${document.getElementById('clinicStartHour').value}h às ${document.getElementById('clinicEndHour').value}h`
            },
            features: {
                onlineBooking: true,
                whatsappBot: document.getElementById('clinicWhatsAppBot').checked,
                telemedicine: false,
                electronicRecords: false
            },
            active: document.getElementById('clinicActive').checked
        };
        
        const url = clinicId ? 
            `${window.API_BASE}/clinics/${clinicId}` : 
            `${window.API_BASE}/clinics`;
        
        const method = clinicId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Erro ao salvar clínica');
        }
        
        showAlert(clinicId ? 'Clínica atualizada com sucesso!' : 'Clínica cadastrada com sucesso!', 'success');
        
        // Mostrar URL pública se for criação nova
        if (!clinicId && result.data?.fullPublicUrl) {
            setTimeout(() => {
                showAlert(`🌐 Página pública: ${result.data.fullPublicUrl}`, 'info');
            }, 1000);
        }
        
        closeClinicModalFunc();
        await loadClinics();
        
    } catch (error) {
        console.error('Erro:', error);
        showAlert(error.message || 'Erro ao salvar clínica', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Verificar autenticação (usa função global do dashboard.js)
// Helper que usa window.getAuthToken se disponível, senão fallback
function getAuthToken() {
    if (typeof window.getAuthToken === 'function') {
        return window.getAuthToken();
    }
    // Fallback se não existir
    try {
        const auth = localStorage.getItem('atenmed_auth');
        if (!auth) {
            window.location.href = '/site/login.html';
            return null;
        }
        const authData = JSON.parse(auth);
        return authData.token;
    } catch (error) {
        window.location.href = '/site/login.html';
        return null;
    }
}

// Usar função showAlert do dashboard.js se disponível (evitar recursão)
function showAlert(message, type = 'success') {
    // Verificar se existe função global E não é a própria função local
    if (typeof window.showAlert === 'function' && window.showAlert !== showAlert) {
        return window.showAlert(message, type);
    }
    // Fallback para alert simples
    alert(message);
}

// Carregar clínicas
async function loadClinics() {
    const content = document.getElementById('clinicsContent');
    if (!content) return;
    
    content.innerHTML = '<div class="loading"><div class="spinner"></div>Carregando clínicas...</div>';
    
    try {
        const token = getAuthToken();
        if (!token) {
            content.innerHTML = '<div class="loading" style="color: var(--danger);">Erro de autenticação</div>';
            return;
        }

        const response = await fetch(`${window.API_BASE}/clinics`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar clínicas');
        }

        const result = await response.json();
        clinics = result.data || result || [];
        
        renderClinics();
        updateClinicsStats();
        
    } catch (error) {
        console.error('Erro:', error);
        content.innerHTML = '<div class="loading" style="color: var(--danger);">Erro ao carregar clínicas</div>';
    }
}

// Renderizar clínicas
function renderClinics() {
    const content = document.getElementById('clinicsContent');
    if (!content) return;
    
    if (clinics.length === 0) {
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🏥</div>
                <h3>Nenhuma clínica cadastrada</h3>
                <p>Comece adicionando sua primeira clínica</p>
                <button class="btn btn-primary" onclick="openClinicModal()">
                    <i class="fas fa-plus"></i>
                    Cadastrar Primeira Clínica
                </button>
            </div>
        `;
        return;
    }
    
    const table = `
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>WhatsApp</th>
                        <th>Email</th>
                        <th>Cidade/Estado</th>
                        <th>Status</th>
                        <th>Página Pública</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${clinics.map(clinic => {
                        const slug = clinic.slug || clinic.name?.toLowerCase().replace(/\s+/g, '-');
                        const publicUrl = `/clinica/${slug}`;
                        return `
                            <tr>
                                <td><strong>${clinic.name}</strong></td>
                                <td>${clinic.contact?.whatsapp ? formatPhone(clinic.contact.whatsapp) : '-'}</td>
                                <td>${clinic.contact?.email || '-'}</td>
                                <td>${clinic.address?.city || ''}${clinic.address?.city && clinic.address?.state ? '/' : ''}${clinic.address?.state || ''}</td>
                                <td>
                                    <span class="badge badge-${clinic.active ? 'success' : 'danger'}">
                                        ${clinic.active ? 'Ativa' : 'Inativa'}
                                    </span>
                                </td>
                                <td>
                                    <a href="${publicUrl}" target="_blank" class="btn btn-secondary" style="padding: 0.25rem 0.75rem; font-size: 0.875rem;">
                                        <i class="fas fa-external-link-alt"></i>
                                        Ver Página
                                    </a>
                                </td>
                                <td>
                                    <button class="btn btn-secondary" onclick="openClinicModal('${clinic._id}')" style="margin-right: 0.5rem;">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-danger" onclick="toggleClinicStatus('${clinic._id}', ${!clinic.active})">
                                        <i class="fas fa-${clinic.active ? 'ban' : 'check'}"></i>
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

// Atualizar estatísticas de clínicas
function updateClinicsStats() {
    const total = clinics.length;
    const active = clinics.filter(c => c.active !== false).length;
    const whatsappEnabled = clinics.filter(c => c.features?.whatsappBot !== false).length;
    
    const totalEl = document.getElementById('totalClinics');
    const activeEl = document.getElementById('activeClinics');
    const whatsappEl = document.getElementById('whatsappEnabled');
    
    if (totalEl) totalEl.textContent = total;
    if (activeEl) activeEl.textContent = active;
    if (whatsappEl) whatsappEl.textContent = whatsappEnabled;
}

// Formatar telefone
function formatPhone(phone) {
    if (!phone) return '-';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
    } else if (cleaned.length === 10) {
        return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
    }
    return phone;
}

// Toggle status da clínica
window.toggleClinicStatus = async function(clinicId, newStatus) {
    if (!confirm(`Deseja ${newStatus ? 'ativar' : 'desativar'} esta clínica?`)) {
        return;
    }
    
    try {
        const token = getAuthToken();
        if (!token) return;
        
        const response = await fetch(`${window.API_BASE}/clinics/${clinicId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ active: newStatus, isActive: newStatus })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Erro ao atualizar clínica');
        }
        
        showAlert(`Clínica ${newStatus ? 'ativada' : 'desativada'} com sucesso!`, 'success');
        await loadClinics();
        
    } catch (error) {
        console.error('Erro:', error);
        showAlert(error.message || 'Erro ao atualizar clínica', 'error');
    }
};

