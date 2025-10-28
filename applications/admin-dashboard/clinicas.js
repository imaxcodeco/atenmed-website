// API Base URL
const API_BASE = window.location.hostname === 'localhost' ? 
    'http://localhost:3000/api' : 
    'https://atenmed.com.br/api';

// Estado
let clinics = [];
let editingClinicId = null;

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    loadClinics();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Botão nova clínica
    const btnNovaClinica = document.getElementById('btnNovaClinica');
    if (btnNovaClinica) {
        btnNovaClinica.addEventListener('click', () => openModal());
    }
    
    // Botão primeira clínica (empty state)
    const btnPrimeiraClinica = document.getElementById('btnPrimeiraClinica');
    if (btnPrimeiraClinica) {
        btnPrimeiraClinica.addEventListener('click', () => openModal());
    }
    
    // Botão fechar modal
    const btnCloseModal = document.getElementById('btnCloseModal');
    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', closeModal);
    }
    
    // Formulário
    const clinicForm = document.getElementById('clinicForm');
    if (clinicForm) {
        clinicForm.addEventListener('submit', saveClinic);
    }
    
    // Modal - fechar ao clicar fora
    const modal = document.getElementById('clinicModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'clinicModal') {
                closeModal();
            }
        });
    }
    
    // Delegação de eventos para botões dos cards (gerados dinamicamente)
    const clinicsContainer = document.getElementById('clinicsContainer');
    if (clinicsContainer) {
        clinicsContainer.addEventListener('click', (e) => {
            const target = e.target;
            
            // Botão editar
            if (target.classList.contains('btn-edit')) {
                const clinicId = target.dataset.clinicId;
                editClinic(clinicId);
            }
            
            // Botão toggle
            if (target.classList.contains('btn-toggle')) {
                const clinicId = target.dataset.clinicId;
                const newStatus = target.dataset.newStatus === 'true';
                toggleClinic(clinicId, newStatus);
            }
            
            // Botão delete
            if (target.classList.contains('btn-delete')) {
                const clinicId = target.dataset.clinicId;
                const clinicName = target.dataset.clinicName;
                deleteClinic(clinicId, clinicName);
            }
            
            // Botão Meta (configurar no WhatsApp)
            if (target.classList.contains('btn-meta')) {
                const clinicId = target.dataset.clinicId;
                showMetaSetup(clinicId);
            }
        });
    }
}

// Mostrar configuração do Meta WhatsApp
async function showMetaSetup(clinicId) {
    try {
        const token = getAuthToken();
        if (!token) return;
        
        const response = await fetch(`${API_BASE}/clinics/${clinicId}/meta-setup`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Erro ao carregar configuração');
        }
        
        const data = await response.json();
        const setup = data.data;
        
        // Criar modal de instruções
        const modalHTML = `
            <div class="modal show" id="metaModal">
                <div class="modal-content" style="max-width: 800px;">
                    <div class="modal-header">
                        <h2 class="modal-title">⚙️ Configurar no Meta WhatsApp</h2>
                        <button class="close-modal" onclick="document.getElementById('metaModal').remove()">&times;</button>
                    </div>
                    
                    <div style="padding: 20px 0;">
                        <h3 style="color: #1877f2; margin-bottom: 10px;">📱 ${setup.clinic.name}</h3>
                        <p style="color: #666; margin-bottom: 20px;">Número: ${setup.clinic.whatsapp}</p>
                        
                        ${setup.registrationStatus.registered ? 
                            `<div style="background: #d4edda; color: #155724; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                                ✅ <strong>Número já registrado no Meta!</strong>
                            </div>` : 
                            `<div style="background: #fff3cd; color: #856404; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                                ⚠️ Número precisa ser registrado no Meta
                            </div>`
                        }
                        
                        <h4 style="margin: 20px 0 10px;">🔗 Links Rápidos:</h4>
                        <div style="display: grid; gap: 10px; margin-bottom: 20px;">
                            <a href="${setup.quickConfig.links.metaDeveloper}" target="_blank" 
                               style="background: #1877f2; color: white; padding: 12px; border-radius: 8px; text-decoration: none; display: block;">
                                🔗 Abrir Meta Developer Console
                            </a>
                        </div>
                        
                        <h4 style="margin: 20px 0 10px;">📋 Configurações para Copiar:</h4>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <p><strong>Número (formatado):</strong></p>
                            <div style="background: white; padding: 10px; border-radius: 4px; font-family: monospace; margin: 5px 0;">
                                ${setup.quickConfig.phoneNumber}
                            </div>
                            <button onclick="navigator.clipboard.writeText('${setup.quickConfig.phoneNumber}')" 
                                    style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 5px;">
                                📋 Copiar Número
                            </button>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <p><strong>Webhook URL:</strong></p>
                            <div style="background: white; padding: 10px; border-radius: 4px; font-family: monospace; margin: 5px 0; word-break: break-all;">
                                ${setup.quickConfig.webhook.callbackUrl}
                            </div>
                            <button onclick="navigator.clipboard.writeText('${setup.quickConfig.webhook.callbackUrl}')" 
                                    style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 5px;">
                                📋 Copiar URL
                            </button>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                            <p><strong>Verify Token:</strong></p>
                            <div style="background: white; padding: 10px; border-radius: 4px; font-family: monospace; margin: 5px 0;">
                                ${setup.quickConfig.webhook.verifyToken}
                            </div>
                            <button onclick="navigator.clipboard.writeText('${setup.quickConfig.webhook.verifyToken}')" 
                                    style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 5px;">
                                📋 Copiar Token
                            </button>
                        </div>
                        
                        <h4 style="margin: 20px 0 10px;">📝 Passo a Passo:</h4>
                        <ol style="line-height: 1.8; color: #333;">
                            ${setup.instructions.steps.map(step => `
                                <li style="margin: 10px 0;">
                                    <strong>${step.title}</strong><br>
                                    <span style="color: #666;">${step.description}</span>
                                    ${step.link ? `<br><a href="${step.link}" target="_blank" style="color: #1877f2;">Abrir link →</a>` : ''}
                                </li>
                            `).join('')}
                        </ol>
                        
                        <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin-top: 20px;">
                            <p style="margin: 0;">⏱️ <strong>Tempo estimado:</strong> ${setup.instructions.estimatedTime}</p>
                            <p style="margin: 10px 0 0;">💡 <strong>Dificuldade:</strong> ${setup.instructions.difficulty}</p>
                        </div>
                    </div>
                    
                    <button onclick="document.getElementById('metaModal').remove()" 
                            style="background: #6c757d; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; width: 100%; margin-top: 20px;">
                        Fechar
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar configuração do Meta: ' + error.message);
    }
}

// Verificar autenticação
function getAuthToken() {
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

// Carregar clínicas
async function loadClinics() {
    try {
        const token = getAuthToken();
        if (!token) return;

        const response = await fetch(`${API_BASE}/clinics`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar clínicas');
        }

        const data = await response.json();
        clinics = data.data || data; // Suporta ambos os formatos de resposta
        renderClinics();
        updateStats();
    } catch (error) {
        console.error('Erro:', error);
        showError('Erro ao carregar clínicas');
    }
}

// Renderizar clínicas
function renderClinics() {
    const container = document.getElementById('clinicsContainer');
    const emptyState = document.getElementById('emptyState');

    if (clinics.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    container.style.display = 'grid';
    emptyState.style.display = 'none';
    container.classList.remove('loading');

    container.innerHTML = clinics.map(clinic => `
        <div class="clinic-card ${!clinic.active ? 'inactive' : ''}">
            <div class="clinic-header">
                <div class="clinic-name">${clinic.name}</div>
                <div class="clinic-status ${clinic.active ? 'active' : 'inactive'}">
                    ${clinic.active ? 'Ativa' : 'Inativa'}
                </div>
            </div>

            <div class="clinic-info">
                ${clinic.contact?.whatsapp ? `
                    <div class="clinic-whatsapp">
                        📱 ${formatPhone(clinic.contact.whatsapp)}
                    </div>
                ` : ''}

                ${clinic.contact?.email ? `
                    <div class="clinic-info-item">
                        <i>✉️</i>
                        <span>${clinic.contact.email}</span>
                    </div>
                ` : ''}

                ${clinic.contact?.phone ? `
                    <div class="clinic-info-item">
                        <i>📞</i>
                        <span>${formatPhone(clinic.contact.phone)}</span>
                    </div>
                ` : ''}

                ${clinic.address?.city && clinic.address?.state ? `
                    <div class="clinic-info-item">
                        <i>📍</i>
                        <span>${clinic.address.city}/${clinic.address.state}</span>
                    </div>
                ` : ''}

                ${clinic.hours?.start && clinic.hours?.end ? `
                    <div class="clinic-info-item">
                        <i>🕒</i>
                        <span>${clinic.hours.start}h às ${clinic.hours.end}h</span>
                    </div>
                ` : ''}

                ${clinic.whatsappBot?.enabled ? `
                    <div class="clinic-info-item">
                        <i>🤖</i>
                        <span>Bot WhatsApp Ativo</span>
                    </div>
                ` : ''}
            </div>

            <div class="clinic-actions">
                <button class="btn btn-meta" data-clinic-id="${clinic._id}" title="Configurar no Meta WhatsApp">
                    ⚙️ Meta
                </button>
                <button class="btn btn-edit" data-clinic-id="${clinic._id}">
                    Editar
                </button>
                <button class="btn btn-toggle" data-clinic-id="${clinic._id}" data-new-status="${!clinic.active}">
                    ${clinic.active ? 'Desativar' : 'Ativar'}
                </button>
                <button class="btn btn-delete" data-clinic-id="${clinic._id}" data-clinic-name="${clinic.name}">
                    Excluir
                </button>
            </div>
        </div>
    `).join('');
}

// Atualizar estatísticas
function updateStats() {
    document.getElementById('totalClinics').textContent = clinics.length;
    document.getElementById('activeClinics').textContent = 
        clinics.filter(c => c.active).length;
    document.getElementById('whatsappEnabled').textContent = 
        clinics.filter(c => c.whatsappBot?.enabled).length;
}

// Formatar telefone
function formatPhone(phone) {
    if (!phone) return '';
    const clean = phone.replace(/\D/g, '');
    
    // Formato: (11) 98765-4321
    if (clean.length === 11) {
        return `(${clean.substr(0, 2)}) ${clean.substr(2, 5)}-${clean.substr(7)}`;
    }
    // Formato: (11) 3333-4444
    if (clean.length === 10) {
        return `(${clean.substr(0, 2)}) ${clean.substr(2, 4)}-${clean.substr(6)}`;
    }
    
    return phone;
}

// Abrir modal
function openModal(clinicId = null) {
    console.log('Abrindo modal para clínica:', clinicId);
    const modal = document.getElementById('clinicModal');
    const form = document.getElementById('clinicForm');
    const title = document.getElementById('modalTitle');

    if (!modal) {
        console.error('Modal não encontrado!');
        return;
    }

    form.reset();
    editingClinicId = clinicId;

    if (clinicId) {
        title.textContent = 'Editar Clínica';
        loadClinicData(clinicId);
    } else {
        title.textContent = 'Nova Clínica';
        document.getElementById('clinicId').value = '';
    }

    modal.classList.add('show');
    console.log('Modal aberto');
}

// Fechar modal
function closeModal() {
    const modal = document.getElementById('clinicModal');
    modal.classList.remove('show');
    editingClinicId = null;
}

// Carregar dados da clínica para edição
function loadClinicData(clinicId) {
    const clinic = clinics.find(c => c._id === clinicId);
    if (!clinic) return;

    document.getElementById('clinicId').value = clinic._id;
    document.getElementById('clinicName').value = clinic.name || '';
    document.getElementById('clinicWhatsApp').value = clinic.contact?.whatsapp || '';
    document.getElementById('clinicPhone').value = clinic.contact?.phone || '';
    document.getElementById('clinicEmail').value = clinic.contact?.email || '';
    document.getElementById('clinicAddress').value = clinic.address?.street || '';
    document.getElementById('clinicCity').value = clinic.address?.city || '';
    document.getElementById('clinicState').value = clinic.address?.state || '';
    document.getElementById('clinicStartHour').value = clinic.hours?.start || 8;
    document.getElementById('clinicEndHour').value = clinic.hours?.end || 18;
    document.getElementById('clinicWhatsAppBot').checked = clinic.whatsappBot?.enabled !== false;
    document.getElementById('clinicActive').checked = clinic.active !== false;
}

// Salvar clínica
async function saveClinic(event) {
    event.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Salvando...';

    try {
        const token = getAuthToken();
        if (!token) return;
        
        const clinicId = document.getElementById('clinicId').value;

        const data = {
            name: document.getElementById('clinicName').value,
            contact: {
                whatsapp: document.getElementById('clinicWhatsApp').value.replace(/\D/g, ''),
                phone: document.getElementById('clinicPhone').value.replace(/\D/g, ''),
                email: document.getElementById('clinicEmail').value
            },
            address: {
                street: document.getElementById('clinicAddress').value,
                city: document.getElementById('clinicCity').value,
                state: document.getElementById('clinicState').value.toUpperCase()
            },
            hours: {
                start: parseInt(document.getElementById('clinicStartHour').value),
                end: parseInt(document.getElementById('clinicEndHour').value)
            },
            whatsappBot: {
                enabled: document.getElementById('clinicWhatsAppBot').checked
            },
            active: document.getElementById('clinicActive').checked
        };

        const url = clinicId ? 
            `${API_BASE}/clinics/${clinicId}` : 
            `${API_BASE}/clinics`;

        const method = clinicId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao salvar clínica');
        }

        showSuccess(clinicId ? 'Clínica atualizada!' : 'Clínica cadastrada!');
        closeModal();
        await loadClinics();

    } catch (error) {
        console.error('Erro:', error);
        showError(error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Salvar Clínica';
    }
}

// Editar clínica
function editClinic(clinicId) {
    console.log('Editando clínica:', clinicId);
    openModal(clinicId);
}

// Toggle status da clínica
async function toggleClinic(clinicId, newStatus) {
    try {
        const token = getAuthToken();
        if (!token) return;
        
        const response = await fetch(`${API_BASE}/clinics/${clinicId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ active: newStatus })
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar status');
        }

        showSuccess(`Clínica ${newStatus ? 'ativada' : 'desativada'}!`);
        await loadClinics();

    } catch (error) {
        console.error('Erro:', error);
        showError(error.message);
    }
}

// Excluir clínica
async function deleteClinic(clinicId, clinicName) {
    if (!confirm(`Tem certeza que deseja excluir a clínica "${clinicName}"?\n\nEsta ação não pode ser desfeita!`)) {
        return;
    }

    try {
        const token = getAuthToken();
        if (!token) return;
        
        const response = await fetch(`${API_BASE}/clinics/${clinicId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao excluir clínica');
        }

        showSuccess('Clínica excluída!');
        await loadClinics();

    } catch (error) {
        console.error('Erro:', error);
        showError(error.message);
    }
}

// Mostrar mensagem de sucesso
function showSuccess(message) {
    // Implementação simples - pode ser melhorada com toast notifications
    alert(message);
}

// Mostrar mensagem de erro
function showError(message) {
    alert('Erro: ' + message);
}

