/**
 * AtenMed - Analytics Dashboard
 * Dashboard completo de métricas e analytics
 */

// Configuração da API
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : '/api';

let authToken = localStorage.getItem('atenmed_token');
let charts = {};
let currentPeriod = 30;

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Analytics Dashboard inicializado');
    loadData();
});

// ===== CARREGAR DADOS =====
async function loadData() {
    currentPeriod = parseInt(document.getElementById('periodFilter').value);
    
    try {
        // Carregar dados em paralelo
        await Promise.all([
            loadKPIs(),
            loadCharts(),
            loadDoctorsPerformance()
        ]);
        
        console.log('✅ Dados carregados com sucesso');
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showError('Erro ao carregar analytics');
    }
}

// ===== KPIs =====
async function loadKPIs() {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - currentPeriod);

        // Buscar agendamentos do período
        const appointments = await fetchAppointments(startDate, endDate);
        
        // Calcular KPIs
        const total = appointments.length;
        const confirmed = appointments.filter(a => a.status === 'confirmado').length;
        const completed = appointments.filter(a => a.status === 'concluido').length;
        const canceled = appointments.filter(a => a.status === 'cancelado').length;
        const noShow = appointments.filter(a => a.status === 'nao-compareceu').length;
        
        const attendanceRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
        const cancellationRate = total > 0 ? ((canceled / total) * 100).toFixed(1) : 0;
        
        // Atualizar UI
        document.getElementById('kpiTotal').textContent = total;
        document.getElementById('kpiAttendance').textContent = attendanceRate + '%';
        document.getElementById('kpiCancellation').textContent = cancellationRate + '%';
        document.getElementById('kpiConfirmed').textContent = confirmed;
        document.getElementById('kpiNoShow').textContent = noShow;
        
        // Buscar dados de fila de espera
        const waitlistData = await fetchWaitlistStats();
        document.getElementById('kpiWaitlist').textContent = waitlistData.active || 0;
        
        // Buscar dados de lembretes
        const reminderData = await fetchReminderStats();
        document.getElementById('kpiReminders').textContent = reminderData.with24hReminder || 0;
        
        // Calcular tempo médio de espera (mock - implementar com dados reais)
        document.getElementById('kpiWaitTime').textContent = '2.5 dias';
        
        // Tendências (comparar com período anterior - simplificado)
        updateTrend('kpiTotalTrend', 12.5);
        updateTrend('kpiAttendanceTrend', 5.2);
        updateTrend('kpiCancellationTrend', -3.1);
        
    } catch (error) {
        console.error('Erro ao carregar KPIs:', error);
    }
}

// ===== GRÁFICOS =====
async function loadCharts() {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - currentPeriod);

        const appointments = await fetchAppointments(startDate, endDate);
        
        // Gráfico de agendamentos por dia
        createAppointmentsChart(appointments);
        
        // Gráfico de distribuição por status
        createStatusChart(appointments);
        
        // Gráfico de especialidades
        createSpecialtiesChart(appointments);
        
        // Gráfico de horários
        createTimeSlotsChart(appointments);
        
        // Gráfico de médicos
        createDoctorsChart(appointments);
        
    } catch (error) {
        console.error('Erro ao carregar gráficos:', error);
    }
}

// Gráfico: Agendamentos por Dia
function createAppointmentsChart(appointments) {
    const ctx = document.getElementById('appointmentsChart');
    
    // Agrupar por dia
    const byDay = {};
    appointments.forEach(appt => {
        const date = new Date(appt.scheduledDate).toLocaleDateString('pt-BR');
        byDay[date] = (byDay[date] || 0) + 1;
    });
    
    const labels = Object.keys(byDay);
    const data = Object.values(byDay);
    
    if (charts.appointments) {
        charts.appointments.destroy();
    }
    
    charts.appointments = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Agendamentos',
                data: data,
                borderColor: '#45a7b1',
                backgroundColor: 'rgba(69, 167, 177, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Gráfico: Distribuição por Status
function createStatusChart(appointments) {
    const ctx = document.getElementById('statusChart');
    
    const statusCount = {
        'Confirmado': 0,
        'Concluído': 0,
        'Cancelado': 0,
        'Não Compareceu': 0,
        'Pendente': 0
    };
    
    appointments.forEach(appt => {
        if (appt.status === 'confirmado') statusCount['Confirmado']++;
        else if (appt.status === 'concluido') statusCount['Concluído']++;
        else if (appt.status === 'cancelado') statusCount['Cancelado']++;
        else if (appt.status === 'nao-compareceu') statusCount['Não Compareceu']++;
        else statusCount['Pendente']++;
    });
    
    if (charts.status) {
        charts.status.destroy();
    }
    
    charts.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCount),
            datasets: [{
                data: Object.values(statusCount),
                backgroundColor: [
                    '#10b981', // Confirmado
                    '#3b82f6', // Concluído
                    '#ef4444', // Cancelado
                    '#f59e0b', // Não compareceu
                    '#64748b'  // Pendente
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Gráfico: Especialidades
function createSpecialtiesChart(appointments) {
    const ctx = document.getElementById('specialtiesChart');
    
    const specialtyCount = {};
    appointments.forEach(appt => {
        const specialty = appt.specialty?.name || 'Não especificado';
        specialtyCount[specialty] = (specialtyCount[specialty] || 0) + 1;
    });
    
    // Top 5 especialidades
    const sorted = Object.entries(specialtyCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    if (charts.specialties) {
        charts.specialties.destroy();
    }
    
    charts.specialties = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sorted.map(s => s[0]),
            datasets: [{
                label: 'Agendamentos',
                data: sorted.map(s => s[1]),
                backgroundColor: '#45a7b1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Gráfico: Horários Mais Procurados
function createTimeSlotsChart(appointments) {
    const ctx = document.getElementById('timeSlotsChart');
    
    const timeCount = {};
    appointments.forEach(appt => {
        const hour = appt.scheduledTime?.split(':')[0] || '00';
        timeCount[hour] = (timeCount[hour] || 0) + 1;
    });
    
    const labels = Object.keys(timeCount).sort();
    const data = labels.map(hour => timeCount[hour]);
    
    if (charts.timeSlots) {
        charts.timeSlots.destroy();
    }
    
    charts.timeSlots = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(h => h + ':00'),
            datasets: [{
                label: 'Agendamentos',
                data: data,
                backgroundColor: '#f59e0b'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Gráfico: Médicos
function createDoctorsChart(appointments) {
    const ctx = document.getElementById('doctorsChart');
    
    const doctorCount = {};
    appointments.forEach(appt => {
        const doctor = appt.doctor?.name || 'Não especificado';
        doctorCount[doctor] = (doctorCount[doctor] || 0) + 1;
    });
    
    // Top 5 médicos
    const sorted = Object.entries(doctorCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    if (charts.doctors) {
        charts.doctors.destroy();
    }
    
    charts.doctors = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sorted.map(d => d[0]),
            datasets: [{
                label: 'Agendamentos',
                data: sorted.map(d => d[1]),
                backgroundColor: '#10b981'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// ===== TABELA DE DESEMPENHO =====
async function loadDoctorsPerformance() {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - currentPeriod);

        const appointments = await fetchAppointments(startDate, endDate);
        
        // Agrupar por médico
        const byDoctor = {};
        appointments.forEach(appt => {
            const doctorId = appt.doctor?._id;
            if (!doctorId) return;
            
            if (!byDoctor[doctorId]) {
                byDoctor[doctorId] = {
                    name: appt.doctor.name,
                    specialty: appt.specialty?.name || '-',
                    total: 0,
                    completed: 0,
                    canceled: 0,
                    noShow: 0,
                    rating: 4.5 // Mock - implementar com dados reais
                };
            }
            
            byDoctor[doctorId].total++;
            if (appt.status === 'concluido') byDoctor[doctorId].completed++;
            if (appt.status === 'cancelado') byDoctor[doctorId].canceled++;
            if (appt.status === 'nao-compareceu') byDoctor[doctorId].noShow++;
        });
        
        const tbody = document.getElementById('doctorsTableBody');
        
        if (Object.keys(byDoctor).length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhum dado encontrado</td></tr>';
            return;
        }
        
        tbody.innerHTML = Object.values(byDoctor).map(doctor => {
            const attendanceRate = doctor.total > 0 
                ? ((doctor.completed / doctor.total) * 100).toFixed(1)
                : 0;
            
            return `
                <tr>
                    <td><strong>${doctor.name}</strong></td>
                    <td>${doctor.specialty}</td>
                    <td>${doctor.total}</td>
                    <td>${doctor.completed}</td>
                    <td>
                        <span class="badge ${attendanceRate >= 80 ? 'badge-success' : attendanceRate >= 60 ? 'badge-warning' : 'badge-error'}">
                            ${attendanceRate}%
                        </span>
                    </td>
                    <td>${doctor.canceled + doctor.noShow}</td>
                    <td>⭐ ${doctor.rating.toFixed(1)}</td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Erro ao carregar desempenho:', error);
    }
}

// ===== FUNÇÕES DE API =====
async function fetchAppointments(startDate, endDate) {
    try {
        // Mock data for demonstration
        // In production, replace with actual API call
        const mockData = generateMockAppointments(currentPeriod);
        return mockData;
        
        /* Implementação real:
        const response = await fetch(
            `${API_BASE_URL}/appointments?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
            { headers: getAuthHeaders() }
        );
        const result = await response.json();
        return result.data.appointments || [];
        */
    } catch (error) {
        console.error('Erro ao buscar agendamentos:', error);
        return [];
    }
}

async function fetchWaitlistStats() {
    try {
        // Mock data
        return {
            active: 15,
            converted: 8,
            conversionRate: '53.3%'
        };
        
        /* Implementação real:
        const response = await fetch(
            `${API_BASE_URL}/waitlist/stats/overview`,
            { headers: getAuthHeaders() }
        );
        const result = await response.json();
        return result.data || {};
        */
    } catch (error) {
        console.error('Erro ao buscar stats de fila:', error);
        return {};
    }
}

async function fetchReminderStats() {
    try {
        // Mock data
        return {
            with24hReminder: 45,
            with1hReminder: 42,
            confirmed: 38
        };
        
        /* Implementação real:
        const response = await fetch(
            `${API_BASE_URL}/confirmations/stats`,
            { headers: getAuthHeaders() }
        );
        const result = await response.json();
        return result.data || {};
        */
    } catch (error) {
        console.error('Erro ao buscar stats de lembretes:', error);
        return {};
    }
}

// ===== HELPERS =====
function getAuthHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
}

function updateTrend(elementId, value) {
    const element = document.getElementById(elementId);
    const isPositive = value > 0;
    
    element.className = `kpi-trend ${isPositive ? 'up' : 'down'}`;
    element.innerHTML = `
        <span>${isPositive ? '↗' : '↘'}</span>
        <span>${Math.abs(value).toFixed(1)}% vs período anterior</span>
    `;
}

function showError(message) {
    console.error(message);
    // Implementar notificação de erro
}

function exportData() {
    alert('Funcionalidade de exportação será implementada em breve!');
    // TODO: Implementar exportação para Excel/PDF
}

function logout() {
    localStorage.removeItem('atenmed_token');
    window.location.href = '/login.html';
}

// ===== MOCK DATA (para demonstração) =====
function generateMockAppointments(days) {
    const appointments = [];
    const specialties = ['Cardiologia', 'Clínica Geral', 'Odontologia', 'Ortopedia', 'Pediatria'];
    const doctors = ['Dr. João Silva', 'Dra. Maria Oliveira', 'Dr. Pedro Santos', 'Dra. Ana Costa'];
    const statuses = ['confirmado', 'concluido', 'cancelado', 'nao-compareceu', 'pendente'];
    const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
    
    for (let i = 0; i < days * 5; i++) {
        const randomDaysAgo = Math.floor(Math.random() * days);
        const date = new Date();
        date.setDate(date.getDate() - randomDaysAgo);
        
        appointments.push({
            _id: 'mock-' + i,
            scheduledDate: date.toISOString(),
            scheduledTime: times[Math.floor(Math.random() * times.length)],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            doctor: {
                _id: 'doc-' + Math.floor(Math.random() * doctors.length),
                name: doctors[Math.floor(Math.random() * doctors.length)]
            },
            specialty: {
                _id: 'spec-' + Math.floor(Math.random() * specialties.length),
                name: specialties[Math.floor(Math.random() * specialties.length)]
            },
            patient: {
                name: 'Paciente ' + i
            }
        });
    }
    
    return appointments;
}

