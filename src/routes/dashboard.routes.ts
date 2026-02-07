// Dashboard routes

import { Router } from 'express';
import { dashboardController } from '../controllers';
import { authenticate, requireCompany } from '../middleware';

const router = Router();

// All routes require authentication and company context
router.use(authenticate, requireCompany);

// Get dashboard statistics
router.get('/stats', dashboardController.getStats);

// Get low stock items
router.get('/low-stock', dashboardController.getLowStock);

// Get recent transactions
router.get('/recent-transactions', dashboardController.getRecentTransactions);

// Get sales chart data
router.get('/sales-chart', dashboardController.getSalesChart);

export default router;
