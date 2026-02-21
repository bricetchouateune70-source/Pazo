import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', AuthController.register);

// POST /api/auth/login
router.post('/login', AuthController.login);

// POST /api/auth/logout
router.post('/logout', authenticate, AuthController.logout);

// POST /api/auth/refresh
router.post('/refresh', AuthController.refresh);

// GET /api/auth/me
router.get('/me', authenticate, AuthController.getMe);

// PATCH /api/auth/profile - Profil aktualisieren
router.patch('/profile', authenticate, AuthController.updateProfile);

// PATCH /api/auth/password - Passwort ändern
router.patch('/password', authenticate, AuthController.changePassword);

export default router;
