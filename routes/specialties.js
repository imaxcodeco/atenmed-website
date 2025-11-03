const express = require('express');
const { body, param, query } = require('express-validator');
const Specialty = require('../models/Specialty');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ success: false, error: 'Dados inválidos', errors: errors.array() });
  }
  next();
};

// Listar especialidades
router.get(
  '/',
  [
    authenticateToken,
    query('clinicId').optional().isMongoId(),
    query('active').optional().isBoolean(),
  ],
  validate,
  async (req, res) => {
    try {
      const filter = {};
      if (req.query.clinicId) filter.clinic = req.query.clinicId;
      if (req.query.active !== undefined) filter.active = req.query.active === 'true';
      const specialties = await Specialty.find(filter).sort('name');
      res.json({ success: true, data: specialties });
    } catch (error) {
      logger.error('Erro ao listar especialidades:', error);
      res.status(500).json({ success: false, error: 'Erro ao listar especialidades' });
    }
  }
);

// Criar especialidade
router.post(
  '/',
  [
    authenticateToken,
    authorize('admin'),
    body('name').trim().isLength({ min: 2 }),
    body('clinic').isMongoId(),
    body('description').optional().trim(),
    body('color')
      .optional()
      .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  ],
  validate,
  async (req, res) => {
    try {
      const specialty = new Specialty(req.body);
      await specialty.save();
      res.status(201).json({ success: true, data: specialty });
    } catch (error) {
      if (error.code === 11000) {
        return res
          .status(400)
          .json({ success: false, error: 'Especialidade já existe para esta clínica' });
      }
      logger.error('Erro ao criar especialidade:', error);
      res.status(500).json({ success: false, error: 'Erro ao criar especialidade' });
    }
  }
);

// Atualizar especialidade
router.put(
  '/:id',
  [authenticateToken, authorize('admin'), param('id').isMongoId()],
  validate,
  async (req, res) => {
    try {
      const updated = await Specialty.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!updated)
        return res.status(404).json({ success: false, error: 'Especialidade não encontrada' });
      res.json({ success: true, data: updated });
    } catch (error) {
      logger.error('Erro ao atualizar especialidade:', error);
      res.status(500).json({ success: false, error: 'Erro ao atualizar especialidade' });
    }
  }
);

// Deletar (soft: active=false)
router.delete(
  '/:id',
  [authenticateToken, authorize('admin'), param('id').isMongoId()],
  validate,
  async (req, res) => {
    try {
      const specialty = await Specialty.findByIdAndUpdate(
        req.params.id,
        { active: false },
        { new: true }
      );
      if (!specialty)
        return res.status(404).json({ success: false, error: 'Especialidade não encontrada' });
      res.json({ success: true, data: specialty });
    } catch (error) {
      logger.error('Erro ao desativar especialidade:', error);
      res.status(500).json({ success: false, error: 'Erro ao desativar especialidade' });
    }
  }
);

module.exports = router;
