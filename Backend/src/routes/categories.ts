import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/categories - Alle aktiven Kategorien (öffentlich)
router.get('/', CategoryController.getAll);

// GET /api/categories/all - Alle Kategorien (Admin)
router.get('/all', authenticate, requireAdmin, CategoryController.getAllAdmin);

// GET /api/categories/:slug - Kategorie mit Produkten
router.get('/:slug', CategoryController.getBySlug);

// POST /api/categories - Neue Kategorie (Admin)
router.post('/', authenticate, requireAdmin, CategoryController.create);

// PUT /api/categories/:id - Kategorie bearbeiten (Admin)
router.put('/:id', authenticate, requireAdmin, CategoryController.update);

// DELETE /api/categories/:id - Kategorie löschen (Admin)
router.delete('/:id', authenticate, requireAdmin, CategoryController.delete);

export default router;
