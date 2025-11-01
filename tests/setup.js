/**
 * Setup para testes Jest
 */

// Configurar variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long';
process.env.MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/atenmed_test';
process.env.EMAIL_HOST = 'test';
process.env.EMAIL_USER = 'test';
process.env.EMAIL_PASS = 'test';

// Suprimir logs durante testes (opcional - comentar para debug)
if (process.env.DEBUG_TESTS !== 'true') {
    const originalConsole = console;
    global.console = {
        ...originalConsole,
        log: () => {},
        info: () => {},
        warn: () => {},
        error: () => {}
    };
}

// Timeout padrão para testes (30 segundos)
jest.setTimeout(30000);

