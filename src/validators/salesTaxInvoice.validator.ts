// Sales Tax Invoice validators
import Joi from 'joi';
import {
    nameField,
    addressField,
    amountField,
    quantityField,
    percentageField,
    paginationSchema,
    searchSchema,
    dateRangeSchema,
    uuidSchema
} from './common.validator';

const taxInvoiceItemSchema = Joi.object({
    item_name: nameField.required(),
    hs_code: Joi.string().trim().max(20).optional(),
    po_number: Joi.string().trim().max(50).optional(),
    demand_number: Joi.string().trim().max(50).optional(),
    weight_kgs: Joi.number().min(0).optional(),
    quantity: quantityField.required().positive(),
    unit: Joi.string().trim().max(20).required(),
    rate: amountField.required().positive(),
    st_percent: percentageField.required(),
});

export const createSalesTaxInvoiceSchema = Joi.object({
    party_id: uuidSchema.optional(),
    party_code: Joi.string().trim().max(20).optional(),
    party_name: nameField.required(),
    party_address: addressField.optional(),
    party_ntn: Joi.string().trim().max(20).optional(),
    party_gst: Joi.string().trim().max(20).optional(),
    voucher_no: Joi.string().trim().max(50).optional().allow('', null),
    date: Joi.date().iso().required(),
    items: Joi.array().items(taxInvoiceItemSchema).min(1).required(),
});

export const updateSalesTaxInvoiceSchema = Joi.object({
    status: Joi.string().valid('draft', 'finalized', 'cancelled').optional(),
}).min(1);

export const salesTaxInvoiceFilterSchema = paginationSchema.concat(searchSchema).concat(dateRangeSchema).keys({
    party_id: uuidSchema.optional(),
    status: Joi.string().valid('draft', 'finalized', 'cancelled').optional(),
});

export default {
    createSalesTaxInvoiceSchema,
    updateSalesTaxInvoiceSchema,
    salesTaxInvoiceFilterSchema,
};
