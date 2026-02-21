'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import { ProductCard } from '@/components/menu/ProductCard';
import { ProductListItem } from '@/components/menu/ProductListItem';
import { CategoryGrid } from '@/components/menu/CategoryGrid';
import { LayoutGrid, List } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
}

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

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        // Kategorie laden
        const categoriesResponse = await apiGet<{ success: boolean; data: Category[] }>(
          '/api/categories'
        );
        const foundCategory = categoriesResponse.data.find(c => c.slug === slug);
        
        if (!foundCategory) {
          setError('Kategorie nicht gefunden');
          return;
        }
        
        setCategory(foundCategory);

        // Produkte der Kategorie laden
        const productsResponse = await apiGet<{ success: boolean; data: Product[] }>(
          `/api/products?category=${slug}`
        );
        setProducts(productsResponse.data);
      } catch (error) {
        console.error('Fehler beim Laden:', error);
        setError('Fehler beim Laden der Daten');
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      fetchData();
    }
  }, [slug]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card">
                <div className="h-48 bg-gray-200" />
                <div className="p-4">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-6 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {error || 'Kategorie nicht gefunden'}
          </h1>
          <Link href="/menu" className="btn-primary">
            Zurück zum Menü
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Kategorien Navigation */}
      <section className="mb-6 sticky top-16 bg-white py-3 z-20 border-b border-gray-100 -mx-4 px-4">
        <CategoryGrid />
      </section>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-800">{category.name}</h1>
          
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
        {category.description && (
          <p className="text-gray-600">{category.description}</p>
        )}
        <p className="text-sm text-gray-500 mt-2">
          {products.length} {products.length === 1 ? 'Produkt' : 'Produkte'}
        </p>
      </header>

      {/* Produkte */}
      {products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">Keine Produkte in dieser Kategorie.</p>
          <Link href="/menu" className="btn-primary">
            Zurück zum Menü
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {products.map((product, idx) => (
            <ProductListItem key={product.id} product={product} index={idx + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
