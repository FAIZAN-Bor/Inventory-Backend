import { Router } from 'express';
import { quotationController } from '../controllers';
import { authenticate, requireCompany } from '../middleware';

const router = Router();

// All routes require authentication and company context
// Note: We authenticate first, then check company. 
// Given the recent "global" change, requireCompany might be relaxed 
// or relying on user context, which is fine.
router.use(authenticate, requireCompany);

// Get all quotations
router.get('/', quotationController.getAll);

// Get next quotation number
router.get('/next-number', quotationController.getNextNumber);

// Get quotation by ID
router.get('/:id', quotationController.getById);

// Create quotation
router.post('/', quotationController.create);

// Update quotation
router.put('/:id', quotationController.update);

// Delete quotation
router.delete('/:id', quotationController.remove);

export default router;
