// Inventory controller - handles inventory CRUD operations
import { Response } from 'express';
import { asyncHandler, ApiResponse } from '../utils';
import { inventoryService } from '../services';
import { AuthenticatedRequest } from '../types';

/**
 * Get all inventory items with pagination and filters
 * GET /inventory
 */
export const getAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { data, total } = await inventoryService.getAll(req.companyId!, req.query);
    const { page = 1, limit = 20 } = req.query as { page?: number; limit?: number };
    ApiResponse.paginated(res, data, Number(page), Number(limit), total, 'Inventory items retrieved');
});

/**
 * Get low stock items
 * GET /inventory/low-stock
 */
export const getLowStock = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const items = await inventoryService.getLowStock(req.companyId!);
    ApiResponse.success(res, items, 'Low stock items retrieved');
});

/**
 * Get inventory item by ID
 * GET /inventory/:id
 */
export const getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const item = await inventoryService.getById(req.companyId!, req.params.id);
    ApiResponse.success(res, item, 'Inventory item retrieved');
});

/**
 * Create a new inventory item
 * POST /inventory
 */
export const create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const item = await inventoryService.create(req.companyId!, req.body);
    ApiResponse.created(res, item, 'Inventory item created');
});

/**
 * Update an inventory item
 * PUT /inventory/:id
 */
export const update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const item = await inventoryService.update(req.companyId!, req.params.id, req.body);
    ApiResponse.success(res, item, 'Inventory item updated');
});

/**
 * Delete an inventory item
 * DELETE /inventory/:id
 */
export const remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await inventoryService.remove(req.companyId!, req.params.id);
    ApiResponse.success(res, null, 'Inventory item deleted');
});

/**
 * Adjust stock for an inventory item
 * POST /inventory/adjust-stock
 */
export const adjustStock = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const item = await inventoryService.adjustStock(req.companyId!, req.body, req.user?.id);
    ApiResponse.success(res, item, 'Stock adjusted successfully');
});

/**
 * Get stock history for an inventory item
 * GET /inventory/:id/stock-history
 */
export const getStockHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { data, total } = await inventoryService.getStockHistory(
        req.companyId!,
        req.params.id,
        req.query
    );
    const { page = 1, limit = 20 } = req.query as { page?: number; limit?: number };
    ApiResponse.paginated(res, data, Number(page), Number(limit), total, 'Stock history retrieved');
});

/**
 * Bulk create inventory items
 * POST /inventory/bulk
 */
export const bulkCreate = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await inventoryService.bulkCreate(req.companyId!, req.body);

    const message = result.errors.length > 0
        ? `Created ${result.created.length} items with ${result.errors.length} errors`
        : `Successfully created ${result.created.length} items`;

    ApiResponse.success(res, result, message);
});

/**
 * Export inventory data
 * GET /inventory/export
 */
export const exportInventory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const items = await inventoryService.exportInventory(req.companyId!, req.query);

    const format = req.query.format || 'json';

    if (format === 'csv') {
        // Generate CSV
        const headers = [
            'Article Code', 'Name', 'Description', 'Category', 'Unit',
            'Location', 'Rate', 'Sale Price', 'Min Sale Price',
            'Current Stock', 'Min Stock', 'Supplier', 'Active'
        ];

        const rows = items.map(item => [
            item.article_code,
            item.name,
            item.description || '',
            (item as any).category?.name || '',
            item.unit,
            item.location || '',
            item.rate,
            item.sale_price || '',
            item.min_sale_price || '',
            item.current_stock,
            item.min_stock,
            (item as any).supplier?.name || '',
            item.is_active ? 'Yes' : 'No'
        ]);

        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=inventory_export.csv');
        res.send(csvContent);
    } else {
        ApiResponse.success(res, items, 'Inventory exported successfully');
    }
});
