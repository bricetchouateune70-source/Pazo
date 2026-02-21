import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server | null = null;

export function initializeSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5001',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`📡 Client connected: ${socket.id}`);

    // Client kann einem Room beitreten für benutzer-spezifische Updates
    socket.on('join:user', (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`   User ${userId} joined their room`);
    });

    // Staff können dem Staff-Room beitreten
    socket.on('join:staff', () => {
      socket.join('staff');
      console.log(`   Socket ${socket.id} joined staff room`);
    });

    socket.on('disconnect', () => {
      console.log(`📡 Client disconnected: ${socket.id}`);
    });
  });

  console.log('🔌 WebSocket server initialized');
  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO has not been initialized');
  }
  return io;
}

// Event Types
export interface OrderUpdateEvent {
  orderId: string;
  status: string;
  previousStatus: string;
  updatedAt: string;
  order: any; // Full order object
}

export interface NewOrderEvent {
  order: any;
}

// Emit functions
export function emitOrderStatusUpdate(event: OrderUpdateEvent) {
  if (!io) return;
  
  // An alle Staff-Mitglieder senden
  io.to('staff').emit('order:status-updated', event);
  
  // An den spezifischen User senden (falls er verbunden ist)
  if (event.order?.userId) {
    io.to(`user:${event.order.userId}`).emit('order:status-updated', event);
  }
  
  console.log(`📤 Emitted order:status-updated for order ${event.orderId}`);
}

export function emitNewOrder(event: NewOrderEvent) {
  if (!io) return;
  
  // An alle Staff-Mitglieder senden
  io.to('staff').emit('order:new', event);
  
  console.log(`📤 Emitted order:new for order ${event.order.id}`);
}
