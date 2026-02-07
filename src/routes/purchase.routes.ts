import { Router } from 'express';
import { purchaseController } from '../controllers';
import { authenticate, requireCompany } from '../middleware';

const router = Router();

// Protect all routes
router.use(authenticate, requireCompany);

router.get('/', purchaseController.getAll);
router.get('/next-number', purchaseController.getNextNumber);
router.get('/:id', purchaseController.getById);
router.post('/', purchaseController.create);
router.delete('/:id', purchaseController.remove);

export default router;
