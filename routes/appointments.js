const express = require('express');
const { body, query, param } = require('express-validator');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Specialty = require('../models/Specialty');
const Clinic = require('../models/Clinic');
const googleCalendarService = require('../services/googleCalendarService');
const { authenticateToken, authorize } = require('../middleware/auth');
const { addClinicContext } = require('../middleware/tenantIsolation');
const { findWithTenant, findByIdWithTenant, createWithTenant, countWithTenant } = require('../utils/tenantQuery');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

const router = express.Router();

// Middleware de validação
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Dados inválidos',
            code: 'VALIDATION_ERROR',
            errors: errors.array()
        });
    }
    next();
};

// ===== ROTAS PÚBLICAS (para WhatsApp e site) =====

// @route   GET /api/appointments/clinics
// @desc    Listar todas as clínicas ativas
// @access  Public
router.get('/clinics', async (req, res) => {
    try {
        const clinics = await Clinic.find({ $or: [{ isActive: true }, { active: true }] })
            .select('name description address contact workingHours')
            .sort({ name: 1 });

        res.json({
            success: true,
            data: clinics
        });

    } catch (error) {
        logger.error('Erro ao listar clínicas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar clínicas',
            code: 'INTERNAL_ERROR'
        });
    }
});

// @route   GET /api/appointments/clinics/:clinicId/specialties
// @desc    Listar especialidades de uma clínica
// @access  Public
router.get('/clinics/:clinicId/specialties', [
    param('clinicId').isMongoId().withMessage('ID de clínica inválido')
], validateRequest, async (req, res) => {
    try {
        const specialties = await Specialty.find({
            clinic: req.params.clinicId,
            active: true
        }).select('name description color icon').sort({ name: 1 });

        res.json({
            success: true,
            data: specialties
        });

    } catch (error) {
        logger.error('Erro ao listar especialidades:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar especialidades',
            code: 'INTERNAL_ERROR'
        });
    }
});

// @route   GET /api/appointments/specialties/:specialtyId/doctors
// @desc    Listar médicos de uma especialidade
// @access  Public
router.get('/specialties/:specialtyId/doctors', [
    param('specialtyId').isMongoId().withMessage('ID de especialidade inválido')
], validateRequest, async (req, res) => {
    try {
        const doctors = await Doctor.find({
            specialties: req.params.specialtyId,
            active: true,
            acceptsNewPatients: true
        })
            .select('name googleCalendarId workingDays workingHours slotDuration bio photo')
            .populate('specialties', 'name')
            .sort({ name: 1 });

        res.json({
            success: true,
            data: doctors
        });

    } catch (error) {
        logger.error('Erro ao listar médicos:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar médicos',
            code: 'INTERNAL_ERROR'
        });
    }
});

// @route   GET /api/appointments/availability
// @desc    Verificar horários disponíveis
// @access  Public
router.get('/availability', [
    query('doctorId').isMongoId().withMessage('ID do médico é obrigatório'),
    query('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Data inválida (formato: YYYY-MM-DD)')
], validateRequest, async (req, res) => {
    try {
        const { doctorId, date } = req.query;

        // Buscar médico
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                error: 'Médico não encontrado',
                code: 'DOCTOR_NOT_FOUND'
            });
        }

        if (!doctor.active || !doctor.acceptsNewPatients) {
            return res.status(400).json({
                success: false,
                error: 'Médico não está aceitando novos pacientes',
                code: 'DOCTOR_UNAVAILABLE'
            });
        }

        // Verificar se a data é válida (não é no passado)
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            return res.status(400).json({
                success: false,
                error: 'Não é possível agendar em datas passadas',
                code: 'INVALID_DATE'
            });
        }

        // Verificar se o médico trabalha neste dia da semana
        const dayOfWeek = selectedDate.getDay();
        if (!doctor.worksOnDay(dayOfWeek)) {
            return res.status(400).json({
                success: false,
                error: 'Médico não atende neste dia da semana',
                code: 'DAY_NOT_AVAILABLE',
                data: {
                    workingDays: doctor.workingDays
                }
            });
        }

        // Verificar se o Google Calendar está configurado
        if (!googleCalendarService.isAuthenticated()) {
            return res.status(503).json({
                success: false,
                error: 'Serviço de agendamento temporariamente indisponível',
                code: 'SERVICE_UNAVAILABLE'
            });
        }

        // Buscar horários disponíveis no Google Calendar
        const availableSlots = await googleCalendarService.getAvailableSlots(
            doctor.googleCalendarId,
            date,
            {
                workingHours: doctor.workingHours,
                slotDuration: doctor.slotDuration
            }
        );

        res.json({
            success: true,
            data: {
                date,
                doctor: {
                    id: doctor._id,
                    name: doctor.name
                },
                availableSlots,
                totalSlots: availableSlots.length,
                slotDuration: doctor.slotDuration
            }
        });

    } catch (error) {
        logger.error('Erro ao verificar disponibilidade:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao verificar disponibilidade',
            code: 'INTERNAL_ERROR',
            message: error.message
        });
    }
});

// @route   POST /api/appointments
// @desc    Criar novo agendamento
// @access  Public (para WhatsApp/Site)
router.post('/', [
    body('patient.name')
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Nome do paciente deve ter entre 2 e 200 caracteres'),
    body('patient.phone')
        .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
        .withMessage('Formato de telefone inválido'),
    body('patient.email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido'),
    body('doctorId')
        .isMongoId()
        .withMessage('ID do médico inválido'),
    body('specialtyId')
        .isMongoId()
        .withMessage('ID da especialidade inválido'),
    body('scheduledDate')
        .matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage('Data inválida'),
    body('scheduledTime')
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .withMessage('Horário inválido'),
    body('notes').optional().trim(),
    body('reason').optional().trim()
], validateRequest, async (req, res) => {
    try {
        const {
            patient,
            doctorId,
            specialtyId,
            scheduledDate,
            scheduledTime,
            notes,
            reason
        } = req.body;

        // Buscar médico, especialidade e clínica
        const doctor = await Doctor.findById(doctorId).populate('clinic');
        if (!doctor || !doctor.active) {
            return res.status(404).json({
                success: false,
                error: 'Médico não encontrado ou inativo',
                code: 'DOCTOR_NOT_FOUND'
            });
        }

        const specialty = await Specialty.findById(specialtyId);
        if (!specialty) {
            return res.status(404).json({
                success: false,
                error: 'Especialidade não encontrada',
                code: 'SPECIALTY_NOT_FOUND'
            });
        }

        // Verificar se o horário ainda está disponível
        const isAvailable = await googleCalendarService.isTimeSlotAvailable(
            doctor.googleCalendarId,
            scheduledDate,
            scheduledTime,
            doctor.slotDuration
        );

        if (!isAvailable) {
            return res.status(409).json({
                success: false,
                error: 'Horário não está mais disponível',
                code: 'TIME_SLOT_TAKEN'
            });
        }

        // Criar evento no Google Calendar
        const eventData = {
            date: scheduledDate,
            time: scheduledTime,
            duration: doctor.slotDuration,
            patientName: patient.name,
            patientEmail: patient.email,
            patientPhone: patient.phone,
            doctorName: doctor.name,
            specialty: specialty.name,
            notes: notes || ''
        };

        const googleEvent = await googleCalendarService.createEvent(
            doctor.googleCalendarId,
            eventData
        );

        // Criar agendamento no banco de dados
        const appointment = new Appointment({
            patient: {
                name: patient.name,
                email: patient.email,
                phone: patient.phone,
                cpf: patient.cpf
            },
            doctor: doctor._id,
            specialty: specialty._id,
            clinic: doctor.clinic._id,
            scheduledDate: new Date(scheduledDate),
            scheduledTime,
            duration: doctor.slotDuration,
            status: 'confirmado',
            googleEventId: googleEvent.eventId,
            googleCalendarId: doctor.googleCalendarId,
            notes,
            reason,
            source: req.body.source || 'whatsapp',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            history: [{
                action: 'criado',
                date: new Date(),
                by: 'patient',
                notes: 'Agendamento criado via ' + (req.body.source || 'whatsapp')
            }]
        });

        await appointment.save();

        // Incrementar estatísticas do médico
        await doctor.incrementStat('totalAppointments');

        // Log do agendamento
        logger.info(`✅ Agendamento criado: ${appointment._id} para ${patient.name}`);

        res.status(201).json({
            success: true,
            message: 'Agendamento criado com sucesso',
            data: {
                id: appointment._id,
                patient: appointment.patient,
                doctor: {
                    id: doctor._id,
                    name: doctor.name
                },
                specialty: {
                    id: specialty._id,
                    name: specialty.name
                },
                clinic: {
                    id: doctor.clinic._id,
                    name: doctor.clinic.name
                },
                scheduledDate: appointment.scheduledDate,
                scheduledTime: appointment.scheduledTime,
                status: appointment.status,
                googleEventLink: googleEvent.htmlLink
            }
        });

    } catch (error) {
        logger.error('Erro ao criar agendamento:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao criar agendamento',
            code: 'INTERNAL_ERROR',
            message: error.message
        });
    }
});

// ===== ROTAS ADMINISTRATIVAS (requerem autenticação) =====

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Lista agendamentos com filtros e paginação
 *     description: Retorna lista de agendamentos filtrados por clínica (multi-tenancy automático)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Itens por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pendente, confirmado, em-atendimento, concluido, cancelado, nao-compareceu]
 *         description: Filtrar por status
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Filtrar por médico
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar por data (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lista de agendamentos retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     appointments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Appointment'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 */
// @route   GET /api/appointments
// @desc    Listar agendamentos com filtros
// @access  Private (Admin, Recepcionista)
router.get('/', [
    authenticateToken,
    addClinicContext,
    authorize('admin', 'recepcionista'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['pendente', 'confirmado', 'em-atendimento', 'concluido', 'cancelado', 'nao-compareceu']),
    query('doctorId').optional().isMongoId(),
    query('clinicId').optional().isMongoId(),
    query('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/)
], validateRequest, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Construir filtros
        const filters = {};
        
        if (req.query.status) filters.status = req.query.status;
        if (req.query.doctorId) filters.doctor = req.query.doctorId;
        if (req.query.clinicId) filters.clinic = req.query.clinicId;
        
        if (req.query.date) {
            const selectedDate = new Date(req.query.date);
            filters.scheduledDate = {
                $gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
                $lte: new Date(selectedDate.setHours(23, 59, 59, 999))
            };
        }

        // Buscar agendamentos com isolamento automático de tenant
        const appointments = await findWithTenant(Appointment, filters, req, {
            populate: [
                { path: 'doctor', select: 'name email phone' },
                { path: 'specialty', select: 'name color' },
                { path: 'clinic', select: 'name address' }
            ],
            sort: { scheduledDate: -1, scheduledTime: -1 },
            limit,
            skip
        });

        const total = await countWithTenant(Appointment, filters, req);

        res.json({
            success: true,
            data: {
                appointments,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        logger.error('Erro ao listar agendamentos:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao listar agendamentos',
            code: 'INTERNAL_ERROR'
        });
    }
});

// @route   GET /api/appointments/:id
// @desc    Obter agendamento específico
// @access  Private
router.get('/:id', [
    authenticateToken,
    addClinicContext,
    param('id').isMongoId()
], validateRequest, async (req, res) => {
    try {
        // Usar helper com isolamento automático
        const appointment = await findByIdWithTenant(Appointment, req.params.id, req, {
            populate: [
                { path: 'doctor', select: 'name email phone crm' },
                { path: 'specialty', select: 'name description' },
                { path: 'clinic', select: 'name address contact' }
            ]
        });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                error: 'Agendamento não encontrado',
                code: 'APPOINTMENT_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            data: appointment
        });

    } catch (error) {
        logger.error('Erro ao buscar agendamento:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar agendamento',
            code: 'INTERNAL_ERROR'
        });
    }
});

// @route   PUT /api/appointments/:id/cancel
// @desc    Cancelar agendamento
// @access  Private ou Public (com validação)
router.put('/:id/cancel', [
    authenticateToken,
    addClinicContext,
    param('id').isMongoId(),
    body('reason').trim().isLength({ min: 3, max: 500 }).withMessage('Motivo deve ter entre 3 e 500 caracteres'),
    body('canceledBy').isIn(['patient', 'doctor', 'clinic', 'system'])
], validateRequest, async (req, res) => {
    try {
        // Usar helper com isolamento automático
        const appointment = await findByIdWithTenant(Appointment, req.params.id, req);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                error: 'Agendamento não encontrado',
                code: 'APPOINTMENT_NOT_FOUND'
            });
        }

        if (appointment.status === 'cancelado') {
            return res.status(400).json({
                success: false,
                error: 'Agendamento já está cancelado',
                code: 'ALREADY_CANCELED'
            });
        }

        // Cancelar evento no Google Calendar
        if (appointment.googleEventId && googleCalendarService.isAuthenticated()) {
            try {
                await googleCalendarService.cancelEvent(
                    appointment.googleCalendarId,
                    appointment.googleEventId
                );
            } catch (error) {
                logger.warn('Erro ao cancelar evento no Google Calendar:', error);
                // Não falhar o cancelamento se houver erro no Google
            }
        }

        // Cancelar agendamento
        await appointment.cancel(req.body.canceledBy, req.body.reason);

        res.json({
            success: true,
            message: 'Agendamento cancelado com sucesso',
            data: appointment
        });

    } catch (error) {
        logger.error('Erro ao cancelar agendamento:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao cancelar agendamento',
            code: 'INTERNAL_ERROR'
        });
    }
});

// @route   GET /api/appointments/stats/overview
// @desc    Obter estatísticas gerais
// @access  Private (Admin)
router.get('/stats/overview', [
    authenticateToken,
    authorize('admin')
], async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [
            totalToday,
            totalPending,
            totalConfirmed,
            totalCanceled
        ] = await Promise.all([
            Appointment.countDocuments({
                scheduledDate: { $gte: today, $lt: tomorrow },
                status: { $ne: 'cancelado' }
            }),
            Appointment.countDocuments({ status: 'pendente' }),
            Appointment.countDocuments({ status: 'confirmado' }),
            Appointment.countDocuments({ status: 'cancelado' })
        ]);

        res.json({
            success: true,
            data: {
                today: totalToday,
                pending: totalPending,
                confirmed: totalConfirmed,
                canceled: totalCanceled
            }
        });

    } catch (error) {
        logger.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar estatísticas',
            code: 'INTERNAL_ERROR'
        });
    }
});

module.exports = router;

