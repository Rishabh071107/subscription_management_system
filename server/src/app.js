import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler.js';

// Feature route imports
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/users.routes.js';
import adminStaffRoutes from './modules/admin/adminStaff.routes.js';
import customersRoutes from './modules/customers/customers.routes.js';
import profileRoutes from './modules/profile/profile.routes.js';
import productRoutes from './modules/products/products.routes.js';
import planRoutes from './modules/plans/plans.routes.js';
import quotationRoutes from './modules/quotations/quotations.routes.js';
import subscriptionRoutes from './modules/subscriptions/subscriptions.routes.js';
import invoiceRoutes from './modules/invoices/invoices.routes.js';
import billingRoutes from './modules/billing/billing.routes.js';
import paymentRoutes from './modules/payments/payments.routes.js';
import overdueRoutes from './modules/overdue/overdue.routes.js';
import discountRoutes from './modules/discounts/discounts.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Brightloop Subscription Management API is running healthy',
    timestamp: new Date().toISOString()
  });
});

// Modular Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin/staff', adminStaffRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/products', productRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/overdue', overdueRoutes);
app.use('/api/v1/overdue', overdueRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/v1/reports/dashboard', dashboardRoutes);

// 404 Route Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
