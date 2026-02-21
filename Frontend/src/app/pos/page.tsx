'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { apiGet, apiPost, apiPatch } from '@/lib/api';
import { toast } from '@/components/ui/Toaster';
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  DollarSign,
  Clock,
  CheckCircle,
  Package,
  Loader2,
  Send,
  RefreshCw,
  Wifi
} from 'lucide-react';
import { Role, OrderStatus } from '@pazo/shared';
import { useOrderSocket } from '@/hooks/useOrderSocket';
import { OrderStatusUpdateEvent, NewOrderEvent } from '@/lib/socket';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface TodayStats {
  todayOrders: number;
  completedOrders: number;
  pendingOrders: number;
  todayRevenue: number;
}

interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  notes: string | null;
  createdAt: string;
  items: Array<{
    quantity: number;
    product: { name: string };
  }>;
}

const statusLabels: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Ausstehend',
  [OrderStatus.CONFIRMED]: 'Bestätigt',
  [OrderStatus.IN_PRODUCTION]: 'In Zubereitung',
  [OrderStatus.READY]: 'Bereit',
  [OrderStatus.OUT_FOR_DELIVERY]: 'Unterwegs',
  [OrderStatus.DELIVERED]: 'Geliefert',
  [OrderStatus.PICKED_UP]: 'Abgeholt',
  [OrderStatus.CANCELLED]: 'Storniert',
};

export default function POSPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState<TodayStats | null>(null);
  const [todayOrders, setTodayOrders] = useState<Order[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const isBaecker = user?.role === Role.BAECKER || user?.role === Role.ADMIN;

  // Handle real-time order status updates
  const handleStatusUpdate = useCallback((event: OrderStatusUpdateEvent) => {
    setTodayOrders((prevOrders) => 
      prevOrders.map((order) => 
        order.id === event.orderId 
          ? { ...order, status: event.status as OrderStatus }
          : order
      )
    );
    
    // Update stats when order is completed
    if (event.status === OrderStatus.PICKED_UP || event.status === OrderStatus.DELIVERED) {
      setStats((prevStats) => prevStats ? {
        ...prevStats,
        completedOrders: prevStats.completedOrders + 1,
        pendingOrders: Math.max(0, prevStats.pendingOrders - 1),
      } : null);
    }
    
    const statusLabel = statusLabels[event.status as OrderStatus] || event.status;
    toast.info(`Bestellung: ${statusLabel}`);
  }, []);

  // Handle new orders
  const handleNewOrder = useCallback((event: NewOrderEvent) => {
    setTodayOrders((prevOrders) => [event.order, ...prevOrders]);
    setStats((prevStats) => prevStats ? {
      ...prevStats,
      todayOrders: prevStats.todayOrders + 1,
      pendingOrders: prevStats.pendingOrders + 1,
      todayRevenue: prevStats.todayRevenue + event.order.total,
    } : null);
    toast.success('Neue Bestellung!');
  }, []);

  // Connect to WebSocket for real-time updates
  useOrderSocket({
    onStatusUpdate: handleStatusUpdate,
    onNewOrder: handleNewOrder,
  });

  // Auth-Check
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isBaecker)) {
      toast.error('Nur für Bäcker und Admins zugänglich');
      router.push('/');
    }
  }, [authLoading, isAuthenticated, isBaecker, router]);

  // Daten laden
  useEffect(() => {
    if (!isAuthenticated || !isBaecker) return;
    loadData();
  }, [isAuthenticated, isBaecker]);

  async function loadData() {
    try {
      setIsLoading(true);
      const [productsRes, statsRes, ordersRes] = await Promise.all([
        apiGet<{ success: boolean; data: Product[] }>('/api/products'),
        apiGet<{ success: boolean; data: TodayStats }>('/api/orders/stats/today'),
        apiGet<{ success: boolean; data: Order[] }>('/api/orders/today'),
      ]);
      setProducts(productsRes.data);
      setStats(statsRes.data);
      setTodayOrders(ordersRes.data);
      
      // Erste Kategorie als aktiv setzen
      if (productsRes.data.length > 0 && !activeCategory) {
        const categories = [...new Set(productsRes.data.map(p => p.category.id))];
        setActiveCategory(categories[0]);
      }
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Laden');
    } finally {
      setIsLoading(false);
    }
  }

  // Warenkorb-Funktionen
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setNotes('');
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Bestellung abschicken
  const submitOrder = async () => {
    if (cart.length === 0) {
      toast.error('Der Warenkorb ist leer');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        customerName: customerName.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      await apiPost('/api/orders/pos', orderData);
      toast.success('Bestellung erfolgreich erstellt!');
      clearCart();
      loadData(); // Stats und Bestellungen neu laden
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Erstellen der Bestellung');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status ändern
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await apiPatch(`/api/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Status geändert: ${statusLabels[newStatus]}`);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Ändern des Status');
    }
  };

  // Kategorien extrahieren
  const categories = [...new Map(products.map(p => [p.category.id, p.category])).values()];
  const filteredProducts = activeCategory
    ? products.filter(p => p.category.id === activeCategory)
    : products;

  if (authLoading || !isAuthenticated || !isBaecker) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header mit Stats */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">POS - Kasse</h1>
            <button
              onClick={loadData}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Aktualisieren"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
          
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-blue-600">
                  <ShoppingBag className="w-5 h-5" />
                  <span className="text-sm">Heute gesamt</span>
                </div>
                <p className="text-2xl font-bold mt-1">{stats.todayOrders}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-600">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm">Offen</span>
                </div>
                <p className="text-2xl font-bold mt-1">{stats.pendingOrders}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm">Fertig</span>
                </div>
                <p className="text-2xl font-bold mt-1">{stats.completedOrders}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-purple-600">
                  <DollarSign className="w-5 h-5" />
                  <span className="text-sm">Tagesumsatz</span>
                </div>
                <p className="text-2xl font-bold mt-1">{stats.todayRevenue.toFixed(2)} €</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Produkte */}
          <div className="lg:col-span-2">
            {/* Kategorie-Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-primary-400 text-black'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Produkt-Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                    <div className="h-16 bg-gray-200 rounded mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white rounded-lg p-4 text-left hover:shadow-md hover:bg-primary-50 transition-all active:scale-95"
                  >
                    <div className="h-12 flex items-center justify-center text-3xl mb-2">
                      🍔
                    </div>
                    <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                    <p className="text-primary-600 font-bold mt-1">{product.price.toFixed(2)} €</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Warenkorb & Aktionen */}
          <div className="lg:col-span-1 space-y-4">
            {/* Warenkorb */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-bold flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Warenkorb
                </h2>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-red-500 text-sm hover:underline"
                  >
                    Leeren
                  </button>
                )}
              </div>

              <div className="p-4 max-h-64 overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Warenkorb ist leer</p>
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.product.id} className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.product.name}</p>
                          <p className="text-xs text-gray-500">
                            {item.product.price.toFixed(2)} € × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="p-1 rounded hover:bg-gray-100"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="p-1 rounded hover:bg-gray-100"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="p-1 rounded hover:bg-red-100 text-red-500 ml-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex justify-between text-lg font-bold mb-4">
                    <span>Gesamt</span>
                    <span className="text-secondary-500">{cartTotal.toFixed(2)} €</span>
                  </div>

                  <input
                    type="text"
                    placeholder="Kundenname (optional)"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="input mb-2 text-sm"
                  />
                  
                  <input
                    type="text"
                    placeholder="Notiz (optional)"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="input mb-3 text-sm"
                  />

                  <button
                    onClick={submitOrder}
                    disabled={isSubmitting}
                    className="btn-secondary w-full py-3 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Bestellung aufgeben
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Heutige Bestellungen */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="font-bold flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Heutige Bestellungen
                </h2>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {todayOrders.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Keine Bestellungen heute</p>
                ) : (
                  <div className="divide-y">
                    {todayOrders.slice(0, 10).map(order => (
                      <div key={order.id} className="p-3">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <span className="text-xs text-gray-500">
                              {new Date(order.createdAt).toLocaleTimeString('de-DE', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <p className="font-medium text-sm">{order.total.toFixed(2)} €</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            order.status === OrderStatus.READY ? 'bg-green-100 text-green-700' :
                            order.status === OrderStatus.IN_PRODUCTION ? 'bg-orange-100 text-orange-700' :
                            order.status === OrderStatus.PICKED_UP ? 'bg-gray-100 text-gray-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {statusLabels[order.status]}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {order.items.map(i => `${i.quantity}× ${i.product.name}`).join(', ')}
                        </p>
                        {order.notes && (
                          <p className="text-xs text-gray-400 mt-1 italic">{order.notes}</p>
                        )}
                        
                        {/* Quick Status Buttons */}
                        {(order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.PENDING) && (
                          <button
                            onClick={() => updateOrderStatus(order.id, OrderStatus.IN_PRODUCTION)}
                            className="mt-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200"
                          >
                            → In Zubereitung
                          </button>
                        )}
                        {order.status === OrderStatus.IN_PRODUCTION && (
                          <button
                            onClick={() => updateOrderStatus(order.id, OrderStatus.READY)}
                            className="mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                          >
                            → Fertig
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
