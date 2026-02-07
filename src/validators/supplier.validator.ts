// Supplier validators
import Joi from 'joi';
import {
    nameField,
    emailField,
    phoneField,
    addressField,
    notesField,
    amountField,
    paginationSchema,
    searchSchema
} from './common.validator';

export const createSupplierSchema = Joi.object({
    name: nameField.required(),
    contact_person: nameField.optional(),
    phone: phoneField.optional(),
    email: emailField.optional(),
    address: addressField.optional(),
    city: Joi.string().trim().max(100).optional().allow(''),
    cnic: Joi.string().trim().max(20).optional().allow(''),
    ntn: Joi.string().trim().max(20).optional().allow(''),
    strn: Joi.string().trim().max(20).optional().allow(''),
    credit_limit: amountField.default(0),
    opening_balance: amountField.default(0),
    status: Joi.string().valid('active', 'inactive').default('active'),
    notes: notesField.optional(),
});

export const updateSupplierSchema = Joi.object({
    name: nameField.optional(),
    contact_person: nameField.optional().allow(''),
    phone: phoneField.optional().allow(''),
    email: emailField.optional().allow(''),
    address: addressField.optional().allow(''),
    city: Joi.string().trim().max(100).optional().allow(''),
    cnic: Joi.string().trim().max(20).optional().allow(''),
    ntn: Joi.string().trim().max(20).optional().allow(''),
    strn: Joi.string().trim().max(20).optional().allow(''),
    credit_limit: amountField.optional(),
    status: Joi.string().valid('active', 'inactive').optional(),
    notes: notesField.optional().allow(''),
}).min(1);

export const supplierFilterSchema = paginationSchema.concat(searchSchema).keys({
    status: Joi.string().valid('active', 'inactive').optional(),
    city: Joi.string().trim().max(100).optional(),
});

export const supplierPaymentSchema = Joi.object({
    amount: amountField.required().positive(),
    payment_method: Joi.string().valid('cash', 'bank', 'cheque').required(),
    cheque_no: Joi.string().trim().max(50).allow('').when('payment_method', {
        is: 'cheque',
        then: Joi.required(),
        otherwise: Joi.optional(),
    }),
    bank_name: Joi.string().trim().max(100).allow('').optional(),
    description: Joi.string().trim().max(255).allow('').optional(),
    date: Joi.date().iso().required(),
});

export const supplierTransactionParamSchema = Joi.object({
    id: Joi.string().required(),
    transactionId: Joi.string().required(),
});
