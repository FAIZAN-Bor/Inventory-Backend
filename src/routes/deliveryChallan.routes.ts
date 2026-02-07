// Delivery Challan routes

import { Router } from 'express';
import { deliveryChallanController } from '../controllers';
import { authenticate, requireCompany, validateBody, validateQuery, validateParams } from '../middleware';
import { createDeliveryChallanSchema, updateDeliveryChallanSchema, deliveryChallanFilterSchema, idParamSchema } from '../validators';

const router = Router();

// All routes require authentication and company context
router.use(authenticate, requireCompany);

// Get all delivery challans
router.get('/', validateQuery(deliveryChallanFilterSchema), deliveryChallanController.getAll);

// Get challan history
router.get('/history', validateQuery(deliveryChallanFilterSchema), deliveryChallanController.getHistory);

// Get next challan number
router.get('/next-number', deliveryChallanController.getNextNumber);

// Get delivery challan by ID
router.get('/:id', validateParams(idParamSchema), deliveryChallanController.getById);

// Create delivery challan
router.post('/', validateBody(createDeliveryChallanSchema), deliveryChallanController.create);

// Update delivery challan
router.put('/:id', validateParams(idParamSchema), validateBody(updateDeliveryChallanSchema), deliveryChallanController.update);

// Mark as delivered
router.post('/:id/deliver', validateParams(idParamSchema), deliveryChallanController.markDelivered);

// Cancel delivery challan
router.post('/:id/cancel', validateParams(idParamSchema), deliveryChallanController.cancel);

// Delete delivery challan
router.delete('/:id', validateParams(idParamSchema), deliveryChallanController.deleteChallan);

export default router;
