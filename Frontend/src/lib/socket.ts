import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
    });

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error);
    });
  }

  return socket;
}

export function connectSocket(): Socket {
  const socket = getSocket();
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket && socket.connected) {
    socket.disconnect();
  }
}

// Event Types
export interface OrderStatusUpdateEvent {
  orderId: string;
  status: string;
  previousStatus: string;
  updatedAt: string;
  order: any;
}

export interface NewOrderEvent {
  order: any;
}
