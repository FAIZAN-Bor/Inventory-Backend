import { Router } from 'express';
import * as salesTaxInvoiceController from '../controllers/salesTaxInvoice.controller';
import { authenticate, requireCompany } from '../middleware';

const router = Router();

// Protect all routes
router.use(authenticate, requireCompany);

router.get('/', salesTaxInvoiceController.getAll);
router.get('/:id', salesTaxInvoiceController.getById);
router.post('/', salesTaxInvoiceController.create);
router.put('/:id', salesTaxInvoiceController.update);
router.delete('/:id', salesTaxInvoiceController.remove);

export default router;
