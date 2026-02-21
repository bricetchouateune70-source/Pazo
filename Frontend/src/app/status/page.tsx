'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { getCurrentOrderId } from '@/lib/session';
import { escapeHtml } from '@/lib/security';
import { toast } from '@/components/ui/Toaster';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  Truck, 
  XCircle, 
  Loader2,
  ArrowLeft,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
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
  deliveryAddress: string | null;
  notes: string | null;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

const statusConfig: Record<OrderStatus, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: any;
  description: string;
}> = {
  [OrderStatus.PENDING]: { 
    label: 'Ausstehend', 
    color: 'text-yellow-800', 
    bgColor: 'bg-yellow-100',
    icon: Clock,
    description: 'Ihre Bestellung wurde empfangen und wartet auf Bestätigung.'
  },
  [OrderStatus.CONFIRMED]: { 
    label: 'Bestätigt', 
    color: 'text-blue-800', 
    bgColor: 'bg-blue-100',
    icon: CheckCircle,
    description: 'Ihre Bestellung wurde bestätigt und wird bald zubereitet.'
  },
  [OrderStatus.IN_PRODUCTION]: { 
    label: 'In Zubereitung', 
    color: 'text-orange-800', 
    bgColor: 'bg-orange-100',
    icon: Package,
    description: 'Ihre Pizza wird gerade frisch zubereitet!'
  },
  [OrderStatus.READY]: { 
    label: 'Bereit', 
    color: 'text-green-800', 
    bgColor: 'bg-green-100',
    icon: CheckCircle,
    description: 'Ihre Bestellung ist fertig und kann abgeholt werden.'
  },
  [OrderStatus.OUT_FOR_DELIVERY]: { 
    label: 'Unterwegs', 
    color: 'text-purple-800', 
    bgColor: 'bg-purple-100',
    icon: Truck,
    description: 'Ihr Fahrer ist auf dem Weg zu Ihnen!'
  },
  [OrderStatus.DELIVERED]: { 
    label: 'Geliefert', 
    color: 'text-green-800', 
    bgColor: 'bg-green-100',
    icon: CheckCircle,
    description: 'Ihre Bestellung wurde erfolgreich geliefert. Guten Appetit!'
  },
  [OrderStatus.PICKED_UP]: { 
    label: 'Abgeholt', 
    color: 'text-green-800', 
    bgColor: 'bg-green-100',
    icon: CheckCircle,
    description: 'Ihre Bestellung wurde abgeholt. Guten Appetit!'
  },
  [OrderStatus.CANCELLED]: { 
    label: 'Storniert', 
    color: 'text-red-800', 
    bgColor: 'bg-red-100',
    icon: XCircle,
    description: 'Diese Bestellung wurde storniert.'
  },
};

// Status workflow order for progress display
const statusOrder = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.IN_PRODUCTION,
  OrderStatus.READY,
];

export default function StatusPage() {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get order ID from session cookie
  const orderId = typeof window !== 'undefined' ? getCurrentOrderId() : null;

  // Handle real-time order status updates
  const handleStatusUpdate = useCallback((event: OrderStatusUpdateEvent) => {
    if (order && event.orderId === order.id) {
      setOrder((prev) => prev ? { ...prev, status: event.status as OrderStatus } : null);
      
      const statusLabel = statusConfig[event.status as OrderStatus]?.label || event.status;
      toast.success(`Status aktualisiert: ${statusLabel}`);
    }
  }, [order]);

  // Connect to WebSocket for real-time updates
  useOrderSocket({
    onStatusUpdate: handleStatusUpdate,
  });

  // Fetch order data
  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setError('Keine aktuelle Bestellung gefunden');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiGet<{ success: boolean; data: Order }>(`/api/orders/${orderId}`);
      setOrder(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching order:', err);
      setError('Bestellung konnte nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Get current status index for progress bar
  const getCurrentStatusIndex = () => {
    if (!order) return 0;
    if (order.status === OrderStatus.CANCELLED) return -1;
    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.PICKED_UP) {
      return statusOrder.length;
    }
    return statusOrder.indexOf(order.status);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 animate-spin text-primary-500 mb-4" />
          <p className="text-gray-600">Lade Bestellstatus...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {error || 'Keine Bestellung gefunden'}
          </h2>
          <p className="text-gray-600 mb-8">
            Bestellen Sie jetzt eine leckere Pizza!
          </p>
          <Link href="/menu" className="btn-primary">
            Zur Speisekarte
          </Link>
        </div>
      </div>
    );
  }

  const status = statusConfig[order.status];
  const StatusIcon = status.icon;
  const statusIndex = getCurrentStatusIndex();

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link 
          href="/menu" 
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Zurück zum Menü</span>
        </Link>
        <button 
          onClick={fetchOrder}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <RefreshCw className="w-5 h-5" />
          <span>Aktualisieren</span>
        </button>
      </div>

      {/* Main Status Card */}
      <div className="card p-8 mb-6">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${status.bgColor} mb-4`}>
            <StatusIcon className={`w-10 h-10 ${status.color}`} />
          </div>
          <h1 className="text-3xl font-bold mb-2">{status.label}</h1>
          <p className="text-gray-600">{status.description}</p>
        </div>

        {/* Progress Bar (only for active orders) */}
        {order.status !== OrderStatus.CANCELLED && statusIndex >= 0 && (
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {statusOrder.map((s, index) => {
                const config = statusConfig[s];
                const isActive = index <= statusIndex;
                const isCurrent = index === statusIndex;
                return (
                  <div key={s} className="flex flex-col items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                      isActive ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                    } ${isCurrent ? 'ring-4 ring-green-200' : ''}`}>
                      {isActive ? <CheckCircle className="w-5 h-5" /> : index + 1}
                    </div>
                    <span className={`text-xs text-center ${isActive ? 'text-green-700 font-medium' : 'text-gray-400'}`}>
                      {config.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${(statusIndex / (statusOrder.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Ihre Bestellung</h2>
          
          <div className="space-y-3 mb-6">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="bg-gray-100 px-2 py-1 rounded text-sm font-medium">
                    {item.quantity}x
                  </span>
                  {/* XSS Protection: React automatically escapes this */}
                  <span>{item.product.name}</span>
                </div>
                <span className="font-medium">
                  {(item.unitPrice * item.quantity).toFixed(2)} €
                </span>
              </div>
            ))}
          </div>

          {/* Notes - with explicit escaping for display */}
          {order.notes && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600">
                <strong>Anmerkungen:</strong>{' '}
                {/* React escapes this automatically, but we're explicit about it */}
                {order.notes}
              </p>
            </div>
          )}

          {/* Delivery Address */}
          {order.deliveryMethod === 'DELIVERY' && order.deliveryAddress && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                <strong>Lieferadresse:</strong>{' '}
                {order.deliveryAddress}
              </p>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-lg font-semibold">Gesamt</span>
            <span className="text-2xl font-bold text-primary-600">
              {order.total.toFixed(2)} €
            </span>
          </div>
        </div>
      </div>

      {/* Order Info */}
      <div className="card p-4 text-center text-sm text-gray-500">
        <p>
          Bestellt am{' '}
          {new Date(order.createdAt).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
        <p className="text-xs mt-1">
          Bestellnummer: {order.id.substring(0, 8).toUpperCase()}
        </p>
      </div>

      {/* Live Update Indicator */}
      <div className="mt-6 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-green-600">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          Live-Updates aktiv
        </div>
      </div>
    </div>
  );
}
