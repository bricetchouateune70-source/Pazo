'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { apiPost } from '@/lib/api';
import { toast } from '@/components/ui/Toaster';
import { MapPin, Store, Loader2 } from 'lucide-react';
import { DeliveryMethod } from '@pazo/shared';
import { setCurrentOrderId } from '@/lib/session';
import { sanitizeOrderText } from '@/lib/security';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(DeliveryMethod.PICKUP);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      toast.info('Bitte melde dich an, um zu bestellen');
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    if (mounted && items.length === 0) {
      router.push('/cart');
    }
  }, [mounted, items, router]);

  if (!mounted || !isAuthenticated || items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (deliveryMethod === DeliveryMethod.DELIVERY && !deliveryAddress.trim()) {
      toast.error('Bitte gib eine Lieferadresse ein');
      return;
    }

    setIsLoading(true);

    try {
      // Sanitize user input before sending to backend
      const orderData = {
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        deliveryMethod,
        deliveryAddress: deliveryMethod === DeliveryMethod.DELIVERY 
          ? sanitizeOrderText(deliveryAddress) 
          : undefined,
        notes: sanitizeOrderText(notes) || undefined,
      };

      const response = await apiPost<{ success: boolean; data: { id: string } }>(
        '/api/orders',
        orderData
      );

      // Save order ID to session cookie for status tracking
      // This replaces any previous order (as per session management requirements)
      setCurrentOrderId(response.data.id);

      clearCart();
      toast.success('Bestellung erfolgreich aufgegeben!');
      
      // Redirect to status page to show only this session's order
      router.push('/status');
    } catch (error: any) {
      toast.error(error.message || 'Bestellung fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Method */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Liefermethode</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod(DeliveryMethod.PICKUP)}
                  className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                    deliveryMethod === DeliveryMethod.PICKUP
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Store className="w-6 h-6" />
                  <div className="text-left">
                    <p className="font-medium">Abholung</p>
                    <p className="text-sm text-gray-500">Im Restaurant abholen</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMethod(DeliveryMethod.DELIVERY)}
                  className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                    deliveryMethod === DeliveryMethod.DELIVERY
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <MapPin className="w-6 h-6" />
                  <div className="text-left">
                    <p className="font-medium">Lieferung</p>
                    <p className="text-sm text-gray-500">Zu dir nach Hause</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Delivery Address */}
            {deliveryMethod === DeliveryMethod.DELIVERY && (
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4">Lieferadresse</h2>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="input min-h-[100px]"
                  placeholder="Straße, Hausnummer, PLZ, Ort"
                  required
                />
              </div>
            )}

            {/* Notes */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Anmerkungen (optional)</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input min-h-[80px]"
                placeholder="z.B. Sonderwünsche, Allergien, Klingel-Info..."
              />
            </div>

            {/* Order Items */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Deine Bestellung</h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500">{item.quantity}x</span>
                      <span>{item.product.name}</span>
                    </div>
                    <span className="font-medium">
                      {(item.product.price * item.quantity).toFixed(2)} €
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4">Zusammenfassung</h2>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Artikel ({items.length})</span>
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
                type="submit"
                disabled={isLoading}
                className="btn-secondary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Wird bestellt...
                  </>
                ) : (
                  'Jetzt bestellen'
                )}
              </button>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Mit deiner Bestellung akzeptierst du unsere AGB
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
