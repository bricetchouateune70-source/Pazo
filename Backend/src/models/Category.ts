import { prisma } from '../lib/prisma.js';

export interface CategoryCreateInput {
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
}

export interface CategoryUpdateInput {
  name?: string;
  slug?: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export class CategoryModel {
  static async findAll(includeInactive = false) {
    const categories = await prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { 
            products: includeInactive ? true : { where: { isActive: true, isAvailable: true } } 
          },
        },
      },
    });

    return categories;
  }

  static async findBySlug(slug: string, includeProducts = false) {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: includeProducts ? {
        products: {
          where: { isActive: true, isAvailable: true },
          orderBy: { sortOrder: 'asc' },
        },
      } : undefined,
    });

    if (category && includeProducts && category.products) {
      return {
        ...category,
        products: category.products.map(p => ({
          ...p,
          price: Number(p.price),
        })),
      };
    }

    return category;
  }

  static async findById(id: string) {
    return prisma.category.findUnique({
      where: { id },
    });
  }

  static async create(data: CategoryCreateInput) {
    return prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        sortOrder: data.sortOrder || 0,
      },
    });
  }

  static async update(id: string, data: CategoryUpdateInput) {
    return prisma.category.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  static async delete(id: string) {
    // Soft delete
    return prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }

  static async slugExists(slug: string, excludeId?: string) {
    const category = await prisma.category.findFirst({
      where: {
        slug,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    return !!category;
  }
}
