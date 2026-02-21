'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { apiGet } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  _count: {
    products: number;
  };
}

export function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Aktuelle Kategorie aus der URL ermitteln
  const currentSlug = pathname?.startsWith('/menu/') 
    ? pathname.replace('/menu/', '') 
    : null;

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await apiGet<{ success: boolean; data: Category[] }>(
          '/api/categories'
        );
        setCategories(response.data);
      } catch (error) {
        console.error('Fehler beim Laden der Kategorien:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCategories();
  }, []);

  // Scroll-Pfeile anzeigen/verstecken
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const checkScroll = () => {
      setShowLeftArrow(container.scrollLeft > 0);
      setShowRightArrow(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 1
      );
    };

    checkScroll();
    container.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    return () => {
      container.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [categories]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const scrollAmount = 200;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-10 w-24 bg-gray-200 rounded-full animate-pulse flex-shrink-0"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="relative flex items-center">
      {/* Linker Pfeil */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 z-10 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
          aria-label="Nach links scrollen"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Kategorien-Liste */}
      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-1 py-2 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* "Alle" Button */}
        <Link
          href="/menu"
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
            !currentSlug
              ? 'bg-secondary-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Alle
        </Link>

        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/menu/${category.slug}`}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              currentSlug === category.slug
                ? 'bg-secondary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.name}
          </Link>
        ))}
      </div>

      {/* Rechter Pfeil */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 z-10 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
          aria-label="Nach rechts scrollen"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
