// Quotation validators
import Joi from 'joi';
import {
    nameField,
    descriptionField,
    quantityField,
    paginationSchema,
    searchSchema,
    dateRangeSchema,
    uuidSchema
} from './common.validator';

const quotationItemSchema = Joi.object({
    item_id: uuidSchema.optional(),
    item_name: nameField.required(),
    description: descriptionField.optional(),
    unit: Joi.string().trim().max(20).required(),
    quantity: quantityField.required().positive(),
});

export const createQuotationSchema = Joi.object({
    title: nameField.required(),
    description: descriptionField.optional(),
    request_date: Joi.date().iso().required(),
    due_date: Joi.date().iso().min(Joi.ref('request_date')).required(),
    items: Joi.array().items(quotationItemSchema).min(1).required(),
    suppliers: Joi.array().items(uuidSchema).min(1).required(),
});

export const updateQuotationSchema = Joi.object({
    status: Joi.string().valid('draft', 'sent', 'received', 'comparison', 'awarded', 'closed').optional(),
    selected_supplier_id: uuidSchema.optional(),
}).min(1);

export const quotationFilterSchema = paginationSchema.concat(searchSchema).concat(dateRangeSchema).keys({
    status: Joi.string().valid('draft', 'sent', 'received', 'comparison', 'awarded', 'closed').optional(),
    supplier_id: uuidSchema.optional(),
});

export default {
    createQuotationSchema,
    updateQuotationSchema,
    quotationFilterSchema,
};
