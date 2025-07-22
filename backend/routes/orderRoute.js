import express from 'express';
import { placeOrder, verifyOrder, userOrders, listOrders, updateStatus } from '../controllers/orderController.js';
import { orderRateLimit } from '../middleware/rateLimiter.js';
import authMiddleware from '../middleware/auth.js';

const orderRouter = express.Router();

// User routes
orderRouter.post('/place', authMiddleware, orderRateLimit, placeOrder);
orderRouter.post('/verify', verifyOrder);
orderRouter.post('/userorders', authMiddleware, userOrders);

// Admin routes
orderRouter.get('/list', listOrders);
orderRouter.post('/status', updateStatus);

export default orderRouter;
