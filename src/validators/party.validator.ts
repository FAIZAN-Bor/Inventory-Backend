// Party validators - Joi schemas for party validation
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

export const createPartySchema = Joi.object({
    name: nameField.required(),
    type: Joi.string().valid('customer', 'supplier').default('customer'),
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

export const updatePartySchema = Joi.object({
    name: nameField.optional(),
    type: Joi.string().valid('customer', 'supplier').optional(),
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

export const partyFilterSchema = paginationSchema.concat(searchSchema).keys({
    type: Joi.string().valid('customer', 'supplier').optional(),
    status: Joi.string().valid('active', 'inactive').optional(),
    city: Joi.string().trim().max(100).optional(),
});

export const partyPaymentSchema = Joi.object({
    amount: amountField.required().positive(),
    payment_method: Joi.string().valid('cash', 'bank', 'cheque').required(),
    cheque_no: Joi.string().trim().max(50).when('payment_method', {
        is: 'cheque',
        then: Joi.required(),
        otherwise: Joi.optional(),
    }),
    bank_name: Joi.string().trim().max(100).optional(),
    description: Joi.string().trim().max(255).optional(),
    date: Joi.date().iso().required(),
});

export default {
    createPartySchema,
    updatePartySchema,
    partyFilterSchema,
    partyPaymentSchema,
};
