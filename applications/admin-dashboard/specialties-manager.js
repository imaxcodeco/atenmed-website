/**
 * AtenMed - Specialties Manager
 * Gerenciamento de especialidades integrado ao dashboard
 */

// API Base URL
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000/api'
    : (window.location.hostname === 'atenmed.com.br' || window.location.hostname === 'www.atenmed.com.br')
    ? 'https://atenmed.com.br/api'
    : '/api';

// Estado
let specialties = [];
let clinics = [];

// Verificar autenticação (usa função do dashboard.js se disponível)
function getAuthToken() {
    if (typeof window.getAuthToken === 'function') {
        return window.getAuthToken();
    }
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
async function loadClinicsForSpecialties() {
    try {
        const data = await fetchJSON(`${API_BASE}/clinics`);
        clinics = data.data || data || [];
        
        const select = document.getElementById('specialtyClinic');
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
async function loadSpecialties() {
    const clinicId = document.getElementById('specialtyClinic')?.value;
    const list = document.getElementById('specialtiesList');
    
    if (!list) return;
    
    if (!clinicId) {
        list.innerHTML = '<div class="loading">Selecione uma clínica para ver as especialidades</div>';
        return;
    }
    
    list.innerHTML = '<div class="loading"><div class="spinner"></div>Carregando especialidades...</div>';
    
    try {
        const data = await fetchJSON(`${API_BASE}/specialties?clinicId=${clinicId}`);
        specialties = data.data || data || [];
        
        if (specialties.length === 0) {
            list.innerHTML = '<div class="loading">Nenhuma especialidade cadastrada para esta clínica</div>';
            return;
        }
        
        const rows = specialties.map(s => `
            <tr>
                <td><strong>${s.name}</strong></td>
                <td>${s.description || '-'}</td>
                <td>
                    <span style="display:inline-block;width:20px;height:20px;background:${s.color};border:1px solid #e2e8f0;border-radius:4px;vertical-align:middle;margin-right:8px;"></span>
                    ${s.color}
                </td>
                <td style="font-size: 1.25rem;">${s.icon || '🏥'}</td>
                <td>
                    <span class="badge badge-${s.active ? 'success' : 'danger'}">
                        ${s.active ? 'Ativa' : 'Inativa'}
                    </span>
                </td>
                <td class="actions">
                    <button class="btn btn-secondary" onclick="editSpecialty('${s._id}')" style="margin-right: 0.5rem;">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-${s.active ? 'warning' : 'success'}" onclick="toggleSpecialty('${s._id}', ${s.active})">
                        <i class="fas fa-${s.active ? 'ban' : 'check'}"></i>
                        ${s.active ? 'Desativar' : 'Ativar'}
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
                            <th>Descrição</th>
                            <th>Cor</th>
                            <th>Ícone</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Erro ao carregar especialidades:', error);
        list.innerHTML = '<div class="loading" style="color: var(--danger);">Erro ao carregar especialidades</div>';
    }
}

// Editar especialidade
window.editSpecialty = async function(id) {
    try {
        const clinicId = document.getElementById('specialtyClinic')?.value;
        if (!clinicId) {
            showAlert('Por favor, selecione uma clínica primeiro', 'error');
            return;
        }
        
        const data = await fetchJSON(`${API_BASE}/specialties?clinicId=${clinicId}`);
        const spec = data.data?.find(x => x._id === id) || specialties.find(x => x._id === id);
        
        if (!spec) {
            showAlert('Especialidade não encontrada', 'error');
            return;
        }
        
        document.getElementById('specialtyId').value = spec._id;
        document.getElementById('specialtyClinic').value = spec.clinic || clinicId;
        document.getElementById('specialtyName').value = spec.name || '';
        document.getElementById('specialtyDescription').value = spec.description || '';
        document.getElementById('specialtyColor').value = spec.color || '#45a7b1';
        document.getElementById('specialtyIcon').value = spec.icon || '🏥';
        
        // Scroll para o topo do formulário
        document.getElementById('specialties').scrollIntoView({ behavior: 'smooth', block: 'start' });
        
    } catch (error) {
        console.error('Erro ao carregar especialidade:', error);
        showAlert('Erro ao carregar dados da especialidade', 'error');
    }
};

// Toggle status da especialidade
window.toggleSpecialty = async function(id, active) {
    if (!confirm(`Deseja ${active ? 'desativar' : 'ativar'} esta especialidade?`)) {
        return;
    }
    
    try {
        await fetchJSON(`${API_BASE}/specialties/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ active: !active })
        });
        
        showAlert(`Especialidade ${active ? 'desativada' : 'ativada'} com sucesso!`, 'success');
        await loadSpecialties();
    } catch (error) {
        console.error('Erro ao atualizar especialidade:', error);
        showAlert('Erro ao atualizar status da especialidade', 'error');
    }
};

// Configurar event listeners
function setupSpecialtiesListeners() {
    // Reload button
    const reloadBtn = document.getElementById('specialtyReloadBtn');
    if (reloadBtn) {
        reloadBtn.addEventListener('click', loadSpecialties);
    }
    
    // Reset button
    const resetBtn = document.getElementById('specialtyResetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            document.getElementById('specialtyForm')?.reset();
            document.getElementById('specialtyId').value = '';
            document.getElementById('specialtyColor').value = '#45a7b1';
            document.getElementById('specialtyIcon').value = '🏥';
        });
    }
    
    // Clinic change - carregar especialidades
    const clinicSelect = document.getElementById('specialtyClinic');
    if (clinicSelect) {
        clinicSelect.addEventListener('change', loadSpecialties);
    }
    
    // Form submit
    const form = document.getElementById('specialtyForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
            
            try {
                const id = document.getElementById('specialtyId').value;
                const payload = {
                    clinic: document.getElementById('specialtyClinic').value,
                    name: document.getElementById('specialtyName').value,
                    description: document.getElementById('specialtyDescription').value,
                    color: document.getElementById('specialtyColor').value,
                    icon: document.getElementById('specialtyIcon').value
                };
                
                const method = id ? 'PUT' : 'POST';
                const url = id ? `${API_BASE}/specialties/${id}` : `${API_BASE}/specialties`;
                
                await fetchJSON(url, {
                    method,
                    body: JSON.stringify(payload)
                });
                
                showAlert(id ? 'Especialidade atualizada com sucesso!' : 'Especialidade cadastrada com sucesso!', 'success');
                
                document.getElementById('specialtyForm').reset();
                document.getElementById('specialtyId').value = '';
                document.getElementById('specialtyColor').value = '#45a7b1';
                document.getElementById('specialtyIcon').value = '🏥';
                await loadSpecialties();
                
            } catch (error) {
                console.error('Erro ao salvar especialidade:', error);
                showAlert(error.message || 'Erro ao salvar especialidade', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
    
    // Carregar quando a seção for aberta
    const specialtiesNav = document.querySelector('[data-section="specialties"]');
    if (specialtiesNav) {
        specialtiesNav.addEventListener('click', () => {
            setTimeout(() => {
                loadClinicsForSpecialties();
                loadSpecialties();
            }, 100);
        });
    }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupSpecialtiesListeners);
} else {
    setupSpecialtiesListeners();
}

