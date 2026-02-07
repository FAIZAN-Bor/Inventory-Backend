import { Router } from 'express';
import { salesController } from '../controllers';
import { optionalAuth, optionalCompany } from '../middleware';
// import { salesValidator } from '../validators'; // Add validator later

const router = Router();

// Get all sales
router.get('/', optionalAuth, optionalCompany, salesController.getAll);

// Get next invoice number
router.get('/next-number', optionalAuth, optionalCompany, salesController.getNextNumber);

// Get last party price
router.get('/last-price', optionalAuth, optionalCompany, salesController.getLastPartyPrice);

// Get sale by ID
router.get('/:id', optionalAuth, optionalCompany, salesController.getById);

// Create sale
router.post('/', optionalAuth, optionalCompany, salesController.create);

// Update sale
router.put('/:id', optionalAuth, optionalCompany, salesController.update);

// Delete sale
router.delete('/:id', optionalAuth, optionalCompany, salesController.remove);

export default router;
