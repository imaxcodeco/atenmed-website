const express = require('express');
const { body, param, query } = require('express-validator');
const Doctor = require('../models/Doctor');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

const router = express.Router();

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: 'Dados inválidos', errors: errors.array() });
    }
    next();
};

// Listar médicos
router.get('/', [
    authenticateToken,
    query('clinicId').optional().isMongoId(),
    query('active').optional().isBoolean()
], validate, async (req, res) => {
    try {
        const filter = {};
        if (req.query.clinicId) filter.clinic = req.query.clinicId;
        if (req.query.active !== undefined) filter.active = req.query.active === 'true';

        const doctors = await Doctor.find(filter)
            .populate('specialties', 'name')
            .populate('clinic', 'name');

        res.json({ success: true, data: doctors });
    } catch (error) {
        logger.error('Erro ao listar médicos:', error);
        res.status(500).json({ success: false, error: 'Erro ao listar médicos' });
    }
});

// Criar médico
router.post('/', [
    authenticateToken,
    authorize('admin'),
    body('name').trim().isLength({ min: 2 }),
    body('email').isEmail().normalizeEmail(),
    body('clinic').isMongoId(),
    body('specialties').isArray({ min: 1 }),
    body('googleCalendarId').notEmpty(),
    body('workingDays').optional().isArray(),
    body('workingHours.start').optional().isInt({ min: 0, max: 23 }),
    body('workingHours.end').optional().isInt({ min: 0, max: 23 }),
    body('slotDuration').optional().isInt({ min: 15, max: 180 })
], validate, async (req, res) => {
    try {
        const doctor = new Doctor(req.body);
        await doctor.save();
        res.status(201).json({ success: true, data: doctor });
    } catch (error) {
        logger.error('Erro ao criar médico:', error);
        res.status(500).json({ success: false, error: 'Erro ao criar médico' });
    }
});

// Atualizar médico
router.put('/:id', [
    authenticateToken,
    authorize('admin'),
    param('id').isMongoId()
], validate, async (req, res) => {
    try {
        const updated = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ success: false, error: 'Médico não encontrado' });
        res.json({ success: true, data: updated });
    } catch (error) {
        logger.error('Erro ao atualizar médico:', error);
        res.status(500).json({ success: false, error: 'Erro ao atualizar médico' });
    }
});

// Deletar (soft: active=false)
router.delete('/:id', [
    authenticateToken,
    authorize('admin'),
    param('id').isMongoId()
], validate, async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
        if (!doctor) return res.status(404).json({ success: false, error: 'Médico não encontrado' });
        res.json({ success: true, data: doctor });
    } catch (error) {
        logger.error('Erro ao desativar médico:', error);
        res.status(500).json({ success: false, error: 'Erro ao desativar médico' });
    }
});

module.exports = router;





