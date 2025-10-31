/**
 * AtenMed - Doctors Manager
 * Gerenciamento de médicos integrado ao dashboard
 */

// API Base URL (usar global se disponível, sem redeclarar)
let API_BASE;
if (typeof window.API_BASE !== 'undefined') {
    API_BASE = window.API_BASE;
} else {
    API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:3000/api'
        : (window.location.hostname === 'atenmed.com.br' || window.location.hostname === 'www.atenmed.com.br')
        ? 'https://atenmed.com.br/api'
        : '/api';
}

// Estado
let doctors = [];
let clinics = [];
let specialties = [];

// Verificar autenticação (usa função global do dashboard.js)
// Não redefinir se já existe para evitar recursão
let getAuthToken;
if (typeof window.getAuthToken === 'function') {
    // Usar a função global diretamente
    getAuthToken = function() {
        return window.getAuthToken();
    };
} else {
    // Fallback se não existir
    getAuthToken = function() {
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
    };
}

// Usar função showAlert do dashboard.js se disponível
function showAlert(message, type = 'success') {
    if (typeof window.showAlert === 'function') {
        return window.showAlert(message, type);
    }
    alert(message);
}

// Fetch JSON helper
async function fetchJSON(url, opts = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(opts.headers || {})
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(url, { 
        headers,
        credentials: 'include',
        ...opts 
    });
    
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Erro na requisição');
    }
    return res.json();
}

// Carregar clínicas
async function loadClinicsForDoctors() {
    try {
        const data = await fetchJSON(`${API_BASE}/clinics`);
        clinics = data.data || data || [];
        
        const select = document.getElementById('doctorClinic');
        if (select) {
            select.innerHTML = '<option value="">Selecione uma clínica...</option>' + 
                clinics.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
        }
    } catch (error) {
        console.error('Erro ao carregar clínicas:', error);
        showAlert('Erro ao carregar clínicas', 'error');
    }
}

// Carregar especialidades baseado na clínica selecionada
async function loadSpecialtiesForDoctor() {
    const clinicId = document.getElementById('doctorClinic')?.value;
    const select = document.getElementById('doctorSpecialties');
    
    if (!select) return;
    
    if (!clinicId) {
        select.innerHTML = '<option value="">Selecione uma clínica primeiro</option>';
        return;
    }
    
    try {
        const data = await fetchJSON(`${API_BASE}/specialties?clinicId=${clinicId}`);
        specialties = data.data || data || [];
        
        select.innerHTML = specialties.map(s => 
            `<option value="${s._id}">${s.name}</option>`
        ).join('');
    } catch (error) {
        console.error('Erro ao carregar especialidades:', error);
        select.innerHTML = '<option value="">Erro ao carregar especialidades</option>';
    }
}

// Carregar médicos
async function loadDoctors() {
    const list = document.getElementById('doctorsList');
    if (!list) return;
    
    list.innerHTML = '<div class="loading"><div class="spinner"></div>Carregando médicos...</div>';
    
    try {
        const data = await fetchJSON(`${API_BASE}/doctors`);
        doctors = data.data || data || [];
        
        if (doctors.length === 0) {
            list.innerHTML = '<div class="loading">Nenhum médico cadastrado ainda</div>';
            return;
        }
        
        const rows = doctors.map(d => `
            <tr>
                <td><strong>${d.name}</strong></td>
                <td>${d.email}</td>
                <td>${d.clinic?.name || '-'}</td>
                <td>${(d.specialties || []).map(s => s.name).join(', ') || '-'}</td>
                <td><code style="font-size: 0.875rem;">${d.googleCalendarId || '-'}</code></td>
                <td>
                    <span class="badge badge-${d.active ? 'success' : 'danger'}">
                        ${d.active ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td class="actions">
                    <button class="btn btn-secondary" onclick="editDoctor('${d._id}')" style="margin-right: 0.5rem;">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-${d.active ? 'warning' : 'success'}" onclick="toggleDoctor('${d._id}', ${d.active})">
                        <i class="fas fa-${d.active ? 'ban' : 'check'}"></i>
                        ${d.active ? 'Desativar' : 'Ativar'}
                    </button>
                </td>
            </tr>
        `).join('');
        
        list.innerHTML = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Clínica</th>
                            <th>Especialidades</th>
                            <th>Google Calendar</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Erro ao carregar médicos:', error);
        list.innerHTML = '<div class="loading" style="color: var(--danger);">Erro ao carregar médicos</div>';
    }
}

// Editar médico
window.editDoctor = async function(id) {
    try {
        const data = await fetchJSON(`${API_BASE}/doctors?active=true`);
        const doc = data.data?.find(x => x._id === id) || doctors.find(x => x._id === id);
        
        if (!doc) {
            showAlert('Médico não encontrado', 'error');
            return;
        }
        
        document.getElementById('doctorId').value = doc._id;
        document.getElementById('doctorName').value = doc.name || '';
        document.getElementById('doctorEmail').value = doc.email || '';
        document.getElementById('doctorPhone').value = doc.phone || '';
        document.getElementById('doctorCrmNumber').value = doc.crm?.number || '';
        document.getElementById('doctorCrmState').value = doc.crm?.state || '';
        document.getElementById('doctorClinic').value = doc.clinic?._id || '';
        
        await loadSpecialtiesForDoctor();
        
        // Selecionar especialidades
        const sel = document.getElementById('doctorSpecialties');
        if (sel) {
            const values = (doc.specialties || []).map(s => s._id);
            Array.from(sel.options).forEach(o => {
                o.selected = values.includes(o.value);
            });
        }
        
        document.getElementById('doctorGoogleCalendarId').value = doc.googleCalendarId || '';
        document.getElementById('doctorSlotDuration').value = doc.slotDuration || 60;
        document.getElementById('doctorWorkingDays').value = (doc.workingDays || []).join(',');
        document.getElementById('doctorStartHour').value = doc.workingHours?.start ?? 9;
        document.getElementById('doctorEndHour').value = doc.workingHours?.end ?? 18;
        
        // Scroll para o topo do formulário
        document.getElementById('doctors').scrollIntoView({ behavior: 'smooth', block: 'start' });
        
    } catch (error) {
        console.error('Erro ao carregar médico:', error);
        showAlert('Erro ao carregar dados do médico', 'error');
    }
};

// Toggle status do médico
window.toggleDoctor = async function(id, active) {
    if (!confirm(`Deseja ${active ? 'desativar' : 'ativar'} este médico?`)) {
        return;
    }
    
    try {
        await fetchJSON(`${API_BASE}/doctors/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ active: !active })
        });
        
        showAlert(`Médico ${active ? 'desativado' : 'ativado'} com sucesso!`, 'success');
        await loadDoctors();
    } catch (error) {
        console.error('Erro ao atualizar médico:', error);
        showAlert('Erro ao atualizar status do médico', 'error');
    }
};

// Configurar event listeners
function setupDoctorsListeners() {
    // Reload button
    const reloadBtn = document.getElementById('doctorReloadBtn');
    if (reloadBtn) {
        reloadBtn.addEventListener('click', loadDoctors);
    }
    
    // Reset button
    const resetBtn = document.getElementById('doctorResetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            document.getElementById('doctorForm')?.reset();
            document.getElementById('doctorId').value = '';
        });
    }
    
    // Clinic change - carregar especialidades
    const clinicSelect = document.getElementById('doctorClinic');
    if (clinicSelect) {
        clinicSelect.addEventListener('change', loadSpecialtiesForDoctor);
    }
    
    // Form submit
    const form = document.getElementById('doctorForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
            
            try {
                const id = document.getElementById('doctorId').value;
                const payload = {
                    name: document.getElementById('doctorName').value,
                    email: document.getElementById('doctorEmail').value,
                    phone: document.getElementById('doctorPhone').value,
                    crm: {
                        number: document.getElementById('doctorCrmNumber').value,
                        state: document.getElementById('doctorCrmState').value
                    },
                    clinic: document.getElementById('doctorClinic').value,
                    specialties: Array.from(document.getElementById('doctorSpecialties').selectedOptions)
                        .map(o => o.value),
                    googleCalendarId: document.getElementById('doctorGoogleCalendarId').value,
                    slotDuration: parseInt(document.getElementById('doctorSlotDuration').value || '60', 10),
                    workingDays: document.getElementById('doctorWorkingDays').value
                        .split(',')
                        .map(v => parseInt(v.trim(), 10))
                        .filter(v => !isNaN(v)),
                    workingHours: {
                        start: parseInt(document.getElementById('doctorStartHour').value, 10),
                        end: parseInt(document.getElementById('doctorEndHour').value, 10)
                    }
                };
                
                const method = id ? 'PUT' : 'POST';
                const url = id ? `${API_BASE}/doctors/${id}` : `${API_BASE}/doctors`;
                
                await fetchJSON(url, {
                    method,
                    body: JSON.stringify(payload)
                });
                
                showAlert(id ? 'Médico atualizado com sucesso!' : 'Médico cadastrado com sucesso!', 'success');
                
                document.getElementById('doctorForm').reset();
                document.getElementById('doctorId').value = '';
                await loadDoctors();
                
            } catch (error) {
                console.error('Erro ao salvar médico:', error);
                showAlert(error.message || 'Erro ao salvar médico', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
    
    // Carregar quando a seção for aberta
    const doctorsNav = document.querySelector('[data-section="doctors"]');
    if (doctorsNav) {
        doctorsNav.addEventListener('click', () => {
            setTimeout(() => {
                loadClinicsForDoctors();
                loadDoctors();
            }, 100);
        });
    }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupDoctorsListeners);
} else {
    setupDoctorsListeners();
}

