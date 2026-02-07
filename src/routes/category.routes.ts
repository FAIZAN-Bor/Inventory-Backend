// Category routes - TESTING MODE (no validation)

import { Router } from 'express';
import { categoryController } from '../controllers';
import { optionalAuth, optionalCompany } from '../middleware';

const router = Router();

// All routes use optional authentication for development
// NOTE: In production, re-enable validation and use authenticate + requireCompany

// Get all categories
router.get('/', optionalAuth, optionalCompany, categoryController.getAll);

// Get category by ID
router.get('/:id', optionalAuth, optionalCompany, categoryController.getById);

// Create category
router.post('/', optionalAuth, optionalCompany, categoryController.create);

// Update category
router.put('/:id', optionalAuth, optionalCompany, categoryController.update);

// Delete category
router.delete('/:id', optionalAuth, optionalCompany, categoryController.remove);

export default router;
