/**
 * Testes de Autenticação - AtenMed
 * Execute: npm test
 */

const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../models/User');

// Mock do app Express (será configurado)
let app;

beforeAll(async () => {
    // Conectar ao banco de teste
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/atenmed_test', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    }
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Autenticação', () => {
    beforeEach(async () => {
        // Limpar dados de teste antes de cada teste
        await User.deleteMany({ email: { $regex: /^test/, $options: 'i' } });
    });

    describe('POST /api/auth/register-admin', () => {
        it('deve rejeitar registro sem dados obrigatórios', async () => {
            const response = await request(app || require('../server'))
                .post('/api/auth/register-admin')
                .send({});
            
            expect(response.status).toBeGreaterThanOrEqual(400);
        });

        it('deve rejeitar email inválido', async () => {
            const response = await request(app || require('../server'))
                .post('/api/auth/register-admin')
                .send({
                    nome: 'Teste',
                    email: 'email-invalido',
                    senha: 'senha123'
                });
            
            expect(response.status).toBeGreaterThanOrEqual(400);
        });

        it('deve rejeitar senha muito curta', async () => {
            const response = await request(app || require('../server'))
                .post('/api/auth/register-admin')
                .send({
                    nome: 'Teste',
                    email: 'teste@example.com',
                    senha: '123'
                });
            
            expect(response.status).toBeGreaterThanOrEqual(400);
        });
    });

    describe('POST /api/auth/login', () => {
        it('deve rejeitar login com credenciais inválidas', async () => {
            const response = await request(app || require('../server'))
                .post('/api/auth/login')
                .send({
                    email: 'naoexiste@example.com',
                    senha: 'senha123'
                });
            
            expect(response.status).toBe(401);
        });

        it('deve rejeitar login sem email', async () => {
            const response = await request(app || require('../server'))
                .post('/api/auth/login')
                .send({
                    senha: 'senha123'
                });
            
            expect(response.status).toBeGreaterThanOrEqual(400);
        });
    });
});

