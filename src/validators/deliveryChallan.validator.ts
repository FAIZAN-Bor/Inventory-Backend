// Delivery Challan validators
import Joi from 'joi';
import {
    nameField,
    addressField,
    notesField,
    quantityField,
    paginationSchema,
    searchSchema,
    dateRangeSchema,
    uuidSchema
} from './common.validator';

const challanItemSchema = Joi.object({
    itemId: uuidSchema.optional(), // camelCase
    itemName: nameField.required(),
    poNumber: Joi.string().trim().max(50).optional().allow(''),
    demandNumber: Joi.string().trim().max(50).optional().allow(''),
    quantity: quantityField.required().positive(),
    unit: Joi.string().trim().max(20).required(),
});

export const createDeliveryChallanSchema = Joi.object({
    date: Joi.date().iso().required(),
    partyId: uuidSchema.optional(), // camelCase
    partyName: nameField.required(),
    partyAddress: addressField.optional().allow(''),
    courierName: Joi.string().trim().max(100).optional().allow(''),
    items: Joi.array().items(challanItemSchema).min(1).required(),
    remarks: notesField.optional().allow(''),
    dcNumber: Joi.string().optional(), // Ignored but allowed
    totalQty: Joi.number().optional() // Ignored/Recalculated but allowed
});

export const updateDeliveryChallanSchema = createDeliveryChallanSchema.keys({
    status: Joi.string().valid('pending', 'delivered', 'cancelled').optional(),
    deliveredDate: Joi.date().iso().optional(), // camelCase
    receivedBy: nameField.optional(),
});

export const deliveryChallanFilterSchema = paginationSchema.concat(searchSchema).concat(dateRangeSchema).keys({
    party_id: uuidSchema.optional(),
    status: Joi.string().valid('pending', 'delivered', 'cancelled').optional(),
});

export default {
    createDeliveryChallanSchema,
    updateDeliveryChallanSchema,
    deliveryChallanFilterSchema,
};
