// Purchase validators - Joi schemas for purchase validation
import Joi from 'joi';
import {
    notesField,
    amountField,
    quantityField,
    percentageField,
    paginationSchema,
    searchSchema,
    dateRangeSchema,
    uuidSchema
} from './common.validator';

const purchaseItemSchema = Joi.object({
    item_id: uuidSchema.required(),
    quantity: quantityField.required().positive(),
    rate: amountField.required().positive(),
    tax_percentage: percentageField.optional(),
});

export const createPurchaseSchema = Joi.object({
    supplier_id: uuidSchema.required(),
    purchase_date: Joi.date().iso().required(),
    invoice_no: Joi.string().trim().max(50).optional(),
    invoice_date: Joi.date().iso().optional(),
    items: Joi.array().items(purchaseItemSchema).min(1).required(),
    discount: amountField.default(0),
    other_charges: amountField.default(0),
    paid_amount: amountField.default(0),
    payment_terms: Joi.string().trim().max(100).optional(),
    due_date: Joi.date().iso().optional(),
    remarks: notesField.optional(),
});

export const updatePurchaseSchema = Joi.object({
    status: Joi.string().valid('draft', 'completed', 'cancelled').optional(),
    remarks: notesField.optional().allow(''),
    received_by: Joi.string().trim().max(100).optional(),
}).min(1);

export const purchaseFilterSchema = paginationSchema.concat(searchSchema).concat(dateRangeSchema).keys({
    supplier_id: uuidSchema.optional(),
    status: Joi.string().valid('draft', 'completed', 'cancelled').optional(),
});

export default {
    createPurchaseSchema,
    updatePurchaseSchema,
    purchaseFilterSchema,
};
