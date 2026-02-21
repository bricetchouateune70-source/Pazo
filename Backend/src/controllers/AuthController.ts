import { Request, Response, NextFunction } from 'express';
import * as argon2 from 'argon2';
import { prisma } from '../lib/prisma.js';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  getRefreshTokenExpiresAt 
} from '../lib/jwt.js';
import { AppError } from '../middleware/errorHandler.js';
import { registerSchema, loginSchema } from '@pazo/shared';

// Cookie Optionen
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export class AuthController {
  // POST /api/auth/register
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);

      // Prüfen ob Email bereits existiert
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new AppError(409, 'Diese E-Mail-Adresse ist bereits registriert');
      }

      // Passwort hashen
      const passwordHash = await argon2.hash(data.password);

      // User erstellen
      const user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      // Tokens generieren
      const tokenPayload = { userId: user.id, email: user.email, role: user.role };
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      // Refresh Token in DB speichern
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: getRefreshTokenExpiresAt(),
        },
      });

      // Cookies setzen
      res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
      res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

      res.status(201).json({
        success: true,
        data: {
          user,
          accessToken,
        },
        message: 'Registrierung erfolgreich',
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/login
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);

      // User finden
      const user = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (!user) {
        throw new AppError(401, 'Ungültige E-Mail oder Passwort');
      }

      if (!user.isActive) {
        throw new AppError(403, 'Dieses Konto wurde deaktiviert');
      }

      // Passwort prüfen
      const validPassword = await argon2.verify(user.passwordHash, data.password);
      if (!validPassword) {
        throw new AppError(401, 'Ungültige E-Mail oder Passwort');
      }

      // Tokens generieren
      const tokenPayload = { userId: user.id, email: user.email, role: user.role };
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      // Refresh Token in DB speichern
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: getRefreshTokenExpiresAt(),
        },
      });

      // Cookies setzen
      res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
      res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          accessToken,
        },
        message: 'Login erfolgreich',
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/logout
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;

      // Refresh Token aus DB löschen
      if (refreshToken) {
        await prisma.refreshToken.deleteMany({
          where: { token: refreshToken },
        });
      }

      // Cookies löschen
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      res.json({
        success: true,
        message: 'Logout erfolgreich',
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/refresh
  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        throw new AppError(401, 'Kein Refresh Token vorhanden');
      }

      // Token verifizieren
      const payload = verifyRefreshToken(refreshToken);

      // Token in DB prüfen
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new AppError(401, 'Refresh Token ungültig oder abgelaufen');
      }

      // User prüfen
      if (!storedToken.user.isActive) {
        throw new AppError(403, 'Dieses Konto wurde deaktiviert');
      }

      // Alten Token löschen
      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      // Neue Tokens generieren
      const newPayload = { 
        userId: storedToken.user.id, 
        email: storedToken.user.email, 
        role: storedToken.user.role 
      };
      const newAccessToken = generateAccessToken(newPayload);
      const newRefreshToken = generateRefreshToken(newPayload);

      // Neuen Refresh Token speichern
      await prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: storedToken.user.id,
          expiresAt: getRefreshTokenExpiresAt(),
        },
      });

      // Cookies setzen
      res.cookie('accessToken', newAccessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
      res.cookie('refreshToken', newRefreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
        },
        message: 'Token erneuert',
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/auth/me
  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          address: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new AppError(404, 'User nicht gefunden');
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}
