/**
 * Setup para testes Jest
 */

// Configurar variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long';
process.env.MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/atenmed_test';

// Suprimir logs durante testes
const originalConsole = console;
global.console = {
    ...originalConsole,
    log: () => {},
    info: () => {},
    warn: () => {},
    error: () => {}
};

