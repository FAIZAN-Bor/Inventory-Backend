import Joi from 'joi';

export const createHSCodeSchema = Joi.object({
    code: Joi.string().trim().max(50).required().messages({
        'any.required': 'HS Code is required',
        'string.empty': 'HS Code cannot be empty'
    }),
    description: Joi.string().trim().required().messages({
        'any.required': 'Description is required',
        'string.empty': 'Description cannot be empty'
    }),
    quantity: Joi.number().min(0).optional().default(0),
}).unknown(true);

export const updateHSCodeSchema = Joi.object({
    code: Joi.string().trim().max(50).optional(),
    description: Joi.string().trim().optional(),
    quantity: Joi.number().min(0).optional(),
}).unknown(true);

export const hsCodeFilterSchema = Joi.object({
    page: Joi.number().optional().default(1),
    limit: Joi.number().optional().default(100),
    search: Joi.string().optional().allow(''),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().optional(),
}).unknown(true);

export default {
    createHSCodeSchema,
    updateHSCodeSchema,
    hsCodeFilterSchema,
};
