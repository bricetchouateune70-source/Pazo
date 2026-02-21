import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">🍕</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Seite nicht gefunden
        </h1>
        <p className="text-gray-600 mb-8">
          Die angeforderte Seite existiert nicht oder wurde verschoben.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Zur Startseite
          </Link>
          <Link
            href="/menu"
            className="btn-outline flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            Zum Menü
          </Link>
        </div>
      </div>
    </div>
  );
}
