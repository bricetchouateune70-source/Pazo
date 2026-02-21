import { z } from 'zod';
import { Role, OrderStatus, DeliveryMethod } from './enums';

// ================= Auth Schemas =================

export const registerSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen haben'),
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben'),
});

export const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(1, 'Passwort erforderlich'),
});

// ================= User Schemas =================

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: z.nativeEnum(Role),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
});

// ================= Category Schemas =================

export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  isActive: z.boolean(),
  sortOrder: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten'),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// ================= Product Schemas =================

export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  imageUrl: z.string().nullable(),
  categoryId: z.string().uuid(),
  isActive: z.boolean(),
  isAvailable: z.boolean(),
  sortOrder: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createProductSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben'),
  description: z.string().optional(),
  price: z.number().positive('Preis muss positiv sein'),
  imageUrl: z.string().url().optional(),
  categoryId: z.string().uuid('Ungültige Kategorie-ID'),
  isAvailable: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateProductSchema = createProductSchema.partial();

// ================= Cart Schemas =================

export const cartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive('Menge muss mindestens 1 sein'),
});

export const cartSchema = z.object({
  items: z.array(cartItemSchema),
});

// ================= Order Schemas =================

export const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
});

export const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1, 'Bestellung muss mindestens einen Artikel enthalten'),
  deliveryMethod: z.nativeEnum(DeliveryMethod),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export const orderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  status: z.nativeEnum(OrderStatus),
  deliveryMethod: z.nativeEnum(DeliveryMethod),
  deliveryAddress: z.string().nullable(),
  notes: z.string().nullable(),
  total: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ================= Type Exports =================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type User = z.infer<typeof userSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type Category = z.infer<typeof categorySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type Product = z.infer<typeof productSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
export type Cart = z.infer<typeof cartSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type Order = z.infer<typeof orderSchema>;
