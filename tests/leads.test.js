/**
 * Testes de Leads - AtenMed
 */

const request = require('supertest');

describe('Leads API', () => {
    describe('POST /api/leads', () => {
        it('deve criar um novo lead com dados válidos', async () => {
            const leadData = {
                nome: 'Dr. Teste Silva',
                email: 'teste@example.com',
                telefone: '(11) 99999-9999',
                especialidade: 'cardiologia',
                origem: 'site'
            };

            const response = await request(require('../server'))
                .post('/api/leads')
                .send(leadData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.nome).toBe(leadData.nome);
        });

        it('deve rejeitar lead sem nome', async () => {
            const response = await request(require('../server'))
                .post('/api/leads')
                .send({
                    email: 'teste@example.com',
                    telefone: '(11) 99999-9999'
                });

            expect(response.status).toBeGreaterThanOrEqual(400);
        });

        it('deve rejeitar lead com email inválido', async () => {
            const response = await request(require('../server'))
                .post('/api/leads')
                .send({
                    nome: 'Teste',
                    email: 'email-invalido',
                    telefone: '(11) 99999-9999'
                });

            expect(response.status).toBeGreaterThanOrEqual(400);
        });

        it('deve rejeitar lead sem telefone', async () => {
            const response = await request(require('../server'))
                .post('/api/leads')
                .send({
                    nome: 'Teste',
                    email: 'teste@example.com'
                });

            expect(response.status).toBeGreaterThanOrEqual(400);
        });
    });

    describe('GET /api/leads', () => {
        it('deve listar leads com paginação', async () => {
            const response = await request(require('../server'))
                .get('/api/leads')
                .query({ page: 1, limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('leads');
            expect(response.body.data).toHaveProperty('pagination');
        });
    });

    describe('DELETE /api/leads/:id', () => {
        it('deve exigir autenticação', async () => {
            const response = await request(require('../server'))
                .delete('/api/leads/507f1f77bcf86cd799439011');

            expect(response.status).toBe(401);
        });
    });
});

