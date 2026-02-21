import { Request, Response, NextFunction } from 'express';
import { OrderModel } from '../models/Order.js';
import { ProductModel } from '../models/Product.js';
import { AppError } from '../middleware/errorHandler.js';
import { createOrderSchema, updateOrderStatusSchema, OrderStatus } from '@pazo/shared';
import { OrderStatus as PrismaOrderStatus, Role as PrismaRole, DeliveryMethod } from '@prisma/client';
import { z } from 'zod';
import { emitOrderStatusUpdate, emitNewOrder } from '../lib/socket.js';
import { sanitizeOrderNotes, sanitizeAddress } from '../lib/security.js';

// Schema für POS-Bestellung
const posOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1, 'Bestellung muss mindestens einen Artikel enthalten'),
  customerName: z.string().min(1, 'Kundenname erforderlich').optional(),
  notes: z.string().optional(),
});

export class OrderController {
  // GET /api/orders - Eigene Bestellungen oder alle (rollenbasiert)
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userRole = req.user!.role as PrismaRole;
      const orders = await OrderModel.findByRole(userRole, req.user!.userId);

      res.json({
        success: true,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/orders/stats/summary - Statistiken (Admin)
  static async getStatsSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await OrderModel.getStatsSummary();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/orders/stats/today - Tagesstatistiken (Bäcker + Admin)
  static async getTodayStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await OrderModel.getTodayStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/orders/today - Tagesbestellungen (Bäcker + Admin)
  static async getTodayOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await OrderModel.findTodayOrders();

      res.json({
        success: true,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/orders/:id - Einzelne Bestellung
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await OrderModel.findById(req.params.id);

      if (!order) {
        throw new AppError(404, 'Bestellung nicht gefunden');
      }

      // Prüfen ob User Zugriff hat
      const userRole = req.user!.role as PrismaRole;
      const isStaff = [PrismaRole.ADMIN, PrismaRole.BAECKER, PrismaRole.LIEFERANT].includes(userRole);

      if (!isStaff && order.userId !== req.user!.userId) {
        throw new AppError(403, 'Kein Zugriff auf diese Bestellung');
      }

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/orders - Neue Bestellung (Kunde)
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createOrderSchema.parse(req.body);

      // Produkte laden und Preise berechnen
      const productIds = data.items.map(item => item.productId);
      const products = await ProductModel.findByIds(productIds);

      // Prüfen ob alle Produkte existieren und verfügbar sind
      const productMap = new Map(products.map(p => [p.id, p]));
      
      let total = 0;
      const orderItems = data.items.map(item => {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new AppError(400, `Produkt ${item.productId} nicht gefunden`);
        }
        if (!product.isAvailable || !product.isActive) {
          throw new AppError(400, `Produkt ${product.name} ist nicht verfügbar`);
        }
        
        const itemTotal = product.price * item.quantity;
        total += itemTotal;
        
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.price,
        };
      });

      const order = await OrderModel.create({
        userId: req.user!.userId,
        items: orderItems,
        deliveryMethod: data.deliveryMethod as DeliveryMethod,
        // Sanitize user input - allows special chars like <h1>Te"s't</h1>
        // Prisma handles SQL injection protection with parameterized queries
        deliveryAddress: sanitizeAddress(data.deliveryAddress),
        notes: sanitizeOrderNotes(data.notes),
        total,
      });

      // Emit new order event for real-time updates
      emitNewOrder({ order });

      res.status(201).json({
        success: true,
        data: order,
        message: 'Bestellung aufgegeben',
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/orders/pos - POS Bestellung (Bäcker)
  static async createPOS(req: Request, res: Response, next: NextFunction) {
    try {
      const data = posOrderSchema.parse(req.body);

      // Produkte laden
      const productIds = data.items.map(item => item.productId);
      const products = await ProductModel.findByIds(productIds);
      const productMap = new Map(products.map(p => [p.id, p]));

      // Prüfen und Preise berechnen
      let total = 0;
      const orderItems = data.items.map(item => {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new AppError(400, `Produkt ${item.productId} nicht gefunden`);
        }
        if (!product.isAvailable || !product.isActive) {
          throw new AppError(400, `Produkt ${product.name} ist nicht verfügbar`);
        }

        const itemTotal = product.price * item.quantity;
        total += itemTotal;

        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.price,
        };
      });

      // Build notes with sanitization for XSS protection
      const customerNameSanitized = data.customerName ? sanitizeOrderNotes(data.customerName) : null;
      const notesSanitized = data.notes ? sanitizeOrderNotes(data.notes) : null;
      const orderNotes = customerNameSanitized 
        ? `Walk-in: ${customerNameSanitized}${notesSanitized ? ` - ${notesSanitized}` : ''}` 
        : notesSanitized;

      const order = await OrderModel.create({
        userId: req.user!.userId, // Bäcker als User
        items: orderItems,
        deliveryMethod: DeliveryMethod.PICKUP,
        deliveryAddress: null,
        notes: orderNotes,
        total,
      });

      // Emit new order event for real-time updates
      emitNewOrder({ order });

      res.status(201).json({
        success: true,
        data: order,
        message: 'POS Bestellung erstellt',
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/orders/:id/status - Status ändern (Staff)
  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateOrderStatusSchema.parse(req.body);

      const existingOrder = await OrderModel.findById(req.params.id);
      if (!existingOrder) {
        throw new AppError(404, 'Bestellung nicht gefunden');
      }

      // Status-Workflow validieren
      const currentStatus = existingOrder.status as PrismaOrderStatus;
      const newStatus = data.status as PrismaOrderStatus;
      const userRole = req.user!.role as PrismaRole;

      // Validiere Status-Übergang basierend auf Rolle
      const isValidTransition = OrderController.validateStatusTransition(
        currentStatus, 
        newStatus, 
        userRole
      );

      if (!isValidTransition) {
        throw new AppError(400, 'Ungültiger Statusübergang');
      }

      const order = await OrderModel.updateStatus(req.params.id, newStatus);

      // Emit status update event for real-time updates
      emitOrderStatusUpdate({
        orderId: order.id,
        status: newStatus,
        previousStatus: currentStatus,
        updatedAt: new Date().toISOString(),
        order,
      });

      res.json({
        success: true,
        data: order,
        message: `Status geändert zu: ${newStatus}`,
      });
    } catch (error) {
      next(error);
    }
  }

  // Helper: Status-Übergang validieren
  private static validateStatusTransition(
    current: PrismaOrderStatus,
    next: PrismaOrderStatus,
    role: PrismaRole
  ): boolean {
    // Admin kann alles
    if (role === PrismaRole.ADMIN) return true;

    // Definiere erlaubte Übergänge
    const transitions: Record<PrismaOrderStatus, PrismaOrderStatus[]> = {
      PENDING: [PrismaOrderStatus.CONFIRMED, PrismaOrderStatus.CANCELLED],
      CONFIRMED: [PrismaOrderStatus.IN_PRODUCTION, PrismaOrderStatus.CANCELLED],
      IN_PRODUCTION: [PrismaOrderStatus.READY],
      READY: [PrismaOrderStatus.OUT_FOR_DELIVERY, PrismaOrderStatus.PICKED_UP],
      OUT_FOR_DELIVERY: [PrismaOrderStatus.DELIVERED],
      DELIVERED: [],
      PICKED_UP: [],
      CANCELLED: [],
    };

    // Bäcker können: PENDING -> CONFIRMED -> IN_PRODUCTION -> READY -> PICKED_UP
    if (role === PrismaRole.BAECKER) {
      const allowedForBaecker = [
        PrismaOrderStatus.CONFIRMED,
        PrismaOrderStatus.IN_PRODUCTION,
        PrismaOrderStatus.READY,
        PrismaOrderStatus.PICKED_UP,
        PrismaOrderStatus.CANCELLED,
      ];
      if (!allowedForBaecker.includes(next)) return false;
    }

    // Lieferant können: READY -> OUT_FOR_DELIVERY -> DELIVERED
    if (role === PrismaRole.LIEFERANT) {
      const allowedForLieferant = [
        PrismaOrderStatus.OUT_FOR_DELIVERY,
        PrismaOrderStatus.DELIVERED,
      ];
      if (!allowedForLieferant.includes(next)) return false;
    }

    return transitions[current]?.includes(next) || false;
  }

  // DELETE /api/orders/:id - Bestellung stornieren
  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await OrderModel.findById(req.params.id);

      if (!order) {
        throw new AppError(404, 'Bestellung nicht gefunden');
      }

      // Prüfen ob User Zugriff hat
      const userRole = req.user!.role as PrismaRole;
      const isStaff = [PrismaRole.ADMIN, PrismaRole.BAECKER].includes(userRole);

      if (!isStaff && order.userId !== req.user!.userId) {
        throw new AppError(403, 'Kein Zugriff auf diese Bestellung');
      }

      // Nur PENDING oder CONFIRMED können storniert werden
      const previousStatus = order.status as PrismaOrderStatus;
      if (![PrismaOrderStatus.PENDING, PrismaOrderStatus.CONFIRMED].includes(previousStatus)) {
        throw new AppError(400, 'Diese Bestellung kann nicht mehr storniert werden');
      }

      const cancelledOrder = await OrderModel.updateStatus(req.params.id, PrismaOrderStatus.CANCELLED);

      // Emit status update event for real-time updates
      emitOrderStatusUpdate({
        orderId: order.id,
        status: PrismaOrderStatus.CANCELLED,
        previousStatus,
        updatedAt: new Date().toISOString(),
        order: cancelledOrder,
      });

      res.json({
        success: true,
        message: 'Bestellung storniert',
      });
    } catch (error) {
      next(error);
    }
  }
}
