import { Router } from 'express';
import * as hsCodeController from '../controllers/hsCode.controller'; // Direct import
import { optionalAuth, optionalCompany } from '../middleware'; // Using optional for now as per other routes for ease of testing
import { validateBody, validateQuery } from '../middleware';
import { createHSCodeSchema, updateHSCodeSchema, hsCodeFilterSchema } from '../validators/hsCode.validator';

const router = Router();

// Get all HS Codes
router.get('/', optionalAuth, optionalCompany, validateQuery(hsCodeFilterSchema), hsCodeController.getAll);

// Get HS Code by ID
router.get('/:id', optionalAuth, optionalCompany, hsCodeController.getById);

// Create HS Code
router.post('/', optionalAuth, optionalCompany, validateBody(createHSCodeSchema), hsCodeController.create);

// Update HS Code
router.put('/:id', optionalAuth, optionalCompany, validateBody(updateHSCodeSchema), hsCodeController.update);

// Delete HS Code
router.delete('/:id', optionalAuth, optionalCompany, hsCodeController.remove);

export default router;
