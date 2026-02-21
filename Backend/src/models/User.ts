import { prisma } from '../lib/prisma.js';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';

export interface UserCreateInput {
  email: string;
  password: string;
  name: string;
  role?: Role;
  phone?: string | null;
  address?: string | null;
}

export interface UserUpdateInput {
  email?: string;
  name?: string;
  phone?: string | null;
  address?: string | null;
  role?: Role;
  isActive?: boolean;
}

export class UserModel {
  static async findAll() {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { orders: true },
        },
      },
    });

    return users;
  }

  static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  static async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  static async create(data: UserCreateInput) {
    const hashedPassword = await argon2.hash(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: hashedPassword,
        name: data.name,
        role: data.role || Role.KUNDE,
        phone: data.phone || null,
        address: data.address || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  static async update(id: string, data: UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data: {
        ...(data.email !== undefined && { email: data.email.toLowerCase() }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  static async updatePassword(id: string, newPassword: string) {
    const hashedPassword = await argon2.hash(newPassword);
    return prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  static async updateRefreshToken(id: string, refreshToken: string | null) {
    return prisma.user.update({
      where: { id },
      data: { refreshToken },
    });
  }

  static async verifyPassword(user: { password: string }, password: string) {
    return argon2.verify(user.password, password);
  }

  static async delete(id: string) {
    // Soft delete
    return prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  static async emailExists(email: string, excludeId?: string) {
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    return !!user;
  }
}
