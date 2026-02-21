import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { Role } from '@prisma/client';
import { z } from 'zod';

// Validation schemas
const updateUserRoleSchema = z.object({
  role: z.nativeEnum(Role),
});

const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export class UserController {
  // GET /api/users - Alle User (Admin)
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { role, search } = req.query;

      const users = await prisma.user.findMany({
        where: {
          ...(role && { role: role as Role }),
          ...(search && {
            OR: [
              { name: { contains: search as string, mode: 'insensitive' } },
              { email: { contains: search as string, mode: 'insensitive' } },
            ],
          }),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: { orders: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/users/:id - Einzelner User (Admin)
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          orders: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              status: true,
              total: true,
              createdAt: true,
            },
          },
          _count: {
            select: { orders: true },
          },
        },
      });

      if (!user) {
        throw new AppError(404, 'User nicht gefunden');
      }

      res.json({
        success: true,
        data: {
          ...user,
          orders: user.orders.map(o => ({ ...o, total: Number(o.total) })),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/users/:id/role - Rolle ändern (Admin)
  static async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateUserRoleSchema.parse(req.body);

      // Verhindern dass Admin sich selbst degradiert
      if (req.params.id === req.user!.userId && data.role !== Role.ADMIN) {
        throw new AppError(400, 'Du kannst deine eigene Admin-Rolle nicht entfernen');
      }

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { role: data.role },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });

      res.json({
        success: true,
        data: user,
        message: `Rolle geändert zu: ${data.role}`,
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/users/:id/status - User aktivieren/deaktivieren (Admin)
  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateUserStatusSchema.parse(req.body);

      // Verhindern dass Admin sich selbst deaktiviert
      if (req.params.id === req.user!.userId && !data.isActive) {
        throw new AppError(400, 'Du kannst dich nicht selbst deaktivieren');
      }

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { isActive: data.isActive },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });

      // Bei Deaktivierung alle Refresh Tokens löschen
      if (!data.isActive) {
        await prisma.refreshToken.deleteMany({
          where: { userId: req.params.id },
        });
      }

      res.json({
        success: true,
        data: user,
        message: user.isActive ? 'User aktiviert' : 'User deaktiviert',
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/users/:id - User löschen (Admin) - Soft delete
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      // Verhindern dass Admin sich selbst löscht
      if (req.params.id === req.user!.userId) {
        throw new AppError(400, 'Du kannst dich nicht selbst löschen');
      }

      // Soft delete: Nur deaktivieren
      await prisma.user.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });

      // Alle Refresh Tokens löschen
      await prisma.refreshToken.deleteMany({
        where: { userId: req.params.id },
      });

      res.json({
        success: true,
        message: 'User gelöscht (deaktiviert)',
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/users/me - Eigenes Profil
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
          isActive: true,
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
