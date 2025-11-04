/**
 * AtenMed - Portal da Clínica
 * JavaScript para gerenciamento do dashboard do cliente
 */

let currentClinic = null;
let currentUser = null;

// Helper para obter token do localStorage
function getAuthToken() {
  const authData = localStorage.getItem('atenmed_auth');
  if (!authData) return null;
  return JSON.parse(authData).token;
}

// Verificar autenticação ao carregar
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
});

// Verificar se usuário está autenticado
async function checkAuth() {
  // Buscar autenticação do localStorage
  const authData = localStorage.getItem('atenmed_auth');

  if (!authData) {
    window.location.href = '/login.html?redirect=/portal';
    return;
  }

  try {
    const authObj = JSON.parse(authData);
    const token = authObj.token;

    // Buscar dados do usuário
    const userResponse = await fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Sessão inválida');
    }

    const userData = await userResponse.json();
    currentUser = userData.data;

    // Atualizar interface com nome do usuário
    const initials =
      currentUser.nome
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || '??';

    document.getElementById('userAvatar').textContent = initials;

    // Carregar dados da clínica
    await loadClinicData();
  } catch (error) {
    console.error('Erro de autenticação:', error);
    localStorage.removeItem('atenmed_auth');
    window.location.href = '/login.html?redirect=/portal';
  }
}

// Carregar dados da clínica
async function loadClinicData() {
  try {
    const token = getAuthToken();

    if (!token) {
      throw new Error('Token não encontrado');
    }

    // Debug: log do currentUser
    console.log('🔍 DEBUG - currentUser:', currentUser);
    console.log('🔍 DEBUG - currentUser.clinic:', currentUser.clinic);
    console.log('🔍 DEBUG - typeof currentUser.clinic:', typeof currentUser.clinic);

    // Se usuário tem clínica vinculada, buscar direto
    const clinicId = currentUser.clinic?._id || currentUser.clinic;
    console.log('🔍 DEBUG - clinicId extraído:', clinicId);
    console.log('🔍 DEBUG - clinicId tipo:', typeof clinicId);

    if (clinicId) {
      console.log('🔍 DEBUG - Fazendo requisição para:', `/api/clinics/${clinicId}`);
      const response = await fetch(`/api/clinics/${clinicId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('🔍 DEBUG - Response status:', response.status);
      console.log('🔍 DEBUG - Response ok:', response.ok);

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        currentClinic = data.data;
        populateClinicData();
        loadStats();
        loadInvoices();
        renderScheduleForm();
      } else {
        showAlert(
          `Erro ao carregar dados da clínica: ${data.error || 'Erro desconhecido'}`,
          'error'
        );
      }
    } else {
      // Se não tem clínica vinculada (admin global), listar todas
      const response = await fetch('/api/clinics', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success && data.data.clinics && data.data.clinics.length > 0) {
        currentClinic = data.data.clinics[0]; // Pegar primeira
        populateClinicData();
        loadStats();
        loadInvoices();
        renderScheduleForm();

        // Aviso para admin
        if (data.data.clinics.length > 1) {
          showAlert('ℹ️ Você tem acesso a múltiplas clínicas. Mostrando a primeira.', 'info');
        }
      } else {
        showAlert('Nenhuma clínica encontrada. Entre em contato com o suporte.', 'error');
      }
    }
  } catch (error) {
    console.error('Erro ao carregar clínica:', error);
    showAlert(`Erro ao carregar dados da clínica: ${error.message}`, 'error');
    // Garantir que o nome "Carregando..." seja substituído mesmo em caso de erro
    const clinicNameEl = document.getElementById('clinicName');
    if (clinicNameEl) {
      clinicNameEl.textContent = 'Erro ao carregar';
    }
  }
}

// Preencher dados da clínica na interface
function populateClinicData() {
  if (!currentClinic) return;

  // Header
  document.getElementById('clinicName').textContent = currentClinic.name;

  // Dashboard
  const publicUrl = `${window.location.origin}/clinica/${currentClinic.slug}`;
  document.getElementById('publicUrl').value = publicUrl;

  // Plan badges
  const planLabels = {
    free: '🌱 FREE',
    basic: '🚀 BASIC',
    pro: '💎 PRO',
    enterprise: '🏢 ENTERPRISE',
  };

  const planBadge = `<span class="plan-badge plan-${currentClinic.subscription.plan}">
        ${planLabels[currentClinic.subscription.plan]}
    </span>`;
  document.getElementById('currentPlan').innerHTML = planBadge;

  // Status
  const statusLabels = {
    active: 'Ativo',
    trial: 'Trial',
    suspended: 'Suspenso',
    inactive: 'Inativo',
  };

  const statusBadge = `<span class="status-badge status-${currentClinic.subscription.status}">
        ${statusLabels[currentClinic.subscription.status]}
    </span>`;
  document.getElementById('subscriptionStatus').innerHTML = statusBadge;

  // Datas
  if (currentClinic.createdAt) {
    const date = new Date(currentClinic.createdAt);
    document.getElementById('memberSince').textContent = date.toLocaleDateString('pt-BR');
  }

  // Próxima fatura (próximo dia 10)
  const nextInvoiceDate = new Date();
  nextInvoiceDate.setMonth(nextInvoiceDate.getMonth() + 1);
  nextInvoiceDate.setDate(10);
  document.getElementById('nextInvoice').textContent = nextInvoiceDate.toLocaleDateString('pt-BR');

  // Formulário da clínica
  document.getElementById('clinicNameInput').value = currentClinic.name || '';
  document.getElementById('clinicSlug').value = currentClinic.slug || '';
  document.getElementById('clinicEmail').value = currentClinic.contact?.email || '';
  document.getElementById('clinicPhone').value = currentClinic.contact?.phone || '';
  document.getElementById('clinicWhatsApp').value = currentClinic.contact?.whatsapp || '';
  document.getElementById('clinicWebsite').value = currentClinic.contact?.website || '';
  document.getElementById('clinicDescription').value = currentClinic.description || '';

  // Endereço
  if (currentClinic.address) {
    document.getElementById('addressStreet').value = currentClinic.address.street || '';
    document.getElementById('addressNumber').value = currentClinic.address.number || '';
    document.getElementById('addressNeighborhood').value = currentClinic.address.neighborhood || '';
    document.getElementById('addressCity').value = currentClinic.address.city || '';
    document.getElementById('addressState').value = currentClinic.address.state || '';
    document.getElementById('addressZipCode').value = currentClinic.address.zipCode || '';
  }

  // Branding
  if (currentClinic.branding) {
    document.getElementById('primaryColor').value =
      currentClinic.branding.primaryColor || '#45a7b1';
    document.getElementById('primaryColorText').value =
      currentClinic.branding.primaryColor || '#45a7b1';
    document.getElementById('secondaryColor').value =
      currentClinic.branding.secondaryColor || '#184354';
    document.getElementById('secondaryColorText').value =
      currentClinic.branding.secondaryColor || '#184354';
    document.getElementById('accentColor').value = currentClinic.branding.accentColor || '#6dd5ed';
    document.getElementById('accentColorText').value =
      currentClinic.branding.accentColor || '#6dd5ed';
  }

  if (currentClinic.logo) {
    document.getElementById('logoUrl').value = currentClinic.logo;
  }
}

// Carregar estatísticas
async function loadStats() {
  if (!currentClinic) return;

  try {
    // Buscar agendamentos da clínica
    // TODO: Implementar endpoint específico por clínica
    // Por enquanto, usar stats gerais

    document.getElementById('statAppointments').textContent =
      currentClinic.stats?.totalAppointments || 0;
    document.getElementById('statPatients').textContent = currentClinic.stats?.activePatients || 0;
    document.getElementById('statViews').textContent = currentClinic.stats?.pageViews || 0;
    document.getElementById('statConfirmation').textContent = '85%'; // TODO: Calcular real
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
  }
}

// Carregar faturas
async function loadInvoices() {
  const container = document.getElementById('invoicesContent');

  try {
    // TODO: Implementar endpoint de faturas
    // const response = await fetch(`/api/invoices?clinic=${currentClinic._id}`);
    // const data = await response.json();

    // Demo: Mostrar mensagem temporária
    container.innerHTML = `
            <div class="empty-state">
                <div class="icon">💳</div>
                <p>Sistema de faturas em implementação</p>
                <p style="font-size: 0.9rem; color: #999; margin-top: 0.5rem;">
                    Em breve você poderá visualizar e gerenciar suas faturas aqui
                </p>
            </div>
        `;
  } catch (error) {
    console.error('Erro ao carregar faturas:', error);
    container.innerHTML = '<div class="empty-state">Erro ao carregar faturas</div>';
  }
}

// Renderizar formulário de horários
function renderScheduleForm() {
  const container = document.getElementById('scheduleInputs');
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = {
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado',
    sunday: 'Domingo',
  };

  let html = '';

  days.forEach((day) => {
    const dayData = currentClinic.workingHours?.[day] || {
      start: '08:00',
      end: '18:00',
      closed: day === 'sunday',
    };

    html += `
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; padding: 1rem; background: #f9fafb; border-radius: 10px;">
                <label style="flex: 0 0 150px; font-weight: 600;">${dayLabels[day]}:</label>
                <input type="checkbox" id="closed_${day}" ${dayData.closed ? 'checked' : ''} 
                       onchange="toggleDayInputs('${day}')" style="width: auto;">
                <label for="closed_${day}" style="flex: 0 0 80px; font-weight: normal;">Fechado</label>
                <input type="time" id="start_${day}" value="${dayData.start || '08:00'}" 
                       ${dayData.closed ? 'disabled' : ''} style="flex: 1;">
                <span>até</span>
                <input type="time" id="end_${day}" value="${dayData.end || '18:00'}" 
                       ${dayData.closed ? 'disabled' : ''} style="flex: 1;">
            </div>
        `;
  });

  container.innerHTML = html;
}

// Toggle inputs de horário
function toggleDayInputs(day) {
  const closed = document.getElementById(`closed_${day}`).checked;
  document.getElementById(`start_${day}`).disabled = closed;
  document.getElementById(`end_${day}`).disabled = closed;
}

// Navegação entre seções
function showSection(sectionId) {
  // Remover active de todos
  document.querySelectorAll('.content-section').forEach((section) => {
    section.classList.remove('active');
  });
  document.querySelectorAll('.menu-item').forEach((item) => {
    item.classList.remove('active');
  });

  // Ativar seção selecionada
  document.getElementById(sectionId).classList.add('active');
  event.currentTarget.classList.add('active');

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Copiar URL pública
function copyPublicUrl() {
  const input = document.getElementById('publicUrl');
  input.select();
  document.execCommand('copy');
  showAlert('✅ Link copiado para área de transferência!', 'success');
}

// Abrir URL pública
function openPublicUrl() {
  const url = document.getElementById('publicUrl').value;
  window.open(url, '_blank');
}

// Sincronizar color pickers
['primary', 'secondary', 'accent'].forEach((type) => {
  const colorInput = document.getElementById(`${type}Color`);
  const textInput = document.getElementById(`${type}ColorText`);

  if (colorInput && textInput) {
    colorInput.addEventListener('input', (e) => {
      textInput.value = e.target.value;
    });

    textInput.addEventListener('input', (e) => {
      if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
        colorInput.value = e.target.value;
      }
    });
  }
});

// Salvar dados da clínica
document.getElementById('clinicForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Salvando...';

  try {
    const updateData = {
      name: document.getElementById('clinicNameInput').value,
      contact: {
        email: document.getElementById('clinicEmail').value,
        phone: document.getElementById('clinicPhone').value,
        whatsapp: document.getElementById('clinicWhatsApp').value,
        website: document.getElementById('clinicWebsite').value,
      },
      description: document.getElementById('clinicDescription').value,
      address: {
        street: document.getElementById('addressStreet').value,
        number: document.getElementById('addressNumber').value,
        neighborhood: document.getElementById('addressNeighborhood').value,
        city: document.getElementById('addressCity').value,
        state: document.getElementById('addressState').value,
        zipCode: document.getElementById('addressZipCode').value,
      },
    };

    const response = await fetch(`/api/clinics/${currentClinic._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(updateData),
    });

    const data = await response.json();

    if (data.success) {
      currentClinic = data.data;
      populateClinicData();
      showAlert('✅ Dados salvos com sucesso!', 'success');
    } else {
      throw new Error(data.error || 'Erro ao salvar');
    }
  } catch (error) {
    console.error('Erro:', error);
    showAlert('❌ Erro ao salvar dados: ' + error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '💾 Salvar Alterações';
  }
});

// Salvar personalização
document.getElementById('brandingForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Aplicando...';

  try {
    const updateData = {
      branding: {
        primaryColor: document.getElementById('primaryColor').value,
        secondaryColor: document.getElementById('secondaryColor').value,
        accentColor: document.getElementById('accentColor').value,
      },
      logo: document.getElementById('logoUrl').value || undefined,
    };

    const response = await fetch(`/api/clinics/${currentClinic._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(updateData),
    });

    const data = await response.json();

    if (data.success) {
      currentClinic = data.data;
      showAlert('✅ Personalização aplicada com sucesso!', 'success');
    } else {
      throw new Error(data.error || 'Erro ao aplicar');
    }
  } catch (error) {
    console.error('Erro:', error);
    showAlert('❌ Erro ao aplicar personalização: ' + error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '🎨 Aplicar Personalização';
  }
});

// Salvar horários
document.getElementById('scheduleForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Salvando...';

  try {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const workingHours = {};

    days.forEach((day) => {
      workingHours[day] = {
        closed: document.getElementById(`closed_${day}`).checked,
        start: document.getElementById(`start_${day}`).value,
        end: document.getElementById(`end_${day}`).value,
      };
    });

    const response = await fetch(`/api/clinics/${currentClinic._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ workingHours }),
    });

    const data = await response.json();

    if (data.success) {
      currentClinic = data.data;
      showAlert('✅ Horários salvos com sucesso!', 'success');
    } else {
      throw new Error(data.error || 'Erro ao salvar');
    }
  } catch (error) {
    console.error('Erro:', error);
    showAlert('❌ Erro ao salvar horários: ' + error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '💾 Salvar Horários';
  }
});

// Alterar senha
document.getElementById('settingsForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (newPassword !== confirmPassword) {
    showAlert('❌ As senhas não coincidem', 'error');
    return;
  }

  if (newPassword.length < 6) {
    showAlert('❌ A senha deve ter pelo menos 6 caracteres', 'error');
    return;
  }

  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Alterando...';

  try {
    // TODO: Implementar endpoint de alteração de senha
    showAlert('⚠️ Funcionalidade em implementação', 'info');
  } catch (error) {
    console.error('Erro:', error);
    showAlert('❌ Erro ao alterar senha: ' + error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '🔒 Alterar Senha';
    // Limpar campos
    e.target.reset();
  }
});

// Logout
function logout() {
  if (confirm('Deseja realmente sair?')) {
    localStorage.removeItem('atenmed_auth');
    window.location.href = '/login.html';
  }
}

// Mostrar alerta
function showAlert(message, type = 'info') {
  const alert = document.getElementById('globalAlert');
  alert.textContent = message;
  alert.className = `alert ${type} show`;

  // Auto-hide após 5 segundos
  setTimeout(() => {
    alert.classList.remove('show');
  }, 5000);

  // Scroll to alert
  alert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
