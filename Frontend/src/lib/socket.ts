import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      timeout: 5000,
    });

    socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      connectionAttempts = 0;
    });

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
      connectionAttempts++;
      console.error('🔌 WebSocket connection error:', error.message);
      if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log('🔌 Max reconnection attempts reached, stopping');
        socket?.disconnect();
      }
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
