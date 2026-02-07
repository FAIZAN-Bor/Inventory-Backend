// Routes barrel export - API route aggregator
import { Router } from 'express';

import authRoutes from './auth.routes';
import companyRoutes from './company.routes';
import dashboardRoutes from './dashboard.routes';
import categoryRoutes from './category.routes';
import inventoryRoutes from './inventory.routes';
import partyRoutes from './party.routes';
import supplierRoutes from './supplier.routes';
import salesRoutes from './sales.routes';
import purchaseRoutes from './purchase.routes';
import deliveryChallanRoutes from './deliveryChallan.routes';
import salesTaxInvoiceRoutes from './salesTaxInvoice.routes';
import quotationRoutes from './quotation.routes';
import hsCodeRoutes from './hsCode.routes';
import userRoutes from './user.routes';

const router = Router();

// Auth routes (no auth required for login/register)
router.use('/auth', authRoutes);

// Company routes (public - for signup/login dropdown)
router.use('/companies', companyRoutes);

// Dashboard routes
router.use('/dashboard', dashboardRoutes);

// Feature routes
router.use('/categories', categoryRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/parties', partyRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/sales', salesRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/delivery-challans', deliveryChallanRoutes);
router.use('/sales-tax-invoices', salesTaxInvoiceRoutes);
router.use('/quotations', quotationRoutes);
router.use('/hs-codes', hsCodeRoutes);
router.use('/users', userRoutes);

export default router;

