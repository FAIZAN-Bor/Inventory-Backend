// Category validators - Joi schemas for category validation
// RELAXED FOR TESTING - All fields optional/flexible
import Joi from 'joi';

export const createCategorySchema = Joi.object({
    name: Joi.string().trim().max(255).optional().allow('').default('Unnamed Category'),
    description: Joi.string().trim().max(1000).optional().allow(''),
}).unknown(true);

export const updateCategorySchema = Joi.object({
    name: Joi.string().trim().max(255).optional().allow(''),
    description: Joi.string().trim().max(1000).optional().allow(''),
    is_active: Joi.boolean().optional(),
}).unknown(true);

export const categoryFilterSchema = Joi.object({
    page: Joi.number().optional().default(1),
    limit: Joi.number().optional().default(100),
    search: Joi.string().optional().allow(''),
    is_active: Joi.boolean().optional(),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().optional(),
}).unknown(true);

export default {
    createCategorySchema,
    updateCategorySchema,
    categoryFilterSchema,
};
