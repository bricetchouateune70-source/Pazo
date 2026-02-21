'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { apiGet } from '@/lib/api';
import { toast } from '@/components/ui/Toaster';
import { Package, Clock, CheckCircle, Truck, XCircle, Loader2, Wifi } from 'lucide-react';
import { OrderStatus } from '@pazo/shared';
import { useOrderSocket } from '@/hooks/useOrderSocket';
import { OrderStatusUpdateEvent } from '@/lib/socket';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  product: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
}

interface Order {
  id: string;
  status: OrderStatus;
  deliveryMethod: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  [OrderStatus.PENDING]: { label: 'Ausstehend', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  [OrderStatus.CONFIRMED]: { label: 'Bestätigt', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  [OrderStatus.IN_PRODUCTION]: { label: 'In Zubereitung', color: 'bg-orange-100 text-orange-800', icon: Package },
  [OrderStatus.READY]: { label: 'Bereit', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  [OrderStatus.OUT_FOR_DELIVERY]: { label: 'Unterwegs', color: 'bg-purple-100 text-purple-800', icon: Truck },
  [OrderStatus.DELIVERED]: { label: 'Geliefert', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  [OrderStatus.PICKED_UP]: { label: 'Abgeholt', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  [OrderStatus.CANCELLED]: { label: 'Storniert', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Handle real-time order status updates
  const handleStatusUpdate = useCallback((event: OrderStatusUpdateEvent) => {
    setOrders((prevOrders) => 
      prevOrders.map((order) => 
        order.id === event.orderId 
          ? { ...order, status: event.status as OrderStatus }
          : order
      )
    );
    
    const statusLabel = statusConfig[event.status as OrderStatus]?.label || event.status;
    toast.success(`Bestellung aktualisiert: ${statusLabel}`);
  }, []);

  // Connect to WebSocket for real-time updates
  useOrderSocket({
    onStatusUpdate: handleStatusUpdate,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.info('Bitte melde dich an');
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    async function fetchOrders() {
      if (!isAuthenticated) return;
      
      try {
        const response = await apiGet<{ success: boolean; data: Order[] }>('/api/orders');
        setOrders(response.data);
      } catch (error: any) {
        toast.error(error.message || 'Fehler beim Laden der Bestellungen');
      } finally {
        setIsLoading(false);
      }
    }

    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Meine Bestellungen</h1>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Noch keine Bestellungen</h2>
          <p className="text-gray-600 mb-8">Du hast noch keine Bestellung aufgegeben</p>
          <Link href="/menu" className="btn-primary">
            Jetzt bestellen
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusConfig[order.status];
            const StatusIcon = status.icon;

            return (
              <Link 
                key={order.id} 
                href={`/orders/${order.id}`}
                className="card p-6 block hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${status.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        {status.label}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {order.deliveryMethod === 'DELIVERY' ? 'Lieferung' : 'Abholung'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Bestellt am {new Date(order.createdAt).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-secondary-500">
                      {order.total.toFixed(2)} €
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} Artikel
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {order.items.slice(0, 3).map((item) => (
                    <span key={item.id} className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {item.quantity}x {item.product.name}
                    </span>
                  ))}
                  {order.items.length > 3 && (
                    <span className="text-sm text-gray-500">
                      +{order.items.length - 3} weitere
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
