/**
 * AtenMed - Clinic Booking Page
 * Sistema de agendamento público por clínica
 */

// ===== CONFIGURAÇÃO =====
const API_BASE_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : window.location.hostname === 'atenmed.com.br' ||
        window.location.hostname === 'www.atenmed.com.br'
      ? 'https://atenmed.com.br/api'
      : '/api';

// ===== ESTADO DA APLICAÇÃO =====
const bookingApp = {
  clinic: null,
  specialties: [],
  doctors: [],
  currentStep: 1,
  selectedSpecialty: null,
  selectedDoctor: null,
  selectedDate: null,
  selectedTime: null,
  availableSlots: [],
  currentMonth: new Date(),

  // Dados do agendamento
  booking: {
    specialty: null,
    doctor: null,
    date: null,
    time: null,
    patient: {
      name: '',
      email: '',
      phone: '',
      notes: '',
    },
  },
};

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', async () => {
  // Pegar slug da clínica da URL
  const pathParts = window.location.pathname.split('/');
  const clinicSlug =
    pathParts[pathParts.indexOf('clinica') + 1] ||
    new URLSearchParams(window.location.search).get('clinic');

  if (!clinicSlug) {
    showError('Clínica não encontrada na URL');
    return;
  }

  await loadClinicData(clinicSlug);
  setupEventListeners();

  // Ano atual no footer
  document.getElementById('current-year').textContent = new Date().getFullYear();
});

// ===== CARREGAR DADOS DA CLÍNICA =====
async function loadClinicData(clinicSlug) {
  try {
    showLoading(true);

    // Buscar dados da clínica
    const response = await fetch(`${API_BASE_URL}/clinics/slug/${clinicSlug}`);
    if (!response.ok) throw new Error('Clínica não encontrada');

    const data = await response.json();
    bookingApp.clinic = data.data;

    // Renderizar informações da clínica
    renderClinicInfo();

    // Carregar especialidades
    await loadSpecialties();

    // Carregar médicos
    await loadDoctors();

    showLoading(false);
  } catch (error) {
    console.error('Erro ao carregar clínica:', error);
    showError('Erro ao carregar informações da clínica');
  }
}

// ===== RENDERIZAR INFORMAÇÕES DA CLÍNICA =====
function renderClinicInfo() {
  const clinic = bookingApp.clinic;

  // Aplicar cores personalizadas (se tiver)
  if (clinic.branding?.primaryColor) {
    document.documentElement.style.setProperty('--primary-color', clinic.branding.primaryColor);
  }
  if (clinic.branding?.secondaryColor) {
    document.documentElement.style.setProperty('--secondary-color', clinic.branding.secondaryColor);
  }

  // Header
  document.getElementById('clinic-name').textContent = clinic.name;
  document.getElementById('clinic-slogan').textContent = clinic.slogan || 'Cuidando da sua saúde';

  if (clinic.logo) {
    document.getElementById('clinic-logo').src = clinic.logo;
    document.getElementById('clinic-favicon').href = clinic.logo;
  }

  // Rating
  if (clinic.rating) {
    document.getElementById('clinic-rating-count').textContent =
      `(${clinic.rating.count} avaliações)`;
  }

  // Quick Info
  document.getElementById('clinic-address').textContent = clinic.address
    ? `${clinic.address.street}, ${clinic.address.number} - ${clinic.address.city}`
    : '-';

  document.getElementById('clinic-phone').textContent = clinic.contact?.phone || '-';

  const hours = clinic.workingHours?.formatted || 'Seg-Sex: 8h às 18h';
  document.getElementById('clinic-hours').textContent = hours;

  if (clinic.contact?.whatsapp) {
    const whatsappEl = document.getElementById('clinic-whatsapp');
    whatsappEl.textContent = clinic.contact.whatsapp;
    whatsappEl.href = `https://wa.me/${clinic.contact.whatsapp.replace(/\D/g, '')}`;
  }

  // Sidebar - Sobre
  document.getElementById('clinic-about').textContent =
    clinic.description || 'Clínica médica com profissionais qualificados.';

  // Mapa - usar coordenadas se disponíveis
  const mapIframe = document.getElementById('map-iframe');
  if (clinic.address?.coordinates?.lat && clinic.address?.coordinates?.lng) {
    // Usar coordenadas precisas
    mapIframe.src = `https://maps.google.com/maps?q=${clinic.address.coordinates.lat},${clinic.address.coordinates.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  } else if (clinic.address?.street) {
    // Fallback para busca por endereço
    mapIframe.src = `https://maps.google.com/maps?q=${encodeURIComponent((clinic.name || '') + ' ' + clinic.address.street)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }

  // Footer
  document.getElementById('footer-address').textContent = clinic.address
    ? `${clinic.address.street}, ${clinic.address.number} - ${clinic.address.city}`
    : '';
  document.getElementById('footer-phone').textContent = clinic.contact?.phone || '';
  document.getElementById('footer-email').textContent = clinic.contact?.email || '';
  document.getElementById('footer-hours').textContent = hours;
  document.getElementById('footer-clinic-name').textContent = clinic.name;

  // Redes sociais
  if (clinic.social) {
    const socialLinks = document.getElementById('social-links');
    if (clinic.social.facebook) {
      socialLinks.innerHTML += `<a href="${clinic.social.facebook}" target="_blank" class="social-link"><i class="fab fa-facebook"></i></a>`;
    }
    if (clinic.social.instagram) {
      socialLinks.innerHTML += `<a href="${clinic.social.instagram}" target="_blank" class="social-link"><i class="fab fa-instagram"></i></a>`;
    }
    if (clinic.social.linkedin) {
      socialLinks.innerHTML += `<a href="${clinic.social.linkedin}" target="_blank" class="social-link"><i class="fab fa-linkedin"></i></a>`;
    }
  }

  // SEO
  document.title = `${clinic.name} - Agendar Consulta Online`;
  document.getElementById('clinic-title').textContent = `${clinic.name} - Agendar Consulta`;
  document.getElementById('clinic-description').content = clinic.description || '';
}

// ===== CARREGAR ESPECIALIDADES =====
async function loadSpecialties() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/appointments/clinics/${bookingApp.clinic._id}/specialties`
    );
    const data = await response.json();

    bookingApp.specialties = data.data || [];

    // Renderizar na sidebar
    renderSpecialtiesSidebar();

    // Renderizar no booking
    renderSpecialtyOptions();
  } catch (error) {
    console.error('Erro ao carregar especialidades:', error);
  }
}

function renderSpecialtiesSidebar() {
  const container = document.getElementById('specialties-list');
  if (!container) return;

  // Renderizar como cards no novo grid
  container.innerHTML = bookingApp.specialties
    .map(
      (spec) => `
        <div class="specialty-card" onclick="bookingApp.selectSpecialty('${spec._id}')">
            <i class="fas ${spec.icon || 'fa-stethoscope'}"></i>
            <h4>${spec.name}</h4>
            ${spec.description ? `<p>${spec.description}</p>` : ''}
        </div>
    `
    )
    .join('');
}

function renderSpecialtyOptions() {
  const container = document.getElementById('specialty-options');
  container.innerHTML = bookingApp.specialties
    .map(
      (spec) => `
        <div class="option-card" onclick="bookingApp.selectSpecialty('${spec._id}')">
            <i class="fas ${spec.icon || 'fa-stethoscope'}"></i>
            <h4>${spec.name}</h4>
            ${spec.description ? `<p>${spec.description}</p>` : ''}
        </div>
    `
    )
    .join('');
}

// ===== CARREGAR MÉDICOS =====
async function loadDoctors() {
  try {
    const response = await fetch(`${API_BASE_URL}/clinics/${bookingApp.clinic._id}/doctors`);
    const data = await response.json();

    bookingApp.doctors = data.data || [];

    // Renderizar na sidebar
    renderDoctorsSidebar();
  } catch (error) {
    console.error('Erro ao carregar médicos:', error);
  }
}

function renderDoctorsSidebar() {
  const container = document.getElementById('doctors-list');
  container.innerHTML = bookingApp.doctors
    .map(
      (doctor) => `
        <div class="doctor-card">
            <img src="${doctor.photo || '/assets/images/default-doctor.jpg'}" 
                 alt="${doctor.name}" 
                 class="doctor-avatar">
            <div class="doctor-info">
                <h4>${doctor.name}</h4>
                <p class="doctor-specialty">${doctor.specialties?.map((s) => s.name).join(', ') || 'Médico'}</p>
            </div>
        </div>
    `
    )
    .join('');
}

// ===== FLUXO DE AGENDAMENTO =====

// Step 1: Selecionar Especialidade
bookingApp.selectSpecialty = async function (specialtyId) {
  const specialty = bookingApp.specialties.find((s) => s._id === specialtyId);
  if (!specialty) return;

  bookingApp.selectedSpecialty = specialty;
  bookingApp.booking.specialty = specialty;

  // Filtrar médicos por especialidade
  const doctorsInSpecialty = bookingApp.doctors.filter((d) =>
    d.specialties?.some((s) => s._id === specialtyId)
  );

  if (doctorsInSpecialty.length === 0) {
    alert('Nenhum médico disponível para esta especialidade no momento.');
    return;
  }

  // Renderizar médicos
  renderDoctorOptions(doctorsInSpecialty);

  // Avançar para próximo step
  goToStep(2);
};

function renderDoctorOptions(doctors) {
  const container = document.getElementById('doctor-options');
  container.innerHTML = doctors
    .map(
      (doctor) => `
        <div class="doctor-option-card" onclick="bookingApp.selectDoctor('${doctor._id}')">
            <img src="${doctor.photo || '/assets/images/default-doctor.jpg'}" 
                 alt="${doctor.name}" 
                 class="doctor-option-avatar">
            <div class="doctor-option-info">
                <h4>${doctor.name}</h4>
                <p class="doctor-option-specialty">${doctor.specialties?.map((s) => s.name).join(', ')}</p>
                ${doctor.crm?.number ? `<p><small>CRM: ${doctor.crm.number}${doctor.crm.state ? ' - ' + doctor.crm.state : ''}</small></p>` : ''}
                ${doctor.bio ? `<p class="doctor-option-bio">${doctor.bio.substring(0, 150)}...</p>` : ''}
            </div>
        </div>
    `
    )
    .join('');
}

// Step 2: Selecionar Médico
bookingApp.selectDoctor = function (doctorId) {
  const doctor = bookingApp.doctors.find((d) => d._id === doctorId);
  if (!doctor) return;

  bookingApp.selectedDoctor = doctor;
  bookingApp.booking.doctor = doctor;

  // Renderizar calendário
  renderCalendar();

  // Avançar para próximo step
  goToStep(3);
};

// Step 3: Selecionar Data
function renderCalendar() {
  const now = new Date();
  const year = bookingApp.currentMonth.getFullYear();
  const month = bookingApp.currentMonth.getMonth();

  // Header do calendário
  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  document.getElementById('calendar-month').textContent = `${monthNames[month]} ${year}`;

  // Dias do mês
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendar = document.getElementById('calendar');
  calendar.innerHTML = '';

  // Dias da semana
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  weekDays.forEach((day) => {
    const dayEl = document.createElement('div');
    dayEl.style.fontWeight = 'bold';
    dayEl.style.textAlign = 'center';
    dayEl.textContent = day;
    calendar.appendChild(dayEl);
  });

  // Espaços vazios antes do primeiro dia
  for (let i = 0; i < firstDay; i++) {
    calendar.appendChild(document.createElement('div'));
  }

  // Dias do mês
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    dayEl.textContent = day;

    // Desabilitar dias passados
    if (date < now.setHours(0, 0, 0, 0)) {
      dayEl.classList.add('disabled');
    } else {
      dayEl.classList.add('available');
      const dateStr = date.toISOString().split('T')[0];
      dayEl.onclick = () => bookingApp.selectDate(dateStr);
    }

    // Marcar dia selecionado
    if (bookingApp.selectedDate && bookingApp.selectedDate === date.toISOString().split('T')[0]) {
      dayEl.classList.add('selected');
    }

    // Marcar hoje
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      dayEl.classList.add('today');
    }

    calendar.appendChild(dayEl);
  }
}

bookingApp.previousMonth = function () {
  bookingApp.currentMonth.setMonth(bookingApp.currentMonth.getMonth() - 1);
  renderCalendar();
};

bookingApp.nextMonth = function () {
  bookingApp.currentMonth.setMonth(bookingApp.currentMonth.getMonth() + 1);
  renderCalendar();
};

// Step 4: Selecionar Data
bookingApp.selectDate = async function (dateStr) {
  bookingApp.selectedDate = dateStr;
  bookingApp.booking.date = dateStr;

  // Atualizar visual
  renderCalendar();

  // Carregar horários disponíveis
  await loadAvailableSlots(dateStr);

  // Mostrar horários
  document.getElementById('selected-date-display').textContent = new Date(
    dateStr
  ).toLocaleDateString('pt-BR');

  goToStep(4);
};

async function loadAvailableSlots(date) {
  try {
    showLoading(true);

    const response = await fetch(
      `${API_BASE_URL}/appointments/availability?doctorId=${bookingApp.selectedDoctor._id}&date=${date}`
    );

    if (!response.ok) throw new Error('Erro ao buscar horários');

    const data = await response.json();
    bookingApp.availableSlots = data.data.availableSlots || [];

    renderTimeSlots();
    showLoading(false);
  } catch (error) {
    console.error('Erro ao carregar horários:', error);
    showError('Erro ao carregar horários disponíveis');
    bookingApp.availableSlots = [];
    renderTimeSlots();
  }
}

function renderTimeSlots() {
  const container = document.getElementById('time-slots');

  if (bookingApp.availableSlots.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: #64748b;">Nenhum horário disponível nesta data. Por favor, escolha outra data.</p>';
    return;
  }

  container.innerHTML = bookingApp.availableSlots
    .map(
      (slot) => `
        <div class="time-slot ${bookingApp.selectedTime === slot ? 'selected' : ''}" 
             onclick="bookingApp.selectTime('${slot}')">
            ${slot}
        </div>
    `
    )
    .join('');
}

// Step 5: Selecionar Horário
bookingApp.selectTime = function (time) {
  bookingApp.selectedTime = time;
  bookingApp.booking.time = time;

  // Atualizar visual
  renderTimeSlots();

  // Preencher resumo
  updateBookingSummary();

  // Avançar para dados pessoais
  goToStep(5);
};

function updateBookingSummary() {
  document.getElementById('summary-specialty').textContent = bookingApp.booking.specialty.name;
  document.getElementById('summary-doctor').textContent = bookingApp.booking.doctor.name;
  document.getElementById('summary-date').textContent = new Date(
    bookingApp.booking.date
  ).toLocaleDateString('pt-BR');
  document.getElementById('summary-time').textContent = bookingApp.booking.time;
}

// Step 6: Dados Pessoais e Confirmação
function setupEventListeners() {
  const form = document.getElementById('patient-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await confirmBooking();
  });

  // Máscaras
  const phoneInput = document.getElementById('patient-phone');
  phoneInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
    }
    e.target.value = value;
  });
}

async function confirmBooking() {
  try {
    showLoading(true);

    // Coletar dados do formulário
    const patient = {
      name: document.getElementById('patient-name').value,
      email: document.getElementById('patient-email').value,
      phone: document.getElementById('patient-phone').value,
    };

    const notes = document.getElementById('patient-notes').value;

    // Preparar dados do agendamento
    const appointmentData = {
      patient: patient,
      doctorId: bookingApp.booking.doctor._id,
      specialtyId: bookingApp.booking.specialty._id,
      scheduledDate: bookingApp.booking.date,
      scheduledTime: bookingApp.booking.time,
      notes: notes,
      source: 'site',
      clinicId: bookingApp.clinic._id,
    };

    // Enviar para API
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar agendamento');
    }

    const result = await response.json();

    // Mostrar confirmação
    showConfirmation(result.data);
    goToStep(6);

    showLoading(false);
  } catch (error) {
    console.error('Erro ao confirmar agendamento:', error);
    showError(error.message || 'Erro ao confirmar agendamento');
  }
}

function showConfirmation(appointment) {
  const date = new Date(appointment.scheduledDate);

  document.getElementById('confirm-date').textContent = date.toLocaleDateString('pt-BR');
  document.getElementById('confirm-time').textContent = appointment.scheduledTime;
  document.getElementById('confirm-doctor').textContent = appointment.doctor.name;
  document.getElementById('confirm-address').textContent =
    `${bookingApp.clinic.address.street}, ${bookingApp.clinic.address.number}`;
}

// Adicionar à agenda
bookingApp.addToCalendar = function () {
  const event = {
    title: `Consulta - ${bookingApp.booking.specialty.name}`,
    description: `Consulta com ${bookingApp.booking.doctor.name} na ${bookingApp.clinic.name}`,
    location: `${bookingApp.clinic.address.street}, ${bookingApp.clinic.address.number}`,
    start: `${bookingApp.booking.date}T${bookingApp.booking.time}:00`,
    duration: 60,
  };

  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}&dates=${event.start.replace(/[-:]/g, '')}/${event.start.replace(/[-:]/g, '')}`;

  window.open(googleCalendarUrl, '_blank');
};

// Compartilhar WhatsApp
bookingApp.shareWhatsApp = function () {
  const message =
    `✅ *Consulta Agendada*\n\n` +
    `📅 Data: ${new Date(bookingApp.booking.date).toLocaleDateString('pt-BR')}\n` +
    `🕐 Horário: ${bookingApp.booking.time}\n` +
    `👨‍⚕️ Médico: ${bookingApp.booking.doctor.name}\n` +
    `🏥 Local: ${bookingApp.clinic.name}\n` +
    `📍 ${bookingApp.clinic.address.street}, ${bookingApp.clinic.address.number}`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
};

// ===== NAVEGAÇÃO ENTRE STEPS =====
function goToStep(step) {
  // Esconder todos os steps
  for (let i = 1; i <= 6; i++) {
    const stepId = ['specialty', 'doctor', 'date', 'time', 'personal', 'confirmation'][i - 1];
    document.getElementById(`step-${stepId}`).style.display = 'none';
  }

  // Mostrar step atual
  const stepIds = ['specialty', 'doctor', 'date', 'time', 'personal', 'confirmation'];
  document.getElementById(`step-${stepIds[step - 1]}`).style.display = 'block';

  bookingApp.currentStep = step;

  // Scroll to top
  document.querySelector('.booking-card').scrollIntoView({ behavior: 'smooth' });
}

bookingApp.backToStep = function (step) {
  goToStep(step);
};

// ===== UTILITÁRIOS =====
function showLoading(show) {
  const loading = document.getElementById('loading');
  if (show) {
    loading.classList.remove('hidden');
  } else {
    loading.classList.add('hidden');
  }
}

function showError(message) {
  showLoading(false);
  alert(message);
}

// ===== EXPORTAR =====
window.bookingApp = bookingApp;
