/**
 * AtenMed - Clinic Routes
 * Rotas para páginas públicas de clínicas
 */

const express = require('express');
const router = express.Router();
const Clinic = require('../models/Clinic');
const Doctor = require('../models/Doctor');
const Specialty = require('../models/Specialty');
const Appointment = require('../models/Appointment');
const { authenticateToken, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');
const metaWhatsappService = require('../services/metaWhatsappService');
const clinicService = require('../services/clinicService');

// ===== ROTAS PÚBLICAS =====

/**
 * @route   GET /api/clinics/slug/:slug
 * @desc    Buscar clínica por slug (para página pública)
 * @access  Public
 */
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const clinic = await Clinic.findOne({ slug, isActive: true })
      .select('-__v -createdAt -updatedAt')
      .lean();

    if (!clinic) {
      return res.status(404).json({
        success: false,
        error: 'Clínica não encontrada',
        code: 'CLINIC_NOT_FOUND',
      });
    }

    // Incrementar visualizações
    await Clinic.findByIdAndUpdate(clinic._id, {
      $inc: { 'stats.pageViews': 1 },
    });

    res.json({
      success: true,
      data: clinic,
    });
  } catch (error) {
    logger.error('Erro ao buscar clínica por slug:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar clínica',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * @route   GET /api/clinics/public/:clinicId
 * @desc    Buscar informações públicas da clínica
 * @access  Public
 */
router.get('/public/:clinicId', async (req, res) => {
  try {
    const clinic = await Clinic.findOne({
      _id: req.params.clinicId,
      isActive: true,
    })
      .select('name slug description logo address contact workingHours social branding rating')
      .lean();

    if (!clinic) {
      return res.status(404).json({
        success: false,
        error: 'Clínica não encontrada',
        code: 'CLINIC_NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: clinic,
    });
  } catch (error) {
    logger.error('Erro ao buscar informações públicas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar informações',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * @route   GET /api/clinics/stats/:clinicId
 * @desc    Estatísticas públicas da clínica
 * @access  Public
 */
router.get('/stats/:clinicId', async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.clinicId).select('stats rating').lean();

    if (!clinic) {
      return res.status(404).json({
        success: false,
        error: 'Clínica não encontrada',
      });
    }

    res.json({
      success: true,
      data: {
        totalAppointments: clinic.stats?.totalAppointments || 0,
        activePatients: clinic.stats?.activePatients || 0,
        rating: clinic.rating || { average: 0, count: 0 },
        pageViews: clinic.stats?.pageViews || 0,
      },
    });
  } catch (error) {
    logger.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar estatísticas',
    });
  }
});

// ===== ROTAS ADMINISTRATIVAS =====

/**
 * @route   GET /api/clinics
 * @desc    Listar todas as clínicas
 * @access  Private (Admin)
 */
router.get('/', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const clinics = await Clinic.find().select('-__v').sort({ name: 1 });

    res.json({
      success: true,
      data: clinics,
      total: clinics.length,
    });
  } catch (error) {
    logger.error('Erro ao listar clínicas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar clínicas',
    });
  }
});

/**
 * @route   GET /api/clinics/:id
 * @desc    Buscar clínica específica por ID
 * @access  Private (Admin)
 */
router.get('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id).select('-__v');

    if (!clinic) {
      return res.status(404).json({
        success: false,
        error: 'Clínica não encontrada',
      });
    }

    res.json({
      success: true,
      data: clinic,
    });
  } catch (error) {
    logger.error('Erro ao buscar clínica:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar clínica',
    });
  }
});

/**
 * @route   POST /api/clinics
 * @desc    Criar nova clínica
 * @access  Private (Admin)
 */
router.post('/', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const clinicData = req.body;

    // Validar dados
    const validation = clinicService.validateClinicData(clinicData);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        errors: validation.errors,
      });
    }

    // Criar clínica usando serviço centralizado
    const { clinic, publicUrl, fullPublicUrl } = await clinicService.createClinic(clinicData);

    res.status(201).json({
      success: true,
      message: 'Clínica criada com sucesso',
      data: {
        ...clinic.toObject(),
        publicUrl,
        fullPublicUrl,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Já existe uma clínica com este slug',
        code: 'DUPLICATE_SLUG',
      });
    }

    logger.error('Erro ao criar clínica:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar clínica',
      details: error.message,
    });
  }
});

/**
 * @route   PUT /api/clinics/:id
 * @desc    Atualizar clínica
 * @access  Private (Admin)
 */
router.put('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const clinic = await Clinic.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!clinic) {
      return res.status(404).json({
        success: false,
        error: 'Clínica não encontrada',
      });
    }

    logger.info(`Clínica atualizada: ${clinic.name}`);

    res.json({
      success: true,
      message: 'Clínica atualizada com sucesso',
      data: clinic,
    });
  } catch (error) {
    logger.error('Erro ao atualizar clínica:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar clínica',
    });
  }
});

/**
 * @route   DELETE /api/clinics/:id
 * @desc    Deletar clínica (soft delete)
 * @access  Private (Admin)
 */
router.delete('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const clinic = await Clinic.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!clinic) {
      return res.status(404).json({
        success: false,
        error: 'Clínica não encontrada',
      });
    }

    logger.info(`Clínica desativada: ${clinic.name}`);

    res.json({
      success: true,
      message: 'Clínica desativada com sucesso',
    });
  } catch (error) {
    logger.error('Erro ao deletar clínica:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar clínica',
    });
  }
});

/**
 * @route   PUT /api/clinics/:id/branding
 * @desc    Atualizar branding da clínica
 * @access  Private (Admin ou Clínica Owner)
 */
router.put('/:id/branding', authenticateToken, async (req, res) => {
  try {
    const { primaryColor, secondaryColor, accentColor, logo, favicon } = req.body;

    const clinic = await Clinic.findByIdAndUpdate(
      req.params.id,
      {
        'branding.primaryColor': primaryColor,
        'branding.secondaryColor': secondaryColor,
        'branding.accentColor': accentColor,
        logo: logo,
        favicon: favicon,
      },
      { new: true }
    );

    if (!clinic) {
      return res.status(404).json({
        success: false,
        error: 'Clínica não encontrada',
      });
    }

    res.json({
      success: true,
      message: 'Branding atualizado com sucesso',
      data: clinic,
    });
  } catch (error) {
    logger.error('Erro ao atualizar branding:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar branding',
    });
  }
});

/**
 * @route   GET /api/clinics/doctors/:id
 * @desc    Listar médicos da clínica
 * @access  Public
 */
router.get('/doctors/:id', async (req, res) => {
  try {
    const doctors = await Doctor.find({
      clinic: req.params.id,
      isActive: true,
    })
      .populate('specialties', 'name icon')
      .select('name photo crm bio specialties workingDays workingHours')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    logger.error('Erro ao listar médicos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar médicos',
    });
  }
});

// ===== INTEGRAÇÃO META WHATSAPP =====

/**
 * @route   GET /api/clinics/:id/meta-setup
 * @desc    Gerar instruções para configurar número no Meta
 * @access  Private (Admin)
 */
router.get('/:id/meta-setup', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id);

    if (!clinic) {
      return res.status(404).json({
        success: false,
        error: 'Clínica não encontrada',
      });
    }

    if (!clinic.contact?.whatsapp) {
      return res.status(400).json({
        success: false,
        error: 'Clínica não tem número WhatsApp cadastrado',
      });
    }

    // Gerar instruções detalhadas
    const instructions = metaWhatsappService.generateMetaInstructions(clinic);

    // Gerar configuração rápida (copiar e colar)
    const quickConfig = metaWhatsappService.generateQuickConfig(clinic);

    // Verificar se número já está registrado
    const registrationStatus = await metaWhatsappService.checkNumberRegistration(
      clinic.contact.whatsapp
    );

    res.json({
      success: true,
      data: {
        clinic: {
          id: clinic._id,
          name: clinic.name,
          whatsapp: clinic.contact.whatsapp,
        },
        instructions,
        quickConfig,
        registrationStatus,
        automationAvailable: !!process.env.META_ACCESS_TOKEN,
      },
    });
  } catch (error) {
    logger.error('Erro ao gerar instruções Meta:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar instruções',
    });
  }
});

/**
 * @route   POST /api/clinics/:id/meta-register
 * @desc    Tentar registrar número automaticamente no Meta
 * @access  Private (Admin)
 */
router.post('/:id/meta-register', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id);

    if (!clinic) {
      return res.status(404).json({
        success: false,
        error: 'Clínica não encontrada',
      });
    }

    if (!clinic.contact?.whatsapp) {
      return res.status(400).json({
        success: false,
        error: 'Clínica não tem número WhatsApp cadastrado',
      });
    }

    // Tentar registro automático
    const result = await metaWhatsappService.registerNumberAutomatic(
      clinic.contact.whatsapp,
      clinic.name
    );

    if (result.success) {
      logger.info(`Número registrado no Meta para ${clinic.name}`);
    }

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    logger.error('Erro ao registrar no Meta:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
