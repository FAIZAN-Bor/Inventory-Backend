// Supplier routes
import { Router } from 'express';
import { supplierController } from '../controllers';
import { authenticate, requireCompany, validateBody, validateQuery, validateParams } from '../middleware';
import { createSupplierSchema, updateSupplierSchema, supplierFilterSchema, supplierPaymentSchema, supplierTransactionParamSchema } from '../validators';
import { idParamSchema } from '../validators/common.validator';

const router = Router();

// All routes require authentication and company context
router.use(authenticate, requireCompany);

// Get all suppliers
router.get('/', validateQuery(supplierFilterSchema), supplierController.getAll);

// Get supplier by ID
router.get('/:id', validateParams(idParamSchema), supplierController.getById);

// Get supplier ledger/transactions
router.get('/:id/ledger', validateParams(idParamSchema), supplierController.getLedger);

// Create supplier
router.post('/', validateBody(createSupplierSchema), supplierController.create);

// Update supplier
router.put('/:id', validateParams(idParamSchema), validateBody(updateSupplierSchema), supplierController.update);

// Delete supplier
router.delete('/:id', validateParams(idParamSchema), supplierController.remove);

// Record payment
router.post('/:id/payment', validateParams(idParamSchema), validateBody(supplierPaymentSchema), supplierController.recordPayment);

// Update payment
router.put('/:id/transactions/:transactionId', validateParams(supplierTransactionParamSchema), validateBody(supplierPaymentSchema), supplierController.updatePayment);

// Delete payment
router.delete('/:id/transactions/:transactionId', validateParams(supplierTransactionParamSchema), supplierController.deletePayment);

export default router;
