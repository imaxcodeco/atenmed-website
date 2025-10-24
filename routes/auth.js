const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const User = require('../models/User');
const { authenticateToken, logActivity } = require('../middleware/auth');
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

// @route   POST /api/auth/register
// @desc    Registrar novo usuário
// @access  Private (Admin only)
router.post('/register', [
    authenticateToken,
    body('nome')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome deve ter entre 2 e 100 caracteres'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido'),
    body('senha')
        .isLength({ min: 6 })
        .withMessage('Senha deve ter pelo menos 6 caracteres'),
    body('role')
        .isIn(['admin', 'vendedor', 'suporte', 'viewer'])
        .withMessage('Role inválida'),
    body('telefone').optional().trim(),
    body('departamento').optional().isIn(['vendas', 'suporte', 'desenvolvimento', 'marketing', 'administracao'])
], validateRequest, logActivity('register_user'), async (req, res) => {
    try {
        // Verificar se usuário tem permissão para criar usuários
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Apenas administradores podem criar usuários',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        const { nome, email, senha, role, telefone, departamento } = req.body;

        // Verificar se email já existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'Email já está em uso',
                code: 'EMAIL_EXISTS'
            });
        }

        // Criar usuário
        const userData = {
            nome,
            email,
            senha,
            role,
            telefone,
            departamento
        };

        const user = new User(userData);
        await user.save();

        // Log da criação
        logger.logBusinessEvent('user_created', {
            userId: user._id,
            email: user.email,
            role: user.role,
            createdBy: req.user.email
        });

        res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso',
            data: user.obterDadosPublicos()
        });

    } catch (error) {
        logger.logError(error, req);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login de usuário
// @access  Public
router.post('/login', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido'),
    body('senha')
        .notEmpty()
        .withMessage('Senha é obrigatória')
], validateRequest, async (req, res) => {
    try {
        const { email, senha } = req.body;
        // DEBUG TEMPORÁRIO - remover após testes
        console.log('🔍 [DEBUG] Tipo de req.body:', typeof req.body, 'Conteúdo:', req.body);

        // Buscar usuário incluindo senha
        const user = await User.findOne({ email }).select('+senha');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Credenciais inválidas',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Verificar se usuário está ativo
        if (!user.ativo) {
            return res.status(401).json({
                success: false,
                error: 'Usuário inativo',
                code: 'USER_INACTIVE'
            });
        }

        // Verificar se usuário está bloqueado
        if (user.estaBloqueado) {
            return res.status(401).json({
                success: false,
                error: 'Usuário bloqueado. Tente novamente mais tarde',
                code: 'USER_BLOCKED'
            });
        }

        // Verificar senha
        const isPasswordValid = await user.verificarSenha(senha);
        
        if (!isPasswordValid) {
            // Incrementar tentativas de login
            await user.incrementarTentativasLogin();
            
            return res.status(401).json({
                success: false,
                error: 'Credenciais inválidas',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Resetar tentativas de login
        await user.resetarTentativasLogin();
        
        // Atualizar último login
        await user.atualizarUltimoLogin();

        // Gerar token JWT
        const token = jwt.sign(
            { 
                userId: user._id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Log do login
        logger.logBusinessEvent('user_login', {
            userId: user._id,
            email: user.email,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            data: {
                token,
                user: user.obterDadosPublicos()
            }
        });

    } catch (error) {
        logger.logError(error, req);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// @route   GET /api/auth/me
// @desc    Obter dados do usuário logado
// @access  Private
router.get('/me', authenticateToken, logActivity('get_profile'), async (req, res) => {
    try {
        res.json({
            success: true,
            data: req.user.obterDadosPublicos()
        });
    } catch (error) {
        logger.logError(error, req);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// @route   PUT /api/auth/me
// @desc    Atualizar dados do usuário logado
// @access  Private
router.put('/me', [
    authenticateToken,
    body('nome').optional().trim().isLength({ min: 2, max: 100 }),
    body('telefone').optional().trim(),
    body('departamento').optional().isIn(['vendas', 'suporte', 'desenvolvimento', 'marketing', 'administracao']),
    body('configuracoes.tema').optional().isIn(['claro', 'escuro', 'auto']),
    body('configuracoes.idioma').optional().isIn(['pt-BR', 'en-US'])
], validateRequest, logActivity('update_profile'), async (req, res) => {
    try {
        const allowedFields = ['nome', 'telefone', 'departamento', 'configuracoes'];
        
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                if (field === 'configuracoes') {
                    req.user.configuracoes = { ...req.user.configuracoes, ...req.body[field] };
                } else {
                    req.user[field] = req.body[field];
                }
            }
        });

        await req.user.save();

        res.json({
            success: true,
            message: 'Perfil atualizado com sucesso',
            data: req.user.obterDadosPublicos()
        });

    } catch (error) {
        logger.logError(error, req);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// @route   POST /api/auth/change-password
// @desc    Alterar senha do usuário logado
// @access  Private
router.post('/change-password', [
    authenticateToken,
    body('senhaAtual').notEmpty().withMessage('Senha atual é obrigatória'),
    body('novaSenha')
        .isLength({ min: 6 })
        .withMessage('Nova senha deve ter pelo menos 6 caracteres')
], validateRequest, logActivity('change_password'), async (req, res) => {
    try {
        const { senhaAtual, novaSenha } = req.body;

        // Buscar usuário com senha
        const user = await User.findById(req.user._id).select('+senha');

        // Verificar senha atual
        const isCurrentPasswordValid = await user.verificarSenha(senhaAtual);
        
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                error: 'Senha atual incorreta',
                code: 'INVALID_CURRENT_PASSWORD'
            });
        }

        // Atualizar senha
        user.senha = novaSenha;
        await user.save();

        res.json({
            success: true,
            message: 'Senha alterada com sucesso'
        });

    } catch (error) {
        logger.logError(error, req);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout (invalidar token)
// @access  Private
router.post('/logout', authenticateToken, logActivity('logout'), async (req, res) => {
    try {
        // Em uma implementação mais robusta, você manteria uma blacklist de tokens
        // Por enquanto, apenas logamos o logout
        logger.logBusinessEvent('user_logout', {
            userId: req.user._id,
            email: req.user.email
        });

        res.json({
            success: true,
            message: 'Logout realizado com sucesso'
        });

    } catch (error) {
        logger.logError(error, req);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

module.exports = router;







