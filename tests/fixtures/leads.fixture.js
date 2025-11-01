/**
 * Fixtures de dados de teste para Leads
 */

const fixtures = {
    validLead: {
        nome: 'Dr. João Silva',
        email: 'joao@example.com',
        telefone: '(11) 98765-4321',
        especialidade: 'cardiologia',
        origem: 'site',
        interesse: 'alto'
    },
    
    leadWithClinic: {
        nome: 'Dra. Maria Santos',
        email: 'maria@example.com',
        telefone: '(11) 97654-3210',
        especialidade: 'dermatologia',
        origem: 'whatsapp',
        interesse: 'medio'
    },
    
    invalidLeads: {
        withoutName: {
            email: 'sem-nome@example.com',
            telefone: '(11) 99999-9999'
        },
        invalidEmail: {
            nome: 'Teste',
            email: 'email-invalido',
            telefone: '(11) 99999-9999'
        },
        withoutPhone: {
            nome: 'Teste',
            email: 'teste@example.com'
        }
    }
};

module.exports = fixtures;

