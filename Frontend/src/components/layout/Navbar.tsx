'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useEffect, useState } from 'react';
import { ShoppingCart, User, Menu, X, LogOut } from 'lucide-react';
import { Role } from '@pazo/shared';

export function Navbar() {
  const { user, isAuthenticated, logout, fetchUser, isLoading } = useAuthStore();
  const itemCount = useCartStore((state) => state.itemCount());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchUser();
  }, [fetchUser]);

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  // Rolle-basierte Navigation
  const isAdmin = user?.role === Role.ADMIN;
  const isBaecker = user?.role === Role.BAECKER;
  const isLieferant = user?.role === Role.LIEFERANT;
  const isStaff = isAdmin || isBaecker || isLieferant;

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-secondary-500">Pazo</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/menu" className="text-gray-700 hover:text-secondary-500 font-medium">
              Menü
            </Link>
            
            <Link href="/status" className="text-gray-700 hover:text-secondary-500 font-medium">
              Bestellstatus
            </Link>
            
            {isAuthenticated && (
              <Link href="/orders" className="text-gray-700 hover:text-secondary-500 font-medium">
                Meine Bestellungen
              </Link>
            )}

            {(isAdmin || isBaecker) && (
              <Link href="/pos" className="text-gray-700 hover:text-secondary-500 font-medium">
                POS / Kasse
              </Link>
            )}

            {isStaff && (
              <Link href="/dashboard" className="text-gray-700 hover:text-secondary-500 font-medium">
                Dashboard
              </Link>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link href="/cart" className="relative p-2 text-gray-700 hover:text-secondary-500">
              <ShoppingCart className="w-6 h-6" />
              {mounted && itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-secondary-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {!isLoading && (
              <>
                {isAuthenticated ? (
                  <div className="relative">
                    <button
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="flex items-center space-x-2 p-2 text-gray-700 hover:text-secondary-500"
                    >
                      <User className="w-6 h-6" />
                      <span className="hidden md:inline font-medium">{user?.name}</span>
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                        <div className="px-4 py-2 border-b">
                          <p className="font-medium">{user?.name}</p>
                          <p className="text-sm text-gray-500">{user?.role}</p>
                        </div>
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Profil
                        </Link>
                        <Link
                          href="/orders"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Bestellungen
                        </Link>
                        {isStaff && (
                          <Link
                            href="/dashboard"
                            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Dashboard
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 flex items-center"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Abmelden
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href="/login" className="btn-primary">
                    Anmelden
                  </Link>
                )}
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t py-4">
            <Link
              href="/menu"
              className="block py-2 text-gray-700 hover:text-secondary-500"
              onClick={() => setIsMenuOpen(false)}
            >
              Menü
            </Link>
            {isAuthenticated && (
              <Link
                href="/orders"
                className="block py-2 text-gray-700 hover:text-secondary-500"
                onClick={() => setIsMenuOpen(false)}
              >
                Meine Bestellungen
              </Link>
            )}
            {(isAdmin || isBaecker) && (
              <Link
                href="/pos"
                className="block py-2 text-gray-700 hover:text-secondary-500"
                onClick={() => setIsMenuOpen(false)}
              >
                POS / Kasse
              </Link>
            )}
            {isStaff && (
              <Link
                href="/dashboard"
                className="block py-2 text-gray-700 hover:text-secondary-500"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
