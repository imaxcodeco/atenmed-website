/**
 * AtenMed - White Label Routes
 * Rotas para configurações de white label
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');
const Clinic = require('../models/Clinic');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;

// Configurar multer para uploads
const upload = multer({
    dest: 'uploads/whitelabel/',
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas'));
        }
    }
});

// ===== MIDDLEWARE =====
router.use(authenticateToken);

// ===== OBTER CONFIGURAÇÕES =====
/**
 * @route   GET /api/whitelabel
 * @desc    Obter configurações de white label da clínica
 * @access  Private
 */
router.get('/', async (req, res) => {
    try {
        const clinic = await Clinic.findById(req.clinicId);
        
        if (!clinic) {
            return res.status(404).json({
                success: false,
                error: 'Clínica não encontrada'
            });
        }
        
        res.json({
            success: true,
            whiteLabel: {
                logo: clinic.logo,
                primaryColor: clinic.branding?.primaryColor || '#45a7b1',
                secondaryColor: clinic.branding?.secondaryColor || '#184354',
                platformName: clinic.name || 'AtenMed'
            }
        });
        
    } catch (error) {
        logger.error('Erro ao obter white label:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao obter configurações'
        });
    }
});

// ===== SALVAR CONFIGURAÇÕES =====
/**
 * @route   PUT /api/whitelabel
 * @desc    Salvar configurações de white label
 * @access  Private
 */
router.put('/', async (req, res) => {
    try {
        const { primaryColor, secondaryColor, platformName } = req.body;
        
        const clinic = await Clinic.findById(req.clinicId);
        
        if (!clinic) {
            return res.status(404).json({
                success: false,
                error: 'Clínica não encontrada'
            });
        }
        
        // Atualizar branding
        if (!clinic.branding) {
            clinic.branding = {};
        }
        
        if (primaryColor) {
            clinic.branding.primaryColor = primaryColor;
        }
        
        if (secondaryColor) {
            clinic.branding.secondaryColor = secondaryColor;
        }
        
        await clinic.save();
        
        res.json({
            success: true,
            message: 'Configurações salvas com sucesso',
            whiteLabel: {
                primaryColor: clinic.branding.primaryColor,
                secondaryColor: clinic.branding.secondaryColor,
                platformName: clinic.name
            }
        });
        
    } catch (error) {
        logger.error('Erro ao salvar white label:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao salvar configurações'
        });
    }
});

// ===== UPLOAD DE LOGO =====
/**
 * @route   POST /api/whitelabel/logo
 * @desc    Upload de logo personalizado
 * @access  Private
 */
router.post('/logo', upload.single('logo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Arquivo é obrigatório'
            });
        }
        
        const clinic = await Clinic.findById(req.clinicId);
        
        if (!clinic) {
            return res.status(404).json({
                success: false,
                error: 'Clínica não encontrada'
            });
        }
        
        // Mover arquivo para diretório permanente
        const uploadDir = path.join(__dirname, '../uploads/whitelabel', req.clinicId.toString());
        await fs.mkdir(uploadDir, { recursive: true });
        
        const fileName = `logo_${Date.now()}${path.extname(req.file.originalname)}`;
        const filePath = path.join(uploadDir, fileName);
        
        await fs.rename(req.file.path, filePath);
        
        // URL relativa
        const logoUrl = `/uploads/whitelabel/${req.clinicId}/${fileName}`;
        
        clinic.logo = logoUrl;
        await clinic.save();
        
        res.json({
            success: true,
            message: 'Logo atualizado com sucesso',
            logoUrl
        });
        
    } catch (error) {
        logger.error('Erro ao fazer upload de logo:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao fazer upload'
        });
    }
});

module.exports = router;

