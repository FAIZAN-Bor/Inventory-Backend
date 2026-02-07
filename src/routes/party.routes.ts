// Party routes

import { Router } from 'express';
import { partyController } from '../controllers';
import { authenticate, requireCompany, validateBody, validateQuery, validateParams } from '../middleware';
import { createPartySchema, updatePartySchema, partyFilterSchema, partyPaymentSchema, idParamSchema } from '../validators';

const router = Router();

// All routes require authentication and company context
router.use(authenticate, requireCompany);

// Get all parties
router.get('/', validateQuery(partyFilterSchema), partyController.getAll);

// Get party by ID
router.get('/:id', validateParams(idParamSchema), partyController.getById);

// Get party ledger/transactions
router.get('/:id/ledger', validateParams(idParamSchema), partyController.getLedger);

// Create party
router.post('/', validateBody(createPartySchema), partyController.create);

// Update party
router.put('/:id', validateParams(idParamSchema), validateBody(updatePartySchema), partyController.update);

// Delete party
router.delete('/:id', validateParams(idParamSchema), partyController.remove);

// Record payment
router.post('/:id/payment', validateParams(idParamSchema), validateBody(partyPaymentSchema), partyController.recordPayment);

// Update payment
router.put('/:id/payment/:paymentId', validateParams(idParamSchema), validateBody(partyPaymentSchema), partyController.updatePayment);

// Delete payment
router.delete('/:id/payment/:paymentId', validateParams(idParamSchema), partyController.deletePayment);

export default router;
