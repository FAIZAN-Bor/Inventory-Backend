// Common validators - shared validation schemas
// RELAXED FOR TESTING - minimal validation
import Joi from 'joi';

// UUID validation - accept any string for testing
export const uuidSchema = Joi.string().optional().allow('', null);

// ID parameter schema - flexible for testing
export const idParamSchema = Joi.object({
    id: Joi.string().optional().allow(''),
}).unknown(true);

// Pagination query schema - relaxed
export const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(10000).default(1000),
    sortBy: Joi.string().optional().allow(''),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
}).unknown(true);

// Date range query schema
export const dateRangeSchema = Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
}).unknown(true);

// Search query schema
export const searchSchema = Joi.object({
    search: Joi.string().trim().max(255).optional().allow(''),
}).unknown(true);

// Common field validators - all optional for testing
export const nameField = Joi.string().trim().max(255).optional().allow('');
export const emailField = Joi.string().trim().email().max(255).optional().allow('');
export const phoneField = Joi.string().trim().max(20).optional().allow('');
export const addressField = Joi.string().trim().max(500).optional().allow('');
export const descriptionField = Joi.string().trim().max(1000).optional().allow('');
export const notesField = Joi.string().trim().max(2000).optional().allow('');
export const amountField = Joi.number().optional().allow(null);
export const quantityField = Joi.number().optional().allow(null);
export const percentageField = Joi.number().optional().allow(null);

export default {
    uuidSchema,
    idParamSchema,
    paginationSchema,
    dateRangeSchema,
    searchSchema,
    nameField,
    emailField,
    phoneField,
    addressField,
    descriptionField,
    notesField,
    amountField,
    quantityField,
    percentageField,
};
