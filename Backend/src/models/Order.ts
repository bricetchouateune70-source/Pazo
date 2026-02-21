import { prisma } from '../lib/prisma.js';
import { OrderStatus, DeliveryMethod, Role } from '@prisma/client';
import { Prisma } from '@prisma/client';

export interface OrderItemInput {
  productId: string;
  quantity: number;
  unitPrice?: number;
}

export interface OrderCreateInput {
  userId: string;
  items: OrderItemInput[];
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string | null;
  notes?: string | null;
  total: number;
}

export interface OrderFilter {
  userId?: string;
  status?: OrderStatus | OrderStatus[];
  deliveryMethod?: DeliveryMethod;
  fromDate?: Date;
}

// Format order for JSON response
function formatOrder(order: any) {
  return {
    ...order,
    total: Number(order.total),
    items: order.items?.map((item: any) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      product: item.product ? {
        ...item.product,
        price: Number(item.product.price),
      } : undefined,
    })),
  };
}

export class OrderModel {
  static async findAll(filter?: OrderFilter) {
    const where: Prisma.OrderWhereInput = {};

    if (filter?.userId) where.userId = filter.userId;
    if (filter?.status) {
      where.status = Array.isArray(filter.status) 
        ? { in: filter.status } 
        : filter.status;
    }
    if (filter?.deliveryMethod) where.deliveryMethod = filter.deliveryMethod;
    if (filter?.fromDate) where.createdAt = { gte: filter.fromDate };

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, imageUrl: true, price: true },
            },
          },
        },
      },
    });

    return orders.map(formatOrder);
  }

  static async findByRole(role: Role, userId: string) {
    let where: Prisma.OrderWhereInput = {};

    switch (role) {
      case Role.KUNDE:
        where = { userId };
        break;
      case Role.LIEFERANT:
        where = {
          deliveryMethod: DeliveryMethod.DELIVERY,
          status: { in: [OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY] },
        };
        break;
      // ADMIN and BAECKER see all
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, imageUrl: true, price: true },
            },
          },
        },
      },
    });

    return orders.map(formatOrder);
  }

  static async findById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, street: true, city: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, imageUrl: true, price: true },
            },
          },
        },
      },
    });

    return order ? formatOrder(order) : null;
  }

  static async findTodayOrders() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: todayStart } },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, imageUrl: true, price: true },
            },
          },
        },
      },
    });

    return orders.map(formatOrder);
  }

  static async create(data: OrderCreateInput) {
    const order = await prisma.order.create({
      data: {
        userId: data.userId,
        deliveryMethod: data.deliveryMethod,
        deliveryAddress: data.deliveryAddress,
        notes: data.notes,
        total: data.total,
        status: OrderStatus.PENDING,
        items: {
          create: data.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice || 0,
          })),
        },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, imageUrl: true, price: true },
            },
          },
        },
      },
    });

    return formatOrder(order);
  }

  static async updateStatus(id: string, status: OrderStatus) {
    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, imageUrl: true, price: true },
            },
          },
        },
      },
    });

    return formatOrder(order);
  }

  static async getStatsSummary() {
    const [totalOrders, pendingOrders, todayOrders, totalRevenue] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({
        where: {
          status: { 
            in: [
              OrderStatus.PENDING, 
              OrderStatus.CONFIRMED, 
              OrderStatus.IN_PRODUCTION, 
              OrderStatus.READY, 
              OrderStatus.OUT_FOR_DELIVERY
            ] 
          },
        },
      }),
      prisma.order.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { notIn: [OrderStatus.CANCELLED] } },
      }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      todayOrders,
      totalRevenue: Number(totalRevenue._sum.total) || 0,
    };
  }

  static async getTodayStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayOrders, completedOrders, pendingOrders, todayRevenue] = await Promise.all([
      prisma.order.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.order.count({
        where: {
          createdAt: { gte: todayStart },
          status: { in: [OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED, OrderStatus.PICKED_UP] },
        },
      }),
      prisma.order.count({
        where: {
          createdAt: { gte: todayStart },
          status: { 
            in: [
              OrderStatus.PENDING, 
              OrderStatus.CONFIRMED, 
              OrderStatus.IN_PRODUCTION
            ] 
          },
        },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: todayStart },
          status: { notIn: [OrderStatus.CANCELLED] },
        },
      }),
    ]);

    return {
      todayOrders,
      completedOrders,
      pendingOrders,
      todayRevenue: Number(todayRevenue._sum.total) || 0,
    };
  }

  static async delete(id: string) {
    // Cascade delete items first
    await prisma.orderItem.deleteMany({ where: { orderId: id } });
    return prisma.order.delete({ where: { id } });
  }

  static async isOwnedBy(orderId: string, userId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
    });
    return !!order;
  }
}
