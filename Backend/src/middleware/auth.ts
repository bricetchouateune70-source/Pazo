import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt.js';
import { AppError } from './errorHandler.js';
import { Role } from '@prisma/client';
import type { JwtPayload } from '@pazo/shared';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Auth Middleware - Prüft ob User eingeloggt ist
export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    // Token aus Cookie oder Authorization Header
    const token = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new AppError(401, 'Nicht authentifiziert');
    }

    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError(401, 'Ungültiger oder abgelaufener Token'));
  }
}

// Role Check Middleware Factory
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Nicht authentifiziert'));
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      return next(new AppError(403, 'Keine Berechtigung für diese Aktion'));
    }

    next();
  };
}

// Convenience Middleware
export const requireAdmin = requireRole(Role.ADMIN);
export const requireBaecker = requireRole(Role.ADMIN, Role.BAECKER);
export const requireLieferant = requireRole(Role.ADMIN, Role.LIEFERANT);
export const requireKunde = requireRole(Role.ADMIN, Role.KUNDE);

// Alle authentifizierten Rollen (für generelle Auth-Checks)
export const requireAnyRole = requireRole(Role.ADMIN, Role.BAECKER, Role.LIEFERANT, Role.KUNDE);
