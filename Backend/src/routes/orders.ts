import { Router } from 'express';
import { OrderController } from '../controllers/OrderController.js';
import { authenticate, requireAdmin, requireBaecker, requireRole } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

// WICHTIG: Spezifische Routes VOR /:id Parameter Routes!

// GET /api/orders/stats/summary - Statistiken (Admin)
router.get('/stats/summary', authenticate, requireAdmin, OrderController.getStatsSummary);

// GET /api/orders/stats/today - Tagesstatistiken (Bäcker + Admin)
router.get('/stats/today', authenticate, requireBaecker, OrderController.getTodayStats);

// GET /api/orders/today - Tagesbestellungen (Bäcker + Admin)
router.get('/today', authenticate, requireBaecker, OrderController.getTodayOrders);

// POST /api/orders/pos - POS Bestellung (Bäcker)
router.post('/pos', authenticate, requireBaecker, OrderController.createPOS);

// GET /api/orders - Eigene Bestellungen oder alle (rollenbasiert)
router.get('/', authenticate, OrderController.getAll);

// GET /api/orders/:id - Einzelne Bestellung
router.get('/:id', authenticate, OrderController.getById);

// POST /api/orders - Neue Bestellung (Kunde)
router.post('/', authenticate, OrderController.create);

// PATCH /api/orders/:id/status - Status ändern (Staff)
router.patch('/:id/status', authenticate, requireRole(Role.ADMIN, Role.BAECKER, Role.LIEFERANT), OrderController.updateStatus);

// DELETE /api/orders/:id - Bestellung stornieren
router.delete('/:id', authenticate, OrderController.cancel);

export default router;
