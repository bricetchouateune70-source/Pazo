import { Router } from 'express';
import { UserController } from '../controllers/UserController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/users/me - Eigenes Profil
router.get('/me', authenticate, UserController.getMe);

// GET /api/users - Alle User (Admin)
router.get('/', authenticate, requireAdmin, UserController.getAll);

// GET /api/users/:id - Einzelner User (Admin)
router.get('/:id', authenticate, requireAdmin, UserController.getById);

// PATCH /api/users/:id/role - Rolle ändern (Admin)
router.patch('/:id/role', authenticate, requireAdmin, UserController.updateRole);

// PATCH /api/users/:id/status - User aktivieren/deaktivieren (Admin)
router.patch('/:id/status', authenticate, requireAdmin, UserController.updateStatus);

// DELETE /api/users/:id - User löschen (Admin)
router.delete('/:id', authenticate, requireAdmin, UserController.delete);

export default router;
