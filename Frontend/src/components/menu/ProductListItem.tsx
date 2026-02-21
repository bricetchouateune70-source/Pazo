'use client';

import { useCartStore } from '@/store/cartStore';
import { toast } from '@/components/ui/Toaster';
import { Plus } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
}

interface ProductListItemProps {
  product: Product;
  index?: number;
}

export function ProductListItem({ product, index }: ProductListItemProps) {
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
    <div className="group flex items-start gap-3 py-3 px-4 hover:bg-amber-50/50 border-b border-gray-100 last:border-b-0 transition-colors">
      {/* Nummer (optional) */}
      {index !== undefined && (
        <span className="flex-shrink-0 text-sm font-medium text-gray-400 w-6">
          {index}.
        </span>
      )}
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline">
          <h3 className="font-medium text-gray-900">{product.name}</h3>
          <span className="flex-1 mx-2 border-b border-dotted border-gray-300 min-w-[20px]" />
          <span className="flex-shrink-0 font-semibold text-primary-600 tabular-nums">
            {product.price.toFixed(2)} €
          </span>
        </div>
        {product.description && (
          <p className="text-sm text-gray-500 mt-0.5 leading-snug">
            {product.description}
          </p>
        )}
      </div>
      
      {/* Add Button */}
      <button
        onClick={handleAddToCart}
        className="flex-shrink-0 p-1.5 rounded-full bg-primary-500 text-white opacity-0 group-hover:opacity-100 hover:bg-primary-600 transition-all scale-90 group-hover:scale-100"
        aria-label={`${product.name} zum Warenkorb hinzufügen`}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
