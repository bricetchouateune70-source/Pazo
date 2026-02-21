import { Request, Response, NextFunction } from 'express';
import { ProductModel } from '../models/Product.js';
import { CategoryModel } from '../models/Category.js';
import { AppError } from '../middleware/errorHandler.js';
import { createProductSchema, updateProductSchema } from '@pazo/shared';

export class ProductController {
  // GET /api/products - Alle aktiven Produkte (öffentlich)
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { category } = req.query;

      const products = await ProductModel.findAll({
        isActive: true,
        isAvailable: true,
        categorySlug: category as string | undefined,
      });

      res.json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/products/all - Alle Produkte (Admin)
  static async getAllAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await ProductModel.findAllAdmin();

      res.json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/products/:id - Einzelnes Produkt
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductModel.findById(req.params.id);

      if (!product || !product.isActive) {
        throw new AppError(404, 'Produkt nicht gefunden');
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/products - Neues Produkt (Admin)
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createProductSchema.parse(req.body);

      // Prüfen ob Kategorie existiert
      const category = await CategoryModel.findById(data.categoryId);
      if (!category) {
        throw new AppError(404, 'Kategorie nicht gefunden');
      }

      const product = await ProductModel.create({
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl,
        categoryId: data.categoryId,
        isAvailable: data.isAvailable,
        sortOrder: data.sortOrder,
      });

      res.status(201).json({
        success: true,
        data: product,
        message: 'Produkt erstellt',
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/products/:id - Produkt bearbeiten (Admin)
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateProductSchema.parse(req.body);

      // Wenn categoryId angegeben, prüfen ob Kategorie existiert
      if (data.categoryId) {
        const category = await CategoryModel.findById(data.categoryId);
        if (!category) {
          throw new AppError(404, 'Kategorie nicht gefunden');
        }
      }

      const existingProduct = await ProductModel.findById(req.params.id);
      if (!existingProduct) {
        throw new AppError(404, 'Produkt nicht gefunden');
      }

      const product = await ProductModel.update(req.params.id, data);

      res.json({
        success: true,
        data: product,
        message: 'Produkt aktualisiert',
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/products/:id - Produkt löschen (Admin) - Soft delete
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const existingProduct = await ProductModel.findById(req.params.id);
      if (!existingProduct) {
        throw new AppError(404, 'Produkt nicht gefunden');
      }

      await ProductModel.delete(req.params.id);

      res.json({
        success: true,
        message: 'Produkt gelöscht (deaktiviert)',
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/products/:id/stock - Stock aktualisieren
  static async updateStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { quantity } = req.body;

      if (typeof quantity !== 'number' || quantity < 0) {
        throw new AppError(400, 'Ungültige Mengenangabe');
      }

      const existingProduct = await ProductModel.findById(req.params.id);
      if (!existingProduct) {
        throw new AppError(404, 'Produkt nicht gefunden');
      }

      await ProductModel.updateStock(req.params.id, quantity);

      res.json({
        success: true,
        message: 'Lagerbestand aktualisiert',
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/products/:id/availability - Verfügbarkeit ändern
  static async toggleAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const existingProduct = await ProductModel.findById(req.params.id);
      if (!existingProduct) {
        throw new AppError(404, 'Produkt nicht gefunden');
      }

      const product = await ProductModel.update(req.params.id, {
        isAvailable: !existingProduct.isAvailable,
      });

      res.json({
        success: true,
        data: product,
        message: product.isAvailable ? 'Produkt verfügbar' : 'Produkt nicht verfügbar',
      });
    } catch (error) {
      next(error);
    }
  }
}
