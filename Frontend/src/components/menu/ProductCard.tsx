'use client';

import { useCartStore } from '@/store/cartStore';
import { toast } from '@/components/ui/Toaster';
import { Plus, ShoppingCart } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
    });
    toast.success(`${product.name} zum Warenkorb hinzugefügt`);
  };

  return (
    <div className="product-card flex flex-col">
      {/* Image */}
      <div className="h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-6xl">🍔</span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-800 mb-1">{product.name}</h3>
        {product.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2 flex-1">
            {product.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mt-auto">
          <span className="text-xl font-bold text-secondary-500">
            {product.price.toFixed(2)} €
          </span>
          <button
            onClick={handleAddToCart}
            className="btn-primary flex items-center space-x-1 text-sm"
            aria-label={`${product.name} zum Warenkorb hinzufügen`}
          >
            <Plus className="w-4 h-4" />
            <span>Hinzufügen</span>
          </button>
        </div>
      </div>
    </div>
  );
}
