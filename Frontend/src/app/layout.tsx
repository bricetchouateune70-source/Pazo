import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Toaster } from '@/components/ui/Toaster';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#da291c',
};

export const metadata: Metadata = {
  title: 'Pazo - Bestell-App',
  description: 'Bestelle dein Essen schnell und einfach bei Pazo. Frische Zutaten, schnelle Lieferung.',
  keywords: ['Essen bestellen', 'Lieferservice', 'Pizza', 'Restaurant'],
  authors: [{ name: 'Pazo' }],
  robots: 'index, follow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <footer className="bg-gray-900 text-white py-8">
            <div className="container mx-auto px-4 text-center">
              <p>&copy; 2026 Pazo. Alle Rechte vorbehalten.</p>
            </div>
          </footer>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
