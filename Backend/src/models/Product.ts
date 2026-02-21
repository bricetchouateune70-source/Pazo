import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

export interface ProductCreateInput {
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  categoryId: string;
  isAvailable?: boolean;
  sortOrder?: number;
  stock?: number;
}

export interface ProductUpdateInput {
  name?: string;
  description?: string | null;
  price?: number;
  imageUrl?: string | null;
  categoryId?: string;
  isAvailable?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  stock?: number;
}

export interface ProductFilter {
  categorySlug?: string;
  isActive?: boolean;
  isAvailable?: boolean;
}

export class ProductModel {
  static async findAll(filter?: ProductFilter) {
    const where: Prisma.ProductWhereInput = {};
    
    if (filter?.isActive !== undefined) where.isActive = filter.isActive;
    if (filter?.isAvailable !== undefined) where.isAvailable = filter.isAvailable;
    if (filter?.categorySlug) where.category = { slug: filter.categorySlug };

    const products = await prisma.product.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return products.map(p => ({
      ...p,
      price: Number(p.price),
    }));
  }

  static async findAllAdmin() {
    const products = await prisma.product.findMany({
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return products.map(p => ({
      ...p,
      price: Number(p.price),
    }));
  }

  static async findById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!product) return null;

    return {
      ...product,
      price: Number(product.price),
    };
  }

  static async findByIds(ids: string[]) {
    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
    });

    return products.map(p => ({
      ...p,
      price: Number(p.price),
    }));
  }

  static async create(data: ProductCreateInput) {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description || null,
        price: data.price,
        imageUrl: data.imageUrl || null,
        categoryId: data.categoryId,
        isAvailable: data.isAvailable ?? true,
        sortOrder: data.sortOrder || 0,
        stock: data.stock ?? 100,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return {
      ...product,
      price: Number(product.price),
    };
  }

  static async update(id: string, data: ProductUpdateInput) {
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.isAvailable !== undefined && { isAvailable: data.isAvailable }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.stock !== undefined && { stock: data.stock }),
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return {
      ...product,
      price: Number(product.price),
    };
  }

  static async delete(id: string) {
    // Soft delete - nur deaktivieren
    return prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  static async updateStock(id: string, quantity: number) {
    return prisma.product.update({
      where: { id },
      data: {
        stock: { decrement: quantity },
      },
    });
  }
}
