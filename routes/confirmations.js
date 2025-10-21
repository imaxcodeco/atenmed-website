const express = require('express');
const { param, body } = require('express-validator');
const Appointment = require('../models/Appointment');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const reminderService = require('../services/reminderService');
const crypto = require('crypto');

const router = express.Router();

// Middleware de validação
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Dados inválidos',
            errors: errors.array()
        });
    }
    next();
};

// @route   GET /api/confirmations/:id/confirm
// @desc    Confirmar consulta por link único
// @access  Public
router.get('/:id/confirm', [
    param('id').isMongoId().withMessage('ID inválido')
], validateRequest, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('doctor', 'name')
            .populate('specialty', 'name')
            .populate('clinic', 'name address');

        if (!appointment) {
            return res.status(404).send(`
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Agendamento não encontrado</title>
                    <style>
                        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #fee2e2; }
                        .error-box { background: white; padding: 3rem; border-radius: 10px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 400px; }
                        h1 { color: #dc2626; }
                    </style>
                </head>
                <body>
                    <div class="error-box">
                        <h1>❌ Agendamento não encontrado</h1>
                        <p>O link de confirmação pode estar incorreto ou a consulta já foi cancelada.</p>
                    </div>
                </body>
                </html>
            `);
        }

        // Verificar se já foi confirmada
        if (appointment.confirmations.patient.confirmed) {
            return res.send(getConfirmationHTML(appointment, true));
        }

        // Verificar se a consulta já passou
        if (appointment.isPast) {
            return res.status(400).send(`
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Consulta já passou</title>
                    <style>
                        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #fef3c7; }
                        .warning-box { background: white; padding: 3rem; border-radius: 10px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 400px; }
                        h1 { color: #d97706; }
                    </style>
                </head>
                <body>
                    <div class="warning-box">
                        <h1>⚠️ Consulta já passou</h1>
                        <p>Não é possível confirmar uma consulta que já ocorreu.</p>
                    </div>
                </body>
                </html>
            `);
        }

        // Gerar token de confirmação
        const confirmationToken = crypto.randomBytes(32).toString('hex');
        
        // Confirmar presença
        await appointment.confirmPresence('link', confirmationToken);

        logger.info(`✅ Consulta confirmada via link - ${appointment._id} - ${appointment.patient.name}`);

        // Retornar página de sucesso
        res.send(getConfirmationHTML(appointment, false));

    } catch (error) {
        logger.error('Erro ao confirmar consulta:', error);
        res.status(500).send(`
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Erro</title>
                <style>
                    body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #fee2e2; }
                    .error-box { background: white; padding: 3rem; border-radius: 10px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 400px; }
                </style>
            </head>
            <body>
                <div class="error-box">
                    <h1>❌ Erro ao confirmar</h1>
                    <p>Ocorreu um erro ao processar sua confirmação. Por favor, tente novamente.</p>
                </div>
            </body>
            </html>
        `);
    }
});

// @route   POST /api/confirmations/:id/confirm
// @desc    Confirmar consulta via API (WhatsApp, etc)
// @access  Public
router.post('/:id/confirm', [
    param('id').isMongoId().withMessage('ID inválido')
], validateRequest, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('doctor', 'name')
            .populate('specialty', 'name')
            .populate('clinic', 'name');

        if (!appointment) {
            return res.status(404).json({
                success: false,
                error: 'Agendamento não encontrado'
            });
        }

        if (appointment.confirmations.patient.confirmed) {
            return res.json({
                success: true,
                message: 'Consulta já estava confirmada',
                data: appointment
            });
        }

        if (appointment.isPast) {
            return res.status(400).json({
                success: false,
                error: 'Não é possível confirmar uma consulta que já passou'
            });
        }

        await appointment.confirmPresence('whatsapp');

        logger.info(`✅ Consulta confirmada via API - ${appointment._id}`);

        res.json({
            success: true,
            message: 'Consulta confirmada com sucesso! ✅',
            data: {
                id: appointment._id,
                patient: appointment.patient.name,
                doctor: appointment.doctor.name,
                scheduledDate: appointment.scheduledDate,
                scheduledTime: appointment.scheduledTime,
                confirmed: true,
                confirmedAt: appointment.confirmations.patient.confirmedAt
            }
        });

    } catch (error) {
        logger.error('Erro ao confirmar consulta:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao confirmar consulta'
        });
    }
});

// @route   POST /api/confirmations/:id/cancel
// @desc    Cancelar consulta com motivo
// @access  Public
router.post('/:id/cancel', [
    param('id').isMongoId().withMessage('ID inválido'),
    body('reason').trim().isLength({ min: 3 }).withMessage('Informe o motivo do cancelamento')
], validateRequest, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('doctor', 'name googleCalendarId')
            .populate('clinic', 'name');

        if (!appointment) {
            return res.status(404).json({
                success: false,
                error: 'Agendamento não encontrado'
            });
        }

        if (appointment.status === 'cancelado') {
            return res.json({
                success: true,
                message: 'Consulta já estava cancelada'
            });
        }

        await appointment.cancel('patient', req.body.reason);

        // Cancelar no Google Calendar
        const googleCalendarService = require('../services/googleCalendarService');
        if (appointment.googleEventId && googleCalendarService.isAuthenticated()) {
            try {
                await googleCalendarService.cancelEvent(
                    appointment.googleCalendarId,
                    appointment.googleEventId
                );
            } catch (error) {
                logger.warn('Erro ao cancelar no Google Calendar:', error);
            }
        }

        logger.info(`🚫 Consulta cancelada pelo paciente - ${appointment._id}`);

        res.json({
            success: true,
            message: 'Consulta cancelada com sucesso',
            data: {
                id: appointment._id,
                canceledAt: appointment.canceledAt,
                cancelReason: appointment.cancelReason
            }
        });

    } catch (error) {
        logger.error('Erro ao cancelar consulta:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao cancelar consulta'
        });
    }
});

// @route   POST /api/confirmations/:id/send-reminder
// @desc    Enviar lembrete manual
// @access  Private (Admin)
router.post('/:id/send-reminder', [
    authenticateToken,
    authorize('admin', 'recepcionista'),
    param('id').isMongoId().withMessage('ID inválido')
], validateRequest, async (req, res) => {
    try {
        const results = await reminderService.sendManualReminder(req.params.id);

        res.json({
            success: true,
            message: 'Lembrete enviado',
            data: results
        });

    } catch (error) {
        logger.error('Erro ao enviar lembrete:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// @route   GET /api/confirmations/stats
// @desc    Estatísticas de confirmações
// @access  Private (Admin)
router.get('/stats', [
    authenticateToken,
    authorize('admin')
], async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        const stats = await reminderService.getStats(start, end);

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        logger.error('Erro ao obter estatísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao obter estatísticas'
        });
    }
});

/**
 * Gerar HTML de confirmação
 */
function getConfirmationHTML(appointment, alreadyConfirmed) {
    const date = appointment.scheduledDate.toLocaleDateString('pt-BR');
    const time = appointment.scheduledTime;
    const doctor = appointment.doctor?.name || 'Médico';
    const specialty = appointment.specialty?.name || 'Consulta';
    const clinic = appointment.clinic?.name || 'Clínica';
    const address = appointment.clinic?.address 
        ? `${appointment.clinic.address.street}, ${appointment.clinic.address.number}`
        : '';

    return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${alreadyConfirmed ? 'Consulta já confirmada' : 'Consulta Confirmada!'}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #45a7b1, #184354);
                    padding: 20px;
                }
                .success-box {
                    background: white;
                    padding: 3rem;
                    border-radius: 15px;
                    text-align: center;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    max-width: 500px;
                    width: 100%;
                }
                .icon {
                    font-size: 5rem;
                    margin-bottom: 1rem;
                }
                h1 {
                    color: #45a7b1;
                    margin-bottom: 1rem;
                }
                .details {
                    background: #f8fafc;
                    padding: 1.5rem;
                    border-radius: 10px;
                    margin: 2rem 0;
                    text-align: left;
                }
                .detail-item {
                    margin: 10px 0;
                    display: flex;
                    align-items: flex-start;
                }
                .detail-label {
                    font-weight: bold;
                    min-width: 100px;
                }
                .info {
                    background: #e0f2fe;
                    padding: 1rem;
                    border-radius: 5px;
                    margin-top: 1rem;
                    font-size: 0.9rem;
                }
                .footer {
                    margin-top: 2rem;
                    color: #64748b;
                    font-size: 0.85rem;
                }
            </style>
        </head>
        <body>
            <div class="success-box">
                <div class="icon">${alreadyConfirmed ? '✅' : '🎉'}</div>
                <h1>${alreadyConfirmed ? 'Consulta já confirmada!' : 'Consulta Confirmada!'}</h1>
                <p>${alreadyConfirmed ? 'Você já havia confirmado esta consulta anteriormente.' : 'Sua presença foi confirmada com sucesso!'}</p>
                
                <div class="details">
                    <div class="detail-item">
                        <span class="detail-label">📅 Data:</span>
                        <span>${date}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">🕐 Horário:</span>
                        <span>${time}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">👨‍⚕️ Médico:</span>
                        <span>${doctor}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">🏥 Especialidade:</span>
                        <span>${specialty}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">📍 Local:</span>
                        <span>${clinic}</span>
                    </div>
                    ${address ? `
                    <div class="detail-item">
                        <span class="detail-label">Endereço:</span>
                        <span>${address}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="info">
                    <p><strong>⏰ Lembre-se:</strong></p>
                    <ul style="text-align: left; margin: 10px 0;">
                        <li>Chegue com 15 minutos de antecedência</li>
                        <li>Traga documentos e exames anteriores</li>
                        <li>Em caso de imprevisto, avise a clínica</li>
                    </ul>
                </div>
                
                ${!alreadyConfirmed ? `
                <p style="margin-top: 2rem; color: #10b981;">
                    ✅ Você receberá um lembrete 1 hora antes da consulta
                </p>
                ` : ''}
                
                <div class="footer">
                    <p>AtenMed - Organização Inteligente para Consultórios</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

module.exports = router;

