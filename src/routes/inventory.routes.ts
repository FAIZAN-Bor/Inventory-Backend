// Inventory routes - TESTING MODE (no validation)

import { Router } from 'express';
import { inventoryController } from '../controllers';
import { optionalAuth, optionalCompany } from '../middleware';

const router = Router();

// All routes use optional authentication for development
// NOTE: In production, re-enable validation and use authenticate + requireCompany

// Get all inventory items
router.get('/', optionalAuth, optionalCompany, inventoryController.getAll);

// Get low stock items
router.get('/low-stock', optionalAuth, optionalCompany, inventoryController.getLowStock);

// Export inventory data (must be before /:id route)
router.get('/export', optionalAuth, optionalCompany, inventoryController.exportInventory);

// Get inventory item by ID
router.get('/:id', optionalAuth, optionalCompany, inventoryController.getById);

// Get stock history for an inventory item
router.get('/:id/stock-history', optionalAuth, optionalCompany, inventoryController.getStockHistory);

// Create inventory item
router.post('/', optionalAuth, optionalCompany, inventoryController.create);

// Bulk create inventory items
router.post('/bulk', optionalAuth, optionalCompany, inventoryController.bulkCreate);

// Adjust stock
router.post('/adjust-stock', optionalAuth, optionalCompany, inventoryController.adjustStock);

// Update inventory item
router.put('/:id', optionalAuth, optionalCompany, inventoryController.update);

// Delete inventory item
router.delete('/:id', optionalAuth, optionalCompany, inventoryController.remove);

export default router;
