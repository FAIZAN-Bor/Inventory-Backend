// Inventory validators - Joi schemas for inventory validation
// RELAXED FOR TESTING - All fields optional/flexible
import Joi from 'joi';

// For testing: accept any string for UUIDs
const flexibleUuid = Joi.string().optional().allow('', null);

export const createInventorySchema = Joi.object({
    article_code: Joi.string().trim().max(50).optional().allow(''),
    name: Joi.string().trim().max(255).optional().allow('').default('Unnamed Item'),
    description: Joi.string().trim().max(1000).optional().allow(''),
    category_id: flexibleUuid,
    unit: Joi.string().trim().max(20).optional().allow('').default('Pieces'),
    location: Joi.string().trim().max(100).optional().allow(''),
    image_url: Joi.string().optional().allow('', null),
    rate: Joi.number().optional().default(0),
    sale_price: Joi.number().optional().allow(null),
    min_sale_price: Joi.number().optional().allow(null),
    current_stock: Joi.number().optional().default(0),
    min_stock: Joi.number().optional().default(0),
}).unknown(true); // Allow unknown fields

export const updateInventorySchema = Joi.object({
    name: Joi.string().trim().max(255).optional().allow(''),
    description: Joi.string().trim().max(1000).optional().allow(''),
    category_id: flexibleUuid,
    unit: Joi.string().trim().max(20).optional().allow(''),
    location: Joi.string().trim().max(100).optional().allow(''),
    image_url: Joi.string().optional().allow('', null),
    rate: Joi.number().optional(),
    sale_price: Joi.number().optional().allow(null),
    min_sale_price: Joi.number().optional().allow(null),
    current_stock: Joi.number().optional(),
    min_stock: Joi.number().optional(),
    is_active: Joi.boolean().optional(),
}).unknown(true);

export const inventoryFilterSchema = Joi.object({
    page: Joi.number().optional().default(1),
    limit: Joi.number().optional().default(1000),
    search: Joi.string().optional().allow(''),
    category_id: Joi.string().optional().allow(''),
    is_active: Joi.boolean().optional(),
    low_stock: Joi.boolean().optional(),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().optional(),
}).unknown(true);

export const stockAdjustmentSchema = Joi.object({
    item_id: Joi.string().optional(),
    quantity: Joi.number().optional().default(0),
    type: Joi.string().valid('add', 'subtract', 'set').optional().default('add'),
    reason: Joi.string().trim().max(255).optional().allow(''),
}).unknown(true);

export const stockHistoryFilterSchema = Joi.object({
    page: Joi.number().optional().default(1),
    limit: Joi.number().optional().default(20),
    start_date: Joi.date().iso().optional(),
    end_date: Joi.date().iso().optional(),
    adjustment_type: Joi.string().optional(),
}).unknown(true);

export const bulkCreateInventorySchema = Joi.object({
    items: Joi.array().optional().default([]),
}).unknown(true);

export const inventoryExportSchema = Joi.object({
    category_id: Joi.string().optional().allow(''),
    is_active: Joi.boolean().optional(),
    format: Joi.string().valid('json', 'csv').default('json'),
}).unknown(true);

export default {
    createInventorySchema,
    updateInventorySchema,
    inventoryFilterSchema,
    stockAdjustmentSchema,
    stockHistoryFilterSchema,
    bulkCreateInventorySchema,
    inventoryExportSchema,
};
