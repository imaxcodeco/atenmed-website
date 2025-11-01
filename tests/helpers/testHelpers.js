/**
 * Helpers para testes - AtenMed
 * 
 * Funções auxiliares para facilitar escrita de testes
 */

const mongoose = require('mongoose');
const User = require('../../models/User');
const Clinic = require('../../models/Clinic');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Criar clínica de teste
 */
async function createTestClinic(data = {}) {
    const clinic = new Clinic({
        name: data.name || 'Clínica Teste',
        slug: data.slug || 'clinica-teste',
        contact: {
            email: data.email || 'teste@clinica.com',
            phone: data.phone || '(11) 99999-9999',
            whatsapp: data.whatsapp || '5511999999999'
        },
        subscription: {
            plan: data.plan || 'basic',
            status: data.status || 'active'
        },
        active: data.active !== undefined ? data.active : true,
        ...data
    });
    
    await clinic.save();
    return clinic;
}

/**
 * Criar usuário de teste
 */
async function createTestUser(data = {}) {
    const hashedPassword = await bcrypt.hash(data.senha || 'senha123', 10);
    
    const user = new User({
        nome: data.nome || 'Usuário Teste',
        email: data.email || 'teste@example.com',
        senha: hashedPassword,
        role: data.role || 'admin',
        clinic: data.clinicId,
        clinicRole: data.clinicRole || 'owner',
        ativo: data.ativo !== undefined ? data.ativo : true,
        ...data
    });
    
    await user.save();
    return user;
}

/**
 * Gerar token JWT para testes
 */
function generateTestToken(user) {
    return jwt.sign(
        { userId: user._id.toString() },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
    );
}

/**
 * Criar usuário autenticado completo (usuário + token)
 */
async function createAuthenticatedUser(data = {}) {
    const clinic = data.clinicId ? null : await createTestClinic();
    const clinicId = data.clinicId || clinic._id;
    
    const user = await createTestUser({
        ...data,
        clinicId
    });
    
    const token = generateTestToken(user);
    
    return {
        user,
        clinic: clinic || await Clinic.findById(clinicId),
        token,
        authHeader: `Bearer ${token}`
    };
}

/**
 * Limpar dados de teste
 */
async function cleanupTestData() {
    await User.deleteMany({ email: { $regex: /^test/, $options: 'i' } });
    await Clinic.deleteMany({ name: { $regex: /test/i } });
}

/**
 * Mock de request com autenticação
 */
function createMockRequest(authData = {}) {
    const { user, clinic } = authData;
    
    return {
        user: user || null,
        clinicId: clinic?._id || user?.clinic || null,
        clinicRole: user?.clinicRole || null,
        isGlobalAdmin: user?.role === 'admin' && !user?.clinic || false,
        body: {},
        query: {},
        params: {},
        headers: {},
        ip: '127.0.0.1'
    };
}

/**
 * Aguardar um tempo (útil para testes de timing)
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    createTestClinic,
    createTestUser,
    generateTestToken,
    createAuthenticatedUser,
    cleanupTestData,
    createMockRequest,
    sleep
};

