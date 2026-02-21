'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { apiGet, apiPatch } from '@/lib/api';
import { toast } from '@/components/ui/Toaster';
import { 
  Package, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  Truck, 
  XCircle,
  Loader2,
  ChevronRight,
  Wifi
} from 'lucide-react';
import { Role, OrderStatus } from '@pazo/shared';
import { useOrderSocket } from '@/hooks/useOrderSocket';
import { OrderStatusUpdateEvent, NewOrderEvent } from '@/lib/socket';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  product: {
    id: string;
    name: string;
  };
}

interface Order {
  id: string;
  status: OrderStatus;
  deliveryMethod: string;
  deliveryAddress: string | null;
  total: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  items: OrderItem[];
}

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  todayOrders: number;
  totalRevenue: number;
}

const statusConfig: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
  [OrderStatus.PENDING]: { label: 'Ausstehend', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
  [OrderStatus.CONFIRMED]: { label: 'Bestätigt', color: 'text-blue-800', bgColor: 'bg-blue-100' },
  [OrderStatus.IN_PRODUCTION]: { label: 'In Zubereitung', color: 'text-orange-800', bgColor: 'bg-orange-100' },
  [OrderStatus.READY]: { label: 'Bereit', color: 'text-green-800', bgColor: 'bg-green-100' },
  [OrderStatus.OUT_FOR_DELIVERY]: { label: 'Unterwegs', color: 'text-purple-800', bgColor: 'bg-purple-100' },
  [OrderStatus.DELIVERED]: { label: 'Geliefert', color: 'text-green-800', bgColor: 'bg-green-100' },
  [OrderStatus.PICKED_UP]: { label: 'Abgeholt', color: 'text-green-800', bgColor: 'bg-green-100' },
  [OrderStatus.CANCELLED]: { label: 'Storniert', color: 'text-red-800', bgColor: 'bg-red-100' },
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  const isAdmin = user?.role === Role.ADMIN;
  const isBaecker = user?.role === Role.BAECKER;
  const isLieferant = user?.role === Role.LIEFERANT;
  const isStaff = isAdmin || isBaecker || isLieferant;

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
    toast.info(`Bestellung aktualisiert: ${statusLabel}`);
  }, []);

  // Handle new orders
  const handleNewOrder = useCallback((event: NewOrderEvent) => {
    setOrders((prevOrders) => [event.order, ...prevOrders]);
    toast.success('Neue Bestellung eingegangen!');
    
    // Update stats if available
    if (stats) {
      setStats((prevStats) => prevStats ? {
        ...prevStats,
        totalOrders: prevStats.totalOrders + 1,
        pendingOrders: prevStats.pendingOrders + 1,
        todayOrders: prevStats.todayOrders + 1,
        totalRevenue: prevStats.totalRevenue + event.order.total,
      } : null);
    }
  }, [stats]);

  // Connect to WebSocket for real-time updates
  useOrderSocket({
    onStatusUpdate: handleStatusUpdate,
    onNewOrder: handleNewOrder,
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isStaff)) {
      toast.error('Keine Berechtigung für das Dashboard');
      router.push('/');
    }
  }, [authLoading, isAuthenticated, isStaff, router]);

  useEffect(() => {
    async function fetchData() {
      if (!isAuthenticated || !isStaff) return;

      try {
        const [ordersRes, statsRes] = await Promise.all([
          apiGet<{ success: boolean; data: Order[] }>('/api/orders'),
          isAdmin ? apiGet<{ success: boolean; data: Stats }>('/api/orders/stats/summary') : Promise.resolve(null),
        ]);

        setOrders(ordersRes.data);
        if (statsRes) {
          setStats(statsRes.data);
        }
      } catch (error: any) {
        toast.error(error.message || 'Fehler beim Laden der Daten');
      } finally {
        setIsLoading(false);
      }
    }

    if (isAuthenticated && isStaff) {
      fetchData();
    }
  }, [isAuthenticated, isStaff, isAdmin]);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrder(orderId);
    try {
      await apiPatch(`/api/orders/${orderId}/status`, { status: newStatus });
      setOrders(orders.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ));
      toast.success(`Status geändert zu: ${statusConfig[newStatus].label}`);
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Aktualisieren');
    } finally {
      setUpdatingOrder(null);
    }
  };

  // Welche Status-Übergänge sind für diese Rolle erlaubt?
  const getNextStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
    if (isAdmin) {
      return Object.values(OrderStatus);
    }
    
    if (isBaecker) {
      switch (currentStatus) {
        case OrderStatus.PENDING:
          return [OrderStatus.CONFIRMED, OrderStatus.CANCELLED];
        case OrderStatus.CONFIRMED:
          return [OrderStatus.IN_PRODUCTION, OrderStatus.CANCELLED];
        case OrderStatus.IN_PRODUCTION:
          return [OrderStatus.READY, OrderStatus.CANCELLED];
        default:
          return [];
      }
    }
    
    if (isLieferant) {
      switch (currentStatus) {
        case OrderStatus.READY:
          return [OrderStatus.OUT_FOR_DELIVERY];
        case OrderStatus.OUT_FOR_DELIVERY:
          return [OrderStatus.DELIVERED];
        default:
          return [];
      }
    }
    
    return [];
  };

  if (authLoading || !isAuthenticated || !isStaff) {
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">
            Willkommen, {user?.name} ({user?.role})
          </p>
        </div>
      </div>

      {/* Stats für Admin */}
      {isAdmin && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Bestellungen gesamt</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Offene Bestellungen</p>
                <p className="text-2xl font-bold">{stats.pendingOrders}</p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Heute</p>
                <p className="text-2xl font-bold">{stats.todayOrders}</p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Umsatz gesamt</p>
                <p className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} €</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="card">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">
            {isBaecker && 'Bestellungen zur Zubereitung'}
            {isLieferant && 'Bestellungen zur Lieferung'}
            {isAdmin && 'Alle Bestellungen'}
          </h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Keine Bestellungen vorhanden
          </div>
        ) : (
          <div className="divide-y">
            {orders.map((order) => {
              const status = statusConfig[order.status];
              const nextStatuses = getNextStatuses(order.status);

              return (
                <div key={order.id} className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bgColor} ${status.color}`}>
                          {status.label}
                        </span>
                        <span className="text-gray-500 text-sm">
                          #{order.id.slice(0, 8)}
                        </span>
                      </div>
                      <p className="font-medium">{order.user.name}</p>
                      <p className="text-sm text-gray-500">{order.user.email}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {order.deliveryMethod === 'DELIVERY' ? (
                          <>📦 Lieferung: {order.deliveryAddress}</>
                        ) : (
                          <>🏪 Abholung</>
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold text-secondary-500">
                        {order.total.toFixed(2)} €
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleString('de-DE')}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-sm mb-2">Artikel:</p>
                    <div className="space-y-1">
                      {order.items.map((item) => (
                        <p key={item.id} className="text-sm text-gray-600">
                          {item.quantity}x {item.product.name} - {(item.unitPrice * item.quantity).toFixed(2)} €
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Status Actions */}
                  {nextStatuses.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {nextStatuses.map((nextStatus) => (
                        <button
                          key={nextStatus}
                          onClick={() => updateOrderStatus(order.id, nextStatus)}
                          disabled={updatingOrder === order.id}
                          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${statusConfig[nextStatus].bgColor} ${statusConfig[nextStatus].color} hover:opacity-80 disabled:opacity-50`}
                        >
                          {updatingOrder === order.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          {statusConfig[nextStatus].label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
