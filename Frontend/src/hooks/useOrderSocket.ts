'use client';

import { useEffect, useCallback } from 'react';
import { getSocket, connectSocket, disconnectSocket, OrderStatusUpdateEvent, NewOrderEvent } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { Role } from '@pazo/shared';

interface UseOrderSocketOptions {
  onStatusUpdate?: (event: OrderStatusUpdateEvent) => void;
  onNewOrder?: (event: NewOrderEvent) => void;
}

export function useOrderSocket(options: UseOrderSocketOptions = {}) {
  const { user, isAuthenticated } = useAuthStore();

  const { onStatusUpdate, onNewOrder } = options;

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const socket = connectSocket();

    // Join user-specific room
    socket.emit('join:user', user.id);

    // Staff join the staff room for all order updates
    const isStaff = user.role === Role.ADMIN || user.role === Role.BAECKER || user.role === Role.LIEFERANT;
    if (isStaff) {
      socket.emit('join:staff');
    }

    // Listen for order status updates
    if (onStatusUpdate) {
      socket.on('order:status-updated', onStatusUpdate);
    }

    // Listen for new orders (staff only)
    if (onNewOrder && isStaff) {
      socket.on('order:new', onNewOrder);
    }

    return () => {
      if (onStatusUpdate) {
        socket.off('order:status-updated', onStatusUpdate);
      }
      if (onNewOrder) {
        socket.off('order:new', onNewOrder);
      }
    };
  }, [isAuthenticated, user, onStatusUpdate, onNewOrder]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't disconnect completely, just cleanup listeners
      // disconnectSocket();
    };
  }, []);

  const joinUserRoom = useCallback((userId: string) => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit('join:user', userId);
    }
  }, []);

  const joinStaffRoom = useCallback(() => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit('join:staff');
    }
  }, []);

  return {
    joinUserRoom,
    joinStaffRoom,
  };
}
