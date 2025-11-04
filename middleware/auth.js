const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const { setUser } = require('../utils/sentry');

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Token de acesso requerido',
        code: 'TOKEN_REQUIRED',
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuário no banco (com populate da clínica)
    const user = await User.findById(decoded.userId)
      .select('-senha')
      .populate('clinic', 'name slug logo');

    if (!user) {
      return res.status(401).json({
        error: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND',
      });
    }

    if (!user.ativo) {
      return res.status(401).json({
        error: 'Usuário inativo',
        code: 'USER_INACTIVE',
      });
    }

    if (user.estaBloqueado) {
      return res.status(401).json({
        error: 'Usuário bloqueado',
        code: 'USER_BLOCKED',
      });
    }

    // Adicionar usuário à requisição
    req.user = user;

    // Multi-tenancy: adicionar contexto da clínica
    if (user.clinic) {
      // Extrair ID se clinic estiver populado (objeto) ou usar diretamente se for ObjectId
      // user.clinic pode ser um objeto populado { _id: ..., name: ... } ou um ObjectId
      if (user.clinic._id) {
        req.clinicId = user.clinic._id;
      } else {
        req.clinicId = user.clinic;
      }
      req.clinicRole = user.clinicRole || 'viewer';

      logger.info(
        `🔐 User ${user.email} vinculado à clínica: ${req.clinicId} (role: ${req.clinicRole})`
      );
    }

    // Se é admin global (sem clínica vinculada)
    if (user.role === 'admin' && !user.clinic) {
      req.isGlobalAdmin = true;
    }

    // Definir usuário no Sentry para rastreamento
    setUser(user);

    next();
  } catch (error) {
    logger.logError(error, req);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido',
        code: 'INVALID_TOKEN',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED',
      });
    }

    return res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR',
    });
  }
};

// Middleware para verificar roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Autenticação requerida',
        code: 'AUTH_REQUIRED',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Acesso negado. Permissões insuficientes',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    next();
  };
};

// Middleware para verificar permissões específicas
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Autenticação requerida',
        code: 'AUTH_REQUIRED',
      });
    }

    if (!req.user.temPermissao(permission)) {
      return res.status(403).json({
        error: `Permissão '${permission}' requerida`,
        code: 'PERMISSION_DENIED',
      });
    }

    next();
  };
};

// Middleware para rate limiting por usuário
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user._id.toString();
    const now = Date.now();
    const windowStart = now - windowMs;

    // Limpar requisições antigas
    if (requests.has(userId)) {
      const userRequests = requests.get(userId).filter((time) => time > windowStart);
      requests.set(userId, userRequests);
    } else {
      requests.set(userId, []);
    }

    const userRequests = requests.get(userId);

    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Muitas requisições. Tente novamente mais tarde',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000),
      });
    }

    userRequests.push(now);
    next();
  };
};

// Middleware para log de atividades
const logActivity = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;

    res.send = function (data) {
      // Log da atividade
      logger.logBusinessEvent(`user_${action}`, {
        userId: req.user?._id,
        userEmail: req.user?.email,
        action,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      originalSend.call(this, data);
    };

    next();
  };
};

// Middleware para verificar se é o próprio usuário ou admin
const selfOrAdmin = (req, res, next) => {
  const targetUserId = req.params.userId || req.params.id;

  if (!req.user) {
    return res.status(401).json({
      error: 'Autenticação requerida',
      code: 'AUTH_REQUIRED',
    });
  }

  // Admin pode acessar qualquer usuário
  if (req.user.role === 'admin') {
    return next();
  }

  // Usuário pode acessar apenas seus próprios dados
  if (req.user._id.toString() === targetUserId) {
    return next();
  }

  return res.status(403).json({
    error: 'Acesso negado. Você só pode acessar seus próprios dados',
    code: 'ACCESS_DENIED',
  });
};

module.exports = {
  authenticateToken,
  authorize,
  authorizeRoles: authorize, // Alias para compatibilidade
  requirePermission,
  userRateLimit,
  logActivity,
  selfOrAdmin,
};
