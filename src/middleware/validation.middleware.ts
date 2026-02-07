// Validation middleware - validates request body, query, and params using Joi
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../utils/apiError';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Create validation middleware for a specific target and schema
 */
const createValidator = (schema: Joi.ObjectSchema, target: ValidationTarget) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const { error, value } = schema.validate(req[target], {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));

            return next(new ValidationError('Validation failed', errors));
        }

        // Replace with validated and sanitized values
        req[target] = value;
        next();
    };
};

/**
 * Validate request body
 */
export const validateBody = (schema: Joi.ObjectSchema) => {
    return createValidator(schema, 'body');
};

/**
 * Validate query parameters
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
    return createValidator(schema, 'query');
};

/**
 * Validate URL parameters
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
    return createValidator(schema, 'params');
};

export default {
    validateBody,
    validateQuery,
    validateParams,
};
