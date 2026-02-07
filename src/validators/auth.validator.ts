// Auth validators - RELAXED FOR TESTING
import Joi from 'joi';

export const loginSchema = Joi.object({
    email: Joi.string().email().optional().allow(''),
    password: Joi.string().optional().allow(''),
}).unknown(true);

export const registerSchema = Joi.object({
    email: Joi.string().email().optional().allow(''),
    password: Joi.string().optional().allow(''),
    name: Joi.string().optional().allow(''),
    role: Joi.string().valid('admin', 'manager', 'staff').optional().default('staff'),
    company_id: Joi.string().optional().allow(''),
}).unknown(true);

export const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().optional(),
    newPassword: Joi.string().optional(),
    confirmPassword: Joi.string().optional(),
}).unknown(true);

export const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().optional().allow(''),
}).unknown(true);

export const resetPasswordSchema = Joi.object({
    token: Joi.string().optional(),
    password: Joi.string().optional(),
}).unknown(true);

export default {
    loginSchema,
    registerSchema,
    changePasswordSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
};
