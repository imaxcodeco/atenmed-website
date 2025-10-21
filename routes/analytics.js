/**
 * AtenMed - Analytics API Routes
 * Rotas para métricas e analytics do sistema
 */

const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Waitlist = require('../models/Waitlist');
const Doctor = require('../models/Doctor');
const Specialty = require('../models/Specialty');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const logger = require('../utils/logger');

// ===== OVERVIEW/KPIs =====

/**
 * @route   GET /api/analytics/kpis
 * @desc    Retorna KPIs principais do sistema
 * @access  Admin
 */
router.get('/kpis', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { period = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        // Total de agendamentos no período
        const totalAppointments = await Appointment.countDocuments({
            createdAt: { $gte: startDate }
        });

        // Agendamentos por status
        const statusCounts = await Appointment.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const statusMap = {};
        statusCounts.forEach(item => {
            statusMap[item._id] = item.count;
        });

        // Taxas
        const confirmed = statusMap['confirmado'] || 0;
        const completed = statusMap['concluido'] || 0;
        const canceled = statusMap['cancelado'] || 0;
        const noShow = statusMap['nao-compareceu'] || 0;

        const attendanceRate = totalAppointments > 0 
            ? ((completed / totalAppointments) * 100).toFixed(1) 
            : 0;

        const cancellationRate = totalAppointments > 0 
            ? ((canceled / totalAppointments) * 100).toFixed(1) 
            : 0;

        // Fila de espera
        const waitlistActive = await Waitlist.countDocuments({ status: 'aguardando' });

        // Lembretes enviados
        const appointmentsWithReminders = await Appointment.countDocuments({
            'confirmations.reminders.0': { $exists: true },
            createdAt: { $gte: startDate }
        });

        // Taxa de confirmação
        const appointmentsWithConfirmation = await Appointment.countDocuments({
            'confirmations.patient.confirmed': true,
            createdAt: { $gte: startDate }
        });

        const confirmationRate = totalAppointments > 0 
            ? ((appointmentsWithConfirmation / totalAppointments) * 100).toFixed(1) 
            : 0;

        // Comparar com período anterior (para tendências)
        const previousPeriodStart = new Date(startDate);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - parseInt(period));

        const previousTotal = await Appointment.countDocuments({
            createdAt: { $gte: previousPeriodStart, $lt: startDate }
        });

        const trend = previousTotal > 0 
            ? (((totalAppointments - previousTotal) / previousTotal) * 100).toFixed(1)
            : 0;

        res.json({
            success: true,
            data: {
                period: parseInt(period),
                total: totalAppointments,
                confirmed,
                completed,
                canceled,
                noShow,
                pending: totalAppointments - confirmed - completed - canceled - noShow,
                attendanceRate: parseFloat(attendanceRate),
                cancellationRate: parseFloat(cancellationRate),
                confirmationRate: parseFloat(confirmationRate),
                waitlistActive,
                remindersSent: appointmentsWithReminders,
                trend: parseFloat(trend)
            }
        });

    } catch (error) {
        logger.error('Erro ao buscar KPIs:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar KPIs',
            error: error.message
        });
    }
});

// ===== AGENDAMENTOS POR PERÍODO =====

/**
 * @route   GET /api/analytics/appointments-by-day
 * @desc    Retorna agendamentos agrupados por dia
 * @access  Admin
 */
router.get('/appointments-by-day', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { period = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        const appointmentsByDay = await Appointment.aggregate([
            { 
                $match: { 
                    createdAt: { $gte: startDate } 
                } 
            },
            {
                $group: {
                    _id: { 
                        $dateToString: { format: '%Y-%m-%d', date: '$startTime' } 
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        res.json({
            success: true,
            data: appointmentsByDay.map(item => ({
                date: item._id,
                count: item.count
            }))
        });

    } catch (error) {
        logger.error('Erro ao buscar agendamentos por dia:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar dados',
            error: error.message
        });
    }
});

// ===== DISTRIBUIÇÃO POR STATUS =====

/**
 * @route   GET /api/analytics/status-distribution
 * @desc    Retorna distribuição de agendamentos por status
 * @access  Admin
 */
router.get('/status-distribution', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { period = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        const distribution = await Appointment.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.json({
            success: true,
            data: distribution.map(item => ({
                status: item._id,
                count: item.count
            }))
        });

    } catch (error) {
        logger.error('Erro ao buscar distribuição por status:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar dados',
            error: error.message
        });
    }
});

// ===== ESPECIALIDADES MAIS PROCURADAS =====

/**
 * @route   GET /api/analytics/top-specialties
 * @desc    Retorna especialidades mais procuradas
 * @access  Admin
 */
router.get('/top-specialties', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { period = 30, limit = 5 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        const topSpecialties = await Appointment.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: '$specialty', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: parseInt(limit) },
            {
                $lookup: {
                    from: 'specialties',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'specialtyData'
                }
            },
            { $unwind: '$specialtyData' }
        ]);

        res.json({
            success: true,
            data: topSpecialties.map(item => ({
                id: item._id,
                name: item.specialtyData.name,
                count: item.count
            }))
        });

    } catch (error) {
        logger.error('Erro ao buscar top especialidades:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar dados',
            error: error.message
        });
    }
});

// ===== MÉDICOS COM MAIS AGENDAMENTOS =====

/**
 * @route   GET /api/analytics/top-doctors
 * @desc    Retorna médicos com mais agendamentos
 * @access  Admin
 */
router.get('/top-doctors', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { period = 30, limit = 5 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        const topDoctors = await Appointment.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: '$doctor', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: parseInt(limit) },
            {
                $lookup: {
                    from: 'doctors',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'doctorData'
                }
            },
            { $unwind: '$doctorData' }
        ]);

        res.json({
            success: true,
            data: topDoctors.map(item => ({
                id: item._id,
                name: item.doctorData.name,
                count: item.count
            }))
        });

    } catch (error) {
        logger.error('Erro ao buscar top médicos:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar dados',
            error: error.message
        });
    }
});

// ===== HORÁRIOS MAIS PROCURADOS =====

/**
 * @route   GET /api/analytics/time-slots
 * @desc    Retorna distribuição de agendamentos por horário
 * @access  Admin
 */
router.get('/time-slots', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { period = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        const timeSlots = await Appointment.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: { $hour: '$startTime' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        res.json({
            success: true,
            data: timeSlots.map(item => ({
                hour: item._id,
                count: item.count
            }))
        });

    } catch (error) {
        logger.error('Erro ao buscar horários:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar dados',
            error: error.message
        });
    }
});

// ===== DESEMPENHO POR MÉDICO =====

/**
 * @route   GET /api/analytics/doctor-performance
 * @desc    Retorna métricas de desempenho por médico
 * @access  Admin
 */
router.get('/doctor-performance', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { period = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        const performance = await Appointment.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: '$doctor',
                    total: { $sum: 1 },
                    completed: {
                        $sum: { $cond: [{ $eq: ['$status', 'concluido'] }, 1, 0] }
                    },
                    canceled: {
                        $sum: { $cond: [{ $eq: ['$status', 'cancelado'] }, 1, 0] }
                    },
                    noShow: {
                        $sum: { $cond: [{ $eq: ['$status', 'nao-compareceu'] }, 1, 0] }
                    }
                }
            },
            {
                $lookup: {
                    from: 'doctors',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'doctorData'
                }
            },
            { $unwind: '$doctorData' },
            {
                $lookup: {
                    from: 'specialties',
                    localField: 'doctorData.specialties',
                    foreignField: '_id',
                    as: 'specialtyData'
                }
            },
            { $sort: { total: -1 } }
        ]);

        res.json({
            success: true,
            data: performance.map(item => ({
                doctorId: item._id,
                name: item.doctorData.name,
                specialty: item.specialtyData[0]?.name || '-',
                total: item.total,
                completed: item.completed,
                canceled: item.canceled,
                noShow: item.noShow,
                attendanceRate: item.total > 0 
                    ? ((item.completed / item.total) * 100).toFixed(1) 
                    : 0
            }))
        });

    } catch (error) {
        logger.error('Erro ao buscar desempenho:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar dados',
            error: error.message
        });
    }
});

// ===== ESTATÍSTICAS DE CONFIRMAÇÃO =====

/**
 * @route   GET /api/analytics/confirmation-stats
 * @desc    Retorna estatísticas sobre confirmações de consultas
 * @access  Admin
 */
router.get('/confirmation-stats', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { period = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        const total = await Appointment.countDocuments({
            createdAt: { $gte: startDate }
        });

        const withReminder24h = await Appointment.countDocuments({
            'confirmations.reminders.type': '24h',
            createdAt: { $gte: startDate }
        });

        const withReminder1h = await Appointment.countDocuments({
            'confirmations.reminders.type': '1h',
            createdAt: { $gte: startDate }
        });

        const confirmed = await Appointment.countDocuments({
            'confirmations.patient.confirmed': true,
            createdAt: { $gte: startDate }
        });

        const confirmationRate = total > 0 ? ((confirmed / total) * 100).toFixed(1) : 0;

        res.json({
            success: true,
            data: {
                total,
                with24hReminder: withReminder24h,
                with1hReminder: withReminder1h,
                confirmed,
                confirmationRate: parseFloat(confirmationRate)
            }
        });

    } catch (error) {
        logger.error('Erro ao buscar stats de confirmação:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar dados',
            error: error.message
        });
    }
});

// ===== ESTATÍSTICAS DA FILA DE ESPERA =====

/**
 * @route   GET /api/analytics/waitlist-stats
 * @desc    Retorna estatísticas da fila de espera
 * @access  Admin
 */
router.get('/waitlist-stats', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const total = await Waitlist.countDocuments();
        const active = await Waitlist.countDocuments({ status: 'aguardando' });
        const notified = await Waitlist.countDocuments({ status: 'notificado' });
        const converted = await Waitlist.countDocuments({ status: 'convertido' });
        const expired = await Waitlist.countDocuments({ status: 'expirado' });

        const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : 0;

        res.json({
            success: true,
            data: {
                total,
                active,
                notified,
                converted,
                expired,
                conversionRate: parseFloat(conversionRate)
            }
        });

    } catch (error) {
        logger.error('Erro ao buscar stats de fila:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar dados',
            error: error.message
        });
    }
});

// ===== EXPORTAR RELATÓRIO =====

/**
 * @route   GET /api/analytics/export
 * @desc    Exporta relatório completo (CSV/JSON)
 * @access  Admin
 */
router.get('/export', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { period = 30, format = 'json' } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        // Buscar todos os dados
        const appointments = await Appointment.find({
            createdAt: { $gte: startDate }
        })
        .populate('doctor', 'name')
        .populate('specialty', 'name')
        .populate('clinic', 'name')
        .lean();

        if (format === 'csv') {
            // Converter para CSV
            const csv = convertToCSV(appointments);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="relatorio-${new Date().toISOString()}.csv"`);
            return res.send(csv);
        }

        // Retornar JSON
        res.json({
            success: true,
            data: {
                period: parseInt(period),
                generatedAt: new Date(),
                appointments
            }
        });

    } catch (error) {
        logger.error('Erro ao exportar dados:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao exportar dados',
            error: error.message
        });
    }
});

// Helper: Converter para CSV
function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = [
        'Data',
        'Horário',
        'Paciente',
        'Médico',
        'Especialidade',
        'Clínica',
        'Status',
        'Confirmado'
    ];
    
    const rows = data.map(appt => [
        new Date(appt.startTime).toLocaleDateString('pt-BR'),
        new Date(appt.startTime).toLocaleTimeString('pt-BR'),
        appt.patientName,
        appt.doctor?.name || '-',
        appt.specialty?.name || '-',
        appt.clinic?.name || '-',
        appt.status,
        appt.confirmations?.patient?.confirmed ? 'Sim' : 'Não'
    ]);
    
    return [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
}

module.exports = router;

