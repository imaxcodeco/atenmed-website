// Analytics Dashboard com Chart.js

// Configuração global do Chart.js
Chart.defaults.font.family = 'Inter, system-ui, sans-serif';
Chart.defaults.color = '#64748b';

// Cores do tema
const colors = {
    primary: '#4ca5b2',
    primaryDark: '#083e51',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
};

// Gradientes
function createGradient(ctx, color1, color2) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    return gradient;
}

// Gráfico de Leads por Mês
async function initLeadsChart() {
    const ctx = document.getElementById('leadsChart');
    if (!ctx) return;

    try {
        const response = await fetch('/api/analytics/leads-monthly', {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
            },
        });
        const data = await response.json();

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels || ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                datasets: [{
                    label: 'Leads',
                    data: data.values || [12, 19, 15, 25, 22, 30],
                    borderColor: colors.primary,
                    backgroundColor: createGradient(ctx.getContext('2d'), colors.primary + '40', colors.primary + '10'),
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: colors.primary,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        borderRadius: 8,
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        callbacks: {
                            label: function(context) {
                                return `Leads: ${context.parsed.y}`;
                            },
                        },
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#f1f5f9',
                        },
                        ticks: {
                            callback: function(value) {
                                return value;
                            },
                        },
                    },
                    x: {
                        grid: {
                            display: false,
                        },
                    },
                },
            },
        });
    } catch (error) {
        console.error('Erro ao carregar gráfico de leads:', error);
        // Dados de exemplo em caso de erro
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                datasets: [{
                    label: 'Leads',
                    data: [12, 19, 15, 25, 22, 30],
                    borderColor: colors.primary,
                    backgroundColor: colors.primary + '20',
                    tension: 0.4,
                    fill: true,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
            },
        });
    }
}

// Gráfico de Taxa de Conversão
async function initConversionChart() {
    const ctx = document.getElementById('conversionChart');
    if (!ctx) return;

    try {
        const response = await fetch('/api/analytics/conversion-rate', {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
            },
        });
        const data = await response.json();

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Convertidos', 'Em processo', 'Perdidos'],
                datasets: [{
                    data: data.values || [35, 45, 20],
                    backgroundColor: [
                        colors.success,
                        colors.warning,
                        colors.danger,
                    ],
                    borderWidth: 0,
                    hoverOffset: 10,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 14,
                            },
                        },
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        borderRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                return `${label}: ${value}%`;
                            },
                        },
                    },
                },
                cutout: '70%',
            },
        });
    } catch (error) {
        console.error('Erro ao carregar gráfico de conversão:', error);
    }
}

// Gráfico de Origem dos Leads
async function initLeadSourceChart() {
    const ctx = document.getElementById('leadSourceChart');
    if (!ctx) return;

    try {
        const response = await fetch('/api/analytics/lead-sources', {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
            },
        });
        const data = await response.json();

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels || ['Site', 'WhatsApp', 'Indicação', 'Redes Sociais', 'Outros'],
                datasets: [{
                    label: 'Leads por Origem',
                    data: data.values || [45, 30, 15, 25, 10],
                    backgroundColor: [
                        colors.primary,
                        colors.success,
                        colors.warning,
                        colors.info,
                        colors.danger,
                    ],
                    borderRadius: 8,
                    barThickness: 40,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        borderRadius: 8,
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#f1f5f9',
                        },
                    },
                    x: {
                        grid: {
                            display: false,
                        },
                    },
                },
            },
        });
    } catch (error) {
        console.error('Erro ao carregar gráfico de origem:', error);
    }
}

// Gráfico de Receita Mensal
async function initRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    try {
        const response = await fetch('/api/analytics/revenue-monthly', {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
            },
        });
        const data = await response.json();

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels || ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                datasets: [{
                    label: 'Receita (R$)',
                    data: data.values || [15000, 22000, 18000, 28000, 25000, 32000],
                    backgroundColor: createGradient(ctx.getContext('2d'), colors.primary, colors.primaryDark),
                    borderRadius: 8,
                    barThickness: 50,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        borderRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return `Receita: R$ ${context.parsed.y.toLocaleString('pt-BR')}`;
                            },
                        },
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#f1f5f9',
                        },
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toLocaleString('pt-BR');
                            },
                        },
                    },
                    x: {
                        grid: {
                            display: false,
                        },
                    },
                },
            },
        });
    } catch (error) {
        console.error('Erro ao carregar gráfico de receita:', error);
    }
}

// Função auxiliar para obter o token
function getToken() {
    const auth = localStorage.getItem('atenmed_auth');
    if (auth) {
        const data = JSON.parse(auth);
        return data.token;
    }
    return null;
}

// Gráfico de Funil de Vendas
async function initSalesFunnelChart() {
    const ctx = document.getElementById('salesFunnelChart');
    if (!ctx) return;

    try {
        const response = await fetch('/api/analytics/sales-funnel', {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
            },
        });
        const data = await response.json();

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels || ['Leads', 'Qualificados', 'Proposta', 'Negociação', 'Fechados'],
                datasets: [{
                    label: 'Funil de Vendas',
                    data: data.values || [100, 75, 50, 30, 20],
                    backgroundColor: [
                        colors.info,
                        colors.primary,
                        colors.warning,
                        colors.success,
                        colors.primaryDark,
                    ],
                    borderRadius: 8,
                }],
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        borderRadius: 8,
                    },
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: '#f1f5f9',
                        },
                    },
                    y: {
                        grid: {
                            display: false,
                        },
                    },
                },
            },
        });
    } catch (error) {
        console.error('Erro ao carregar funil de vendas:', error);
    }
}

// Gráfico de Especialidades mais Procuradas
async function initSpecialtiesChart() {
    const ctx = document.getElementById('specialtiesChart');
    if (!ctx) return;

    try {
        const response = await fetch('/api/analytics/specialties', {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
            },
        });
        const data = await response.json();

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.labels || ['Cardiologia', 'Dermatologia', 'Pediatria', 'Ortopedia', 'Outros'],
                datasets: [{
                    data: data.values || [30, 25, 20, 15, 10],
                    backgroundColor: [
                        colors.primary,
                        colors.success,
                        colors.warning,
                        colors.info,
                        colors.danger,
                    ],
                    borderWidth: 0,
                    hoverOffset: 10,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: {
                                size: 13,
                            },
                        },
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        borderRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                return `${label}: ${value}%`;
                            },
                        },
                    },
                },
            },
        });
    } catch (error) {
        console.error('Erro ao carregar especialidades:', error);
    }
}

// Gráfico de Performance Semanal
async function initWeeklyPerformanceChart() {
    const ctx = document.getElementById('weeklyPerformanceChart');
    if (!ctx) return;

    try {
        const response = await fetch('/api/analytics/weekly-performance', {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
            },
        });
        const data = await response.json();

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels || ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
                datasets: [
                    {
                        label: 'Leads',
                        data: data.leads || [5, 12, 15, 18, 20, 16, 8],
                        borderColor: colors.primary,
                        backgroundColor: colors.primary + '20',
                        tension: 0.4,
                        fill: true,
                    },
                    {
                        label: 'Contatos',
                        data: data.contacts || [3, 8, 10, 12, 15, 11, 6],
                        borderColor: colors.success,
                        backgroundColor: colors.success + '20',
                        tension: 0.4,
                        fill: true,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        borderRadius: 8,
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#f1f5f9',
                        },
                    },
                    x: {
                        grid: {
                            display: false,
                        },
                    },
                },
            },
        });
    } catch (error) {
        console.error('Erro ao carregar performance semanal:', error);
    }
}

// Inicializar todos os gráficos quando a aba Analytics for aberta
function initAnalytics() {
    initLeadsChart();
    initConversionChart();
    initLeadSourceChart();
    initRevenueChart();
    initSalesFunnelChart();
    initSpecialtiesChart();
    initWeeklyPerformanceChart();
}

// Exportar função de inicialização
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initAnalytics };
}

