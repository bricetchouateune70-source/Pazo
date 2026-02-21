import Link from 'next/link';
import { CategoryGrid } from '@/components/menu/CategoryGrid';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-secondary-500 to-secondary-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Willkommen bei Pazo</h1>
          <p className="text-xl mb-8 opacity-90">
            Leckeres Essen, schnell geliefert oder zur Abholung bereit
          </p>
          <Link 
            href="/menu" 
            className="btn-primary text-lg px-8 py-3 inline-block"
          >
            Jetzt bestellen
          </Link>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Unsere Kategorien</h2>
          <CategoryGrid />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🍔</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Frische Zutaten</h3>
              <p className="text-gray-600">
                Nur die besten Zutaten für unsere Gerichte
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Schnelle Lieferung</h3>
              <p className="text-gray-600">
                In wenigen Minuten bei dir
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Faire Preise</h3>
              <p className="text-gray-600">
                Top Qualität zum fairen Preis
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
