// Sales validators - Joi schemas for sales validation
import Joi from 'joi';
import {
    nameField,
    notesField,
    amountField,
    quantityField,
    percentageField,
    paginationSchema,
    searchSchema,
    dateRangeSchema,
    uuidSchema
} from './common.validator';

const saleItemSchema = Joi.object({
    item_id: uuidSchema.required(),
    quantity: quantityField.required().positive(),
    rate: amountField.required().positive(),
    discount_type: Joi.string().valid('percentage', 'flat').optional(),
    discount_value: amountField.optional(),
    tax_percentage: percentageField.optional(),
});

export const createSaleSchema = Joi.object({
    customer_type: Joi.string().valid('party', 'walk-in').required(),
    party_id: uuidSchema.when('customer_type', {
        is: 'party',
        then: Joi.required(),
        otherwise: Joi.optional(),
    }),
    customer_name: nameField.required(),
    dc_no: Joi.string().trim().max(50).optional(),
    dc_date: Joi.date().iso().optional(),
    term_of_sale: Joi.string().valid('cash', 'credit').required(),
    invoice_date: Joi.date().iso().required(),
    items: Joi.array().items(saleItemSchema).min(1).required(),
    tcs_charges: amountField.default(0),
    discount: amountField.default(0),
    cash_received: amountField.default(0),
    payment_option: Joi.string().valid('cash', 'partial', 'later').optional(),
    due_days: Joi.number().integer().min(0).optional(),
    remarks: notesField.optional(),
});

export const updateSaleSchema = Joi.object({
    status: Joi.string().valid('draft', 'completed', 'cancelled').optional(),
    remarks: notesField.optional().allow(''),
    verified_by: nameField.optional(),
}).min(1);

export const saleFilterSchema = paginationSchema.concat(searchSchema).concat(dateRangeSchema).keys({
    customer_type: Joi.string().valid('party', 'walk-in').optional(),
    party_id: uuidSchema.optional(),
    term_of_sale: Joi.string().valid('cash', 'credit').optional(),
    status: Joi.string().valid('draft', 'completed', 'cancelled').optional(),
});

export default {
    createSaleSchema,
    updateSaleSchema,
    saleFilterSchema,
};
