const express = require('express');
const { createBullBoard } = require('@bull-board/api');
const { BullAdapter } = require('@bull-board/api/bullAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { authenticateToken, authorize } = require('../middleware/auth');
const { emailQueue, notificationQueue, reminderQueue } = require('../services/queueService');

const router = express.Router();

// Criar adapter do Express para o Bull Board
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

// Configurar Bull Board com as filas
createBullBoard({
    queues: [
        new BullAdapter(emailQueue),
        new BullAdapter(notificationQueue),
        new BullAdapter(reminderQueue),
    ],
    serverAdapter: serverAdapter,
});

// Proteger rota com autenticação de admin
router.use('/queues', authenticateToken, authorize('admin'), serverAdapter.getRouter());

module.exports = router;

