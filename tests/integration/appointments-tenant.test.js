/**
 * Testes de Integração: Isolamento Multi-Tenant em Appointments
 * 
 * Verifica que o isolamento de tenant está funcionando corretamente
 */

const request = require('supertest');
const { createAuthenticatedUser, cleanupTestData } = require('../helpers/testHelpers');
const Appointment = require('../../models/Appointment');
const Doctor = require('../../models/Doctor');
const Specialty = require('../../models/Specialty');

describe('Appointments - Tenant Isolation', () => {
    let clinic1Auth, clinic2Auth;
    let doctor1, doctor2;
    
    beforeAll(async () => {
        // Criar duas clínicas com usuários autenticados
        clinic1Auth = await createAuthenticatedUser({
            nome: 'Admin Clínica 1',
            email: 'admin1@test.com',
            clinicRole: 'owner'
        });
        
        clinic2Auth = await createAuthenticatedUser({
            nome: 'Admin Clínica 2',
            email: 'admin2@test.com',
            clinicRole: 'owner'
        });
        
        // Criar médicos para cada clínica
        doctor1 = new Doctor({
            name: 'Dr. Clínica 1',
            email: 'doctor1@test.com',
            clinic: clinic1Auth.clinic._id,
            active: true
        });
        await doctor1.save();
        
        doctor2 = new Doctor({
            name: 'Dr. Clínica 2',
            email: 'doctor2@test.com',
            clinic: clinic2Auth.clinic._id,
            active: true
        });
        await doctor2.save();
        
        // Criar especialidades
        const specialty1 = new Specialty({
            name: 'Cardiologia',
            clinic: clinic1Auth.clinic._id,
            active: true
        });
        await specialty1.save();
        
        const specialty2 = new Specialty({
            name: 'Dermatologia',
            clinic: clinic2Auth.clinic._id,
            active: true
        });
        await specialty2.save();
        
        // Criar agendamentos para cada clínica
        const appointment1 = new Appointment({
            patient: { name: 'Paciente 1', phone: '(11) 11111-1111' },
            doctor: doctor1._id,
            specialty: specialty1._id,
            clinic: clinic1Auth.clinic._id,
            scheduledDate: new Date('2024-12-25'),
            scheduledTime: '10:00',
            status: 'confirmado'
        });
        await appointment1.save();
        
        const appointment2 = new Appointment({
            patient: { name: 'Paciente 2', phone: '(11) 22222-2222' },
            doctor: doctor2._id,
            specialty: specialty2._id,
            clinic: clinic2Auth.clinic._id,
            scheduledDate: new Date('2024-12-26'),
            scheduledTime: '14:00',
            status: 'confirmado'
        });
        await appointment2.save();
    });
    
    afterAll(async () => {
        await cleanupTestData();
        await Appointment.deleteMany({});
        await Doctor.deleteMany({});
        await Specialty.deleteMany({});
    });
    
    describe('GET /api/appointments', () => {
        it('deve retornar apenas agendamentos da clínica do usuário (Clínica 1)', async () => {
            const response = await request(require('../../server'))
                .get('/api/appointments')
                .set('Authorization', clinic1Auth.authHeader);
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            
            // Verificar que todos os agendamentos são da clínica 1
            const appointments = response.body.data.appointments || response.body.data;
            appointments.forEach(apt => {
                expect(apt.clinic.toString()).toBe(clinic1Auth.clinic._id.toString());
            });
        });
        
        it('deve retornar apenas agendamentos da clínica do usuário (Clínica 2)', async () => {
            const response = await request(require('../../server'))
                .get('/api/appointments')
                .set('Authorization', clinic2Auth.authHeader);
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            
            const appointments = response.body.data.appointments || response.body.data;
            appointments.forEach(apt => {
                expect(apt.clinic.toString()).toBe(clinic2Auth.clinic._id.toString());
            });
        });
        
        it('não deve permitir acesso sem autenticação', async () => {
            const response = await request(require('../../server'))
                .get('/api/appointments');
            
            expect(response.status).toBe(401);
        });
    });
    
    describe('GET /api/appointments/:id', () => {
        let appointmentId1, appointmentId2;
        
        beforeAll(async () => {
            const apts = await Appointment.find({});
            appointmentId1 = apts.find(a => a.clinic.toString() === clinic1Auth.clinic._id.toString())?._id;
            appointmentId2 = apts.find(a => a.clinic.toString() === clinic2Auth.clinic._id.toString())?._id;
        });
        
        it('deve permitir acesso ao próprio agendamento (Clínica 1)', async () => {
            if (!appointmentId1) return;
            
            const response = await request(require('../../server'))
                .get(`/api/appointments/${appointmentId1}`)
                .set('Authorization', clinic1Auth.authHeader);
            
            expect(response.status).toBe(200);
        });
        
        it('deve bloquear acesso ao agendamento de outra clínica', async () => {
            if (!appointmentId2) return;
            
            // Clínica 1 tentando acessar agendamento da Clínica 2
            const response = await request(require('../../server'))
                .get(`/api/appointments/${appointmentId2}`)
                .set('Authorization', clinic1Auth.authHeader);
            
            // Deve retornar 404 ou 403 (não encontrado ou sem permissão)
            expect([404, 403]).toContain(response.status);
        });
    });
});

