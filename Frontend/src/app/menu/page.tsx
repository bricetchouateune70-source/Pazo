'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { ProductCard } from '@/components/menu/ProductCard';
import { ProductListItem } from '@/components/menu/ProductListItem';
import { CategoryGrid } from '@/components/menu/CategoryGrid';
import { LayoutGrid, List } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('menuViewMode') as 'grid' | 'list') || 'list';
    }
    return 'list';
  });

  // ViewMode in localStorage speichern
  useEffect(() => {
    localStorage.setItem('menuViewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    async function fetchProducts() {
      setError(null);
      try {
        const endpoint = selectedCategory 
          ? `/api/products?category=${selectedCategory}`
          : '/api/products';
        const response = await apiGet<{ success: boolean; data: Product[] }>(endpoint);
        setProducts(response.data);
      } catch (err: any) {
        setError(err.message || 'Fehler beim Laden der Produkte');
        console.error('Fehler beim Laden der Produkte:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, [selectedCategory]);

  // Produkte nach Kategorie gruppieren
  const groupedProducts = products.reduce((acc, product) => {
    const categoryName = product.category.name;
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Unser Menü</h1>
        
        {/* View Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list' 
                ? 'bg-white text-primary-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            aria-label="Listenansicht"
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid' 
                ? 'bg-white text-primary-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            aria-label="Rasteransicht"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Kategorien Navigation */}
      <section className="mb-8 sticky top-16 bg-white py-3 z-20 border-b border-gray-100">
        <CategoryGrid />
      </section>

      {/* Alle Produkte */}
      <section>
        {error ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Fehler beim Laden</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Erneut versuchen
            </button>
          </div>
        ) : isLoading ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-48 bg-gray-200" />
                  <div className="p-4">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                    <div className="h-6 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-48 mb-4" />
                  <div className="bg-white rounded-lg shadow-sm">
                    {[...Array(5)].map((_, j) => (
                      <div key={j} className="flex items-center justify-between py-3 px-4 border-b border-gray-100">
                        <div className="flex-1">
                          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                          <div className="h-4 bg-gray-200 rounded w-1/2" />
                        </div>
                        <div className="h-8 w-8 bg-gray-200 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🍽️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Keine Produkte gefunden</h2>
            <p className="text-gray-600 mb-6">In dieser Kategorie sind momentan keine Produkte verfügbar.</p>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="btn-primary"
              >
                Alle Kategorien anzeigen
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          Object.entries(groupedProducts).map(([categoryName, categoryProducts]) => (
            <div key={categoryName} className="mb-12">
              <h2 className="text-2xl font-bold mb-6">{categoryName}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categoryProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ))
        ) : (
          // List View (Restaurant-Style Speisekarte)
          Object.entries(groupedProducts).map(([categoryName, categoryProducts]) => (
            <div key={categoryName} className="mb-8">
              <h2 className="text-xl font-bold text-primary-700 mb-3 pb-2 border-b-2 border-primary-200">
                {categoryName}
              </h2>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {categoryProducts.map((product, idx) => (
                  <ProductListItem key={product.id} product={product} index={idx + 1} />
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
