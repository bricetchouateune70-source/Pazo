import { Request, Response, NextFunction } from 'express';
import { CategoryModel } from '../models/Category.js';
import { AppError } from '../middleware/errorHandler.js';
import { createCategorySchema, updateCategorySchema } from '@pazo/shared';

export class CategoryController {
  // GET /api/categories - Alle aktiven Kategorien (öffentlich)
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await CategoryModel.findAll(false);

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/categories/all - Alle Kategorien (Admin)
  static async getAllAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await CategoryModel.findAll(true);

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/categories/:slug - Kategorie mit Produkten
  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await CategoryModel.findBySlug(req.params.slug, true);

      if (!category || !category.isActive) {
        throw new AppError(404, 'Kategorie nicht gefunden');
      }

      res.json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/categories - Neue Kategorie (Admin)
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createCategorySchema.parse(req.body);

      // Prüfen ob Slug bereits existiert
      const slugExists = await CategoryModel.slugExists(data.slug);
      if (slugExists) {
        throw new AppError(409, 'Diese Kategorie-URL existiert bereits');
      }

      const category = await CategoryModel.create({
        name: data.name,
        slug: data.slug,
        description: data.description,
        imageUrl: data.imageUrl,
        sortOrder: data.sortOrder,
      });

      res.status(201).json({
        success: true,
        data: category,
        message: 'Kategorie erstellt',
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/categories/:id - Kategorie bearbeiten (Admin)
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateCategorySchema.parse(req.body);

      // Wenn Slug geändert wird, prüfen ob der neue Slug bereits existiert
      if (data.slug) {
        const slugExists = await CategoryModel.slugExists(data.slug, req.params.id);
        if (slugExists) {
          throw new AppError(409, 'Diese Kategorie-URL existiert bereits');
        }
      }

      const existingCategory = await CategoryModel.findById(req.params.id);
      if (!existingCategory) {
        throw new AppError(404, 'Kategorie nicht gefunden');
      }

      const category = await CategoryModel.update(req.params.id, data);

      res.json({
        success: true,
        data: category,
        message: 'Kategorie aktualisiert',
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/categories/:id - Kategorie löschen (Admin) - Soft delete
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const existingCategory = await CategoryModel.findById(req.params.id);
      if (!existingCategory) {
        throw new AppError(404, 'Kategorie nicht gefunden');
      }

      await CategoryModel.delete(req.params.id);

      res.json({
        success: true,
        message: 'Kategorie gelöscht (deaktiviert)',
      });
    } catch (error) {
      next(error);
    }
  }
}
