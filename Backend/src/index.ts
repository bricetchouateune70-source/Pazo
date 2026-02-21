import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import categoriesRoutes from './routes/categories.js';
import productsRoutes from './routes/products.js';
import ordersRoutes from './routes/orders.js';
import usersRoutes from './routes/users.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initializeSocket } from './lib/socket.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize WebSocket
initializeSocket(httpServer);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5001',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/users', usersRoutes);

// Error Handler
app.use(errorHandler);

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket ready`);
});

export default app;
