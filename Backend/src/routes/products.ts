import { Router } from 'express';
import { ProductController } from '../controllers/ProductController.js';
import { authenticate, requireAdmin, requireBaecker } from '../middleware/auth.js';

const router = Router();

// GET /api/products - Alle aktiven Produkte (öffentlich)
router.get('/', ProductController.getAll);

// GET /api/products/all - Alle Produkte (Admin)
router.get('/all', authenticate, requireAdmin, ProductController.getAllAdmin);

// GET /api/products/:id - Einzelnes Produkt
router.get('/:id', ProductController.getById);

// POST /api/products - Neues Produkt (Admin)
router.post('/', authenticate, requireAdmin, ProductController.create);

// PUT /api/products/:id - Produkt bearbeiten (Admin)
router.put('/:id', authenticate, requireAdmin, ProductController.update);

// DELETE /api/products/:id - Produkt löschen (Admin)
router.delete('/:id', authenticate, requireAdmin, ProductController.delete);

// PATCH /api/products/:id/stock - Stock aktualisieren (Bäcker+)
router.patch('/:id/stock', authenticate, requireBaecker, ProductController.updateStock);

// PATCH /api/products/:id/availability - Verfügbarkeit ändern (Bäcker+)
router.patch('/:id/availability', authenticate, requireBaecker, ProductController.toggleAvailability);

export default router;
