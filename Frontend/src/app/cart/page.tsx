'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toaster';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { items, total, updateQuantity, removeItem, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-8" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Dein Warenkorb ist leer</h1>
        <p className="text-gray-600 mb-8">Füge Produkte hinzu, um zu bestellen</p>
        <Link href="/menu" className="btn-primary">
          Zum Menü
        </Link>
      </div>
    );
  }

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.info('Bitte melde dich an, um zu bestellen');
      router.push('/login');
      return;
    }
    router.push('/checkout');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Warenkorb</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.product.id} className="card p-4 flex items-center gap-4">
              {/* Image */}
              <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center flex-shrink-0">
                {item.product.imageUrl ? (
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <span className="text-3xl">🍔</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{item.product.name}</h3>
                <p className="text-secondary-500 font-medium">
                  {item.product.price.toFixed(2)} €
                </p>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  className="p-1 rounded-full hover:bg-gray-100"
                  aria-label={`Menge von ${item.product.name} verringern`}
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  className="p-1 rounded-full hover:bg-gray-100"
                  aria-label={`Menge von ${item.product.name} erhöhen`}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Subtotal */}
              <div className="w-24 text-right">
                <p className="font-semibold">
                  {(item.product.price * item.quantity).toFixed(2)} €
                </p>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeItem(item.product.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                aria-label={`${item.product.name} aus dem Warenkorb entfernen`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}

          {/* Clear Cart */}
          <button
            onClick={() => {
              clearCart();
              toast.info('Warenkorb geleert');
            }}
            className="text-red-500 hover:underline text-sm"
            aria-label="Alle Artikel aus dem Warenkorb entfernen"
          >
            Warenkorb leeren
          </button>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-4">Zusammenfassung</h2>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Zwischensumme</span>
                <span>{total().toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Liefergebühr</span>
                <span>0.00 €</span>
              </div>
            </div>

            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between text-xl font-bold">
                <span>Gesamt</span>
                <span className="text-secondary-500">{total().toFixed(2)} €</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="btn-secondary w-full py-3 flex items-center justify-center gap-2"
            >
              Zur Kasse
              <ArrowRight className="w-5 h-5" />
            </button>

            <Link
              href="/menu"
              className="block text-center mt-4 text-gray-600 hover:text-secondary-500"
            >
              Weiter einkaufen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
